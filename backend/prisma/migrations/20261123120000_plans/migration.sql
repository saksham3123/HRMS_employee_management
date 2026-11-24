-- Subscription plans, managed from the platform (super admin) portal.
-- Shared by every company; organizations.plan references plans.code.
-- The four rows below are placeholder plans to edit from the portal.

CREATE TABLE "plans" (
    "id"            SERIAL       NOT NULL,
    "code"          VARCHAR(30)  NOT NULL,
    "name"          VARCHAR(60)  NOT NULL,
    "description"   VARCHAR(255) NOT NULL DEFAULT '',
    "price_monthly" INTEGER      NOT NULL DEFAULT 0,
    "price_yearly"  INTEGER      NOT NULL DEFAULT 0,
    "max_employees" INTEGER,
    "features"      TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_active"     BOOLEAN      NOT NULL DEFAULT true,
    "is_featured"   BOOLEAN      NOT NULL DEFAULT false,
    "sort_order"    INTEGER      NOT NULL DEFAULT 0,
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plans_prices_check" CHECK ("price_monthly" >= 0 AND "price_yearly" >= 0),
    CONSTRAINT "plans_max_employees_check" CHECK ("max_employees" IS NULL OR "max_employees" > 0)
);

CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

INSERT INTO "plans" ("code", "name", "description", "price_monthly", "price_yearly", "max_employees", "features", "is_featured", "sort_order") VALUES
('free', 'Free', 'For small teams getting started.', 0, 0, 10,
    ARRAY['Employee records', 'Clock-in and attendance history', 'Leave requests and approvals'], false, 1),
('basic', 'Basic', 'For growing teams with managers.', 1499, 14990, 50,
    ARRAY['Everything in Free', 'Departments and designations', 'Reporting managers and team leave approval'], false, 2),
('pro', 'Pro', 'For companies running payroll on attendance.', 3999, 39990, 200,
    ARRAY['Everything in Basic', 'Monthly payroll summaries', 'Per-employee attendance reports'], true, 3),
('enterprise', 'Enterprise', 'For large organizations.', 9999, 99990, NULL,
    ARRAY['Everything in Pro', 'Role-based permissions for every team'], false, 4);

-- Every existing company already uses one of these codes.
ALTER TABLE "organizations"
    ADD CONSTRAINT "organizations_plan_fkey" FOREIGN KEY ("plan")
    REFERENCES "plans"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
