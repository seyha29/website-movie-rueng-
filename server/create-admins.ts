import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import ws from "ws";
import bcrypt from "bcrypt";

neonConfig.webSocketConstructor = ws;

async function createAdminAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Hash password for admin users (Samnang@@##5678)
  const hashedPassword = await bcrypt.hash("Samnang@@##5678", 10);

  // Define 3 admin accounts
  const adminAccounts = [
    {
      fullName: "Admin User 1",
      phoneNumber: "+85599999999",
      password: hashedPassword,
      isAdmin: 1
    },
    {
      fullName: "Admin User 2",
      phoneNumber: "+85599999998",
      password: hashedPassword,
      isAdmin: 1
    },
    {
      fullName: "Admin User 3",
      phoneNumber: "+85599999997",
      password: hashedPassword,
      isAdmin: 1
    }
  ];

  // Delete existing users with these phone numbers (if any)
  for (const admin of adminAccounts) {
    await db.delete(users).where(eq(users.phoneNumber, admin.phoneNumber));
    console.log(`Deleted existing user: ${admin.phoneNumber}`);
  }

  // Create new admin accounts
  for (const adminData of adminAccounts) {
    await db.insert(users).values(adminData);
    console.log(`✓ Admin user created: ${adminData.phoneNumber}`);
  }

  console.log("\n✓ All 3 admin accounts created successfully!");
  console.log("Phone numbers: 099999999, 099999998, 099999997");
  console.log("Auto-redirect to /admin on login");

  await pool.end();
  process.exit(0);
}

createAdminAccounts().catch((error) => {
  console.error("Error creating admin accounts:", error);
  process.exit(1);
});
