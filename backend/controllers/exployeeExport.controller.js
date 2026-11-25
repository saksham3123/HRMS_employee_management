import ExcelJS from "exceljs"
import prisma from "../config/prisma.js"


const STATUS_LABELS = {
    active: "Active",
    on_leave: "On leave",
    probation: "Probation",
    resigned: "Resigned",
    terminated: "Terminated",
}

const COLUMNS = [
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Role", key: "role", width: 12 },
    { header: "Department", key: "department", width: 18 },
    { header: "Designation", key: "designation", width: 20 },
    { header: "Joining date", key: "joining_date", width: 14, style: { numFmt: "yyyy-mm-dd" } },
    { header: "Employment status", key: "employment_status", width: 18 },
    { header: "Employee number", key: "employee_number", width: 16 },
    { header: "Account", key: "account", width: 12 },
]


export const exportUsers = async (req, res) => {
    try {
        // 1. Fetch: same tables as getAllUsers, only the columns the file needs.
        const [organization, users] = await Promise.all([
            // organizations isn't a company-scoped table, so look it up by id.
            prisma.organizations.findUnique({
                where: { id: req.user.organizationId },
                select: { name: true, slug: true },
            }),
            req.db.users.findMany({
                orderBy: { name: "asc" },
                select: {
                    name: true,
                    email: true,
                    is_active: true,
                    user_roles: { select: { roles: { select: { name: true } } } },
                    employees: {
                        select: {
                            employee_number: true,
                            phone: true,
                            joining_date: true,
                            employment_status: true,
                            departments: { select: { name: true } },
                            designations: { select: { title: true } },
                        },
                    },
                },
            }),
        ]);

        // 2. Build the workbook.
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "PeopleDesk";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Employees", {
            views: [{ state: "frozen", ySplit: 1 }], // header stays visible while scrolling
        });
        sheet.columns = COLUMNS;
        sheet.getRow(1).font = { bold: true };
        sheet.autoFilter = { from: "A1", to: { row: 1, column: COLUMNS.length } };

        for (const user of users) {
            const employee = user.employees;
            sheet.addRow({
                name: user.name,
                email: user.email,
                phone: employee?.phone ?? "",
                role: [...new Set(user.user_roles.map((ur) => ur.roles.name))].sort().join(", "),
                department: employee?.departments?.name ?? "",
                designation: employee?.designations?.title ?? "",
                // @db.Date comes back as a Date at UTC midnight; Excel shows it as a date.
                joining_date: employee?.joining_date ?? null,
                employment_status: STATUS_LABELS[employee?.employment_status] ?? employee?.employment_status ?? "",
                employee_number: employee?.employee_number ?? "",
                account: user.is_active ? "Active" : "Deactivated",
            });
        }

        // 3. Send it as a file download.
        const today = new Date().toISOString().slice(0, 10);
        const fileName = `${organization?.slug ?? "company"}-employees-${today}.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        // Lets the browser JavaScript read the file name (CORS hides it otherwise).
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Export users error:", error);
        // Headers may already be sent if writing failed half-way.
        if (!res.headersSent) {
            res.status(500).json({ message: "Export failed due to a server error" });
        } else {
            res.end();
        }
    }
};