export default function TodaySummary({ attendance }) {
  const workingHours =
  attendance?.working_hours ?? attendance?.workingHours ?? 0;

const dailyPay =
  attendance?.daily_pay ?? attendance?.dailyPay ?? 0;

  let status = "Not clocked in";

  const loginTime = attendance?.login_time ?? attendance?.loginTime;
const logoutTime = attendance?.logout_time ?? attendance?.logoutTime;

if (loginTime && !logoutTime) {
  status = "Currently working";
} else if (loginTime && logoutTime) {
  status = "Shift completed";
}

  const cards = [
    {
      title: "Today's Status",
      value: status,
      description: "Your attendance status",
    },
    {
      title: "Working Hours",
      value: `${Number(workingHours).toFixed(2)} hrs`,
      description: "Hours worked today",
    },
    {
      title: "Today's Earnings",
      value: `₹${Number(dailyPay).toFixed(2)}`,
      description: "Calculated from working hours",
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

          <p className="mt-4 text-2xl font-bold text-slate-900">
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