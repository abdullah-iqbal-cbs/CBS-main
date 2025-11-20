import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import authErrors from '../config/errors/authErrors.js';
import { getPrismaClient } from '../utils/helpers.js';

const prismaClient = getPrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

async function loginController(req, res) {
    try {
        const { email, mobile, password } = req.body || {};

        // Require password AND exactly one identifier
        if (!password || (!email && !mobile)) {
            return res.status(400).json({ error: authErrors.INVALID_AUTH_BODY });
        }

        // Find user (email OR mobile)
        const user = await prismaClient.user.findFirst({
            where: email
                ? { email, isActive: true }
                : { mobile, isActive: true }
        });

        if (!user) {
            return res.status(401).json({ error: authErrors.INVALID_CREDENTIALS });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: authErrors.INVALID_CREDENTIALS });
        }

        // Strip password
        const safeUser = { ...user };
        delete safeUser.password;

        // Generate token
        const token = jwt.sign(safeUser, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        // update user last login time
        await prismaClient.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        return res.json({ token, user: safeUser });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: authErrors.SERVER_ERROR });
    }

}

async function meController(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: authErrors.UNAUTHORIZED });
    }

    res.json({ user: req.user });
}
async function socialLoginSuccess(req, res) {
    try {
        const user = req.user;
        const safeUser = { ...user };
        delete safeUser.password;

        const token = jwt.sign(safeUser, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
        console.log(token);

        return res.json({ token, user: safeUser });
    } catch (err) {
        return res.status(500).json({ error: authErrors.SERVER_ERROR });
    }
}

export default {
    loginController,
    meController,
    socialLoginSuccess
};
