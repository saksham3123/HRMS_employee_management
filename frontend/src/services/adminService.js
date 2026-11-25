import { apiRequest } from "./api";

// Fetch all employee accounts
export const getAllEmployees = async () => {
  return await apiRequest("/admin/users");
};

// Create a new employee account
export const createEmployee = async (employeeData) => {
  return await apiRequest("/admin/users", {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
};

export const updateEmployee = async (employeeId, employeeData) => {
  return await apiRequest(`/admin/employees/${employeeId}`, {
    method: "PUT",
    body: JSON.stringify(employeeData),
  });
};

// Delete an employee account
export const deleteEmployee = async (userId) => {
  return await apiRequest(`/admin/users/${userId}`, {
    method: "DELETE",
  });
};

// Fetch a specific employee's monthly attendance report
export const getMonthlyReport = async (userId, month, year) => {
  return await apiRequest(
    `/admin/attendance/${userId}/monthly/${month}/${year}`
  );
};

export const getTodayAttendanceForAdmin = async () => {
  return await apiRequest("/admin/attendance/today");
};



export const getMonthlyPayrollSummary = async (month, year) => {
  return await apiRequest(
    `/admin/payroll/summary/${month}/${year}`
  );
};



export const getMonthlyPayrollByEmployee = async (month, year) => {
  return await apiRequest(
    `/admin/payroll/by-employee/${month}/${year}`
  );
};


// Downloads the company's employees as an Excel file built by the backend.
// Not apiRequest: that expects JSON, and this response is a file.
export const exportEmployeesExcel = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/api/admin/users/export", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Export failed. Please try again.");
  }

  // File name from the backend: attachment; filename="cybersigma-employees-2026-11-24.xlsx"
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fileName = disposition.match(/filename="(.+)"/)?.[1] ?? "employees.xlsx";

  // Turn the bytes into a temporary link and click it to start the download.
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};


// Bulk create employees from the Excel import form.
// rows: [{ name, email, phone, role, department, designation,
//          joining_date, employment_status, employee_number }]
export const importEmployees = async (rows) => {
  return await apiRequest("/admin/users/import", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
};