'use server';

import { DashboardService } from './service';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { auditAction } from '@/lib/audit';

export async function getAdminStats() {
    await requirePermission('dashboard.admin');
    return DashboardService.getAdminStats();
}

export async function getStudentDashboard(userId: string) {
    return DashboardService.getStudentDashboard(userId);
}

export async function getLecturerDashboard(userId: string, showLPJ: boolean = false) {
    return DashboardService.getLecturerDashboard(userId, showLPJ);
}

export async function markLoanNotificationRead(loanId: number) {
    return auditAction({
        module: 'dashboard',
        action: 'mark_loan_notification_read',
        entityType: 'item_loan',
        entityId: loanId,
        description: 'Admin menandai notifikasi peminjaman sudah dibaca',
    }, async () => {
        await requirePermission('dashboard.admin');
        await DashboardService.markLoanNotificationRead(loanId);
        revalidatePath('/admin/dashboard');
    });
}

export async function markBookingNotificationRead(bookingId: number) {
    return auditAction({
        module: 'dashboard',
        action: 'mark_booking_notification_read',
        entityType: 'room_booking',
        entityId: bookingId,
        description: 'Admin menandai notifikasi booking sudah dibaca',
    }, async () => {
        await requirePermission('dashboard.admin');
        await DashboardService.markBookingNotificationRead(bookingId);
        revalidatePath('/admin/dashboard');
    });
}

export async function markAllNotificationsRead() {
    return auditAction({
        module: 'dashboard',
        action: 'mark_all_notifications_read',
        description: 'Admin menandai semua notifikasi sudah dibaca',
    }, async () => {
        await requirePermission('dashboard.admin');
        await DashboardService.markAllNotificationsRead();
        revalidatePath('/admin/dashboard');
    });
}

// Analytics actions - admin only
export async function getLoanTrendData() {
    await requirePermission('dashboard.admin');
    return DashboardService.getLoanTrendData();
}

export async function getBookingsByRoom() {
    await requirePermission('dashboard.admin');
    return DashboardService.getBookingsByRoom();
}

export async function getLoansByCategory() {
    await requirePermission('dashboard.admin');
    return DashboardService.getLoansByCategory();
}

export async function getIdleItemsCount() {
    await requirePermission('dashboard.admin');
    return DashboardService.getIdleItemsCount();
}

export async function getPendingCounts() {
    await requirePermission('dashboard.admin');
    return DashboardService.getPendingCounts();
}

export async function getRecentBookings(days?: number) {
    await requirePermission('dashboard.admin');
    return DashboardService.getRecentBookings(days);
}

export async function getSmartAnalyticsData() {
    await requirePermission('dashboard.admin');
    return DashboardService.getSmartAnalyticsData();
}
