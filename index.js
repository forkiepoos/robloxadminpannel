const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { authorizeSheets, getUserFromSheets, logActionToSheets } = require('./sheet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true
}));

// 🔐 LOGIN
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await getUserFromSheets(username, password);

  if (user) {
    req.session.username = user.username;
    req.session.permissionLevel = parseInt(user.permissionLevel);
    res.json({ success: true, permissionLevel: user.permissionLevel });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 🔓 LOGOUT
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// 🔐 AUTH MIDDLEWARE
function requireAuth(req, res, next) {
  if (!req.session.username) return res.status(401).json({ message: 'Not logged in' });
  next();
}

// 🔒 PERMISSION CHECKS
function checkPermission(requiredLevel) {
  return (req, res, next) => {
    if (req.session.permissionLevel >= requiredLevel) {
      next();
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
    }
  };
}

// ✅ BAN (level 3 only)
app.post('/ban', requireAuth, checkPermission(3), async (req, res) => {
  const { targetUser, reason, evidence1, evidence2, evidence3 } = req.body;
  await logActionToSheets('Ban', req.session.username, targetUser, reason, [evidence1, evidence2, evidence3]);
  res.json({ success: true });
});

// ✅ KICK (level 2+)
app.post('/kick', requireAuth, checkPermission(2), async (req, res) => {
  const { targetUser, reason, evidence1, evidence2, evidence3 } = req.body;
  await logActionToSheets('Kick', req.session.username, targetUser, reason, [evidence1, evidence2, evidence3]);
  res.json({ success: true });
});

// ✅ WARN (level 1+)
app.post('/warn', requireAuth, checkPermission(1), async (req, res) => {
  const { targetUser, reason, evidence1, evidence2, evidence3 } = req.body;
  await logActionToSheets('Warn', req.session.username, targetUser, reason, [evidence1, evidence2, evidence3]);
  res.json({ success: true });
});

// 🔄 SERVE LOGS FOR FRONTEND
app.get('/logs', requireAuth, async (req, res) => {
  const sheet = await authorizeSheets();
  const result = await sheet.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Logs!A2:G',
  });

  const rows = result.data.values || [];
  const formatted = rows.map(row => ({
    action: row[0],
    staff: row[1],
    target: row[2],
    reason: row[3],
    evidence1: row[4],
    evidence2: row[5],
    evidence3: row[6],
  }));

  res.json(formatted);
});

// 🧾 DASHBOARD ROUTE
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
