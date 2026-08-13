'use server';

import { PermissionService } from './service';
import { requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { auditAction } from '@/lib/audit';

export async function getAllPermissions() {
    await requirePermission('users.manage');
    return PermissionService.getAllPermissions();
}

export async function getUserPermissionOverrides(userId: string) {
    await requirePermission('users.manage');
    return PermissionService.getUserOverrides(userId);
}

export async function getEffectivePermissions(userId: string, roleId: number) {
    await requirePermission('users.manage');
    return PermissionService.getEffectivePermissions(userId, roleId);
}

export async function setUserPermission(userId: string, permissionCode: string, granted: boolean) {
    return auditAction({
        module: 'permissions',
        action: 'set_user_permission',
        entityType: 'user',
        entityId: userId,
        description: 'Admin mengubah permission user',
        metadata: { userId, permissionCode, granted },
    }, async () => {
        await requirePermission('users.manage');
        await PermissionService.setUserPermission(userId, permissionCode, granted);
        revalidatePath('/admin/validations');
    });
}

export async function removeUserPermission(userId: string, permissionCode: string) {
    return auditAction({
        module: 'permissions',
        action: 'remove_user_permission',
        entityType: 'user',
        entityId: userId,
        description: 'Admin menghapus override permission user',
        metadata: { userId, permissionCode },
    }, async () => {
        await requirePermission('users.manage');
        await PermissionService.removeUserPermission(userId, permissionCode);
        revalidatePath('/admin/validations');
    });
}

export async function updateUserPermissions(
    userId: string,
    permissionOverrides: { code: string; granted: boolean }[]
) {
    return auditAction({
        module: 'permissions',
        action: 'update_user_permissions',
        entityType: 'user',
        entityId: userId,
        description: 'Admin memperbarui kumpulan permission user',
        metadata: { userId, permissionOverrides },
    }, async () => {
        await requirePermission('users.manage');
        await PermissionService.setUserPermissions(userId, permissionOverrides);
        revalidatePath('/admin/validations');
    });
}

export async function getRolePermissionMap() {
    await requirePermission('users.manage');
    return PermissionService.getRolePermissionMap();
}
