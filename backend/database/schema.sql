-- ============================================
-- HRMS: Foundational PostgreSQL Schema
-- ============================================



--1. User Accounts

CREATE TABLE IF NOT EXISTS users(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON users (LOWER(email));


-- 2. Roles
CREATE TABLE IF NOT EXISTS roles(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


--3. Permissions
CREATE TABLE IF NOT EXISTS permissions(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);


--4. Assign roles to users
CREATE TABLE IF NOT EXISTS user_roles(
    user_id INTEGER NOT NULL REFERENCES
    users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id , role_id)    
);

--5. ASSIGN PERMISSION TO ROLES
CREATE TABLE IF NOT EXISTS role_permissions(
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (ROLE_ID , permission_id)
);

--6. DEPARTMENTS

CREATE TABLE IF NOT EXISTS departments(
   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   name VARCHAR(120) NOT NULL UNIQUE,
   description TEXT,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--7. Designations / job titles 
CREATE TABLE IF NOT EXISTS designations(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(120) not null UNIQUE,
    description TEXT
);

--8. Employee records 
CREATE TABLE IF NOT EXISTS  employees (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(30), 
    department_id INTEGER REFERENCES departments(id) on DELETE set NULL,
    designation_id INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    joining_date Date, 
    employment_status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK(employment_status IN (
        'active' , 'on_leave' , 'probation' , 'resigned' , 'terminated'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT
    CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS leave_types (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO leave_types (name)
VALUES
    ('Annual Leave'),
    ('Sick Leave'),
    ('Personal Leave')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date)
);

ALTER TABLE leave_requests
DROP CONSTRAINT IF EXISTS leave_requests_status_check;

ALTER TABLE leave_requests
ADD CONSTRAINT leave_requests_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

CREATE INDEX IF NOT EXISTS leave_requests_employee_created_idx
ON leave_requests (employee_id, created_at DESC);


--9. Employee reporting relationships

CREATE TABLE IF NOT EXISTS employee_reporting(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    CHECK(employee_id <> manager_employee_id),
    CHECK(effective_to IS NULL OR effective_to >= effective_from),
    UNIQUE(employee_id , effective_from)
);

--10. Attendance records

CREATE TABLE IF NOT EXISTS attendance(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

    date DATE NOT NULL DEFAULT CURRENT_DATE,

    login_time TIMESTAMPTZ NOT NULL,
    logout_time TIMESTAMPTZ,

    working_hours NUMERIC(8 , 2) NOT NULL DEFAULT 0
    CHECK(working_hours >=0),

    hourly_rate NUMERIC(10 , 2) NOT NULL DEFAULT 100
    CHECK (hourly_rate >= 0),

    daily_pay NUMERIC(10 , 2) NOT NULL DEFAULT 0
    CHECK (daily_pay >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- One attendance record per employee per day

    CONSTRAINT attendance_employee_date_unique
    UNIQUE (employee_id , date),

    --Clock-out cannot precede clock-in
    CONSTRAINT attendance_employee_valid_times
    CHECK (logout_time IS NULL OR logout_time >= login_time)
);



-- Initial roles 

INSERT INTO roles (name, description)
VALUES
    ('admin', 'System administrator'),
    ('hr', 'Human resources'),
    ('manager', 'Team manager'),
    ('employee', 'Regular employee')
ON CONFLICT (name) DO NOTHING;



INSERT INTO permissions (permission_key, description)
VALUES
    ('users.view', 'View user accounts'),
    ('users.create', 'Create user accounts'),
    ('users.update', 'Update user accounts'),
    ('users.deactivate', 'Deactivate user accounts'),

    ('employees.view', 'View employee records'),
    ('employees.create', 'Create employee records'),
    ('employees.update', 'Update employee records'),
    ('employees.delete', 'Delete employee records'),

    ('departments.manage', 'Manage departments'),
    ('designations.manage', 'Manage designations'),

    ('attendance.view.self', 'View own attendance'),
    ('attendance.view.team', 'View team attendance'),
    ('attendance.view.all', 'View organization attendance'),
    ('attendance.clock', 'Clock in and clock out'),

    ('leave.apply', 'Apply for leave'),
    ('leave.approve.team', 'Approve team leave'),
    ('leave.manage', 'Manage all leave requests'),

    ('payroll.view.self', 'View own payslips'),
    ('payroll.view.all', 'View organization payroll'),
    ('payroll.manage', 'Process and manage payroll'),

    ('roles.manage', 'Manage roles and permissions')
ON CONFLICT (permission_key) DO NOTHING;


--Initial role-permission mappings

--admin recieves all the currently defined permissions
INSERT INTO role_permissions (role_id , permission_id)
SELECT r.id , p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- HR permission
INSERT INTO role_permissions(role_id , permission_id)
SELECT r.id , p.id
FROM roles r
JOIN permissions  p ON p.permission_key IN (
    'users.view',
    'users.update',
    'employees.view',
    'employees.create',
    'employees.update',
    'departments.manage',
    'designations.manage',
    'attendance.view.all',
    'leave.manage',
    'leave.apply',
    'payroll.view.self',
    'payroll.view.all',
    'payroll.manage'
)
WHERE r.name = 'hr' ON CONFLICT DO NOTHING;

DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name = 'hr'
  AND p.permission_key = 'users.create';

--MANAGER PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'employees.view',
    'attendance.view.team',
    'leave.approve.team',
    'leave.apply'
)
WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;


-- Employee permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN (
    'attendance.view.self',
    'attendance.clock',
    'leave.apply',
    'payroll.view.self'
)
WHERE r.name = 'employee'
ON CONFLICT DO NOTHING;


-- Useful indexes
CREATE INDEX IF NOT EXISTS employees_department_idx
ON employees (department_id);

CREATE INDEX IF NOT EXISTS employees_designation_idx
ON employees (designation_id);

CREATE INDEX IF NOT EXISTS employee_reporting_manager_idx
ON employee_reporting (manager_employee_id);

CREATE INDEX IF NOT EXISTS user_roles_role_idx
ON user_roles (role_id);


CREATE INDEX IF NOT EXISTS attendance_data_idx ON attendance(date);

