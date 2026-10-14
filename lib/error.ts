export interface TranslatedError {
    title: string;
    message: string;
}

export function translateError(error: any, defaultMessage: string = 'Terjadi kesalahan sistem'): TranslatedError {
    const rawMessage = error instanceof Error ? error.message : String(error);

    // Default title and message
    let title = 'Gagal';
    let message = rawMessage || defaultMessage;

    // Handle authentication and authorization errors
    if (rawMessage.includes('Unauthorized: Not logged in') || rawMessage.includes('Not logged in')) {
        title = 'Sesi Berakhir';
        message = 'Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali.';
    } else if (rawMessage.includes('Unauthorized: Permission') || rawMessage.includes('Permission')) {
        title = 'Akses Ditolak';
        const match = rawMessage.match(/Permission '(.+?)' required/);
        if (match && match[1]) {
            message = `Anda tidak memiliki hak akses (${match[1]}) untuk melakukan tindakan ini.`;
        } else {
            message = 'Anda tidak memiliki hak akses yang diperlukan untuk melakukan tindakan ini.';
        }
    } else if (rawMessage.includes('Unauthorized: One of')) {
        title = 'Akses Ditolak';
        message = 'Anda tidak memiliki salah satu dari hak akses yang diperlukan untuk melakukan tindakan ini.';
    } else if (rawMessage.includes('UNIQUE constraint failed')) {
        title = 'Data Sudah Ada';
        message = 'Data yang Anda masukkan sudah terdaftar di sistem dan tidak boleh duplikat.';
    } else if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
        title = 'Koneksi Terputus';
        message = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    } else if (rawMessage.includes('NEXT_REDIRECT')) {
        // Next.js internal redirect error, shouldn't be surfaced as a popup generally, but just in case
        title = 'Memproses...';
        message = 'Mengarahkan halaman...';
    } else if (rawMessage.includes('Failed query')) {
        // Avoid leaking raw SQL/driver errors to the user
        message = defaultMessage;
    }

    return { title, message };
}
