// Load config first - this initializes environment variables
import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import casesRouter from './routes/cases.js';
import chatRouter from './routes/chat.js';
import dashboardRouter from './routes/dashboard.js';
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
  app.use(express.static(clientBuildPath));

  // Serve index.html for any non-API routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
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
