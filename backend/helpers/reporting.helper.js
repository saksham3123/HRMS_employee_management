// Returns true if making `managerId` the manager of `employeeId` would create
// a reporting loop (i.e. employeeId already appears in managerId's chain).
//
// `db` is the Prisma client or a transaction client (`tx`).
// Kept as raw SQL because Prisma's query API has no recursive queries.
export const createsReportingCycle = async (db, employeeId, managerId) => {
  const [result] = await db.$queryRaw`
    WITH RECURSIVE manager_chain AS (
      SELECT manager_employee_id
      FROM employee_reporting
      WHERE employee_id = ${managerId}
        AND effective_to IS NULL

      UNION

      SELECT er.manager_employee_id
      FROM employee_reporting er
      JOIN manager_chain mc
        ON er.employee_id = mc.manager_employee_id
      WHERE er.effective_to IS NULL
    )
    SELECT EXISTS (
      SELECT 1
      FROM manager_chain
      WHERE manager_employee_id = ${employeeId}
    ) AS creates_cycle`;

  return Boolean(result?.creates_cycle);
};