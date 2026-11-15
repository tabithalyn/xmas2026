import { headers } from "next/headers";
import { auth } from "./auth";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.log("[requireAdmin] No authenticated session");
    return false;
  };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session.user.email?.trim().toLowerCase();

  if (!adminEmail) {
    console.error("[requireAdmin] ADMIN_EMAIL is not configured");
    return false;
  }

  console.log("[AUTH CHECK] Session found:", true);
  console.log("[AUTH CHECK] Admin email configured:", !!adminEmail);
  console.log("[AUTH CHECK] Email matches:", !!adminEmail && userEmail === adminEmail);

  const isAdmin = userEmail === adminEmail;

  if (!isAdmin) {
    console.log("[requireAdmin] Authenticated user is not the administrator.");
  }

  return isAdmin;
}