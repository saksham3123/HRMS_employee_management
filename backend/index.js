import "dotenv/config"
import express from 'express';
import connectDB from './config/db.js';
import pool from "./config/postgres.js";

import cors from "cors"
import userRoutes from "./routes/user.route.js"
import adminRoutes from "./routes/admin.route.js"
import attendanceRoutes from "./routes/attedance.route.js"


const app = express();


app.use(cors());
app.use(express.json())


app.use("/api/users", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/attendance", attendanceRoutes)

app.get('/', (req, res) => {
  res.send("backend running..");
});

const port = process.env.PORT || 3000;


const startServer = async () => {
  try {

    //keep mongoDb available while we migrate existing modules.
    await connectDB();


    //verify postgreSQL is available  before starting the server.

    await pool.query("SELECT 1");

    console.log("Postgresql connected");


    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });

  } catch (error) {

    console.error("Server startup failed:" , error.message);
    process.exit(1);

  }

}


startServer();


