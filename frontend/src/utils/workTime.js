import { useEffect, useState } from "react";

// Hours worked on an attendance record. Closed records use the hours the
// server saved at clock-out; an open record counts from clock-in to `now`,
// so the figure is live while someone is working.
export const hoursWorked = (record, now = Date.now()) => {
  const login = record?.login_time ?? record?.loginTime;
  const logout = record?.logout_time ?? record?.logoutTime;
  if (!login) return 0;
  if (logout) return Number(record.working_hours ?? record.workingHours ?? 0);
  return Math.max(0, (now - new Date(login).getTime()) / 3_600_000);
};

// Pay for the same period, at the hourly rate saved on the record.
export const payEarned = (record, now = Date.now()) => {
  const logout = record?.logout_time ?? record?.logoutTime;
  if (logout) return Number(record.daily_pay ?? record.dailyPay ?? 0);
  return hoursWorked(record, now) * Number(record?.hourly_rate ?? record?.hourlyRate ?? 0);
};

export const formatClockTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

// The current time, refreshed every `intervalMs` (default one minute).
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
