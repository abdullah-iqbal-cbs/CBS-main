// ===================== IMPORTS =====================
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import authErrors from '../config/errors/authErrors.js';
import { getPrismaClient, generateActivationToken, generateAuthToken, getHashedPassword } from '../utils/helpers.js';
import sendEmail from '../utils/mails/sendEmailService.js';
import { activationEmailTemplate } from '../templates/activationEmailTemplate.js';
import { resetPasswordEmailTemplate } from '../templates/resetPasswordEmailTemplate.js';

const prisma = getPrismaClient();

// Remove sensitive fields
const sanitizeUser = (user) => {
    const safe = { ...user };
    delete safe.password;
    return safe;
};

// ========================== SIGNUP ==========================
export const signupController = async (req, res) => {
    try {
        const { email, mobile, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: authErrors.INVALID_AUTH_BODY });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { mobile: mobile || undefined }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ error: authErrors.USER_ALREADY_EXISTS });
        }

        const hashedPassword = await getHashedPassword(password);

        const user = await prisma.user.create({
            data: { email, mobile, name, password: hashedPassword },
            select: {
                id: true,
                email: true,
                mobile: true,
                name: true,
                createdAt: true,
            },
        });

        // ---- SEND ACTIVATION EMAIL ----
        const token = generateActivationToken(user.id);
        const activateURL = `${process.env.FRONTEND_URL}/activate/${token}`;

        await sendEmail({
            to: email,
            subject: "Activate Your Account",
            html: activationEmailTemplate(user.name, activateURL),
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully. Activation email sent.',
            user,
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({
            error: authErrors.SERVER_ERROR,
            errorDetails: error.message,
        });
    }
};

// ========================== LOGIN ==========================
export const loginController = async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        if (!password || (!email && !mobile)) {
            return res.status(400).json({ error: authErrors.INVALID_AUTH_BODY });
        }

        const user = await prisma.user.findFirst({
            where: email ? { email } : { mobile },
        });

        if (!user) return res.status(401).json({ error: authErrors.INVALID_CREDENTIALS });
        if (!user.isActive) return res.status(403).json({ error: authErrors.ACCOUNT_DEACTIVATED });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: authErrors.INVALID_CREDENTIALS });

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const token = generateAuthToken(sanitizeUser(user));

        return res.json({ token, user: sanitizeUser(user) });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ error: authErrors.SERVER_ERROR });
    }
};

// ========================== FORGOT PASSWORD ==========================
export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await prisma.user.findUnique({ where: { email } });

        // Security: never reveal user existence
        if (!user) {
            return res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent.',
            });
        }

        // Create reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpiry: new Date(Date.now() + 3600000),
            },
        });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send Reset Email (using existing template)
        await sendEmail({
            to: email,
            subject: "Reset Your Password",
            html: resetPasswordEmailTemplate(user.name, resetURL),
        });

        return res.json({
            success: true,
            message: "If the email exists, a reset link has been sent.",
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ========================== RESET PASSWORD ==========================
export const resetPasswordController = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword)
            return res.status(400).json({ message: "Token & new password required" });

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user)
            return res.status(400).json({ message: "Invalid or expired token" });

        const hashedPassword = await getHashedPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return res.json({
            success: true,
            message: "Password reset successful.",
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ========================== CHANGE PASSWORD ==========================
export const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.userId;

        if (!currentPassword || !newPassword)
            return res.status(400).json({ message: "Both passwords are required" });

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user?.password)
            return res.status(400).json({ message: "Cannot change password for social login" });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid)
            return res.status(401).json({ message: "Current password incorrect" });

        const hashed = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });

        return res.json({ success: true, message: "Password updated" });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ========================== ACTIVATE ACCOUNT ==========================
export const activateAccountController = async (req, res) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, ACTIVATE_SECRET);
        const userId = decoded.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isActive) return res.json({ message: "Already activated" });

        await prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
        });

        return res.json({ message: "Account activated successfully" });

    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};

// ========================== SEND ACTIVATION EMAIL AGAIN ==========================
export const sendActivationEmailController = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isActive) return res.json({ message: "User already activated" });

        const token = generateActivationToken(user.id);
        const activateURL = `${process.env.FRONTEND_URL}/activate/${token}`;

        await sendEmail({
            to: email,
            subject: "Activate Your Account",
            html: activationEmailTemplate(user.name, activateURL),
        });

        return res.json({ message: "Activation email sent" });

    } catch (error) {
        res.status(500).json({
            message: "Failed to send activation email",
            error: error.message,
        });
    }
};

// ========================== ME ==========================
export const meController = (req, res) => {
    if (!req.user) return res.status(401).json({ error: authErrors.UNAUTHORIZED });
    res.json({ user: req.user });
};

// ========================== SOCIAL LOGIN ==========================
export const socialLoginSuccess = async (req, res) => {
    try {
        const user = sanitizeUser(req.user);
        const token = generateAuthToken(user);
        return res.json({ token, user });
    } catch (err) {
        return res.status(500).json({ error: authErrors.SERVER_ERROR });
    }
};

export default {
    loginController,
    signupController,
    forgotPasswordController,
    resetPasswordController,
    changePasswordController,
    activateAccountController,
    sendActivationEmailController,
    meController,
    socialLoginSuccess,
};
