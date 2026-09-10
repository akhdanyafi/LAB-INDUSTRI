/**
 * Migration 0010: Hasil Analisis Kuesioner Evaluasi Praktikum
 * Run with `npx tsx db/run-migration-0010-evaluation-analyses.ts`
 *
 * - Membuat tabel evaluation_analyses (upload hasil analisis kuesioner
 *   evaluasi praktikum per mata kuliah, oleh Admin/Dosen/pemegang
 *   permission 'practicum.manage' yang mengelola MK terkait)
 *
 * Idempotent: aman dijalankan berulang kali (CREATE TABLE IF NOT EXISTS).
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'be-labindustriuai',
        port: parseInt(process.env.DB_PORT || '3306'),
        multipleStatements: true,
    });

    console.log('🔗 Terhubung ke database:', process.env.DB_NAME || 'be-labindustriuai');

    try {
        // 1. Create evaluation_analyses
        console.log('\n[1/1] Buat tabel evaluation_analyses...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS evaluation_analyses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                uploaded_by VARCHAR(50) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_ea_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                CONSTRAINT fk_ea_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(identifier) ON DELETE CASCADE,
                INDEX ea_course_idx (course_id),
                INDEX ea_uploaded_by_idx (uploaded_by)
            )
        `);
        console.log('  ✅ Tabel evaluation_analyses siap');

        console.log('\n🎉 Migrasi 0010 (Hasil Analisis Kuesioner Evaluasi) selesai!\n');
    } catch (err: any) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

run();
