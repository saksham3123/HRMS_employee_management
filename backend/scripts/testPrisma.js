import prisma from "../config/prisma.js";

try {
  const [users, departments, firstEmployee] = await Promise.all([
    prisma.users.count(),
    prisma.departments.findMany({
      include: { _count: { select: { employees: true } } },
    }),
    prisma.employees.findFirst({
      select: { id: true, user_id: true, employee_number: true },
    }),
  ]);

  console.log("Users:", users);
  console.log("Departments:", departments);
  console.log("First employee:", firstEmployee);
} catch (error) {
  console.error("Prisma test failed:", error);
} finally {
  await prisma.$disconnect();
}