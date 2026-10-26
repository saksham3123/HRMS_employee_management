
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navigationByRole = {
    admin: [
        { label: "Overview", path: "/admin", icon: "▦" },
        { label: "Employees", path: "/admin/employees", icon: "♙" },
        {
            label: "Attendance & Payroll",
            path: "/admin/attendance-payroll",
            icon: "◷",
        },
    ],


   employee: [
    { label: "Dashboard", path: "/user", icon: "▦" },
    { label: "My Profile", path: "/user/profile", icon: "♙" },
    ],

};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const isAdmin = user.role === "admin";
    const navigation = navigationByRole[user.role] ?? [];

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isOpen}
                className="fixed left-4 top-4 z-50 rounded-lg bg-slate-900 p-3 text-white shadow-lg lg:hidden"
            >
                {isOpen ? (
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Backdrop on mobile */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                />
            )}

            {/* Shared sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex min-h-screen w-64 flex-col bg-slate-900 text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="border-b border-slate-700 px-6 py-6">
                    <h1 className="text-xl font-bold">Attendance Portal</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        {isAdmin ? "Administration" : "Employee Portal"}
                    </p>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/admin" || item.path === "/user"}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`
                            }
                        >
                            <span aria-hidden="true">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-slate-700 p-4">
                    <p className="font-semibold">{user.name || "User"}</p>
                    <p className="truncate text-sm text-slate-400">{user.email}</p>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-5 w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium hover:bg-slate-800"
                    >
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    );
}
