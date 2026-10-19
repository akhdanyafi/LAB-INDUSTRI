import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import SessionRefresher from '@/components/providers/SessionRefresher';
import { STUDENT_MENU_ITEMS, getMenuForUser, isStudentPortalRole } from '@/lib/menu';

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Asisten Praktikum memakai portal mahasiswa + akses kelola praktikum (permission practicum.manage)
    if (!session || !isStudentPortalRole(session.user.role)) {
        redirect('/login');
    }
    const menuItems = getMenuForUser(session, STUDENT_MENU_ITEMS, '/student');

    return (
        <div className="flex min-h-screen">
            <Sidebar
                subtitle="Student Portal"
                menuItems={menuItems}
                profileHref="/student/profile"
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
