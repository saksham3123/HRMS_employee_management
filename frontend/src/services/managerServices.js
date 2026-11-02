import { apiRequest } from "./api";

const managerService = {
  assignManager: (employeeId, managerEmployeeId) =>
    apiRequest(`/admin/employees/${employeeId}/manager`, {
      method: "POST",
      body: JSON.stringify({ manager_employee_id: managerEmployeeId }),
    }),

  updateManager: (employeeId, managerEmployeeId) =>
    apiRequest(`/admin/employees/${employeeId}/manager`, {
      method: "PUT",
      body: JSON.stringify({ manager_employee_id: managerEmployeeId }),
    }),

  getEmployeeManager: (employeeId) =>
    apiRequest(`/admin/employees/${employeeId}/manager`),

  removeManager: (employeeId) =>
    apiRequest(`/admin/employees/${employeeId}/manager`, {
      method: "DELETE",
    }),

  getMyManager: () => apiRequest("/users/me/manager"),

  getMyTeam: () => apiRequest("/manager/team"),
};

export default managerService;
