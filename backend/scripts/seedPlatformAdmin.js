import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

// Creates the first PeopleDesk platform (super) admin from .env:
//   PLATFORM_ADMIN_NAME, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD
// Safe to run more than once: it does nothing if the admin already exists.
const createPlatformAdmin = async () => {
    try {
        const name = process.env.PLATFORM_ADMIN_NAME?.trim();
        const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.PLATFORM_ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "PLATFORM_ADMIN_NAME, PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD must be set in .env"
            );
        }

        if (password.length < 8) {
            throw new Error("PLATFORM_ADMIN_PASSWORD must be at least 8 characters");
        }

        // platform_admins is not a company table, so the base prisma client is used.
        const existing = await prisma.platform_admins.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existing) {
            console.log("Platform admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.platform_admins.create({
            data: { name, email, password: hashedPassword },
            select: { id: true, name: true, email: true },
        });

        console.log("Platform admin created successfully.");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("ID:", admin.id);
    } catch (error) {
        console.error("Platform admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
};

createPlatformAdmin();