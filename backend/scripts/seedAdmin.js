import pool from "../config/postgres.js";
import bcrypt from "bcrypt"
import dotenv from 'dotenv'


dotenv.config();


const createAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
        }
        //Check weather this admin account already exists
        const existingAdmin = await pool.query(
            `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
            [email]
        );

        if (existingAdmin.rows.length > 0) {
            console.log("Admin account already exists"
            )
            return;

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const client = await pool.connect();


        try {
            await client.query("BEGIN");

            const userResult = await client.query(
                `INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
                ["Admin", email, hashedPassword]

            )

            const adminRole = await client.query(
                `SELECT id FROM roles WHERE name = $1`,
                ["admin"]
            );

            if (adminRole.rows.length === 0) {
                throw new Error("Admin role not found. Check your seeded roles.");
            }

            await client.query(
                `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
                [userResult.rows[0].id, adminRole.rows[0].id]

            )

            await client.query("COMMIT");


            console.log("Admin account created successfully.");
            console.log("Email:", userResult.rows[0].email);
            console.log("User ID:", userResult.rows[0].id);



        } catch (error) {

            await client.query("ROLLBACK")
            throw error;

        } finally {
            client.release()

        }



    } catch (error) {

        console.error("Admin creation failed:", error.message)
        process.exitCode = 1;


    } finally {
        await pool.end();
    }
}


createAdmin();