// Company pages live under the company's slug: /acme-labs/dashboard/leaves.
export const companyPath = (user, path = "/dashboard") =>
  `/${user.organization.slug}${path}`;
