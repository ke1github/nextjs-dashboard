"use server";

import { z } from "zod";
import postgres from "postgres"; // This is the library that we use to connect to the database

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" }); // This is the connection to the database

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer",
  }), // We need to make sure that the customer is selected & not empty
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }), // We need to convert the amount to a number & make sure it's greater than 0
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }), // We need to make sure that the status is either pending or paid & not empty
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true }); // We don't need the date for the update form

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // validate the form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    // This is the main layout for the create invoice page. It contains the breadcrumbs and the invoice form.
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If the form is invalid, we will return the error messages
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice",
    };
  }

  // If the form is valid, we will insert the data into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0]; // This is the current date with format YYYY-MM-DD

  // Now lets insert the data into the database -----------
  // We use the SQL template tag to safely inject the data into the query
  // This helps prevent SQL injection attacks
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)   
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    // if the database query fails, we will log the error
    return {
      message: "Database Error: Failed to Create Invoice",
    };
  }
  revalidatePath("/ui/dashboard/invoices"); // This will revalidate the invoices page
  redirect("/ui/dashboard/invoices"); // This will redirect the user to the invoices page
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice",
    };
  }
  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    // we will log the error to the console for now
    return {
      message: "Database Error: Failed to Update Invoice",
    };
  }
  revalidatePath("/ui/dashboard/invoices"); // This will revalidate the invoices page
  redirect("/ui/dashboard/invoices"); // This will redirect the user to the invoices page
}
// Compare this snippet from app/ui/invoices/edit-form.tsx:

export async function deleteInvoice(id: string) {
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}
    `;

    revalidatePath("/ui/dashboard/invoices"); // This will revalidate the invoices page. This will trigger a new fetch of the data
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw new Error("Failed to delete invoice");
  }
}

// This is Authentication part & the form validation part
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
