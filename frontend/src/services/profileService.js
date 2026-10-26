
import { apiRequest } from "./api";

export const getProfile = () => apiRequest("/users/profile");

export const updateProfile = (profileData) =>
  apiRequest("/users/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
