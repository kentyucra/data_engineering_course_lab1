import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getOrders } from "@/lib/queries";
import { currency, dateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <>
      <PageHeader
        title="Orders"
        description="Orders are transactional records. Each order points to one customer and many order detail rows."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Order</TH>
                <TH>Customer</TH>
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
                    <Link className="font-medium text-primary" href={`/orders/${order.orderNumber}`}>
                      #{order.orderNumber}
                    </Link>
                  </TD>
                  <TD>
                    <Link className="font-medium" href={`/customers/${order.customerNumber}`}>
                      {order.customerName}
                    </Link>
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
    </>
  );
}
