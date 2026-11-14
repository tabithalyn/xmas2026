
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL is missing from .env");
  }

  if (!password || password.length < 12 || password.length > 128) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD must be between 12 and 128 characters"
    );
  }

  // Import only after loading environment variables.
  const { auth } = await import("../lib/auth");

  const result = await auth.api.signUpEmail({
    body: {
      name: "Wishlist Administrator",
      email,
      password,
    },
  });

  console.log("Administrator account created successfully.");
  console.log(`Email: ${result.user.email}`);
}

main().catch((error) => {
  console.error("Administrator creation failed:");
  console.error(error);
  process.exitCode = 1;
});
