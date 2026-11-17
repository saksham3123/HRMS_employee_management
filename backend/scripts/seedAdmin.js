import "dotenv/config";
import bcrypt from "bcrypt"
import prisma from "../config/prisma.js";


const createAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
        }

        // Check whether this admin account already exists (case-insensitive).
        const existingAdmin = await prisma.users.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true },
        });

        if (existingAdmin) {
            console.log("Admin account already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // User and role are created together, or not at all.
        const user = await prisma.$transaction(async (tx) => {
            const adminRole = await tx.roles.findUnique({
                where: { name: "admin" },
                select: { id: true },
            });

            if (!adminRole) {
                throw new Error("Admin role not found. Check your seeded roles.");
            }

            const createdUser = await tx.users.create({
                data: { name: "Admin", email, password: hashedPassword },
                select: { id: true, name: true, email: true },
            });

            await tx.user_roles.create({
                data: { user_id: createdUser.id, role_id: adminRole.id },
            });

            return createdUser;
        });

        console.log("Admin account created successfully.");
        console.log("Email:", user.email);
        console.log("User ID:", user.id);

    } catch (error) {

        console.error("Admin creation failed:", error.message)
        process.exitCode = 1;

    } finally {
        await prisma.$disconnect();
    }
}


createAdmin();
