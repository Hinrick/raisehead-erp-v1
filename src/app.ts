import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './shared/middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { clientRoutes } from './modules/client/client.routes.js';
import { quotationRoutes } from './modules/quotation/quotation.routes.js';

export const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotations', quotationRoutes);

// Error handling (must be last)
app.use(errorHandler);
