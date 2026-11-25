// Excel import for employees, using SheetJS (the "xlsx" package): reads the
// uploaded sheet in the browser and builds the template and results files.
// (Export is built by the backend: GET /api/admin/users/export.)
// SheetJS is loaded only when someone opens the import, so it stays out of
// the main bundle.
const loadXlsx = () => import("xlsx");

// PeopleDesk fields an import can fill. `aliases` are header names we
// recognise automatically (compared lowercased, without spaces/punctuation).
// The `header` is what the template uses; it also matches the backend
// export's column names, so an exported file can be imported again.
export const IMPORT_FIELDS = [
  { key: "name", header: "Name", required: true, aliases: ["name", "fullname", "employeename", "empname", "staffname"] },
  { key: "email", header: "Email", required: true, aliases: ["email", "emailid", "emailaddress", "mail", "workemail", "officialemail"] },
  { key: "phone", header: "Phone", aliases: ["phone", "phoneno", "phonenumber", "mobile", "mobileno", "mobilenumber", "contact", "contactno", "contactnumber"] },
  { key: "role", header: "Role", aliases: ["role", "userrole", "accessrole", "access", "accesslevel", "systemrole"], hint: "employee, manager or hr (blank = employee)" },
  { key: "department", header: "Department", aliases: ["department", "dept", "departmentname", "team"], hint: "New names are created" },
  { key: "designation", header: "Designation", aliases: ["designation", "title", "jobtitle", "position", "post"], hint: "New names are created" },
  { key: "joining_date", header: "Joining date", aliases: ["joiningdate", "dateofjoining", "doj", "joindate", "startdate", "joinedon"], hint: "Blank = today" },
  { key: "employment_status", header: "Employment status", aliases: ["employmentstatus", "status", "empstatus"], hint: "active, probation, on leave, resigned, terminated" },
  { key: "employee_number", header: "Employee number", aliases: ["employeenumber", "employeeno", "employeeid", "empid", "empno", "empcode", "employeecode", "staffid"], hint: "Blank = generated" },
];

const squash = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Best guess of which sheet header feeds each field: { name: "Full Name", ... }.
// Each header is used at most once.
export const guessMapping = (headers) => {
  const mapping = {};
  const used = new Set();

  for (const field of IMPORT_FIELDS) {
    const match = headers.find(
      (header) => !used.has(header) && (field.aliases.includes(squash(header)) || squash(header) === squash(field.header))
    );
    mapping[field.key] = match ?? "";
    if (match) used.add(match);
  }

  return mapping;
};

const pad = (n) => String(n).padStart(2, "0");

// Dates come in as Excel serial numbers (real date cells) or as text.
// Text is read as YYYY-MM-DD, or day-first DD-MM-YYYY / DD/MM/YYYY.
// Anything else is passed through as typed so the server reports it.
const toIsoDate = (XLSX, value) => {
  if (value === "" || value === null || value === undefined) return "";

  if (typeof value === "number") {
    const parts = XLSX.SSF.parse_date_code(value);
    return parts ? `${parts.y}-${pad(parts.m)}-${pad(parts.d)}` : String(value);
  }

  const textValue = String(value).trim();
  let match = textValue.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;

  match = textValue.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return `${match[3]}-${pad(match[2])}-${pad(match[1])}`;

  return textValue;
};

const cellText = (value) => (value === null || value === undefined ? "" : String(value).trim());

// Reads the first sheet of an .xlsx/.xls/.csv file.
// Returns { sheetName, headers: [...], rows: [ { header: value } ] }.
export const readSpreadsheet = async (file) => {
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) throw new Error("The file has no sheets.");

  const sheet = workbook.Sheets[sheetName];
  // header: 1 -> arrays, so duplicate or blank headers don't get lost.
  const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

  if (table.length < 2) {
    throw new Error("The first sheet needs a header row and at least one row of data.");
  }

  // Blank headers become "Column C" etc.; repeated ones get " (2)".
  const seen = new Map();
  const headers = table[0].map((header, index) => {
    let name = cellText(header) || `Column ${XLSX.utils.encode_col(index)}`;
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    if (count > 1) name = `${name} (${count})`;
    return name;
  });

  const rows = table.slice(1)
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])))
    .filter((row) => Object.values(row).some((value) => cellText(value) !== ""));

  return { sheetName, headers, rows, XLSX };
};

// Turns sheet rows into what POST /admin/users/import expects.
export const applyMapping = (XLSX, rows, mapping) =>
  rows.map((row) => {
    const out = {};
    for (const field of IMPORT_FIELDS) {
      const header = mapping[field.key];
      const value = header ? row[header] : "";
      out[field.key] = field.key === "joining_date" ? toIsoDate(XLSX, value) : cellText(value);
    }
    return out;
  });

const today = () => new Date().toISOString().slice(0, 10);

const sheetWithWidths = (XLSX, data) => {
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!cols"] = data[0].map((_, col) => ({
    wch: Math.min(Math.max(...data.map((row) => cellText(row[col]).length), 8) + 2, 50),
  }));
  return sheet;
};

// Empty template with the expected headers and one example row.
export const downloadImportTemplate = async () => {
  const XLSX = await loadXlsx();

  const data = [
    IMPORT_FIELDS.map((field) => field.header),
    ["Asha Rao", "asha.rao@example.com", "+91 98765 43210", "employee", "Engineering", "Software Engineer", today(), "active", ""],
  ];
  const notes = [
    ["Column", "Required", "Notes"],
    ...IMPORT_FIELDS.map((field) => [field.header, field.required ? "Yes" : "No", field.hint ?? ""]),
    [],
    ["Delete the example row before importing. Admin accounts can't be imported; add them one at a time."],
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheetWithWidths(XLSX, data), "Employees");
  XLSX.utils.book_append_sheet(workbook, sheetWithWidths(XLSX, notes), "Instructions");
  XLSX.writeFile(workbook, "peopledesk-import-template.xlsx");
};

// Import response -> results file with temporary passwords and errors.
export const downloadImportResults = async (result) => {
  const XLSX = await loadXlsx();
  const workbook = XLSX.utils.book_new();

  const created = [
    ["Row", "Name", "Email", "Employee number", "Role", "Department", "Designation", "Temporary password"],
    ...result.created.map((row) => [
      row.row, row.name, row.email, row.employee_number, row.role,
      row.department ?? "", row.designation ?? "", row.temp_password,
    ]),
  ];
  XLSX.utils.book_append_sheet(workbook, sheetWithWidths(XLSX, created), "Imported");

  const failed = [
    ["Row", "Name", "Email", "Problem"],
    ...result.failed.map((row) => [row.row, row.name, row.email, row.errors.join("; ")]),
  ];
  XLSX.utils.book_append_sheet(workbook, sheetWithWidths(XLSX, failed), "Not imported");

  XLSX.writeFile(workbook, `peopledesk-import-results-${today()}.xlsx`);
};