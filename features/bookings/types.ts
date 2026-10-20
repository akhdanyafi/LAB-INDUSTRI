// Booking Types

export interface Room {
    id: number;
    name: string;
    location: string;
    capacity: number;
    status: 'Tersedia' | 'Maintenance';
}

export interface Booking {
    id: number;
    userId: string;
    roomId: number;
    validatorId: string | null;
    startTime: Date;
    endTime: Date;
    purpose: string;
    // New fields
    organisasi: string | null;
    jumlahPeserta: number | null;
    suratPermohonan: string | null;
    dosenPembimbing: string | null;
    status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Selesai';
}

export interface BookingWithDetails extends Booking {
    user: {
        identifier: string;
        fullName: string;
    };
    room: Room;
    validator?: {
        identifier: string;
        fullName: string;
    };
}

export interface CreateBookingInput {
    userId: string;
    roomId: number;
    startTime: Date;
    endTime: Date;
    purpose: string;
    // New fields
    organisasi?: string;
    jumlahPeserta?: number;
    suratPermohonan?: string;
    dosenPembimbing?: string;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    roomId: number;
    roomName: string;
    status: string;
}
