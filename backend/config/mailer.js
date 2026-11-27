import nodemailer from "nodemailer";

// Email sending (SMTP). Settings come from .env:
//
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_USER=yourcompany@gmail.com
//   SMTP_PASS=abcdefghijklmnop        <- Gmail App Password, not your login password
//   MAIL_FROM="PeopleDesk <yourcompany@gmail.com>"
//
// If SMTP_* isn't set, emails are skipped with a warning and the app keeps
// working, so a missing mail setup never breaks login, imports or leave.

let transporter; // created on first use, after .env has been loaded

const getTransporter = () => {
    if (transporter !== undefined) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn("Email is off: set SMTP_HOST, SMTP_USER and SMTP_PASS in .env to turn it on.");
        transporter = null;
        return transporter;
    }

    const port = Number(SMTP_PORT) || 465;

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465, // 465 = TLS from the start; 587 = upgrades with STARTTLS
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        // Reuse a few connections instead of logging in for every email
        // (matters when an Excel import sends many welcome emails).
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
    });

    return transporter;
};

export const isMailEnabled = () => getTransporter() !== null;

// Checks the SMTP login once at startup and logs the result.
export const verifyMailer = async () => {
    const mailer = getTransporter();
    if (!mailer) return false;

    try {
        await mailer.verify();
        console.log(`Email ready (${process.env.SMTP_USER})`);
        return true;
    } catch (error) {
        console.error("Email setup failed:", error.message);
        return false;
    }
};

// Sends one email. Never throws: a failed email is logged, and the caller
// carries on (an employee is still created even if their welcome email fails).
// Returns true if the email was accepted by the SMTP server.
export const sendMail = async ({ to, subject, text, html }) => {
    const mailer = getTransporter();
    if (!mailer) return false;

    try {
        await mailer.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html,
        });
        return true;
    } catch (error) {
        console.error(`Email to ${to} failed:`, error.message);
        return false;
    }
};