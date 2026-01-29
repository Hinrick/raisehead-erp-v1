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

const TagSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    color: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const CompanySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    taxId: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    website: { type: 'string', nullable: true },
    fax: { type: 'string', nullable: true },
    industry: { type: 'string', nullable: true },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const ContactEmailSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    value: { type: 'string', format: 'email' },
    label: { type: 'string', example: 'work' },
    primary: { type: 'boolean' },
  },
};

const ContactPhoneSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    value: { type: 'string' },
    label: { type: 'string', example: 'work' },
    primary: { type: 'boolean' },
  },
};

const ContactAddressSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    label: { type: 'string', example: 'work' },
    primary: { type: 'boolean' },
    formattedValue: { type: 'string', nullable: true },
    street: { type: 'string', nullable: true },
    city: { type: 'string', nullable: true },
    state: { type: 'string', nullable: true },
    postalCode: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    countryCode: { type: 'string', nullable: true },
  },
};

const ContactSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    displayName: { type: 'string' },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    middleName: { type: 'string', nullable: true },
    namePrefix: { type: 'string', nullable: true },
    nameSuffix: { type: 'string', nullable: true },
    nickname: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    notes: { type: 'string', nullable: true },
    birthday: { type: 'string', format: 'date-time', nullable: true },
    gender: { type: 'string', nullable: true },
    taxId: { type: 'string', nullable: true },
    nameCardPath: { type: 'string', nullable: true, description: 'Relative path to name card image' },
    emails: { type: 'array', items: { $ref: '#/components/schemas/ContactEmail' } },
    phones: { type: 'array', items: { $ref: '#/components/schemas/ContactPhone' } },
    addresses: { type: 'array', items: { $ref: '#/components/schemas/ContactAddress' } },
    companies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { $ref: '#/components/schemas/Company' },
          jobTitle: { type: 'string', nullable: true },
          department: { type: 'string', nullable: true },
        },
      },
    },
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
    companyId: { type: 'string', format: 'uuid' },
    contactPersonId: { type: 'string', format: 'uuid', nullable: true },
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

const IntegrationConfigSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    provider: { type: 'string', enum: ['GOOGLE', 'OUTLOOK', 'NOTION'] },
    enabled: { type: 'boolean' },
    config: { type: 'object' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const SyncLogSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    provider: { type: 'string', enum: ['GOOGLE', 'OUTLOOK', 'NOTION'] },
    direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND', 'BOTH'] },
    status: { type: 'string', enum: ['SYNCED', 'PENDING', 'ERROR'] },
    contactId: { type: 'string', format: 'uuid', nullable: true },
    externalId: { type: 'string', nullable: true },
    message: { type: 'string', nullable: true },
    recordsProcessed: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const NotionDatabaseMappingSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    notionDatabaseId: { type: 'string' },
    notionDatabaseName: { type: 'string' },
    tagId: { type: 'string', format: 'uuid', nullable: true },
    tag: { $ref: '#/components/schemas/Tag', nullable: true },
    enabled: { type: 'boolean' },
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

const mappingIdParam = {
  name: 'mappingId',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
  description: 'Notion database mapping ID',
};

const providerParam = {
  name: 'provider',
  in: 'path',
  required: true,
  schema: { type: 'string', enum: ['GOOGLE', 'OUTLOOK', 'NOTION'] },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'RaiseHead ERP API',
    version: '3.0.0',
    description: '抬頭工作室 ERP 系統 - 公司管理 & 聯絡人管理 & 報價單管理 API',
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
      Company: CompanySchema,
      Contact: ContactSchema,
      ContactEmail: ContactEmailSchema,
      ContactPhone: ContactPhoneSchema,
      ContactAddress: ContactAddressSchema,
      Tag: TagSchema,
      QuotationItem: QuotationItemSchema,
      Quotation: QuotationSchema,
      IntegrationConfig: IntegrationConfigSchema,
      NotionDatabaseMapping: NotionDatabaseMappingSchema,
      SyncLog: SyncLogSchema,
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

    // ==================== Companies ====================
    '/api/companies': {
      get: {
        tags: ['Companies'],
        summary: 'List all companies (paginated)',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'List of companies',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Companies'],
        summary: 'Create a new company',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: '範例科技股份有限公司' },
                  taxId: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  website: { type: 'string' },
                  fax: { type: 'string' },
                  industry: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Company created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Company' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/companies/search': {
      get: {
        tags: ['Companies'],
        summary: 'Search companies',
        description: 'Search by name, taxId, or email',
        security: bearerAuth,
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
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
                    data: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/companies/{id}': {
      get: {
        tags: ['Companies'],
        summary: 'Get a company by ID (with contacts + quotations)',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Company details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Company' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Company not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      put: {
        tags: ['Companies'],
        summary: 'Update a company',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  taxId: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  website: { type: 'string' },
                  fax: { type: 'string' },
                  industry: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Company updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Company' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Company not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Companies'],
        summary: 'Delete a company',
        description: 'Fails if company has existing quotations',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Company deleted',
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
            description: 'Cannot delete company with existing quotations',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Company not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ==================== Contacts ====================
    '/api/contacts': {
      get: {
        tags: ['Contacts'],
        summary: 'List all contacts (paginated)',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'tagId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'List of contacts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Contact' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Contacts'],
        summary: 'Create a new contact (person)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['displayName'],
                properties: {
                  displayName: { type: 'string', example: '王小明' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  notes: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  middleName: { type: 'string' },
                  namePrefix: { type: 'string' },
                  nameSuffix: { type: 'string' },
                  nickname: { type: 'string' },
                  birthday: { type: 'string', format: 'date-time' },
                  gender: { type: 'string' },
                  taxId: { type: 'string' },
                  emails: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' }, primary: { type: 'boolean' } } } },
                  phones: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' }, primary: { type: 'boolean' } } } },
                  addresses: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, primary: { type: 'boolean' }, formattedValue: { type: 'string' }, street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, postalCode: { type: 'string' }, country: { type: 'string' }, countryCode: { type: 'string' } } } },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Contact created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/contacts/search': {
      get: {
        tags: ['Contacts'],
        summary: 'Search contacts',
        description: 'Search by name or email',
        security: bearerAuth,
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
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
                    data: { type: 'array', items: { $ref: '#/components/schemas/Contact' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/contacts/{id}': {
      get: {
        tags: ['Contacts'],
        summary: 'Get a contact by ID (with tags, companies, quotations, external links)',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Contact details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Contact not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      put: {
        tags: ['Contacts'],
        summary: 'Update a contact',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  notes: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  middleName: { type: 'string' },
                  namePrefix: { type: 'string' },
                  nameSuffix: { type: 'string' },
                  nickname: { type: 'string' },
                  birthday: { type: 'string', format: 'date-time' },
                  gender: { type: 'string' },
                  taxId: { type: 'string' },
                  emails: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' }, primary: { type: 'boolean' } } } },
                  phones: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' }, primary: { type: 'boolean' } } } },
                  addresses: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, primary: { type: 'boolean' }, formattedValue: { type: 'string' }, street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, postalCode: { type: 'string' }, country: { type: 'string' }, countryCode: { type: 'string' } } } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Contact updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Contact not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Contacts'],
        summary: 'Delete a contact',
        description: 'Fails if contact is linked to quotations as contact person',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Contact deleted',
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
            description: 'Cannot delete contact with existing quotations',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Contact not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/contacts/{id}/tags': {
      post: {
        tags: ['Contacts'],
        summary: 'Add tags to a contact',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tagIds'],
                properties: {
                  tagIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tags added',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/contacts/{id}/tags/{tagId}': {
      delete: {
        tags: ['Contacts'],
        summary: 'Remove a tag from a contact',
        security: bearerAuth,
        parameters: [
          idParam,
          { name: 'tagId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Tag removed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/contacts/{id}/companies': {
      post: {
        tags: ['Contacts'],
        summary: 'Associate a contact with a company',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['companyId'],
                properties: {
                  companyId: { type: 'string', format: 'uuid' },
                  jobTitle: { type: 'string' },
                  department: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Company association added',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Contact or company not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'Already associated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/contacts/{id}/companies/{companyId}': {
      delete: {
        tags: ['Contacts'],
        summary: 'Remove a company association from a contact',
        security: bearerAuth,
        parameters: [
          idParam,
          { name: 'companyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Company association removed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Association not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/contacts/{id}/namecard': {
      post: {
        tags: ['Contacts'],
        summary: 'Upload a name card image',
        description: 'Upload a photo of a business card (JPEG, PNG, or WebP, max 5 MB)',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['namecard'],
                properties: {
                  namecard: { type: 'string', format: 'binary', description: 'Name card image file' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Name card uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Contact' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'No file uploaded or invalid file type',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Contact not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      get: {
        tags: ['Contacts'],
        summary: 'Get name card image',
        description: 'Serves the name card image file for a contact',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Name card image file',
            content: {
              'image/*': { schema: { type: 'string', format: 'binary' } },
            },
          },
          '404': {
            description: 'No name card image found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Contacts'],
        summary: 'Delete name card image',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Name card deleted',
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
            description: 'Contact or name card not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ==================== Tags ====================
    '/api/tags': {
      get: {
        tags: ['Tags'],
        summary: 'List all tags',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'List of tags',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Tags'],
        summary: 'Create a tag',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'VIP' },
                  color: { type: 'string', example: '#6D28D9' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Tag created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Tag' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/tags/{id}': {
      put: {
        tags: ['Tags'],
        summary: 'Update a tag',
        security: bearerAuth,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tag updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Tag' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Tags'],
        summary: 'Delete a tag (cascades junction)',
        security: bearerAuth,
        parameters: [idParam],
        responses: {
          '200': {
            description: 'Tag deleted',
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
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] } },
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
                    data: { type: 'array', items: { $ref: '#/components/schemas/Quotation' } },
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
                required: ['quotationNumber', 'projectName', 'quotationDate', 'companyId', 'items', 'originalTotal', 'discountedTotal'],
                properties: {
                  quotationNumber: { type: 'string', example: '#001' },
                  projectName: { type: 'string', example: '官網改版專案' },
                  quotationDate: { type: 'string', example: '2025-01-15' },
                  companyId: { type: 'string', format: 'uuid' },
                  contactPersonId: { type: 'string', format: 'uuid', nullable: true },
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
                  paymentTerms: { type: 'array', items: { type: 'string' } },
                  notes: { type: 'array', items: { type: 'string' } },
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
                    data: { $ref: '#/components/schemas/Quotation' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Company not found',
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
                      properties: { nextNumber: { type: 'string', example: '#001' } },
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
            description: 'Quotation details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Quotation' },
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
                  companyId: { type: 'string', format: 'uuid' },
                  contactPersonId: { type: 'string', format: 'uuid', nullable: true },
                  items: { type: 'array', items: { type: 'object' } },
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
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
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
        },
      },
    },

    // ==================== Integrations ====================
    '/api/integrations': {
      get: {
        tags: ['Integrations'],
        summary: 'List all integration configs (ADMIN)',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'List of integration configs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/IntegrationConfig' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/integrations/{provider}': {
      get: {
        tags: ['Integrations'],
        summary: 'Get provider config',
        security: bearerAuth,
        parameters: [providerParam],
        responses: {
          '200': {
            description: 'Integration config',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/IntegrationConfig' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Integrations'],
        summary: 'Upsert provider config',
        security: bearerAuth,
        parameters: [providerParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  enabled: { type: 'boolean' },
                  config: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Config updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/IntegrationConfig' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/integrations/{provider}/enable': {
      post: {
        tags: ['Integrations'],
        summary: 'Enable provider',
        security: bearerAuth,
        parameters: [providerParam],
        responses: {
          '200': {
            description: 'Provider enabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/IntegrationConfig' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/integrations/{provider}/disable': {
      post: {
        tags: ['Integrations'],
        summary: 'Disable provider',
        security: bearerAuth,
        parameters: [providerParam],
        responses: {
          '200': {
            description: 'Provider disabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/IntegrationConfig' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== OAuth ====================
    '/api/oauth/google/authorize': {
      get: {
        tags: ['OAuth'],
        summary: 'Get Google authorization URL',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Authorization URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { url: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/oauth/google/callback': {
      get: {
        tags: ['OAuth'],
        summary: 'Google OAuth callback',
        security: bearerAuth,
        parameters: [
          { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Google account connected' },
        },
      },
    },

    '/api/oauth/outlook/authorize': {
      get: {
        tags: ['OAuth'],
        summary: 'Get Microsoft authorization URL',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Authorization URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { url: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/oauth/outlook/callback': {
      get: {
        tags: ['OAuth'],
        summary: 'Microsoft OAuth callback',
        security: bearerAuth,
        parameters: [
          { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Outlook account connected' },
        },
      },
    },

    '/api/oauth/{provider}/disconnect': {
      delete: {
        tags: ['OAuth'],
        summary: 'Disconnect OAuth provider',
        security: bearerAuth,
        parameters: [providerParam],
        responses: {
          '200': {
            description: 'Provider disconnected',
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
        },
      },
    },

    '/api/oauth/status': {
      get: {
        tags: ['OAuth'],
        summary: 'Get connection status for current user',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'Connection status per provider',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== Sync ====================
    '/api/sync/{provider}/full': {
      post: {
        tags: ['Sync'],
        summary: 'Full sync for a provider (ADMIN)',
        security: bearerAuth,
        parameters: [providerParam],
        responses: {
          '200': {
            description: 'Sync completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        processed: { type: 'integer' },
                        errors: { type: 'integer' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/sync/{provider}/contact/{contactId}': {
      post: {
        tags: ['Sync'],
        summary: 'Sync a single contact to a provider',
        security: bearerAuth,
        parameters: [
          providerParam,
          { name: 'contactId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Contact synced',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        externalId: { type: 'string' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/sync/logs': {
      get: {
        tags: ['Sync'],
        summary: 'List sync logs',
        security: bearerAuth,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'provider', in: 'query', schema: { type: 'string', enum: ['GOOGLE', 'OUTLOOK', 'NOTION'] } },
        ],
        responses: {
          '200': {
            description: 'List of sync logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/SyncLog' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== Notion Database Mappings ====================
    '/api/integrations/notion/mappings': {
      get: {
        tags: ['Notion Mappings'],
        summary: 'List all Notion database mappings (ADMIN)',
        security: bearerAuth,
        responses: {
          '200': {
            description: 'List of mappings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/NotionDatabaseMapping' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Notion Mappings'],
        summary: 'Create a Notion database mapping (ADMIN)',
        description: 'Maps a Notion database to a tag. Contacts synced from this DB get the tag auto-assigned. Contacts with the tag get pushed to this DB.',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['notionDatabaseId', 'notionDatabaseName'],
                properties: {
                  notionDatabaseId: { type: 'string', description: 'Notion database ID (from the URL)' },
                  notionDatabaseName: { type: 'string', example: 'Clients', description: 'Friendly name for the database' },
                  tagId: { type: 'string', format: 'uuid', nullable: true, description: 'Tag ID to map to this database. Null = global mapping (all contacts)' },
                  enabled: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Mapping created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/NotionDatabaseMapping' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Tag not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '409': {
            description: 'Tag or database already mapped',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/integrations/notion/mappings/{mappingId}': {
      get: {
        tags: ['Notion Mappings'],
        summary: 'Get a mapping by ID',
        security: bearerAuth,
        parameters: [mappingIdParam],
        responses: {
          '200': {
            description: 'Mapping details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/NotionDatabaseMapping' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Mapping not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      put: {
        tags: ['Notion Mappings'],
        summary: 'Update a mapping',
        security: bearerAuth,
        parameters: [mappingIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notionDatabaseName: { type: 'string' },
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Mapping updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/NotionDatabaseMapping' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Mapping not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      delete: {
        tags: ['Notion Mappings'],
        summary: 'Delete a mapping',
        description: 'Removes the mapping and cleans up related external contact links',
        security: bearerAuth,
        parameters: [mappingIdParam],
        responses: {
          '200': {
            description: 'Mapping deleted',
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
            description: 'Mapping not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    '/api/integrations/notion/mappings/{mappingId}/enable': {
      post: {
        tags: ['Notion Mappings'],
        summary: 'Enable a mapping',
        security: bearerAuth,
        parameters: [mappingIdParam],
        responses: {
          '200': {
            description: 'Mapping enabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/NotionDatabaseMapping' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/integrations/notion/mappings/{mappingId}/disable': {
      post: {
        tags: ['Notion Mappings'],
        summary: 'Disable a mapping',
        security: bearerAuth,
        parameters: [mappingIdParam],
        responses: {
          '200': {
            description: 'Mapping disabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/NotionDatabaseMapping' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/integrations/notion/mappings/{mappingId}/sync': {
      post: {
        tags: ['Notion Mappings'],
        summary: 'Full sync for a specific Notion mapping',
        description: 'Pulls all contacts from the mapped Notion DB and pushes all ERP contacts with the mapped tag',
        security: bearerAuth,
        parameters: [mappingIdParam],
        responses: {
          '200': {
            description: 'Sync completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        processed: { type: 'integer' },
                        errors: { type: 'integer' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Notion integration not enabled',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '404': {
            description: 'Mapping not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ==================== Webhooks ====================
    '/api/webhooks/google': {
      post: {
        tags: ['Webhooks'],
        summary: 'Google push notification handler',
        description: 'No auth required - verified by Google headers',
        responses: {
          '200': { description: 'Notification acknowledged' },
        },
      },
    },

    '/api/webhooks/outlook': {
      post: {
        tags: ['Webhooks'],
        summary: 'Microsoft change notification handler',
        description: 'No auth required - verified by client state',
        responses: {
          '200': { description: 'Notification acknowledged' },
          '202': { description: 'Notification accepted' },
        },
      },
    },
  },
};
