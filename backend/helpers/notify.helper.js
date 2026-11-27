import prisma from "../config/prisma.js";
import { isMailEnabled, sendMail } from "../config/mailer.js";
import { welcomeEmail } from "./emailTemplates.js";

// Emails that PeopleDesk sends when something happens. Callers don't await
// these: the request answers straight away and the email goes out in the
// background. sendMail never throws, so a failed email can't break anything.

// Company name and its login page (/cybersigma/login).
const getCompany = async (organizationId) => {
    const organization = await prisma.organizations.findUnique({
        where: { id: organizationId },
        select: { name: true, slug: true },
    });
    const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

    return {
        name: organization?.name ?? "your company",
        loginUrl: organization ? `${frontend}/${organization.slug}/login` : `${frontend}/login`,
    };
};

// people: [{ name, email, password }]
// Sends one after another (Gmail allows only a few connections at a time).
export const sendWelcomeEmails = async (organizationId, people) => {
    if (!people.length || !isMailEnabled()) return;

    try {
        const company = await getCompany(organizationId);
        let sent = 0;

        for (const person of people) {
            const ok = await sendMail({
                to: person.email,
                ...welcomeEmail({
                    name: person.name,
                    email: person.email,
                    password: person.password,
                    companyName: company.name,
                    loginUrl: company.loginUrl,
                }),
            });
            if (ok) sent += 1;
        }

        console.log(`Welcome emails: ${sent} of ${people.length} sent for organization ${organizationId}`);
    } catch (error) {
        console.error("Welcome emails failed:", error.message);
    }
};