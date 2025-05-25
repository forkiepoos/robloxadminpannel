const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { logToSheet, getLogsFromSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/log', async (req, res) => {
  try {
    await logToSheet(req.body);
    res.json({ message: '✅ Log saved to Google Sheets' });
  } catch (err) {
    console.error('Error saving to sheet:', err);
    res.status(500).json({ error: 'Failed to log to Google Sheets' });
  }
});

app.get('/logs', async (req, res) => {
  try {
    const logs = await getLogsFromSheet();
    res.json({ logs });
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
