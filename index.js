
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/log', (req, res) => {
  const newLog = req.body;
  fs.readFile('logs.json', (err, data) => {
    let logs = [];
    if (!err) {
      try {
        logs = JSON.parse(data);
      } catch {
        logs = [];
      }
    }
    logs.push(newLog);
    fs.writeFile('logs.json', JSON.stringify(logs, null, 2), (err) => {
      if (err) {
        res.status(500).send('Error saving log.');
      } else {
        res.status(200).send('Log saved.');
      }
    });
  });
});

app.get('/logs', (req, res) => {
  fs.readFile('logs.json', (err, data) => {
    if (err) {
      res.status(500).send('Error reading logs.');
    } else {
      res.json(JSON.parse(data));
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
