const express = require("express");
const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// =====================================================
// IMAGE UPLOAD
// =====================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);

    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only image files are allowed.")),
});

// =====================================================
// DATABASE
// =====================================================

function getDbConfig() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (url) {
    const config = { uri: url, multipleStatements: true };
    if (process.env.DB_SSL !== "false") {
      config.ssl = { rejectUnauthorized: false };
    }
    return config;
  }

  const host = process.env.DB_HOST || "localhost";
  const isRemote = host !== "localhost" && host !== "127.0.0.1";
  const useSsl =
    process.env.DB_SSL === "true" ||
    (isRemote && process.env.DB_SSL !== "false");

  const config = {
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password:
      process.env.DB_PASSWORD !== undefined
        ? process.env.DB_PASSWORD
        : "root",
    database: process.env.DB_NAME || "smart_agri_connect",
    multipleStatements: true,
  };

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const dbConfig = getDbConfig();
console.log(
  `Database target: ${dbConfig.uri ? "configured URL" : `${dbConfig.host}/${dbConfig.database}`}`
);
const db = dbConfig.uri
  ? mysql.createConnection(
      dbConfig.uri +
        (dbConfig.uri.includes("?") ? "&" : "?") +
        "multipleStatements=true"
    )
  : mysql.createConnection(dbConfig);

const API_PORT = process.env.PORT || 5000;
const VEHICLE_CAPACITY = 1200;

// =====================================================
// CITY COORDINATES
// =====================================================

const cityCoordinates = {
  mumbai: {
    lat: 19.076,
    lng: 72.8777,
  },

  "navi mumbai": {
    lat: 19.033,
    lng: 73.0297,
  },

  thane: {
    lat: 19.2183,
    lng: 72.9781,
  },

  nashik: {
    lat: 20.0059,
    lng: 73.791,
  },

  pune: {
    lat: 18.5204,
    lng: 73.8567,
  },

  surat: {
    lat: 21.1702,
    lng: 72.8311,
  },

  ahmedabad: {
    lat: 23.0225,
    lng: 72.5714,
  },

  nagpur: {
    lat: 21.1458,
    lng: 79.0882,
  },

  // Agricultural Markets & APMC Hubs
  "nashik apmc": {
    lat: 20.0123,
    lng: 73.7891,
  },

  "pune market yard": {
    lat: 18.4984,
    lng: 73.8647,
  },

  "vashi apmc": {
    lat: 19.0759,
    lng: 73.0033,
  },

  "mumbai wholesale market": {
    lat: 19.033,
    lng: 72.86,
  },

  "dadar market": {
    lat: 19.0178,
    lng: 72.8478,
  },

  lasalgaon: {
    lat: 20.1478,
    lng: 74.2289,
  },

  pimpalgaon: {
    lat: 20.1704,
    lng: 73.9854,
  },

  baramati: {
    lat: 18.1517,
    lng: 74.5772,
  },

  sangli: {
    lat: 16.8524,
    lng: 74.5815,
  },

  kolhapur: {
    lat: 16.705,
    lng: 74.2433,
  },

  kalyan: {
    lat: 19.2403,
    lng: 73.1305,
  },

  jalgaon: {
    lat: 21.0077,
    lng: 75.5626,
  },

  jalgaow: {
    lat: 21.0077,
    lng: 75.5626,
  },

  mulund: {
    lat: 19.1726,
    lng: 72.9565,
  },
};

// =====================================================
// HELPERS
// =====================================================

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const toNum = (value, fallback = 0) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
};

const cleanDate = (value) => {
  if (!value) return null;

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  const raw = String(value).trim();

  if (!raw) return null;

  const iso =
    raw.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  if (iso) {
    return iso[1];
  }

  const legacy =
    raw.match(
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Za-z]{3})\s+(\d{1,2})$/i
    );

  if (legacy) {
    const parsed =
      new Date(
        `${legacy[1]} ${legacy[2]}, ${new Date().getFullYear()}`
      );

  if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed
        .toISOString()
        .slice(0, 10);
    }
  }

  const parsed =
    new Date(raw);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return parsed
      .toISOString()
      .slice(0, 10);
  }

  return null;
};

// =====================================================
// COORDINATES
// =====================================================

function getCoordinates(
  location,
  lat,
  lng
) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat !== 0 &&
    nLng !== 0
  ) {
    return {
      lat: nLat,
      lng: nLng,
    };
  }

  const norm = normalize(location);
  if (cityCoordinates[norm]) {
    return cityCoordinates[norm];
  }

  for (const [key, coord] of Object.entries(cityCoordinates)) {
    if (norm.includes(key)) {
      return coord;
    }
  }

  return null;
}

// =====================================================
// HAVERSINE
// =====================================================

function haversineDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) /
    180;

  const dLon =
    ((lon2 - lon1) * Math.PI) /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

// =====================================================
// ROUTE DISTANCE
// =====================================================

function routeDistance(
  from,
  to
) {
  const a =
    getCoordinates(from);

  const b =
    getCoordinates(to);

  if (!a || !b) {
    return 50;
  }

  return Math.max(
    1,
    haversineDistance(
      a.lat,
      a.lng,
      b.lat,
      b.lng
    ) * 1.2
  );
}

// =====================================================
// ROUTE ESTIMATION
// =====================================================

function estimateRoute(
  points
) {
  if (!points.length) {
    return [];
  }

  const destination =
    points.find(
      (p) =>
        p.type === "DELIVERY"
    );

  const pickups =
    points.filter(
      (p) =>
        p.type === "PICKUP"
    );

  if (!destination) {
    return points;
  }

  pickups.sort(
    (a, b) =>
      routeDistance(
        b.location,
        destination.location
      ) -
      routeDistance(
        a.location,
        destination.location
      )
  );

  const ordered = [];

  let current =
    pickups.length
      ? pickups[0].location
      : destination.location;

  for (
    const point of pickups
  ) {
    if (
      ordered.length === 0
    ) {
      point.distance_from_previous_km =
        0;
    } else {
      point.distance_from_previous_km =
        Number(
          routeDistance(
            current,
            point.location
          ).toFixed(1)
        );
    }

    ordered.push(point);

    current =
      point.location;
  }

  if (pickups.length) {
    destination.distance_from_previous_km =
      Number(
        routeDistance(
          current,
          destination.location
        ).toFixed(1)
      );
  }

  ordered.push(
    destination
  );

  return ordered.map(
    (p, i) => ({
      ...p,
      stop: i + 1,
    })
  );
}

// =====================================================
// DATABASE QUERY
// =====================================================

async function query(
  sql,
  params = []
) {
  const [rows] =
    await db
      .promise()
      .query(
        sql,
        params
      );

  return rows;
}

// =====================================================
// TABLE / COLUMN HELPERS
// =====================================================

async function tableExists(
  table
) {
  const rows =
    await query(
      `
        SELECT COUNT(*) AS c
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name = ?
      `,
      [table]
    );

  return (
    rows[0].c > 0
  );
}

async function columnExists(
  table,
  column
) {
  const rows =
    await query(
      `
        SELECT COUNT(*) AS c
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      `,
      [
        table,
        column,
      ]
    );

  return (
    rows[0].c > 0
  );
}

async function ensureColumn(
  table,
  column,
  definition
) {
  if (
    !(await columnExists(
      table,
      column
    ))
  ) {
    await query(
      `
        ALTER TABLE \`${table}\`
        ADD COLUMN \`${column}\`
        ${definition}
      `
    );

    console.log(
      `Added missing column ${table}.${column}`
    );
  }
}

// =====================================================
// DATABASE AUTO-SEED
// =====================================================

async function autoSeedDatabaseIfEmpty() {
  try {
    const hasUsers = await tableExists("users");
    if (!hasUsers) {
      console.log(
        "No existing tables found. Running automatic database initialization from database_complete.sql..."
      );
      const sqlPath = path.join(
        __dirname,
        "../database/database_complete.sql"
      );
      if (fs.existsSync(sqlPath)) {
        // TiDB is MySQL-compatible but does not accept MySQL 8's
        // utf8mb4_0900_ai_ci collation used by dumps from local MySQL.
        // Normalize it so a clean cloud database can be initialized.
        const sqlContent = fs.readFileSync(
          sqlPath,
          "utf-8"
        ).replaceAll(
          "utf8mb4_0900_ai_ci",
          "utf8mb4_unicode_ci"
        );
        await db.promise().query(sqlContent);
        console.log(
          "Database successfully seeded with full schema and initial records!"
        );
      } else {
        console.warn(
          "database_complete.sql not found at:",
          sqlPath
        );
      }
    } else {
      console.log(
        "Database tables verified. Preserving existing records."
      );
    }
  } catch (error) {
    console.error(
      "Auto-seeding error:",
      error.message
    );
  }
}

// =====================================================
// DATABASE SCHEMA
// =====================================================

async function ensureSchema() {
  // Existing project tables are never dropped.

  // ===================================================
  // BUYER REQUESTS
  // ===================================================

  await query(`
    CREATE TABLE IF NOT EXISTS buyer_requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      buyer_id INT NOT NULL,
      farmer_id INT NOT NULL,
      product_id INT NOT NULL,
      requested_quantity DECIMAL(10,2) NOT NULL,
      offered_price_per_unit DECIMAL(10,2) NOT NULL,
      destination VARCHAR(150) DEFAULT NULL,
      delivery_city VARCHAR(150) DEFAULT NULL,
      delivery_address VARCHAR(255) DEFAULT NULL,
      delivery_contact_name VARCHAR(150) DEFAULT NULL,
      delivery_phone VARCHAR(30) DEFAULT NULL,
      delivery_lat DECIMAL(10,7) DEFAULT NULL,
      delivery_lng DECIMAL(10,7) DEFAULT NULL,
      required_date DATE DEFAULT NULL,
      message TEXT,
      status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'CANCELLED'
      ) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn(
    "buyer_requests",
    "destination",
    "VARCHAR(150) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "delivery_city",
    "VARCHAR(150) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "delivery_address",
    "VARCHAR(255) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "delivery_contact_name",
    "VARCHAR(150) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "delivery_phone",
    "VARCHAR(30) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "delivery_lat",
    "DECIMAL(10,7) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "delivery_lng",
    "DECIMAL(10,7) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_requests",
    "required_date",
    "DATE DEFAULT NULL"
  );

  // ===================================================
  // BUYER DEMANDS
  // ===================================================

  await ensureColumn(
    "buyer_demands",
    "delivery_address",
    "VARCHAR(255) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_demands",
    "delivery_contact_name",
    "VARCHAR(150) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_demands",
    "delivery_phone",
    "VARCHAR(30) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_demands",
    "delivery_lat",
    "DECIMAL(10,7) DEFAULT NULL"
  );

  await ensureColumn(
    "buyer_demands",
    "delivery_lng",
    "DECIMAL(10,7) DEFAULT NULL"
  );

  // ===================================================
  // SHIPMENTS
  // ===================================================

  await query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      shipment_code VARCHAR(40) UNIQUE NOT NULL,
      crop_name VARCHAR(100) NOT NULL,
      destination_city VARCHAR(150) NOT NULL,
      destination_address VARCHAR(255) DEFAULT NULL,
      destination_lat DECIMAL(10,7) DEFAULT NULL,
      destination_lng DECIMAL(10,7) DEFAULT NULL,
      vehicle_capacity DECIMAL(10,2) NOT NULL DEFAULT 1200,
      vehicle_number VARCHAR(50) DEFAULT NULL,
      vehicle_type VARCHAR(100) DEFAULT 'Multi-produce delivery truck',
      driver_name VARCHAR(150) DEFAULT NULL,
      driver_phone VARCHAR(30) DEFAULT NULL,
      status ENUM(
        'PLANNED',
        'PACKED',
        'READY_TO_DISPATCH',
        'IN_TRANSIT',
        'ARRIVED',
        'DELIVERED',
        'CANCELLED'
      ) DEFAULT 'PLANNED',
      estimated_distance_km DECIMAL(10,2) DEFAULT 0,
      estimated_minutes INT DEFAULT 0,
      dispatch_at DATETIME DEFAULT NULL,
      eta DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // ===================================================
  // ORDERS
  // ===================================================

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_code VARCHAR(40) UNIQUE NOT NULL,
      buyer_id INT NOT NULL,
      farmer_id INT NOT NULL,
      product_id INT NOT NULL,
      buyer_request_id INT DEFAULT NULL,
      supply_offer_id INT DEFAULT NULL,
      demand_id INT DEFAULT NULL,
      shipment_id INT DEFAULT NULL,
      crop_name VARCHAR(100) NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit VARCHAR(20) NOT NULL DEFAULT 'KG',
      price_per_unit DECIMAL(10,2) NOT NULL,
      order_value DECIMAL(12,2) NOT NULL,
      pickup_location VARCHAR(150) DEFAULT NULL,
      delivery_city VARCHAR(150) DEFAULT NULL,
      delivery_address VARCHAR(255) DEFAULT NULL,
      buyer_contact_name VARCHAR(150) DEFAULT NULL,
      buyer_phone VARCHAR(30) DEFAULT NULL,
      farmer_phone VARCHAR(30) DEFAULT NULL,
      required_date DATE DEFAULT NULL,
      status ENUM(
        'ACCEPTED',
        'PACKED',
        'READY_TO_DISPATCH',
        'IN_TRANSIT',
        'ARRIVED',
        'DELIVERED',
        'CANCELLED'
      ) DEFAULT 'ACCEPTED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orders_buyer (buyer_id),
      INDEX idx_orders_farmer (farmer_id),
      INDEX idx_orders_shipment (shipment_id)
    )
  `);

  // ===================================================
  // ORDER STATUS HISTORY
  // ===================================================

  await query(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT NOT NULL,
      status VARCHAR(40) NOT NULL,
      note VARCHAR(255) DEFAULT NULL,
      changed_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_history_order (order_id)
    )
  `);

  // ===================================================
  // ORDER MIGRATION
  // ===================================================

  const orderColumns = {
    order_code:
      "VARCHAR(40) NULL",

    buyer_id:
      "INT NULL",

    farmer_id:
      "INT NULL",

    product_id:
      "INT NULL",

    buyer_request_id:
      "INT DEFAULT NULL",

    supply_offer_id:
      "INT DEFAULT NULL",

    demand_id:
      "INT DEFAULT NULL",

    shipment_id:
      "INT DEFAULT NULL",

    crop_name:
      "VARCHAR(100) DEFAULT NULL",

    quantity:
      "DECIMAL(10,2) DEFAULT 0",

    unit:
      "VARCHAR(20) DEFAULT 'KG'",

    price_per_unit:
      "DECIMAL(10,2) DEFAULT 0",

    order_value:
      "DECIMAL(12,2) DEFAULT 0",

    pickup_location:
      "VARCHAR(150) DEFAULT NULL",

    delivery_city:
      "VARCHAR(150) DEFAULT NULL",

    delivery_address:
      "VARCHAR(255) DEFAULT NULL",

    buyer_contact_name:
      "VARCHAR(150) DEFAULT NULL",

    buyer_phone:
      "VARCHAR(30) DEFAULT NULL",

    farmer_phone:
      "VARCHAR(30) DEFAULT NULL",

    required_date:
      "DATE DEFAULT NULL",

    status:
      "VARCHAR(40) DEFAULT 'ACCEPTED'",

    created_at:
      "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",

    updated_at:
      "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",

    total_amount:
      "DECIMAL(12,2) DEFAULT 0",
  };

  for (
    const [
      column,
      definition,
    ] of Object.entries(
      orderColumns
    )
  ) {
    await ensureColumn(
      "orders",
      column,
      definition
    );
  }

  // ===================================================
  // NORMALIZE OLD STATUS ENUM
  // ===================================================

  try {
    const statusInfo =
      await query(
        `
          SELECT DATA_TYPE, COLUMN_TYPE
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
          AND table_name = 'orders'
          AND column_name = 'status'
        `
      );

    if (
      statusInfo.length &&
      statusInfo[0].DATA_TYPE ===
        "enum"
    ) {
      await query(
        `
          ALTER TABLE orders
          MODIFY COLUMN status
          VARCHAR(40)
          DEFAULT 'ACCEPTED'
        `
      );

      console.log(
        "Normalized orders.status for the new order workflow."
      );
    }
  } catch (
    statusError
  ) {
    console.warn(
      "Could not normalize orders.status:",
      statusError.message
    );
  }

  // ===================================================
  // BUYER REQUEST MIGRATION
  // ===================================================

  const requestColumns = {
    buyer_id:
      "INT NULL",

    farmer_id:
      "INT NULL",

    product_id:
      "INT NULL",

    requested_quantity:
      "DECIMAL(10,2) DEFAULT 0",

    offered_price_per_unit:
      "DECIMAL(10,2) DEFAULT 0",

    destination:
      "VARCHAR(150) DEFAULT NULL",

    delivery_city:
      "VARCHAR(150) DEFAULT NULL",

    delivery_address:
      "VARCHAR(255) DEFAULT NULL",

    delivery_contact_name:
      "VARCHAR(150) DEFAULT NULL",

    delivery_phone:
      "VARCHAR(30) DEFAULT NULL",

    delivery_lat:
      "DECIMAL(10,7) DEFAULT NULL",

    delivery_lng:
      "DECIMAL(10,7) DEFAULT NULL",

    required_date:
      "DATE DEFAULT NULL",

    message:
      "TEXT",

    status:
      "VARCHAR(40) DEFAULT 'PENDING'",

    created_at:
      "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  };

  for (
    const [
      column,
      definition,
    ] of Object.entries(
      requestColumns
    )
  ) {
    await ensureColumn(
      "buyer_requests",
      column,
      definition
    );
  }

  // ===================================================
  // SHIPMENT MIGRATION
  // ===================================================

  const shipmentColumns = {
    shipment_code:
      "VARCHAR(40) NULL",

    crop_name:
      "VARCHAR(100) DEFAULT NULL",

    destination_city:
      "VARCHAR(150) DEFAULT NULL",

    destination_address:
      "VARCHAR(255) DEFAULT NULL",

    destination_lat:
      "DECIMAL(10,7) DEFAULT NULL",

    destination_lng:
      "DECIMAL(10,7) DEFAULT NULL",

    vehicle_capacity:
      "DECIMAL(10,2) DEFAULT 1200",

    vehicle_number:
      "VARCHAR(50) DEFAULT NULL",

    vehicle_type:
      "VARCHAR(100) DEFAULT '1200 KG Multi-stop Truck'",

    driver_name:
      "VARCHAR(150) DEFAULT NULL",

    driver_phone:
      "VARCHAR(30) DEFAULT NULL",

    status:
      "VARCHAR(40) DEFAULT 'PLANNED'",

    estimated_distance_km:
      "DECIMAL(10,2) DEFAULT 0",

    estimated_minutes:
      "INT DEFAULT 0",

    required_date:
      "DATE DEFAULT NULL",

    dispatch_at:
      "DATETIME DEFAULT NULL",

    eta:
      "DATETIME DEFAULT NULL",

    created_at:
      "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",

    updated_at:
      "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",

    total_amount:
      "DECIMAL(12,2) DEFAULT 0",
  };

  for (
    const [
      column,
      definition,
    ] of Object.entries(
      shipmentColumns
    )
  ) {
    await ensureColumn(
      "shipments",
      column,
      definition
    );
  }

  // ===================================================
  // RATINGS TABLE
  // ===================================================

  await query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT NOT NULL,
      reviewer_id INT NOT NULL,
      reviewed_user_id INT NOT NULL,
      reviewer_role ENUM('FARMER', 'BUYER') NOT NULL,
      rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_rating (order_id, reviewer_id, reviewed_user_id),
      INDEX idx_rating_reviewed (reviewed_user_id),
      INDEX idx_rating_order (order_id)
    )
  `);

  // ===================================================
  // SHIPMENT TRACKING TABLE
  // ===================================================

  await query(`
    CREATE TABLE IF NOT EXISTS shipment_tracking (
      id INT PRIMARY KEY AUTO_INCREMENT,
      shipment_id INT NOT NULL,
      order_id INT NOT NULL,
      farmer_id INT NOT NULL,
      latitude DECIMAL(10,7) DEFAULT NULL,
      longitude DECIMAL(10,7) DEFAULT NULL,
      status VARCHAR(40) DEFAULT 'PENDING',
      message VARCHAR(255) DEFAULT NULL,
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_st_farmer (farmer_id),
      INDEX idx_st_order (order_id),
      INDEX idx_st_shipment (shipment_id),
      INDEX idx_st_recorded (recorded_at)
    )
  `);

  // Safely ensure location coordinates columns exist across tables
  try {
    const oCols = await query("SHOW COLUMNS FROM orders");
    const oFields = oCols.map((c) => c.Field);
    if (!oFields.includes("pickup_lat")) await query("ALTER TABLE orders ADD COLUMN pickup_lat DECIMAL(10,7) DEFAULT NULL");
    if (!oFields.includes("pickup_lng")) await query("ALTER TABLE orders ADD COLUMN pickup_lng DECIMAL(10,7) DEFAULT NULL");
    if (!oFields.includes("delivery_lat")) await query("ALTER TABLE orders ADD COLUMN delivery_lat DECIMAL(10,7) DEFAULT NULL");
    if (!oFields.includes("delivery_lng")) await query("ALTER TABLE orders ADD COLUMN delivery_lng DECIMAL(10,7) DEFAULT NULL");

    const pCols = await query("SHOW COLUMNS FROM products");
    const pFields = pCols.map((c) => c.Field);
    if (!pFields.includes("latitude")) await query("ALTER TABLE products ADD COLUMN latitude DECIMAL(10,7) DEFAULT NULL");
    if (!pFields.includes("longitude")) await query("ALTER TABLE products ADD COLUMN longitude DECIMAL(10,7) DEFAULT NULL");

    const dCols = await query("SHOW COLUMNS FROM buyer_demands");
    const dFields = dCols.map((c) => c.Field);
    if (!dFields.includes("destination_lat")) await query("ALTER TABLE buyer_demands ADD COLUMN destination_lat DECIMAL(10,7) DEFAULT NULL");
    if (!dFields.includes("destination_lng")) await query("ALTER TABLE buyer_demands ADD COLUMN destination_lng DECIMAL(10,7) DEFAULT NULL");
  } catch (schemaColErr) {
    console.warn("Location column check warning:", schemaColErr.message);
  }

  console.log(
    "Database schema ready. Existing tables/data preserved."
  );
}

// =====================================================
// ORDER HISTORY
// =====================================================

async function addOrderHistory(
  orderId,
  status,
  note,
  changedBy = null
) {
  await query(
    `
      INSERT INTO order_status_history
      (
        order_id,
        status,
        note,
        changed_by
      )
      VALUES (?,?,?,?)
    `,
    [
      orderId,
      status,
      note || null,
      changedBy,
    ]
  );
}

// =====================================================
// UPDATE SHIPMENT AGGREGATE
// =====================================================

async function updateShipmentAggregate(
  shipmentId
) {
  if (!shipmentId) return;

  const rows =
    await query(
      `
        SELECT status
        FROM orders
        WHERE shipment_id = ?
      `,
      [shipmentId]
    );

  if (!rows.length) {
    return;
  }

  let status =
    "PLANNED";

  const statuses =
    rows.map(
      (r) => r.status
    );

  if (
    statuses.every(
      (s) =>
        s === "DELIVERED"
    )
  ) {
    status = "DELIVERED";
  } else if (
    statuses.some(
      (s) =>
        s === "IN_TRANSIT"
    )
  ) {
    status = "IN_TRANSIT";
  } else if (
    statuses.some(
      (s) =>
        s === "ARRIVED"
    ) &&
    statuses.every(
      (s) =>
        [
          "ARRIVED",
          "DELIVERED",
        ].includes(s)
    )
  ) {
    status = "ARRIVED";
  } else if (
    statuses.some(
      (s) =>
        s ===
        "READY_TO_DISPATCH"
    )
  ) {
    status =
      "READY_TO_DISPATCH";
  } else if (
    statuses.some(
      (s) =>
        s === "PACKED"
    )
  ) {
    status =
      "PACKED";
  }

  await query(
    `
      UPDATE shipments
      SET status = ?
      WHERE id = ?
    `,
    [
      status,
      shipmentId,
    ]
  );
}

// =====================================================
// CREATE ORDER
// =====================================================

async function createOrderFromSource({
  buyerId,
  farmerId,
  productId,
  quantity,
  pricePerUnit,
  buyerRequestId = null,
  supplyOfferId = null,
  demandId = null,
  deliveryCity,
  deliveryAddress,
  buyerContactName,
  buyerPhone,
  requiredDate,
}) {
  const products =
    await query(
      `
        SELECT
          p.*,
          u.phone AS farmer_phone,
          u.name AS farmer_name

        FROM products p

        JOIN users u
          ON p.farmer_id =
             u.id

        WHERE p.id = ?
        AND p.farmer_id = ?
      `,
      [
        productId,
        farmerId,
      ]
    );

  if (!products.length) {
    throw new Error(
      "Product listing not found."
    );
  }

  const product =
    products[0];

  const orderCode =
    `ORD-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

  const orderValue =
    toNum(quantity) *
    toNum(pricePerUnit);

  const result =
    await query(
      `
        INSERT INTO orders
        (
          order_code,
          buyer_id,
          farmer_id,
          product_id,
          buyer_request_id,
          supply_offer_id,
          demand_id,
          crop_name,
          quantity,
          unit,
          price_per_unit,
          order_value,
          total_amount,
          pickup_location,
          delivery_city,
          delivery_address,
          buyer_contact_name,
          buyer_phone,
          farmer_phone,
          required_date,
          status
        )
        VALUES (
          ?,?,?,?,?,?,?,?,?,?,
          ?,?,?,?,?,?,?,?,?,?,
          'ACCEPTED'
        )
      `,
      [
        orderCode,
        buyerId,
        farmerId,
        productId,
        buyerRequestId,
        supplyOfferId,
        demandId,
        product.crop_name,
        quantity,
        product.unit,
        pricePerUnit,
        orderValue,
        orderValue,
        product.location,
        deliveryCity ||
          "Mumbai",
        deliveryAddress ||
          null,
        buyerContactName ||
          null,
        buyerPhone ||
          null,
        product.farmer_phone ||
          null,
        cleanDate(
          requiredDate
        ),
      ]
    );

  await addOrderHistory(
    result.insertId,
    "ACCEPTED",
    "Order created after farmer/buyer confirmation.",
    farmerId
  );

  await assignOrderToShipment(
    result.insertId
  );

  return result.insertId;
}

// =====================================================
// ASSIGN ORDER TO SHIPMENT
// =====================================================

async function assignOrderToShipment(
  orderId
) {
  const orders =
    await query(
      `
        SELECT *
        FROM orders
        WHERE id = ?
      `,
      [orderId]
    );

  if (!orders.length) {
    return null;
  }

  const order =
    orders[0];

  const candidates =
    await query(
      `
        SELECT
          s.id,
          s.vehicle_capacity,

          COALESCE(
            (
              SELECT SUM(
                o.quantity
              )
              FROM orders o
              WHERE o.shipment_id =
                s.id
              AND o.status <>
                'CANCELLED'
            ),
            0
          ) AS current_load

        FROM shipments s

        WHERE LOWER(
          s.crop_name
        ) = LOWER(?)

        AND LOWER(
          s.destination_city
        ) = LOWER(?)

        AND (
          s.required_date = ?

          OR (
            s.required_date IS NULL
            AND ? IS NULL
          )
        )

        AND s.status IN (
          'PLANNED',
          'PACKED',
          'READY_TO_DISPATCH'
        )

        ORDER BY
          s.id DESC
      `,
      [
        order.crop_name,
        order.delivery_city ||
          "Mumbai",
        cleanDate(
          order.required_date
        ),
        cleanDate(
          order.required_date
        ),
      ]
    );

  let shipmentId =
    null;

  for (
    const candidate of candidates
  ) {
    if (
      toNum(
        candidate.current_load
      ) +
        toNum(
          order.quantity
        ) <=
      toNum(
        candidate.vehicle_capacity,
        VEHICLE_CAPACITY
      )
    ) {
      shipmentId =
        candidate.id;

      break;
    }
  }

  if (!shipmentId) {
    const shipmentCode =
      `SHP-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

    const destination =
      getCoordinates(
        order.delivery_city ||
          "Mumbai"
      );

    const created =
      await query(
        `
          INSERT INTO shipments
          (
            shipment_code,
            crop_name,
            destination_city,
            destination_address,
            destination_lat,
            destination_lng,
            vehicle_capacity,
            vehicle_number,
            vehicle_type,
            driver_name,
            driver_phone,
            required_date,
            status
          )
          VALUES (
            ?,?,?,?,?,?,?,?,?,?,
            ?,?,'PLANNED'
          )
        `,
        [
          shipmentCode,
          order.crop_name,
          order.delivery_city ||
            "Mumbai",
          order.delivery_address ||
            null,
          destination?.lat ||
            null,
          destination?.lng ||
            null,
          VEHICLE_CAPACITY,
          `MH-04-${Math.floor(
            1000 +
              Math.random() *
                9000
          )}`,
          "1200 KG Multi-stop Truck",
          "Assigned Driver",
          "9XXXXXXXXX",
          cleanDate(
            order.required_date
          ),
        ]
      );

    shipmentId =
      created.insertId;
  }

  await query(
    `
      UPDATE orders
      SET shipment_id = ?
      WHERE id = ?
    `,
    [
      shipmentId,
      orderId,
    ]
  );

  await recalculateShipment(
    shipmentId
  );

  return shipmentId;
}

// =====================================================
// RECALCULATE SHIPMENT
// =====================================================

async function recalculateShipment(
  shipmentId
) {
  // FIX:
  // The old code used `shipment` without loading it.

  const shipmentRows =
    await query(
      `
        SELECT *
        FROM shipments
        WHERE id = ?
      `,
      [shipmentId]
    );

  if (!shipmentRows.length) {
    return null;
  }

  const shipment =
    shipmentRows[0];

  const rows =
    await query(
      `
        SELECT
          o.*,

          u.name AS farmer_name,
          u.phone AS farmer_phone,

          p.location AS product_location,

          uf.name AS buyer_name

        FROM orders o

        JOIN users u
          ON o.farmer_id =
             u.id

        JOIN products p
          ON o.product_id =
             p.id

        JOIN users uf
          ON o.buyer_id =
             uf.id

        WHERE o.shipment_id =
              ?

        AND o.status <>
            'CANCELLED'

        ORDER BY
          o.id
      `,
      [shipmentId]
    );

  if (!rows.length) {
    return null;
  }

  const pickupMap =
    new Map();

  const deliveryStops =
    [];

  for (
    const o of rows
  ) {
    const pickupKey =
      `${o.farmer_id}|${
        o.pickup_location ||
        "Unknown pickup"
      }`;

    const pickup =
      getCoordinates(
        o.pickup_location
      );

    const existing =
      pickupMap.get(
        pickupKey
      );

    if (existing) {
      existing.quantity +=
        toNum(o.quantity);

      existing.order_ids.push(
        o.id
      );
    } else {
      pickupMap.set(
        pickupKey,
        {
          type:
            "PICKUP",

          location:
            o.pickup_location ||
            "Unknown pickup",

          lat:
            pickup?.lat ??
            null,

          lng:
            pickup?.lng ??
            null,

          quantity:
            toNum(
              o.quantity
            ),

          farmer_id:
            o.farmer_id,

          farmer_name:
            o.farmer_name,

          order_ids: [
            o.id,
          ],

          label:
            `${o.farmer_name} • ${
              o.quantity
            } ${o.unit}`,
        }
      );
    }

    const dest =
      getCoordinates(
        o.delivery_city
      );

    deliveryStops.push({
      type:
        "DELIVERY",

      location:
        o.delivery_city ||
        "Mumbai",

      address:
        o.delivery_address ||
        "",

      lat:
        dest?.lat ?? null,

      lng:
        dest?.lng ?? null,

      quantity:
        toNum(
          o.quantity
        ),

      buyer_id:
        o.buyer_id,

      buyer_name:
        o.buyer_name,

      buyer_phone:
        o.buyer_phone ||
        "",

      order_id:
        o.id,

      label:
        `${o.buyer_name} • ${
          o.quantity
        } ${o.unit}`,
    });
  }

  const points = [
    ...pickupMap.values(),
    ...deliveryStops,
  ];

  const pickupStops =
    points.filter(
      (p) =>
        p.type ===
        "PICKUP"
    );

  const destinationAnchor =
    deliveryStops[0]
      ?.location ||
    "Mumbai";

  pickupStops.sort(
    (a, b) =>
      routeDistance(
        b.location,
        destinationAnchor
      ) -
      routeDistance(
        a.location,
        destinationAnchor
      )
  );

  const route = [];

  let current =
    pickupStops[0]
      ?.location ||
    destinationAnchor;

  let totalDistance =
    0;

  pickupStops.forEach(
    (p, idx) => {
      const distance =
        idx === 0
          ? 0
          : routeDistance(
              current,
              p.location
            );

      totalDistance +=
        distance;

      p.distance_from_previous_km =
        Number(
          distance.toFixed(
            1
          )
        );

      route.push({
        ...p,
        stop:
          route.length + 1,
      });

      current =
        p.location;
    }
  );

  deliveryStops.forEach(
    (d) => {
      const distance =
        pickupStops.length
          ? routeDistance(
              current,
              d.location
            )
          : 0;

      totalDistance +=
        distance;

      d.distance_from_previous_km =
        Number(
          distance.toFixed(
            1
          )
        );

      route.push({
        ...d,
        stop:
          route.length + 1,
      });

      current =
        d.location;
    }
  );

  const totalLoad =
    rows.reduce(
      (sum, o) =>
        sum +
        toNum(
          o.quantity
        ),
      0
    );

  const minutes =
    Math.max(
      30,
      Math.round(
        (totalDistance /
          45) *
          60
      )
    );

  const fuel =
    totalDistance *
    28;

  const toll =
    totalDistance *
    2.5;

  const driver =
    totalDistance *
    7;

  const loading =
    1500;

  const transportCost =
    fuel +
    toll +
    driver +
    loading;

  const delivery =
    deliveryStops[0];

  const baseTime =
    shipment.dispatch_at
      ? new Date(
          shipment.dispatch_at
        ).getTime()
      : new Date(
          shipment.created_at
        ).getTime();

  const eta =
    new Date(
      baseTime +
        minutes * 60000
    );

  await query(
    `
      UPDATE shipments

      SET
        destination_address = ?,
        destination_lat = ?,
        destination_lng = ?,
        estimated_distance_km = ?,
        estimated_minutes = ?,
        eta = ?

      WHERE id = ?
    `,
    [
      delivery?.address ||
        rows[0]
          .delivery_address ||
        null,

      delivery?.lat ||
        null,

      delivery?.lng ||
        null,

      Number(
        totalDistance.toFixed(
          1
        )
      ),

      minutes,

      eta,

      shipmentId,
    ]
  );

  return {
    rows,
    route,
    totalLoad,
    totalDistance,
    minutes,
    transportCost,
    fuel,
    toll,
    driver,
    loading,
  };
}

// =====================================================
// GET SHIPMENT DETAILS
// =====================================================

async function getShipmentDetails(
  shipmentId
) {
  const shipments =
    await query(
      `
        SELECT *
        FROM shipments
        WHERE id = ?
      `,
      [shipmentId]
    );

  if (!shipments.length) {
    return null;
  }

  let shipment =
    shipments[0];

  const calc =
    await recalculateShipment(
      shipmentId
    );

  if (!calc) {
    return {
      shipment,
      orders: [],
      route: [],
      farmers: [],
      buyers: [],
      farmerCosts: [],
      summary: {
        total_quantity: 0,
        vehicle_capacity:
          Number(
            shipment.vehicle_capacity
          ),
        remaining_capacity:
          Number(
            shipment.vehicle_capacity
          ),
        total_distance_km: 0,
        estimated_minutes: 0,
        estimated_arrival:
          shipment.eta,
        fuel_cost: 0,
        toll_estimate: 0,
        driver_cost: 0,
        loading_cost: 0,
        total_transport_cost: 0,
      },
    };
  }

  const refreshed =
    await query(
      `
        SELECT *
        FROM shipments
        WHERE id = ?
      `,
      [shipmentId]
    );

  if (refreshed.length) {
    shipment =
      refreshed[0];
  }

  const farmerMap =
    new Map();

  const buyerMap =
    new Map();

  (
    calc.rows || []
  ).forEach(
    (o) => {
      const f =
        farmerMap.get(
          o.farmer_id
        );

      if (f) {
        f.quantity +=
          toNum(
            o.quantity
          );

        f.order_ids.push(
          o.id
        );
      } else {
        farmerMap.set(
          o.farmer_id,
          {
            farmer_id:
              o.farmer_id,

            farmer_name:
              o.farmer_name,

            phone:
              o.farmer_phone,

            pickup_location:
              o.pickup_location,

            order_ids: [
              o.id,
            ],

            quantity:
              toNum(
                o.quantity
              ),
          }
        );
      }

      const b =
        buyerMap.get(
          o.buyer_id
        );

      if (b) {
        b.quantity +=
          toNum(
            o.quantity
          );

        b.order_ids.push(
          o.id
        );
      } else {
        buyerMap.set(
          o.buyer_id,
          {
            buyer_id:
              o.buyer_id,

            buyer_name:
              o.buyer_name,

            phone:
              o.buyer_phone,

            delivery_city:
              o.delivery_city,

            delivery_address:
              o.delivery_address,

            order_ids: [
              o.id,
            ],

            quantity:
              toNum(
                o.quantity
              ),
          }
        );
      }
    }
  );

  const farmerCosts =
    [];

  for (
    const f of farmerMap.values()
  ) {
    farmerCosts.push({
      ...f,

      percentage:
        calc.totalLoad
          ? Number(
              (
                (f.quantity /
                  calc.totalLoad) *
                100
              ).toFixed(1)
            )
          : 0,

      transport_share:
        calc.totalLoad
          ? Number(
              (
                calc.transportCost *
                f.quantity /
                calc.totalLoad
              ).toFixed(2)
            )
          : 0,
    });
  }

  return {
    shipment,

    orders:
      calc.rows,

    route:
      calc.route,

    farmers:
      [...farmerMap.values()],

    buyers:
      [...buyerMap.values()],

    farmerCosts,

    summary: {
      total_quantity:
        Number(
          calc.totalLoad.toFixed(
            2
          )
        ),

      vehicle_capacity:
        Number(
          shipment.vehicle_capacity
        ),

      remaining_capacity:
        Number(
          Math.max(
            Number(
              shipment.vehicle_capacity
            ) -
              calc.totalLoad,
            0
          ).toFixed(2)
        ),

      total_distance_km:
        Number(
          calc.totalDistance.toFixed(
            1
          )
        ),

      estimated_minutes:
        calc.minutes,

      estimated_arrival:
        shipment.eta,

      fuel_cost:
        Number(
          calc.fuel.toFixed(
            2
          )
        ),

      toll_estimate:
        Number(
          calc.toll.toFixed(
            2
          )
        ),

      driver_cost:
        Number(
          calc.driver.toFixed(
            2
          )
        ),

      loading_cost:
        calc.loading,

      total_transport_cost:
        Number(
          calc.transportCost.toFixed(
            2
          )
        ),
    },
  };
}

// =====================================================
// BACKFILL ACCEPTED OFFERS
// =====================================================

async function backfillAcceptedOffers() {
  const accepted =
    await query(`
      SELECT
        so.*,
        d.buyer_id,
        d.destination,
        d.delivery_address,
        d.delivery_contact_name,
        d.delivery_phone,
        d.required_date,
        p.price_per_unit,
        p.unit

      FROM supply_offers so

      JOIN buyer_demands d
        ON so.demand_id = d.id

      JOIN products p
        ON so.product_id = p.id

      LEFT JOIN orders o
        ON o.supply_offer_id = so.id

      WHERE so.status = 'ACCEPTED'
      AND o.id IS NULL
    `);

  for (
    const offer of accepted
  ) {
    try {
      await createOrderFromSource({
        buyerId:
          offer.buyer_id,

        farmerId:
          offer.farmer_id,

        productId:
          offer.product_id,

        quantity:
          offer.offered_quantity,

        pricePerUnit:
          offer.offered_price_per_unit,

        supplyOfferId:
          offer.id,

        demandId:
          offer.demand_id,

        deliveryCity:
          offer.destination,

        deliveryAddress:
          offer.delivery_address,

        buyerContactName:
          offer.delivery_contact_name,

        buyerPhone:
          offer.delivery_phone,

        requiredDate:
          offer.required_date,
      });
    } catch (e) {
      console.warn(
        "Skipped legacy accepted offer",
        offer.id +
          ":",
        e.message
      );
    }
  }

  const acceptedDirect =
    await query(`
      SELECT
        br.*,
        p.price_per_unit,
        p.unit

      FROM buyer_requests br

      JOIN products p
        ON br.product_id = p.id

      LEFT JOIN orders o
        ON o.buyer_request_id =
           br.id

      WHERE br.status =
        'ACCEPTED'

      AND o.id IS NULL
    `);

  for (
    const request of acceptedDirect
  ) {
    try {
      await createOrderFromSource({
        buyerId:
          request.buyer_id,

        farmerId:
          request.farmer_id,

        productId:
          request.product_id,

        quantity:
          request.requested_quantity,

        pricePerUnit:
          request.offered_price_per_unit ||
          request.price_per_unit,

        buyerRequestId:
          request.id,

        deliveryCity:
          request.delivery_city ||
          request.destination ||
          "Mumbai",

        deliveryAddress:
          request.delivery_address,

        buyerContactName:
          request.delivery_contact_name,

        buyerPhone:
          request.delivery_phone,

        requiredDate:
          request.required_date,
      });
    } catch (e) {
      console.warn(
        "Skipped legacy accepted buyer request",
        request.id +
          ":",
        e.message
      );
    }
  }
}

// =====================================================
// BASIC
// =====================================================

app.get(
  "/",
  (_req, res) =>
    res.send(
      "Smart Agri Connect Backend is Running!"
    )
);

// =====================================================
// AUTH
// =====================================================

app.post(
  "/api/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        role,
        location,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          message:
            "All required fields must be filled.",
        });
      }

      if (
        ![
          "FARMER",
          "BUYER",
        ].includes(role)
      ) {
        return res.status(400).json({
          message:
            "Invalid role.",
        });
      }

      const existing =
        await query(
          `
            SELECT id
            FROM users
            WHERE email = ?
          `,
          [email]
        );

      if (existing.length) {
        return res.status(409).json({
          message:
            "Email already registered.",
        });
      }

      const hash =
        await bcrypt.hash(
          password,
          10
        );

      const result =
        await query(
          `
            INSERT INTO users
            (
              name,
              email,
              phone,
              password,
              role,
              location
            )
            VALUES (
              ?,?,?,?,?,?
            )
          `,
          [
            name,
            email,
            phone ||
              null,
            hash,
            role,
            location ||
              null,
          ]
        );

      res.status(201).json({
        message:
          "User registered successfully.",

        userId:
          result.insertId,
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// LOGIN
// =====================================================

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const users =
        await query(
          `
            SELECT *
            FROM users
            WHERE email = ?
          `,
          [email]
        );

      if (!users.length) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const user =
        users[0];

      if (
        !(
          await bcrypt.compare(
            password,
            user.password
          )
        )
      ) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      res.json({
        message:
          "Login successful.",

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone,

          role:
            user.role,

          location:
            user.location,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// PRODUCTS
// =====================================================

app.post(
  "/api/products",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        farmer_id,
        crop_name,
        quantity,
        unit,
        price_per_unit,
        location,
        size,
        quality,
        condition_type,
        description,
        available_from,
      } = req.body;

      if (
        !farmer_id ||
        !crop_name ||
        !quantity ||
        !price_per_unit ||
        !location ||
        !available_from
      ) {
        return res.status(400).json({
          message:
            "Required fields are missing.",
        });
      }

      const farmers =
        await query(
          `
            SELECT id
            FROM users
            WHERE id = ?
            AND role =
              'FARMER'
          `,
          [farmer_id]
        );

      if (!farmers.length) {
        return res.status(403).json({
          message:
            "Only farmers can create crop listings.",
        });
      }

      const imageUrl =
        req.file
          ? `/uploads/${req.file.filename}`
          : null;

      const result =
        await query(
          `
            INSERT INTO products
            (
              farmer_id,
              crop_name,
              quantity,
              unit,
              price_per_unit,
              location,
              size,
              quality,
              condition_type,
              description,
              available_from,
              image_url
            )
            VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?
            )
          `,
          [
            farmer_id,
            crop_name,
            quantity,
            unit ||
              "KG",
            price_per_unit,
            location,
            size ||
              "ANY",
            quality ||
              "ANY",
            condition_type ||
              "ANY",
            description ||
              null,
            available_from,
            imageUrl,
          ]
        );

      res.status(201).json({
        message:
          "Crop listing created successfully.",

        productId:
          result.insertId,

        image_url:
          imageUrl,
      });
    } catch (error) {
      console.error(
        "Product creation error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

app.get(
  "/api/products",
  async (_req, res) => {
    try {
      const products =
        await query(`
          SELECT
            p.*,
            u.name AS farmer_name,
            u.phone AS farmer_phone

          FROM products p

          JOIN users u
            ON p.farmer_id =
               u.id

          WHERE p.status =
            'AVAILABLE'

          AND p.quantity > 0

          ORDER BY
            p.created_at DESC
        `);

      res.json(products);
    } catch (error) {
      console.error(
        "Product fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// BUYER DEMANDS
// =====================================================

app.post(
  "/api/demands",
  async (req, res) => {
    try {
      const {
        buyer_id,
        crop_name,
        required_quantity,
        unit,
        destination,
        delivery_address,
        delivery_contact_name,
        delivery_phone,
        delivery_lat,
        delivery_lng,
        required_date,
        max_price_per_unit,
        preferred_size,
        preferred_quality,
        preferred_condition,
        allow_mixed,
      } = req.body;

      if (
        !buyer_id ||
        !crop_name ||
        !required_quantity ||
        !destination ||
        !required_date
      ) {
        return res.status(400).json({
          message:
            "Required fields are missing.",
        });
      }

      if (
        toNum(
          required_quantity
        ) <= 0
      ) {
        return res.status(400).json({
          message:
            "Required quantity must be greater than zero.",
        });
      }

      const buyers =
        await query(
          `
            SELECT
              id,
              phone

            FROM users

            WHERE id = ?
            AND role = 'BUYER'
          `,
          [buyer_id]
        );

      if (!buyers.length) {
        return res.status(403).json({
          message:
            "Only buyers can create demands.",
        });
      }

      const result =
        await query(
          `
            INSERT INTO buyer_demands
            (
              buyer_id,
              crop_name,
              required_quantity,
              unit,
              destination,
              delivery_address,
              delivery_contact_name,
              delivery_phone,
              delivery_lat,
              delivery_lng,
              required_date,
              max_price_per_unit,
              preferred_size,
              preferred_quality,
              preferred_condition,
              allow_mixed
            )
            VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
          `,
          [
            buyer_id,
            crop_name,
            required_quantity,
            unit ||
              "KG",
            destination,
            delivery_address ||
              null,
            delivery_contact_name ||
              null,
            delivery_phone ||
              buyers[0]
                .phone ||
              null,
            delivery_lat ||
              null,
            delivery_lng ||
              null,
            required_date,
            max_price_per_unit ||
              null,
            preferred_size ||
              "ANY",
            preferred_quality ||
              "ANY",
            preferred_condition ||
              "ANY",
            allow_mixed !==
            undefined
              ? allow_mixed
              : true,
          ]
        );

      res.status(201).json({
        message:
          "Buyer demand created successfully.",

        demandId:
          result.insertId,
      });
    } catch (error) {
      console.error(
        "Demand creation error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// GET OPEN DEMANDS
// =====================================================

app.get(
  "/api/demands",
  async (_req, res) => {
    try {
      const demands =
        await query(`
          SELECT
            d.*,

            u.name AS buyer_name,
            u.phone AS buyer_phone

          FROM buyer_demands d

          JOIN users u
            ON d.buyer_id =
               u.id

          WHERE d.status IN (
            'OPEN',
            'PARTIALLY_FULFILLED'
          )

          ORDER BY
            d.created_at DESC
        `);

      res.json(
        demands
      );
    } catch (error) {
      console.error(
        "Demand fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

app.get(
  "/api/demands/open",
  async (_req, res) => {
    try {
      const demands =
        await query(`
          SELECT
            d.*,

            u.name AS buyer_name,
            u.phone AS buyer_phone

          FROM buyer_demands d

          JOIN users u
            ON d.buyer_id =
               u.id

          WHERE d.status IN (
            'OPEN',
            'PARTIALLY_FULFILLED'
          )

          ORDER BY
            d.created_at DESC
        `);

      res.json(
        demands
      );
    } catch (error) {
      console.error(
        "Open demand fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// MAIN NEW FEATURE:
// FARMER CAN SEE EVERY OPEN BUYER DEMAND
// =====================================================

app.get(
  "/api/farmers/:farmerId/open-demands",
  async (req, res) => {
    try {
      const farmerId =
        Number(
          req.params
            .farmerId
        );

      if (!farmerId) {
        return res.status(400).json({
          message:
            "Invalid farmer ID.",
        });
      }

      const farmer =
        await query(
          `
            SELECT id
            FROM users

            WHERE id = ?
            AND role = 'FARMER'
          `,
          [farmerId]
        );

      if (!farmer.length) {
        return res.status(404).json({
          message:
            "Farmer not found.",
        });
      }

      const demands =
        await query(`
          SELECT
            d.*,

            u.name AS buyer_name,
            u.phone AS buyer_phone,

            COALESCE(
              (
                SELECT
                  SUM(
                    so.offered_quantity
                  )

                FROM supply_offers so

                WHERE so.demand_id =
                  d.id

                AND so.status IN (
                  'PENDING',
                  'ACCEPTED'
                )
              ),
              0
            ) AS committed_quantity,

            COALESCE(
              (
                SELECT
                  SUM(
                    so.offered_quantity
                  )

                FROM supply_offers so

                WHERE so.demand_id =
                  d.id

                AND so.status =
                  'ACCEPTED'
              ),
              0
            ) AS accepted_quantity

          FROM buyer_demands d

          JOIN users u
            ON d.buyer_id =
               u.id

          WHERE d.status IN (
            'OPEN',
            'PARTIALLY_FULFILLED'
          )

          ORDER BY
            d.created_at DESC
        `);

      const result =
        demands
          .map(
            (demand) => {
              const required =
                toNum(
                  demand.required_quantity
                );

              const committed =
                toNum(
                  demand.committed_quantity
                );

              const accepted =
                toNum(
                  demand.accepted_quantity
                );

              const remaining =
                Math.max(
                  required -
                    accepted,
                  0
                );

              const uncommitted =
                Math.max(
                  required -
                    committed,
                  0
                );

              return {
                ...demand,

                committed_quantity:
                  committed,

                accepted_quantity:
                  accepted,

                remaining_quantity:
                  remaining,

                uncommitted_quantity:
                  uncommitted,

                fulfillment_percentage:
                  required
                    ? Math.round(
                        (
                          accepted /
                          required
                        ) *
                          100
                      )
                    : 0,
              };
            }
          )
          .filter(
            (d) =>
              d.remaining_quantity >
              0
          );

      res.json(result);
    } catch (error) {
      console.error(
        "Farmer open demand error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// SMART MATCHING
// =====================================================

app.get(
  "/api/demands/:demandId/matches",
  async (req, res) => {
    try {
      const demandRows =
        await query(
          `
            SELECT *
            FROM buyer_demands
            WHERE id = ?
          `,
          [
            req.params
              .demandId,
          ]
        );

      if (!demandRows.length) {
        return res.status(404).json({
          message:
            "Demand not found.",
        });
      }

      const demand =
        demandRows[0];

      const products =
        await query(
          `
            SELECT
              p.*,

              u.name AS farmer_name,
              u.phone AS farmer_phone

            FROM products p

            JOIN users u
              ON p.farmer_id =
                 u.id

            WHERE p.status =
              'AVAILABLE'

            AND p.quantity > 0

            AND LOWER(
              p.crop_name
            ) =
              LOWER(?)

            AND p.unit = ?

            AND p.price_per_unit <=
                COALESCE(
                  ?,
                  999999999
                )

            AND (
              ? = 'ANY'
              OR p.size = ?
              OR p.size = 'ANY'
            )

            AND (
              ? = 'ANY'
              OR p.quality = ?
              OR p.quality = 'ANY'
            )

            AND (
              ? = 'ANY'
              OR p.condition_type = ?
              OR p.condition_type = 'ANY'
            )

            ORDER BY
              p.price_per_unit ASC,
              p.quantity DESC
          `,
          [
            demand.crop_name,
            demand.unit,
            demand.max_price_per_unit,
            demand.preferred_size,
            demand.preferred_size,
            demand.preferred_quality,
            demand.preferred_quality,
            demand.preferred_condition,
            demand.preferred_condition,
          ]
        );

      let remaining =
        toNum(
          demand.required_quantity
        );

      const matches =
        [];

      for (
        const p of products
      ) {
        if (
          remaining <= 0
        ) {
          break;
        }

        const m =
          Math.min(
            toNum(
              p.quantity
            ),
            remaining
          );

        matches.push({
          ...p,
          matched_quantity:
            m,
        });

        remaining -=
          m;
      }

      const matched =
        toNum(
          demand.required_quantity
        ) -
        remaining;

      res.json({
        demand,

        matches,

        summary: {
          required_quantity:
            toNum(
              demand.required_quantity
            ),

          matched_quantity:
            matched,

          remaining_quantity:
            Math.max(
              remaining,
              0
            ),

          match_percentage:
            demand.required_quantity
              ? Math.round(
                  (
                    matched /
                    demand.required_quantity
                  ) *
                    100
                )
              : 0,

          fully_matched:
            remaining <= 0,
        },
      });
    } catch (error) {
      console.error(
        "Matching error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// CREATE SUPPLY OFFER
// =====================================================
// MULTI-FARMER LOGIC:
//
// Buyer demand = 1000 KG
//
// Farmer A -> 300 KG
// Farmer B -> 400 KG
// Farmer C -> 300 KG
//
// Total = 1000 KG
//
// New offers are blocked once the demand is fully
// committed by pending + accepted offers.
// =====================================================

app.post(
  "/api/supply-offers",
  async (req, res) => {
    try {
      const {
        demand_id,
        farmer_id,
        product_id,
        offered_quantity,
        offered_price_per_unit,
        message,
      } = req.body;

      if (
        !demand_id ||
        !farmer_id ||
        !product_id ||
        !offered_quantity ||
        !offered_price_per_unit
      ) {
        return res.status(400).json({
          message:
            "Required fields are missing.",
        });
      }

      if (
        toNum(
          offered_quantity
        ) <= 0
      ) {
        return res.status(400).json({
          message:
            "Offered quantity must be greater than zero.",
        });
      }

      if (
        toNum(
          offered_price_per_unit
        ) < 0
      ) {
        return res.status(400).json({
          message:
            "Offered price cannot be negative.",
        });
      }

      const farmer =
        await query(
          `
            SELECT id
            FROM users
            WHERE id = ?
            AND role = 'FARMER'
          `,
          [farmer_id]
        );

      if (!farmer.length) {
        return res.status(403).json({
          message:
            "Only farmers can send supply offers.",
        });
      }

      const demands =
        await query(
          `
            SELECT *
            FROM buyer_demands

            WHERE id = ?

            AND status IN (
              'OPEN',
              'PARTIALLY_FULFILLED'
            )
          `,
          [demand_id]
        );

      if (!demands.length) {
        return res.status(404).json({
          message:
            "Demand not found or already fulfilled.",
        });
      }

      const demand =
        demands[0];

      const products =
        await query(
          `
            SELECT *
            FROM products

            WHERE id = ?

            AND farmer_id = ?

            AND status =
              'AVAILABLE'

            AND quantity > 0
          `,
          [
            product_id,
            farmer_id,
          ]
        );

      if (!products.length) {
        return res.status(403).json({
          message:
            "Invalid product listing.",
        });
      }

      const product =
        products[0];

      if (
        toNum(
          offered_quantity
        ) >
        toNum(
          product.quantity
        )
      ) {
        return res.status(400).json({
          message:
            `Offered quantity exceeds available stock of ${product.quantity} ${product.unit}.`,
        });
      }

      // =================================================
      // IMPORTANT:
      // Pending + Accepted offers count as committed.
      // =================================================

      const committedRows =
        await query(
          `
            SELECT
              COALESCE(
                SUM(
                  offered_quantity
                ),
                0
              ) AS committed_quantity

            FROM supply_offers

            WHERE demand_id = ?

            AND status IN (
              'PENDING',
              'ACCEPTED'
            )
          `,
          [demand_id]
        );

      const committed =
        toNum(
          committedRows[0]
            ?.committed_quantity
        );

      const required =
        toNum(
          demand.required_quantity
        );

      const remainingForOffers =
        Math.max(
          required -
            committed,
          0
        );

      if (
        toNum(
          offered_quantity
        ) >
        remainingForOffers
      ) {
        return res.status(409).json({
          message:
            `Only ${remainingForOffers} ${demand.unit} is still available for new offers.`,

          remaining_quantity:
            remainingForOffers,
        });
      }

      // =================================================
      // ONE PENDING OFFER PER FARMER
      // =================================================

      const existingOffer =
        await query(
          `
            SELECT id

            FROM supply_offers

            WHERE demand_id = ?

            AND farmer_id = ?

            AND status =
              'PENDING'
          `,
          [
            demand_id,
            farmer_id,
          ]
        );

      if (existingOffer.length) {
        return res.status(409).json({
          message:
            "You already have a pending offer for this demand.",
        });
      }

      const result =
        await query(
          `
            INSERT INTO supply_offers
            (
              demand_id,
              farmer_id,
              product_id,
              offered_quantity,
              offered_price_per_unit,
              message
            )
            VALUES (
              ?,?,?,?,?,?
            )
          `,
          [
            demand_id,
            farmer_id,
            product_id,
            offered_quantity,
            offered_price_per_unit,
            message ||
              null,
          ]
        );

      res.status(201).json({
        message:
          "Supply offer sent successfully.",

        offerId:
          result.insertId,

        remaining_after_offer:
          Number(
            (
              remainingForOffers -
              toNum(
                offered_quantity
              )
            ).toFixed(2)
          ),
      });
    } catch (error) {
      console.error(
        "Supply offer creation error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// GET OFFERS FOR BUYER
// =====================================================

app.get(
  "/api/demands/:demandId/offers",
  async (req, res) => {
    try {
      const offers =
        await query(
          `
            SELECT
              so.*,

              u.name AS farmer_name,
              u.phone AS farmer_phone,

              p.crop_name,
              p.location,
              p.size,
              p.quality,
              p.condition_type,
              p.image_url,
              p.unit

            FROM supply_offers so

            JOIN users u
              ON so.farmer_id =
                 u.id

            JOIN products p
              ON so.product_id =
                 p.id

            WHERE so.demand_id = ?

            ORDER BY
              so.created_at ASC
          `,
          [
            req.params
              .demandId,
          ]
        );

      res.json(
        offers
      );
    } catch (error) {
      console.error(
        "Offer fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// ACCEPT / REJECT SUPPLY OFFER
// =====================================================

app.put(
  "/api/supply-offers/:offerId/status",
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

      if (
        ![
          "ACCEPTED",
          "REJECTED",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid status.",
        });
      }

      const offers =
        await query(
          `
            SELECT
              so.*,

              d.buyer_id,
              d.required_quantity,
              d.destination,
              d.delivery_address,
              d.delivery_contact_name,
              d.delivery_phone,
              d.required_date,
              d.status AS demand_status

            FROM supply_offers so

            JOIN buyer_demands d
              ON so.demand_id =
                 d.id

            WHERE so.id = ?
          `,
          [
            req.params
              .offerId,
          ]
        );

      if (!offers.length) {
        return res.status(404).json({
          message:
            "Supply offer not found.",
        });
      }

      const offer =
        offers[0];

      if (
        offer.status !==
        "PENDING"
      ) {
        return res.status(400).json({
          message:
            "This offer has already been processed.",
        });
      }

      // =================================================
      // REJECT
      // =================================================

      if (
        status ===
        "REJECTED"
      ) {
        await query(
          `
            UPDATE supply_offers

            SET status =
              'REJECTED'

            WHERE id = ?
          `,
          [
            req.params
              .offerId,
          ]
        );

        return res.json({
          message:
            "Supply offer rejected.",
        });
      }

      // =================================================
      // DEMAND MUST STILL BE OPEN
      // =================================================

      if (
        ![
          "OPEN",
          "PARTIALLY_FULFILLED",
        ].includes(
          offer.demand_status
        )
      ) {
        return res.status(409).json({
          message:
            "This demand is no longer open.",
        });
      }

      // =================================================
      // RE-CHECK ACCEPTED QUANTITY
      // =================================================

      const acceptedRows =
        await query(
          `
            SELECT
              COALESCE(
                SUM(
                  offered_quantity
                ),
                0
              ) AS accepted_quantity

            FROM supply_offers

            WHERE demand_id = ?

            AND status =
              'ACCEPTED'

            AND id <> ?
          `,
          [
            offer.demand_id,
            offer.id,
          ]
        );

      const accepted =
        toNum(
          acceptedRows[0]
            ?.accepted_quantity
        );

      const required =
        toNum(
          offer.required_quantity
        );

      const remaining =
        Math.max(
          required -
            accepted,
          0
        );

      if (
        toNum(
          offer.offered_quantity
        ) >
        remaining
      ) {
        return res.status(409).json({
          message:
            `Cannot accept this offer. Only ${remaining} ${offer.unit || "KG"} is still required.`,

          remaining_quantity:
            remaining,
        });
      }

      // =================================================
      // STOCK CHECK
      // =================================================

      const stock =
        await query(
          `
            SELECT
              quantity,
              status

            FROM products

            WHERE id = ?
          `,
          [offer.product_id]
        );

      if (
        !stock.length ||
        stock[0].status !==
          "AVAILABLE" ||
        toNum(
          stock[0].quantity
        ) <
          toNum(
            offer.offered_quantity
          )
      ) {
        return res.status(409).json({
          message:
            "Insufficient stock to accept this offer.",
        });
      }

      // =================================================
      // ATOMIC STOCK UPDATE
      // =================================================

      const updateResult =
        await query(
          `
            UPDATE products

            SET
              quantity =
                quantity - ?,

              status =
                CASE
                  WHEN
                    quantity - ? <= 0
                  THEN
                    'SOLD'
                  ELSE
                    status
                END

            WHERE id = ?

            AND status =
              'AVAILABLE'

            AND quantity >= ?
          `,
          [
            offer.offered_quantity,
            offer.offered_quantity,
            offer.product_id,
            offer.offered_quantity,
          ]
        );

      if (
        !updateResult.affectedRows
      ) {
        return res.status(409).json({
          message:
            "Stock changed. Please refresh and try again.",
        });
      }

      // =================================================
      // ACCEPT OFFER
      // =================================================

      await query(
        `
          UPDATE supply_offers

          SET status =
            'ACCEPTED'

          WHERE id = ?
        `,
        [
          req.params
            .offerId,
        ]
      );

      // =================================================
      // CREATE ORDER
      // =================================================

      const orderId =
        await createOrderFromSource({
          buyerId:
            offer.buyer_id,

          farmerId:
            offer.farmer_id,

          productId:
            offer.product_id,

          quantity:
            offer.offered_quantity,

          pricePerUnit:
            offer.offered_price_per_unit,

          supplyOfferId:
            offer.id,

          demandId:
            offer.demand_id,

          deliveryCity:
            offer.destination,

          deliveryAddress:
            offer.delivery_address,

          buyerContactName:
            offer.delivery_contact_name,

          buyerPhone:
            offer.delivery_phone,

          requiredDate:
            offer.required_date,
        });

      // =================================================
      // UPDATE DEMAND STATUS
      // =================================================

      const acceptedAfter =
        await query(
          `
            SELECT
              COALESCE(
                SUM(
                  offered_quantity
                ),
                0
              ) AS total

            FROM supply_offers

            WHERE demand_id = ?

            AND status =
              'ACCEPTED'
          `,
          [
            offer.demand_id,
          ]
        );

      const acceptedTotal =
        toNum(
          acceptedAfter[0]
            ?.total
        );

      if (
        acceptedTotal >=
        required
      ) {
        await query(
          `
            UPDATE buyer_demands

            SET status =
              'FULFILLED'

            WHERE id = ?
          `,
          [
            offer.demand_id,
          ]
        );
      } else {
        await query(
          `
            UPDATE buyer_demands

            SET status =
              'PARTIALLY_FULFILLED'

            WHERE id = ?
          `,
          [
            offer.demand_id,
          ]
        );
      }

      res.json({
        message:
          "Supply offer accepted and order created.",

        orderId,

        accepted_quantity:
          acceptedTotal,

        remaining_quantity:
          Math.max(
            required -
              acceptedTotal,
            0
          ),
      });
    } catch (error) {
      console.error(
        "Offer status error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// FARMER SUPPLY REQUESTS
// =====================================================

app.get(
  "/api/farmers/:farmerId/requests",
  async (req, res) => {
    try {
      const rows =
        await query(
          `
            SELECT
              so.*,

              d.crop_name,
              d.required_quantity,
              d.unit,
              d.destination,
              d.delivery_address,
              d.required_date,

              u.name AS buyer_name,
              u.phone AS buyer_phone,

              p.location,
              p.size,
              p.quality,
              p.condition_type,
              p.image_url

            FROM supply_offers so

            JOIN buyer_demands d
              ON so.demand_id =
                 d.id

            JOIN users u
              ON d.buyer_id =
                 u.id

            JOIN products p
              ON so.product_id =
                 p.id

            WHERE so.farmer_id = ?

            ORDER BY
              so.created_at DESC
          `,
          [
            req.params
              .farmerId,
          ]
        );

      res.json(
        rows
      );
    } catch (error) {
      console.error(
        "Farmer supply request fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// DIRECT BUYER REQUESTS
// =====================================================

app.post(
  "/api/buyer-requests",
  async (req, res) => {
    try {
      const {
        buyer_id,
        farmer_id,
        product_id,
        requested_quantity,
        offered_price_per_unit,
        message,
        delivery_city,
        destination,
        delivery_address,
        delivery_contact_name,
        delivery_phone,
        delivery_lat,
        delivery_lng,
        required_date,
      } = req.body;

      if (
        !buyer_id ||
        !farmer_id ||
        !product_id ||
        !requested_quantity
      ) {
        return res.status(400).json({
          message:
            "Buyer, farmer, product and quantity are required.",
        });
      }

      const buyerRows =
        await query(
          `
            SELECT
              id,
              name,
              phone,
              location

            FROM users

            WHERE id = ?
            AND role = 'BUYER'
          `,
          [
            buyer_id,
          ]
        );

      if (!buyerRows.length) {
        return res.status(403).json({
          message:
            "Only buyers can send supply requests.",
        });
      }

      const farmerRows =
        await query(
          `
            SELECT id
            FROM users
            WHERE id = ?
            AND role = 'FARMER'
          `,
          [
            farmer_id,
          ]
        );

      if (!farmerRows.length) {
        return res.status(403).json({
          message:
            "Invalid farmer.",
        });
      }

      const productRows =
        await query(
          `
            SELECT *
            FROM products

            WHERE id = ?

            AND farmer_id = ?

            AND status =
              'AVAILABLE'

            AND quantity > 0
          `,
          [
            product_id,
            farmer_id,
          ]
        );

      if (!productRows.length) {
        return res.status(404).json({
          message:
            "Farmer listing not found or unavailable.",
        });
      }

      const product =
        productRows[0];

      if (
        toNum(
          requested_quantity
        ) <= 0 ||
        toNum(
          requested_quantity
        ) >
          toNum(
            product.quantity
          )
      ) {
        return res.status(400).json({
          message:
            `Requested quantity cannot exceed available stock of ${product.quantity} ${product.unit}.`,
        });
      }

      const pending =
        await query(
          `
            SELECT id
            FROM buyer_requests

            WHERE buyer_id = ?

            AND product_id = ?

            AND status =
              'PENDING'
          `,
          [
            buyer_id,
            product_id,
          ]
        );

      if (pending.length) {
        return res.status(409).json({
          message:
            "You already have a pending request for this listing.",
        });
      }

      const city =
        delivery_city ||
        destination ||
        buyerRows[0]
          .location ||
        "Mumbai";

      const phone =
        delivery_phone ||
        buyerRows[0]
          .phone ||
        "";

      if (!phone) {
        return res.status(400).json({
          message:
            "Buyer phone number is required for order coordination.",
        });
      }

      if (
        !delivery_address
      ) {
        return res.status(400).json({
          message:
            "Delivery address is required.",
        });
      }

      if (
        !required_date
      ) {
        return res.status(400).json({
          message:
            "Delivery date is required.",
        });
      }

      const result =
        await query(
          `
            INSERT INTO buyer_requests
            (
              buyer_id,
              farmer_id,
              product_id,
              requested_quantity,
              offered_price_per_unit,
              destination,
              delivery_city,
              delivery_address,
              delivery_contact_name,
              delivery_phone,
              delivery_lat,
              delivery_lng,
              required_date,
              message
            )
            VALUES (
              ?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
          `,
          [
            buyer_id,
            farmer_id,
            product_id,
            requested_quantity,
            offered_price_per_unit ||
              product.price_per_unit,
            city,
            city,
            delivery_address,
            delivery_contact_name ||
              buyerRows[0]
                .name,
            phone,
            delivery_lat ||
              null,
            delivery_lng ||
              null,
            required_date,
            message ||
              null,
          ]
        );

      res.status(201).json({
        message:
          "Supply request sent to farmer successfully.",

        requestId:
          result.insertId,
      });
    } catch (error) {
      console.error(
        "Buyer request error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// FARMER DIRECT REQUESTS
// =====================================================

app.get(
  "/api/farmers/:farmerId/buyer-requests",
  async (req, res) => {
    try {
      const rows =
        await query(
          `
            SELECT
              br.*,

              u.name AS buyer_name,
              u.phone AS buyer_profile_phone,

              p.crop_name,
              p.unit,
              p.quantity AS available_quantity,
              p.location,
              p.price_per_unit,
              p.size,
              p.quality,
              p.condition_type,
              p.image_url

            FROM buyer_requests br

            JOIN users u
              ON br.buyer_id =
                 u.id

            JOIN products p
              ON br.product_id =
                 p.id

            WHERE br.farmer_id = ?

            ORDER BY
              CASE
                WHEN br.status =
                  'PENDING'
                THEN 1

                WHEN br.status =
                  'ACCEPTED'
                THEN 2

                ELSE 3
              END,

              br.created_at DESC
          `,
          [
            req.params
              .farmerId,
          ]
        );

      res.json(
        rows
      );
    } catch (error) {
      console.error(
        "Buyer request fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// BUYER REQUEST HISTORY
// =====================================================

app.get(
  "/api/buyers/:buyerId/requests",
  async (req, res) => {
    try {
      const rows =
        await query(
          `
            SELECT
              br.*,

              u.name AS farmer_name,
              u.phone AS farmer_phone,

              p.crop_name,
              p.unit,
              p.location,
              p.image_url,
              p.price_per_unit

            FROM buyer_requests br

            JOIN users u
              ON br.farmer_id =
                 u.id

            JOIN products p
              ON br.product_id =
                 p.id

            WHERE br.buyer_id = ?

            ORDER BY
              br.created_at DESC
          `,
          [
            req.params
              .buyerId,
          ]
        );

      res.json(
        rows
      );
    } catch (error) {
      console.error(
        "Buyer request history error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// DIRECT REQUEST ACCEPT / REJECT
// =====================================================

app.put(
  "/api/buyer-requests/:requestId/status",
  async (req, res) => {
    try {
      const {
        status,
        farmer_id,
      } = req.body;

      if (
        ![
          "ACCEPTED",
          "REJECTED",
          "CANCELLED",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid request status.",
        });
      }

      const requests =
        await query(
          `
            SELECT
              br.*,

              p.quantity AS current_quantity,
              p.status AS product_status

            FROM buyer_requests br

            JOIN products p
              ON br.product_id =
                 p.id

            WHERE br.id = ?
          `,
          [
            req.params
              .requestId,
          ]
        );

      if (!requests.length) {
        return res.status(404).json({
          message:
            "Buyer request not found.",
        });
      }

      const request =
        requests[0];

      if (
        status ===
        "CANCELLED"
      ) {
        const allowedBuyer =
          req.body.buyer_id &&
          Number(
            req.body.buyer_id
          ) ===
            Number(
              request.buyer_id
            );

        if (!allowedBuyer) {
          return res.status(403).json({
            message:
              "Only the requesting buyer can cancel this request.",
          });
        }

        if (
          request.status !==
          "PENDING"
        ) {
          return res.status(400).json({
            message:
              "Only pending requests can be cancelled.",
          });
        }

        await query(
          `
            UPDATE buyer_requests

            SET status =
              'CANCELLED'

            WHERE id = ?
          `,
          [
            request.id,
          ]
        );

        return res.json({
          message:
            "Supply request cancelled.",
        });
      }

      if (
        Number(farmer_id) !==
        Number(
          request.farmer_id
        )
      ) {
        return res.status(403).json({
          message:
            "Only the listing farmer can process this request.",
        });
      }

      if (
        request.status !==
        "PENDING"
      ) {
        return res.status(400).json({
          message:
            "This request has already been processed.",
        });
      }

      if (
        status ===
        "REJECTED"
      ) {
        await query(
          `
            UPDATE buyer_requests

            SET status =
              'REJECTED'

            WHERE id = ?
          `,
          [
            request.id,
          ]
        );

        return res.json({
          message:
            "Buyer request rejected.",
        });
      }

      if (
        request.product_status !==
          "AVAILABLE" ||
        toNum(
          request.current_quantity
        ) <
          toNum(
            request.requested_quantity
          )
      ) {
        return res.status(409).json({
          message:
            "Insufficient stock to accept this request.",
        });
      }

      await query(
        `
          UPDATE products

          SET
            quantity =
              quantity - ?,

            status =
              CASE
                WHEN quantity - ? <= 0
                THEN 'SOLD'
                ELSE status
              END

          WHERE id = ?

          AND status =
            'AVAILABLE'

          AND quantity >= ?
        `,
        [
          request.requested_quantity,
          request.requested_quantity,
          request.product_id,
          request.requested_quantity,
        ]
      );

      await query(
        `
          UPDATE buyer_requests

          SET status =
            'ACCEPTED'

          WHERE id = ?
        `,
        [
          request.id,
        ]
      );

      const orderId =
        await createOrderFromSource({
          buyerId:
            request.buyer_id,

          farmerId:
            request.farmer_id,

          productId:
            request.product_id,

          quantity:
            request.requested_quantity,

          pricePerUnit:
            request.offered_price_per_unit,

          buyerRequestId:
            request.id,

          deliveryCity:
            request.delivery_city ||
            request.destination ||
            "Mumbai",

          deliveryAddress:
            request.delivery_address,

          buyerContactName:
            request.delivery_contact_name,

          buyerPhone:
            request.delivery_phone,

          requiredDate:
            request.required_date,
        });

      res.json({
        message:
          "Buyer request accepted and order created.",

        orderId,
      });
    } catch (error) {
      console.error(
        "Buyer request status error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// ORDERS
// =====================================================

app.get(
  "/api/orders",
  async (req, res) => {
    try {
      const {
        role,
        userId,
      } = req.query;

      if (
        !role ||
        !userId
      ) {
        return res.status(400).json({
          message:
            "role and userId are required.",
        });
      }

      const where =
        role ===
        "BUYER"
          ? "o.buyer_id=?"
          : "o.farmer_id=?";

      const orders =
        await query(
          `
            SELECT
              o.*,

              ub.name AS buyer_name,
              uf.name AS farmer_name,

              s.shipment_code,
              s.status AS shipment_status

            FROM orders o

            JOIN users ub
              ON o.buyer_id =
                 ub.id

            JOIN users uf
              ON o.farmer_id =
                 uf.id

            LEFT JOIN shipments s
              ON o.shipment_id =
                 s.id

            WHERE ${where}

            ORDER BY
              o.created_at DESC
          `,
          [
            userId,
          ]
        );

      const ordersWithTracking = [];
      for (const ord of orders) {
        const tr = await getLatestTracking(ord.id);
        const originCoord = getCoordinates(ord.pickup_location, ord.pickup_lat, ord.pickup_lng);
        const destCoord = getCoordinates(ord.delivery_city);
        ordersWithTracking.push({
          ...ord,
          origin_lat: originCoord ? originCoord.lat : null,
          origin_lng: originCoord ? originCoord.lng : null,
          dest_lat: destCoord ? destCoord.lat : null,
          dest_lng: destCoord ? destCoord.lng : null,
          live_lat: tr && tr.latitude !== null ? tr.latitude : (originCoord ? originCoord.lat : null),
          live_lng: tr && tr.longitude !== null ? tr.longitude : (originCoord ? originCoord.lng : null),
          tracking_status: tr ? tr.status : ord.status,
          tracking_message: tr ? tr.message : null,
          tracking_updated_at: tr ? tr.recorded_at : null,
        });
      }

      res.json(ordersWithTracking);
    } catch (error) {
      console.error("Orders fetch error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// =====================================================
// ORDER DETAIL
// =====================================================

app.get(
  "/api/orders/:orderId",
  async (req, res) => {
    try {
      const rows =
        await query(
          `
            SELECT
              o.*,

              ub.name AS buyer_name,
              ub.phone AS buyer_account_phone,

              uf.name AS farmer_name,
              uf.phone AS farmer_account_phone,

              s.shipment_code,
              s.status AS shipment_status

            FROM orders o

            JOIN users ub
              ON o.buyer_id =
                 ub.id

            JOIN users uf
              ON o.farmer_id =
                 uf.id

            LEFT JOIN shipments s
              ON o.shipment_id =
                 s.id

            WHERE o.id = ?
          `,
          [
            req.params.orderId,
          ]
        );

      if (!rows.length) {
        return res.status(404).json({
          message: "Order not found.",
        });
      }

      const history =
        await query(
          `
            SELECT *
            FROM order_status_history
            WHERE order_id = ?
            ORDER BY created_at ASC
          `,
          [
            req.params.orderId,
          ]
        );

      const latestTracking = await getLatestTracking(req.params.orderId);
      const originCoord = getCoordinates(rows[0].pickup_location, rows[0].pickup_lat, rows[0].pickup_lng);
      const destCoord = getCoordinates(rows[0].delivery_city);

      res.json({
        order: {
          ...rows[0],
          origin_lat: originCoord ? originCoord.lat : null,
          origin_lng: originCoord ? originCoord.lng : null,
          dest_lat: destCoord ? destCoord.lat : null,
          dest_lng: destCoord ? destCoord.lng : null,
          live_lat: latestTracking && latestTracking.latitude !== null ? latestTracking.latitude : (originCoord ? originCoord.lat : null),
          live_lng: latestTracking && latestTracking.longitude !== null ? latestTracking.longitude : (originCoord ? originCoord.lng : null),
          tracking_status: latestTracking ? latestTracking.status : rows[0].status,
          tracking_message: latestTracking ? latestTracking.message : null,
          tracking_updated_at: latestTracking ? latestTracking.recorded_at : null,
        },
        history,
        latest_tracking: latestTracking,
      });
    } catch (error) {
      console.error("Order detail error:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// =====================================================
// ORDER ROUTE GEOMETRY & LIVE TRACKING (FROM ACCEPTED PICKUP TO PLACED DELIVERY CITY)
// =====================================================

app.get("/api/orders/:orderId/route-geometry", async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const rows = await query(
      `SELECT o.*, uf.name AS farmer_name, ub.name AS buyer_name
       FROM orders o
       JOIN users uf ON o.farmer_id = uf.id
       JOIN users ub ON o.buyer_id = ub.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = rows[0];

    // From where the order is accepted (Farmer's pickup location)
    const originCoord = getCoordinates(order.pickup_location, order.pickup_lat, order.pickup_lng) || { lat: 19.9975, lng: 73.7898 };

    // To where order is placed (General delivery city only — NOT exact street address)
    const destCoord = getCoordinates(order.delivery_city) || { lat: 19.076, lng: 72.8777 };

    // Get latest live tracking (GPS)
    const latestTracking = await getLatestTracking(orderId);

    // Call OSRM to get real road polyline connecting this specific farmer's pickup to destination
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originCoord.lng},${originCoord.lat};${destCoord.lng},${destCoord.lat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { "User-Agent": "SmartAgriConnect-SIH2026/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (osrmRes.ok) {
        const data = await osrmRes.json();
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          return res.json({
            success: true,
            order_id: orderId,
            order_code: order.order_code,
            farmer_name: order.farmer_name,
            buyer_name: order.buyer_name,
            crop_name: order.crop_name,
            quantity: order.quantity,
            unit: order.unit,
            status: order.status,
            origin: {
              label: `Accepted Pickup (${order.pickup_location || "Farmer Pickup"})`,
              location: order.pickup_location,
              farmer_name: order.farmer_name,
              lat: originCoord.lat,
              lng: originCoord.lng,
            },
            destination: {
              label: `Order Destination (${order.delivery_city || "Delivery City"})`,
              city: order.delivery_city,
              lat: destCoord.lat,
              lng: destCoord.lng,
            },
            provider: "OSRM",
            distance_km: Number((r.distance / 1000).toFixed(1)),
            duration_minutes: Math.round(r.duration / 60),
            geometry: r.geometry,
            live_tracking: latestTracking || {
              latitude: originCoord.lat,
              longitude: originCoord.lng,
              status: order.status,
              recorded_at: order.created_at,
            },
          });
        }
      }
    } catch (e) {
      console.warn("OSRM order route fallback:", e.message);
    }

    // Fallback: straight line from pickup origin to destination
    res.json({
      success: true,
      order_id: orderId,
      order_code: order.order_code,
      farmer_name: order.farmer_name,
      buyer_name: order.buyer_name,
      crop_name: order.crop_name,
      quantity: order.quantity,
      unit: order.unit,
      status: order.status,
      origin: {
        label: `Accepted Pickup (${order.pickup_location || "Farmer Pickup"})`,
        location: order.pickup_location,
        farmer_name: order.farmer_name,
        lat: originCoord.lat,
        lng: originCoord.lng,
      },
      destination: {
        label: `Order Destination (${order.delivery_city || "Delivery City"})`,
        city: order.delivery_city,
        lat: destCoord.lat,
        lng: destCoord.lng,
      },
      provider: "FALLBACK",
      distance_km: Math.round(haversineDistance(originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng) * 1.2),
      duration_minutes: 120,
      geometry: {
        type: "LineString",
        coordinates: [
          [originCoord.lng, originCoord.lat],
          [destCoord.lng, destCoord.lat],
        ],
      },
      live_tracking: latestTracking || {
        latitude: originCoord.lat,
        longitude: originCoord.lng,
        status: order.status,
        recorded_at: order.created_at,
      },
    });
  } catch (error) {
    console.error("Order route geometry error:", error);
    res.status(500).json({ success: false, message: "Unable to calculate order route." });
  }
});

// =====================================================
// ORDER TRANSITIONS
// =====================================================

const allowedTransitions = {
  ACCEPTED: [
    "PACKED",
    "CANCELLED",
  ],

  PACKED: [
    "READY_TO_DISPATCH",
    "CANCELLED",
  ],

  READY_TO_DISPATCH: [
    "IN_TRANSIT",
    "CANCELLED",
  ],

  IN_TRANSIT: [
    "ARRIVED",
  ],

  ARRIVED: [
    "DELIVERED",
  ],

  DELIVERED: [],

  CANCELLED: [],
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

app.put(
  "/api/orders/:orderId/status",
  async (req, res) => {
    try {
      const {
        status,
        actor_id,
        actor_role,
        note,
      } = req.body || {};

      const rows =
        await query(
          `
            SELECT *
            FROM orders
            WHERE id = ?
          `,
          [
            req.params
              .orderId,
          ]
        );

      if (!rows.length) {
        return res.status(404).json({
          message:
            "Order not found.",
        });
      }

      const order =
        rows[0];

      const allowed =
        allowedTransitions[
          order.status
        ] || [];

      if (
        !allowed.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            `Cannot move order from ${order.status} to ${status}.`,
        });
      }

      if (
        actor_role ===
          "FARMER" &&
        Number(actor_id) !==
          Number(
            order.farmer_id
          )
      ) {
        return res.status(403).json({
          message:
            "Only the order farmer can update shipment preparation status.",
        });
      }

      if (
        actor_role ===
          "BUYER" &&
        Number(actor_id) !==
          Number(
            order.buyer_id
          )
      ) {
        return res.status(403).json({
          message:
            "Only the order buyer can update this order.",
        });
      }

      if (
        [
          "PACKED",
          "READY_TO_DISPATCH",
          "IN_TRANSIT",
        ].includes(status) &&
        actor_role !==
          "FARMER"
      ) {
        return res.status(403).json({
          message:
            "Farmer action required for this status.",
        });
      }

      if (
        ["DELIVERED"].includes(
          status
        ) &&
        ![
          "BUYER",
          "FARMER",
        ].includes(
          actor_role
        )
      ) {
        return res.status(403).json({
          message:
            "Authorized order participant required.",
        });
      }

      await query(
        `
          UPDATE orders

          SET status = ?

          WHERE id = ?
        `,
        [
          status,
          order.id,
        ]
      );

      if (
        status ===
          "IN_TRANSIT" &&
        order.shipment_id
      ) {
        await query(
          `
            UPDATE shipments

            SET
              dispatch_at =
                COALESCE(
                  dispatch_at,
                  NOW()
                ),

              status =
                'IN_TRANSIT'

            WHERE id = ?
          `,
          [
            order.shipment_id,
          ]
        );
      }

      await addOrderHistory(
        order.id,
        status,
        note ||
          `Order moved to ${status.replaceAll(
            "_",
            " "
          )}.`,
        actor_id ||
          null
      );

      await updateShipmentAggregate(
        order.shipment_id
      );

      // Keep shipment_tracking synchronized
      await query(
        `INSERT INTO shipment_tracking (shipment_id, order_id, farmer_id, status, message)
         VALUES (?, ?, ?, ?, ?)`,
        [order.shipment_id || 0, order.id, order.farmer_id, status, note || `Status updated to ${status}`]
      );

      // Real-time notification over Socket.IO
      io.emit("tracking:update", {
        order_id: order.id,
        shipment_id: order.shipment_id,
        farmer_id: order.farmer_id,
        status,
        message: note || `Status updated to ${status}`,
        timestamp: new Date().toISOString(),
      });
      io.emit("order:update", {
        order_id: order.id,
        status,
      });

      res.json({
        message:
          `Order updated to ${status}.`,
      });
    } catch (error) {
      console.error(
        "Order status error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// ORDER HISTORY
// =====================================================

app.get(
  "/api/orders/:orderId/history",
  async (req, res) => {
    try {
      const history =
        await query(
          `
            SELECT *
            FROM order_status_history

            WHERE order_id = ?

            ORDER BY
              created_at ASC
          `,
          [
            req.params
              .orderId,
          ]
        );

      res.json(
        history
      );
    } catch (error) {
      console.error(
        "Order history error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// SHIPMENTS
// =====================================================

app.get(
  "/api/shipments",
  async (req, res) => {
    try {
      const {
        role,
        userId,
      } = req.query;

      let rows;

      if (
        role ===
        "BUYER"
      ) {
        rows =
          await query(
            `
              SELECT DISTINCT
                s.*,

                COALESCE(
                  (
                    SELECT
                      SUM(
                        o.quantity
                      )

                    FROM orders o

                    WHERE o.shipment_id =
                      s.id

                    AND o.status <>
                      'CANCELLED'
                  ),
                  0
                ) AS total_quantity,

                COUNT(
                  DISTINCT o.id
                ) AS order_count

              FROM shipments s

              JOIN orders o
                ON o.shipment_id =
                   s.id

              WHERE o.buyer_id = ?

              GROUP BY
                s.id

              ORDER BY
                s.created_at DESC
            `,
            [
              userId,
            ]
          );
      } else if (
        role ===
        "FARMER"
      ) {
        rows =
          await query(
            `
              SELECT DISTINCT
                s.*,

                COALESCE(
                  (
                    SELECT
                      SUM(
                        o.quantity
                      )

                    FROM orders o

                    WHERE o.shipment_id =
                      s.id

                    AND o.status <>
                      'CANCELLED'
                  ),
                  0
                ) AS total_quantity,

                COUNT(
                  DISTINCT o.id
                ) AS order_count

              FROM shipments s

              JOIN orders o
                ON o.shipment_id =
                   s.id

              WHERE o.farmer_id = ?

              GROUP BY
                s.id

              ORDER BY
                s.created_at DESC
            `,
            [
              userId,
            ]
          );
      } else {
        rows =
          await query(
            `
              SELECT
                s.*,

                COALESCE(
                  (
                    SELECT
                      SUM(
                        o.quantity
                      )

                    FROM orders o

                    WHERE o.shipment_id =
                      s.id

                    AND o.status <>
                      'CANCELLED'
                  ),
                  0
                ) AS total_quantity,

                COUNT(
                  DISTINCT o.id
                ) AS order_count

              FROM shipments s

              LEFT JOIN orders o
                ON o.shipment_id =
                   s.id

              GROUP BY
                s.id

              ORDER BY
                s.created_at DESC
            `
          );
      }

      res.json(
        rows
      );
    } catch (error) {
      console.error(
        "Shipment list error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// SHIPMENT DETAIL
// =====================================================

app.get(
  "/api/shipments/:shipmentId",
  async (req, res) => {
    try {
      const details =
        await getShipmentDetails(
          req.params
            .shipmentId
        );

      if (!details) {
        return res.status(404).json({
          message:
            "Shipment not found.",
        });
      }

      res.json(
        details
      );
    } catch (error) {
      console.error(
        "Shipment detail error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// LEGACY LOGISTICS
// =====================================================

app.get(
  "/api/logistics/:demandId",
  async (req, res) => {
    try {
      const demandRows =
        await query(
          `
            SELECT
              d.*,

              u.name AS buyer_name,
              u.phone AS buyer_phone

            FROM buyer_demands d

            JOIN users u
              ON d.buyer_id =
                 u.id

            WHERE d.id = ?
          `,
          [
            req.params
              .demandId,
          ]
        );

      if (!demandRows.length) {
        return res.status(404).json({
          message:
            "Demand not found.",
        });
      }

      const acceptedOrders =
        await query(
          `
            SELECT
              o.*,

              u.name AS farmer_name,
              u.phone AS farmer_phone,

              p.location AS pickup_location

            FROM orders o

            JOIN users u
              ON o.farmer_id =
                 u.id

            JOIN products p
              ON o.product_id =
                 p.id

            WHERE o.demand_id = ?

            AND o.status <>
              'CANCELLED'

            ORDER BY
              o.id
          `,
          [
            req.params
              .demandId,
          ]
        );

      if (
        !acceptedOrders.length
      ) {
        return res.json({
          demand:
            demandRows[0],

          offers: [],

          route: [],

          summary: {
            total_quantity: 0,

            required_quantity:
              toNum(
                demandRows[0]
                  .required_quantity
              ),

            remaining_quantity:
              toNum(
                demandRows[0]
                  .required_quantity
              ),

            total_distance_km:
              0,

            fuel_cost:
              0,

            toll_estimate:
              0,

            driver_cost:
              0,

            loading_cost:
              0,

            total_transport_cost:
              0,
          },

          message:
            "No accepted orders yet.",
        });
      }

      const shipment =
        acceptedOrders.find(
          (o) =>
            o.shipment_id
        )?.shipment_id;

      if (
        shipment
      ) {
        const details =
          await getShipmentDetails(
            shipment
          );

        return res.json({
          demand:
            demandRows[0],

          ...details,

          offers:
            details.orders,

          summary: {
            ...details.summary,

            required_quantity:
              toNum(
                demandRows[0]
                  .required_quantity
              ),

            remaining_quantity:
              Math.max(
                toNum(
                  demandRows[0]
                    .required_quantity
                ) -
                  details.summary
                    .total_quantity,

                0
              ),
          },
        });
      }

      res.json({
        demand:
          demandRows[0],

        offers:
          acceptedOrders,

        route: [],

        summary: {
          total_quantity:
            acceptedOrders.reduce(
              (
                sum,
                o
              ) =>
                sum +
                toNum(
                  o.quantity
                ),
              0
            ),
        },
      });
    } catch (error) {
      console.error(
        "Legacy logistics error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// MARKET INTELLIGENCE
// =====================================================

app.get(
  "/api/market-intelligence",
  async (req, res) => {
    try {
      const crop =
        req.query.crop ||
        "onion";

      const markets =
        await query(
          `
            SELECT
              id,
              crop_name,
              market_name,
              market_location,
              price_per_kg,
              min_price_per_kg,
              max_price_per_kg,
              demand_level,
              demand_score,
              trend_percent,
              updated_at

            FROM market_intelligence

            WHERE LOWER(
              crop_name
            ) =
              LOWER(?)

            ORDER BY
              demand_score DESC,
              price_per_kg DESC
          `,
          [
            crop,
          ]
        );

      if (!markets.length) {
        return res.status(404).json({
          message:
            "No market data available for this crop.",
        });
      }

      const bestMarket =
        markets.reduce(
          (
            best,
            current
          ) =>
            toNum(
              current.demand_score
            ) *
              0.6 +
              toNum(
                current.price_per_kg
              ) *
                0.4 >
            toNum(
              best.demand_score
            ) *
              0.6 +
              toNum(
                best.price_per_kg
              ) *
                0.4
              ? current
              : best
        );

      const average =
        markets.reduce(
          (
            sum,
            m
          ) =>
            sum +
            toNum(
              m.price_per_kg
            ),
          0
        ) /
        markets.length;

      res.json({
        crop_name:
          crop,

        average_price_per_kg:
          Number(
            average.toFixed(
              2
            )
          ),

        best_market:
          bestMarket,

        markets,
      });
    } catch (error) {
      console.error(
        "Market intelligence error:",
        error
      );

      res.status(500).json({
        message:
          "Server error.",
      });
    }
  }
);

// =====================================================
// RATING APIS
// =====================================================

// POST /api/ratings — submit a rating
app.post("/api/ratings", async (req, res) => {
  try {
    const { order_id, reviewer_id, reviewer_role, rating, review } = req.body || {};

    if (!order_id || !reviewer_id || !reviewer_role || !rating) {
      return res.status(400).json({ success: false, message: "order_id, reviewer_id, reviewer_role and rating are required." });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5." });
    }

    if (!["FARMER", "BUYER"].includes(reviewer_role)) {
      return res.status(400).json({ success: false, message: "reviewer_role must be FARMER or BUYER." });
    }

    // Load the order and verify reviewer is involved
    const orders = await query(
      `SELECT o.*, ub.role AS buyer_role, uf.role AS farmer_role
       FROM orders o
       JOIN users ub ON o.buyer_id = ub.id
       JOIN users uf ON o.farmer_id = uf.id
       WHERE o.id = ?`,
      [order_id]
    );

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = orders[0];

    // Verify reviewer is a participant in this order
    const isBuyer = Number(reviewer_id) === Number(order.buyer_id) && reviewer_role === "BUYER";
    const isFarmer = Number(reviewer_id) === Number(order.farmer_id) && reviewer_role === "FARMER";

    if (!isBuyer && !isFarmer) {
      return res.status(403).json({ success: false, message: "You are not authorized to rate this order." });
    }

    // Order must be DELIVERED
    if (order.status !== "DELIVERED") {
      return res.status(400).json({ success: false, message: "You can only rate after the order is delivered." });
    }

    // Determine who is being reviewed
    const reviewed_user_id = isBuyer ? order.farmer_id : order.buyer_id;

    // Cannot rate yourself
    if (Number(reviewer_id) === Number(reviewed_user_id)) {
      return res.status(400).json({ success: false, message: "You cannot rate yourself." });
    }

    // Check for duplicate rating
    const existing = await query(
      `SELECT id FROM ratings WHERE order_id = ? AND reviewer_id = ? AND reviewed_user_id = ?`,
      [order_id, reviewer_id, reviewed_user_id]
    );

    if (existing.length) {
      return res.status(409).json({ success: false, message: "You have already rated this person for this order." });
    }

    const result = await query(
      `INSERT INTO ratings (order_id, reviewer_id, reviewed_user_id, reviewer_role, rating, review)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, reviewer_id, reviewed_user_id, reviewer_role, ratingNum, review || null]
    );

    res.status(201).json({ success: true, message: "Rating submitted successfully.", ratingId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "You have already rated this person for this order." });
    }
    console.error("Rating creation error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/users/:userId/ratings — get all ratings received by a user
app.get("/api/users/:userId/ratings", async (req, res) => {
  try {
    const ratings = await query(
      `SELECT r.*,
              u.name AS reviewer_name,
              o.order_code, o.crop_name, o.quantity, o.unit
       FROM ratings r
       JOIN users u ON r.reviewer_id = u.id
       JOIN orders o ON r.order_id = o.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );

    res.json({ success: true, ratings });
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/users/:userId/rating-summary — avg rating + count
app.get("/api/users/:userId/rating-summary", async (req, res) => {
  try {
    const rows = await query(
      `SELECT COUNT(*) AS total_ratings,
              ROUND(AVG(rating), 1) AS average_rating
       FROM ratings
       WHERE reviewed_user_id = ?`,
      [req.params.userId]
    );

    const { total_ratings, average_rating } = rows[0];
    res.json({
      success: true,
      user_id: Number(req.params.userId),
      total_ratings: Number(total_ratings) || 0,
      average_rating: average_rating ? Number(average_rating) : null,
    });
  } catch (error) {
    console.error("Rating summary error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/orders/:orderId/ratings — check if a user already rated this order
app.get("/api/orders/:orderId/ratings", async (req, res) => {
  try {
    const { reviewer_id } = req.query;

    const ratings = await query(
      `SELECT r.*, u.name AS reviewer_name
       FROM ratings r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.order_id = ?`,
      [req.params.orderId]
    );

    const myRating = reviewer_id
      ? ratings.find((r) => Number(r.reviewer_id) === Number(reviewer_id))
      : null;

    res.json({ success: true, ratings, my_rating: myRating || null });
  } catch (error) {
    console.error("Order ratings error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// =====================================================
// TRACKING STATUS FLOW (for shipment_tracking table)
// =====================================================
// PENDING -> READY_FOR_PICKUP -> PICKED_UP -> IN_TRANSIT
//          -> NEAR_DESTINATION -> DELIVERED

const trackingTransitions = {
  PENDING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["NEAR_DESTINATION", "DELIVERED"],
  NEAR_DESTINATION: ["DELIVERED"],
  DELIVERED: [],
};

// Helper: get latest tracking for an order
async function getLatestTracking(orderId) {
  const rows = await query(
    `SELECT * FROM shipment_tracking WHERE order_id = ? ORDER BY recorded_at DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

// POST /api/orders/:orderId/tracking/start — farmer starts tracking
app.post("/api/orders/:orderId/tracking/start", async (req, res) => {
  try {
    const { farmer_id } = req.body || {};
    const orderId = Number(req.params.orderId);

    if (!farmer_id) {
      return res.status(400).json({ success: false, message: "farmer_id is required." });
    }

    // Load order and verify ownership
    const orders = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = orders[0];

    if (Number(farmer_id) !== Number(order.farmer_id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to track this order." });
    }

    if (["CANCELLED"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Cannot start tracking for a cancelled order." });
    }

    // Check if already tracking
    const existing = await getLatestTracking(orderId);
    if (existing && existing.status !== "PENDING") {
      return res.status(409).json({ success: false, message: "Tracking already started for this order.", current_status: existing.status });
    }

    const result = await query(
      `INSERT INTO shipment_tracking (shipment_id, order_id, farmer_id, status, message)
       VALUES (?, ?, ?, 'READY_FOR_PICKUP', 'Farmer started delivery tracking')`,
      [order.shipment_id || 0, orderId, farmer_id]
    );

    // Emit Socket.IO event
    io.emit("tracking:update", {
      shipment_id: order.shipment_id,
      order_id: orderId,
      farmer_id: Number(farmer_id),
      latitude: null,
      longitude: null,
      status: "READY_FOR_PICKUP",
      message: "Farmer started delivery tracking",
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ success: true, message: "Tracking started.", tracking_id: result.insertId, status: "READY_FOR_PICKUP" });
  } catch (error) {
    console.error("Tracking start error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/orders/:orderId/tracking/location — farmer updates GPS location
app.post("/api/orders/:orderId/tracking/location", async (req, res) => {
  try {
    const { farmer_id, latitude, longitude, message } = req.body || {};
    const orderId = Number(req.params.orderId);

    if (!farmer_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "farmer_id, latitude and longitude are required." });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: "Invalid latitude or longitude." });
    }

    // Load order and verify ownership
    const orders = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = orders[0];

    if (Number(farmer_id) !== Number(order.farmer_id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to update tracking for this order." });
    }

    // Get current tracking status
    const current = await getLatestTracking(orderId);
    const currentStatus = current ? current.status : "PENDING";

    // Don't update if already delivered
    if (currentStatus === "DELIVERED") {
      return res.status(400).json({ success: false, message: "Order is already delivered." });
    }

    const result = await query(
      `INSERT INTO shipment_tracking (shipment_id, order_id, farmer_id, latitude, longitude, status, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order.shipment_id || 0, orderId, Number(farmer_id), lat, lng, currentStatus, message || "Location updated"]
    );

    const payload = {
      shipment_id: order.shipment_id,
      order_id: orderId,
      farmer_id: Number(farmer_id),
      latitude: lat,
      longitude: lng,
      status: currentStatus,
      message: message || "Location updated",
      timestamp: new Date().toISOString(),
    };

    // Emit real-time Socket.IO event
    io.emit("tracking:update", payload);

    res.json({ success: true, message: "Location updated.", tracking_id: result.insertId, ...payload });
  } catch (error) {
    console.error("Tracking location error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/orders/:orderId/tracking/status — farmer updates delivery status
app.put("/api/orders/:orderId/tracking/status", async (req, res) => {
  try {
    const { farmer_id, status, message, latitude, longitude } = req.body || {};
    const orderId = Number(req.params.orderId);

    if (!farmer_id || !status) {
      return res.status(400).json({ success: false, message: "farmer_id and status are required." });
    }

    const validStatuses = ["READY_FOR_PICKUP", "PICKED_UP", "IN_TRANSIT", "NEAR_DESTINATION", "DELIVERED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    // Load order and verify ownership
    const orders = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const order = orders[0];

    if (Number(farmer_id) !== Number(order.farmer_id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to update tracking for this order." });
    }

    // Get current tracking status
    const current = await getLatestTracking(orderId);
    const currentStatus = current ? current.status : "PENDING";

    const allowed = trackingTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition tracking from ${currentStatus} to ${status}.`,
        allowed_next: allowed,
      });
    }

    const lat = latitude !== undefined ? Number(latitude) : (current?.latitude || null);
    const lng = longitude !== undefined ? Number(longitude) : (current?.longitude || null);

    await query(
      `INSERT INTO shipment_tracking (shipment_id, order_id, farmer_id, latitude, longitude, status, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [order.shipment_id || 0, orderId, Number(farmer_id), lat, lng, status, message || `Status changed to ${status}`]
    );

    // If DELIVERED via tracking, also update the order status
    if (status === "DELIVERED" && order.status === "ARRIVED") {
      await query(`UPDATE orders SET status = 'DELIVERED' WHERE id = ?`, [orderId]);
      await addOrderHistory(orderId, "DELIVERED", "Marked delivered via tracking.", Number(farmer_id));
      await updateShipmentAggregate(order.shipment_id);
    }

    const payload = {
      shipment_id: order.shipment_id,
      order_id: orderId,
      farmer_id: Number(farmer_id),
      latitude: lat,
      longitude: lng,
      status,
      message: message || `Status changed to ${status}`,
      timestamp: new Date().toISOString(),
    };

    io.emit("tracking:update", payload);

    res.json({ success: true, message: `Tracking status updated to ${status}.`, ...payload });
  } catch (error) {
    console.error("Tracking status error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/orders/:orderId/tracking — get tracking history for an order
app.get("/api/orders/:orderId/tracking", async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    const orders = await query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const tracking = await query(
      `SELECT * FROM shipment_tracking WHERE order_id = ? ORDER BY recorded_at DESC`,
      [orderId]
    );

    const latest = tracking[0] || null;

    res.json({
      success: true,
      order_id: orderId,
      latest_tracking: latest,
      history: tracking,
    });
  } catch (error) {
    console.error("Get tracking error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/shipments/:shipmentId/tracking — tracking for all orders in a shipment
app.get("/api/shipments/:shipmentId/tracking", async (req, res) => {
  try {
    const shipmentId = Number(req.params.shipmentId);

    // Get all orders in this shipment with their latest tracking
    const orders = await query(
      `SELECT o.*, uf.name AS farmer_name, ub.name AS buyer_name
       FROM orders o
       JOIN users uf ON o.farmer_id = uf.id
       JOIN users ub ON o.buyer_id = ub.id
       WHERE o.shipment_id = ? AND o.status <> 'CANCELLED'
       ORDER BY o.id`,
      [shipmentId]
    );

    const orderTracking = [];

    for (const order of orders) {
      const latest = await getLatestTracking(order.id);
      orderTracking.push({
        order_id: order.id,
        order_code: order.order_code,
        farmer_id: order.farmer_id,
        farmer_name: order.farmer_name,
        buyer_id: order.buyer_id,
        buyer_name: order.buyer_name,
        crop_name: order.crop_name,
        quantity: order.quantity,
        unit: order.unit,
        pickup_location: order.pickup_location,
        delivery_city: order.delivery_city,
        order_status: order.status,
        tracking_status: latest ? latest.status : "PENDING",
        latitude: latest ? latest.latitude : null,
        longitude: latest ? latest.longitude : null,
        message: latest ? latest.message : null,
        last_updated: latest ? latest.recorded_at : null,
      });
    }

    // Calculate overall progress
    const totalQuantity = orders.reduce((sum, o) => sum + toNum(o.quantity), 0);
    const deliveredQuantity = orderTracking
      .filter((t) => t.tracking_status === "DELIVERED" || t.order_status === "DELIVERED")
      .reduce((sum, t) => sum + toNum(t.quantity), 0);

    res.json({
      success: true,
      shipment_id: shipmentId,
      orders: orderTracking,
      summary: {
        total_quantity: totalQuantity,
        delivered_quantity: deliveredQuantity,
        progress_percent: totalQuantity ? Math.round((deliveredQuantity / totalQuantity) * 100) : 0,
        total_orders: orders.length,
        delivered_orders: orderTracking.filter((t) => t.tracking_status === "DELIVERED" || t.order_status === "DELIVERED").length,
      },
    });
  } catch (error) {
    console.error("Shipment tracking error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/buyers/:buyerId/tracking — all active tracking for buyer's orders
app.get("/api/buyers/:buyerId/tracking", async (req, res) => {
  try {
    const buyerId = Number(req.params.buyerId);

    // Get all active orders for this buyer grouped by shipment
    const orders = await query(
      `SELECT o.*, uf.name AS farmer_name, uf.phone AS farmer_phone,
              s.shipment_code, s.destination_city, s.destination_lat, s.destination_lng
       FROM orders o
       JOIN users uf ON o.farmer_id = uf.id
       LEFT JOIN shipments s ON o.shipment_id = s.id
       WHERE o.buyer_id = ? AND o.status NOT IN ('CANCELLED')
       ORDER BY o.shipment_id, o.id`,
      [buyerId]
    );

    const orderTracking = [];

    for (const order of orders) {
      const latest = await getLatestTracking(order.id);
      orderTracking.push({
        order_id: order.id,
        order_code: order.order_code,
        farmer_id: order.farmer_id,
        farmer_name: order.farmer_name,
        farmer_phone: order.farmer_phone,
        crop_name: order.crop_name,
        quantity: order.quantity,
        unit: order.unit,
        pickup_location: order.pickup_location,
        delivery_city: order.delivery_city,
        delivery_address: order.delivery_address,
        order_status: order.status,
        shipment_id: order.shipment_id,
        shipment_code: order.shipment_code,
        destination_lat: order.destination_lat,
        destination_lng: order.destination_lng,
        tracking_status: latest ? latest.status : "PENDING",
        latitude: latest ? latest.latitude : null,
        longitude: latest ? latest.longitude : null,
        message: latest ? latest.message : null,
        last_updated: latest ? latest.recorded_at : null,
      });
    }

    const totalQuantity = orders.reduce((sum, o) => sum + toNum(o.quantity), 0);
    const deliveredQuantity = orderTracking
      .filter((t) => t.tracking_status === "DELIVERED" || t.order_status === "DELIVERED")
      .reduce((sum, t) => sum + toNum(t.quantity), 0);

    res.json({
      success: true,
      buyer_id: buyerId,
      orders: orderTracking,
      summary: {
        total_quantity: totalQuantity,
        delivered_quantity: deliveredQuantity,
        progress_percent: totalQuantity ? Math.round((deliveredQuantity / totalQuantity) * 100) : 0,
        total_orders: orders.length,
        delivered_orders: orderTracking.filter((t) => t.tracking_status === "DELIVERED" || t.order_status === "DELIVERED").length,
      },
    });
  } catch (error) {
    console.error("Buyer tracking error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/farmers/:farmerId/active-orders — farmer's active deliveries for tracking
app.get("/api/farmers/:farmerId/active-orders", async (req, res) => {
  try {
    const farmerId = Number(req.params.farmerId);

    const orders = await query(
      `SELECT o.*, ub.name AS buyer_name, ub.location AS buyer_location,
              s.shipment_code, s.destination_city, s.destination_lat, s.destination_lng
       FROM orders o
       JOIN users ub ON o.buyer_id = ub.id
       LEFT JOIN shipments s ON o.shipment_id = s.id
       WHERE o.farmer_id = ? AND o.status NOT IN ('CANCELLED', 'DELIVERED')
       ORDER BY o.created_at DESC`,
      [farmerId]
    );

    const result = [];
    for (const order of orders) {
      const latest = await getLatestTracking(order.id);
      result.push({
        ...order,
        tracking_status: latest ? latest.status : "PENDING",
        latitude: latest ? latest.latitude : null,
        longitude: latest ? latest.longitude : null,
        message: latest ? latest.message : null,
        last_updated: latest ? latest.recorded_at : null,
      });
    }

    res.json({ success: true, orders: result });
  } catch (error) {
    console.error("Farmer active orders error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// =====================================================
// GEOCODING & PLACE SEARCH APIS (OpenStreetMap Nominatim + APMC Fallback)
// =====================================================

const KNOWN_MARKETS = [
  { name: "Nashik APMC, Panchavati, Nashik, Maharashtra, India", lat: 20.0123, lng: 73.7891 },
  { name: "Pune Market Yard, Gultekdi, Pune, Maharashtra, India", lat: 18.4984, lng: 73.8647 },
  { name: "Vashi APMC, Sector 19, Navi Mumbai, Maharashtra, India", lat: 19.0759, lng: 73.0033 },
  { name: "Mumbai Wholesale Market, Dadar West, Mumbai, Maharashtra, India", lat: 19.0330, lng: 72.8600 },
  { name: "Nashik Road APMC Sub-Market, Nashik, Maharashtra, India", lat: 19.9575, lng: 73.8344 },
  { name: "Lasalgaon Onion APMC Market, Niphad, Nashik, Maharashtra, India", lat: 20.1478, lng: 74.2289 },
  { name: "Pimpalgaon Baswant Tomato Market Yard, Nashik, Maharashtra, India", lat: 20.1704, lng: 73.9854 },
  { name: "Surat APMC Sardar Market, Surat, Gujarat, India", lat: 21.1959, lng: 72.8302 },
  { name: "Ahmedabad Jamalpur APMC Market, Ahmedabad, Gujarat, India", lat: 23.0120, lng: 72.5800 },
  { name: "Kalyan APMC Agricultural Produce Market, Thane, Maharashtra, India", lat: 19.2403, lng: 73.1305 },
  { name: "Nagpur Kalamna APMC Market Yard, Nagpur, Maharashtra, India", lat: 21.1738, lng: 79.1350 },
  { name: "Baramati APMC Market, Pune, Maharashtra, India", lat: 18.1517, lng: 74.5772 },
  { name: "Sangli Turmeric Market Yard, Sangli, Maharashtra, India", lat: 16.8524, lng: 74.5815 },
  { name: "Kolhapur APMC Market Yard, Kolhapur, Maharashtra, India", lat: 16.7050, lng: 74.2433 },
  { name: "Jalgaon Banana & Grain APMC, Jalgaon, Maharashtra, India", lat: 21.0077, lng: 75.5626 },
  { name: "Mulund APMC Extension, Mumbai, Maharashtra, India", lat: 19.1726, lng: 72.9565 }
];

// GET /api/locations/search?q=...
app.get("/api/locations/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, places: [] });
    }

    // Attempt Nominatim geocoding with timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=6&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SmartAgriConnect-SIH2026/1.0 (agri-platform; sih2026@agri.connect)",
          "Accept-Language": "en-IN,en;q=0.9",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const results = data.map((item) => ({
            display_name: item.display_name,
            address: item.display_name,
            lat: Number(item.lat),
            lng: Number(item.lon),
            type: item.type || "place",
          }));
          return res.json({ success: true, places: results, provider: "Nominatim" });
        }
      }
    } catch (netErr) {
      console.warn("Nominatim search fallback:", netErr.message);
    }

    // Fallback: search known agricultural hubs and cities
    const qLower = q.toLowerCase();
    const matches = KNOWN_MARKETS.filter((p) => p.name.toLowerCase().includes(qLower));

    for (const [city, coord] of Object.entries(cityCoordinates)) {
      if (city.toLowerCase().includes(qLower) || qLower.includes(city.toLowerCase())) {
        if (!matches.some((m) => m.name.toLowerCase().includes(city))) {
          matches.push({
            name: `${city.charAt(0).toUpperCase() + city.slice(1)}, Maharashtra, India`,
            lat: coord.lat,
            lng: coord.lng,
          });
        }
      }
    }

    const fallbackPlaces = matches.map((m) => ({
      display_name: m.name,
      address: m.name,
      lat: m.lat,
      lng: m.lng,
      type: "known_market",
    }));

    res.json({ success: true, places: fallbackPlaces, provider: "LocalCatalog" });
  } catch (err) {
    console.error("Location search error:", err);
    res.status(500).json({ success: false, message: "Unable to search locations." });
  }
});

// GET /api/locations/reverse-geocode?lat=...&lng=...
app.get("/api/locations/reverse-geocode", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: "Valid lat and lng required." });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SmartAgriConnect-SIH2026/1.0 (agri-platform; sih2026@agri.connect)",
          "Accept-Language": "en-IN,en;q=0.9",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const item = await response.json();
        if (item && item.display_name) {
          return res.json({
            success: true,
            address: item.display_name,
            lat,
            lng,
            provider: "Nominatim",
          });
        }
      }
    } catch (e) {
      console.warn("Reverse geocode fallback:", e.message);
    }

    res.json({
      success: true,
      address: `Selected Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      lat,
      lng,
      provider: "CoordinateFallback",
    });
  } catch (err) {
    console.error("Reverse geocode error:", err);
    res.status(500).json({ success: false, message: "Reverse geocode failed." });
  }
});

// =====================================================
// SHIPMENT ROAD ROUTE GEOMETRY (OSRM with Haversine Fallback)
// =====================================================

app.get("/api/shipments/:shipmentId/route-geometry", async (req, res) => {
  try {
    const shipmentId = Number(req.params.shipmentId);
    const details = await getShipmentDetails(shipmentId);

    if (!details || !details.shipment) {
      return res.status(404).json({ success: false, message: "Shipment not found." });
    }

    const routeStops = details.route || [];
    if (!routeStops.length) {
      return res.json({
        success: true,
        shipment_id: shipmentId,
        provider: "NONE",
        road_distance_km: 0,
        eta_minutes: 0,
        geometry: { type: "LineString", coordinates: [] },
        stops: [],
      });
    }

    // Extract valid coordinates for each stop
    const validStops = routeStops.map((stop, index) => {
      const coords = getCoordinates(stop.location, stop.lat, stop.lng);
      return {
        stop_index: index + 1,
        type: stop.type,
        location: stop.location,
        farmer_name: stop.farmer_name || null,
        farmer_id: stop.farmer_id || null,
        buyer_name: stop.buyer_name || null,
        buyer_id: stop.buyer_id || null,
        quantity: stop.quantity,
        crop_name: details.shipment.crop_name,
        address: stop.address || stop.location,
        lat: coords ? coords.lat : 19.076,
        lng: coords ? coords.lng : 72.8777,
      };
    });

    // Build coordinate pairs for OSRM: lon,lat;lon,lat;...
    const coordsStr = validStops.map((s) => `${s.lng},${s.lat}`).join(";");

    // Try OSRM Road Routing
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { "User-Agent": "SmartAgriConnect-SIH2026/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (osrmRes.ok) {
        const osrmData = await osrmRes.json();
        if (osrmData.code === "Ok" && osrmData.routes && osrmData.routes.length > 0) {
          const route = osrmData.routes[0];
          const roadDistKm = Number((route.distance / 1000).toFixed(1));
          const etaMins = Math.round(route.duration / 60);

          return res.json({
            success: true,
            shipment_id: shipmentId,
            provider: "OSRM",
            road_distance_km: roadDistKm,
            eta_minutes: etaMins,
            geometry: route.geometry,
            stops: validStops,
            summary: details.summary,
          });
        }
      }
    } catch (routingErr) {
      console.warn("OSRM routing fallback:", routingErr.message);
    }

    // Fallback: straight lines between points
    const fallbackCoordinates = validStops.map((s) => [s.lng, s.lat]);
    res.json({
      success: true,
      shipment_id: shipmentId,
      provider: "HAVERSINE_FALLBACK",
      warning: "Road route service temporarily unavailable; displaying estimated route line.",
      road_distance_km: details.summary?.total_distance_km || 0,
      eta_minutes: details.summary?.estimated_minutes || 0,
      geometry: {
        type: "LineString",
        coordinates: fallbackCoordinates,
      },
      stops: validStops,
      summary: details.summary,
    });
  } catch (error) {
    console.error("Route geometry error:", error);
    res.status(500).json({ success: false, message: "Unable to calculate route geometry." });
  }
});

// GET /api/routes/directions?stops=lng1,lat1;lng2,lat2
app.get("/api/routes/directions", async (req, res) => {
  try {
    const stopsParam = String(req.query.stops || "").trim();
    if (!stopsParam) {
      return res.status(400).json({ success: false, message: "stops parameter required (format: lng1,lat1;lng2,lat2)" });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${stopsParam}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { "User-Agent": "SmartAgriConnect-SIH2026/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (osrmRes.ok) {
        const data = await osrmRes.json();
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          return res.json({
            success: true,
            provider: "OSRM",
            distance_km: Number((r.distance / 1000).toFixed(1)),
            duration_minutes: Math.round(r.duration / 60),
            geometry: r.geometry,
          });
        }
      }
    } catch (e) {
      console.warn("Directions fallback:", e.message);
    }

    const fallbackPoints = stopsParam.split(";").map((p) => {
      const [lng, lat] = p.split(",").map(Number);
      return [lng, lat];
    });

    res.json({
      success: true,
      provider: "FALLBACK",
      distance_km: 100,
      duration_minutes: 120,
      geometry: { type: "LineString", coordinates: fallbackPoints },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Directions calculation failed." });
  }
});

// =====================================================
// STATIC FRONTEND SERVING (PRODUCTION)
// =====================================================

const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// =====================================================
// MULTER / GENERAL ERROR
// =====================================================

app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {
    if (
      error &&
      error.message ===
        "Only image files are allowed."
    ) {
      return res.status(400).json({
        message:
          "Only image files are allowed.",
      });
    }

    if (
      error &&
      error.code ===
        "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        message:
          "Image size cannot exceed 5 MB.",
      });
    }

    console.error(
      "Unhandled error:",
      error
    );

    res.status(500).json({
      message:
        "Server error.",
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

async function startServer() {
  db.connect(
    async (err) => {
      if (err) {
        console.error(
          "MySQL connection failed:",
          err.message
        );

        process.exit(1);
      }

      console.log(
        "MySQL connected successfully!"
      );

      try {
        await autoSeedDatabaseIfEmpty();

        await ensureSchema();

        await backfillAcceptedOffers();
      } catch (e) {
        console.error(
          "Schema/backfill error:",
          e
        );
      }

      httpServer.listen(
        API_PORT,
        "0.0.0.0",
        () =>
          console.log(
            `Server running on http://localhost:${API_PORT}`
          )
      );
    }
  );
}

startServer();

