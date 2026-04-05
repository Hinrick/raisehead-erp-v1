# RaiseHead ERP

## Overview

Quotation management + contact CRM system for **抬頭工作室有限公司** (RaiseHead Studio). Built with TypeScript/Express/Prisma/PostgreSQL, deployed via Docker.

## Tech Stack

- **Runtime**: Node.js 22 (Alpine)
- **Language**: TypeScript 5.9 (strict mode)
- **Framework**: Express 5.2
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: JWT (HS256, 7-day expiry) + bcrypt (12 rounds)
- **Validation**: Zod 4.3
- **PDF**: PDFKit with NotoSansTC Chinese fonts
- **API Docs**: OpenAPI / Swagger UI at `/api-docs`
- **Package Manager**: pnpm 10.18 (required)

## Project Structure

```
src/
├── app.ts                    # Express app config
├── server.ts                 # Entry point + cron jobs
├── config/                   # Environment config + Prisma client
├── docs/openapi.ts           # OpenAPI spec
├── modules/
│   ├── auth/                 # JWT auth (register/login/me)
│   ├── contact/              # Contact CRUD, tags, companies, namecards
│   ├── company/              # Company CRUD
│   ├── quotation/            # Quotation CRUD + PDF generation
│   ├── tag/                  # Tag CRUD
│   └── integration/          # External provider sync
│       ├── providers/
│       │   ├── google/       # Google Contacts (OAuth2 + webhooks)
│       │   ├── outlook/      # Outlook Contacts (OAuth2 + webhooks)
│       │   └── notion/       # Notion databases (API key + polling)
│       ├── oauth/            # OAuth flow handler
│       ├── sync/             # Bidirectional sync engine
│       ├── encryption.ts     # AES-256-GCM for OAuth tokens
│       └── field-mapper.ts   # Field mapping utilities
├── shared/
│   ├── middleware/            # Auth, validation, error handling
│   ├── types/                # TypeScript interfaces
│   └── utils/                # Helpers
prisma/
├── schema.prisma             # 16 models, UUID PKs, full timestamps
├── seed.ts                   # Sample data (10 users, companies, contacts, quotations)
└── migrations/               # Tracked in git
```

## Architecture

- **Pattern**: Modular layered — Routes → Controllers → Services → Prisma
- **Auth**: JWT Bearer token in `Authorization` header, role-based (ADMIN/USER)
- **Security**: Helmet, CORS, Zod validation, AES-256-GCM encrypted OAuth tokens
- **Sync**: Bidirectional with last-write-wins conflict resolution
- **Cron**: Google watch renewal (6 days), Outlook subscription renewal (2 days), Notion polling (5 min)

## Key Commands

```bash
pnpm dev              # Dev server with tsx watch
pnpm build            # Compile to dist/
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Apply migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Prisma Studio UI
```

## Database Models

User, Company, Contact, ContactEmail, ContactPhone, ContactAddress, ContactCompany, Tag, ContactTag, Quotation, QuotationItem, PaymentTerm, QuotationNote, ExternalContactLink, OAuthToken, IntegrationConfig, NotionDatabaseMapping, SyncLog

## Enums

- `Role`: ADMIN, USER
- `SyncProvider`: GOOGLE, OUTLOOK, NOTION
- `SyncStatus`: SYNCED, PENDING, ERROR
- `QuotationStatus`: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED

## Notes

- No automated test suite yet
- Company info for PDFs configured via env vars (COMPANY_NAME, COMPANY_TAX_ID, etc.)
- Docker Compose runs app (port 3000) + PostgreSQL (port 5432)
