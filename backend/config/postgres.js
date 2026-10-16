import pg from "pg"
import dotenv from "dotenv"

dotenv.config();

const { Pool } = pg

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    post: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "hrms_db",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD,
})

pool.on("error" , (error)=>{
    console.error("Unexpected PostgreSQL pool error:" , error);
    
})

export default pool;