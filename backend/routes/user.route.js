import express from "express"
import { loginUser , getProfile , updateProfile } from "../controllers/user.controller.js"

import authMiddleware from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/login" , loginUser)
router.get("/profile" , authMiddleware , getProfile)
router.put("/profile" , authMiddleware , updateProfile)



export default router