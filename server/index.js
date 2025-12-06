// Load config first - this initializes environment variables
import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import casesRouter from './routes/cases.js';
import chatRouter from './routes/chat.js';
import dashboardRouter from './routes/dashboard.js';
import authRouter from './routes/auth.js';
import authEnhancedRouter from './routes/auth-enhanced.js';
import passwordResetRouter from './routes/password-reset.js';
import profileRouter from './routes/profile.js';
import settingsRouter from './routes/settings.js';
import adminUsersRouter from './routes/admin/users.js';
import adminICRouter from './routes/admin/ic-composition.js';
import adminAuditLogRouter from './routes/admin/audit-log.js';
import adminOrganizationRouter from './routes/admin/organization.js';
import copilotRouter from './routes/copilot.js';
import documentsRouter from './routes/documents.js';
import patternsRouter from './routes/patterns.js';
import insightsRouter from './routes/insights.js';
import orchestratorRouter from './routes/orchestrator.js';
import evidenceRouter from './routes/evidence.js';
import interviewsRouter from './routes/interviews.js';
import externalMemberRouter from './routes/externalMember.js';
import monitoringRouter from './routes/monitoring.js';
import pushRouter from './routes/push.js';
import employeeRouter from './routes/employee.js';
import { requestLogger } from './middleware/requestLogger.js';
import { initializeDatabase } from './db/pg-init.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required directories exist
const ensureDirectories = () => {
  const directories = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/evidence'),
    path.join(__dirname, 'uploads/temp')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
  console.log('✓ Directory initialization complete');
};

const app = express();
const PORT = config.PORT;

// Trust proxy - required for Render and other reverse proxy setups
// This allows rate limiting and other middleware to correctly identify client IPs
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? [config.CLIENT_URL, /\.railway\.app$/]
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// API Routes (must come before static files)
app.use('/api/auth', authRouter);
app.use('/api/auth', authEnhancedRouter);
app.use('/api/auth', passwordResetRouter);
app.use('/api/profile', profileRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cases', casesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/ic-composition', adminICRouter);
app.use('/api/admin/audit-log', adminAuditLogRouter);
app.use('/api/admin/organization', adminOrganizationRouter);
app.use('/api/copilot', copilotRouter);
app.use('/api/orchestrator', orchestratorRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/patterns', patternsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/external', externalMemberRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/push', pushRouter);
app.use('/api/employee', employeeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KelpHR ConductOS API is running' });
});

// Serve static files from client build (production only)
if (config.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');

  // Check if client build exists
  if (existsSync(clientBuildPath)) {
    console.log('✅ Client build found, serving static files from:', clientBuildPath);
    app.use(express.static(clientBuildPath));

    // Serve index.html for any non-API routes (SPA support)
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.log('⚠️  Client build not found at:', clientBuildPath);
    console.log('API routes are available, but no frontend is being served.');

    // Serve a helpful message at root
    app.get('/', (req, res) => {
      res.send(`
        <html>
          <head><title>KelpHR ConductOS API</title></head>
          <body style="font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto;">
            <h1>🚀 KelpHR ConductOS API</h1>
            <p><strong>Status:</strong> ✅ Running</p>
            <p><strong>Environment:</strong> ${config.NODE_ENV}</p>
            <h2>Available Endpoints:</h2>
            <ul>
              <li><a href="/api/health">/api/health</a> - Health check</li>
              <li>/api/cases - Case management</li>
              <li>/api/chat - Chat interface</li>
              <li>/api/dashboard - Dashboard data</li>
            </ul>
            <h2>⚠️ Client Build Missing</h2>
            <p>The frontend is not built. Make sure your Railway build command is set to:</p>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">npm run railway:build</pre>
          </body>
        </html>
      `);
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
const startServer = (port, retries = 2) => {
  const server = app
    .listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API endpoints available at /api`);
      console.log(`Environment: ${config.NODE_ENV}`);
    })
    .on('error', (error) => {
      if (error.code === 'EADDRINUSE' && retries > 0) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is in use, retrying on ${nextPort}...`);
        server.close(() => startServer(nextPort, retries - 1));
      } else {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    });
};

// Initialize directories and database, then start server
ensureDirectories();

initializeDatabase()
  .then(() => startServer(PORT))
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
