import bcrypt from "bcrypt";
import { PrismaClient } from "../../prisma/generated/prisma/index.js";

export const getHashedPassword = async (plainPassword) => {
    const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10;
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
}

let prismaClient;
export const getPrismaClient = () => {
    if (!prismaClient) {
        prismaClient = new PrismaClient();
    }

    return prismaClient;
}
