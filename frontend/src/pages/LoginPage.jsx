import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import { getPublicOrganization } from "../services/publicService";

// /login is the general sign-in; /<slug>/login is a company's own page,
// showing its name and signing in only its users.
export default function LoginPage() {
  const { slug } = useParams();
  // { slug, organization } — tagged with its slug so a result never shows
  // under a different company's address.
  const [lookup, setLookup] = useState(null);
  const current = slug && lookup?.slug === slug ? lookup : null;
  const company = current?.organization ?? null;
  const notFound = Boolean(current) && !company;

  useEffect(() => {
    if (!slug) return undefined;

    let ignore = false;

    getPublicOrganization(slug)
      .then((organization) => {
        if (!ignore) setLookup({ slug, organization });
      })
      // Couldn't reach the server: keep the general header, the form still works.
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <div className="pd-auth flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        {notFound ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Company not found
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              No company uses the address “{slug}”. Check the link your admin sent you.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
              Go to the general sign-in
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                {(company?.name ?? "A").slice(0, 1).toUpperCase()}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {company?.name ?? "Attendance Portal"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to manage your attendance and work hours
              </p>
            </div>

            {/* Login form */}
            <LoginForm slug={slug} />

            <p className="mt-8 text-center text-xs text-slate-400">
              Secure employee attendance management
            </p>
          </>
        )}
      </div>
    </div>
  );
}
