-- Smart Agri Connect — additive migration for the existing smart_agri_connect database.
-- IMPORTANT: This file NEVER drops or truncates existing tables.
-- The Node backend also performs the same additive checks automatically at startup.

USE smart_agri_connect;

CREATE TABLE IF NOT EXISTS buyer_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  buyer_id INT NOT NULL, farmer_id INT NOT NULL, product_id INT NOT NULL,
  requested_quantity DECIMAL(10,2) NOT NULL,
  offered_price_per_unit DECIMAL(10,2) NOT NULL,
  destination VARCHAR(150), delivery_city VARCHAR(150), delivery_address VARCHAR(255),
  delivery_contact_name VARCHAR(150), delivery_phone VARCHAR(30),
  delivery_lat DECIMAL(10,7), delivery_lng DECIMAL(10,7), required_date DATE,
  message TEXT, status ENUM('PENDING','ACCEPTED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shipment_code VARCHAR(40) UNIQUE NOT NULL,
  crop_name VARCHAR(100) NOT NULL,
  destination_city VARCHAR(150) NOT NULL,
  destination_address VARCHAR(255),
  destination_lat DECIMAL(10,7), destination_lng DECIMAL(10,7),
  vehicle_capacity DECIMAL(10,2) NOT NULL DEFAULT 1200,
  vehicle_number VARCHAR(50), vehicle_type VARCHAR(100) DEFAULT 'Multi-produce delivery truck',
  driver_name VARCHAR(150), driver_phone VARCHAR(30),
  status ENUM('PLANNED','PACKED','READY_TO_DISPATCH','IN_TRANSIT','ARRIVED','DELIVERED','CANCELLED') DEFAULT 'PLANNED',
  estimated_distance_km DECIMAL(10,2) DEFAULT 0, estimated_minutes INT DEFAULT 0,
  required_date DATE,
  dispatch_at DATETIME, eta DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_code VARCHAR(40) UNIQUE NOT NULL,
  buyer_id INT NOT NULL, farmer_id INT NOT NULL, product_id INT NOT NULL,
  buyer_request_id INT DEFAULT NULL, supply_offer_id INT DEFAULT NULL, demand_id INT DEFAULT NULL, shipment_id INT DEFAULT NULL,
  crop_name VARCHAR(100) NOT NULL, quantity DECIMAL(10,2) NOT NULL, unit VARCHAR(20) NOT NULL DEFAULT 'KG',
  price_per_unit DECIMAL(10,2) NOT NULL, order_value DECIMAL(12,2) NOT NULL,
  pickup_location VARCHAR(150), delivery_city VARCHAR(150), delivery_address VARCHAR(255),
  buyer_contact_name VARCHAR(150), buyer_phone VARCHAR(30), farmer_phone VARCHAR(30), required_date DATE,
  status ENUM('ACCEPTED','PACKED','READY_TO_DISPATCH','IN_TRANSIT','ARRIVED','DELIVERED','CANCELLED') DEFAULT 'ACCEPTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_buyer (buyer_id), INDEX idx_orders_farmer (farmer_id), INDEX idx_orders_shipment (shipment_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL, status VARCHAR(40) NOT NULL, note VARCHAR(255), changed_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_history_order (order_id)
);

-- Existing buyer_demands should also have delivery details. Run only if your MySQL version does not support IF NOT EXISTS on ALTER:
-- ALTER TABLE buyer_demands ADD COLUMN delivery_address VARCHAR(255);
-- ALTER TABLE buyer_demands ADD COLUMN delivery_contact_name VARCHAR(150);
-- ALTER TABLE buyer_demands ADD COLUMN delivery_phone VARCHAR(30);
-- ALTER TABLE buyer_demands ADD COLUMN delivery_lat DECIMAL(10,7);
-- ALTER TABLE buyer_demands ADD COLUMN delivery_lng DECIMAL(10,7);
