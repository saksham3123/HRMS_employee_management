import User from "../model/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import Attendance from "../model/attendance.model.js";
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
         r.name AS role
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
            [email.trim()]
        )


        const user = result.rows[0]


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
    try {

        const { name, email, password } = req.body;

        // checked if user already exists

        const existingUser = await User.findOne({ email })


        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            })
        }


        //hash password

        const hashedPassword = await bcrypt.hash(password, 10);

        // create user

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user"
        })


        res.status(201).json({
            message: "User registered sucessfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        })







    } catch (error) {

        res.status(500).json({
            message: error.message
        })

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
            return res.status(401).json({
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
            message: error.message

        })

    }
}



export const updateProfile = async (req, res) => {
    try {

        const { name, email } = req.body

        const user = await User.findById(req.user.userId)

        if (!user) {
            res.status(404).json({
                message: "User not found"
            })
        }

        if (name) {
            user.name = name

        }

        if (email) {
            user.email = email
        }


        await user.save()

        res.status(200).json({
            message: "user profile updated",
            user: {
                id: user._id,
                name: user.name,
                email: user.email

            }
        })


    } catch (error) {

        res.status(500).json({
            message: error.message
        })


    }
}


export const getAllUsers = async (req, res) => {
    try {

        const users = await User.find().select("-password").sort({ createdAt: -1 })

        res.status(200).json({
            count: users.length,
            users,
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })

    }
}




export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID",
            });
        }

        if (userId === req.user.userId) {
            return res.status(400).json({
                message: "You cannot delete your own account",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                message: "Admin accounts cannot be deleted through this endpoint",
            });
        }

        // Delete the employee's attendance and payroll records first.
        await Attendance.deleteMany({ userId: user._id });

        // Then delete the employee account.
        await User.findByIdAndDelete(user._id);

        return res.status(200).json({
            message: "Employee and associated attendance records deleted successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Delete user error:", error);

        return res.status(500).json({
            message: error.message,
        });
    }
};
