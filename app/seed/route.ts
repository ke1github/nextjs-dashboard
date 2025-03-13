import bcrypt from "bcryptjs";
import postgres from "postgres";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";

// Ensure POSTGRES_URL is defined
if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is not defined");
}

// Increase the idle timeout to 60 seconds (60000 milliseconds)
const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
  idle_timeout: 60000,
});

async function seedUsers() {
  console.log("Seeding users...");
  await sql`SET statement_timeout = 60000`;
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  console.log("Users seeded successfully.");
  return insertedUsers;
}

async function seedInvoices() {
  console.log("Seeding invoices...");
  await sql`SET statement_timeout = 60000`;
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  console.log("Invoices seeded successfully.");
  return insertedInvoices;
}

async function seedCustomers() {
  console.log("Seeding customers...");
  await sql`SET statement_timeout = 60000`;
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  console.log("Customers seeded successfully.");
  return insertedCustomers;
}

async function seedRevenue() {
  console.log("Seeding revenue...");
  await sql`SET statement_timeout = 60000`;
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `
    )
  );

  console.log("Revenue seeded successfully.");
  return insertedRevenue;
}

export async function GET() {
  try {
    console.log("Starting database seeding...");
    const result = await sql.begin((sql) => [
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    console.log("Database seeded successfully.");
    return new Response(
      JSON.stringify({ message: "Database seeded successfully" }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error during database seeding:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
