import { apiRequest } from "./api";

const departmentService = {
  getAll: () => apiRequest("/departments"),

  create: (departmentData) =>
    apiRequest("/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    }),

  update: (id, departmentData) =>
    apiRequest(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(departmentData),
    }),

  delete: (id) =>
    apiRequest(`/departments/${id}`, {
      method: "DELETE",
    }),
};

export default departmentService;
