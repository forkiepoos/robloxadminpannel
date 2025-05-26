const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function appendLogToGoogleSheets(logEntry) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const values = [
    [
      logEntry.timestamp,
      logEntry.target,
      logEntry.action,
      logEntry.reason,
      logEntry.duration,
      logEntry.evidence1,
      logEntry.evidence2,
      logEntry.evidence3
    ]
  ];

  const resource = {
    values,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: 'YOUR_SPREADSHEET_ID', // Replace with your actual Spreadsheet ID
    range: 'Sheet1!A1',
    valueInputOption: 'USER_ENTERED',
    resource,
  });
}

module.exports = { appendLogToGoogleSheets };
