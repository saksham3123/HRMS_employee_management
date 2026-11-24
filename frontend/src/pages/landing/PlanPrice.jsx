import { formatRupees } from "../../services/publicService";
import { planPrice } from "./planMath";

export function PriceLine({ plan, billing }) {
  const price = planPrice(plan, billing);

  if (price === 0) {
    return (
      <p className="pd-price">
        <strong>Free</strong>
      </p>
    );
  }

  return (
    <p className="pd-price">
      <strong>{formatRupees(price)}</strong>
      <span>/{billing === "yearly" ? "year" : "month"}</span>
    </p>
  );
}
