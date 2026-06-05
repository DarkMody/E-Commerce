const { Pool } = require("pg");

const connect = new Pool({
  host: process.env.HOST,
  user: process.env.USER,
  port: process.env.SQLPORT,
  password: process.env.PASSWORD,
  database: "E-Commerce",
});

module.exports = connect;
