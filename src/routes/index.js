// export all routes
import { Router } from 'express';
import healthRoute from './health.js';

const router = Router();

// add Swagger documentation for root route
/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns a simple Hello World message.
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello World!
 */
router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.use(healthRoute);

export default router;