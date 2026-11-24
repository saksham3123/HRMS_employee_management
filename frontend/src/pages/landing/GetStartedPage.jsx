import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getPublicPlans, formatRupees } from "../../services/publicService";
import { startCheckout } from "../../services/checkoutService";
import { PriceLine } from "./PlanPrice";
import { planPrice, yearlySaving } from "./planMath";
import "./Landing.css";

// "Acme Labs Pvt Ltd" -> "acme-labs-pvt-ltd"
const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const emptyForm = {
  companyName: "",
  slug: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function GetStartedPage() {
  const { planCode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const billing = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";

  const [plans, setPlans] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Get started · PeopleDesk";
    getPublicPlans()
      .then(setPlans)
      .catch((err) => setLoadError(err.message));
  }, []);

  const plan = useMemo(
    () => plans?.find((option) => option.code === planCode) ?? null,
    [plans, planCode]
  );

  const setBilling = (value) => setSearchParams({ billing: value }, { replace: true });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "companyName" && !slugEdited) next.slug = toSlug(value);
      return next;
    });
    if (name === "slug") setSlugEdited(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await startCheckout({
        plan: plan.code,
        billing,
        amount: planPrice(plan, billing),
        company: { name: form.companyName.trim(), slug: form.slug.trim() },
        admin: {
          name: form.adminName.trim(),
          email: form.adminEmail.trim().toLowerCase(),
          password: form.adminPassword,
        },
      });
    } catch (err) {
      setError(err.message || "Checkout couldn't start. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const price = plan ? planPrice(plan, billing) : 0;

  return (
    <div className="pd-landing">
      <header className="pd-nav">
        <Link to="/" className="pd-wordmark" aria-label="PeopleDesk home">
          people<span>desk</span>
        </Link>
        <nav aria-label="Main">
          <Link to="/#plans">All plans</Link>
          <Link to="/login">Log in</Link>
        </nav>
      </header>

      <main className="pd-checkout">
        {loadError ? (
          <p className="pd-plans-status" role="alert">{loadError}</p>
        ) : !plans ? (
          <p className="pd-plans-status">Loading plan…</p>
        ) : !plan ? (
          <div className="pd-checkout-missing">
            <h1>That plan isn't on offer</h1>
            <p>It may have been renamed or retired.</p>
            <Link to="/#plans" className="pd-btn is-dark">See current plans</Link>
          </div>
        ) : (
          <>
            <div className="pd-checkout-head">
              <h1>Set up your company</h1>
              <p>
                You'll be the first admin. Once it's set up, you add HR, managers
                and employees from inside PeopleDesk.
              </p>
            </div>

            <div className="pd-checkout-grid">
              <form className="pd-form" onSubmit={handleSubmit}>
                <fieldset>
                  <legend>Company</legend>
                  <label htmlFor="gs-company">Company name</label>
                  <input id="gs-company" name="companyName" value={form.companyName} onChange={handleChange} required maxLength={150} autoComplete="organization" />

                  <label htmlFor="gs-slug">Workspace ID</label>
                  <input
                    id="gs-slug"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    required
                    minLength={3}
                    maxLength={60}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    title="Lowercase letters, numbers and single hyphens"
                    aria-describedby="gs-slug-hint"
                  />
                  <p id="gs-slug-hint" className="pd-hint">
                    Lowercase letters, numbers and hyphens. It identifies your company on PeopleDesk.
                  </p>
                </fieldset>

                <fieldset>
                  <legend>Your admin account</legend>
                  <label htmlFor="gs-name">Full name</label>
                  <input id="gs-name" name="adminName" value={form.adminName} onChange={handleChange} required maxLength={150} autoComplete="name" />

                  <label htmlFor="gs-email">Work email</label>
                  <input id="gs-email" name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} required autoComplete="email" />

                  <label htmlFor="gs-password">Password</label>
                  <input id="gs-password" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} required minLength={8} autoComplete="new-password" aria-describedby="gs-password-hint" />
                  <p id="gs-password-hint" className="pd-hint">At least 8 characters.</p>
                </fieldset>

                {error && (
                  <p className="pd-form-error" role="alert">{error}</p>
                )}

                <button type="submit" className="pd-btn is-dark is-block" disabled={submitting}>
                  {submitting
                    ? "Starting checkout…"
                    : price === 0
                      ? "Create my company"
                      : `Continue to payment · ${formatRupees(price)}`}
                </button>
              </form>

              <aside className="pd-summary" aria-labelledby="gs-summary-title">
                <h2 id="gs-summary-title">{plan.name} plan</h2>
                {plan.description && <p className="pd-plan-desc">{plan.description}</p>}

                <div className="pd-billing" role="group" aria-label="Billing period">
                  <button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>Monthly</button>
                  <button type="button" aria-pressed={billing === "yearly"} onClick={() => setBilling("yearly")}>Yearly</button>
                </div>

                <PriceLine plan={plan} billing={billing} />
                {billing === "yearly" && yearlySaving(plan) > 0 && (
                  <p className="pd-plan-note">Save {formatRupees(yearlySaving(plan))} a year</p>
                )}

                <ul className="pd-plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link to="/#plans" className="pd-link">Change plan</Link>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
