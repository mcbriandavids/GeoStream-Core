// cSpell:ignore geostream Millis
const { Pool } = require("pg");

// Create a reusable connection pool
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_DATABASE || "geostream_db",
  password: process.env.DB_PASSWORD || "your_password",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error if connection takes over 2 seconds
});

// Helper function to execute queries safely
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // Exposed in case transaction capabilities are needed later
};
