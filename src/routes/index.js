// export all routes
import { Router } from 'express';
import healthRoute from './health.js';
import db from '../config/db.js';


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
 *               example: Welcome to the CBS API Server. Database connected successfully. Current database time is: 2024-01-01T00:00:00.000Z
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

export default router;