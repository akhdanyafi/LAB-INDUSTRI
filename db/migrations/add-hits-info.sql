-- Migrasi: Fitur Informasi Hits
-- Aman dijalankan berulang (IF NOT EXISTS / INSERT IGNORE)

CREATE TABLE IF NOT EXISTS `hits_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `hits_info` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image_url` TEXT NOT NULL,
  `focal_x` INT NOT NULL DEFAULT 50,
  `focal_y` INT NOT NULL DEFAULT 50,
  `link` TEXT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hits_category_idx` (`category_id`),
  CONSTRAINT `hits_info_category_fk` FOREIGN KEY (`category_id`) REFERENCES `hits_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Permission baru
INSERT IGNORE INTO `permissions` (`code`, `name`, `category`, `description`)
VALUES ('hits.manage', 'Kelola Informasi Hits', 'Hits', 'Kelola informasi hits & kategorinya di homepage');

-- Berikan ke role Admin (jika ada)
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r CROSS JOIN `permissions` p
WHERE r.name = 'Admin' AND p.code = 'hits.manage';

-- Kategori default
INSERT INTO `hits_categories` (`name`, `color`)
SELECT * FROM (
  SELECT 'Kegiatan Prodi' AS name, '#2563EB' AS color
  UNION ALL SELECT 'Mahasiswa Berprestasi', '#F59E0B'
  UNION ALL SELECT 'Prestasi Lab', '#10B981'
  UNION ALL SELECT 'Pengumuman', '#EF4444'
) AS defaults
WHERE NOT EXISTS (SELECT 1 FROM `hits_categories`);
