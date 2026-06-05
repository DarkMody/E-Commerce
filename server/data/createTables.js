const pool = require("../config/db");
const createTables = async (req, res, next) => {
  // Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    u_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(10) DEFAULT 'customer');
`);

  // Sellers Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sellers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      store_name VARCHAR(100),
      store_location TEXT,
      sub_type VARCHAR(100),
      CONSTRAINT sellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(u_id));`);
};

module.exports = createTables;
