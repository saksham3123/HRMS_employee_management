import pool from "./config/postgres.js"

try {
    const result = await pool.query(
        "SELECT current_database() AS database , NOW() AS server_time"
    )

    console.log("PostgreSQL connection successfull");
    console.log(result.rows[0]);
} catch (error) {
    console.error("PostgreSQL connection failed", error.message);
    
}finally{
    await pool.end()
}
