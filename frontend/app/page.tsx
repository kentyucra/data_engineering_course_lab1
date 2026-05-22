import { Boxes, CircleDollarSign, ClipboardList, Globe2, Timer, Users } from "lucide-react";
import Link from "next/link";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { compactNumber, currency, dateLabel } from "@/lib/utils";
import { getMetrics, getRecentOrders, getSalesByProductLine } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, recentOrders, productLines] = await Promise.all([
    getMetrics(),
    getRecentOrders(),
    getSalesByProductLine()
  ]);

  const maxRevenue = Math.max(...productLines.map((line) => line.revenue));

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        description="A small internal tool that shows how employees would interact with the normalized Classic Models OLTP database."
        action={<LinkButton href="/orders">Review Orders</LinkButton>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Customers" value={compactNumber(metrics.customers)} helper="Active customer accounts" icon={Users} />
        <MetricCard label="Orders" value={compactNumber(metrics.orders)} helper="Historical sales orders" icon={ClipboardList} />
        <MetricCard label="Products" value={compactNumber(metrics.products)} helper="Models in the catalog" icon={Boxes} />
        <MetricCard label="Gross Sales" value={currency(metrics.revenue)} helper="From order line items" icon={CircleDollarSign} />
        <MetricCard label="Watchlist Orders" value={compactNumber(metrics.openOrders)} helper="In process, on hold, or disputed" icon={Timer} />
        <MetricCard label="Countries" value={compactNumber(metrics.countries)} helper="Customer markets represented" icon={Globe2} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>What an operations associate might check each morning.</CardDescription>
            </div>
            <LinkButton href="/orders" variant="secondary">
              View all
            </LinkButton>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Status</TH>
                  <TH>Date</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {recentOrders.map((order) => (
                  <TR key={order.orderNumber}>
                    <TD>
                      <Link className="font-medium text-primary" href={`/orders/${order.orderNumber}`}>
                        #{order.orderNumber}
                      </Link>
                    </TD>
                    <TD>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.country}</div>
                    </TD>
                    <TD>
                      <StatusBadge status={order.status} />
                    </TD>
                    <TD>{dateLabel(order.orderDate)}</TD>
                    <TD className="text-right font-medium">{currency(order.total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Product Line</CardTitle>
            <CardDescription>The same operational data can already answer simple business questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productLines.map((line) => (
              <div key={line.productLine}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{line.productLine}</span>
                  <span className="text-muted-foreground">{currency(line.revenue)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.max(8, (line.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
