// Reset a company user's password (local/dev use).
//
//   node scripts/resetPassword.js <email> <new-password>
//
// Works for any company user (not platform admins). The password must be at
// least 8 characters, the same rule as account creation.
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/resetPassword.js <email> <new-password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("The password must be at least 8 characters.");
  process.exit(1);
}

try {
  const user = await prisma.users.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true, email: true, is_active: true, organization: { select: { name: true } } },
  });

  if (!user) {
    console.error(`No user with the email ${email}.`);
    process.exitCode = 1;
  } else {
    await prisma.users.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 10), updated_at: new Date() },
    });

    console.log(`Password reset for ${user.email} (${user.organization.name}).`);
    if (!user.is_active) {
      console.log("Note: this account is deactivated, so it still can't log in.");
    }
  }
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
