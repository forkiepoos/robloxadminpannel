const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'), // Make sure this file exists and is correct
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = process.env.SHEET_ID; // Set this in your Render environment

async function getUsersFromSheet() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A1:C', // Column A: Username, B: Password, C: PermissionLevel
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const users = dataRows.map(row => {
      let user = {};
      headers.forEach((header, index) => {
        user[header.trim()] = row[index]?.trim() || '';
      });
      return user;
    });

    return users;
  } catch (err) {
    console.error('Error in getUsersFromSheet():', err.message);
    throw err;
  }
}

async function appendLog({ action, username, target, reason, evidence1, evidence2, evidence3 }) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const values = [
    [new Date().toLocaleString(), action, username, target, reason, evidence1, evidence2, evidence3]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Logs!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

module.exports = { getUsersFromSheet, appendLog };
