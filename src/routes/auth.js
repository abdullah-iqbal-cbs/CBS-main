import express from 'express';
import passport from 'passport';
import authenticateToken from '../middleware/authMiddleware.js';
import authController from '../controller/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login using email OR mobile with password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: Password123!
 *             oneOf:
 *               - required: [email, password]
 *               - required: [mobile, password]
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing email/mobile or password
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.loginController);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, authController.meController);




/* ---------------------------------------------------------
    SOCIAL LOGIN ROUTES
--------------------------------------------------------- */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Sign in using Google OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns JWT + user after Google auth
 */
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, scope: ['profile', 'email']  }),
    authController.socialLoginSuccess
);


/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: Sign in using GitHub OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to GitHub login
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns JWT + user after GitHub auth
 */
router.get(
    '/github/callback',
    passport.authenticate('github', { session: false, scope: ['user:email'] }),
    authController.socialLoginSuccess
);


/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Sign in using Facebook OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Facebook login
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @swagger
 * /auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns JWT + user after Facebook auth
 */
router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {session: false, scope: ['email'] }),
    authController.socialLoginSuccess
);


export default router;
