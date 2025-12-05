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
import { initializeDatabase } from './db/pg-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? [config.CLIENT_URL, /\.railway\.app$/]
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// API Routes (must come before static files)
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/dashboard', dashboardRouter);

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
initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints available at /api`);
      console.log(`Environment: ${config.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
