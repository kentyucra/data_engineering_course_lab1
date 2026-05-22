import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getCustomers } from "@/lib/queries";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer accounts are the center of the operational system. Orders, payments, and sales ownership all connect back here."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Customer</TH>
                <TH>Contact</TH>
                <TH>Location</TH>
                <TH>Sales Rep</TH>
                <TH className="text-right">Orders</TH>
                <TH className="text-right">Lifetime Value</TH>
                <TH className="text-right">Credit Limit</TH>
              </TR>
            </THead>
            <TBody>
              {customers.map((customer) => (
                <TR key={customer.customerNumber}>
                  <TD>
                    <Link className="font-medium text-primary" href={`/customers/${customer.customerNumber}`}>
                      {customer.customerName}
                    </Link>
                    <div className="text-xs text-muted-foreground">#{customer.customerNumber}</div>
                  </TD>
                  <TD>{customer.contactName}</TD>
                  <TD>
                    {customer.city}, {customer.country}
                  </TD>
                  <TD>{customer.salesRep ?? "Unassigned"}</TD>
                  <TD className="text-right">{customer.orderCount}</TD>
                  <TD className="text-right font-medium">{currency(customer.lifetimeValue)}</TD>
                  <TD className="text-right">{currency(customer.creditLimit)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
