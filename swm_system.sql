-- Database: swm_system
-- Converted to SQLite3

BEGIN TRANSACTION;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `role` TEXT NOT NULL DEFAULT 'general' CHECK(role IN ('admin','general')),
  `name` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--
-- Dumping data for table `users`
--

-- Users are now seeded from .env via setup_db.js

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` TEXT PRIMARY KEY,
  `customer_name` TEXT NOT NULL,
  `job_type` TEXT NOT NULL DEFAULT 'General',
  `subtotal` REAL NOT NULL DEFAULT 0.00,
  `vat` REAL NOT NULL DEFAULT 0.00,
  `estimated_price` REAL NOT NULL DEFAULT 0.00,
  `status` TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','In Progress','Completed','Delivered','Cancelled')),
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL
);

-- --------------------------------------------------------

--
-- Table structure for table `job_items`
--

DROP TABLE IF EXISTS `job_items`;
CREATE TABLE `job_items` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `job_id` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `price` REAL NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE
);

COMMIT;
