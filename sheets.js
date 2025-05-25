const { google } = require('googleapis');

// Authenticate using service account credentials
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1236sjv29p8Dp4Ko-NhHauVT5voGOxEW2JsbuEe224aY'; // ← Replace with your actual ID
const SHEET_NAME = 'Logs'; // Make sure this tab exists in your spreadsheet

async function logToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const {
    admin = '',
    action = '',
    target = '',
    reason = '',
    evidence1 = '',
    evidence2 = '',
    evidence3 = '',
  } = data;

  const timestamp = new Date().toISOString();

  const row = [[
    admin,
    action,
    target,
    reason,
    evidence1,
    evidence2,
    evidence3,
    timestamp
  ]];

  console.log("📤 Writing row to Google Sheets:", row);

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: row,
      },
    });
    console.log('✅ Successfully logged to sheet');
  } catch (error) {
    console.error('❌ Failed to log to sheet:', error.message);
  }
}

module.exports = { logToSheet };
