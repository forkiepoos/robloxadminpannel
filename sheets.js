const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account key
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'sheets-key.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Replace with your actual Google Sheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// Append a row to the Google Sheet
async function logToSheet({ admin, action, target, reason, evidence1, evidence2, evidence3, timestamp }) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const row = [[admin, action, target, reason, evidence1, evidence2, evidence3, timestamp]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Logs!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: row,
    },
  });

  console.log('✅ Log added to Google Sheet.');
}

module.exports = { logToSheet };
