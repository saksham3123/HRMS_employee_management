import "dotenv/config";
import { sendMail, verifyMailer } from "../config/mailer.js";

// Sends one test email to check the SMTP settings in .env.
//   node scripts/testMail.js you@example.com

const to = process.argv[2];

if (!to) {
    console.log("Usage: node scripts/testMail.js you@example.com");
    process.exit(1);
}

if (!(await verifyMailer())) {
    console.log("Fix the SMTP settings in .env and try again.");
    process.exit(1);
}

const sent = await sendMail({
    to,
    subject: "PeopleDesk test email",
    text: "If you can read this, PeopleDesk can send email.",
    html: "<p>If you can read this, <strong>PeopleDesk</strong> can send email.</p>",
});

console.log(sent ? `Test email sent to ${to}. Check the inbox (and spam).` : "Sending failed: see the error above.");
process.exit(sent ? 0 : 1);