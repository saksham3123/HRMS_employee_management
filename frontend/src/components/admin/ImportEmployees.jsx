import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { importEmployees } from "../../services/adminService";
import {
  IMPORT_FIELDS,
  applyMapping,
  downloadImportResults,
  downloadImportTemplate,
  guessMapping,
  readSpreadsheet,
} from "../../utils/employeeExcel";

const MAX_ROWS = 1000;
const PREVIEW_ROWS = 5;
// Rows are sent in small batches so the progress bar shows real progress.
const BATCH_SIZE = 25;

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const primaryButton =
  "rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

// Excel import in three steps:
//   1. pick a file   2. match each PeopleDesk field to a column in the sheet
//   3. see what was created; a results file with temporary passwords downloads
// Props: onImported() refreshes the employee list, onClose() closes the modal,
//        onBusyChange(bool) stops the modal closing mid-import.
export default function ImportEmployees({ onImported, onClose, onBusyChange }) {
  const [sheet, setSheet] = useState(null); // { fileName, sheetName, headers, rows, XLSX }
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  // { done, total } while an import is running, otherwise null.
  const [progress, setProgress] = useState(null);
  const rootRef = useRef(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // picking the same file again still fires
    if (!file) return;

    setError("");
    setReading(true);
    try {
      const data = await readSpreadsheet(file);
      if (data.rows.length > MAX_ROWS) {
        throw new Error(`This sheet has ${data.rows.length} rows. Import at most ${MAX_ROWS} at a time.`);
      }
      setSheet({ fileName: file.name, ...data });
      setMapping(guessMapping(data.headers));
    } catch (err) {
      setError(err.message || "That file couldn't be read. Use an .xlsx, .xls or .csv file.");
    } finally {
      setReading(false);
    }
  };

  const setField = (key, header) => setMapping((current) => ({ ...current, [key]: header }));

  // Same column picked for two fields?
  const usedTwice = new Set(
    Object.values(mapping).filter((header, index, all) => header && all.indexOf(header) !== index)
  );
  const missingRequired = IMPORT_FIELDS.filter((field) => field.required && !mapping[field.key]);
  const canImport = sheet && missingRequired.length === 0 && usedTwice.size === 0 && !importing;

  const preview = sheet ? applyMapping(sheet.XLSX, sheet.rows.slice(0, PREVIEW_ROWS), mapping) : [];
  const mappedFields = IMPORT_FIELDS.filter((field) => mapping[field.key]);

  // The Modal is a native <dialog>, which the browser draws above everything
  // else. SweetAlert has to open inside it, or it would appear behind it.
  const showAlert = (options) =>
    Swal.fire({
      target: rootRef.current?.closest("dialog") ?? document.body,
      buttonsStyling: false,
      customClass: {
        popup: "pd-swal-popup",
        title: "pd-swal-title",
        htmlContainer: "pd-swal-text",
        actions: "pd-swal-actions",
        confirmButton: "pd-swal-button is-primary",
      },
      ...options,
    });

  const handleImport = async () => {
    setError("");
    setImporting(true);
    onBusyChange?.(true);

    const allRows = applyMapping(sheet.XLSX, sheet.rows, mapping);
    const combined = {
      summary: { total: allRows.length, created: 0, failed: 0 },
      created: [],
      failed: [],
      created_departments: [],
      created_designations: [],
    };
    setProgress({ done: 0, total: allRows.length });

    try {
      for (let start = 0; start < allRows.length; start += BATCH_SIZE) {
        const batch = allRows.slice(start, start + BATCH_SIZE);
        const response = await importEmployees(batch);

        // The backend numbers rows from 2 within each batch; shift them so
        // they match the spreadsheet (row 2 of batch 2 is row 27, etc.).
        const shift = (row) => ({ ...row, row: row.row + start });
        combined.created.push(...response.created.map(shift));
        combined.failed.push(...response.failed.map(shift));
        combined.created_departments.push(...response.created_departments);
        combined.created_designations.push(...response.created_designations);

        setProgress({ done: start + batch.length, total: allRows.length });
      }
    } catch (err) {
      // A batch failed outright (server down, session expired). Rows from
      // earlier batches are already saved, so keep and show them.
      setError(
        combined.created.length
          ? `Stopped part-way: ${err.message || "server error"}. The ${combined.created.length} employees listed below were saved.`
          : err.message || "Import failed. Please try again."
      );
    }

    combined.summary.created = combined.created.length;
    combined.summary.failed = combined.failed.length;
    combined.failed.sort((a, b) => a.row - b.row);
    combined.created_departments = [...new Set(combined.created_departments)];
    combined.created_designations = [...new Set(combined.created_designations)];

    setImporting(false);
    setProgress(null);
    onBusyChange?.(false);

    if (!combined.created.length && !combined.failed.length) return; // nothing came back

    setResult(combined);

    if (combined.created.length) {
      // The temporary passwords exist only in these responses: save them now.
      await downloadImportResults(combined);
      onImported?.();
    }

    const { created, failed } = combined.summary;
    await showAlert(
      created === 0
        ? {
            icon: "error",
            title: "Nothing was imported",
            text: `All ${failed} row${failed === 1 ? "" : "s"} had problems. See the list for the reasons.`,
            confirmButtonText: "See problems",
          }
        : {
            icon: "success",
            title: "Import complete",
            text: failed
              ? `${created} employee${created === 1 ? "" : "s"} imported. ${failed} row${failed === 1 ? " was" : "s were"} skipped; see the list for the reasons.`
              : `All ${created} employee${created === 1 ? " was" : "s were"} imported. The results file with their temporary passwords has been downloaded.`,
            confirmButtonText: "OK",
          }
    );
  };

  // ---- Step 3: results -------------------------------------------------
  if (result) {
    const { summary, failed, created_departments: newDepartments, created_designations: newDesignations } = result;
    return (
      <div ref={rootRef} className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
            <div className="text-xs text-slate-500">Rows in file</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="text-2xl font-bold text-green-700">{summary.created}</div>
            <div className="text-xs text-green-700">Imported</div>
          </div>
          <div className={`rounded-lg p-3 ${summary.failed ? "bg-red-50" : "bg-slate-50"}`}>
            <div className={`text-2xl font-bold ${summary.failed ? "text-red-700" : "text-slate-900"}`}>{summary.failed}</div>
            <div className={`text-xs ${summary.failed ? "text-red-700" : "text-slate-500"}`}>Not imported</div>
          </div>
        </div>

        {summary.created > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            A results file with everyone's <strong>temporary password</strong> has been downloaded.
            This is the only time the passwords are shown, so keep the file safe, share each password
            privately, and delete the file afterwards.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {(newDepartments.length > 0 || newDesignations.length > 0) && (
          <div className="text-sm text-slate-600">
            {newDepartments.length > 0 && <p>New departments: {newDepartments.join(", ")}</p>}
            {newDesignations.length > 0 && <p>New designations: {newDesignations.join(", ")}</p>}
          </div>
        )}

        {failed.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Rows not imported</p>
            <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {failed.map((row) => (
                    <tr key={row.row} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-500">{row.row}</td>
                      <td className="px-3 py-2">{row.email || "—"}</td>
                      <td className="px-3 py-2 text-red-700">{row.errors.join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Row numbers match your spreadsheet. Fix these rows and import them again; rows already
              imported will be skipped as existing accounts.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          {summary.created > 0 && (
            <button type="button" className={secondaryButton} onClick={() => downloadImportResults(result)}>
              Download results again
            </button>
          )}
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              setResult(null);
              setSheet(null);
              setError("");
            }}
          >
            Import another file
          </button>
          <button type="button" className={primaryButton} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  // ---- Step 1: choose a file --------------------------------------------
  if (!sheet) {
    return (
      <div ref={rootRef} className="space-y-5">
        <label
          htmlFor="import-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-blue-400 hover:bg-blue-50/40"
        >
          <span className="font-semibold text-slate-800">
            {reading ? "Reading file..." : "Choose an Excel or CSV file"}
          </span>
          <span className="mt-1 text-sm text-slate-500">
            .xlsx, .xls or .csv · first sheet · header in row 1 · up to {MAX_ROWS} rows
          </span>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            disabled={reading}
            className="sr-only"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="text-sm text-slate-500">
          Any column names work: you'll match them to PeopleDesk fields next. Not sure how to lay the
          sheet out?{" "}
          <button type="button" onClick={downloadImportTemplate} className="font-semibold text-blue-600 hover:underline">
            Download the template
          </button>
          .
        </p>
      </div>
    );
  }

  // ---- Step 2: map columns ----------------------------------------------
  // First data row as it will be imported (dates converted, text trimmed).
  const firstRow = sheet.rows.length ? applyMapping(sheet.XLSX, sheet.rows.slice(0, 1), mapping)[0] : {};

  return (
    <div ref={rootRef} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-slate-600">
          <strong className="text-slate-900">{sheet.fileName}</strong> · sheet “{sheet.sheetName}” ·{" "}
          {sheet.rows.length} row{sheet.rows.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={() => setSheet(null)} className="font-semibold text-blue-600 hover:underline" disabled={importing}>
          Choose a different file
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">PeopleDesk field</th>
              <th className="px-3 py-2">Column in your sheet</th>
              <th className="px-3 py-2">First row</th>
            </tr>
          </thead>
          <tbody>
            {IMPORT_FIELDS.map((field) => {
              const header = mapping[field.key];
              const clash = header && usedTwice.has(header);
              return (
                <tr key={field.key} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2">
                    <label htmlFor={`map-${field.key}`} className="font-medium text-slate-800">
                      {field.header}
                      {field.required && <span className="text-red-600"> *</span>}
                    </label>
                    {field.hint && <div className="text-xs text-slate-500">{field.hint}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      id={`map-${field.key}`}
                      value={header}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={`${selectClass} ${clash ? "border-red-400" : ""}`}
                      disabled={importing}
                    >
                      <option value="">{field.required ? "— Choose a column —" : "— Not in my file —"}</option>
                      {sheet.headers.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {clash && <div className="mt-1 text-xs text-red-600">Used for another field too</div>}
                  </td>
                  <td className="max-w-48 truncate px-3 py-2 text-slate-500">
                    {header ? firstRow[field.key] || "(empty)" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mappedFields.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Preview (first {Math.min(PREVIEW_ROWS, sheet.rows.length)} rows, as they'll be imported)
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500">
                <tr>
                  {mappedFields.map((field) => (
                    <th key={field.key} className="px-3 py-2">{field.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {mappedFields.map((field) => (
                      <td key={field.key} className="px-3 py-2">{row[field.key] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {missingRequired.length > 0 && (
        <p className="text-sm text-amber-700">
          Choose a column for: {missingRequired.map((field) => field.header).join(", ")}.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Importing employees…</span>
            <span>
              {progress.done} of {progress.total} rows ({Math.round((progress.done / progress.total) * 100)}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Import progress"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Valid rows are imported and the rest are listed with the reason. Everyone gets a temporary
        password, delivered in a results file. Admin accounts can't be imported.
      </p>

      <div className="flex justify-end gap-3">
        <button type="button" className={secondaryButton} onClick={onClose} disabled={importing}>
          Cancel
        </button>
        <button type="button" className={primaryButton} onClick={handleImport} disabled={!canImport}>
          {importing ? "Importing..." : `Import ${sheet.rows.length} employee${sheet.rows.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}