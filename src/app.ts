import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';
import { tagRoutes } from './modules/tag/tag.routes.js';
import { quotationRoutes } from './modules/quotation/quotation.routes.js';
import { companyRoutes } from './modules/company/company.routes.js';
import { integrationRoutes } from './modules/integration/integration.routes.js';
import { oauthRoutes } from './modules/integration/oauth/oauth.routes.js';
import { syncRoutes } from './modules/integration/sync/sync.routes.js';
import { handleGoogleWebhook } from './modules/integration/providers/google/google.webhook.js';
import { handleOutlookWebhook } from './modules/integration/providers/outlook/outlook.webhook.js';

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
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/sync', syncRoutes);

// Webhook routes (no auth, verified by provider signatures)
app.post('/api/webhooks/google', handleGoogleWebhook);
app.post('/api/webhooks/outlook', handleOutlookWebhook);

// Error handling (must be last)
app.use(errorHandler);
