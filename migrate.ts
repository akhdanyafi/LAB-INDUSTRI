/**
 * Manual Migration Script
 * Adds missing columns to existing tables without dropping data.
 * Run with: npx tsx db/migrate.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
async function addColumnIfNotExists(
    connection: mysql.Connection,
    table: string,
    column: string,
    definition: string
) {
    try {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`  ✅ Added: ${table}.${column}`);
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log(`  ⏭️  Already exists: ${table}.${column}`);
        } else {
            console.error(`  ❌ Error on ${table}.${column}: ${err.message}`);
        }
    }
}
async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'be-labindustriuai',
        port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('✅ Connected to database:', process.env.DB_NAME);
    console.log('🚀 Running migrations...\n');
    // ─── room_bookings ─────────────────────────────────────────
    console.log('📋 Migrating room_bookings...');
    await addColumnIfNotExists(connection, 'room_bookings', 'rejection_reason', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'room_bookings', 'notification_read', "ENUM('0','1') DEFAULT '0'");
    await addColumnIfNotExists(connection, 'room_bookings', 'organisasi', "VARCHAR(255) DEFAULT 'Pribadi'");
    await addColumnIfNotExists(connection, 'room_bookings', 'jumlah_peserta', 'INT DEFAULT 1');
    await addColumnIfNotExists(connection, 'room_bookings', 'surat_permohonan', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'room_bookings', 'dosen_pembimbing', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'room_bookings', 'validator_id', 'VARCHAR(50) NULL');
    // ─── item_loans ─────────────────────────────────────────────
    console.log('\n📦 Migrating item_loans...');
    await addColumnIfNotExists(connection, 'item_loans', 'rejection_reason', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'organisasi', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'start_time', 'DATETIME NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'end_time', 'DATETIME NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'purpose', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'surat_izin', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'dosen_pembimbing', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'software', 'TEXT NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'notification_read', "ENUM('0','1') DEFAULT '0'");
    await addColumnIfNotExists(connection, 'item_loans', 'return_photo', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'return_status', "ENUM('Belum','Pending','Dikembalikan') DEFAULT 'Belum'");
    await addColumnIfNotExists(connection, 'item_loans', 'return_notification_read', "ENUM('0','1') DEFAULT '0'");
    await addColumnIfNotExists(connection, 'item_loans', 'validator_id', 'VARCHAR(50) NULL');
    await addColumnIfNotExists(connection, 'item_loans', 'actual_return_date', 'DATETIME NULL');
    // ─── users (extra fields) ────────────────────────────────────
    console.log('\n👤 Migrating users...');
    await addColumnIfNotExists(connection, 'users', 'batch', 'INT NULL');
    await addColumnIfNotExists(connection, 'users', 'study_type', "ENUM('Reguler','Hybrid') NULL");
    await addColumnIfNotExists(connection, 'users', 'phone_number', 'VARCHAR(20) NULL');
    await addColumnIfNotExists(connection, 'users', 'dosen_pembimbing', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'status', "ENUM('Active','Inactive') DEFAULT 'Active'");
    await addColumnIfNotExists(connection, 'users', 'custom_role_enabled', 'BOOLEAN NOT NULL DEFAULT FALSE');
    // Biodata Asisten Praktikum (pas foto & rekening)
    await addColumnIfNotExists(connection, 'users', 'photo_path', 'VARCHAR(255) NULL');
    await addColumnIfNotExists(connection, 'users', 'bank_name', 'VARCHAR(100) NULL');
    await addColumnIfNotExists(connection, 'users', 'bank_account_number', 'VARCHAR(50) NULL');
    await addColumnIfNotExists(connection, 'users', 'bank_account_name', 'VARCHAR(255) NULL');

    // ─── practicum_modules ────────────────────────────────────
    console.log('\n📚 Migrating practicum_modules...');
    await addColumnIfNotExists(connection, 'practicum_modules', 'module_link', 'VARCHAR(500) NULL');

    // ─── governance_docs ──────────────────────────────────────
    console.log('\n📁 Migrating governance_docs...');
    try {
        // Delete any Pusat Download docs first (changing to LAB-IF pattern)
        await connection.query("DELETE FROM `governance_docs` WHERE `type` = 'Pusat Download'");
        console.log('  ✅ Removed old Pusat Download docs');
    } catch (err: any) {
        console.log(`  ⚠️  Could not remove Pusat Download docs: ${err.message}`);
    }
    try {
        await connection.query("ALTER TABLE `governance_docs` MODIFY COLUMN `type` ENUM('SOP','LPJ Bulanan','Template Surat','Video Profil') NOT NULL");
        console.log('  ✅ Updated governance_docs.type enum (added Template Surat, Video Profil)');
    } catch (err: any) {
        console.log(`  ⚠️  Skipped governance_docs.type enum update: ${err.message}`);
    }

    // ─── practicum_reports (Berita Acara) ──────────────────────
    console.log('\n📝 Migrating practicum_reports (Berita Acara)...');
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`practicum_reports\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`scheduled_practicum_id\` INT NOT NULL,
                \`created_by\` VARCHAR(50) NOT NULL,
                \`course_name\` VARCHAR(255) NOT NULL,
                \`course_code\` VARCHAR(20) NOT NULL,
                \`lecturer_name\` VARCHAR(255) NULL,
                \`room_name\` VARCHAR(100) NOT NULL,
                \`practicum_date\` DATETIME NOT NULL,
                \`start_time\` VARCHAR(5) NOT NULL,
                \`end_time\` VARCHAR(5) NOT NULL,
                \`batch\` VARCHAR(10) NOT NULL,
                \`attendee_count\` INT NOT NULL,
                \`condition\` ENUM('Lancar','Kurang Lancar','Terkendala') NOT NULL,
                \`description\` TEXT NOT NULL,
                \`issues\` TEXT NULL,
                \`follow_up\` TEXT NULL,
                \`report_status\` ENUM('Pending','Diverifikasi','Ditolak') DEFAULT 'Pending',
                \`verified_by\` VARCHAR(50) NULL,
                \`verified_at\` DATETIME NULL,
                \`rejection_reason\` TEXT NULL,
                \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` DATETIME NULL,
                CONSTRAINT \`pr_sched_prac_id_fk\` FOREIGN KEY (\`scheduled_practicum_id\`) REFERENCES \`scheduled_practicums\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`pr_created_by_fk\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`identifier\`) ON DELETE CASCADE,
                CONSTRAINT \`pr_verified_by_fk\` FOREIGN KEY (\`verified_by\`) REFERENCES \`users\` (\`identifier\`) ON DELETE SET NULL,
                INDEX \`pr_scheduled_practicum_idx\` (\`scheduled_practicum_id\`),
                INDEX \`pr_created_by_idx\` (\`created_by\`),
                INDEX \`pr_status_idx\` (\`report_status\`),
                INDEX \`pr_verified_by_idx\` (\`verified_by\`)
            )
        `);
        console.log('  ✅ practicum_reports table created/exists');
    } catch (err: any) {
        console.log(`  ⚠️  practicum_reports: ${err.message}`);
    }
    // Fitur Asisten Praktikum: partner asprak, tanda tangan asprak, modul yang digunakan
    await addColumnIfNotExists(connection, 'practicum_reports', 'partner_id', 'VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `created_by`');
    await addColumnIfNotExists(connection, 'practicum_reports', 'assistant_signature', 'MEDIUMTEXT NULL');
    await addColumnIfNotExists(connection, 'practicum_reports', 'module_id', 'INT NULL');
    await addColumnIfNotExists(connection, 'practicum_reports', 'module_title', 'VARCHAR(255) NULL');
    for (const stmt of [
        'ALTER TABLE `practicum_reports` ADD INDEX `pr_partner_idx` (`partner_id`), ADD CONSTRAINT `practicum_reports_partner_id_users_identifier_fk` FOREIGN KEY (`partner_id`) REFERENCES `users` (`identifier`) ON DELETE SET NULL',
        'ALTER TABLE `practicum_reports` ADD CONSTRAINT `pr_module_id_fk` FOREIGN KEY (`module_id`) REFERENCES `practicum_modules` (`id`) ON DELETE SET NULL',
    ]) {
        try {
            await connection.query(stmt);
        } catch (err: any) {
            if (!['ER_FK_DUP_NAME', 'ER_DUP_KEYNAME'].includes(err.code)) console.error(`  ❌ ${err.message}`);
        }
    }

    // ─── Role Asisten Praktikum ─────────────────────────────────
    // Portal mahasiswa + izin 'practicum.manage' (kelola modul & jadwal, isi berita acara,
    // kelola evaluasi MK yang pernah dijadwalkannya) — sama seperti LAB-IF.
    console.log('\n🎓 Role Asisten Praktikum...');
    await connection.query("INSERT IGNORE INTO `roles` (`name`) VALUES ('Asisten Praktikum')");
    await connection.query(
        `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`)
         SELECT r.id, p.id FROM \`roles\` r JOIN \`permissions\` p ON p.code = 'practicum.manage'
         WHERE r.name = 'Asisten Praktikum'`
    );
    console.log('  ✅ Role Asisten Praktikum + practicum.manage siap');
    await connection.end();
    console.log('\n✅ Migration completed!');
}
main().catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
