import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getProducts } from "@/lib/queries";
import { currency, compactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <PageHeader
        title="Products"
        description="The catalog stores stock, pricing, product line, vendor, and scale. Order lines point back to these product records."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Product Line</TH>
                <TH>Vendor</TH>
                <TH>Scale</TH>
                <TH className="text-right">Stock</TH>
                <TH className="text-right">MSRP</TH>
                <TH className="text-right">Units Sold</TH>
                <TH className="text-right">Revenue</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((product) => (
                <TR key={product.productCode}>
                  <TD>
                    <div className="font-medium">{product.productName}</div>
                    <div className="text-xs text-muted-foreground">{product.productCode}</div>
                  </TD>
                  <TD>
                    <Badge tone="info">{product.productLine}</Badge>
                  </TD>
                  <TD>{product.productVendor}</TD>
                  <TD>{product.productScale}</TD>
                  <TD className="text-right">{compactNumber(product.quantityInStock)}</TD>
                  <TD className="text-right">{currency(product.MSRP)}</TD>
                  <TD className="text-right">{compactNumber(product.orderedUnits)}</TD>
                  <TD className="text-right font-medium">{currency(product.revenue)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
