import express from 'express';
import cors from 'cors';
import routesRouter from './routes/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/routes', routesRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'runwhere' });
});

// Start server
app.listen(PORT, () => {
  console.log(`RunWhere API server running on port ${PORT}`);
});

export default app;
