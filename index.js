const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { appendLog, getLogsFromSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'robloxadminsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 } // 15 minutes
}));

// Dummy fallback user list (for testing only)
let fallbackUsers = {
  admin: { password: 'adminpass', level: 3 },
  mod: { password: 'modpass', level: 2 },
  helper: { password: 'helperpass', level: 1 },
};

// Attempt login using sheet data
const { getUsersFromSheet } = require('./sheets');

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await getUsersFromSheet();
    const user = users[username];

    if (user && user.password === password) {
      req.session.user = { username, level: user.level };
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

function requirePermission(minLevel) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.level >= minLevel) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

app.post('/action', requireAuth, async (req, res) => {
  const { action, target, reason, evidence1, evidence2, evidence3 } = req.body;
  const level = req.session.user.level;

  if (!reason || !evidence1 || !evidence2 || !evidence3) {
    return res.status(400).json({ error: 'Missing reason or evidence links' });
  }

  if (action === 'warn' && level >= 1 ||
      action === 'kick' && level >= 2 ||
      action === 'ban' && level >= 3) {
    const logData = {
      action,
      username: req.session.user.username,
      target,
      reason,
      evidence1,
      evidence2,
      evidence3
    };

    try {
      await appendLog(logData);
      return res.json({ success: true });
    } catch (err) {
      console.error('Failed to log to Google Sheets:', err);
      return res.status(500).json({ error: 'Logging failed' });
    }
  } else {
    return res.status(403).json({ error: 'Not allowed to perform this action' });
  }
});

// ✅ NEW: Fetch logs from Google Sheets
app.get('/logs', requireAuth, async (req, res) => {
  try {
    const logs = await getLogsFromSheet();
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      username: req.session.user.username,
      level: req.session.user.level
    });
  } else {
    res.json({ loggedIn: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
