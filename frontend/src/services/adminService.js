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
