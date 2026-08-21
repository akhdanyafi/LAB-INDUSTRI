-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: lab_industri_fstuai
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `lab_industri_fstuai`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `lab_industri_fstuai` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `lab_industri_fstuai`;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actor_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `description` text COLLATE utf8mb4_unicode_ci,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `activity_logs_actor_idx` (`actor_id`),
  KEY `activity_logs_module_action_idx` (`module`,`action`),
  KEY `activity_logs_entity_idx` (`entity_type`,`entity_id`),
  KEY `activity_logs_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sks` int DEFAULT '3',
  `semester` enum('Ganjil','Genap') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lecturer_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_code_unique` (`code`),
  KEY `lecturer_idx` (`lecturer_id`),
  CONSTRAINT `courses_lecturer_id_users_identifier_fk` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`identifier`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (11,'TI25A','Praktik Menggambar Teknik',NULL,1,'Genap','0303117702','2026-06-11 10:17:22'),(12,'TI25K','Praktik Menggambar Teknik',NULL,1,'Genap','0303117702','2026-06-11 10:17:59'),(13,'TI24A1','Pengendalian dan Penjaminan Mutu',NULL,1,'Genap','0324087401','2026-06-11 10:18:48'),(51,'TI24A2','Riset Operasi 2',NULL,1,'Genap','4551773674130022','2026-06-12 10:18:57'),(52,'TI24A3','Pengukuran dan Perancangan Sistem Kerja	',NULL,1,'Genap','0324049104','2026-06-12 10:19:52'),(53,'TI23A1','Praktik Perancangan Fasilitas',NULL,1,'Genap','0324049104','2026-06-12 10:20:48'),(54,'TI23A2','Praktikum Terintegrasi',NULL,2,'Genap','0301067402','2026-06-12 10:21:41');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `governance_docs`
--

DROP TABLE IF EXISTS `governance_docs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `governance_docs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('SOP','LPJ Bulanan','Template Surat','Pusat Download') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_idx` (`admin_id`),
  CONSTRAINT `governance_docs_admin_id_users_identifier_fk` FOREIGN KEY (`admin_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `governance_docs`
--

LOCK TABLES `governance_docs` WRITE;
/*!40000 ALTER TABLE `governance_docs` DISABLE KEYS */;
INSERT INTO `governance_docs` VALUES (1,'admin1','SOP Inventarisir alat dan bahan','/uploads/governance/1779246315575-478767964-001_-_Inventarisir_alat_dan_bahan.pdf','/uploads/governance/cover-1779246820559-874731580-ChatGPT_Image_20_Mei_2026__10.13.29.png','SOP','2026-05-20 10:05:15'),(2,'admin1','SOP  Penggunaan Alat-Laboratorium','/uploads/governance/1779246428866-179834217-003_-_Penggunaan_Alat-Laboratorium_done.pdf','/uploads/governance/cover-1779247157785-134378882-ChatGPT_Image_20_Mei_2026__10.19.05.png','SOP','2026-05-20 10:07:08'),(4,'admin1','SOP Kegiatan Praktikum','/uploads/governance/1779246462459-807380631-002_-_Kegiatan_Praktikum_done.pdf','/uploads/governance/cover-1779246925412-572450880-ChatGPT_Image_20_Mei_2026__10.15.15.png','SOP','2026-05-20 10:07:42'),(5,'admin1','SOP Rekrutment Asisten Praktikum','/uploads/governance/1779247385691-12230068-004_-_Rekrutmen_Asisten_Praktikum_done.pdf','/uploads/governance/cover-1779247385691-12230068-ChatGPT_Image_20_Mei_2026__10.22.16.png','SOP','2026-05-20 10:23:05'),(6,'admin1','Surat Peminjaman Alat/Laboratorium','/uploads/governance/1781158388102-127129355-FORMULIR_PEMINJAMAN_LAB_TI_V2.pdf',NULL,'Template Surat','2026-06-11 13:13:08'),(7,'admin1','Formulir Pengajuan Seminar Hasil','/uploads/governance/1781158797077-346556587-FORMULIR_PENGAJUAN_SEMINAR_HASIL.pdf',NULL,'Template Surat','2026-06-11 13:19:57'),(8,'admin1','Berita Acara Seminar Hasil','/uploads/governance/1784274440353-422045560-BERITA_ACARA_dan_ABSENSI_SEMINAR_HASIL.pdf',NULL,'Template Surat','2026-06-11 13:20:31');
/*!40000 ALTER TABLE `governance_docs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hero_photos`
--

DROP TABLE IF EXISTS `hero_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hero_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `focal_x` int NOT NULL DEFAULT '50',
  `focal_y` int NOT NULL DEFAULT '50',
  `link` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hero_photos`
--

LOCK TABLES `hero_photos` WRITE;
/*!40000 ALTER TABLE `hero_photos` DISABLE KEYS */;
INSERT INTO `hero_photos` VALUES (1,'Laboratorium Proses Manufaktur','','/api/file/1779245395291-Lab._TI__452___1_.jpg',28,50,NULL,'2026-05-20 09:49:55'),(2,'Laboratorium Perancangan Sistem Kerja','','/api/file/1779245724630-Lab._TI__231___1_.jpg',60,55,NULL,'2026-05-20 09:55:24'),(3,'Laboratorium Menggambar Teknik','','/api/file/1779245797674-Lab._TI__352___1_.jpg',53,12,NULL,'2026-05-20 09:56:37'),(4,'Laboratorium Ergonomi','','/api/file/1779245868703-Lab._TI__342___1_.jpg',67,54,NULL,'2026-05-20 09:57:48'),(5,'Laboratorium Optimasi dan Simulasi','','/api/file/1779245991704-Lab._TI__184___1_.jpg',49,40,NULL,'2026-05-20 09:59:51');
/*!40000 ALTER TABLE `hero_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hits_categories`
--

DROP TABLE IF EXISTS `hits_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hits_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#2563EB',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hits_categories`
--

LOCK TABLES `hits_categories` WRITE;
/*!40000 ALTER TABLE `hits_categories` DISABLE KEYS */;
INSERT INTO `hits_categories` VALUES (1,'Kegiatan Prodi','#2563EB','2026-08-06 11:36:56'),(2,'Mahasiswa Berprestasi','#F59E0B','2026-08-06 11:36:56'),(3,'Prestasi Lab','#10B981','2026-08-06 11:36:56'),(4,'Pengumuman','#EF4444','2026-08-06 11:36:56');
/*!40000 ALTER TABLE `hits_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hits_info`
--

DROP TABLE IF EXISTS `hits_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hits_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` text NOT NULL,
  `focal_x` int NOT NULL DEFAULT '50',
  `focal_y` int NOT NULL DEFAULT '50',
  `link` text,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hits_category_idx` (`category_id`),
  CONSTRAINT `hits_info_category_fk` FOREIGN KEY (`category_id`) REFERENCES `hits_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hits_info`
--

LOCK TABLES `hits_info` WRITE;
/*!40000 ALTER TABLE `hits_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `hits_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_categories`
--

DROP TABLE IF EXISTS `item_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_categories`
--

LOCK TABLES `item_categories` WRITE;
/*!40000 ALTER TABLE `item_categories` DISABLE KEYS */;
INSERT INTO `item_categories` VALUES (1,'Laptop'),(2,'Proyektor'),(3,'Kamera'),(4,'Mikrofon'),(5,'Peralatan Jaringan'),(6,'Komputer'),(7,'Peralatan Presentasi'),(8,'Peralatan Praktikum'),(9,'Peralatan Pendukung'),(10,'Alat Pelindung Diri (APD)');
/*!40000 ALTER TABLE `item_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_loans`
--

DROP TABLE IF EXISTS `item_loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_id` int NOT NULL,
  `validator_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `return_plan_date` datetime NOT NULL,
  `actual_return_date` datetime DEFAULT NULL,
  `status` enum('Pending','Disetujui','Ditolak','Selesai','Terlambat') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `organisasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `surat_izin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dosen_pembimbing` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `software` text COLLATE utf8mb4_unicode_ci,
  `notification_read` enum('0','1') COLLATE utf8mb4_unicode_ci DEFAULT '0',
  `return_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_status` enum('Belum','Pending','Dikembalikan') COLLATE utf8mb4_unicode_ci DEFAULT 'Belum',
  `return_notification_read` enum('0','1') COLLATE utf8mb4_unicode_ci DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `student_idx` (`student_id`),
  KEY `item_idx` (`item_id`),
  KEY `validator_idx` (`validator_id`),
  CONSTRAINT `item_loans_item_id_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `item_loans_student_id_users_identifier_fk` FOREIGN KEY (`student_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE,
  CONSTRAINT `item_loans_validator_id_users_identifier_fk` FOREIGN KEY (`validator_id`) REFERENCES `users` (`identifier`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_loans`
--

LOCK TABLES `item_loans` WRITE;
/*!40000 ALTER TABLE `item_loans` DISABLE KEYS */;
INSERT INTO `item_loans` VALUES (10,'0101524003',1,'admin1','2026-06-23 13:58:49','2026-06-25 00:00:00',NULL,'Ditolak','Lampirkan Surat Peminjaman Alat/Laboratorium yang dittd kaprodi','HMTIA','2026-06-25 06:00:00','2026-06-25 08:00:00','Rapat HIMA / organisasi','/api/file/surat-izin/1782197929538-Surat_Peminjaman__HMTIA.pdf','Dr. Nunung Nurhasanah, S.T., M.Si.',NULL,'0',NULL,'Belum','0'),(11,'0101524003',1,'admin1','2026-06-23 14:33:36','2026-06-25 00:00:00','2026-06-29 02:16:11','Selesai',NULL,'HMTIA','2026-06-25 06:00:00','2026-06-25 08:00:00','Rapat HIMA / organisasi','/api/file/surat-izin/1782200016268-SuratPeminjaman_HMTIA.pdf','Dr. Nunung Nurhasanah, S.T., M.Si.',NULL,'0',NULL,'Dikembalikan','0'),(12,'0101523027',1,'admin1','2026-07-07 08:04:10','2026-07-09 00:00:00','2026-07-09 01:42:37','Selesai',NULL,'Ketua Kelompok MK','2026-07-09 02:00:00','2026-07-09 05:00:00','Kegiatan belajar mandiri / kelompok',NULL,'Dr. Nunung Nurhasanah, S.T., M.Si.',NULL,'0',NULL,'Dikembalikan','0'),(13,'0101525012',1,'admin1','2026-07-09 10:17:50','2026-07-10 00:00:00','2026-07-11 01:13:24','Selesai',NULL,'RESPONSI HMTIA','2026-07-10 06:30:00','2026-07-10 08:10:00','RESPONSI HMTIA','/api/file/surat-izin/1783567070181-SURAT_DAN_FORMULIR_PEMINJAMAN_ALAT_LABORATORIUM_TI.pdf','Niken Parwati, S.T., M.M.',NULL,'0',NULL,'Dikembalikan','0'),(14,'0101525012',1,'admin1','2026-07-12 13:02:45','2026-07-17 00:00:00','2026-07-18 07:50:32','Selesai',NULL,'HMTIA','2026-07-17 06:30:00','2026-07-17 08:10:00','Responsi HMTIA','/api/file/surat-izin/1783836165592-SURAT_DAN_FORMULIR_PEMINJAMAN_ALAT_LABORATORIUM_DAN_RUANGAN_TI.pdf','Niken Parwati, S.T., M.M.',NULL,'0',NULL,'Dikembalikan','0'),(15,'0101525012',1,'admin1','2026-07-12 13:04:53','2026-07-20 00:00:00','2026-07-18 07:50:29','Selesai',NULL,'HMTIA','2026-07-20 06:00:00','2026-07-20 07:00:00','Responsi UAS Genap','/api/file/surat-izin/1783836293762-SURAT_DAN_FORMULIR_PEMINJAMAN_ALAT_LABORATORIUM_DAN_RUANGAN_TI.pdf','Niken Parwati, S.T., M.M.',NULL,'0',NULL,'Dikembalikan','0');
/*!40000 ALTER TABLE `item_loans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `room_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `qr_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `status` enum('Tersedia','Dipinjam','Maintenance') COLLATE utf8mb4_unicode_ci DEFAULT 'Tersedia',
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_qr_code_unique` (`qr_code`),
  KEY `category_idx` (`category_id`),
  KEY `room_idx` (`room_id`),
  CONSTRAINT `items_category_id_item_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `items_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,7,8,'Infocus','Epson','ITEM-1781149284592-I7JSLJ',1,'Tersedia'),(2,7,8,'Microphone','Microphone, Receiver, dan Charger','ITEM-1781149410222-Z0JZP',1,'Tersedia'),(3,7,8,'Speaker','Logitech Z121','ITEM-1781149451446-IKJLNA',1,'Tersedia'),(4,7,8,'Kamera','B-Vision R1','ITEM-1781149490334-L4T374',1,'Tersedia'),(5,6,1,'Personal Computer AIO Lenovo core-i5','5 set komputer merek Lenovo','ITEM-1781149714781-O5MMLV',5,'Tersedia'),(6,6,1,'Personal Computer AIO HP (TouchSreen)','8 Set komputer dengan mouse dan keyboard wireless merek HP Pavilion 24-K0130D ','ITEM-1781150484896-8QPV3',8,'Tersedia'),(7,6,1,'Komputer','set LCD (2 Samsung dan 1 View Sonic; 2 CPU Dazumba dan 1 simbadda; 3 set keyboard dan mouse merek logitech)','ITEM-1781150721870-DX3KNR',3,'Tersedia'),(8,8,8,'3D Printer','Adventurer 3 Flashforge','ITEM-1781150832413-GD4DOH',1,'Tersedia'),(9,9,6,'Standing Fan','2 unit merek VANCO','ITEM-1781151597008-L6UAFI',2,'Tersedia'),(10,8,6,'Cutter Grinder Duduk (abrasive cut-off saw)','KEN','ITEM-1781151639159-G533KA',1,'Tersedia'),(11,8,6,'Hand Cutter Grinder ','HITACHI Type: G-10-SS','ITEM-1781151673823-SDIH7I',1,'Tersedia'),(12,8,6,'Drilling Press Machine','KRISBOW Type 15 - 00 543','ITEM-1781151699415-4RN4ML',1,'Tersedia'),(13,8,6,'Milling Machine','KRISBOW Type: KW 15 - 46','ITEM-1781151726711-IQ7GL',1,'Tersedia'),(14,6,6,'Komputer','SimCool (cpu)/Samsung (Monitor)','ITEM-1781151760207-S3FUD',1,'Tersedia'),(15,8,6,'Inverter Welding Machine','KRISBOW Type: KW 14 - 142','ITEM-1781151795902-4OAFIL',1,'Tersedia'),(16,8,6,'Inverter Welding Machine','Ryu Type RII120-2','ITEM-1781151827358-BHXPQ',4,'Tersedia'),(17,8,6,'Inverter Welding Machine','Lakoni 450Watt','ITEM-1781151856502-E75JDB',2,'Tersedia'),(18,10,6,'Welding Glove','Yutaka 16 Inch','ITEM-1781151897470-5PQTB',6,'Tersedia'),(19,8,6,'CNC Router/Machine',NULL,'ITEM-1781151932150-LONPLP',1,'Maintenance'),(20,8,6,'Turning Machine','KRISBOW Type: KW 15 - 604','ITEM-1781151960046-K85IA',1,'Tersedia'),(21,10,6,'Welding Helmet','5 unit','ITEM-1781152054629-3JQA77',5,'Tersedia'),(22,10,6,'Helmet Protection','2 unit','ITEM-1781152089100-UC96RA',2,'Tersedia'),(23,8,6,'Laser Engraving Machine',NULL,'ITEM-1781152173052-F1I49',1,'Tersedia'),(24,9,6,'APAR','3,5 Kg','ITEM-1781152205716-LY66CO',1,'Tersedia'),(25,9,5,'APAR','3.5 Kg','ITEM-1781152233123-FFO371',1,'Tersedia'),(26,8,4,'Kursi Antropometri','warna coklat','ITEM-1781152257051-656QIS',1,'Tersedia'),(27,7,8,'Tripod Kamera','Mixio','ITEM-1784947756234-14Z44C',1,'Tersedia');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lab_attendance`
--

DROP TABLE IF EXISTS `lab_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` int NOT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dosen_penanggung_jawab` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `check_in_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_idx` (`user_id`),
  KEY `room_idx` (`room_id`),
  KEY `check_in_time_idx` (`check_in_time`),
  CONSTRAINT `lab_attendance_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lab_attendance_user_id_users_identifier_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_attendance`
--

LOCK TABLES `lab_attendance` WRITE;
/*!40000 ALTER TABLE `lab_attendance` DISABLE KEYS */;
INSERT INTO `lab_attendance` VALUES (1,'admin1',8,'Kehadiran di area laboratorium','-','2026-06-11 14:24:04'),(2,'0101516020',1,'Kehadiran di area laboratorium','Ahmad Juang Pratama, S.T., M.Sc.','2026-07-08 15:27:18');
/*!40000 ALTER TABLE `lab_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.admin','Akses Dashboard Admin','General',NULL),(2,'dashboard.lecturer','Akses Dashboard Dosen','General',NULL),(3,'loans.manage','Validasi Peminjaman Alat','Loans',NULL),(4,'bookings.manage','Validasi Booking Ruangan','Bookings',NULL),(5,'users.manage','Manajemen Akun & Hak Akses','Users',NULL),(6,'inventory.manage','Manajemen Inventaris Alat','Inventory',NULL),(7,'courses.manage','Manajemen Mata Kuliah','Academic',NULL),(8,'practicum.manage','Manajemen Modul & Jadwal Praktikum','Academic',NULL),(9,'publications.manage','Manajemen Publikasi','Publications',NULL),(10,'governance.manage','Manajemen SOP & Laporan LPJ','Governance',NULL),(11,'download-center.manage','Kelola Pusat Download','Download Center',NULL),(12,'hero.manage','Kelola Hero Photos','Hero',NULL),(13,'hits.manage','Kelola Informasi Hits','Hits','Kelola informasi hits & kategorinya di homepage');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practicum_lpj_docs`
--

DROP TABLE IF EXISTS `practicum_lpj_docs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practicum_lpj_docs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `scheduled_practicum_id` int NOT NULL,
  `uploader_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_month` int NOT NULL,
  `period_year` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lpj_sched_idx` (`scheduled_practicum_id`),
  KEY `lpj_uploader_idx` (`uploader_id`),
  KEY `lpj_period_idx` (`period_year`,`period_month`),
  CONSTRAINT `lpj_sched_prac_fk` FOREIGN KEY (`scheduled_practicum_id`) REFERENCES `scheduled_practicums` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lpj_uploader_fk` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practicum_lpj_docs`
--

LOCK TABLES `practicum_lpj_docs` WRITE;
/*!40000 ALTER TABLE `practicum_lpj_docs` DISABLE KEYS */;
/*!40000 ALTER TABLE `practicum_lpj_docs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practicum_modules`
--

DROP TABLE IF EXISTS `practicum_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practicum_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_idx` (`course_id`),
  CONSTRAINT `practicum_modules_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practicum_modules`
--

LOCK TABLES `practicum_modules` WRITE;
/*!40000 ALTER TABLE `practicum_modules` DISABLE KEYS */;
INSERT INTO `practicum_modules` VALUES (1,11,'Praktik Menggambar Teknik',NULL,NULL,'https://drive.google.com/file/d/1wLzUmYIUQYLYfc5SxlW5i34jDEm3NFav/view?usp=sharing','2026-06-11 10:25:30',NULL),(2,12,'Praktik Menggambar Teknik',NULL,NULL,'https://drive.google.com/file/d/1wLzUmYIUQYLYfc5SxlW5i34jDEm3NFav/view?usp=sharing','2026-06-11 10:25:50',NULL),(3,13,'Pengendalian dan Penjaminan Mutu',NULL,NULL,'https://drive.google.com/file/d/157Q0pa9ZdgrBKzGVUYqPSzq0vVlWzHZm/view?usp=sharing','2026-06-11 10:26:19',NULL),(4,51,'Riset Operasi 2',NULL,NULL,'https://drive.google.com/file/d/1PfvoZLuCepQ-c9gs5NNo_WnCIw_M8JP0/view?usp=sharing','2026-06-12 10:23:22',NULL),(5,52,'Pengukuran dan Perancangan Sistem Kerja',NULL,NULL,'https://drive.google.com/file/d/19MYqpoGDKlORTqsS1xWslEDRiWXk4CFR/view?usp=sharing','2026-06-12 10:23:53',NULL),(6,53,'Praktik Perancangan Fasilitas',NULL,NULL,'https://drive.google.com/file/d/1xTBfn_uuWHmCApEjDCyRKxunFrlCDY-e/view?usp=sharing','2026-06-12 10:24:20',NULL),(7,54,'Praktikum Terintegrasi',NULL,NULL,'https://drive.google.com/drive/folders/1kEmGwP765OsifXYe6yTzdO8jebol9UHP?usp=sharing','2026-06-12 10:24:42',NULL);
/*!40000 ALTER TABLE `practicum_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practicum_reports`
--

DROP TABLE IF EXISTS `practicum_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practicum_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `scheduled_practicum_id` int NOT NULL,
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lecturer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `practicum_date` datetime NOT NULL,
  `start_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendee_count` int NOT NULL,
  `condition` enum('Lancar','Kurang Lancar','Terkendala') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `issues` text COLLATE utf8mb4_unicode_ci,
  `follow_up` text COLLATE utf8mb4_unicode_ci,
  `report_status` enum('Pending','Diverifikasi','Ditolak') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `verified_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pr_scheduled_practicum_idx` (`scheduled_practicum_id`),
  KEY `pr_created_by_idx` (`created_by`),
  KEY `pr_status_idx` (`report_status`),
  KEY `pr_verified_by_idx` (`verified_by`),
  CONSTRAINT `pr_sched_prac_id_fk` FOREIGN KEY (`scheduled_practicum_id`) REFERENCES `scheduled_practicums` (`id`) ON DELETE CASCADE,
  CONSTRAINT `practicum_reports_created_by_users_identifier_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`identifier`) ON DELETE CASCADE,
  CONSTRAINT `practicum_reports_verified_by_users_identifier_fk` FOREIGN KEY (`verified_by`) REFERENCES `users` (`identifier`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practicum_reports`
--

LOCK TABLES `practicum_reports` WRITE;
/*!40000 ALTER TABLE `practicum_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `practicum_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publication_likes`
--

DROP TABLE IF EXISTS `publication_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publication_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `publication_id` int NOT NULL,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `publication_idx` (`publication_id`),
  KEY `user_idx` (`user_id`),
  KEY `unique_like` (`publication_id`,`user_id`),
  CONSTRAINT `publication_likes_publication_id_publications_id_fk` FOREIGN KEY (`publication_id`) REFERENCES `publications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `publication_likes_user_id_users_identifier_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publication_likes`
--

LOCK TABLES `publication_likes` WRITE;
/*!40000 ALTER TABLE `publication_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `publication_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publications`
--

DROP TABLE IF EXISTS `publications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uploader_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abstract` text COLLATE utf8mb4_unicode_ci,
  `keywords` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `view_count` int NOT NULL DEFAULT '0',
  `publish_year` int DEFAULT NULL,
  `publish_month` int DEFAULT NULL,
  `publish_day` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploader_idx` (`uploader_id`),
  CONSTRAINT `publications_uploader_id_users_identifier_fk` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`identifier`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publications`
--

LOCK TABLES `publications` WRITE;
/*!40000 ALTER TABLE `publications` DISABLE KEYS */;
/*!40000 ALTER TABLE `publications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_perm` (`role_id`,`permission_id`),
  KEY `role_permissions_permission_id_permissions_id_fk` (`permission_id`),
  KEY `rp_role_idx` (`role_id`),
  CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,4),(5,1,5),(6,1,6),(7,1,7),(8,1,8),(9,1,9),(10,1,10),(11,1,11),(12,1,12),(17,1,13),(13,2,2),(14,2,7),(15,2,8),(16,2,9);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin'),(2,'Dosen'),(3,'Mahasiswa');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_bookings`
--

DROP TABLE IF EXISTS `room_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` int NOT NULL,
  `validator_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `purpose` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `organisasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Pribadi',
  `jumlah_peserta` int DEFAULT '1',
  `surat_permohonan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dosen_pembimbing` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Pending','Disetujui','Ditolak') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `notification_read` enum('0','1') COLLATE utf8mb4_unicode_ci DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_idx` (`user_id`),
  KEY `room_idx` (`room_id`),
  KEY `validator_idx` (`validator_id`),
  CONSTRAINT `room_bookings_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `room_bookings_user_id_users_identifier_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE,
  CONSTRAINT `room_bookings_validator_id_users_identifier_fk` FOREIGN KEY (`validator_id`) REFERENCES `users` (`identifier`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_bookings`
--

LOCK TABLES `room_bookings` WRITE;
/*!40000 ALTER TABLE `room_bookings` DISABLE KEYS */;
INSERT INTO `room_bookings` VALUES (1,'-',1,'admin1','2026-07-11 02:00:00','2026-07-10 17:00:00','Pelatihan Promodel','Dosen',13,NULL,'Budi Aribowo, S.T., M.Si.. M.Kom.','Disetujui',NULL,'0'),(5,'0101524003',1,'admin1','2026-06-25 06:00:00','2026-06-25 08:00:00','Rapat HIMA / organisasi','HMTIA',25,'/api/file/surat-permohonan/1782198059688-Surat_Peminjaman__HMTIA.pdf','Dr. Nunung Nurhasanah, S.T., M.Si.','Ditolak','Lampirkan Surat Peminjaman Alat/Laboratorium yang dittd kaprodi','0'),(6,'0101524003',1,'admin1','2026-06-25 06:00:00','2026-06-25 08:00:00','Rapat HIMA / organisasi','HMTIA',25,'/api/file/surat-permohonan/1782200120107-SuratPeminjaman_HMTIA.pdf','Dr. Nunung Nurhasanah, S.T., M.Si.','Disetujui',NULL,'1'),(7,'0101524008',1,'admin1','2026-07-06 03:20:00','2026-07-06 05:00:00','Praktikum atau persiapan tugas','Ketua Kelompok MK',18,NULL,'Widya Nurcahayanty Tanjung, S.T.,M.T.,M.B.A.','Ditolak','Tulis detail keperluan dan ubah nama dosen','0'),(8,'0101524008',1,'admin1','2026-07-06 03:20:00','2026-07-06 05:00:00','Ujian Ekonomi Teknik, oleh Bu Niken Menggunakan software Micosoft Excel','Ketua Kelompok MK',18,NULL,'Niken Parwati, S.T., M.M.','Disetujui',NULL,'0'),(12,'-',1,'admin1','2026-07-22 02:00:00','2026-07-22 05:00:00','Ujian Komprehensif','Asprak',20,NULL,'Aprilia Tri Purwandari, S.T., M.T.','Disetujui',NULL,'0'),(13,'-',1,'admin1','2026-07-18 02:00:00','2026-07-18 05:00:00','Pelatihan','Dosen',20,NULL,'Budi Aribowo, S.T., M.Si.. M.Kom.','Disetujui',NULL,'0'),(14,'0101523027',7,'admin1','2026-07-09 02:00:00','2026-07-09 05:00:00','Kegiatan belajar mandiri / kelompok','Ketua Kelompok MK',15,NULL,'Dr. Nunung Nurhasanah, S.T., M.Si.','Ditolak','peminjaman ruang kelas untuk kegiatan mata kuliah dilakukan oleh dosen ybs','0'),(15,'0101523027',1,'admin1','2026-07-09 02:00:00','2026-07-09 05:00:00','Kegiatan belajar mandiri / kelompok','Ketua Kelompok MK',15,NULL,'Dr. Nunung Nurhasanah, S.T., M.Si.','Disetujui',NULL,'0'),(19,'-',1,'admin1','2026-07-18 08:30:00','2026-07-18 10:48:00','kompre','Pribadi',1,NULL,'Budi Aribowo, S.T., M.Si.. M.Kom.','Disetujui',NULL,'0'),(21,'-',1,'admin1','2026-07-25 02:01:00','2026-07-25 04:58:00','Pelatihan','Pribadi',20,NULL,'Aprilia Tri Purwandari, S.T., M.T.','Disetujui',NULL,'0'),(23,'-',1,'admin1','2026-07-25 05:50:00','2026-07-25 07:30:00','Kompre PF','Pribadi',20,NULL,'Aprilia Tri Purwandari, S.T., M.T.','Disetujui',NULL,'0'),(24,'0101525012',1,'admin1','2026-07-10 06:30:00','2026-07-10 08:10:00','Responsi HMTIA','HMTIA RESPONSI',16,'/api/file/surat-permohonan/1783567354533-SURAT_DAN_FORMULIR_PEMINJAMAN_ALAT_LABORATORIUM_TI.pdf','Niken Parwati, S.T., M.M.','Disetujui',NULL,'1'),(25,'0101516020',1,'admin1','2026-07-21 00:00:00','2026-07-21 03:30:00','Ujian Komprehensif','Pribadi',1,NULL,'Dr. Tyara Puspaningrum, S.T.P., M.T.','Ditolak',NULL,'0'),(26,'-',1,'admin1','2026-07-11 06:00:00','2026-07-11 07:27:00','Praktikum atau persiapan tugas','Asprak',20,NULL,'Aprilia Tri Purwandari, S.T., M.T.','Disetujui',NULL,'0'),(27,'-',2,'admin1','2026-07-11 03:21:00','2026-07-11 05:00:00','Praktikum atau persiapan tugas','Pribadi',10,NULL,'Aprilia Tri Purwandari, S.T., M.T.','Disetujui',NULL,'0'),(28,'0101525012',1,'admin1','2026-07-17 06:30:00','2026-07-17 08:10:00','Responsi Uas Genap','HMTIA',16,'/api/file/surat-permohonan/1783836460628-SURAT_DAN_FORMULIR_PEMINJAMAN_ALAT_LABORATORIUM_DAN_RUANGAN_TI.pdf','Niken Parwati, S.T., M.M.','Disetujui',NULL,'1'),(29,'0101525012',1,'admin1','2026-07-20 06:00:00','2026-07-20 07:00:00','Responsi UAS Genap','HMTIA',20,'/api/file/surat-permohonan/1783836542505-SURAT_DAN_FORMULIR_PEMINJAMAN_ALAT_LABORATORIUM_DAN_RUANGAN_TI.pdf','Niken Parwati, S.T., M.M.','Disetujui',NULL,'1'),(30,'-',1,'admin1','2026-08-01 02:09:00','2026-08-01 04:59:00','Pelatihan Promodel','Pribadi',1,NULL,'Budi Aribowo, S.T., M.Si.. M.Kom.','Disetujui',NULL,'0'),(32,'0',1,'admin1','2026-08-03 02:00:00','2026-08-03 11:00:00','Praktikum atau persiapan tugas','Pribadi',1,NULL,'Aprilia Tri Purwandari, S.T., M.T.','Disetujui',NULL,'0'),(39,'0101525007',1,'admin1','2026-08-01 08:00:00','2026-08-01 10:00:00','Pelaksanaan Program Kerja Hallo HMTIA','HMTIA',28,'/api/file/surat-permohonan/1785490244020-Surat_dan_Formulir_Peminjaman.pdf','Ahmad Juang Pratama, S.T., M.Sc.','Disetujui',NULL,'0');
/*!40000 ALTER TABLE `room_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL,
  `status` enum('Tersedia','Maintenance') COLLATE utf8mb4_unicode_ci DEFAULT 'Tersedia',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Laboratorium Optimasi dan Simulasi','Lantai 6',20,'Tersedia'),(2,'Laboratorium Perancangan Sistem Kerja','Lantai 6',11,'Tersedia'),(3,'Staff Laboratorium','Lantai 6',4,'Tersedia'),(4,'Laboratorium Ergonomi','Lantai B1',4,'Tersedia'),(5,'Laboratorium Menggambar Teknik','Lantai B1',10,'Tersedia'),(6,'Laboratorium Proses Manufaktur','Lantai b1',10,'Tersedia'),(7,'Ruang Kelas','Lantai 6',30,'Tersedia'),(8,'Ruang Laboran','Lantai 6',4,'Tersedia');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_practicums`
--

DROP TABLE IF EXISTS `scheduled_practicums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_practicums` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `room_id` int NOT NULL,
  `module_id` int DEFAULT NULL,
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `day_of_week` int NOT NULL,
  `start_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_date` datetime NOT NULL,
  `status` enum('Aktif','Dibatalkan') COLLATE utf8mb4_unicode_ci DEFAULT 'Aktif',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sp_course_idx` (`course_id`),
  KEY `sp_room_idx` (`room_id`),
  KEY `sp_module_idx` (`module_id`),
  KEY `sp_created_by_idx` (`created_by`),
  CONSTRAINT `scheduled_practicums_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scheduled_practicums_created_by_users_identifier_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`identifier`) ON DELETE CASCADE,
  CONSTRAINT `scheduled_practicums_module_id_practicum_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `practicum_modules` (`id`) ON DELETE SET NULL,
  CONSTRAINT `scheduled_practicums_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_practicums`
--

LOCK TABLES `scheduled_practicums` WRITE;
/*!40000 ALTER TABLE `scheduled_practicums` DISABLE KEYS */;
INSERT INTO `scheduled_practicums` VALUES (1,13,7,3,'admin1',5,'15:30','17:00','2026-06-12 17:00:00','Aktif','2026-06-11 10:29:04'),(2,13,7,3,'admin1',5,'15:30','17:00','2026-06-19 17:00:00','Aktif','2026-06-11 10:29:04'),(3,13,7,3,'admin1',5,'15:30','17:00','2026-06-26 17:00:00','Aktif','2026-06-11 10:29:04'),(4,13,7,3,'admin1',5,'15:30','17:00','2026-07-03 17:00:00','Aktif','2026-06-11 10:29:04'),(8,11,1,1,'admin1',2,'13:00','14:30','2026-06-16 17:00:00','Aktif','2026-06-11 10:30:40'),(9,11,1,1,'admin1',2,'13:00','14:30','2026-06-23 17:00:00','Aktif','2026-06-11 10:30:40'),(10,11,1,1,'admin1',2,'13:00','14:30','2026-06-30 17:00:00','Aktif','2026-06-11 10:30:40'),(14,12,1,2,'admin1',5,'14:30','15:30','2026-06-12 17:00:00','Aktif','2026-06-11 10:31:28'),(16,12,1,2,'admin1',5,'14:30','15:30','2026-06-19 17:00:00','Aktif','2026-06-11 10:31:28'),(18,12,1,2,'admin1',5,'14:30','15:30','2026-06-26 17:00:00','Aktif','2026-06-11 10:31:28'),(20,12,1,2,'admin1',5,'14:30','15:30','2026-07-03 17:00:00','Aktif','2026-06-11 10:31:28'),(27,51,1,4,'admin1',1,'10:40','12:00','2026-06-15 17:00:00','Aktif','2026-06-12 10:26:39'),(28,51,1,4,'admin1',1,'10:40','12:00','2026-06-22 17:00:00','Aktif','2026-06-12 10:26:39'),(29,51,1,4,'admin1',1,'10:40','12:00','2026-06-29 17:00:00','Aktif','2026-06-12 10:26:39'),(33,52,1,5,'admin1',3,'16:00','17:30','2026-06-17 17:00:00','Aktif','2026-06-12 10:27:10'),(34,52,1,5,'admin1',3,'16:00','17:30','2026-06-24 17:00:00','Aktif','2026-06-12 10:27:10'),(35,52,1,5,'admin1',3,'16:00','17:30','2026-07-01 17:00:00','Aktif','2026-06-12 10:27:10'),(39,53,7,6,'admin1',5,'12:50','14:30','2026-06-12 17:00:00','Aktif','2026-06-12 10:27:36'),(40,53,7,6,'admin1',5,'12:50','14:30','2026-06-19 17:00:00','Aktif','2026-06-12 10:27:36'),(41,53,7,6,'admin1',5,'12:50','14:30','2026-06-26 17:00:00','Aktif','2026-06-12 10:27:36'),(42,53,7,6,'admin1',5,'12:50','14:30','2026-07-03 17:00:00','Aktif','2026-06-12 10:27:36'),(46,54,1,7,'admin1',5,'07:00','08:40','2026-06-12 17:00:00','Aktif','2026-06-12 10:27:59'),(47,54,1,7,'admin1',5,'07:00','08:40','2026-06-19 17:00:00','Aktif','2026-06-12 10:27:59'),(48,54,1,7,'admin1',5,'07:00','08:40','2026-06-26 17:00:00','Aktif','2026-06-12 10:27:59'),(49,54,1,7,'admin1',5,'07:00','08:40','2026-07-03 17:00:00','Aktif','2026-06-12 10:27:59'),(53,54,1,7,'admin1',5,'07:00','08:40','2026-07-17 17:00:00','Aktif','2026-07-04 10:40:47');
/*!40000 ALTER TABLE `scheduled_practicums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_id` int NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_perm` (`user_id`,`permission_id`),
  KEY `user_permissions_permission_id_permissions_id_fk` (`permission_id`),
  KEY `up_user_idx` (`user_id`),
  CONSTRAINT `user_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_user_id_users_identifier_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`identifier`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `role_id` int NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Active','Pending','Rejected','Pre-registered') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `batch` int DEFAULT NULL,
  `study_type` enum('Reguler','Hybrid') COLLATE utf8mb4_unicode_ci DEFAULT 'Reguler',
  `program_studi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Informatika',
  `dosen_pembimbing` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `custom_role_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`identifier`),
  KEY `role_idx` (`role_id`),
  KEY `batch_idx` (`batch`),
  CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'Aprilia Tri Purwandari, S.T., M.T.','-','-@student.uai.ac.id',NULL,'Active',NULL,'Reguler','Informatika','Budi Aribowo, S.T., M.Si.. M.Kom.','-',0,'2026-06-12 10:29:52'),(3,'Sopian Maulana','0','0@student.uai.ac.id',NULL,'Active',NULL,'Reguler','Informatika','Ahmad Chirzun, S.T., M.T.','0',0,'2026-07-04 10:39:30'),(3,'Sopian Maulana','0101516020','maulanasofyan30@gmail.com','$2b$10$lCvQozHtHSgbXFt06.KYnuq9pD8ag9CMIPmgtQkC0RWC.Ai0h8g0S','Active',2022,'Reguler','Teknik Industri','Ahmad Juang Pratama, S.T., M.Sc.',NULL,0,'2026-06-11 15:18:56'),(3,'Ratu Sabrina Fahira','0101523027','0101523027@student.uai.ac.id','$2b$10$1KYKeTcGjklcX1ONZFUyJ.CMsEmdGGZu7S8PLf35fdVqFNUJyRW8q','Active',2023,'Reguler','Teknik Industri','Dr. Nunung Nurhasanah, S.T., M.Si.',NULL,0,'2026-07-06 12:34:29'),(3,'Daffa Bintang Maulana','0101524003','0101524003@student.uai.ac.id','$2b$10$bDmGkNek9.2nI0Oy60fABeGR39YYMCkgqJdj7Ysox7hbA3qIFiDGa','Active',2024,'Reguler','Teknik Industri','Dr. Nunung Nurhasanah, S.T., M.Si.',NULL,0,'2026-06-23 12:57:47'),(3,'M Aji Junior Hakim','0101524008','0101524008@student.uai.ac.id','$2b$10$N7yMDwJ4oPW.TTq46R/Lk.EToNT0bt6EIX0BeylieV/SXFFxHyoGW','Active',2024,'Reguler','Teknik Industri','Widya Nurcahayanty Tanjung, S.T.,M.T.,M.B.A.',NULL,0,'2026-06-29 18:48:48'),(3,'Rizka Aprillia','0101524015','0101524015@uai.ac.id','$2b$10$Ud2sWjg1w.3pFwx3UhP56OeDexn4hbAyVapFe4xGRHjpj0OwqlO2q','Active',2024,'Reguler','Teknik Industri','Ahmad Juang Pratama, S.T., M.Sc.',NULL,0,'2026-07-02 15:54:02'),(3,'Muhamad Rifai','0101525007','muhamadrifai070806@gmail.com','$2b$10$sP4Gfv09nRicVxdoOGx2FuooexHjocgrXCskxXl4pVNwMpyL.Tb72','Active',2025,'Reguler','Teknik Industri','Ahmad Juang Pratama, S.T., M.Sc.',NULL,0,'2026-07-30 18:00:29'),(3,'Syahrul Syah Fadilah Ramadan','0101525012','0101525012@student.uai.ac.id','$2b$10$2w6F5XmXxp3PDcXahkZ/gOpP9URMelw5nEk5gOBlKPlDch846mHO6','Active',2025,'Reguler','Teknik Industri','Niken Parwati, S.T., M.M.',NULL,0,'2026-07-08 14:10:24'),(3,'Dygta Safira','0101525013','dygtasafira07@gmail.com','$2b$10$A52DKEE1qw4p3RW5zDslluSB7JHLDSCszWE.2H/O9zm5myu5yZ1jG','Active',2025,'Reguler','Teknik Industri','Dr. Tyara Puspaningrum, S.T.P., M.T.',NULL,0,'2026-07-30 17:46:35'),(2,'Dr. Nunung Nurhasanah, S.T., M.Si.','0301067402','nunungnurhasanah@uai.ac.id','$2b$10$2iGFR/mLH5fkYyIdae/f/efI7PVCszeQUc4V/58i7ppLnfQXBr/PK','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:01:27'),(2,'Widya Nurcahayanty Tanjung, S.T.,M.T.,M.B.A.','0301088403','widya@uai.ac.id','$2b$10$nQxlUA6sgFjHiptuOEfRXOH9WY8qUyA7JOG3RzPzBh6tuUPBdMttS','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:10:09'),(2,'Ahmad Juang Pratama, S.T., M.Sc.','0303117702','juang@uai.ac.id','$2b$10$6EAgABI0/1hGSfeemOp02uGTnIaQ.B7RLfJb7loT.L9qIlGIKsWfm','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:08:59'),(2,'Niken Parwati, S.T., M.M.','0313017204','niken.parwati@uai.ac.id','$2b$10$ktQ0b36FN3Vtblo//N90rOIpKTMFpvJ.lFYw5YuVUDLmWcwIw7lky','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:08:17'),(2,'Aprilia Tri Purwandari, S.T., M.T.','0324049104','aprilia@uai.ac.id','$2b$10$3sW1GlavXFZHHLknDIM1leCXgjdke8s6DcqBLwuixDyRqyCFeCJEa','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:02:17'),(2,'Ahmad Chirzun, S.T., M.T.','0324086705','chirzun@uai.ac.id','$2b$10$pRCyG4.fikaOBgAAQJtCuuOQM72MM2K2SvzMDRnzKQdVLLrbb6Uci','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:09:32'),(2,'Budi Aribowo, S.T., M.Si.. M.Kom.','0324087401','budiaribowo@uai.ac.id','$2b$10$DIeBz7XUriFYp7EGLhv2AeHKdu650SNy8H/3EkJUZoC4877P1KxtW','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:07:16'),(2,'Dr. Tyara Puspaningrum, S.T.P., M.T.','4551773674130022','tyara.puspaningrum@uai.ac.id','$2b$10$u14RiRkuxXNkyK.L6LOylOgJFS2CWnp2wEOoRvhrvsvpRN5vs5RAG','Active',NULL,'Reguler','Informatika',NULL,NULL,0,'2026-06-11 10:03:12'),(1,'Administrator','admin1','admin@lab.ac.id','$2b$10$9SXo92eW6s8oeeg7H6E0Keon55JhZkkqRCxP0HUAmbieOTKOchqsO','Active',NULL,'Reguler','Informatika','-','081200000000',0,'2026-05-05 09:14:12'),(1,'Administrator 2','admin2','admin02@lab.ac.id','$2b$10$9SXo92eW6s8oeeg7H6E0Keon55JhZkkqRCxP0HUAmbieOTKOchqsO','Active',NULL,'Reguler','Informatika','-','081200000002',0,'2026-05-05 09:14:12');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'lab_industri_fstuai'
--

--
-- Dumping routines for database 'lab_industri_fstuai'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-21 23:00:06
