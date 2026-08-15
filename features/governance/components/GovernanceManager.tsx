'use client';

import { useState, useEffect } from 'react';
import { FileText, Users, FileCheck, Image as ImageIcon, FileSignature, Flame } from 'lucide-react';
import DocumentList from './DocumentList';
import { deleteGovernanceDoc } from '@/features/governance/actions';
import GovernanceUploadForm from './GovernanceUploadForm';
import UserList from './UserList';
import UserForm from './UserForm';
import BulkEnrollment from './BulkEnrollment';
import DataExport from './DataExport';
import HeroPhotoManager from '@/app/admin/hero-photos/_components/HeroPhotoManager';
import HitsManager, { HitsInfoAdminItem } from '@/features/hits/components/HitsManager';
import { HitsCategory } from '@/features/hits/components/HitsCategoryManager';

interface HeroPhoto {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    link: string | null;
    focalX: number;
    focalY: number;
}

interface PermissionFlags {
    canManageGovernance: boolean;
    canManageUsers: boolean;
    canManageHero: boolean;
    canManageHits?: boolean;
}

interface GovernanceManagerProps {
    sops: any[];
    lpjs: any[];
    templateSurats: any[];
    users: any[];
    roles: any[];
    lecturers: { identifier: string; fullName: string }[];
    heroPhotos: HeroPhoto[];
    adminId: string;
    allPermissions?: any[];
    rolePermissionMap?: Record<number, string[]>;
    permissions: PermissionFlags;
    hitsInfos?: HitsInfoAdminItem[];
    hitsCategories?: HitsCategory[];
}

type TabType = 'sop' | 'lpj' | 'template-surat' | 'users' | 'hero' | 'hits';

export default function GovernanceManager({
    sops, lpjs, templateSurats, users, roles, lecturers, heroPhotos,
    adminId, allPermissions, rolePermissionMap, permissions,
    hitsInfos = [], hitsCategories = [],
}: GovernanceManagerProps) {
    const availableTabs: TabType[] = [];
    if (permissions.canManageGovernance) availableTabs.push('sop', 'lpj', 'template-surat');
    if (permissions.canManageUsers) availableTabs.push('users');
    if (permissions.canManageHero) availableTabs.push('hero');
    if (permissions.canManageHits) availableTabs.push('hits');

    const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0] || 'sop');
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingDoc, setEditingDoc] = useState<any>(null);

    useEffect(() => {
        if (!availableTabs.includes(activeTab) && availableTabs.length > 0) {
            setActiveTab(availableTabs[0]);
        }
    }, [availableTabs, activeTab]);

    const handleEdit = (doc: any) => {
        setEditingDoc(doc);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => setEditingDoc(null);

    if (availableTabs.length === 0) {
        return (
            <div className="min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tata Kelola</h1>
                        <p className="text-gray-500 text-sm mt-1">Manajemen SOP, LPJ, template surat, foto hero, dan pengguna sistem</p>
                    </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">Anda tidak memiliki akses ke fitur ini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tata Kelola</h1>
                    <p className="text-gray-500 text-sm mt-1">Manajemen SOP, LPJ, template surat, foto hero, dan pengguna sistem</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-full max-w-full overflow-x-auto scrollbar-hide">
                {permissions.canManageGovernance && (
                    <>
                        <button
                            onClick={() => { setActiveTab('sop'); setEditingDoc(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'sop' ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            <FileCheck className="w-4 h-4" />
                            Dokumen SOP
                        </button>
                        <button
                            onClick={() => { setActiveTab('lpj'); setEditingDoc(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'lpj' ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            <FileText className="w-4 h-4" />
                            LPJ Bulanan
                        </button>
                        <button
                            onClick={() => { setActiveTab('template-surat'); setEditingDoc(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'template-surat' ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                            <FileSignature className="w-4 h-4" />
                            Template Surat
                        </button>
                    </>
                )}
                {permissions.canManageUsers && (
                    <button
                        onClick={() => { setActiveTab('users'); setEditingDoc(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <Users className="w-4 h-4" />
                        Manajemen User
                    </button>
                )}
                {permissions.canManageHero && (
                    <button
                        onClick={() => { setActiveTab('hero'); setEditingDoc(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'hero' ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        Hero Section
                    </button>
                )}
                {permissions.canManageHits && (
                    <button
                        onClick={() => { setActiveTab('hits'); setEditingDoc(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'hits' ? 'bg-white text-[#0F4C81] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <Flame className="w-4 h-4" />
                        Informasi Hits
                    </button>
                )}
            </div>

            {/* Content */}
            <div>
                {activeTab === 'sop' && permissions.canManageGovernance && (
                    <>
                        <GovernanceUploadForm adminId={adminId} allowedTypes={['SOP']} initialData={editingDoc?.type === 'SOP' ? editingDoc : null} onCancel={handleCancelEdit} />
                        <DocumentList documents={sops} onEdit={handleEdit} onDelete={deleteGovernanceDoc} />
                    </>
                )}

                {activeTab === 'lpj' && permissions.canManageGovernance && (
                    <>
                        <GovernanceUploadForm adminId={adminId} allowedTypes={['LPJ Bulanan']} initialData={editingDoc?.type === 'LPJ Bulanan' ? editingDoc : null} onCancel={handleCancelEdit} />
                        <DocumentList documents={lpjs} onEdit={handleEdit} onDelete={deleteGovernanceDoc} />
                        <DataExport />
                    </>
                )}

                {activeTab === 'template-surat' && permissions.canManageGovernance && (
                    <>
                        <GovernanceUploadForm adminId={adminId} allowedTypes={['Template Surat']} initialData={editingDoc?.type === 'Template Surat' ? editingDoc : null} onCancel={handleCancelEdit} />
                        <DocumentList documents={templateSurats} onEdit={handleEdit} onDelete={deleteGovernanceDoc} />
                    </>
                )}

                {activeTab === 'users' && permissions.canManageUsers && (
                    <>
                        {!showUserForm ? (
                            <>
                                <div className="mb-6 flex justify-end">
                                    <button onClick={() => setShowUserForm(true)} className="bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0F4C81]/90 transition-colors flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Tambah User Baru
                                    </button>
                                </div>
                                <BulkEnrollment />
                                <UserList users={users} roles={roles} lecturers={lecturers} allPermissions={allPermissions} rolePermissionMap={rolePermissionMap} />
                            </>
                        ) : (
                            <UserForm roles={roles} lecturers={lecturers} onSuccess={() => setShowUserForm(false)} onCancel={() => setShowUserForm(false)} />
                        )}
                    </>
                )}

                {activeTab === 'hero' && permissions.canManageHero && (
                    <HeroPhotoManager initialPhotos={heroPhotos} />
                )}

                {activeTab === 'hits' && permissions.canManageHits && (
                    <HitsManager initialInfos={hitsInfos} categories={hitsCategories} />
                )}
            </div>
        </div>
    );
}
