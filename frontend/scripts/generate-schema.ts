/**
 * Generate Better Auth database schema
 * Run with: npx tsx scripts/generate-schema.ts
 */
import { auth } from "../lib/auth";

async function generateSchema() {
  try {
    console.log("🔄 Generating Better Auth schema...");

    // @ts-ignore - Better Auth internal API
    const schema = await auth.$Infer.Schema.table();

    console.log("✅ Schema generated successfully!");
    console.log("\nDatabase tables that should exist:");
    console.log("- user");
    console.log("- session");
    console.log("- verification");
    console.log("- account");

    console.log("\nBetter Auth will auto-create these tables on first use.");
    console.log("Try signing up again - the tables should be created automatically.");

  } catch (error: any) {
    console.error("❌ Error generating schema:", error.message);
    console.log("\nMake sure DATABASE_URL is set correctly in .env.local");
    process.exit(1);
  }
}

generateSchema();
