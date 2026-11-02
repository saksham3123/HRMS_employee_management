import { apiRequest } from "./api";

const designationService = {
  getAll: () => apiRequest("/designations"),

  create: (designationData) =>
    apiRequest("/designations", {
      method: "POST",
      body: JSON.stringify(designationData),
    }),

  update: (id, designationData) =>
    apiRequest(`/designations/${id}`, {
      method: "PUT",
      body: JSON.stringify(designationData),
    }),

  delete: (id) =>
    apiRequest(`/designations/${id}`, {
      method: "DELETE",
    }),
};

export default designationService;
