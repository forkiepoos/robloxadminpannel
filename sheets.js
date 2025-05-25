const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load credentials from service account JSON file
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Spreadsheet ID comes from Render env var
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function authorizeSheets() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  return sheets;
}

// Fetch user by username and password
async function getUserFromSheets(username, password) {
  const sheets = await authorizeSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A2:C',
  });

  const users = res.data.values || [];

  for (let row of users) {
    if (row[0] === username && row[1] === password) {
      return {
        username: row[0],
        permissionLevel: parseInt(row[2], 10),
      };
    }
  }

  return null;
}

// Log action to Logs sheet
async function logActionToSheets(action, staff, target, reason, evidenceArray) {
  const sheets = await authorizeSheets();
  const values = [[
    action,
    staff,
    target,
    reason,
    evidenceArray[0] || '',
    evidenceArray[1] || '',
    evidenceArray[2] || '',
    new Date().toISOString(),
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Logs!A2:H',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

module.exports = {
  authorizeSheets,
  getUserFromSheets,
  logActionToSheets,
};
