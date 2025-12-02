require('dotenv').config();

const baseConfig = {
  client: 'sqlite3',
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
  pool: {
    afterCreate: (conn, cb) => {
      // Enforce foreign keys in SQLite
      conn.run('PRAGMA foreign_keys = ON', cb);
    },
  },
};

module.exports = {
  development: {
    ...baseConfig,
    connection: {
      filename: process.env.SQLITE_DB_PATH || './data/dev.sqlite3',
    },
  },
  production: {
    ...baseConfig,
    connection: {
      filename: process.env.SQLITE_DB_PATH || './data/prod.sqlite3',
    },
  },
};
