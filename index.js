const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

const logsPath = path.join(__dirname, 'public/logs.json');

// Ensure logs.json exists
if (!fs.existsSync(logsPath)) {
  fs.writeFileSync(logsPath, '[]', 'utf8');
}

app.post('/log', (req, res) => {
  const newLog = req.body;

  // Add timestamp if not included
  newLog.timestamp = newLog.timestamp || Math.floor(Date.now() / 1000);

  fs.readFile(logsPath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading log file.');

    let logs = [];
    try {
      logs = JSON.parse(data);
    } catch {
      logs = [];
    }

    logs.push(newLog);

    fs.writeFile(logsPath, JSON.stringify(logs, null, 2), 'utf8', err => {
      if (err) return res.status(500).send('Error writing to log file.');
      res.status(200).send('Log saved.');
    });
  });
});

app.get('/logs.json', (req, res) => {
  res.sendFile(logsPath);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
