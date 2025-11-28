const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Явно грузим .env из корня backend, независимо от текущей директории
dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

// Путь к файлу БД: берем из .env (относительно backend) и превращаем в абсолютный
const dbPathFromEnv = process.env.DB_PATH || 'data/crm.sqlite';
const dbAbsolutePath = path.resolve(__dirname, '..', '..', dbPathFromEnv);

// Убеждаемся, что папка для БД существует (иначе будет SQLITE_CANTOPEN)
const dbDir = path.dirname(dbAbsolutePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: dbAbsolutePath,
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds'),
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, done) => {
        // Включаем FK в SQLite
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },

  // на будущее — можно добавить test / production и т.п.
};
