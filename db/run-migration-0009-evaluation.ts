/**
 * Migration 0009: Form Evaluasi Praktikum
 * Run with `npx tsx db/run-migration-0009-evaluation.ts`
 *
 * - Membuat tabel evaluation_questions, evaluation_configs, evaluation_responses
 * - Menambahkan permission 'evaluation.manage' dan meng-assign ke role Admin & Dosen
 *
 * Idempotent: aman dijalankan berulang kali (CREATE TABLE IF NOT EXISTS,
 * ON DUPLICATE KEY UPDATE, dan NOT EXISTS guard untuk role_permissions).
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
        // 1. Create evaluation_questions
        console.log('\n[1/5] Buat tabel evaluation_questions...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS evaluation_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                type ENUM('Rating', 'Teks') NOT NULL DEFAULT 'Rating',
                \`order\` INT NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✅ Tabel evaluation_questions siap');

        // 2. Create evaluation_configs
        console.log('\n[2/5] Buat tabel evaluation_configs...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS evaluation_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL UNIQUE,
                is_open BOOLEAN NOT NULL DEFAULT FALSE,
                opened_by VARCHAR(50),
                opened_at DATETIME,
                closed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                CONSTRAINT fk_ec_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                CONSTRAINT fk_ec_opened_by FOREIGN KEY (opened_by) REFERENCES users(identifier) ON DELETE SET NULL,
                INDEX ec_opened_by_idx (opened_by)
            )
        `);
        console.log('  ✅ Tabel evaluation_configs siap');

        // 3. Create evaluation_responses
        console.log('\n[3/5] Buat tabel evaluation_responses...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS evaluation_responses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                student_identifier VARCHAR(50) NOT NULL,
                answers JSON NOT NULL,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_er_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                CONSTRAINT fk_er_student FOREIGN KEY (student_identifier) REFERENCES users(identifier) ON DELETE CASCADE,
                UNIQUE KEY unique_evaluation_course_student (course_id, student_identifier),
                INDEX er_course_idx (course_id),
                INDEX er_student_idx (student_identifier)
            )
        `);
        console.log('  ✅ Tabel evaluation_responses siap');

        // 4. Insert permission evaluation.manage
        console.log('\n[4/5] Insert permission evaluation.manage...');
        await connection.query(`
            INSERT INTO permissions (code, name, category, description)
            VALUES ('evaluation.manage', 'Kelola Evaluasi Praktikum', 'Academic', 'Kelola pertanyaan kuesioner, buka/tutup evaluasi, dan lihat hasil evaluasi praktikum per mata kuliah')
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                category = VALUES(category),
                description = VALUES(description)
        `);
        console.log('  ✅ Permission ditambahkan');

        // 5. Assign evaluation.manage to Admin & Dosen (idempotent)
        console.log('\n[5/5] Assign permission evaluation.manage ke role Admin & Dosen...');
        await connection.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.name IN ('Admin', 'Dosen')
              AND p.code = 'evaluation.manage'
              AND NOT EXISTS (
                  SELECT 1 FROM role_permissions rp
                  WHERE rp.role_id = r.id AND rp.permission_id = p.id
              )
        `);
        console.log('  ✅ Permission di-assign ke Admin & Dosen');

        console.log('\n🎉 Migrasi 0009 (Evaluasi Praktikum) selesai!\n');
    } catch (err: any) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

run();
