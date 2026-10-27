
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../config/postgres.js";

export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            })
        }

        
const result = await pool.query(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.password,
        u.is_active,
        (
            SELECT r.name
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
            ORDER BY r.id
            LIMIT 1
        ) AS role,
        COALESCE(
            (
                SELECT json_agg(DISTINCT p.permission_key)
                FROM user_roles ur
                JOIN role_permissions rp ON rp.role_id = ur.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE ur.user_id = u.id
            ),
            '[]'::json
        ) AS permissions
    FROM users u
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1`,
    [email.trim()]
);

const user = result.rows[0];


        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }


        if (!user.is_active) {
            return res.status(403).json({
                message: "Invalid email or password"
            })
        }

        // find password

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid Id or Password"
            })
        }

        // generate JWT

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }

        )

      
res.status(200).json({
    message: "Login Successful",
    token,
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
    },
});




    } catch (error) {
        console.error("PostgreSQL login error:", error);

        return res.status(500).json({
            message: "Login failed due to a server error",
        });

    }

}

export const registerUser = async (req, res) => {
    let client;
    let transactionStarted = false;

    try {
        client = await pool.connect();

        const { name, email, password } = req.body;


        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }


        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();


        await client.query("BEGIN");
        transactionStarted = true;
        // checked if user already exists

        const existingUser = await client.query(
            `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
            [normalizedEmail]
        );


       if (existingUser.rows.length > 0) {
    await client.query("ROLLBACK");
    transactionStarted = false;

    return res.status(409).json({
        message: "User already exists",
    });
}


        const roleResult = await client.query(
            `SELECT id FROM roles WHERE name = $1`,
            ["employee"]
        );



        if (roleResult.rows.length === 0) {
            throw new Error("Employee role not found in the roles table");
        }







        //hash password

        const hashedPassword = await bcrypt.hash(password, 10);


        // create user

        const userResult = await client.query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
            [normalizedName, normalizedEmail, hashedPassword]
        );

        const user = userResult.rows[0];

        const employeeNumber = `EMP-${String(user.id).padStart(4, "0")}`;

        await client.query(
            `INSERT INTO employees (user_id, employee_number, joining_date)
     VALUES ($1, $2, CURRENT_DATE)`,
            [user.id, employeeNumber]
        );;




        await client.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)`,
            [user.id, roleResult.rows[0].id]
        );

        await client.query("COMMIT");
transactionStarted = false;



        res.status(201).json({
            message: "User registered sucessfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: "employee",

            }
        })







    }  catch (error) {
    if (client && transactionStarted) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Registration rollback error:", rollbackError);
        }
    }

    if (error.code === "23505") {
        return res.status(409).json({
            message: "Email or employee number is already in use",
        });
    }

    console.error("PostgreSQL registerUser error:", error);

    return res.status(500).json({
        message: "Failed to register user",
    });
} finally {
    if (client) {
        client.release();
    }
}
}






export const getProfile = async (req, res) => {
    try {

        const result = await pool.query(
            `SELECT
            u.id,
            u.name,
            u.email,
            u.is_active,
            r.name AS role
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.id = $1
            LIMIT 1`,
            [req.user.userId]
        )

        const user = result.rows[0]



        if (!user) {
            return res.status(404).json({
                message: "User not found"

            })

        }

        res.status(200).json({
            message: "User found",
            user,
        })

    } catch (error) {

        console.error("PostgreSQL getProfile error:", error);

        return res.status(500).json({
            message: "Failed to retrieve user profile"
        });

    }
}



export const updateProfile = async (req, res) => {
    try {

        const { name, email } = req.body
        const userId = req.user.userId;


        if (
            (name !== undefined &&
                (typeof name !== "string" || !name.trim())) ||
            (email !== undefined &&
                (typeof email !== "string" || !email.trim()))
        ) {
            return res.status(400).json({
                message: "Name and email must be non-empty strings",
            });
        }


        if (name === undefined && email === undefined) {
            return res.status(400).json({
                message: "Provide a name or email to update",
            });
        }


        const result = await pool.query(
            `UPDATE users
             SET
                 name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, name, email`,
            [
                name === undefined ? null : name.trim(),
                email === undefined ? null : email.trim(),
                userId,
            ]
        );

        const user = result.rows[0];


        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }



        res.status(200).json({
            message: "user profile updated",
            user: {
                id: user.id,
                name: user.name,
                email: user.email

            }
        })


    } catch (error) {

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email is already in use",
            });
        }

        console.error("PostgreSQL updateProfile error:", error);


        res.status(500).json({
            message: "Failed to update user profile",
        })


    }
}


export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.is_active,
                u.created_at,
                COALESCE(
                    ARRAY_AGG(DISTINCT r.name)
                    FILTER (WHERE r.name IS NOT NULL),
                    ARRAY[]::TEXT[]
                ) AS roles
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.id
             LEFT JOIN roles r ON r.id = ur.role_id
             GROUP BY
                u.id,
                u.name,
                u.email,
                u.is_active,
                u.created_at
             ORDER BY u.created_at DESC`
        );

        return res.status(200).json({
            count: result.rows.length,
            users: result.rows,
        });


    } catch (error) {
        console.error("PostgreSQL getAllUsers error:", error);

        return res.status(500).json({
            message: "Failed to retrieve users",
        });
    }
}




export const deleteUser = async (req, res) => {
    let client;
    let transactionStarted = false;

    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "Invalid user ID",
            });
        }

        if (userId === req.user.userId) {
            return res.status(400).json({
                message: "You cannot deactivate your own account",
            });
        }

        client = await pool.connect();

        await client.query("BEGIN");
        transactionStarted = true;

        // Lock the user row and check whether the account has an admin role.
        const result = await client.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.is_active,
                EXISTS (
                    SELECT 1
                    FROM user_roles ur
                    JOIN roles r ON r.id = ur.role_id
                    WHERE ur.user_id = u.id
                      AND r.name = 'admin'
                ) AS is_admin
             FROM users u
             WHERE u.id = $1
             FOR UPDATE`,
            [userId]
        );

        const user = result.rows[0];



        if (!user) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.is_admin) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(403).json({
                message: "Admin accounts cannot be deactivated through this endpoint",
            });
        }

        if (!user.is_active) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                message: "User is already inactive",
            });
        }

        // Actually deactivate the account.
        await client.query(
            `UPDATE users
             SET is_active = FALSE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [userId]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            message: "User deactivated successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_active: false,
            },
        });
    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }

        console.error("PostgreSQL deleteUser error:", error);

        return res.status(500).json({
            message: "Failed to deactivate user",
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};