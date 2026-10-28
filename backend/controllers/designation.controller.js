import pool from "../config/postgres.js"


// get designations
export const getDesignations = async (req, res)=>{
    try {
        const result = await pool.query(`
      SELECT
        d.id,
        d.title,
        d.description,
        COUNT(e.id)::INTEGER AS employee_count
      FROM designations d
      LEFT JOIN employees e ON e.designation_id = d.id
      GROUP BY d.id
      ORDER BY d.title ASC
    `)

     return res.status(200).json({
      count: result.rows.length,
      designations: result.rows,
    });


    } catch (error) {


    console.error("Get designations error:", error);
    return res.status(500).json({
      message: "Failed to retrieve designations",
    });
        
    }
}


//  get api by id
export const getDesignationById = async (req, res)=>{
    const { id } = req.params

    if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({ message: "Invalid designation ID" });
  }

  try {

     const result = await pool.query(
      `SELECT
         d.id,
         d.title,
         d.description,
         d.created_at,
         COUNT(e.id)::INTEGER AS employee_count
       FROM designations d
       LEFT JOIN employees e ON e.designation_id = d.id
       WHERE d.id = $1
       GROUP BY d.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Designation not found" });
    }

    return res.status(200).json({ designation: result.rows[0] });

    
  } catch (error) {
     console.error("Get designation error:", error);
    return res.status(500).json({
      message: "Failed to retrieve designation",
    });
    
  }

}


// create dsignation
export const createDesignation =  async (req , res) => {
    const { title , description } = req.body;


  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Designation title is required" });
  }



  if (description != null && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }

  try {

     const result = await pool.query(
      `INSERT INTO designations (title, description)
       VALUES ($1, $2)
       RETURNING id, title, description, created_at`,
      [title.trim(), description?.trim() || null]
    );

    return res.status(201).json({
      message: "Designation created successfully",
      designation: result.rows[0],
    });
    

  } catch (error) {

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A designation with this title already exists",
      });
    }

    console.error("Create designation error:", error);
    return res.status(500).json({ message: "Failed to create designation" });
  }
    
  }

// update designation

export const updateDesignation= async (req , res) => {

    const { id } = req.params;
  const { title, description } = req.body;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({ message: "Invalid designation ID" });
  }

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Designation title is required" });
  }

  if (description != null && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }


  try {

     const result = await pool.query(
      `UPDATE designations
       SET title = $1, description = $2
       WHERE id = $3
       RETURNING id, title, description, created_at`,
      [title.trim(), description?.trim() || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Designation not found" });
    }

     return res.status(200).json({
      message: "Designation updated successfully",
      designation: result.rows[0],
    });


    
  } catch (error) {


    if (error.code === "23505") {
      return res.status(409).json({
        message: "A designation with this title already exists",
      });
    }

    console.error("Update designation error:", error);
    return res.status(500).json({ message: "Failed to update designation" });
    
  }

    
}


//delete designation

export const deleteDesignation = async (req , res)=>{
     const {id} = req.params

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({ message: "Invalid designation ID" });
  }

  try {
    
    const result = await pool.query(
        `DELETE FROM designations d
       WHERE d.id = $1
         AND NOT EXISTS (
           SELECT 1 FROM employees e
           WHERE e.designation_id = d.id
         )
       RETURNING d.id, d.title`,
      [id]
    )

     if (result.rows.length === 0) {
      const existing = await pool.query(
        "SELECT id FROM designations WHERE id = $1",
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Designation not found" });
      }

      return res.status(409).json({
        message: "Cannot delete a designation assigned to employees",
      });
    }


     return res.status(200).json({
      message: "Designation deleted successfully",
      designation: result.rows[0],
    });


   


  } catch (error) {


    console.error("Delete designation error:", error);
    return res.status(500).json({ message: "Failed to delete designation" });

    
  }


}