import express from 'express';
import cors from 'cors';
import casesRouter from './routes/cases.js';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174']
}));
app.use(express.json());

// Routes
app.use('/api/cases', casesRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KelpHR ConductOS API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
