import { useCallback, useEffect, useState } from "react";

import AdminAttendanceOverview from "../components/attendance/AdminAttendanceOverview";
import EmployeeList from "../components/admin/EmployeeList";
import CreateEmployeeForm from "../components/admin/CreateEmployeeForm";
import MonthlyReport from "../components/admin/MonthlyReport";
import MonthlyPayrollTable from "../components/admin/MonthlyPayrollTable";
import Sidebar from "../components/common/Sidebar";
import { useLocation, useNavigate } from "react-router-dom";

import {
    getAllEmployees,
    createEmployee,
    deleteEmployee,
    getTodayAttendanceForAdmin,
    getMonthlyPayrollSummary
} from "../services/adminService";

export default function AdminDashboard() {


    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = location.pathname === "/admin/employees"
        ? "employees"
        : location.pathname === "/admin/attendance-payroll"
            ? "attendance"
            : "overview";



    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(true);
    const [monthlyPayroll, setMonthlyPayroll] = useState(null);
    const [payrollLoading, setPayrollLoading] = useState(true);
    const [attendanceError, setAttendanceError] = useState("");



    const fetchEmployees = useCallback(async () => {



        setLoading(true);
        setError("");

        try {
            const data = await getAllEmployees();
            setEmployees(data.users ?? []);
        } catch (err) {
            setError(err.message || "Failed to load employees.");
        } finally {
            setLoading(false);
        }
    }, []);


    const fetchMonthlyPayroll = useCallback(async () => {
        try {
            setPayrollLoading(true);

            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const data = await getMonthlyPayrollSummary(month, year);
            setMonthlyPayroll(data);
        } catch (err) {
            console.error("Failed to fetch monthly payroll:", err);
        } finally {
            setPayrollLoading(false);
        }
    }, []);






    const handleCreateEmployee = async (employeeData) => {
        setCreating(true);
        setError("");
        setSuccess("");

        try {
            await createEmployee(employeeData);
            setSuccess("Employee created successfully.");
            await fetchEmployees();
        } catch (err) {
            setError(err.message || "Failed to create employee.");
            throw err;
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteEmployee = async (userId) => {
        setDeletingId(userId);
        setError("");
        setSuccess("");

        try {
            await deleteEmployee(userId);
            setSuccess("Employee deleted successfully.");
            await fetchEmployees();
        } catch (err) {
            setError(err.message || "Failed to delete employee.");
        } finally {
            setDeletingId(null);
        }
    };



    const fetchTodayAttendance = useCallback(async () => {
        try {
            setTodayAttendanceLoading(true);
            setAttendanceError("");

            const data = await getTodayAttendanceForAdmin();
            setTodayAttendance(data.attendance ?? []);
        } catch (err) {
            setAttendanceError(
                err.message || "Failed to load today's attendance."
            );
        } finally {
            setTodayAttendanceLoading(false);
        }
    }, []);



    useEffect(() => {
        fetchEmployees();
        fetchTodayAttendance();
        fetchMonthlyPayroll();

        const intervalId = setInterval(() => {
            fetchTodayAttendance();
            fetchMonthlyPayroll();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [
        fetchEmployees,
        fetchTodayAttendance,
        fetchMonthlyPayroll,
    ]);


    const employeeCount = employees.filter(
        (employee) =>
            employee.roles?.some(
                (role) => role.toLowerCase() === "employee"
            )
    ).length;


    return (
        <div className="min-h-screen bg-slate-100 lg:flex">


            <div className="flex min-h-screen bg-slate-100">
                <Sidebar />






                <main className="min-w-0 flex-1 p-5 sm:p-8">
                    <header className="mb-8">
                        <p className="text-sm font-medium text-blue-600">
                            ADMINISTRATION
                        </p>
                        <h2 className="mt-2 text-3xl font-bold text-slate-900">
                            {activeTab === "overview"
                                ? "Dashboard Overview"
                                : activeTab === "employees"
                                    ? "Employee Management"
                                    : "Attendance & Payroll"}
                        </h2>
                        <p className="mt-2 text-slate-500">
                            Manage employees, monitor attendance, and review payroll.
                        </p>
                    </header>

                    {error && (
                        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                            {success}
                        </p>
                    )}

                    {activeTab === "overview" && (
                        <>
                            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm font-medium text-slate-500">
                                        Total Employees
                                    </p>
                                    <p className="mt-4 text-3xl font-bold text-slate-900">
                                        {loading ? "…" : employeeCount}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Registered employee accounts
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm font-medium text-slate-500">
                                        Present Today
                                    </p>
                                    <p className="mt-4 text-3xl font-bold text-slate-900">{todayAttendanceLoading ? "..." : todayAttendance.length}</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Attendance records created today
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm font-medium text-slate-500">
                                        Monthly Payroll
                                    </p>
                                    <p className="mt-4 text-3xl font-bold text-slate-900">{payrollLoading
                                        ? "..."
                                        : `₹${(monthlyPayroll?.totalPayroll ?? 0).toLocaleString("en-IN", {
                                            maximumFractionDigits: 2,
                                        })}`}</p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Payroll accrued in the current month
                                    </p>
                                </div>
                            </section>

                            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Quick Actions
                                </h3>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => navigate("/admin/employees")}
                                        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Manage Employees
                                    </button>
                                    <button
                                        onClick={() => navigate("/admin/attendance-payroll")}
                                        className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        View Attendance & Payroll
                                    </button>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === "employees" && (
                        <div className="space-y-8">
                            <CreateEmployeeForm
                                onCreate={handleCreateEmployee}
                                creating={creating}
                            />

                            <EmployeeList
                                employees={employees}
                                loading={loading}
                                onDelete={handleDeleteEmployee}
                                deletingId={deletingId}
                            />
                        </div>
                    )}


                    {/* <p>employees={employees}</p> */}

                    {activeTab === "attendance" && (
                        <div className="space-y-8">
                            <AdminAttendanceOverview
                                records={todayAttendance}
                                loading={todayAttendanceLoading}
                                error={attendanceError}

                            />

                            <MonthlyPayrollTable />


                            <MonthlyReport employees={employees} />
                        </div>
                    )}


                </main>
            </div>
        </div>
    );
}
