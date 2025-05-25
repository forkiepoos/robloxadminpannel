const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const { appendLog, getUsersFromSheet } = require('./sheets');
const path = require('path');

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
    const users = await getUsersFromSheet(); // fetch users from Google Sheet
    const user = users.find(u =>
      u.Username?.trim() === username.trim() &&
      u.Password?.trim() === password.trim()
    );

    if (user) {
      req.session.user = {
        username: user.Username,
        level: parseInt(user.PermissionLevel)
      };
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
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

// Middleware: Require auth
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

// Middleware: Require permission level
function requirePermission(minLevel) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.level >= minLevel) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Admin action route (warn/kick/ban)
app.post('/action', requireAuth, (req, res) => {
  const { action, target, reason, evidence1, evidence2, evidence3 } = req.body;
  const level = req.session.user.level;

  if (!reason || !evidence1 || !evidence2 || !evidence3) {
    return res.status(400).json({ error: 'Missing reason or evidence links' });
  }

  const allowed =
    (action === 'warn' && level >= 1) ||
    (action === 'kick' && level >= 2) ||
    (action === 'ban' && level >= 3);

  if (!allowed) {
    return res.status(403).json({ error: 'Not allowed to perform this action' });
  }

  const logData = {
    action,
    username: req.session.user.username,
    target,
    reason,
    evidence1,
    evidence2,
    evidence3
  };

  appendLog(logData)
    .then(() => res.json({ success: true }))
    .catch(err => {
      console.error('Logging failed:', err);
      res.status(500).json({ error: 'Logging failed' });
    });
});

// Serve login page (default route)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve dashboard if logged in
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Get session data for frontend
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
