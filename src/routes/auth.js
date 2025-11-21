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
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
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
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: User already exists or validation error
 */
router.post('/signup', authController.signupController);

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
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', authController.forgotPasswordController);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset_token_from_email"
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', authController.resetPasswordController);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (requires authentication)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect
 */

router.post('/change-password', authenticateToken, authController.changePasswordController);
/**
 * @swagger
 * /auth/activate/{token}:
 *   get:
 *     summary: Activate user account using activation token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Activation token received via email
 *     responses:
 *       200:
 *         description: Account activated successfully
 *       400:
 *         description: Invalid or expired activation token
 *       404:
 *         description: User not found
 */
router.get('/activate/:token', authController.activateAccountController);
/**
 * @swagger
 * /auth/send-activation-email:
 *   post:
 *     summary: Resend user activation email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Activation email sent successfully
 *       404:
 *         description: User not found
 */
router.post('/send-activation-email', authController.sendActivationEmailController);


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
router.get('/google', passport.authenticate('google', {
    scope: [
        'profile',
        'email'
    ]
}));

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
    passport.authenticate('google', {
        session: false, scope: [
            'profile',
            'email',
        ]
    }),
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
    passport.authenticate('facebook', { session: false, scope: ['email'] }),
    authController.socialLoginSuccess
);


export default router;
