-- Two-step leave approval: HR and the employee's reporting manager each give
-- a decision. leave_requests.status stays the overall result:
--   approved  = both approved (or HR approved and no manager was required)
--   rejected  = either one rejected
--   pending   = still waiting on at least one of them
--   cancelled = withdrawn by HR/admin

ALTER TABLE "leave_requests"
    ADD COLUMN "hr_status"           VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN "hr_reviewed_by"      INTEGER,
    ADD COLUMN "hr_reviewed_at"      TIMESTAMPTZ(6),
    ADD COLUMN "hr_comment"          TEXT,
    ADD COLUMN "manager_status"      VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN "manager_reviewed_by" INTEGER,
    ADD COLUMN "manager_reviewed_at" TIMESTAMPTZ(6),
    ADD COLUMN "manager_comment"     TEXT;

ALTER TABLE "leave_requests"
    ADD CONSTRAINT "leave_requests_hr_status_check"
        CHECK ("hr_status" IN ('pending', 'approved', 'rejected', 'not_required')),
    ADD CONSTRAINT "leave_requests_manager_status_check"
        CHECK ("manager_status" IN ('pending', 'approved', 'rejected', 'not_required')),
    ADD CONSTRAINT "leave_requests_hr_reviewed_by_fkey"
        FOREIGN KEY ("hr_reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT "leave_requests_manager_reviewed_by_fkey"
        FOREIGN KEY ("manager_reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Requests decided before this change were decided by one reviewer (HR):
-- record that as the HR decision; no manager decision was asked for.
UPDATE "leave_requests"
SET "hr_status"      = CASE WHEN "status" IN ('approved', 'rejected') THEN "status" ELSE 'not_required' END,
    "hr_reviewed_by" = "reviewed_by",
    "hr_reviewed_at" = "reviewed_at",
    "hr_comment"     = "review_comment",
    "manager_status" = 'not_required'
WHERE "status" <> 'pending';

-- Requests still pending need a manager decision only if the employee has one.
UPDATE "leave_requests" lr
SET "manager_status" = 'not_required'
WHERE lr."status" = 'pending'
  AND NOT EXISTS (
      SELECT 1 FROM "employee_reporting" er
      WHERE er."employee_id" = lr."employee_id" AND er."effective_to" IS NULL
  );
