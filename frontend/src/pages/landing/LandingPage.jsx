import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ProductFrame from "./ProductFrame";
import PlanCard from "./PlanCard";
import { getPublicPlans } from "../../services/publicService";
import "./Landing.css";

// Everything here is something PeopleDesk does today.
const FEATURES = [
  {
    title: "Attendance and pay",
    text: "People clock in and out once a day. Hours and daily pay are worked out from those times and the hourly rate saved on each record.",
  },
  {
    title: "Leave",
    text: "Annual, sick and personal leave, with overlapping requests blocked. Managers decide for their own team; HR sees the whole company.",
  },
  {
    title: "People records",
    text: "Employees, departments, designations and roles in one list. Deactivating someone takes their access away immediately.",
  },
  {
    title: "Reporting lines",
    text: "Give each person a manager. PeopleDesk refuses any change that would make a reporting chain loop back on itself.",
  },
  {
    title: "Payroll summaries",
    text: "Monthly totals and per-employee reports built straight from attendance, ready for your payroll run.",
  },
  {
    title: "Permissions that hold",
    text: "Every action is checked on the server against the person's role, so a hidden button is never the only thing standing in the way.",
  },
];

function Wordmark() {
  return (
    <Link to="/" className="pd-wordmark" aria-label="PeopleDesk home">
      people<span>desk</span>
    </Link>
  );
}

export default function LandingPage() {
  const [plans, setPlans] = useState([]);
  const [plansState, setPlansState] = useState("loading");
  const [billing, setBilling] = useState("monthly");
  const { hash } = useLocation();

  const loadPlans = () => {
    getPublicPlans()
      .then((list) => {
        setPlans(list);
        setPlansState("ready");
      })
      .catch(() => setPlansState("error"));
  };

  useEffect(() => {
    document.title = "PeopleDesk · HR for attendance, leave and payroll";
    loadPlans();
  }, []);

  // Arriving from another page at /#plans: scroll once the plans are drawn.
  useEffect(() => {
    if (hash && plansState !== "loading") {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    }
  }, [hash, plansState]);

  return (
    <div className="pd-landing">
      <a href="#main" className="pd-skip">Skip to content</a>

      <header className="pd-nav">
        <Wordmark />
        <nav aria-label="Main">
          <a href="#features">Features</a>
          <a href="#plans">Plans</a>
          <Link to="/login" className="pd-btn is-dark is-small">Log in</Link>
        </nav>
      </header>

      <main id="main">
        <section className="pd-hero" aria-labelledby="pd-hero-title">
          <h1 id="pd-hero-title">
            Less admin. <span>More people.</span>
          </h1>
          <p className="pd-hero-sub">
            Attendance, leave, people and payroll for your whole company, with
            every role seeing exactly the part that's theirs.
          </p>
          <div className="pd-hero-actions">
            <a href="#plans" className="pd-btn is-dark">See plans</a>
            <Link to="/login" className="pd-link">Log in to your company →</Link>
          </div>

          <ProductFrame />
        </section>

        <section id="features" className="pd-features" aria-labelledby="pd-features-title">
          <div className="pd-features-intro">
            <h2 id="pd-features-title">What PeopleDesk runs</h2>
            <p>
              One set of records for the company. Admins set it up, HR keeps it
              current, managers act for their team and everyone else serves
              themselves.
            </p>
          </div>
          <dl className="pd-feature-list">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="pd-feature">
                <dt>{feature.title}</dt>
                <dd>{feature.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="pd-roles" aria-labelledby="pd-roles-title">
          <h2 id="pd-roles-title">Four roles, one company</h2>
          <ol className="pd-role-list">
            <li>
              <h3>Admin</h3>
              <p>Sets up the company: accounts, roles, departments, designations and who reports to whom.</p>
            </li>
            <li>
              <h3>HR</h3>
              <p>Keeps people records current, reviews every leave request and closes the month's payroll.</p>
            </li>
            <li>
              <h3>Manager</h3>
              <p>Sees their direct reports and approves or rejects their team's leave.</p>
            </li>
            <li>
              <h3>Employee</h3>
              <p>Clocks in and out, applies for leave and checks their own history.</p>
            </li>
          </ol>
          <p className="pd-roles-note">
            Each company's records are kept separate from every other company on PeopleDesk.
          </p>
        </section>

        <section id="plans" className="pd-plans" aria-labelledby="pd-plans-title">
          <div className="pd-plans-head">
            <div>
              <h2 id="pd-plans-title">Plans</h2>
              <p>Pick the size that fits today. You can move plans later.</p>
            </div>
            <div className="pd-billing" role="group" aria-label="Billing period">
              <button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>
                Monthly
              </button>
              <button type="button" aria-pressed={billing === "yearly"} onClick={() => setBilling("yearly")}>
                Yearly
              </button>
            </div>
          </div>

          {plansState === "loading" && <p className="pd-plans-status">Loading plans…</p>}
          {plansState === "error" && (
            <p className="pd-plans-status" role="alert">
              Plans couldn't be loaded.{" "}
              <button
                type="button"
                className="pd-link"
                onClick={() => {
                  setPlansState("loading");
                  loadPlans();
                }}
              >
                Try again
              </button>
            </p>
          )}
          {plansState === "ready" && plans.length === 0 && (
            <p className="pd-plans-status">No plans are on offer right now.</p>
          )}
          {plansState === "ready" && plans.length > 0 && (
            <div className="pd-plan-grid">
              {plans.map((plan) => (
                <PlanCard key={plan.code} plan={plan} billing={billing} />
              ))}
            </div>
          )}
        </section>

        <section className="pd-close" aria-labelledby="pd-close-title">
          <h2 id="pd-close-title">Bring your company's HR into one place.</h2>
          <a href="#plans" className="pd-btn is-light">Choose a plan</a>
        </section>
      </main>

      <footer className="pd-footer">
        <Wordmark />
        <nav aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#plans">Plans</a>
          <Link to="/login">Log in</Link>
        </nav>
        <p>© {new Date().getFullYear()} PeopleDesk</p>
      </footer>
    </div>
  );
}
