const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SHEET_ID = process.env.SHEET_ID;

if (!SHEET_ID) {
  throw new Error('Missing SHEET_ID environment variable');
}

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function getSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

// Load users from "Users" sheet
async function getUsersFromSheet() {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A2:C', // assumes headers in row 1: Username, Password, Level
    });

    const rows = response.data.values || [];
    return rows.map(([username, password, level]) => ({
      username,
      password,
      level: parseInt(level)
    }));
  } catch (err) {
    console.error('Error in getUsersFromSheet():', err);
    throw err;
  }
}

// Append new log entry to "Logs" sheet
async function appendLog(logData) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Logs!A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[
        logData.timestamp,
        logData.username,
        logData.action,
        logData.target,
        logData.reason,
        logData.evidence1,
        logData.evidence2,
        logData.evidence3
      ]]
    }
  });
}

// Load all logs from "Logs" sheet
async function getLogs() {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Logs!A2:H', // assumes headers in row 1
  });

  const rows = response.data.values || [];

  return rows.map(([timestamp, username, action, target, reason, evidence1, evidence2, evidence3]) => ({
    timestamp,
    username,
    action,
    target,
    reason,
    evidence1,
    evidence2,
    evidence3
  }));
}

module.exports = {
  getUsersFromSheet,
  appendLog,
  getLogs
};
//a
