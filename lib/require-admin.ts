import { headers } from "next/headers";
import { auth } from "./auth";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return false;

  return (
    session.user.email.toLowerCase() ===
    process.env.ADMIN_EMAIL?.toLowerCase()
  );
}