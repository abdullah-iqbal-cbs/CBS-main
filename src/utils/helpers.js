import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../prisma/generated/prisma/index.js";
import { JWT_SECRET, JWT_EXPIRES_IN, ACTIVATE_SECRET } from "./constants.js";

// Hash plain password
export const getHashedPassword = async (plainPassword) => {
    const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10;
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
}
// Generate account activation token
export const generateActivationToken = (userId) => {
    return jwt.sign({ id: userId }, ACTIVATE_SECRET, { expiresIn: "1d" });
};
// Generate JWT auth token
export const generateAuthToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
// Singleton Prisma Client
let prismaClient;
export const getPrismaClient = () => {
    if (!prismaClient) {
        prismaClient = new PrismaClient();
    }

    return prismaClient;
}