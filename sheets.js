const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'Logs';

async function logToSheet(data) {
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          data.admin,
          data.action,
          data.target,
          data.reason,
          data.evidence1,
          data.evidence2,
          data.evidence3
        ],
      ],
    },
  });
}

async function getLogsFromSheet() {
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:H`,
  });
  return result.data.values || [];
}

module.exports = { logToSheet, getLogsFromSheet };
