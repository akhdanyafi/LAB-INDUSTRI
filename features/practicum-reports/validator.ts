/**
 * Practicum Report (Berita Acara) Validator
 */

import { z } from 'zod';

/** Gambar tanda tangan (PNG/JPEG sebagai data URL). */
export const signatureSchema = z.string({ message: 'Tanda tangan harus diisi' })
    .regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/, 'Tanda tangan harus berupa gambar PNG/JPG')
    .max(1_000_000, 'Gambar tanda tangan terlalu besar (maks. ±700 KB)');

export const createPracticumReportSchema = z.object({
    scheduledPracticumId: z.coerce.number().min(1, 'Jadwal praktikum harus dipilih'),

    // Snapshot data
    courseName: z.string().min(1, 'Nama matakuliah diperlukan'),
    courseCode: z.string().min(1, 'Kode matakuliah diperlukan'),
    lecturerName: z.string().nullable(),
    roomName: z.string().min(1, 'Nama ruangan diperlukan'),
    practicumDate: z.coerce.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),

    // Data yang diisi mahasiswa
    batch: z.string().min(1, 'Angkatan harus diisi'),
    attendeeCount: z.coerce.number().min(0, 'Jumlah kehadiran tidak boleh negatif'),
    condition: z.enum(['Lancar', 'Kurang Lancar', 'Terkendala'], {
        message: 'Kondisi praktikum harus dipilih',
    }),
    description: z.string().min(1, 'Deskripsi pelaksanaan harus diisi').max(2000, 'Deskripsi maksimal 2000 karakter'),
    issues: z.string().max(2000, 'Kendala maksimal 2000 karakter').optional(),
    followUp: z.string().max(2000, 'Tindak lanjut maksimal 2000 karakter').optional(),

    // Partner asprak (opsional, maks. 1 → total 2 asprak di berita acara)
    partnerId: z.string().trim().max(50).optional().nullable().transform((v) => v || null),

    // Modul yang digunakan saat mengajar: pilih dari modul MK, atau tulis sendiri ("lainnya")
    moduleId: z.coerce.number().int().positive().optional().nullable().transform((v) => v || null),
    moduleTitle: z.string().trim().max(255, 'Judul modul maksimal 255 karakter').optional().nullable().transform((v) => v || null),

    // Tanda tangan asprak pengisi (opsional saat mengisi; bisa disisipkan kemudian)
    assistantSignature: signatureSchema.optional().nullable().transform((v) => v || null),
});

/** Edit berita acara: field yang diisi asprak (jadwal & snapshot tidak berubah). */
export const updatePracticumReportSchema = createPracticumReportSchema.pick({
    batch: true, attendeeCount: true, condition: true, description: true, issues: true, followUp: true,
    partnerId: true, moduleId: true, moduleTitle: true,
});

export const verifyPracticumReportSchema = z.object({
    status: z.enum(['Diverifikasi', 'Ditolak'], {
        message: 'Status verifikasi harus dipilih',
    }),
    rejectionReason: z.string().max(1000, 'Alasan penolakan maksimal 1000 karakter').optional(),
}).refine((data) => {
    // Jika status Ditolak, rejectionReason wajib diisi
    if (data.status === 'Ditolak' && (!data.rejectionReason || data.rejectionReason.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'Alasan penolakan harus diisi jika status ditolak',
    path: ['rejectionReason'],
});
