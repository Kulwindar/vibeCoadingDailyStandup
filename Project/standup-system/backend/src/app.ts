import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import standupRouter from './routes/standup.routes';
import { initCronJobs } from './jobs/digest.job';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/v1', standupRouter);

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.statusCode || err.status || 500;
  console.error(`[Error Handler] ${err.stack || err.message}`);
  return res.status(status).json({
    status,
    message: err.message || 'Internal Server Error',
    data: null
  });
});

// Start listening and cron jobs if not in test env
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Daily Standup System Backend running on port ${PORT}`);
    initCronJobs();
  });
}

export default app;
