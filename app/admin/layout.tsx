import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import SessionRefresher from '@/components/providers/SessionRefresher';
import { ADMIN_MENU_ITEMS, filterMenuByPermissions } from '@/lib/menu';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || session.user.role !== 'Admin') {
        redirect('/login');
    }
    const menuItems = filterMenuByPermissions(session, ADMIN_MENU_ITEMS);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                subtitle="Admin Panel"
                menuItems={menuItems}
                profileHref="/admin/profile"
                user={{
                    fullName: session.user.fullName,
                    secondaryText: session.user.email,
                    initial: session.user.fullName.charAt(0)
                }}
            />
            <main className="flex-1 lg:ml-[var(--sidebar-width)] pt-20 p-4 lg:p-8 overflow-x-hidden">
                <SessionRefresher />
                {children}
            </main>
        </div>
    );
}
