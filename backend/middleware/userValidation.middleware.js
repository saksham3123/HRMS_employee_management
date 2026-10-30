import pool from "../config/postgres.js";

const userValidation = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No employee record found for this user.",
      });
    }

    req.employee = result.rows[0];

    next();
  } catch (error) {
    next(error);
  }
};

export default userValidation;
