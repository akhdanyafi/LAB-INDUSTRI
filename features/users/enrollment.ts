'use server';

import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { writeActivityLog } from '@/lib/audit';

export interface BulkEnrollmentInput {
    fullName: string;
    identifier: string;
    roleId: number;
    batch?: number;
    studyType?: 'Reguler' | 'Hybrid';
    programStudi?: string;
    dosenPembimbing?: string;
}

/**
 * Bulk enroll users from CSV/Excel data
 * Creates users with 'Pre-registered' status (no account yet)
 */
export async function bulkEnrollUsers(data: BulkEnrollmentInput[]) {
    const results = {
        success: 0,
        failed: 0,
        errors: [] as { identifier: string; error: string }[],
    };

    for (const user of data) {
        try {
            // Check if user with same identifier already exists
            const existing = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.identifier, user.identifier)
            });

            if (existing) {
                results.failed++;
                results.errors.push({
                    identifier: user.identifier,
                    error: 'User dengan NIM/NIDN ini sudah ada'
                });
                await writeActivityLog({
                    module: 'users',
                    action: 'bulk_enroll',
                    status: 'failed',
                    entityType: 'user',
                    entityId: user.identifier,
                    description: 'Bulk enroll gagal: user sudah ada',
                    metadata: { identifier: user.identifier, fullName: user.fullName },
                });
                continue;
            }

            // Create pre-registered user
            await db.insert(users).values({
                fullName: user.fullName,
                identifier: user.identifier,
                roleId: user.roleId,
                batch: user.batch,
                studyType: user.studyType || 'Reguler',
                programStudi: user.programStudi || 'Informatika',
                dosenPembimbing: user.dosenPembimbing,
                status: 'Pre-registered',
                // email and passwordHash are null for pre-registered users
            });

            results.success++;
            await writeActivityLog({
                module: 'users',
                action: 'bulk_enroll',
                entityType: 'user',
                entityId: user.identifier,
                description: 'User berhasil di-enroll (pre-registered)',
                metadata: { identifier: user.identifier, fullName: user.fullName, roleId: user.roleId, batch: user.batch },
            });
        } catch (error: any) {
            results.failed++;
            results.errors.push({
                identifier: user.identifier,
                error: error.message || 'Unknown error'
            });
            await writeActivityLog({
                module: 'users',
                action: 'bulk_enroll',
                status: 'failed',
                entityType: 'user',
                entityId: user.identifier,
                description: 'Bulk enroll gagal karena error sistem',
                metadata: { identifier: user.identifier, fullName: user.fullName, error: error.message },
            });
        }
    }

    revalidatePath('/admin/governance');
    await writeActivityLog({
        module: 'users',
        action: 'bulk_enroll_summary',
        description: `Bulk enroll selesai: ${results.success} berhasil, ${results.failed} gagal`,
        metadata: { total: data.length, success: results.success, failed: results.failed, errors: results.errors },
    });
    return results;
}

/**
 * Get role ID by name
 */
export async function getRoleByName(name: string) {
    const role = await db.query.roles.findFirst({
        where: (roles, { eq }) => eq(roles.name, name)
    });
    return role;
}

/**
 * Check if identifier exists in pre-registered users
 * Returns user data if found, null otherwise
 */
export async function checkPreRegisteredUser(identifier: string) {
    if (!identifier || identifier.length < 3) return null;

    const user = await db.query.users.findFirst({
        where: (users, { and, eq }) => and(
            eq(users.identifier, identifier),
            eq(users.status, 'Pre-registered')
        )
    });

    if (!user) return null;

    return {
        fullName: user.fullName,
        batch: user.batch,
        studyType: user.studyType,
        programStudi: user.programStudi,
        dosenPembimbing: user.dosenPembimbing,
    };
}

/**
 * Parse CSV string to enrollment data
 * Expected format: fullName,identifier,batch,studyType,programStudi,dosenPembimbing
 * Values containing commas should be wrapped in double quotes, e.g., "Dewi Lestari, S.T, M.Kom"
 */
export async function parseCSV(csvString: string, roleId: number): Promise<BulkEnrollmentInput[]> {
    const lines = csvString.trim().split('\n');
    const data: BulkEnrollmentInput[] = [];

    // Helper function to parse CSV line respecting quoted values
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim()); // Push last value
        return result;
    };

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = parseCSVLine(line);
        if (parts.length < 2) continue;

        const [fullName, identifier, batch, studyType, programStudi, dosenPembimbing] = parts;

        data.push({
            fullName,
            identifier,
            roleId,
            batch: batch ? parseInt(batch) : undefined,
            studyType: studyType as 'Reguler' | 'Hybrid' || 'Reguler',
            programStudi: programStudi || 'Informatika',
            dosenPembimbing: dosenPembimbing || undefined,
        });
    }

    return data;
}
