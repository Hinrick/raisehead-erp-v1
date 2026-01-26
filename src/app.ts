import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { clientRoutes } from './modules/client/client.routes.js';
import { quotationRoutes } from './modules/quotation/quotation.routes.js';

export const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customSiteTitle: 'RaiseHead ERP API',
  swaggerOptions: {
    persistAuthorization: true,
    responseInterceptor: (res: any) => {
      if (res.url?.match(/\/api\/auth\/(login|register)$/) && res.ok) {
        const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
        const token = body?.data?.token;
        if (token) {
          (globalThis as any).ui.preauthorizeApiKey('bearerAuth', token);
        }
      }
      return res;
    },
  },
}));
app.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotations', quotationRoutes);

// Error handling (must be last)
app.use(errorHandler);
