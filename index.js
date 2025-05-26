const express = require('express');
const bodyParser = require('body-parser');
const { appendLogToGoogleSheets } = require('./sheets');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Ensure this serves your dashboard.html

app.post('/submit-action', async (req, res) => {
  try {
    const { target, action, reason, duration, evidences } = req.body;
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      target,
      action,
      reason,
      duration: action === 'ban' ? duration : '',
      evidence1: evidences[0] || '',
      evidence2: evidences[1] || '',
      evidence3: evidences[2] || ''
    };

    await appendLogToGoogleSheets(logEntry);
    res.status(200).send('Action logged successfully.');
  } catch (error) {
    console.error('Error logging action:', error);
    res.status(500).send('Error logging action.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
