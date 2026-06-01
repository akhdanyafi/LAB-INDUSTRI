-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: lab_industri_fstuai
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'IF101','Algoritma Pemrograman','Dasar-dasar algoritma dan pemrograman komputer.',3,'Ganjil','DSN001','2026-05-05 09:14:12'),(2,'IF102','Struktur Data','Konsep dan implementasi struktur data: array, linked list, tree, graph.',3,'Ganjil','DSN002','2026-05-05 09:14:12'),(3,'IF201','Basis Data','Perancangan dan implementasi basis data relasional.',3,'Ganjil','DSN003','2026-05-05 09:14:12'),(4,'IF202','Jaringan Komputer','Konsep jaringan komputer, protokol, dan implementasi.',3,'Ganjil','DSN001','2026-05-05 09:14:12'),(5,'IF301','Rekayasa Perangkat Lunak','Metodologi pengembangan perangkat lunak dan software engineering.',3,'Genap','DSN002','2026-05-05 09:14:12'),(6,'IF302','Kriptografi','Konsep dan implementasi algoritma kriptografi modern.',3,'Genap','DSN003','2026-05-05 09:14:12'),(7,'IF303','Keamanan Komputer','Prinsip keamanan komputer, ethical hacking, dan cyber security.',3,'Genap','DSN001','2026-05-05 09:14:12'),(8,'IF401','Komputasi Awan','Cloud computing: IaaS, PaaS, SaaS, dan deployment.',3,'Ganjil','DSN002','2026-05-05 09:14:12'),(9,'IF402','Web Dinamis','Pengembangan aplikasi web dinamis dengan framework modern.',3,'Genap','DSN003','2026-05-05 09:14:12'),(10,'IF403','Web Semantik','Konsep semantic web, ontologi, dan linked data.',3,'Genap','DSN001','2026-05-05 09:14:12');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `governance_docs`
--

LOCK TABLES `governance_docs` WRITE;
/*!40000 ALTER TABLE `governance_docs` DISABLE KEYS */;
INSERT INTO `governance_docs` VALUES (1,'admin1','SOP Inventarisir alat dan bahan','/uploads/governance/1779246315575-478767964-001_-_Inventarisir_alat_dan_bahan.pdf','/uploads/governance/cover-1779246820559-874731580-ChatGPT_Image_20_Mei_2026__10.13.29.png','SOP','2026-05-20 10:05:15'),(2,'admin1','SOP  Penggunaan Alat-Laboratorium','/uploads/governance/1779246428866-179834217-003_-_Penggunaan_Alat-Laboratorium_done.pdf','/uploads/governance/cover-1779247157785-134378882-ChatGPT_Image_20_Mei_2026__10.19.05.png','SOP','2026-05-20 10:07:08'),(4,'admin1','SOP Kegiatan Praktikum','/uploads/governance/1779246462459-807380631-002_-_Kegiatan_Praktikum_done.pdf','/uploads/governance/cover-1779246925412-572450880-ChatGPT_Image_20_Mei_2026__10.15.15.png','SOP','2026-05-20 10:07:42'),(5,'admin1','SOP Rekrutment Asisten Praktikum','/uploads/governance/1779247385691-12230068-004_-_Rekrutmen_Asisten_Praktikum_done.pdf','/uploads/governance/cover-1779247385691-12230068-ChatGPT_Image_20_Mei_2026__10.22.16.png','SOP','2026-05-20 10:23:05');
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
-- Table structure for table `item_categories`
--

DROP TABLE IF EXISTS `item_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_categories`
--

LOCK TABLES `item_categories` WRITE;
/*!40000 ALTER TABLE `item_categories` DISABLE KEYS */;
INSERT INTO `item_categories` VALUES (1,'Laptop'),(2,'Proyektor'),(3,'Kamera'),(4,'Mikrofon'),(5,'Peralatan Jaringan'),(6,'Komputer');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_loans`
--

LOCK TABLES `item_loans` WRITE;
/*!40000 ALTER TABLE `item_loans` DISABLE KEYS */;
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
  `status` enum('Tersedia','Dipinjam','Maintenance') COLLATE utf8mb4_unicode_ci DEFAULT 'Tersedia',
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_qr_code_unique` (`qr_code`),
  KEY `category_idx` (`category_id`),
  KEY `room_idx` (`room_id`),
  CONSTRAINT `items_category_id_item_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `items_room_id_rooms_id_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_attendance`
--

LOCK TABLES `lab_attendance` WRITE;
/*!40000 ALTER TABLE `lab_attendance` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.admin','Akses Dashboard Admin','General',NULL),(2,'dashboard.lecturer','Akses Dashboard Dosen','General',NULL),(3,'loans.manage','Validasi Peminjaman Alat','Loans',NULL),(4,'bookings.manage','Validasi Booking Ruangan','Bookings',NULL),(5,'users.manage','Manajemen Akun & Hak Akses','Users',NULL),(6,'inventory.manage','Manajemen Inventaris Alat','Inventory',NULL),(7,'courses.manage','Manajemen Mata Kuliah','Academic',NULL),(8,'practicum.manage','Manajemen Modul & Jadwal Praktikum','Academic',NULL),(9,'publications.manage','Manajemen Publikasi','Publications',NULL),(10,'governance.manage','Manajemen SOP & Laporan LPJ','Governance',NULL),(11,'download-center.manage','Kelola Pusat Download','Download Center',NULL),(12,'hero.manage','Kelola Hero Photos','Hero',NULL);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practicum_modules`
--

LOCK TABLES `practicum_modules` WRITE;
/*!40000 ALTER TABLE `practicum_modules` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,4),(5,1,5),(6,1,6),(7,1,7),(8,1,8),(9,1,9),(10,1,10),(11,1,11),(12,1,12),(13,2,2),(14,2,7),(15,2,8),(16,2,9);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_bookings`
--

LOCK TABLES `room_bookings` WRITE;
/*!40000 ALTER TABLE `room_bookings` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Laboratorium Optimasi dan Simulasi','Lantai 6',20,'Tersedia'),(2,'Laboratorium Perancangan Sistem Kerja','Lantai 6',11,'Tersedia'),(3,'Staff Laboratorium','Lantai 6',4,'Tersedia'),(4,'Laboratorium Ergonomi','Lantai B1',4,'Tersedia'),(5,'Laboratorium Menggambar Teknik','Lantai B1',10,'Tersedia'),(6,'Laboratorium Proses Manufaktur','Lantai b1',10,'Tersedia');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_practicums`
--

LOCK TABLES `scheduled_practicums` WRITE;
/*!40000 ALTER TABLE `scheduled_practicums` DISABLE KEYS */;
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
INSERT INTO `users` VALUES (1,'Administrator','admin1','admin@lab.ac.id','$2b$10$9SXo92eW6s8oeeg7H6E0Keon55JhZkkqRCxP0HUAmbieOTKOchqsO','Active',NULL,'Reguler','Informatika','-','081200000000',0,'2026-05-05 09:14:12'),(1,'Administrator 2','admin2','admin02@lab.ac.id','$2b$10$9SXo92eW6s8oeeg7H6E0Keon55JhZkkqRCxP0HUAmbieOTKOchqsO','Active',NULL,'Reguler','Informatika','-','081200000002',0,'2026-05-05 09:14:12'),(2,'Dr. Ir Winangsari Pradani, M.T.','DSN001','dosen1@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000001',0,'2026-05-05 09:14:12'),(2,'Andi Arniaty, Ph.D','DSN002','dosen2@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000002',0,'2026-05-05 09:14:12'),(2,'Ir. Endang Ripmiatin, M.T.','DSN003','dosen3@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000003',0,'2026-05-05 09:14:12'),(2,'Dr. Ir. Ade Jamal, M.T.','DSN004','dosen4@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000004',0,'2026-05-05 09:14:12'),(2,'Denny Hermawan S.T., M.Kom.','DSN005','dosen5@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000005',0,'2026-05-05 09:14:12'),(2,'Riri Safitri, S.Si., M.T.','DSN006','dosen6@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000006',0,'2026-05-05 09:14:12'),(2,'Doddy Haryadi, S.T., M.T.I.','DSN007','dosen7@lab.ac.id','$2b$10$J65/Dy2knpS1is4NQOiVweq5amn3YaaBSmVMsekgGB7dKda7T5pJG','Active',NULL,'Reguler','Informatika','-','08121000007',0,'2026-05-05 09:14:12');
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

-- Dump completed on 2026-06-01 23:00:12
