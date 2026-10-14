import { apiRequest } from "./api";


export const loginUser = async (email , password) => {
    const data = await apiRequest("/users/login" , {
        method: "POST" , 
        body: JSON.stringify({
            email, 
            password,
        }),
    })

      localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
    
}

// Logout user or admin
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Get currently logged-in user
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

// Check whether a token exists
export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("token"));
};