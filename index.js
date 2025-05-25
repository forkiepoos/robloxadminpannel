const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const LOG_FILE = 'logs.json';

// Load logs from file
function loadLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save logs to file
function saveLog(log) {
  const logs = loadLogs();
  logs.push(log);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// ✅ POST /log endpoint
app.post('/log', (req, res) => {
  const log = req.body;
  if (!log.admin || !log.action || !log.target || !log.reason || !log.evidence) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  saveLog(log);
  res.status(200).json({ message: "Log saved" });
});

// GET / (view logs)
app.get('/', (req, res) => {
  const logs = loadLogs();
  res.send(`
    <h1>Admin Logs</h1>
    <pre>${JSON.stringify(logs, null, 2)}</pre>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
