import pool from "../config/postgres.js"

//get all departments

export const getDepartments = async (req , res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                d.id,
                d.name,
                d.description,
                d.created_at,
                COUNT(e.id)::INTEGER AS employee_count
                FROM departments d
                LEFT JOIN employees e
                    ON e.department_id = d.id
                GROUP BY d.id
                ORDER BY d.name ASC
            `
        )


        return res.status(200).json({
            count: result.rows.length,
            departments: result.rows,

        })
    } catch (error) {

         console.error("Get departments error:", error);

        return res.status(500).json({
            message: "Failed to retrieve departments",
        });
        
    }
}



// get department by id


export const getDepartmentById = async (req, res) => {

    try {

          const { id } = req.params;



        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: "Invalid department ID",
            });
        }


        const result = await pool.query(
            `SELECT
                d.id,
                d.name,
                d.description,
                d.created_at,
                COUNT(e.id)::INTEGER AS employee_count
             FROM departments d
             LEFT JOIN employees e
                ON e.department_id = d.id
             WHERE d.id = $1
             GROUP BY d.id`,
            [Number(id)]
        );


        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Department not found",
            });
        }


        return res.status(200).json({
            departments: result.rows[0]
        })
        
    } catch (error) {

        console.error("Get department error:", error);

        return res.status(500).json({
            message: "Failed to retrieve department",
        });
        
    }

}


// create department

export const createDepartment = async (req , res) => {
    try {
        
        const {name  , description } = req.body;

        if(typeof name !== "string" || !name.trim()){
            return res.status(400).json({
                message: "Department name is required",
            })
        }


        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be a string",
            });
        }


        const normalizedName = name.trim()
        const normalizedDescription = 
        typeof description === "string" && description.trim() ? description.trim(): null

        const result = await pool.query(
             `INSERT INTO departments (name, description)
             VALUES ($1, $2)
             RETURNING id, name, description, created_at`,
            [normalizedName, normalizedDescription]
        )

          return res.status(201).json({
            message: "Department created successfully",
            department: result.rows[0],
        });


        
    } catch (error) {

        if (error.code === "23505") {
            return res.status(409).json({
                message: "A department with this name already exists",
            });
        }

        console.error("Create department error:", error);

        return res.status(500).json({
            message: "Failed to create department",
        });
        
    }
}


// update department

export const updateDepartment = async (req, res) => {
    try {
        
        const { id } = req.params;
        const { name , description} = req.body;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: "Invalid department ID",
            });
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Department name is required",
            });
        }

         if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be a string",
            });
        }


         const normalizedDescription =
            typeof description === "string" && description.trim()
                ? description.trim()
                : null;

         const result = await pool.query(
            `UPDATE departments
             SET name = $1,
                 description = $2
             WHERE id = $3
             RETURNING id, name, description, created_at`,
            [name.trim(), normalizedDescription, Number(id)]
        );


         if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Department not found",
            });
        }


         return res.status(200).json({
            message: "Department updated successfully",
            department: result.rows[0],
        });      




    } catch (error) {

         if (error.code === "23505") {
            return res.status(409).json({
                message: "A department with this name already exists",
            });
        }

        console.error("Update department error:", error);

        return res.status(500).json({
            message: "Failed to update department",
        });

        
    }
}




// delete a department

export const deleteDepartment = async (res , req) => {
    try {
        const {id} = req.params

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: "Invalid department ID",
            });
        }


        const result = await pool.query(
            `DELETE FROM departments d
             WHERE d.id = $1
               AND NOT EXISTS (
                   SELECT 1
                   FROM employees e
                   WHERE e.department_id = d.id
               )
             RETURNING d.id, d.name`,
            [Number(id)]
        );


        if (result.rows.length === 0) {
            const existing = await pool.query(
                `SELECT id
                 FROM departments
                 WHERE id = $1`,
                [Number(id)]
            );


            if (existing.rows.length === 0) {
                return res.status(404).json({
                    message: "Department not found",
                });
            }

            return res.status(409).json({
                message:
                    "Cannot delete a department that has employees assigned to it",
            });
        }

        return res.status(200).json({
            message: "Department deleted successfully",
            department: result.rows[0],
        });       


    } catch (error) {

         console.error("Delete department error:", error);

        return res.status(500).json({
            message: "Failed to delete department",
        });
        
    }
}
