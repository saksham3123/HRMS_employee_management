
export const createsReportingCycle = async (
  client,
  employeeId,
  managerId
) => {
  const result = await client.query(
    `WITH RECURSIVE manager_chain AS (
       SELECT manager_employee_id
       FROM employee_reporting
       WHERE employee_id = $1
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
       WHERE manager_employee_id = $2
     ) AS creates_cycle`,
    [managerId, employeeId]
  );

  return result.rows[0].creates_cycle;
};
