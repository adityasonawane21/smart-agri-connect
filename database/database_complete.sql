-- Smart Agri Connect Complete Database Dump
-- Generated on 2026-09-10T04:07:12.683Z
-- Table creation and seed records (runs on current connected database)
SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('FARMER','BUYER') NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for users
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`, `created_at`) VALUES (1, 'aditya sonawane', 'adi@gmail.com', '1122334455', '$2b$10$qQxfNsVqg.QL8MRWoz7lCOYSlhe/UuwbZwqZapcQFl0M355WsWAay', 'FARMER', 'Mumbai', '2026-09-10 00:04:04');
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`, `created_at`) VALUES (2, 'pratham', 'pratham@gmail.com', '9988776655', '$2b$10$Wk3p2/isu8ARHLtaABkFKOKQRPO1ouXUS7lNNea2770HTNU3N.sh2', 'BUYER', 'Nashik', '2026-09-10 00:09:05');
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`, `created_at`) VALUES (3, 'shubham', 'shubham@gmail.com', '3366554477', '$2b$10$rVNOcrxXJ6.EWLTzS/P2X.lxyg9EBhHWDJJUjLna3.FN0IPJp/3.u', 'BUYER', 'thane', '2026-09-10 00:12:53');
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`, `created_at`) VALUES (4, 'nitin', 'nitin@gmail.com', '6552449955', '$2b$10$H74/sYeI5a8yHkxkWr7o1OWwIx/l4BLIiGzs6nYOUIthQTsmikK1u', 'FARMER', 'mulund', '2026-09-10 00:23:21');
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `location`, `created_at`) VALUES (5, 'suresh', 'suresh@gmail.com', '5588226644', '$2b$10$jo10OvgUGNm2HsAwPTrhKOZny746z9cDGGOgb6HwJwSzi4I6CoIti', 'FARMER', 'Mumbai', '2026-09-10 01:04:27');

-- Table structure for products
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int NOT NULL,
  `crop_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(20) DEFAULT 'KG',
  `price_per_unit` decimal(10,2) NOT NULL,
  `location` varchar(100) NOT NULL,
  `description` text,
  `available_from` date DEFAULT NULL,
  `status` enum('AVAILABLE','SOLD','INACTIVE') DEFAULT 'AVAILABLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `size` varchar(30) DEFAULT 'ANY',
  `quality` varchar(30) DEFAULT 'ANY',
  `condition_type` varchar(30) DEFAULT 'ANY',
  `image_url` text,
  PRIMARY KEY (`id`),
  KEY `farmer_id` (`farmer_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for products
INSERT INTO `products` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `location`, `description`, `available_from`, `status`, `created_at`, `size`, `quality`, `condition_type`, `image_url`) VALUES (1, 1, 'onion', '100.00', 'KG', '35.00', 'Mumbai', 'this is the top class onion my number is 1122334455', '2026-09-20 18:30:00', 'SOLD', '2026-09-10 00:07:48', 'MEDIUM', 'GRADE_A', 'STANDARD', '/uploads/1788998868679-297865342.jpg');
INSERT INTO `products` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `location`, `description`, `available_from`, `status`, `created_at`, `size`, `quality`, `condition_type`, `image_url`) VALUES (2, 1, 'tomato ', '50.00', 'KG', '35.00', 'Mumbai', 'this is the best one call me 445566883355', '2026-09-27 18:30:00', 'SOLD', '2026-09-10 00:59:58', 'MEDIUM', 'GRADE_A', 'STANDARD', '/uploads/1789001998716-837535859.jpg');
INSERT INTO `products` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `location`, `description`, `available_from`, `status`, `created_at`, `size`, `quality`, `condition_type`, `image_url`) VALUES (3, 4, 'tomato ', '50.00', 'KG', '30.00', 'mulund', 'call me at 5588663235', '2026-09-26 18:30:00', 'SOLD', '2026-09-10 01:02:48', 'MEDIUM', 'GRADE_A', 'STANDARD', '/uploads/1789002168066-533703908.jpg');
INSERT INTO `products` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `location`, `description`, `available_from`, `status`, `created_at`, `size`, `quality`, `condition_type`, `image_url`) VALUES (4, 5, 'tomato ', '200.00', 'KG', '40.00', 'Mumbai', 'it is the best one ', '2026-10-29 18:30:00', 'SOLD', '2026-09-10 01:05:32', 'MEDIUM', 'GRADE_A', 'FRESH', '/uploads/1789002332091-585774755.jpg');
INSERT INTO `products` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `location`, `description`, `available_from`, `status`, `created_at`, `size`, `quality`, `condition_type`, `image_url`) VALUES (5, 1, 'garlic ', '600.00', 'KG', '40.00', 'Mumbai', 'this gain lasun specficlly design for a best taste', '2026-09-29 18:30:00', 'AVAILABLE', '2026-09-10 03:47:27', 'MEDIUM', 'GRADE_A', 'STANDARD', '/uploads/1789012047743-518021089.webp');
INSERT INTO `products` (`id`, `farmer_id`, `crop_name`, `quantity`, `unit`, `price_per_unit`, `location`, `description`, `available_from`, `status`, `created_at`, `size`, `quality`, `condition_type`, `image_url`) VALUES (6, 1, 'garlic ', '100000.00', 'KG', '25.00', 'Nashik', 'hello', '2026-09-20 18:30:00', 'AVAILABLE', '2026-09-10 03:49:10', 'MEDIUM', 'GRADE_A', 'FRESH', NULL);

-- Table structure for buyer_demands
DROP TABLE IF EXISTS `buyer_demands`;
CREATE TABLE `buyer_demands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `crop_name` varchar(100) NOT NULL,
  `required_quantity` decimal(10,2) NOT NULL,
  `unit` varchar(20) DEFAULT 'KG',
  `destination` varchar(150) NOT NULL,
  `required_date` date NOT NULL,
  `max_price_per_unit` decimal(10,2) DEFAULT NULL,
  `status` enum('OPEN','PARTIALLY_FULFILLED','FULFILLED','CANCELLED') DEFAULT 'OPEN',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `preferred_size` varchar(30) DEFAULT 'ANY',
  `preferred_quality` varchar(30) DEFAULT 'ANY',
  `preferred_condition` varchar(30) DEFAULT 'ANY',
  `allow_mixed` tinyint(1) DEFAULT '1',
  `delivery_address` varchar(255) DEFAULT NULL,
  `delivery_contact_name` varchar(150) DEFAULT NULL,
  `delivery_phone` varchar(30) DEFAULT NULL,
  `delivery_lat` decimal(10,7) DEFAULT NULL,
  `delivery_lng` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `buyer_id` (`buyer_id`),
  CONSTRAINT `buyer_demands_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for buyer_demands
INSERT INTO `buyer_demands` (`id`, `buyer_id`, `crop_name`, `required_quantity`, `unit`, `destination`, `required_date`, `max_price_per_unit`, `status`, `created_at`, `preferred_size`, `preferred_quality`, `preferred_condition`, `allow_mixed`, `delivery_address`, `delivery_contact_name`, `delivery_phone`, `delivery_lat`, `delivery_lng`) VALUES (1, 2, 'tomato ', '1000.00', 'KG', 'Nashik', '2026-09-20 18:30:00', '35.00', 'FULFILLED', '2026-09-10 00:16:47', 'MEDIUM', 'GRADE_A', 'FRESH', 1, 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'pratham', '9988776655', NULL, NULL);
INSERT INTO `buyer_demands` (`id`, `buyer_id`, `crop_name`, `required_quantity`, `unit`, `destination`, `required_date`, `max_price_per_unit`, `status`, `created_at`, `preferred_size`, `preferred_quality`, `preferred_condition`, `allow_mixed`, `delivery_address`, `delivery_contact_name`, `delivery_phone`, `delivery_lat`, `delivery_lng`) VALUES (2, 2, 'garlic ', '1000.00', 'KG', 'Nashik', '2026-09-20 18:30:00', '34.86', 'OPEN', '2026-09-10 03:44:36', 'MEDIUM', 'GRADE_A', 'STANDARD', 1, 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'pratham', '9988776655', NULL, NULL);

-- Table structure for buyer_requests
DROP TABLE IF EXISTS `buyer_requests`;
CREATE TABLE `buyer_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `farmer_id` int NOT NULL,
  `product_id` int NOT NULL,
  `requested_quantity` decimal(10,2) NOT NULL,
  `offered_price_per_unit` decimal(10,2) NOT NULL,
  `destination` varchar(150) NOT NULL,
  `message` text,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_city` varchar(150) DEFAULT NULL,
  `delivery_address` varchar(255) DEFAULT NULL,
  `delivery_contact_name` varchar(150) DEFAULT NULL,
  `delivery_phone` varchar(30) DEFAULT NULL,
  `delivery_lat` decimal(10,7) DEFAULT NULL,
  `delivery_lng` decimal(10,7) DEFAULT NULL,
  `required_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `farmer_id` (`farmer_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `buyer_requests_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `buyer_requests_ibfk_2` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `buyer_requests_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for buyer_requests
INSERT INTO `buyer_requests` (`id`, `buyer_id`, `farmer_id`, `product_id`, `requested_quantity`, `offered_price_per_unit`, `destination`, `message`, `status`, `created_at`, `delivery_city`, `delivery_address`, `delivery_contact_name`, `delivery_phone`, `delivery_lat`, `delivery_lng`, `required_date`) VALUES (1, 2, 1, 1, '200.00', '35.00', 'Nashik', 'please be on time', 'ACCEPTED', '2026-09-10 00:10:07', 'Nashik', 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'pratham', '9988776655', NULL, NULL, '2026-09-26 18:30:00');
INSERT INTO `buyer_requests` (`id`, `buyer_id`, `farmer_id`, `product_id`, `requested_quantity`, `offered_price_per_unit`, `destination`, `message`, `status`, `created_at`, `delivery_city`, `delivery_address`, `delivery_contact_name`, `delivery_phone`, `delivery_lat`, `delivery_lng`, `required_date`) VALUES (2, 3, 1, 1, '200.00', '35.00', 'thane', 'on time plesase', 'ACCEPTED', '2026-09-10 00:13:53', 'thane', 'test address', 'shubham', '3366554477', NULL, NULL, '2026-09-24 18:30:00');

-- Table structure for farm_profiles
DROP TABLE IF EXISTS `farm_profiles`;
CREATE TABLE `farm_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `land_size` decimal(10,2) DEFAULT NULL,
  `soil_type` varchar(50) DEFAULT NULL,
  `soil_ph` decimal(4,2) DEFAULT NULL,
  `nitrogen` varchar(20) DEFAULT NULL,
  `phosphorus` varchar(20) DEFAULT NULL,
  `potassium` varchar(20) DEFAULT NULL,
  `water_availability` varchar(30) DEFAULT NULL,
  `irrigation_type` varchar(50) DEFAULT NULL,
  `current_season` varchar(30) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_farmer_profile` (`user_id`),
  CONSTRAINT `farm_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for shipments
DROP TABLE IF EXISTS `shipments`;
CREATE TABLE `shipments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_code` varchar(40) NOT NULL,
  `crop_name` varchar(100) NOT NULL,
  `destination_city` varchar(150) NOT NULL,
  `destination_address` varchar(255) DEFAULT NULL,
  `destination_lat` decimal(10,7) DEFAULT NULL,
  `destination_lng` decimal(10,7) DEFAULT NULL,
  `vehicle_capacity` decimal(10,2) NOT NULL DEFAULT '1200.00',
  `vehicle_number` varchar(50) DEFAULT NULL,
  `vehicle_type` varchar(100) DEFAULT 'Multi-produce delivery truck',
  `driver_name` varchar(150) DEFAULT NULL,
  `driver_phone` varchar(30) DEFAULT NULL,
  `status` enum('PLANNED','PACKED','READY_TO_DISPATCH','IN_TRANSIT','ARRIVED','DELIVERED','CANCELLED') DEFAULT 'PLANNED',
  `estimated_distance_km` decimal(10,2) DEFAULT '0.00',
  `estimated_minutes` int DEFAULT '0',
  `dispatch_at` datetime DEFAULT NULL,
  `eta` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `required_date` date DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `shipment_code` (`shipment_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for shipments
INSERT INTO `shipments` (`id`, `shipment_code`, `crop_name`, `destination_city`, `destination_address`, `destination_lat`, `destination_lng`, `vehicle_capacity`, `vehicle_number`, `vehicle_type`, `driver_name`, `driver_phone`, `status`, `estimated_distance_km`, `estimated_minutes`, `dispatch_at`, `eta`, `created_at`, `updated_at`, `required_date`, `total_amount`) VALUES (1, 'SHP-1788999039768-394', 'onion', 'Nashik', 'lal dongar taima devi mandir near st road chembur mumbai 400071', '20.0059000', '73.7910000', '1200.00', 'MH-04-2920', '1200 KG Multi-stop Truck', 'Assigned Driver', '9XXXXXXXXX', 'PACKED', '0.00', 0, NULL, NULL, '2026-09-10 00:10:39', '2026-09-10 00:47:51', '2026-09-24 18:30:00', '0.00');
INSERT INTO `shipments` (`id`, `shipment_code`, `crop_name`, `destination_city`, `destination_address`, `destination_lat`, `destination_lng`, `vehicle_capacity`, `vehicle_number`, `vehicle_type`, `driver_name`, `driver_phone`, `status`, `estimated_distance_km`, `estimated_minutes`, `dispatch_at`, `eta`, `created_at`, `updated_at`, `required_date`, `total_amount`) VALUES (2, 'SHP-1788999276613-875', 'onion', 'thane', 'test address', '19.2183000', '72.9781000', '1200.00', 'MH-04-6054', '1200 KG Multi-stop Truck', 'Assigned Driver', '9XXXXXXXXX', 'PLANNED', '0.00', 0, NULL, NULL, '2026-09-10 00:14:36', '2026-09-10 00:14:36', '2026-09-22 18:30:00', '0.00');
INSERT INTO `shipments` (`id`, `shipment_code`, `crop_name`, `destination_city`, `destination_address`, `destination_lat`, `destination_lng`, `vehicle_capacity`, `vehicle_number`, `vehicle_type`, `driver_name`, `driver_phone`, `status`, `estimated_distance_km`, `estimated_minutes`, `dispatch_at`, `eta`, `created_at`, `updated_at`, `required_date`, `total_amount`) VALUES (3, 'SHP-1789002402931-309', 'tomato ', 'Nashik', 'lal dongar taima devi mandir near st road chembur mumbai 400071', '20.0059000', '73.7910000', '1200.00', 'MH-04-3131', '1200 KG Multi-stop Truck', 'Assigned Driver', '9XXXXXXXXX', 'PLANNED', '103.00', 137, NULL, '2026-09-10 03:23:42', '2026-09-10 01:06:42', '2026-09-10 01:07:11', '2026-09-18 18:30:00', '0.00');

-- Table structure for orders
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `status` varchar(40) DEFAULT 'ACCEPTED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `buyer_request_id` int DEFAULT NULL,
  `supply_offer_id` int DEFAULT NULL,
  `demand_id` int DEFAULT NULL,
  `shipment_id` int DEFAULT NULL,
  `delivery_address` varchar(255) DEFAULT NULL,
  `delivery_city` varchar(150) DEFAULT NULL,
  `buyer_contact_name` varchar(150) DEFAULT NULL,
  `buyer_phone` varchar(30) DEFAULT NULL,
  `farmer_phone` varchar(30) DEFAULT NULL,
  `required_date` date DEFAULT NULL,
  `order_code` varchar(50) DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `crop_name` varchar(100) DEFAULT NULL,
  `unit` varchar(20) DEFAULT 'KG',
  `price_per_unit` decimal(10,2) DEFAULT '0.00',
  `order_value` decimal(12,2) DEFAULT '0.00',
  `pickup_location` varchar(150) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `buyer_id` (`buyer_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for orders
INSERT INTO `orders` (`id`, `buyer_id`, `product_id`, `quantity`, `total_amount`, `status`, `created_at`, `buyer_request_id`, `supply_offer_id`, `demand_id`, `shipment_id`, `delivery_address`, `delivery_city`, `buyer_contact_name`, `buyer_phone`, `farmer_phone`, `required_date`, `order_code`, `farmer_id`, `crop_name`, `unit`, `price_per_unit`, `order_value`, `pickup_location`, `updated_at`) VALUES (1, 2, 1, '200.00', '7000.00', 'PACKED', '2026-09-10 00:10:39', 1, NULL, NULL, 1, 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'Nashik', 'pratham', '9988776655', '1122334455', '2026-09-25 18:30:00', 'ORD-1788999039759-559', 1, 'onion', 'KG', '35.00', '7000.00', 'Mumbai', '2026-09-10 00:47:51');
INSERT INTO `orders` (`id`, `buyer_id`, `product_id`, `quantity`, `total_amount`, `status`, `created_at`, `buyer_request_id`, `supply_offer_id`, `demand_id`, `shipment_id`, `delivery_address`, `delivery_city`, `buyer_contact_name`, `buyer_phone`, `farmer_phone`, `required_date`, `order_code`, `farmer_id`, `crop_name`, `unit`, `price_per_unit`, `order_value`, `pickup_location`, `updated_at`) VALUES (2, 3, 1, '200.00', '7000.00', 'ACCEPTED', '2026-09-10 00:14:36', 2, NULL, NULL, 2, 'test address', 'thane', 'shubham', '3366554477', '1122334455', '2026-09-23 18:30:00', 'ORD-1788999276609-401', 1, 'onion', 'KG', '35.00', '7000.00', 'Mumbai', '2026-09-10 00:14:36');
INSERT INTO `orders` (`id`, `buyer_id`, `product_id`, `quantity`, `total_amount`, `status`, `created_at`, `buyer_request_id`, `supply_offer_id`, `demand_id`, `shipment_id`, `delivery_address`, `delivery_city`, `buyer_contact_name`, `buyer_phone`, `farmer_phone`, `required_date`, `order_code`, `farmer_id`, `crop_name`, `unit`, `price_per_unit`, `order_value`, `pickup_location`, `updated_at`) VALUES (3, 2, 2, '350.00', '12250.00', 'ACCEPTED', '2026-09-10 01:06:42', NULL, 1, 1, 3, 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'Nashik', 'pratham', '9988776655', '1122334455', '2026-09-19 18:30:00', 'ORD-1789002402927-683', 1, 'tomato ', 'KG', '35.00', '12250.00', 'Mumbai', '2026-09-10 01:06:42');
INSERT INTO `orders` (`id`, `buyer_id`, `product_id`, `quantity`, `total_amount`, `status`, `created_at`, `buyer_request_id`, `supply_offer_id`, `demand_id`, `shipment_id`, `delivery_address`, `delivery_city`, `buyer_contact_name`, `buyer_phone`, `farmer_phone`, `required_date`, `order_code`, `farmer_id`, `crop_name`, `unit`, `price_per_unit`, `order_value`, `pickup_location`, `updated_at`) VALUES (4, 2, 3, '350.00', '12250.00', 'ACCEPTED', '2026-09-10 01:06:50', NULL, 2, 1, 3, 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'Nashik', 'pratham', '9988776655', '6552449955', '2026-09-19 18:30:00', 'ORD-1789002410620-33', 4, 'tomato ', 'KG', '35.00', '12250.00', 'mulund', '2026-09-10 01:06:50');
INSERT INTO `orders` (`id`, `buyer_id`, `product_id`, `quantity`, `total_amount`, `status`, `created_at`, `buyer_request_id`, `supply_offer_id`, `demand_id`, `shipment_id`, `delivery_address`, `delivery_city`, `buyer_contact_name`, `buyer_phone`, `farmer_phone`, `required_date`, `order_code`, `farmer_id`, `crop_name`, `unit`, `price_per_unit`, `order_value`, `pickup_location`, `updated_at`) VALUES (5, 2, 4, '300.00', '10500.00', 'ACCEPTED', '2026-09-10 01:07:11', NULL, 3, 1, 3, 'lal dongar taima devi mandir near st road chembur mumbai 400071', 'Nashik', 'pratham', '9988776655', '5588226644', '2026-09-19 18:30:00', 'ORD-1789002431992-766', 5, 'tomato ', 'KG', '35.00', '10500.00', 'Mumbai', '2026-09-10 01:07:11');

-- Table structure for order_status_history
DROP TABLE IF EXISTS `order_status_history`;
CREATE TABLE `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `status` varchar(40) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_history_order` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for order_status_history
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `note`, `changed_by`, `created_at`) VALUES (1, 1, 'ACCEPTED', 'Order created after farmer/buyer confirmation.', 1, '2026-09-10 00:10:39');
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `note`, `changed_by`, `created_at`) VALUES (2, 2, 'ACCEPTED', 'Order created after farmer/buyer confirmation.', 1, '2026-09-10 00:14:36');
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `note`, `changed_by`, `created_at`) VALUES (3, 1, 'PACKED', 'Order moved to PACKED.', 1, '2026-09-10 00:47:51');
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `note`, `changed_by`, `created_at`) VALUES (4, 3, 'ACCEPTED', 'Order created after farmer/buyer confirmation.', 1, '2026-09-10 01:06:42');
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `note`, `changed_by`, `created_at`) VALUES (5, 4, 'ACCEPTED', 'Order created after farmer/buyer confirmation.', 4, '2026-09-10 01:06:50');
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `note`, `changed_by`, `created_at`) VALUES (6, 5, 'ACCEPTED', 'Order created after farmer/buyer confirmation.', 5, '2026-09-10 01:07:11');

-- Table structure for market_intelligence
DROP TABLE IF EXISTS `market_intelligence`;
CREATE TABLE `market_intelligence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `crop_name` varchar(100) NOT NULL,
  `market_name` varchar(100) NOT NULL,
  `market_location` varchar(100) NOT NULL,
  `price_per_kg` decimal(10,2) NOT NULL,
  `min_price_per_kg` decimal(10,2) NOT NULL,
  `max_price_per_kg` decimal(10,2) NOT NULL,
  `demand_level` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  `demand_score` int DEFAULT '50',
  `trend_percent` decimal(6,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for market_intelligence
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (1, 'onion', 'Vashi APMC', 'Mumbai', '32.00', '28.00', '36.00', 'HIGH', 92, '8.50', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (2, 'onion', 'Pune Market Yard', 'Pune', '29.00', '25.00', '33.00', 'MEDIUM', 68, '3.20', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (3, 'onion', 'Nashik Market', 'Nashik', '27.00', '24.00', '30.00', 'MEDIUM', 61, '1.50', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (4, 'onion', 'Thane Market', 'Thane', '31.00', '27.00', '35.00', 'HIGH', 86, '6.70', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (5, 'onion', 'Nagpur Market', 'Nagpur', '26.00', '23.00', '29.00', 'LOW', 42, '-2.10', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (6, 'tomato', 'Vashi APMC', 'Mumbai', '38.00', '32.00', '44.00', 'HIGH', 94, '9.10', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (7, 'tomato', 'Pune Market Yard', 'Pune', '34.00', '29.00', '39.00', 'MEDIUM', 71, '4.60', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (8, 'tomato', 'Nashik Market', 'Nashik', '30.00', '26.00', '35.00', 'MEDIUM', 63, '2.20', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (9, 'tomato', 'Thane Market', 'Thane', '37.00', '31.00', '43.00', 'HIGH', 88, '7.50', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (10, 'tomato', 'Nagpur Market', 'Nagpur', '28.00', '24.00', '32.00', 'LOW', 39, '-1.80', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (11, 'potato', 'Vashi APMC', 'Mumbai', '24.00', '20.00', '27.00', 'HIGH', 89, '5.80', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (12, 'potato', 'Pune Market Yard', 'Pune', '22.00', '19.00', '25.00', 'MEDIUM', 65, '2.90', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (13, 'potato', 'Nashik Market', 'Nashik', '21.00', '18.00', '24.00', 'MEDIUM', 60, '1.40', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (14, 'potato', 'Thane Market', 'Thane', '23.00', '20.00', '26.00', 'HIGH', 84, '4.90', '2026-09-09 20:31:42');
INSERT INTO `market_intelligence` (`id`, `crop_name`, `market_name`, `market_location`, `price_per_kg`, `min_price_per_kg`, `max_price_per_kg`, `demand_level`, `demand_score`, `trend_percent`, `updated_at`) VALUES (15, 'potato', 'Nagpur Market', 'Nagpur', '19.00', '17.00', '22.00', 'LOW', 45, '-1.20', '2026-09-09 20:31:42');

-- Table structure for supply_offers
DROP TABLE IF EXISTS `supply_offers`;
CREATE TABLE `supply_offers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demand_id` int NOT NULL,
  `farmer_id` int NOT NULL,
  `product_id` int NOT NULL,
  `offered_quantity` decimal(10,2) NOT NULL,
  `offered_price_per_unit` decimal(10,2) NOT NULL,
  `message` text,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `demand_id` (`demand_id`),
  KEY `farmer_id` (`farmer_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `supply_offers_ibfk_1` FOREIGN KEY (`demand_id`) REFERENCES `buyer_demands` (`id`),
  CONSTRAINT `supply_offers_ibfk_2` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `supply_offers_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for supply_offers
INSERT INTO `supply_offers` (`id`, `demand_id`, `farmer_id`, `product_id`, `offered_quantity`, `offered_price_per_unit`, `message`, `status`, `created_at`) VALUES (1, 1, 1, 2, '350.00', '35.00', 'it is the best deal ever for you ', 'ACCEPTED', '2026-09-10 01:00:44');
INSERT INTO `supply_offers` (`id`, `demand_id`, `farmer_id`, `product_id`, `offered_quantity`, `offered_price_per_unit`, `message`, `status`, `created_at`) VALUES (2, 1, 4, 3, '350.00', '35.00', 'i can supply it ', 'ACCEPTED', '2026-09-10 01:03:30');
INSERT INTO `supply_offers` (`id`, `demand_id`, `farmer_id`, `product_id`, `offered_quantity`, `offered_price_per_unit`, `message`, `status`, `created_at`) VALUES (3, 1, 5, 4, '300.00', '35.00', 'it is the best from the here', 'ACCEPTED', '2026-09-10 01:06:15');

SET FOREIGN_KEY_CHECKS = 1;
