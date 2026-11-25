import { apiRequest } from "./api";

// Login user or admin
// `slug` is set on a company's own login page, so only its users get in.
export const loginUser = async (email, password, slug) => {
  const data = await apiRequest("/users/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      slug,
    }),
  });

  if (!data?.token || !data?.user) {
    throw new Error("Login failed. Please try again.");
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};

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
    const parsed = JSON.parse(user);

    // Sessions saved before company URLs existed have no slug to build links
    // from; sign them out so the next login stores it.
    if (!parsed?.organization?.slug) {
      logoutUser();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

// Check whether a token exists
export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("token"));
};