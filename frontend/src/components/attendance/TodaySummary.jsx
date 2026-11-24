import { formatClockTime, hoursWorked, payEarned, useNow } from "../../utils/workTime";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export default function TodaySummary({ attendance }) {
  // Re-render every 30 seconds so hours and pay count up while working.
  const now = useNow(30_000);

  const loginTime = attendance?.login_time ?? attendance?.loginTime;
  const logoutTime = attendance?.logout_time ?? attendance?.logoutTime;
  const working = Boolean(loginTime && !logoutTime);

  let status = "Not clocked in";
  if (working) status = "Currently working";
  else if (loginTime && logoutTime) status = "Shift completed";

  const cards = [
    {
      title: "Today's status",
      value: status,
      description: loginTime
        ? `In ${formatClockTime(loginTime)}${logoutTime ? ` · Out ${formatClockTime(logoutTime)}` : ""}`
        : "Clock in when you start work",
    },
    {
      title: "Working hours",
      value: `${hoursWorked(attendance, now).toFixed(2)} hrs`,
      description: working ? "So far today, updating live" : "Hours worked today",
    },
    {
      title: "Today's earnings",
      value: formatMoney(payEarned(attendance, now)),
      description: working ? "So far, at your hourly rate" : "Calculated from working hours",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">
            {card.title}
          </p>

          <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900">
            {card.value}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {card.description}
          </p>
        </div>
      ))}
    </section>
  );
}
