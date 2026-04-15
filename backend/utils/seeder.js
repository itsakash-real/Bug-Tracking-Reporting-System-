const User = require('../models/User');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

/**
 * Core seed logic — clears and re-creates all demo data with a demo project.
 */
const runSeed = async () => {
  // --- Clean existing data ---
  await User.deleteMany();
  await Bug.deleteMany();
  await Project.deleteMany();

  // --- Create the demo project first (without members — we add them after user creation) ---
  const project = await Project.create({
    name: 'BugTracker Demo Project',
    description: 'A production-grade demo project showcasing multi-tenant bug tracking with role-based access, Kanban boards, and analytics.',
    createdBy: new mongoose.Types.ObjectId(), // Placeholder, updated below
    members: [],
    inviteCode: 'DEMO2026',
  });

  // --- Create Users (all in the demo project) ---
  const admin = await User.create({
    name: 'Alice Admin',
    email: 'admin@bugtracker.com',
    password: 'password123',
    role: 'Admin',
    projectId: project._id,
  });

  const dev1 = await User.create({
    name: 'Bob Developer',
    email: 'bob@bugtracker.com',
    password: 'password123',
    role: 'Developer',
    projectId: project._id,
  });

  const dev2 = await User.create({
    name: 'Carol Dev',
    email: 'carol@bugtracker.com',
    password: 'password123',
    role: 'Developer',
    projectId: project._id,
  });

  const tester = await User.create({
    name: 'Dave Tester',
    email: 'dave@bugtracker.com',
    password: 'password123',
    role: 'Tester',
    projectId: project._id,
  });

  const tester2 = await User.create({
    name: 'Eve QA',
    email: 'eve@bugtracker.com',
    password: 'password123',
    role: 'Tester',
    projectId: project._id,
  });

  // Update project with real createdBy and members
  project.createdBy = admin._id;
  project.members = [admin._id, dev1._id, dev2._id, tester._id, tester2._id];
  await project.save();

  // Helper — deterministic past dates for realistic timestamps
  const daysAgo = (d, h = 9, m = 0) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  // ────────────────────────────────────────────────
  //  BUGS — 25 production-grade entries (all in the demo project)
  // ────────────────────────────────────────────────
  const bugsData = [
    {
      title: 'Authentication token expires mid-session causing data loss',
      description: 'Users are losing unsaved work when their JWT token expires after 15 minutes of inactivity. The token refresh mechanism silently fails, causing the next API call to return 401.',
      severity: 'Critical', priority: 'P1', status: 'In Progress',
      assignedTo: dev1._id, createdBy: tester._id,
      environment: 'Production — all browsers, all OS',
      stepsToReproduce: '1. Log in\n2. Start filling a bug report\n3. Wait 15+ minutes\n4. Click Submit\n5. Redirected to /login, data lost',
      tags: ['auth', 'ux', 'data-loss', 'production'],
      comments: [
        { text: 'Confirmed — refresh token endpoint returns 403 after 900s due to wrong REFRESH_TOKEN_EXPIRE env var.', author: dev1._id },
        { text: 'PR ready: fixes token rotation + adds form auto-save to localStorage.', author: dev1._id },
        { text: 'Prioritize — 5 more support tickets today.', author: admin._id },
      ],
      activityLog: [
        { action: 'created', performedBy: tester._id, description: 'Reported from production support', createdAt: daysAgo(5) },
        { action: 'priority_changed', field: 'priority', oldValue: 'P2', newValue: 'P1', performedBy: admin._id, createdAt: daysAgo(4) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev1._id, createdAt: daysAgo(3) },
      ],
    },
    {
      title: 'Database connection pool exhaustion under load',
      description: 'MongoDB connection pool exhausted at 200+ concurrent users. Mongoose connections not released after analytics aggregation queries. Server returns 503 and crashes.',
      severity: 'Critical', priority: 'P1', status: 'Open',
      assignedTo: dev2._id, createdBy: admin._id,
      environment: 'Production — Node.js 20.11, MongoDB Atlas M30',
      stepsToReproduce: '1. Run k6 load test with 250 VUs\n2. Monitor connections\n3. After 3 min, pool limit hit\n4. API timeouts and crash',
      tags: ['database', 'performance', 'infrastructure', 'mongodb'],
      comments: [
        { text: 'Root cause: /api/bugs/analytics holds connection 8-12s. Increased poolSize from 10→50 as temp fix.', author: dev2._id },
        { text: 'Should we add a circuit breaker + Redis cache for analytics?', author: dev1._id },
      ],
      activityLog: [
        { action: 'created', performedBy: admin._id, description: 'Reported after production outage', createdAt: daysAgo(2) },
        { action: 'severity_changed', field: 'severity', oldValue: 'High', newValue: 'Critical', performedBy: admin._id, createdAt: daysAgo(2) },
      ],
    },
    {
      title: 'XSS vulnerability in bug description markdown renderer',
      description: 'Stored XSS via unsanitized HTML in markdown descriptions. Attacker can inject <script> or onerror handlers to steal JWT tokens from other users viewing the bug.',
      severity: 'Critical', priority: 'P1', status: 'In Progress',
      assignedTo: dev1._id, createdBy: tester2._id,
      environment: 'All environments — frontend',
      stepsToReproduce: '1. Create bug with description: <img src=x onerror="alert(1)">\n2. View as another user\n3. Script executes',
      tags: ['security', 'xss', 'vulnerability', 'urgent'],
      comments: [
        { text: 'Adding rehype-sanitize to markdown renderer. PR #342 submitted.', author: dev1._id },
        { text: 'Also scanning existing descriptions for injected payloads.', author: admin._id },
      ],
      activityLog: [
        { action: 'created', performedBy: tester2._id, description: 'Found during security review', createdAt: daysAgo(3) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev1._id, createdAt: daysAgo(2) },
      ],
    },
    {
      title: 'Dashboard charts fail to render on mobile viewport',
      description: 'Recharts pie/bar charts overflow on screens < 768px. SVG viewBox hardcoded to desktop dimensions. Legends overlap, tooltips misaligned. Affects 35% of users.',
      severity: 'High', priority: 'P2', status: 'In Progress',
      assignedTo: dev2._id, createdBy: admin._id,
      environment: 'Mobile — iOS 17 Safari, Android 14 Chrome',
      stepsToReproduce: '1. Open dashboard on mobile\n2. Charts overflow container\n3. Tooltips fire on wrong segments',
      tags: ['ui', 'mobile', 'responsive', 'recharts'],
      comments: [
        { text: 'Using ResponsiveContainer + custom legend that stacks vertically on mobile.', author: dev2._id },
      ],
      activityLog: [
        { action: 'created', performedBy: admin._id, createdAt: daysAgo(7) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev2._id, createdAt: daysAgo(5) },
      ],
    },
    {
      title: 'Kanban drag-and-drop broken in Firefox 121+',
      description: 'Cards snap back after drop in Firefox. dataTransfer.getData() returns empty for custom MIME types due to Firefox 121 security tightening.',
      severity: 'High', priority: 'P2', status: 'Open',
      assignedTo: dev1._id, createdBy: tester._id,
      environment: 'Windows 11 / macOS 14 — Firefox 121+',
      stepsToReproduce: '1. Open Kanban in Firefox 121+\n2. Drag card from Open to In Progress\n3. Card snaps back, no PATCH sent',
      tags: ['firefox', 'drag-and-drop', 'kanban', 'browser-compat'],
      comments: [
        { text: 'Workaround: use text/plain MIME or switch to @dnd-kit/core.', author: dev1._id },
      ],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(4) }],
    },
    {
      title: 'Email notifications not delivered for critical bugs',
      description: 'SMTP transport throws TLS handshake error for critical-severity email template. SendGrid now requires TLS 1.3 but config forces TLS 1.2.',
      severity: 'High', priority: 'P2', status: 'Open',
      assignedTo: null, createdBy: admin._id,
      environment: 'Production — Nodemailer 6.9, SendGrid SMTP',
      tags: ['email', 'notifications', 'smtp', 'tls'],
      comments: [
        { text: 'Need to remove secureProtocol TLSv1_2_method option and let auto-negotiate.', author: dev2._id },
      ],
      activityLog: [{ action: 'created', performedBy: admin._id, createdAt: daysAgo(1) }],
    },
    {
      title: 'Bulk update endpoint bypasses role restrictions',
      description: 'PATCH /api/bugs/bulk-update missing authorization middleware. Testers can close bugs without permission.',
      severity: 'High', priority: 'P2', status: 'In Progress',
      assignedTo: dev1._id, createdBy: tester2._id,
      environment: 'All environments — API layer',
      stepsToReproduce: '1. Login as Tester\n2. PATCH /api/bugs/bulk-update with status: Closed\n3. Succeeds with 200\n4. Expected: 403',
      tags: ['security', 'rbac', 'authorization', 'api'],
      comments: [
        { text: 'Adding authorize("Admin","Developer") to bulk route + integration tests.', author: dev1._id },
      ],
      activityLog: [
        { action: 'created', performedBy: tester2._id, createdAt: daysAgo(6) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev1._id, createdAt: daysAgo(5) },
      ],
    },
    {
      title: 'File upload fails silently for files over 5MB',
      description: 'nginx client_max_body_size is 5MB but app allows 10MB. Progress bar completes but no attachment appears. nginx returns 413 as HTML, not caught by frontend.',
      severity: 'High', priority: 'P2', status: 'Open',
      assignedTo: dev2._id, createdBy: tester._id,
      environment: 'Production — nginx 1.24',
      tags: ['upload', 'nginx', 'file-size', 'silent-failure'],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(8) }],
    },
    {
      title: 'Memory leak in WebSocket notification listeners',
      description: 'useEffect cleanup missing ws.removeEventListener(). After 50+ navigations, heap grows from 45MB to 180MB. Page becomes unresponsive.',
      severity: 'High', priority: 'P2', status: 'Open',
      assignedTo: dev2._id, createdBy: dev1._id,
      environment: 'Frontend — Chrome 120+, extended sessions',
      tags: ['memory-leak', 'websocket', 'performance', 'react'],
      comments: [
        { text: 'Classic useEffect cleanup issue. Need ws.close() + useRef for WS instance.', author: dev2._id },
      ],
      activityLog: [{ action: 'created', performedBy: dev1._id, createdAt: daysAgo(3) }],
    },
    {
      title: 'Search misses bugs tagged with keywords not in title/description',
      description: 'Text index only covers title and description, not the tags array. Searching "performance" misses bugs tagged "performance" if the word is not in text fields.',
      severity: 'Medium', priority: 'P3', status: 'Open',
      assignedTo: dev2._id, createdBy: tester._id,
      environment: 'All — MongoDB text search',
      tags: ['search', 'mongodb', 'indexing', 'ux'],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(10) }],
    },
    {
      title: 'Pagination resets to page 1 when applying filters',
      description: 'Bug list URL shows ?page=3&severity=High but displays page 1 results. Pagination component still shows "Page 3 of 2". State and URL out of sync.',
      severity: 'Medium', priority: 'P3', status: 'In Progress',
      assignedTo: dev1._id, createdBy: tester2._id,
      environment: 'Frontend — React Router v6',
      tags: ['pagination', 'filters', 'state-management', 'ux'],
      comments: [
        { text: 'Adding useEffect to reset page=1 when filter deps change + debounced search.', author: dev1._id },
      ],
      activityLog: [
        { action: 'created', performedBy: tester2._id, createdAt: daysAgo(6) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev1._id, createdAt: daysAgo(4) },
      ],
    },
    {
      title: 'Comment timestamps show UTC instead of user timezone',
      description: 'All timestamps use toISOString() instead of toLocaleString(). Comments show wrong times for non-UTC users.',
      severity: 'Medium', priority: 'P3', status: 'Open',
      assignedTo: null, createdBy: tester._id,
      environment: 'Frontend — all pages with timestamps',
      tags: ['timezone', 'formatting', 'i18n', 'ux'],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(12) }],
    },
    {
      title: 'Avatar upload accepts non-image file types',
      description: 'No MIME validation on frontend or backend. Users can upload .exe, .pdf as avatar. Need accept attribute + multer fileFilter.',
      severity: 'Medium', priority: 'P3', status: 'Open',
      assignedTo: dev2._id, createdBy: tester2._id,
      environment: 'Profile settings page',
      tags: ['security', 'validation', 'upload', 'profile'],
      activityLog: [{ action: 'created', performedBy: tester2._id, createdAt: daysAgo(9) }],
    },
    {
      title: 'API rate limiting not enforced on auth endpoints',
      description: 'No throttling on /api/auth/login. 150,000 attempts possible in 1 hour. Implementing express-rate-limit with sliding window.',
      severity: 'Medium', priority: 'P3', status: 'In Progress',
      assignedTo: dev1._id, createdBy: admin._id,
      environment: 'Production — Express.js API',
      tags: ['security', 'rate-limiting', 'api', 'brute-force'],
      comments: [
        { text: '10 req/15min for /api/auth/* + progressive delay after 3rd attempt.', author: dev1._id },
      ],
      activityLog: [
        { action: 'created', performedBy: admin._id, createdAt: daysAgo(11) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev1._id, createdAt: daysAgo(9) },
      ],
    },
    {
      title: 'Sidebar active state wrong after deep linking',
      description: 'Sidebar uses exact pathname match instead of startsWith. Deep link to /bugs/:id highlights Dashboard instead of Bugs.',
      severity: 'Medium', priority: 'P3', status: 'Open',
      assignedTo: dev1._id, createdBy: tester._id,
      environment: 'Frontend — React Router v6',
      tags: ['sidebar', 'navigation', 'ux', 'deep-linking'],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(7) }],
    },
    {
      title: 'CSV export includes HTML entities in descriptions',
      description: 'he.encode() pre-processes descriptions before CSV writer. Shows &amp; instead of & in Excel.',
      severity: 'Medium', priority: 'P3', status: 'Open',
      assignedTo: null, createdBy: tester2._id,
      environment: 'Backend export endpoint',
      tags: ['export', 'csv', 'encoding', 'data-quality'],
      activityLog: [{ action: 'created', performedBy: tester2._id, createdAt: daysAgo(5) }],
    },
    {
      title: 'Dark mode flickers on page load',
      description: 'React state initializes as "light", switches to "dark" after useEffect reads localStorage. Visible flash of white theme. Need blocking script in <head>.',
      severity: 'Medium', priority: 'P3', status: 'In Progress',
      assignedTo: dev2._id, createdBy: tester._id,
      environment: 'Frontend — all browsers, slow devices',
      tags: ['dark-mode', 'fouc', 'ux', 'performance'],
      activityLog: [
        { action: 'created', performedBy: tester._id, createdAt: daysAgo(8) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev2._id, createdAt: daysAgo(6) },
      ],
    },
    {
      title: 'Accessibility: form inputs missing aria-label',
      description: 'Screen readers announce "edit text" without field names. 23 inputs across 8 pages missing proper label association. Fails WCAG 2.1 Level A.',
      severity: 'Medium', priority: 'P3', status: 'Open',
      assignedTo: dev2._id, createdBy: tester2._id,
      environment: 'Frontend — tested with NVDA and VoiceOver',
      tags: ['accessibility', 'a11y', 'wcag', 'forms'],
      comments: [
        { text: 'Creating FormField utility component to enforce label-input pairing.', author: dev2._id },
      ],
      activityLog: [{ action: 'created', performedBy: tester2._id, createdAt: daysAgo(13) }],
    },
    {
      title: 'React key prop warning in bug list map()',
      description: 'Using array index as key instead of bug._id. Console warning + potential rendering bugs on reorder.',
      severity: 'Low', priority: 'P4', status: 'Open',
      assignedTo: dev1._id, createdBy: tester._id,
      environment: 'Development — browser console',
      tags: ['react', 'console-warning', 'best-practice'],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(14) }],
    },
    {
      title: 'Toast notifications truncated on mobile',
      description: 'Bug titles cut at ~20 chars with no tooltip. react-hot-toast has hard maxWidth that does not adapt.',
      severity: 'Low', priority: 'P4', status: 'Open',
      assignedTo: null, createdBy: tester2._id,
      environment: 'Frontend — mobile viewports',
      tags: ['toast', 'mobile', 'responsive', 'ux'],
      activityLog: [{ action: 'created', performedBy: tester2._id, createdAt: daysAgo(11) }],
    },
    {
      title: 'Ctrl+K shortcut conflicts with browser search bar',
      description: 'Command palette bound to Ctrl+K but browser intercepts first. Need capture phase + preventDefault.',
      severity: 'Low', priority: 'P4', status: 'Open',
      assignedTo: null, createdBy: tester._id,
      environment: 'Frontend — Chrome, Firefox, Edge',
      tags: ['keyboard-shortcut', 'command-palette', 'ux'],
      activityLog: [{ action: 'created', performedBy: tester._id, createdAt: daysAgo(9) }],
    },
    // ── CLOSED ──
    {
      title: 'Login button unresponsive on Safari 17 due to CSS :has() bug',
      description: 'CSS :has() selector disabled pointer-events on submit button in Safari 17.0-17.2. Fixed with JS class toggle.',
      severity: 'Critical', priority: 'P1', status: 'Closed',
      assignedTo: dev1._id, createdBy: tester._id,
      environment: 'macOS 14, Safari 17.0-17.2',
      tags: ['safari', 'css', 'login', 'resolved'],
      comments: [
        { text: 'Safari WebKit team confirmed known bug fixed in 17.3. Our workaround covers older versions.', author: dev1._id },
        { text: 'Verified on Safari 17.0-17.3. Closing.', author: tester._id },
      ],
      activityLog: [
        { action: 'created', performedBy: tester._id, createdAt: daysAgo(20) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'In Progress', performedBy: dev1._id, createdAt: daysAgo(20) },
        { action: 'status_changed', field: 'status', oldValue: 'In Progress', newValue: 'Closed', performedBy: dev1._id, createdAt: daysAgo(18) },
      ],
    },
    {
      title: 'Password reset sends JWT token in URL query string',
      description: 'Token logged by nginx, proxy servers, browser history. Fixed: opaque token in Redis + POST-based verification.',
      severity: 'Critical', priority: 'P1', status: 'Closed',
      assignedTo: dev2._id, createdBy: admin._id,
      environment: 'Production',
      tags: ['security', 'password-reset', 'resolved'],
      comments: [
        { text: 'Now using 32-byte random token with 15-min Redis TTL. Submitted via POST only.', author: dev2._id },
        { text: 'Rotated nginx logs that may have contained tokens.', author: admin._id },
      ],
      activityLog: [
        { action: 'created', performedBy: admin._id, createdAt: daysAgo(25) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'Closed', performedBy: dev2._id, createdAt: daysAgo(23) },
      ],
    },
    {
      title: 'Homepage typo: "Trak" instead of "Track"',
      description: 'Hero text read "Trak your bugs". Fixed along with 4 other typos across the app.',
      severity: 'Low', priority: 'P4', status: 'Closed',
      assignedTo: dev2._id, createdBy: tester._id,
      environment: 'Frontend — landing page',
      tags: ['typo', 'copy', 'resolved'],
      activityLog: [
        { action: 'created', performedBy: tester._id, createdAt: daysAgo(30) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'Closed', performedBy: dev2._id, createdAt: daysAgo(30) },
      ],
    },
    {
      title: 'Sort order resets when navigating back from bug detail',
      description: 'Sort state in useState destroyed on navigation. Moved to useSearchParams for URL persistence.',
      severity: 'Low', priority: 'P4', status: 'Closed',
      assignedTo: dev1._id, createdBy: tester2._id,
      environment: 'Frontend — bug list page',
      tags: ['navigation', 'state-persistence', 'resolved'],
      comments: [
        { text: 'Sort/filter/page state all persists through navigation now.', author: tester2._id },
      ],
      activityLog: [
        { action: 'created', performedBy: tester2._id, createdAt: daysAgo(15) },
        { action: 'status_changed', field: 'status', oldValue: 'Open', newValue: 'Closed', performedBy: dev1._id, createdAt: daysAgo(12) },
      ],
    },
  ];

  // ── Insert all bugs with projectId + activity logs + comments ──
  for (const bugData of bugsData) {
    const { comments: seedComments, activityLog: seedActivity, ...bugFields } = bugData;
    const bug = new Bug({ ...bugFields, projectId: project._id });

    if (seedComments) {
      for (const c of seedComments) {
        bug.comments.push({ text: c.text, author: c.author });
      }
    }

    if (seedActivity) {
      for (const entry of seedActivity) {
        bug.activityLog.push(entry);
      }
    }

    await bug.save();
  }

  console.log('✅ Seeding complete!');
  console.log(`   📊 ${bugsData.length} bugs created`);
  console.log(`   👥 5 users created`);
  console.log(`   📁 1 project created`);
  console.log(`   🔑 Invite code: DEMO2026\n`);
  console.log('📋 Demo Credentials:');
  console.log('  Admin:     admin@bugtracker.com / password123');
  console.log('  Developer: bob@bugtracker.com   / password123');
  console.log('  Developer: carol@bugtracker.com / password123');
  console.log('  Tester:    dave@bugtracker.com  / password123');
  console.log('  Tester:    eve@bugtracker.com   / password123\n');
};

/**
 * Auto-seed: only runs if the database is empty. Safe to call on every startup.
 */
const seedIfEmpty = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('📦 Empty database detected — running auto-seed...');
    await runSeed();
  }
};

/**
 * CLI seed script — run with: npm run seed
 * WARNING: This WILL delete all existing users, bugs, and projects!
 */
const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database (full wipe + re-seed)...');
  await runSeed();
  mongoose.disconnect();
};

module.exports = { seedIfEmpty };

// Only run if called directly (npm run seed)
if (require.main === module) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    mongoose.disconnect();
    process.exit(1);
  });
}
