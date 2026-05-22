import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getCustomer, getCustomerOrders } from "@/lib/queries";
import { currency, dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerNumber = Number(id);
  const [customer, orders] = await Promise.all([getCustomer(customerNumber), getCustomerOrders(customerNumber)]);

  if (!customer) notFound();

  return (
    <>
      <PageHeader
        title={customer.customerName}
        description="A customer profile combines account, sales ownership, order, and payment context from multiple normalized tables."
        action={
          <LinkButton href="/customers" variant="secondary">
            Back to Customers
          </LinkButton>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account Profile</CardTitle>
            <CardDescription>Operational teams use this to support the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info label="Contact" value={customer.contactName} />
            <Info label="Phone" value={customer.phone} />
            <Info label="Address" value={`${customer.address}, ${customer.city}, ${customer.country}`} />
            <Info label="Credit Limit" value={currency(customer.creditLimit)} />
            <Info label="Sales Rep" value={customer.salesRep ?? "Unassigned"} />
            <Info label="Rep Email" value={customer.salesRepEmail ?? "Unavailable"} />
            <Info label="Sales Office" value={customer.officeCity ?? "Unavailable"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>The app joins `orders` and `orderdetails` to show order totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Status</TH>
                  <TH>Order Date</TH>
                  <TH>Required</TH>
                  <TH>Shipped</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((order) => (
                  <TR key={order.orderNumber}>
                    <TD>
                      <LinkButton href={`/orders/${order.orderNumber}`} variant="ghost" className="px-0 text-primary">
                        #{order.orderNumber}
                      </LinkButton>
                    </TD>
                    <TD>
                      <StatusBadge status={order.status} />
                    </TD>
                    <TD>{dateLabel(order.orderDate)}</TD>
                    <TD>{dateLabel(order.requiredDate)}</TD>
                    <TD>{dateLabel(order.shippedDate)}</TD>
                    <TD className="text-right font-medium">{currency(order.total)}</TD>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
