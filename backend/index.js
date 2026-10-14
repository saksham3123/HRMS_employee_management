import "dotenv/config"

import express from 'express';
import connectDB from './config/db.js';
import cors from "cors"
import userRoutes from "./routes/user.route.js"
import adminRoutes from "./routes/admin.route.js"
import attendanceRoutes from "./routes/attedance.route.js"







const app = express();


app.use(cors());
app.use(express.json())




app.use("/api/users" , userRoutes)
app.use("/api/admin", adminRoutes)

app.use("/api/attendance" , attendanceRoutes)


connectDB()


app.get('/', (req, res) => {
  res.send("backend running..");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
