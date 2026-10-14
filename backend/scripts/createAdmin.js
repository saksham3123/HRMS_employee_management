import User from "../model/user.model.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv"
import bcrypt from "bcrypt"


dotenv.config()


const createAdmin = async () => {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({
            role: "admin"
        })

        if(existingAdmin){
            console.log("Admin already exists")
            process.exit(0)
        }

        const hashedPassword = await bcrypt.hash("Admin@123" , 10)

        await User.create({
            name: "Admin",
            email: "admin@email.com",
            password: hashedPassword,
            role : "admin",
        })

        console.log("admin created sucessfully")

        process.exit(0)


    } catch (error) {

        console.error(error.message)
        process.exit(0)
        
    }
}
createAdmin()