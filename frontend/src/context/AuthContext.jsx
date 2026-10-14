import { createContext, useContext, useState } from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentUser());

  // Login and save the authenticated user
  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    return data.user;
  };

  // Logout and clear the saved session
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication
export const useAuth = () => {
  return useContext(AuthContext);
};
