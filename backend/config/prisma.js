import "dotenv/config"
import {PrismaClient } from "@prisma/client"
import {PrismaPg} from "@prisma/adapter-pg"

// TimeZone=UTC: the pg adapter sends JS Dates as UTC wall-clock text with no
// offset, which PostgreSQL would otherwise read in the server's own zone
// (e.g. Asia/Calcutta), storing times 5h30 early. The company's calendar
// day is handled in config/time.js.
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    options: "-c TimeZone=UTC",
});

const prisma = new PrismaClient({ adapter });

export default prisma;