// Dates and times.
//
// The database session runs in UTC (see config/prisma.js) so that every
// timestamp the app writes is stored as the right instant. The working day
// ("today" for attendance, joining dates, reporting lines) is still the
// company's local calendar day, taken in APP_TIMEZONE.
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

// Today's date in APP_TIMEZONE as "YYYY-MM-DD", read from the database
// clock so it doesn't depend on the Node server's own clock or timezone.
export const getTodayText = async (db) => {
  const [{ today }] = await db.$queryRaw`
    SELECT (now() AT TIME ZONE ${APP_TIMEZONE})::date::text AS today`;
  return today;
};

// The same day as a UTC-midnight Date, the shape Prisma uses for @db.Date.
export const getToday = async (db) =>
  new Date(`${await getTodayText(db)}T00:00:00.000Z`);
