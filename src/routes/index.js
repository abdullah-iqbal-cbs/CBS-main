// export all routes
import { Router } from 'express';
import db from '../config/db.js';

// import individual route files
import healthRoute from './health.js';
import authRoute from './auth.js';
import userRoute from './user.js';


const router = Router();

// add Swagger documentation for root route
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
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/contacts', contactRoute);

export default router;