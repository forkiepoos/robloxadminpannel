const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { appendLog, getUsersFromSheet } = require('./sheets');

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

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await getUsersFromSheet();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      req.session.user = { username, level: user.level };
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Middleware
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

function requirePermission(minLevel) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.level >= minLevel) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve dashboard.html
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Session info
app.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user.username, level: req.session.user.level });
  } else {
    res.json({ loggedIn: false });
  }
});

// Action route
app.post('/action', requireAuth, async (req, res) => {
  const { action, target, reason, evidence, duration } = req.body;
  const user = req.session.user;

  if (!target || !reason || !evidence || evidence.length < 1 || evidence.length > 3) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  const requiredLevel = { warn: 1, kick: 2, ban: 3 };
  if (user.level < requiredLevel[action]) {
    return res.status(403).json({ error: 'Not allowed to perform this action' });
  }

  const timestamp = new Date();
  const formattedTime = `${(timestamp.getMonth() + 1).toString().padStart(2, '0')}/${timestamp.getDate().toString().padStart(2, '0')}/${timestamp.getFullYear().toString().slice(2)} ${timestamp.toLocaleTimeString()}`;

  const logData = {
    timestamp: formattedTime,
    action: action + (action === 'ban' ? ` (${duration})` : ''),
    username: user.username,
    target,
    reason,
    evidence1: evidence[0] || '',
    evidence2: evidence[1] || '',
    evidence3: evidence[2] || ''
  };

  try {
    await appendLog(logData);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to log to Google Sheets:', err);
    res.status(500).json({ error: 'Logging failed' });
  }
});

// Fetch logs
app.get('/logs', requireAuth, async (req, res) => {
  try {
    const logs = await require('./sheets').getLogs();
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
