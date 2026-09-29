import { getGovernanceDocs } from '@/features/governance/actions';
import { getUsers, getRoles, getLecturers } from '@/features/users/actions';
import { getHeroPhotos } from '@/features/hero-photos/actions';
import { getHitsInfos, getHitsCategories } from '@/features/hits/actions';
import { getAllPermissions, getRolePermissionMap } from '@/features/permissions/actions';
import GovernanceManager from '@/features/governance/components/GovernanceManager';
import { getSession, hasPermission, hasAnyPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LecturerManageGovernancePage() {
    const session = await getSession();

    const canManageGovernance = hasPermission(session, 'governance.manage');
    const canManageUsers = hasPermission(session, 'users.manage');
    const canManageHero = hasPermission(session, 'hero.manage');
    const canManageHits = hasPermission(session, 'hits.manage');

    if (!session || !hasAnyPermission(session, ['governance.manage', 'users.manage', 'hero.manage', 'hits.manage'])) {
        redirect('/lecturer/dashboard');
    }

    const [sops, lpjs, templateSurats, templateBeritaAcaras, users, roles, lecturers, heroPhotos, allPermissions, rolePermissionMap, hitsInfos, hitsCategories] = await Promise.all([
        canManageGovernance ? getGovernanceDocs('SOP') : Promise.resolve([]),
        canManageGovernance ? getGovernanceDocs('LPJ Bulanan') : Promise.resolve([]),
        canManageGovernance ? getGovernanceDocs('Template Surat') : Promise.resolve([]),
        canManageGovernance ? getGovernanceDocs('Template Berita Acara') : Promise.resolve([]),
        canManageUsers ? getUsers() : Promise.resolve([]),
        canManageUsers ? getRoles() : Promise.resolve([]),
        getLecturers(),
        canManageHero ? getHeroPhotos() : Promise.resolve([]),
        canManageUsers ? getAllPermissions() : Promise.resolve([]),
        canManageUsers ? getRolePermissionMap() : Promise.resolve({}),
        canManageHits ? getHitsInfos() : Promise.resolve([]),
        canManageHits ? getHitsCategories() : Promise.resolve([]),
    ]);

    return (
        <GovernanceManager
            sops={sops}
            lpjs={lpjs}
            templateSurats={templateSurats}
            templateBeritaAcaras={templateBeritaAcaras}
            users={users}
            roles={roles}
            lecturers={lecturers}
            heroPhotos={heroPhotos}
            adminId={session.user.identifier}
            allPermissions={allPermissions}
            rolePermissionMap={rolePermissionMap}
            permissions={{ canManageGovernance, canManageUsers, canManageHero, canManageHits }}
            hitsInfos={hitsInfos as any}
            hitsCategories={hitsCategories as any}
        />
    );
}
