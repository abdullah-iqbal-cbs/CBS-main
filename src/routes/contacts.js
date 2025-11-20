// Contacts routes
import { Router } from 'express';
import contactController from '../controller/contactController.js';
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact management endpoints
 */


router.get('/', contactController.getContacts);