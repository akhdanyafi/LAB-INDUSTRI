-- Role & fitur Asisten Praktikum (port dari LAB-IF).
-- Jalankan SEKALI sebelum deploy kode baru:  mysql lab_industri_fstuai < db/migrations/add-asisten-praktikum.sql
-- (sama dengan langkah terkait di migrate.ts)

-- Role baru (id 4 seperti di LAB-IF & LAB-ELEKTRO) + izin kelola modul & jadwal praktikum
INSERT INTO roles (id, name) VALUES (4, 'Asisten Praktikum');
INSERT INTO role_permissions (role_id, permission_id)
    SELECT 4, id FROM permissions WHERE code = 'practicum.manage';

-- Berita acara: partner asprak, tanda tangan asprak, modul yang digunakan
ALTER TABLE practicum_reports
    ADD COLUMN partner_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER created_by,
    ADD COLUMN assistant_signature MEDIUMTEXT NULL,
    ADD COLUMN module_id INT NULL,
    ADD COLUMN module_title VARCHAR(255) NULL,
    ADD INDEX pr_partner_idx (partner_id),
    ADD CONSTRAINT practicum_reports_partner_id_users_identifier_fk FOREIGN KEY (partner_id) REFERENCES users (identifier) ON DELETE SET NULL,
    ADD CONSTRAINT pr_module_id_fk FOREIGN KEY (module_id) REFERENCES practicum_modules (id) ON DELETE SET NULL;

-- Biodata asprak (pas foto & rekening)
ALTER TABLE users
    ADD COLUMN photo_path VARCHAR(255) NULL,
    ADD COLUMN bank_name VARCHAR(100) NULL,
    ADD COLUMN bank_account_number VARCHAR(50) NULL,
    ADD COLUMN bank_account_name VARCHAR(255) NULL;
