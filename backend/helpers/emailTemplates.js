// HTML + plain-text emails. Every email has both: the HTML for normal mail
// apps, the text for apps that block HTML (and it helps keep out of spam).

// Names and company names come from users and spreadsheets, so they must be
// escaped before going into HTML (a name like "<script>" stays plain text).
export const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

// Shared frame: simple table layout with inline styles, which is what
// Gmail and Outlook render reliably.
const layout = ({ heading, bodyHtml, companyName }) => `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${escapeHtml(companyName)} · PeopleDesk</p>
          <h1 style="margin:0 0 20px;font-size:22px;">${heading}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">This is an automatic email from PeopleDesk. Please don't reply to it.</p>
    </td></tr>
  </table>
</body>
</html>`;

const button = (url, label) =>
    `<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block;">${escapeHtml(label)}</a></p>`;

// Welcome email for a new employee (added by an admin or imported from Excel).
export const welcomeEmail = ({ name, companyName, email, password, loginUrl }) => ({
    subject: `Welcome to ${companyName} on PeopleDesk`,
    text: [
        `Hi ${name},`,
        "",
        `An account has been created for you at ${companyName} on PeopleDesk, where you can mark attendance, apply for leave and see your details.`,
        "",
        `Sign in: ${loginUrl}`,
        `Email: ${email}`,
        `Temporary password: ${password}`,
        "",
        "Keep this password private. If you didn't expect this email, contact your HR team.",
    ].join("\n"),
    html: layout({
        companyName,
        heading: `Welcome, ${escapeHtml(name)}!`,
        bodyHtml: `
          <p style="margin:0 0 16px;line-height:1.5;">An account has been created for you at <strong>${escapeHtml(companyName)}</strong> on PeopleDesk, where you can mark attendance, apply for leave and see your details.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;width:100%;">
            <tr><td style="padding:4px 0;color:#64748b;width:170px;padding-right:12px;">Email</td><td style="padding:4px 0;"><strong>${escapeHtml(email)}</strong></td></tr>
            <tr><td style="padding:4px 0;color:#64748b;">Temporary password</td><td style="padding:4px 0;font-family:Consolas,monospace;font-size:15px;"><strong>${escapeHtml(password)}</strong></td></tr>
          </table>
          ${button(loginUrl, "Sign in to PeopleDesk")}
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Keep this password private. If you didn't expect this email, contact your HR team.</p>`,
    }),
});