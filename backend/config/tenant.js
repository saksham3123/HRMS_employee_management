import prisma from "./prisma.js";

// Tables that belong to one company (they have an organization_id column).
// roles, permissions, role_permissions and user_roles are shared, so they
// are not listed and are never filtered.
export const TENANT_MODELS = new Set([
  "users",
  "employees",
  "departments",
  "designations",
  "leave_types",
  "leave_requests",
  "attendance",
  "employee_reporting",
]);

// Operations whose `where` gets the company filter.
const FILTERED_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
]);

const withOrganization = (data, organizationId) =>
  Array.isArray(data)
    ? data.map((row) => ({ ...row, organization_id: organizationId }))
    : { ...data, organization_id: organizationId };

const buildTenantClient = (organizationId) =>
  prisma.$extends({
    name: "tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) {
            return query(args);
          }

          const scopedArgs = { ...args };

          if (FILTERED_OPERATIONS.has(operation)) {
            scopedArgs.where = { ...args.where, organization_id: organizationId };
          } else if (operation === "create") {
            scopedArgs.data = withOrganization(args.data, organizationId);
          } else if (
            operation === "createMany" ||
            operation === "createManyAndReturn"
          ) {
            scopedArgs.data = withOrganization(args.data, organizationId);
          } else if (operation === "upsert") {
            scopedArgs.where = { ...args.where, organization_id: organizationId };
            scopedArgs.create = withOrganization(args.create, organizationId);
          }

          return query(scopedArgs);
        },
      },
    },
  });

// One scoped client per company, reused across requests.
const tenantClients = new Map();

/**
 * Prisma client limited to one company.
 *
 *   const db = forOrganization(req.user.organizationId);
 *   await db.departments.findMany();          // only this company's rows
 *   await db.departments.create({ data });    // organization_id filled in
 *
 * Raw SQL ($queryRaw) is NOT filtered: add `organization_id = ${id}` yourself.
 */
export const forOrganization = (organizationId) => {
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    throw new Error("forOrganization() needs a valid organization id");
  }

  if (!tenantClients.has(organizationId)) {
    tenantClients.set(organizationId, buildTenantClient(organizationId));
  }

  return tenantClients.get(organizationId);
};