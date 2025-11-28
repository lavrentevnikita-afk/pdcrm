const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');

const PORT = process.env.PORT || 3000;

// Ensure data directory exists (for SQLite database)
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Backend server listening on http://localhost:${PORT}`);
});

module.exports = server;
