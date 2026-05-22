"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { execute } from "@/lib/db";

const allowedStatuses = new Set(["Shipped", "Resolved", "Cancelled", "On Hold", "Disputed", "In Process"]);

export async function updateOrderStatus(formData: FormData) {
  const orderNumber = Number(formData.get("orderNumber"));
  const status = String(formData.get("status") ?? "");

  if (!Number.isFinite(orderNumber) || !allowedStatuses.has(status)) {
    throw new Error("Invalid order status update.");
  }

  await execute("UPDATE orders SET status = :status WHERE orderNumber = :orderNumber", { status, orderNumber });
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderNumber}`);
  redirect(`/orders/${orderNumber}`);
}
