// API calls for the PeopleDesk platform (super admin) dashboard.
// Uses its OWN token and session, separate from company users
// (company login uses "token"/"user"; platform uses "platformToken"/"platformAdmin").

const API_BASE_URL = "http://localhost:3000/api/platform";

const TOKEN_KEY = "platformToken";
const ADMIN_KEY = "platformAdmin";

export const PLANS = ["free", "basic", "pro", "enterprise"];

const platformRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Check whether the backend is running."
    );
  }

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : null;

  // Expired/invalid platform session -> back to the platform login.
  // (Not for the login request itself, where 401 means wrong credentials.)
  if ((response.status === 401 || response.status === 403) && endpoint !== "/login") {
    clearPlatformSession();
    window.location.href = "/platform/login";
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
};

// ---------- session ----------

export const platformLogin = async (email, password) => {
  const data = await platformRequest("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!data?.token || !data?.admin) {
    throw new Error("Login failed. Please try again.");
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));

  return data.admin;
};

export const clearPlatformSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

export const getPlatformAdmin = () => {
  try {
    const admin = localStorage.getItem(ADMIN_KEY);
    return admin ? JSON.parse(admin) : null;
  } catch {
    return null;
  }
};

export const isPlatformAuthenticated = () =>
  Boolean(localStorage.getItem(TOKEN_KEY)) && Boolean(getPlatformAdmin());

// ---------- data ----------

export const getOverview = () => platformRequest("/overview");

export const listOrganizations = async () => {
  const data = await platformRequest("/organizations");
  return data?.organizations ?? [];
};

export const getOrganization = async (id) => {
  const data = await platformRequest(`/organizations/${id}`);
  return data?.organization ?? null;
};

export const createOrganization = (payload) =>
  platformRequest("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateOrganizationStatus = (id, status) =>
  platformRequest(`/organizations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const updateOrganizationPlan = (id, plan) =>
  platformRequest(`/organizations/${id}/plan`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
