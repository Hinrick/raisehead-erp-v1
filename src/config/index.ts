import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me-32ch',
  },

  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID || '',
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
  },

  company: {
    name: process.env.COMPANY_NAME || '抬頭工作室有限公司',
    taxId: process.env.COMPANY_TAX_ID || '83078329',
    bank: process.env.COMPANY_BANK || '玉山銀行(左營分行)',
    bankCode: process.env.COMPANY_BANK_CODE || '808',
    bankAccount: process.env.COMPANY_BANK_ACCOUNT || '0635-940-167416',
    address: process.env.COMPANY_ADDRESS || '',
    email: process.env.COMPANY_EMAIL || '',
    phone: process.env.COMPANY_PHONE || '',
  },
};
