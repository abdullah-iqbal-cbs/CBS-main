
import "dotenv/config";
import { PrismaConfig, env } from "prisma/config";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'node prisma/seed.js',
  },
} satisfies PrismaConfig;
