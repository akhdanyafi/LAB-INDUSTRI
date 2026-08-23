'use server';

import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { writeActivityLog, getErrorMessage } from '@/lib/audit';

export async function register(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
    const fullName = formData.get('fullName') as string;
    const identifier = formData.get('identifier') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const actor = { identifier, fullName, email };

    if (password !== confirmPassword) {
        await writeActivityLog({
            module: 'users',
            action: 'register',
            status: 'failed',
            entityType: 'user',
            entityId: identifier,
            description: 'Registrasi gagal: konfirmasi password tidak cocok',
            metadata: { identifier, email, fullName },
            actor,
        });
        return { success: false, error: 'Password tidak cocok' };
    }

    const batch = formData.get('batch') ? parseInt(formData.get('batch') as string) : null;
    const studyType = formData.get('studyType') as 'Reguler' | 'Hybrid' | null;
    const programStudi = (formData.get('programStudi') as string) || 'Informatika';
    const dosenPembimbing = formData.get('dosenPembimbing') as string;

    if (!batch || !studyType) {
        await writeActivityLog({
            module: 'users',
            action: 'register',
            status: 'failed',
            entityType: 'user',
            entityId: identifier,
            description: 'Registrasi gagal: data angkatan atau tipe belajar belum lengkap',
            metadata: { identifier, email, fullName, batch, studyType },
            actor,
        });
        return { success: false, error: 'Mohon lengkapi data angkatan dan tipe belajar' };
    }

    if (!dosenPembimbing) {
        await writeActivityLog({
            module: 'users',
            action: 'register',
            status: 'failed',
            entityType: 'user',
            entityId: identifier,
            description: 'Registrasi gagal: dosen pembimbing belum dipilih',
            metadata: { identifier, email, fullName, batch, studyType },
            actor,
        });
        return { success: false, error: 'Mohon pilih dosen pembimbing' };
    }

    try {
        // Check if email is already used by another user
        const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmail.length > 0) {
            await writeActivityLog({
                module: 'users',
                action: 'register',
                status: 'failed',
                entityType: 'user',
                entityId: identifier,
                description: 'Registrasi gagal: email sudah terdaftar',
                metadata: { identifier, email },
                actor,
            });
            return { success: false, error: 'Email sudah terdaftar' };
        }

        // Check if there's a pre-registered user with matching fullName and identifier
        const preRegisteredUser = await db.select().from(users).where(
            and(
                eq(users.identifier, identifier),
                eq(users.status, 'Pre-registered')
            )
        ).limit(1);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        if (preRegisteredUser.length > 0) {
            // Verify fullName matches (case-insensitive)
            const matchName = preRegisteredUser[0].fullName.toLowerCase().trim() === fullName.toLowerCase().trim();

            if (matchName) {
                // Update pre-registered user to activate their account
                await db.update(users)
                    .set({
                        email,
                        passwordHash: hashedPassword,
                        status: 'Active', // Auto-activate!
                        batch: batch || preRegisteredUser[0].batch,
                        studyType: studyType || preRegisteredUser[0].studyType,
                        programStudi: programStudi || preRegisteredUser[0].programStudi,
                        dosenPembimbing: dosenPembimbing || preRegisteredUser[0].dosenPembimbing,
                    })
                    .where(eq(users.identifier, preRegisteredUser[0].identifier));

                await writeActivityLog({
                    module: 'users',
                    action: 'register',
                    entityType: 'user',
                    entityId: preRegisteredUser[0].identifier,
                    description: 'User pre-registered menyelesaikan registrasi',
                    metadata: { identifier, email, fullName, batch, studyType, programStudi, dosenPembimbing },
                    actor,
                });
                return { success: true };
            } else {
                await writeActivityLog({
                    module: 'users',
                    action: 'register',
                    status: 'failed',
                    entityType: 'user',
                    entityId: identifier,
                    description: 'Registrasi gagal: nama tidak cocok dengan data pre-registered',
                    metadata: { identifier, email, fullName },
                    actor,
                });
                return { success: false, error: 'Nama tidak cocok dengan data yang terdaftar. Hubungi admin jika ada kesalahan data.' };
            }
        }

        // Check if identifier is already used by an active/pending user
        const existingIdentifier = await db.select().from(users).where(eq(users.identifier, identifier)).limit(1);
        if (existingIdentifier.length > 0) {
            await writeActivityLog({
                module: 'users',
                action: 'register',
                status: 'failed',
                entityType: 'user',
                entityId: identifier,
                description: 'Registrasi gagal: NIM/NIDN sudah terdaftar',
                metadata: { identifier, email },
                actor,
            });
            return { success: false, error: 'NIM/NIDN sudah terdaftar' };
        }

        // Get 'Mahasiswa' role
        const studentRole = await db.select().from(roles).where(eq(roles.name, 'Mahasiswa')).limit(1);

        if (studentRole.length === 0) {
            await writeActivityLog({
                module: 'users',
                action: 'register',
                status: 'failed',
                entityType: 'user',
                entityId: identifier,
                description: 'Registrasi gagal: role Mahasiswa tidak ditemukan',
                metadata: { identifier, email },
                actor,
            });
            return { success: false, error: 'Role Mahasiswa tidak ditemukan. Hubungi administrator.' };
        }

        // Create new user (not pre-registered, so requires approval)
        await db.insert(users).values({
            fullName,
            identifier,
            email,
            passwordHash: hashedPassword,
            roleId: studentRole[0].id,
            status: 'Pending', // Requires admin approval
            batch,
            studyType,
            programStudi,
            dosenPembimbing
        });

        await writeActivityLog({
            module: 'users',
            action: 'register',
            entityType: 'user',
            entityId: identifier,
            description: 'User baru melakukan registrasi',
            metadata: { identifier, email, fullName, batch, studyType, programStudi, dosenPembimbing, status: 'Pending' },
            actor,
        });
        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        await writeActivityLog({
            module: 'users',
            action: 'register',
            status: 'failed',
            entityType: 'user',
            entityId: identifier,
            description: 'Registrasi gagal karena error sistem',
            metadata: { identifier, email, fullName, error: getErrorMessage(error) },
            actor,
        });
        return { success: false, error: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.' };
    }
}
