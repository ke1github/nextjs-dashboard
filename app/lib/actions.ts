"use server";

import { z } from "zod";
import postgres from "postgres"; // This is the library that we use to connect to the database

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" }); // This is the connection to the database

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(), // We need to convert the amount to a number
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true }); // We don't need the date for the update form

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    // This is the main layout for the create invoice page. It contains the breadcrumbs and the invoice form.
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0]; // This is the current date with format YYYY-MM-DD

  // Now lets insert the data into the database
  // We use the SQL template tag to safely inject the data into the query
  // This helps prevent SQL injection attacks

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)   
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath("/ui/dashboard/invoices"); // This will revalidate the invoices page
  redirect("/ui/dashboard/invoices"); // This will redirect the user to the invoices page
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath("/ui/dashboard/invoices"); // This will revalidate the invoices page
  redirect("/ui/dashboard/invoices"); // This will redirect the user to the invoices page
}
// Compare this snippet from app/ui/invoices/edit-form.tsx:

export async function deleteInvoice(id: string) {
  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  revalidatePath("/ui/dashboard/invoices"); // This will revalidate the invoices page. This will trigger a new fetch of the data
}
