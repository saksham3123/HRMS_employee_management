-- Multi-tenancy: organizations + organization_id on every company-owned table.
-- Existing data is kept and assigned to the first organization, Cybersigma.
-- roles, permissions, role_permissions and user_roles stay shared (same 4 roles everywhere).

BEGIN;

-- 1. Organizations
CREATE TABLE "organizations" (
    "id"         SERIAL       NOT NULL,
    "name"       VARCHAR(150) NOT NULL,
    "slug"       VARCHAR(80)  NOT NULL,
    "status"     VARCHAR(20)  NOT NULL DEFAULT 'active',
    "plan"       VARCHAR(30)  NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organizations_status_check" CHECK ("status" IN ('active', 'suspended'))
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- 2. The first organization owns all existing data
INSERT INTO "organizations" ("name", "slug") VALUES ('Cybersigma', 'cybersigma');

-- 3. organization_id on each company-owned table:
--    add as nullable -> fill with Cybersigma -> make NOT NULL -> FK + index
DO $$
DECLARE
    org_id  INTEGER;
    tbl     TEXT;
BEGIN
    SELECT "id" INTO org_id FROM "organizations" WHERE "slug" = 'cybersigma';

    FOREACH tbl IN ARRAY ARRAY[
        'users', 'employees', 'departments', 'designations',
        'leave_types', 'leave_requests', 'attendance', 'employee_reporting'
    ]
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN "organization_id" INTEGER', tbl);
        EXECUTE format('UPDATE %I SET "organization_id" = %s', tbl, org_id);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN "organization_id" SET NOT NULL', tbl);
        EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("organization_id") '
            'REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
            tbl, tbl || '_organization_id_fkey'
        );
        EXECUTE format(
            'CREATE INDEX %I ON %I ("organization_id")',
            tbl || '_organization_id_idx', tbl
        );
    END LOOP;
END $$;

-- 4. Names/numbers are unique per company instead of globally.
--    (users.email stays globally unique: one email, one company.)
ALTER TABLE "departments"  DROP CONSTRAINT IF EXISTS "departments_name_key";
DROP INDEX IF EXISTS "departments_name_key";
CREATE UNIQUE INDEX "departments_organization_id_name_key"
    ON "departments"("organization_id", "name");

ALTER TABLE "designations" DROP CONSTRAINT IF EXISTS "designations_title_key";
DROP INDEX IF EXISTS "designations_title_key";
CREATE UNIQUE INDEX "designations_organization_id_title_key"
    ON "designations"("organization_id", "title");

ALTER TABLE "employees"    DROP CONSTRAINT IF EXISTS "employees_employee_number_key";
DROP INDEX IF EXISTS "employees_employee_number_key";
CREATE UNIQUE INDEX "employees_organization_id_employee_number_key"
    ON "employees"("organization_id", "employee_number");

ALTER TABLE "leave_types"  DROP CONSTRAINT IF EXISTS "leave_types_name_key";
DROP INDEX IF EXISTS "leave_types_name_key";
CREATE UNIQUE INDEX "leave_types_organization_id_name_key"
    ON "leave_types"("organization_id", "name");

COMMIT;