import Link from "next/link";
import { notFound } from "next/navigation";

import { updateOrderStatus } from "@/app/orders/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getOrder, getOrderLines } from "@/lib/queries";
import { currency, dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statuses = ["Shipped", "Resolved", "Cancelled", "On Hold", "Disputed", "In Process"];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderNumber = Number(id);
  const [order, lines] = await Promise.all([getOrder(orderNumber), getOrderLines(orderNumber)]);

  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description="A realistic order screen joins customers, order headers, order lines, and products."
        action={
          <LinkButton href="/orders" variant="secondary">
            Back to Orders
          </LinkButton>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Operational status and customer ownership.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={order.status} />
              </div>
              <Info label="Customer" value={order.customerName} href={`/customers/${order.customerNumber}`} />
              <Info label="Contact" value={order.contactName} />
              <Info label="Country" value={order.country} />
              <Info label="Order Date" value={dateLabel(order.orderDate)} />
              <Info label="Required Date" value={dateLabel(order.requiredDate)} />
              <Info label="Shipped Date" value={dateLabel(order.shippedDate)} />
              <Info label="Order Total" value={currency(order.total)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>This small write action changes the operational database.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateOrderStatus} className="flex flex-col gap-3">
                <input type="hidden" name="orderNumber" value={order.orderNumber} />
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Button type="submit">Save Status</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Each row comes from `orderdetails` joined to `products`.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Line</TH>
                  <TH className="text-right">Qty</TH>
                  <TH className="text-right">Unit Price</TH>
                  <TH className="text-right">Line Total</TH>
                </TR>
              </THead>
              <TBody>
                {lines.map((line) => (
                  <TR key={line.productCode}>
                    <TD>
                      <div className="font-medium">{line.productName}</div>
                      <div className="text-xs text-muted-foreground">{line.productCode}</div>
                    </TD>
                    <TD>{line.productLine}</TD>
                    <TD className="text-right">{line.quantityOrdered}</TD>
                    <TD className="text-right">{currency(line.priceEach)}</TD>
                    <TD className="text-right font-medium">{currency(line.lineTotal)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {href ? (
        <Link href={href} className="text-right font-medium text-primary">
          {value}
        </Link>
      ) : (
        <span className="text-right font-medium">{value}</span>
      )}
    </div>
  );
}
