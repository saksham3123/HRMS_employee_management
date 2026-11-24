export const planPrice = (plan, billing) =>
  billing === "yearly" ? plan.price_yearly : plan.price_monthly;

// What paying yearly saves against twelve monthly payments (0 when nothing).
export const yearlySaving = (plan) =>
  Math.max(0, plan.price_monthly * 12 - plan.price_yearly);
