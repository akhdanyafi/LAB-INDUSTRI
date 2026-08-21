import { getSession, hasPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import SessionRefresher from '@/components/providers/SessionRefresher';
import { LECTURER_MENU_ITEMS, getMenuForUser } from '@/lib/menu';

export default async function LecturerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session || !hasPermission(session, 'dashboard.lecturer')) {
        redirect('/login');
    }
    const menuItems = getMenuForUser(session, LECTURER_MENU_ITEMS, '/lecturer');

    return (
        <div className="flex min-h-screen">
            <Sidebar
                subtitle="Lecturer Portal"
                menuItems={menuItems}
                profileHref="/lecturer/profile"
                user={{
                    fullName: session.user.fullName,
                    secondaryText: session.user.identifier,
                    initial: session.user.fullName.charAt(0)
                }}
            />
            <main className="flex-1 lg:ml-[var(--sidebar-width)] pt-20 p-4 lg:p-8">
                <SessionRefresher />
                {children}
            </main>
        </div>
    );
}
