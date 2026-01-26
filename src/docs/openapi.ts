const bearerAuth = [{ bearerAuth: [] }];

const ErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: { type: 'string' },
  },
};

const PaginationSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer' },
    limit: { type: 'integer' },
    total: { type: 'integer' },
    totalPages: { type: 'integer' },
  },
};

const UserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'USER'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const ClientSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    companyName: { type: 'string' },
    taxId: { type: 'string', nullable: true },
    contactName: { type: 'string' },
    email: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const QuotationItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    itemNumber: { type: 'integer' },
    description: { type: 'string' },
    details: { type: 'string', nullable: true },
    amount: { type: 'string', description: 'Decimal as string' },
    quotationId: { type: 'string', format: 'uuid' },
  },
};

const QuotationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    quotationNumber: { type: 'string' },
    projectName: { type: 'string' },
    quotationDate: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] },
    originalTotal: { type: 'string', description: 'Decimal as string' },
    discountedTotal: { type: 'string', description: 'Decimal as string' },
    taxIncluded: { type: 'boolean' },
    paymentTerms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          sortOrder: { type: 'integer' },
        },
      },
    },
    notes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          sortOrder: { type: 'integer' },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'RaiseHead ERP API',
    version: '1.0.0',
    description: '抬頭工作室 ERP 系統 - 報價單管理 API',
    contact: {
      name: 'RaiseHead Studio',
      email: 'contact@raisehead.studio',
    },
  },
  servers: [
    { url: '/', description: 'Current Server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from /api/auth/login',
      },
    },
    schemas: {
      User: UserSchema,
      Client: ClientSchema,
      QuotationItem: QuotationItemSchema,
      Quotation: QuotationSchema,
      Error: ErrorResponse,
      Pagination: PaginationSchema,
    },
  },
  paths: {
    // ==================== Health ====================
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== Auth ====================
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'mypassword123' },
                  name: { type: 'string', example: 'John Doe' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '409': {
            description: 'Email already registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@raisehead.studio' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user info',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Current user information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ==================== Clients ====================
    '/api/clients': {
      get: {
        tags: ['Clients'],
        summary: 'List all clients (paginated)',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
        ],
        responses: {
          '200': {
            description: 'List of clients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Clients'],
        summary: 'Create a new client',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['companyName', 'contactName'],
                properties: {
                  companyName: { type: 'string', example: '範例科技股份有限公司' },
                  taxId: { type: 'string', example: '12345678' },
                  contactName: { type: 'string', example: '王小明' },
                  email: { type: 'string', format: 'email', example: 'contact@example.com' },
                  address: { type: 'string', example: '台北市信義區' },
                  phone: { type: 'string', example: '02-1234-5678' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Client created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Client' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/clients/search': {
      get: {
        tags: ['Clients'],
        summary: 'Search clients',
        description: 'Search by company name, contact name, or tax ID',
        security: bearerAuth,
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
        ],
        responses: {
          '200': {
            description: 'Search results (max 10)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Get a client by ID (with quotations)',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Client details with quotations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/Client' },
                        {
                          type: 'object',
                          properties: {
                            quotations: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  quotationNumber: { type: 'string' },
                                  projectName: { type: 'string' },
                                  status: { type: 'string' },
                                  discountedTotal: { type: 'string' },
                                  createdAt: { type: 'string', format: 'date-time' },
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Client not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      put: {
        tags: ['Clients'],
        summary: 'Update a client',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  companyName: { type: 'string' },
                  taxId: { type: 'string' },
                  contactName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Client updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Client' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Client not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Clients'],
        summary: 'Delete a client',
        description: 'Fails if client has existing quotations',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Client deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Cannot delete client with existing quotations',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Client not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ==================== Quotations ====================
    '/api/quotations': {
      get: {
        tags: ['Quotations'],
        summary: 'List all quotations (paginated)',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
          {
            name: 'status', in: 'query',
            schema: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] },
            description: 'Filter by status',
          },
        ],
        responses: {
          '200': {
            description: 'List of quotations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Quotation' },
                          {
                            type: 'object',
                            properties: {
                              client: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  companyName: { type: 'string' },
                                  contactName: { type: 'string' },
                                },
                              },
                              createdBy: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string', format: 'uuid' },
                                  name: { type: 'string' },
                                },
                              },
                              _count: {
                                type: 'object',
                                properties: { items: { type: 'integer' } },
                              },
                            },
                          },
                        ],
                      },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Quotations'],
        summary: 'Create a new quotation',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quotationNumber', 'projectName', 'quotationDate', 'clientId', 'items', 'originalTotal', 'discountedTotal'],
                properties: {
                  quotationNumber: { type: 'string', example: '#001' },
                  projectName: { type: 'string', example: '官網改版專案' },
                  quotationDate: { type: 'string', example: '2025-01-15' },
                  clientId: { type: 'string', format: 'uuid' },
                  items: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['itemNumber', 'description', 'amount'],
                      properties: {
                        itemNumber: { type: 'integer', example: 1 },
                        description: { type: 'string', example: '網站設計' },
                        details: { type: 'string', example: '含 RWD 響應式設計' },
                        amount: { type: 'number', example: 50000 },
                      },
                    },
                  },
                  originalTotal: { type: 'number', example: 100000 },
                  discountedTotal: { type: 'number', example: 90000 },
                  taxIncluded: { type: 'boolean', default: true },
                  paymentTerms: { type: 'array', items: { type: 'string' }, example: ['簽約後付 50%', '完成後付 50%'] },
                  notes: { type: 'array', items: { type: 'string' }, example: ['報價有效期限 30 天'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Quotation created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/Quotation' },
                        {
                          type: 'object',
                          properties: {
                            client: { $ref: '#/components/schemas/Client' },
                            items: { type: 'array', items: { $ref: '#/components/schemas/QuotationItem' } },
                          },
                        },
                      ],
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Client not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'Quotation number already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/quotations/next-number': {
      get: {
        tags: ['Quotations'],
        summary: 'Get next available quotation number',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Next quotation number',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        nextNumber: { type: 'string', example: '#001' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/quotations/{id}': {
      get: {
        tags: ['Quotations'],
        summary: 'Get a quotation by ID',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Quotation details with items and client',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/Quotation' },
                        {
                          type: 'object',
                          properties: {
                            client: { $ref: '#/components/schemas/Client' },
                            createdBy: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                email: { type: 'string', format: 'email' },
                              },
                            },
                            items: { type: 'array', items: { $ref: '#/components/schemas/QuotationItem' } },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Quotation not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      put: {
        tags: ['Quotations'],
        summary: 'Update a quotation',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  quotationNumber: { type: 'string' },
                  projectName: { type: 'string' },
                  quotationDate: { type: 'string' },
                  clientId: { type: 'string', format: 'uuid' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        itemNumber: { type: 'integer' },
                        description: { type: 'string' },
                        details: { type: 'string' },
                        amount: { type: 'number' },
                      },
                    },
                  },
                  originalTotal: { type: 'number' },
                  discountedTotal: { type: 'number' },
                  taxIncluded: { type: 'boolean' },
                  paymentTerms: { type: 'array', items: { type: 'string' } },
                  notes: { type: 'array', items: { type: 'string' } },
                  status: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Quotation updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/Quotation' },
                        {
                          type: 'object',
                          properties: {
                            client: { $ref: '#/components/schemas/Client' },
                            items: { type: 'array', items: { $ref: '#/components/schemas/QuotationItem' } },
                          },
                        },
                      ],
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Quotation not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'Quotation number already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Quotations'],
        summary: 'Delete a quotation',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Quotation deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Quotation not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/quotations/{id}/pdf': {
      get: {
        tags: ['Quotations'],
        summary: 'Download quotation as PDF',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'PDF file download',
            content: {
              'application/pdf': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '404': {
            description: 'Quotation not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/quotations/{id}/send': {
      post: {
        tags: ['Quotations'],
        summary: 'Mark quotation as sent',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Quotation marked as sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Quotation' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Quotation not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
};
