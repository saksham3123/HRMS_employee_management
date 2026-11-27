
import { apiRequest } from "./api";

export const getProfile = () => apiRequest("/users/profile");

export const updateProfile = (profileData) =>
  apiRequest("/users/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });


  
// Any logged-in user changes their own password.
export const changePassword = (currentPassword, newPassword) =>
  apiRequest("/users/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
