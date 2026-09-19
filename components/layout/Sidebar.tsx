'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SidebarLink from './SidebarLink';
import SidebarSubmenu from './SidebarSubmenu';
import LogoutButton from './LogoutButton';
import {
    Menu,
    X,
    LayoutDashboard,
    Box,
    Package,
    ClipboardList,
    FileText,
    CalendarDays,
    Calendar,
    GraduationCap,
    Image as ImageIcon,
    BookOpen,
    Key,
    Users,
    Settings,
    Download,
    Megaphone,
    Shield,
    type LucideIcon
} from 'lucide-react';

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Box,
    Package,
    ClipboardList,
    FileText,
    CalendarDays,
    Calendar,
    GraduationCap,
    ImageIcon,
    BookOpen,
    Key,
    Users,
    Settings,
    Download,
    Megaphone,
    Shield,
};

interface MenuItem {
    name: string;
    href: string;
    iconName: string; // Changed from icon to iconName
    children?: MenuItem[];
}

interface SidebarProps {
    subtitle: string;
    menuItems: MenuItem[];
    user: {
        fullName: string;
        secondaryText: string;
        initial: string;
    };
    currentPath?: string;
    profileHref?: string;
}

const SIDEBAR_WIDTH_KEY = 'lab-industri-sidebar-width';
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 420;
const DEFAULT_SIDEBAR_WIDTH = 256; // 16rem (w-64)

export default function Sidebar({ subtitle, menuItems, user, profileHref }: SidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isResizingRef = useRef(false);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // Restore saved sidebar width on mount
    useEffect(() => {
        const saved = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
        const parsed = saved ? parseInt(saved, 10) : NaN;
        const initial = !isNaN(parsed)
            ? Math.min(Math.max(parsed, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH)
            : DEFAULT_SIDEBAR_WIDTH;
        document.documentElement.style.setProperty('--sidebar-width', `${initial}px`);
    }, []);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizingRef.current) return;
            const next = Math.min(Math.max(moveEvent.clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
            document.documentElement.style.setProperty('--sidebar-width', `${next}px`);
        };

        const onMouseUp = () => {
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const finalWidth = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width');
            if (finalWidth) window.localStorage.setItem(SIDEBAR_WIDTH_KEY, parseInt(finalWidth, 10).toString());
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    const handleResizeReset = useCallback(() => {
        document.documentElement.style.setProperty('--sidebar-width', `${DEFAULT_SIDEBAR_WIDTH}px`);
        window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(DEFAULT_SIDEBAR_WIDTH));
    }, []);

    const getIcon = (iconName: string, className: string = "w-5 h-5") => {
        const IconComponent = iconMap[iconName];
        if (IconComponent) {
            return <IconComponent className={className} />;
        }
        return <Box className={className} />; // Fallback icon
    };

    return (
        <>
            {/* Mobile Header/Navbar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <Image
                            src="/fst-icon.png"
                            alt="Logo Lab Informatika"
                            width={40}
                            height={40}
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[#0F4C81] leading-tight">Lab Teknik Industri</h1>
                        <p className="text-xs font-medium text-[#6B7280]">{subtitle}</p>
                    </div>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-gray-600 hover:text-[#0F4C81] hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar - Desktop: fixed left, Mobile: slide-in from left */}
            <aside
                className={`
                    fixed h-full z-50 flex flex-col font-sans bg-white border-r border-gray-200
                    w-72 lg:w-[var(--sidebar-width)]
                    transition-transform duration-300 ease-in-out
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* Resize Handle (Desktop only) */}
                <div
                    onMouseDown={handleResizeStart}
                    onDoubleClick={handleResizeReset}
                    className="hidden lg:block absolute top-0 right-0 z-10 h-full w-2 cursor-col-resize select-none group"
                    title="Tarik untuk mengubah ukuran sidebar (klik dua kali untuk reset)"
                >
                    <div className="mx-auto h-full w-px bg-transparent transition-colors group-hover:bg-[#0F4C81]/40 group-active:bg-[#0F4C81]/60" />
                </div>

                {/* --- HEADER: LOGO & SUBTITLE --- */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-sm">
                        <Image
                            src="/fst-icon.png"
                            alt="Logo Lab Informatika"
                            width={40}
                            height={40}
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <div className="overflow-hidden">
                        <h1
                            className="font-bold text-[#0F4C81] leading-tight"
                            style={{ fontSize: 'clamp(1rem, calc(var(--sidebar-width) / 14), 1.875rem)' }}
                        >
                            Lab Teknik Industri
                        </h1>
                        <p className="text-xs font-medium text-[#6B7280] truncate mt-0.5">
                            {subtitle}
                        </p>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={closeMobileMenu}
                        className="lg:hidden ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* --- NAVIGATION MENU --- */}
                <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        item.children ? (
                            <SidebarSubmenu
                                key={item.name}
                                name={item.name}
                                icon={getIcon(item.iconName)}
                                items={item.children.map(child => ({
                                    name: child.name,
                                    href: child.href,
                                    icon: getIcon(child.iconName, "w-4 h-4")
                                }))}
                            />
                        ) : (
                            <div key={item.href} onClick={closeMobileMenu}>
                                <SidebarLink href={item.href}>
                                    {getIcon(item.iconName)}
                                    <span>{item.name}</span>
                                </SidebarLink>
                            </div>
                        )
                    ))}
                </nav>

                {/* --- FOOTER: USER & LOGOUT --- */}
                <div className="p-4 border-t border-gray-100 bg-[#F3F4F6]/50">
                    {profileHref ? (
                        <Link href={profileHref} className="block group" onClick={closeMobileMenu}>
                            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white border border-gray-100 shadow-sm group-hover:border-[#0F4C81]/30 transition-colors cursor-pointer">
                                <div
                                    className="w-9 h-9 rounded-full bg-[#0F4C81]/10 flex items-center justify-center text-[#0F4C81] font-bold text-sm shrink-0"
                                    suppressHydrationWarning
                                >
                                    {user.initial}
                                </div>
                                <div className="overflow-hidden min-w-0">
                                    <p className="text-sm font-semibold text-[#1F2937] truncate">
                                        {user.fullName}
                                    </p>
                                    <p className="text-xs text-[#6B7280] truncate">
                                        {user.secondaryText}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                            <div
                                className="w-9 h-9 rounded-full bg-[#0F4C81]/10 flex items-center justify-center text-[#0F4C81] font-bold text-sm shrink-0"
                                suppressHydrationWarning
                            >
                                {user.initial}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="text-sm font-semibold text-[#1F2937] truncate">
                                    {user.fullName}
                                </p>
                                <p className="text-xs text-[#6B7280] truncate">
                                    {user.secondaryText}
                                </p>
                            </div>
                        </div>
                    )}
                    <LogoutButton />
                </div>
            </aside>
        </>
    );
}
