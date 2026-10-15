import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileForm from '@/features/users/components/ProfileForm';
import AsprakProfileExtras from '@/features/users/components/AsprakProfileExtras';
import { isStudentPortalRole } from '@/lib/menu';
import { UserService } from '@/features/users/service';
import { getMyPracticumReports } from '@/features/practicum-reports/actions';

export default async function StudentProfilePage() {
    const session = await getSession();

    if (!session || !isStudentPortalRole(session.user.role)) {
        redirect('/login');
    }

    // Biodata tambahan + daftar berita acara untuk Asisten Praktikum
    const isAsprak = session.user.role === 'Asisten Praktikum';
    const [record, reports] = isAsprak
        ? await Promise.all([UserService.getById(session.user.identifier), getMyPracticumReports()])
        : [null, []];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0F4C81]">Profil Saya</h1>
                <p className="text-gray-600">Kelola informasi data diri dan keamanan akun.</p>
            </div>

            <ProfileForm
                user={{
                    fullName: session.user.fullName,
                    identifier: session.user.identifier,
                    email: session.user.email,
                    roleName: session.user.role,
                    batch: session.user.batch,
                    studyType: session.user.studyType
                }}
            />

            {isAsprak && (
                <AsprakProfileExtras
                    data={{
                        photoPath: record?.user.photoPath ?? null,
                        bankName: record?.user.bankName ?? null,
                        bankAccountNumber: record?.user.bankAccountNumber ?? null,
                        bankAccountName: record?.user.bankAccountName ?? null,
                    }}
                    reports={reports as React.ComponentProps<typeof AsprakProfileExtras>['reports']}
                />
            )}
        </div>
    );
}
