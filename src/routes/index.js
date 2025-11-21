// export all routes
import { Router } from 'express';
import db from '../config/db.js';

// import individual route files
import healthRoute from './health.js';
import authRoute from './auth.js';
import userRoute from './user.js';
import contactRoute from './contacts.js';
import analyticsRoute from './analytics.js';


const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns a simple welcome message with the current database time.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Welcome to the CBS API Server. Database connected successfully. Current database time like 2024-01-01T00:00:00.000Z
 */
// SERVER CONFIGURATION
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.send(`Welcome to the CBS API Server. Database connected successfully. Current database time is: ${result.rows[0].now}`);
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).send('Database connection error');
    }
});

router.use(healthRoute);
// Auth routes
router.use('/auth', authRoute);
// General routes
router.use('/users', userRoute);
router.use('/contacts', contactRoute);

//  Google Analytics routes
router.use('/analytics', analyticsRoute);

export default router;