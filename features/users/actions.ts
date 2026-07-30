'use server';

import { UserService } from './service';
import { revalidatePath } from 'next/cache';
import { getSession, requirePermission } from '@/lib/auth';
import { auditAction } from '@/lib/audit';

export async function getUsers() {
    // Optional: Restrict viewing all users to Admin only? 
    // For now, let's keep it open or restrict if needed. 
    // Ideally user list management is admin only.
    await requirePermission('users.manage');
    return UserService.getAll();
}

export async function getRoles() {
    await requirePermission('users.manage');
    return UserService.getRoles();
}

export async function getLecturers() {
    // Public access - needed for registration dropdown (dosen pembimbing selection)
    // and other user-facing forms
    return UserService.getLecturers();
}

export async function createUser(data: {
    fullName: string;
    identifier: string;
    email: string;
    passwordHash: string;
    roleId: number;
    batch?: number;
    studyType?: 'Reguler' | 'Hybrid';
    programStudi?: string;
    dosenPembimbing?: string;
}) {
    return auditAction({ module: 'users', action: 'create', entityType: 'user', entityId: data.identifier, description: 'Admin membuat user', metadata: data }, async () => {
        await requirePermission('users.manage');
        await UserService.create(data);
        revalidatePath('/admin/governance');
    });
}

export async function updateUser(id: string, data: {
    fullName: string;
    identifier: string;
    email: string;
    roleId: number;
    passwordHash?: string;
    batch?: number;
    studyType?: 'Reguler' | 'Hybrid';
    programStudi?: string;
    dosenPembimbing?: string;
}) {
    return auditAction({ module: 'users', action: 'update', entityType: 'user', entityId: id, description: 'Admin memperbarui user', metadata: data }, async () => {
        await requirePermission('users.manage');
        await UserService.update(id, data);
        revalidatePath('/admin/governance');
    });
}

export async function deleteUser(id: string) {
    return auditAction({ module: 'users', action: 'delete', entityType: 'user', entityId: id, description: 'Admin menghapus user' }, async () => {
        await requirePermission('users.manage');
        await UserService.delete(id);
        revalidatePath('/admin/governance');
    });
}

export async function getPendingUsers() {
    return UserService.getPending();
}

export async function getRejectedUsers() {
    return UserService.getRejected();
}

export async function updateUserStatus(userId: string, status: 'Active' | 'Rejected') {
    return auditAction({ module: 'users', action: 'update_status', entityType: 'user', entityId: userId, description: `Admin mengubah status user menjadi ${status}`, metadata: { userId, status } }, async () => {
        await UserService.updateStatus(userId, status);
        revalidatePath('/admin/validations');
    });
}

export async function updateCustomRoleActivation(userId: string, enabled: boolean) {
    return auditAction({ module: 'users', action: 'update_custom_role_activation', entityType: 'user', entityId: userId, description: 'Admin mengubah status role custom user', metadata: { userId, enabled } }, async () => {
        await requirePermission('users.manage');
        await UserService.setCustomRoleEnabled(userId, enabled);
        revalidatePath('/admin/governance');
    });
}

export async function updateUserProfile(data: {
    fullName?: string;
    identifier?: string;
    currentPassword: string;
    newEmail?: string;
    newPassword?: string;
    confirmNewPassword?: string;
}) {
    return auditAction({ module: 'users', action: 'update_profile', entityType: 'user', description: 'User memperbarui profil', metadata: data }, async () => {
        const session = await getSession();
        if (!session?.user) {
            throw new Error('Unauthorized');
        }

        const userId = session.user.identifier;

        // Get current user and role
        const userRecord = await UserService.getById(userId);
        if (!userRecord) {
            throw new Error('User not found');
        }

        const { user, roleName } = userRecord;

        // Verify current password
        if (!user.passwordHash) {
            throw new Error('Akun ini belum memiliki password. Silakan daftar ulang.');
        }
        const passwordMatch = await UserService.verifyPassword(data.currentPassword, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Password saat ini salah');
        }

        const updateData: any = {};
        const isAdmin = roleName === 'Admin';

        // Handle Identity Update (Admin Only)
        if (isAdmin) {
            if (data.fullName && data.fullName !== user.fullName) {
                updateData.fullName = data.fullName;
            }

            if (data.identifier && data.identifier !== user.identifier) {
                const isUnique = await UserService.isIdentifierUnique(data.identifier, userId);
                if (!isUnique) {
                    throw new Error('NIM/NIDN sudah digunakan user lain');
                }
                updateData.identifier = data.identifier;
            }
        }

        // Handle Email Update
        if (data.newEmail && data.newEmail !== user.email) {
            const isUnique = await UserService.isEmailUnique(data.newEmail, userId);
            if (!isUnique) {
                throw new Error('Email sudah digunakan user lain');
            }
            updateData.email = data.newEmail;
        }

        // Handle Password Update
        if (data.newPassword) {
            if (data.newPassword !== data.confirmNewPassword) {
                throw new Error('Konfirmasi password baru tidak sesuai');
            }
            updateData.passwordHash = await UserService.hashPassword(data.newPassword);
        }

        if (Object.keys(updateData).length > 0) {
            await UserService.update(userId, {
                fullName: updateData.fullName || user.fullName,
                identifier: updateData.identifier || user.identifier,
                email: updateData.email || user.email,
                roleId: user.roleId,
                passwordHash: updateData.passwordHash,
            });
            revalidatePath('/admin/profile');
            revalidatePath('/student/profile');
            revalidatePath('/lecturer/profile');
        }
    });
}
