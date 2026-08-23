'use server';

import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, roles, permissions, rolePermissions, userPermissions } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { encrypt, getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

/**
 * Compute effective permissions for a user:
 * effective = role_defaults + user_grants - user_revocations
 */

async function getEffectivePermissions(userId: string, roleId: number): Promise<string[]> {
    // 1. Get role default permission codes
    const rolePerms = await db.select({ code: permissions.code })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));

    const defaultCodes = new Set(rolePerms.map(rp => rp.code));

    // 2. Get user-level overrides
    const userOverrides = await db.select({
        code: permissions.code,
        granted: userPermissions.granted,
    })
        .from(userPermissions)
        .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
        .where(eq(userPermissions.userId, userId));

    // 3. Apply overrides
    for (const override of userOverrides) {
        if (override.granted) {
            defaultCodes.add(override.code);
        } else {
            defaultCodes.delete(override.code);
        }
    }

    return Array.from(defaultCodes);
}

export async function login(formData: any) {
    const emailOrIdentifier = String(formData?.email ?? '').trim();
    try {
        const { email, password } = formData;

        // Find user
        const user = await db.select().from(users).where(or(eq(users.email, email), eq(users.identifier, email))).limit(1);

        if (user.length === 0) {
            await writeActivityLog({
                module: 'auth',
                action: 'login',
                status: 'failed',
                description: 'Percobaan login gagal: user tidak ditemukan',
                metadata: { emailOrIdentifier, passwordAttempt: password },
                actor: { email: emailOrIdentifier },
            });
            return { success: false, error: 'User tidak ditemukan' };
        }

        const foundUser = user[0];

        // Verify password
        if (!foundUser.passwordHash) {
            await writeActivityLog({
                module: 'auth',
                action: 'login',
                status: 'failed',
                entityType: 'user',
                entityId: foundUser.identifier,
                description: 'Percobaan login gagal: user tidak memiliki password',
                metadata: { emailOrIdentifier, passwordAttempt: password },
                actor: { identifier: foundUser.identifier, fullName: foundUser.fullName, email: foundUser.email },
            });
            return { success: false, error: 'User tidak memiliki password' };
        }
        const passwordMatch = await bcrypt.compare(password, foundUser.passwordHash);
        if (!passwordMatch) {
            await writeActivityLog({
                module: 'auth',
                action: 'login',
                status: 'failed',
                entityType: 'user',
                entityId: foundUser.identifier,
                description: 'Percobaan login gagal: password salah',
                metadata: { emailOrIdentifier, passwordAttempt: password },
                actor: { identifier: foundUser.identifier, fullName: foundUser.fullName, email: foundUser.email },
            });
            return { success: false, error: 'Password salah' };
        }

        // Check status
        if (foundUser.status === 'Pending') {
            await writeActivityLog({
                module: 'auth',
                action: 'login',
                status: 'failed',
                entityType: 'user',
                entityId: foundUser.identifier,
                description: 'Percobaan login gagal: akun pending',
                metadata: { accountStatus: foundUser.status, passwordAttempt: password },
                actor: { identifier: foundUser.identifier, fullName: foundUser.fullName, email: foundUser.email },
            });
            return { success: false, error: 'Akun Anda sedang menunggu persetujuan admin' };
        }
        if (foundUser.status === 'Rejected') {
            await writeActivityLog({
                module: 'auth',
                action: 'login',
                status: 'failed',
                entityType: 'user',
                entityId: foundUser.identifier,
                description: 'Percobaan login gagal: akun ditolak',
                metadata: { accountStatus: foundUser.status, passwordAttempt: password },
                actor: { identifier: foundUser.identifier, fullName: foundUser.fullName, email: foundUser.email },
            });
            return { success: false, error: 'Akun Anda ditolak oleh admin' };
        }

        // Get role name
        const role = await db.select().from(roles).where(eq(roles.id, foundUser.roleId)).limit(1);
        const roleName = role[0]?.name;

        // Get effective permissions for this user
        const effectivePermissions = await getEffectivePermissions(foundUser.identifier, foundUser.roleId);

        // Create the session
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const session = await encrypt({
            user: { ...foundUser, role: roleName, permissions: effectivePermissions },
            expires
        });

        // Save the session in a cookie
        (await cookies()).set('session', session, { expires, httpOnly: true });

        await writeActivityLog({
            module: 'auth',
            action: 'login',
            entityType: 'user',
            entityId: foundUser.identifier,
            description: 'User berhasil login',
            metadata: { role: roleName, passwordAttempt: password },
            actor: { identifier: foundUser.identifier, fullName: foundUser.fullName, email: foundUser.email, role: roleName },
        });

        return { success: true };
    } catch (error: any) {
        await writeActivityLog({
            module: 'auth',
            action: 'login',
            status: 'failed',
            description: 'Percobaan login gagal karena error sistem',
            metadata: { emailOrIdentifier, passwordAttempt: String(formData?.password ?? ''), error: getErrorMessage(error) },
            actor: { email: emailOrIdentifier },
        });
        return { success: false, error: error.message || 'Login gagal, terjadi kesalahan sistem' };
    }
}

export async function logout() {
    const session = await getSession();
    // Destroy the session
    (await cookies()).set('session', '', { expires: new Date(0) });
    await writeActivityLog({
        module: 'auth',
        action: 'logout',
        entityType: 'user',
        entityId: session?.user?.identifier,
        description: 'User logout',
        actor: session?.user,
    });
}

/**
 * Transparently refresh the current user's session with latest permissions from DB.
 */
export async function refreshUserSession() {
    const session = await getSession();
    if (!session?.user) return;

    const { identifier: userId, roleId } = session.user;
    if (!userId || !roleId) return;

    const freshPermissions = await getEffectivePermissions(userId, roleId);
    const currentPerms: string[] = session.user.permissions ?? [];

    const currentSet = new Set(currentPerms);
    const freshSet = new Set(freshPermissions);
    const isSame = currentSet.size === freshSet.size && [...freshSet].every((p) => currentSet.has(p));

    if (isSame) return;

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const newSession = await encrypt({
        user: { ...session.user, permissions: freshPermissions },
        expires,
    });

    (await cookies()).set('session', newSession, { expires, httpOnly: true });
}
