// Calls that need no login (the public landing and checkout pages).
const API_BASE_URL = "http://localhost:3000/api/public";

export const getPublicPlans = async () => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/plans`);
  } catch {
    throw new Error("Plans couldn't be loaded. Check your connection and try again.");
  }

  const data = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || "Plans couldn't be loaded.");
  }

  return data?.plans ?? [];
};

// A company's name for its own login page; null when no active company
// uses this slug.
export const getPublicOrganization = async (slug) => {
  const response = await fetch(`${API_BASE_URL}/organizations/${encodeURIComponent(slug)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Company details couldn't be loaded.");
  }

  const data = await response.json();
  return data.organization;
};

export const formatRupees = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
