const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { logToSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/log', async (req, res) => {
  const data = req.body;

  // Debug logging
  console.log('📦 Incoming data:', data);

  // Basic validation
  if (
    !data.admin ||
    !data.action ||
    !data.target ||
    !data.reason ||
    !data.evidence1 ||
    !data.evidence2 ||
    !data.evidence3
  ) {
    console.error('❌ Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await logToSheet(data);
    res.status(200).json({ message: '✅ Log saved to Google Sheets' });
  } catch (err) {
    console.error('❌ Error logging to Google Sheets:', err);
    res.status(500).json({ error: 'Failed to log to sheet' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
