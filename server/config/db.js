const { Pool } = require("pg");

const connect = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: process.env.HOST,
        user: process.env.USER,
        port: process.env.SQLPORT,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
      },
);

module.exports = connect;
