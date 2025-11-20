// prisma/seed.js

import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

function loadJSON(file) {
  const filePath = path.join(process.cwd(), "prisma", "data", file);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function main() {
  console.log("Starting complete seed...");

  const permissionsData = loadJSON("permissions.json");
  const rolesData = loadJSON("roles.json");
  const usersData = loadJSON("users.json");

  // --- 1. Seed Permissions ---
  const permissionMap = {};
  for (const perm of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { permissionCode: perm.permissionCode },
      update: {},
      create: perm
    });
    permissionMap[perm.permissionCode] = permission;
  }

  console.log(`Permissions synced: ${Object.keys(permissionMap).length}`);

  // --- 2. Seed Roles + Assign Permissions ---
  const roleMap = {};
  for (const role of rolesData) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description
      }
    });

    roleMap[role.name] = createdRole;

    // If role.permissions = "*", assign ALL permissions
    const permissionsToAssign =
      role.permissions === "*"
        ? Object.values(permissionMap)
        : role.permissions.map((p) => permissionMap[p]);

    // Create role-permission links
    for (const perm of permissionsToAssign) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: createdRole.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: createdRole.id,
          permissionId: perm.id
        }
      });
    }

    console.log(`Role synced: ${role.name}`);
  }

  // --- 3. Seed Users + Assign Roles ---
  for (const user of usersData) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const roles = [...user.roles] || ["User"]; // Default role is "User" if not specified
    delete user.roles;

    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
          ...user,
        name: user.name,
        password: hashedPassword,
      },
      create: {
          ...user,
        email: user.email,
        name: user.name,
        password: hashedPassword,
      }
    });

    // Assign roles to user
    for (const roleName of roles) {
      const role = roleMap[roleName];

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: createdUser.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: createdUser.id,
          roleId: role.id
        }
      });
    }

    console.log(`User synced: ${user.email}`);
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
