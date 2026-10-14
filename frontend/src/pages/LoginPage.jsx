import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            A
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance Portal
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your attendance and work hours
          </p>
        </div>

        {/* Login form */}
        <LoginForm />

        <p className="mt-8 text-center text-xs text-slate-400">
          Secure employee attendance management
        </p>
      </div>
    </div>
  );
}
