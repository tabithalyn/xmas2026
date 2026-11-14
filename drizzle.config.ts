import { config } from "dotenv";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

config();

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error("DATABASE_URL_UNPOOLED is missing");
}

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./db/schema.ts",
    "./db/auth-schema.ts"
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});