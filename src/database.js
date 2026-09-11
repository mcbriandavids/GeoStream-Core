const { Pool } = require("pg");

// Initialize the reusable connection pool using standard environment fallbacks
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "geostream_db",
  password: process.env.DB_PASSWORD || "your_password", // Replace with your target credentials
  port: process.env.DB_PORT || 5432,
  max: 15, // Safe connection limit for active real-time traffic
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
