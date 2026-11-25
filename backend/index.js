import "dotenv/config";
import express from "express";
import prisma from "./config/prisma.js";

import cors from "cors";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import attendanceRoutes from "./routes/attedance.route.js";
import leaveRoutes from "./routes/leave.route.js"
import departmentRoutes from "./routes/department.route.js"
import designationRoutes from "./routes/designation.route.js";
import managerRoutes from "./routes/manager.route.js"
import platformRoutes from "./routes/platform.route.js";
import publicRoutes from "./routes/public.route.js";


const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
}));
// Bigger than the 100kb default so an Excel import of a few thousand rows fits.
app.use(express.json({ limit: "5mb" }));

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes)
app.use("/api/departments" , departmentRoutes)
app.use("/api/designations", designationRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/public", publicRoutes);



app.get("/", (req, res) => {
  res.send("backend running..");
});

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Verify PostgreSQL is available before starting the server.
    await prisma.$queryRaw`SELECT 1`;

    console.log("PostgreSQL connected");

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();