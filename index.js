const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { logToSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/log', async (req, res) => {
  const { admin, action, target, reason, evidence1, evidence2, evidence3 } = req.body;
  const timestamp = new Date().toISOString();

  const entry = {
    admin,
    action,
    target,
    reason,
    evidence1,
    evidence2,
    evidence3,
    timestamp
  };

  try {
    await logToSheet(entry);
    res.status(200).json({ message: 'Log received and sent to Google Sheets.' });
  } catch (err) {
    console.error('Failed to log to Google Sheets:', err);
    res.status(500).json({ error: 'Failed to log to Google Sheets.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
