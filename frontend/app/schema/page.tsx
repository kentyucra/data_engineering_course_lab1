import Image from "next/image";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const relationships = [
  ["customers", "orders", "A customer can place many orders."],
  ["orders", "orderdetails", "An order has one or more line items."],
  ["products", "orderdetails", "Each line item references one product."],
  ["productlines", "products", "A product belongs to one product line."],
  ["customers", "payments", "Payments are recorded against customers."],
  ["employees", "customers", "Sales representatives own customer accounts."],
  ["offices", "employees", "Employees belong to sales offices."]
];

export default function SchemaPage() {
  return (
    <>
      <PageHeader
        title="Database Schema"
        description="The production-style app reads many small normalized tables. That shape is excellent for transactions, but analytical queries often need several joins."
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Classic Models ER Diagram</CardTitle>
            <CardDescription>The diagram comes from the database folder in this lab project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border bg-white p-3">
              <Image
                src="/schema.png"
                alt="Classic Models entity relationship diagram"
                width={879}
                height={761}
                className="h-auto w-full"
                priority
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How the App Uses It</CardTitle>
            <CardDescription>Examples of the joins behind the screens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {relationships.map(([left, right, text]) => (
              <div key={`${left}-${right}`} className="rounded-md border bg-muted/30 p-3">
                <div className="font-mono text-xs text-muted-foreground">
                  {left} {"->"} {right}
                </div>
                <p className="mt-1 text-sm">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
