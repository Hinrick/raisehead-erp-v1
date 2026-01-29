import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import * as contactController from './contact.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate, validateParams } from '../../shared/middleware/validate.js';
import {
  createContactSchema,
  updateContactSchema,
  contactIdSchema,
  contactTagsSchema,
  contactCompanySchema,
} from './contact.schema.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const nameCardUpload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/namecards/',
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${_req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

export const contactRoutes = Router();

contactRoutes.use(authenticate);

contactRoutes.get('/', contactController.findAll);
contactRoutes.get('/search', contactController.search);
contactRoutes.get('/:id', validateParams(contactIdSchema), contactController.findById);
contactRoutes.post('/', validate(createContactSchema), contactController.create);
contactRoutes.put('/:id', validateParams(contactIdSchema), validate(updateContactSchema), contactController.update);
contactRoutes.delete('/:id', validateParams(contactIdSchema), contactController.remove);
contactRoutes.post('/:id/tags', validateParams(contactIdSchema), validate(contactTagsSchema), contactController.addTags);
contactRoutes.delete('/:id/tags/:tagId', contactController.removeTag);

// Company association routes
contactRoutes.post('/:id/companies', validateParams(contactIdSchema), validate(contactCompanySchema), contactController.addCompany);
contactRoutes.delete('/:id/companies/:companyId', contactController.removeCompany);

// Name card routes
contactRoutes.post('/:id/namecard', validateParams(contactIdSchema), nameCardUpload.single('namecard'), contactController.uploadNameCard);
contactRoutes.get('/:id/namecard', validateParams(contactIdSchema), contactController.serveNameCard);
contactRoutes.delete('/:id/namecard', validateParams(contactIdSchema), contactController.deleteNameCard);
