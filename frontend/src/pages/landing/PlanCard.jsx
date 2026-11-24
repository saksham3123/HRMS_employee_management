import { Link } from "react-router-dom";
import { formatRupees } from "../../services/publicService";
import { PriceLine } from "./PlanPrice";
import { yearlySaving } from "./planMath";

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PlanCard({ plan, billing }) {
  const saving = billing === "yearly" ? yearlySaving(plan) : 0;
  const isFree = plan.price_monthly === 0 && plan.price_yearly === 0;

  return (
    <article className={`pd-plan ${plan.is_featured ? "is-featured" : ""}`} aria-labelledby={`plan-${plan.code}`}>
      <div className="pd-plan-top">
        <h3 id={`plan-${plan.code}`}>{plan.name}</h3>
        {plan.is_featured && <span className="pd-plan-badge">Recommended</span>}
      </div>
      {plan.description && <p className="pd-plan-desc">{plan.description}</p>}
      <PriceLine plan={plan} billing={billing} />
      <p className="pd-plan-note">
        {saving > 0
          ? `Save ${formatRupees(saving)} a year`
          : plan.max_employees
            ? `Up to ${plan.max_employees} employees`
            : "Unlimited employees"}
      </p>

      <ul className="pd-plan-features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        to={`/get-started/${plan.code}?billing=${billing}`}
        className={`pd-btn ${plan.is_featured ? "is-light" : "is-dark"} is-block`}
      >
        {isFree ? "Start free" : `Choose ${plan.name}`}
      </Link>
    </article>
  );
}
