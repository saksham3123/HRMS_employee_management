-- HR staff and managers are employees too: let them clock in, see their own
-- attendance and payslips. Admin already holds every permission.
-- (Mirrors the role-permission seed in database/schema.sql.)

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."permission_key" IN (
    'attendance.view.self',
    'attendance.clock',
    'payroll.view.self'
)
WHERE r."name" IN ('hr', 'manager')
ON CONFLICT DO NOTHING;
