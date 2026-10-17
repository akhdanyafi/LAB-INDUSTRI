/**
 * User Service
 * Business logic for user management
 */

import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq, desc, and, ne, or } from 'drizzle-orm';

export interface CreateUserInput {
    fullName: string;
    identifier: string;
    email: string;
    passwordHash: string;
    roleId: number;
    batch?: number;
    studyType?: 'Reguler' | 'Hybrid';
    programStudi?: string;
    dosenPembimbing?: string;
}

export interface UpdateUserInput {
    fullName: string;
    identifier: string;
    email: string;
    roleId: number;
    passwordHash?: string;
    batch?: number;
    studyType?: 'Reguler' | 'Hybrid';
    programStudi?: string;
    dosenPembimbing?: string;
}

export class UserService {
    /**
     * Get all users with role information
     */
    static async getAll() {
        const allUsers = await db
            .select({
                identifier: users.identifier,
                fullName: users.fullName,
                email: users.email,
                roleId: users.roleId,
                roleName: roles.name,
                createdAt: users.createdAt,
                batch: users.batch,
                studyType: users.studyType,
                programStudi: users.programStudi,
                dosenPembimbing: users.dosenPembimbing,
                customRoleEnabled: users.customRoleEnabled,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .orderBy(desc(users.createdAt));

        return allUsers;
    }

    /**
     * Get all roles
     */
    static async getRoles() {
        return await db.select().from(roles);
    }

    /**
     * Get all lecturers (users with role "Dosen")
     */
    static async getLecturers() {
        const lecturers = await db
            .select({
                identifier: users.identifier,
                fullName: users.fullName,
            })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(eq(roles.name, 'Dosen'))
            .orderBy(users.fullName);

        return lecturers;
    }

    /**
     * Create a new user
     */
    static async create(data: CreateUserInput) {
        const existing = await db.query.users.findFirst({
            where: (users, { or, eq }) => or(
                eq(users.identifier, data.identifier),
                eq(users.email, data.email)
            )
        });

        if (existing) {
            throw new Error('NIM/NIDN atau Email sudah terdaftar');
        }

        const hashedPassword = await bcrypt.hash(data.passwordHash, 10);
        const userData = { ...data, passwordHash: hashedPassword };

        await db.insert(users).values(userData);
    }

    /**
     * Update an existing user
     */
    static async update(id: string, data: UpdateUserInput) {
        const existing = await db.query.users.findFirst({
            where: (users, { or, eq, and, ne }) => and(
                ne(users.identifier, id),
                or(
                    eq(users.identifier, data.identifier),
                    eq(users.email, data.email)
                )
            )
        });

        if (existing) {
            throw new Error('NIM/NIDN atau Email sudah digunakan user lain');
        }

        const updateData: any = { ...data };

        if (updateData.passwordHash) {
            updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10);
        } else {
            delete updateData.passwordHash;
        }

        await db.update(users).set(updateData).where(eq(users.identifier, id));
    }

    /**
     * Delete a user
     */
    static async delete(id: string) {
        await db.delete(users).where(eq(users.identifier, id));
    }

    /**
     * Get pending users
     */
    static async getPending() {
        return await db.select({
            identifier: users.identifier,
            fullName: users.fullName,
            email: users.email,
            createdAt: users.createdAt,
            role: roles.name,
        })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.status, 'Pending'));
    }

    /**
     * Get rejected users
     */
    static async getRejected() {
        return await db.select({
            identifier: users.identifier,
            fullName: users.fullName,
            email: users.email,
            createdAt: users.createdAt,
            role: roles.name,
        })
            .from(users)
            .innerJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.status, 'Rejected'))
            .orderBy(desc(users.createdAt));
    }

    /**
     * Update user status
     */
    static async updateStatus(userId: string, status: 'Active' | 'Rejected') {
        await db.update(users)
            .set({ status })
            .where(eq(users.identifier, userId));
    }

    static async setCustomRoleEnabled(userId: string, enabled: boolean) {
        await db.update(users)
            .set({ customRoleEnabled: enabled })
            .where(eq(users.identifier, userId));
    }

    /**
     * Get user by ID with role
     */
    static async getById(userId: string) {
        const usersWithRoles = await db
            .select({
                user: users,
                roleName: roles.name,
            })
            .from(users)
            .leftJoin(roles, eq(users.roleId, roles.id))
            .where(eq(users.identifier, userId))
            .limit(1);

        return usersWithRoles[0] || null;
    }

    /**
     * Biodata tambahan Asisten Praktikum (pas foto & rekening honor)
     */
    static async updateProfileExtras(userId: string, data: {
        photoPath?: string | null;
        bankName?: string | null;
        bankAccountNumber?: string | null;
        bankAccountName?: string | null;
    }) {
        const updateData: Partial<typeof users.$inferInsert> = {};
        for (const key of ['photoPath', 'bankName', 'bankAccountNumber', 'bankAccountName'] as const) {
            if (data[key] !== undefined) updateData[key] = data[key];
        }
        if (Object.keys(updateData).length === 0) return;
        await db.update(users).set(updateData).where(eq(users.identifier, userId));
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword: string, hashedPassword: string) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Hash password
     */
    static async hashPassword(password: string) {
        return bcrypt.hash(password, 10);
    }

    /**
     * Check if identifier is unique (excluding a specific user)
     */
    static async isIdentifierUnique(identifier: string, excludeUserId?: string) {
        const conditions = [eq(users.identifier, identifier)];
        if (excludeUserId) {
            conditions.push(ne(users.identifier, excludeUserId));
        }

        const existing = await db.query.users.findFirst({
            where: and(...conditions)
        });

        return !existing;
    }

    /**
     * Check if email is unique (excluding a specific user)
     */
    static async isEmailUnique(email: string, excludeUserId?: string) {
        const conditions = [eq(users.email, email)];
        if (excludeUserId) {
            conditions.push(ne(users.identifier, excludeUserId));
        }

        const existing = await db.query.users.findFirst({
            where: and(...conditions)
        });

        return !existing;
    }
}
