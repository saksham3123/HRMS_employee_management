
const userValidation = async (req, res, next) => {
  try {
    // users.id -> employees.id (they are different values).
    const employee = await req.db.employees.findUnique({
      where: { user_id: req.user.userId },
      select: { id: true },
    });

    if (!employee) {
      return res.status(404).json({
        message: "No employee record found for this user.",
      });
    }

    req.employee = employee;

    next();
  } catch (error) {
    next(error);
  }
};

export default userValidation;
