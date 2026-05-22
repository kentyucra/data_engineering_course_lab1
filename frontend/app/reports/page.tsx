import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getOrderStatusSummary, getSalesByCountry, getSalesByProductLine } from "@/lib/queries";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [productLines, countries, statuses] = await Promise.all([
    getSalesByProductLine(),
    getSalesByCountry(),
    getOrderStatusSummary()
  ]);

  const maxProductLine = Math.max(...productLines.map((line) => line.revenue));
  const maxCountry = Math.max(...countries.map((country) => country.revenue));

  return (
    <>
      <PageHeader
        title="Reports"
        description="These reports still query the normalized OLTP schema directly. The data engineering lab later moves this analytical work into a better serving layer."
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Product Line</CardTitle>
            <CardDescription>Join path: `orderdetails` {"->"} `products`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productLines.map((line) => (
              <Bar key={line.productLine} label={line.productLine} value={currency(line.revenue)} width={(line.revenue / maxProductLine) * 100} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Country</CardTitle>
            <CardDescription>Join path: `customers` {"->"} `orders` {"->"} `orderdetails`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {countries.map((country) => (
              <Bar
                key={country.country}
                label={country.country}
                value={currency(country.revenue)}
                width={(country.revenue / maxCountry) * 100}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Order Status Summary</CardTitle>
            <CardDescription>Operational teams watch these statuses to understand fulfillment health.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Status</TH>
                  <TH className="text-right">Orders</TH>
                </TR>
              </THead>
              <TBody>
                {statuses.map((status) => (
                  <TR key={status.status}>
                    <TD className="font-medium">{status.status}</TD>
                    <TD className="text-right">{status.orders}</TD>
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

function Bar({ label, value, width }: { label: string; value: string; width: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, width)}%` }} />
      </div>
    </div>
  );
}
