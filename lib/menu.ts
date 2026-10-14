import { hasAnyPermission, hasPermission } from '@/lib/auth';

// Role yang memakai portal /student (Mahasiswa + Asisten Praktikum)
export const STUDENT_PORTAL_ROLES = ['Mahasiswa', 'Asisten Praktikum'];

export function isStudentPortalRole(role?: string): boolean {
    return !!role && STUDENT_PORTAL_ROLES.includes(role);
}

export interface MenuItem {
    name: string;
    href: string;
    iconName: string;
    permission?: string;
    permissions?: string[];
    children?: MenuItem[];
}

export const ADMIN_PERMISSIONS = [
    'dashboard.admin',
    'users.manage',
    'inventory.manage',
    'loans.manage',
    'bookings.manage',
    'courses.manage',
    'practicum.manage',
    'publications.manage',
    'governance.manage',
    'hero.manage',
    'hits.manage',
    'download-center.manage',
];

export const STUDENT_MENU_ITEMS: MenuItem[] = [
    { name: 'Dashboard', href: '/student/dashboard', iconName: 'LayoutDashboard' },
    { name: 'Peminjaman Alat', href: '/student/items', iconName: 'Box' },
    { name: 'Booking Ruangan', href: '/student/rooms', iconName: 'CalendarDays' },
    {
        name: 'Akademik', href: '#', iconName: 'GraduationCap',
        children: [
            { name: 'Mata Kuliah', href: '/student/courses', iconName: 'GraduationCap' },
            { name: 'Modul Praktikum', href: '/student/practicum', iconName: 'BookOpen' },
            { name: 'Evaluasi Praktikum', href: '/student/evaluation', iconName: 'ClipboardList' },
        ],
    },
    { name: 'Publikasi', href: '/student/publications', iconName: 'FileText' },
    { name: 'Pusat Download', href: '/student/download-center', iconName: 'Download' },
];

export const LECTURER_MENU_ITEMS: MenuItem[] = [
    { name: 'Dashboard', href: '/lecturer/dashboard', iconName: 'LayoutDashboard' },
    { name: 'Peminjaman Alat', href: '/lecturer/items', iconName: 'Package' },
    { name: 'Booking Ruangan', href: '/lecturer/rooms', iconName: 'CalendarDays' },
    {
        name: 'Akademik', href: '#', iconName: 'GraduationCap',
        children: [
            { name: 'Mata Kuliah', href: '/lecturer/courses', iconName: 'Book' },
            { name: 'Modul Praktikum', href: '/lecturer/modules', iconName: 'FileText' },
            { name: 'Jadwal Praktikum', href: '/lecturer/schedules', iconName: 'Calendar' },
            { name: 'Evaluasi Praktikum', href: '/lecturer/manage/evaluation', iconName: 'ClipboardList' },
        ],
    },
    { name: 'Publikasi', href: '/lecturer/publications', iconName: 'BookOpen' },
    { name: 'Pusat Download', href: '/lecturer/download-center', iconName: 'Download' },
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', iconName: 'LayoutDashboard', permission: 'dashboard.admin' },
    { name: 'Manajemen Layanan', href: '/admin/validations', iconName: 'ClipboardList', permissions: ['loans.manage', 'bookings.manage', 'users.manage'] },
    { name: 'Manajemen Aset', href: '/admin/inventory', iconName: 'Box', permission: 'inventory.manage' },
    {
        name: 'Akademik', href: '#', iconName: 'GraduationCap', permissions: ['courses.manage', 'practicum.manage', 'evaluation.manage'],
        children: [
            { name: 'Kelola Mata Kuliah', href: '/admin/courses', iconName: 'GraduationCap', permission: 'courses.manage' },
            { name: 'Kelola Modul Praktikum', href: '/admin/practicum', iconName: 'BookOpen', permission: 'practicum.manage' },
            { name: 'Kelola Jadwal Praktikum', href: '/admin/scheduled-practicum', iconName: 'Calendar', permission: 'practicum.manage' },
            { name: 'Evaluasi Praktikum', href: '/admin/evaluation', iconName: 'ClipboardList', permission: 'evaluation.manage' },
        ],
    },
    { name: 'Jurnal Publikasi', href: '/admin/publications', iconName: 'BookOpen', permission: 'publications.manage' },
    { name: 'Pusat Download', href: '/admin/download-center', iconName: 'Download', permissions: ['download-center.manage', 'dashboard.admin'] },
    { name: 'Tata Kelola', href: '/admin/governance', iconName: 'FileText', permissions: ['governance.manage', 'users.manage', 'hero.manage', 'hits.manage'] },
];

export const ADMIN_ONLY_MENU_ITEMS: MenuItem[] = [
    { name: 'Dashboard Admin', href: '/manage/dashboard', iconName: 'LayoutDashboard', permission: 'dashboard.admin' },
    { name: 'Manajemen Layanan', href: '/manage/validations', iconName: 'ClipboardList', permissions: ['loans.manage', 'bookings.manage', 'users.manage'] },
    { name: 'Manajemen Aset', href: '/manage/inventory', iconName: 'Box', permission: 'inventory.manage' },
    { name: 'Jurnal Publikasi', href: '/manage/publications', iconName: 'BookOpen', permission: 'publications.manage' },
    { name: 'Tata Kelola', href: '/manage/governance', iconName: 'FileText', permissions: ['governance.manage', 'users.manage', 'hero.manage', 'hits.manage'] },
    { name: 'Kelola Pusat Download', href: '/manage/download-center', iconName: 'Download', permissions: ['download-center.manage', 'dashboard.admin'] },
];

export const ADMIN_SUBMENU_ITEMS: { parentName: string; children: MenuItem[] }[] = [
    {
        parentName: 'Akademik',
        children: [
            { name: 'Kelola Mata Kuliah', href: '/manage/courses', iconName: 'GraduationCap', permission: 'courses.manage' },
            { name: 'Kelola Modul Praktikum', href: '/manage/practicum', iconName: 'BookOpen', permission: 'practicum.manage' },
            { name: 'Kelola Jadwal Praktikum', href: '/manage/scheduled-practicum', iconName: 'Calendar', permission: 'practicum.manage' },
        ],
    },
];

export function filterMenuByPermissions(session: any, menuItems: MenuItem[]): MenuItem[] {
    return menuItems
        .map((item) => ({ ...item, children: item.children ? [...item.children] : undefined }))
        .filter((item) => {
            let hasAccess = true;

            if (item.permissions && Array.isArray(item.permissions)) {
                hasAccess = hasAnyPermission(session, item.permissions);
            } else if (item.permission) {
                hasAccess = hasPermission(session, item.permission);
            }

            if (!hasAccess) return false;

            if (item.children && Array.isArray(item.children)) {
                item.children = item.children.filter((child) => {
                    if (child.permissions) return hasAnyPermission(session, child.permissions);
                    if (child.permission) return hasPermission(session, child.permission);
                    return true;
                });
                return item.children.length > 0;
            }

            return true;
        });
}

export function hasCustomAdminPermission(session: any): boolean {
    return hasAnyPermission(session, ADMIN_PERMISSIONS);
}

function prefixMenuHrefs(menuItems: MenuItem[], basePath: string): MenuItem[] {
    return menuItems.map((item) => ({
        ...item,
        href: item.href === '#' ? '#' : `${basePath}${item.href}`,
        children: item.children ? prefixMenuHrefs(item.children, basePath) : undefined,
    }));
}

export function getMenuForUser(session: any, defaultMenu: MenuItem[], basePath: string): MenuItem[] {
    const menuItems: MenuItem[] = defaultMenu.map((item) => ({
        ...item,
        children: item.children ? [...item.children] : undefined,
    }));

    if (!hasCustomAdminPermission(session)) {
        return menuItems;
    }

    const prefixedSubmenus = ADMIN_SUBMENU_ITEMS.map((group) => ({
        parentName: group.parentName,
        children: prefixMenuHrefs(group.children, basePath),
    }));
    const prefixedAdminOnly = prefixMenuHrefs(ADMIN_ONLY_MENU_ITEMS, basePath);

    for (const adminGroup of prefixedSubmenus) {
        const existingParent = menuItems.find((m) => m.name === adminGroup.parentName);
        if (!existingParent) continue;

        const allowedChildren = adminGroup.children.filter((child) => {
            if (child.permissions) return hasAnyPermission(session, child.permissions);
            if (child.permission) return hasPermission(session, child.permission);
            return true;
        });

        if (!allowedChildren.length) continue;

        if (!existingParent.children) existingParent.children = [];
        for (const adminChild of allowedChildren) {
            const exists = existingParent.children.some((c) => c.href === adminChild.href);
            if (!exists) existingParent.children.push(adminChild);
        }
    }

    const filteredAdminOnly = filterMenuByPermissions(session, prefixedAdminOnly);
    for (const adminItem of filteredAdminOnly) {
        if (!menuItems.some((m) => m.name === adminItem.name)) {
            menuItems.push(adminItem);
        }
    }

    return menuItems;
}
