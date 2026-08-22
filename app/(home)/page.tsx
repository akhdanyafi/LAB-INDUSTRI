export const dynamic = 'force-dynamic';

import Navbar from '@/components/layout/Navbar';
import HeroSection from './_components/HeroSection';
import QuickStats from './_components/QuickStats';
import ModuleSection from './_components/ModuleSection';
import AvailableItemsSection from './_components/AvailableItemsSection';
import SOPSection from './_components/SOPSection';
import AnnouncementSection from './_components/AnnouncementSection';
import HomeCalendar from './_components/HomeCalendar';
import PublicationSection from './_components/PublicationSection';
import Footer from '@/components/layout/Footer';
import { getAllRooms, getMonthBookings, getMaintenanceRooms, getScheduledPracticumsForCalendar } from '@/features/bookings/actions';
import { getGovernanceDocs } from '@/features/governance/actions';
import { getTopPublications } from '@/features/publications/actions';
import { getMaintenanceItems, getAvailableItems, getHomepageStats } from '@/features/inventory/actions';
import { getModules } from '@/features/practicum/actions';
import { getPublishedHitsInfos } from '@/features/hits/actions';
import HitsInfoSection from '@/features/hits/components/HitsInfoSection';

export default async function Home() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const [
        rooms,
        currentMonthBookings,
        nextMonthBookings,
        nextNextMonthBookings,
        sops,
        topPublications,
        maintenanceRooms,
        maintenanceItems,
        availableItems,
        homepageStats,
        modules,
        practicumSchedules,
        hitsInfos
    ] = await Promise.all([
        getAllRooms(),
        getMonthBookings(currentMonth, currentYear),
        getMonthBookings((currentMonth + 1) % 12, currentMonth + 1 > 11 ? currentYear + 1 : currentYear),
        getMonthBookings((currentMonth + 2) % 12, currentMonth + 2 > 11 ? currentYear + 1 : currentYear),
        getGovernanceDocs('SOP'),
        getTopPublications(3),
        getMaintenanceRooms(),
        getMaintenanceItems(),
        getAvailableItems(),
        getHomepageStats(),
        getModules(),
        getScheduledPracticumsForCalendar(),
        getPublishedHitsInfos()
    ]);

    const calendarBookings = [
        ...currentMonthBookings,
        ...nextMonthBookings,
        ...nextNextMonthBookings
    ];

    return (
        <main className="min-h-screen">
            <Navbar />
            <div className="container mx-auto px-4 py-8 space-y-6">
                <HeroSection />

                {/* Informasi Hits — di bawah galeri foto kegiatan; tetap tampil walau kosong */}
                <HitsInfoSection items={hitsInfos} />

                {/* Quick Stats */}
                <QuickStats
                    totalItems={homepageStats.totalItems}
                    availableItems={homepageStats.availableItems}
                    totalModules={homepageStats.totalModules}
                    totalPublications={homepageStats.totalPublications}
                />

                {/* Modules + Available Items Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ModuleSection modules={modules} />
                    <AvailableItemsSection items={availableItems} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div id="sop">
                            <SOPSection sops={sops} />
                        </div>
                        <PublicationSection topPublications={topPublications} />
                    </div>
                    <div className="space-y-6">
                        <div id="calendar">
                            <HomeCalendar
                                rooms={rooms}
                                bookings={calendarBookings}
                                practicumSchedules={practicumSchedules}
                                title="Kalender Ruangan"
                            />
                        </div>
                        <AnnouncementSection
                            maintenanceRooms={maintenanceRooms}
                            maintenanceItems={maintenanceItems}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
