const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1236sjv29p8Dp4Ko-NhHauVT5voGOxEW2JsbuEe224aY';

// ... rest of the file stays the same

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
