const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// ── In-Memory Mock Database (Resets on Vercel Cold Boot) ──
let mockUsers = [
  { _id: 'u1', name: 'Alice Admin', email: 'admin@bugtracker.com', role: 'Admin', projectId: 'p1' },
  { _id: 'u2', name: 'Bob Developer', email: 'bob@bugtracker.com', role: 'Developer', projectId: 'p1' },
  { _id: 'u3', name: 'Dave Tester', email: 'dave@bugtracker.com', role: 'Tester', projectId: 'p1' },
];

let mockProjects = [
  { _id: 'p1', name: 'BugTracker Demo Project', description: 'Mock Database Mode', inviteCode: 'DEMO2026', members: ['u1', 'u2', 'u3'] }
];

let mockBugs = [
  { _id: 'b1', title: 'Auth token expires mid-session', description: 'Users lose unsaved work...', severity: 'Critical', priority: 'P1', status: 'In Progress', tags: ['auth'], createdBy: 'u3', assignedTo: 'u2', projectId: 'p1', createdAt: new Date().toISOString() },
  { _id: 'b2', title: 'Database connection exhausted', description: 'MongoDB pool hits limit...', severity: 'High', priority: 'P2', status: 'Open', tags: ['database'], createdBy: 'u1', assignedTo: 'u2', projectId: 'p1', createdAt: new Date().toISOString() },
  { _id: 'b3', title: 'Dashboard charts overflow', description: 'Mobile view overflowing...', severity: 'Medium', priority: 'P3', status: 'Closed', tags: ['ui'], createdBy: 'u3', assignedTo: null, projectId: 'p1', createdAt: new Date().toISOString() },
];

// Helper to generate a fake JWT
const generateFakeToken = (user) => jwt.sign({ id: user._id, role: user.role, projectId: user.projectId }, 'fake_secret_key', { expiresIn: '1d' });

// ── Intercept ALL Auth Routes ──
router.post('/auth/login', (req, res) => {
  const { email } = req.body;
  let user = mockUsers.find(u => u.email === email);
  if (!user) user = mockUsers[0]; // fallback to admin for any credentials in mock mode
  
  const token = generateFakeToken(user);
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true, token, user });
});

router.post('/auth/register', (req, res) => {
  const { name, email, role, inviteCode } = req.body;
  const newUser = { _id: `u${Date.now()}`, name, email, role, projectId: 'p1' };
  mockUsers.push(newUser);
  const token = generateFakeToken(newUser);
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true, token, user: newUser });
});

router.get('/auth/me', (req, res) => {
  res.json({ success: true, user: mockUsers[0] });
});

router.get('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

// ── Intercept Bugs Routes ──
router.get('/bugs', (req, res) => {
  res.json({ success: true, count: mockBugs.length, totalPages: 1, currentPage: 1, bugs: mockBugs });
});

router.post('/bugs', (req, res) => {
  const newBug = { _id: `b${Date.now()}`, ...req.body, status: 'Open', createdAt: new Date().toISOString() };
  mockBugs.push(newBug);
  res.status(201).json({ success: true, data: newBug });
});

router.get('/bugs/dashboard/stats', (req, res) => {
  res.json({ success: true, data: {
    total: mockBugs.length,
    open: mockBugs.filter(b => b.status === 'Open').length,
    inProgress: mockBugs.filter(b => b.status === 'In Progress').length,
    closed: mockBugs.filter(b => b.status === 'Closed').length,
    bySeverity: [{ _id: 'Critical', count: 1 }, { _id: 'High', count: 1 }, { _id: 'Medium', count: 1 }],
    byPriority: [{ _id: 'P1', count: 1 }, { _id: 'P2', count: 1 }, { _id: 'P3', count: 1 }]
  }});
});

router.patch('/bugs/:id', (req, res) => {
  const index = mockBugs.findIndex(b => b._id === req.params.id);
  if (index !== -1) {
    mockBugs[index] = { ...mockBugs[index], ...req.body };
    return res.json({ success: true, data: mockBugs[index] });
  }
  res.status(404).json({ success: false, message: 'Bug not found' });
});

router.get('/bugs/:id', (req, res) => {
  const bug = mockBugs.find(b => b._id === req.params.id);
  if (bug) return res.json({ success: true, data: bug });
  res.status(404).json({ success: false, message: 'Bug not found' });
});

// ── Intercept Users Routes ──
router.get('/users', (req, res) => {
  res.json({ success: true, data: mockUsers });
});

// ── Intercept Projects Routes ──
router.get('/projects', (req, res) => {
  res.json({ success: true, data: mockProjects });
});

// ── Intercept AI Routes ──
router.post('/ai/analyze-bug', (req, res) => {
  res.json({ success: true, analysis: { autoSeverity: 'High', autoPriority: 'P2', autoTags: ['mock', 'ai'], summary: 'This is a mocked AI response.' }});
});

// Catch-all mock fallback
router.use((req, res) => {
  res.json({ success: true, data: [], message: "Mock endpoint fallback" });
});

module.exports = router;
