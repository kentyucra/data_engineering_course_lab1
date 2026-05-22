import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getEmployees } from "@/lib/queries";
import { currency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <>
      <PageHeader
        title="Employees"
        description="Employees connect customers to the sales organization. Offices and reporting structure explain ownership and territory."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH>
                <TH>Role</TH>
                <TH>Office</TH>
                <TH>Manager</TH>
                <TH className="text-right">Customers</TH>
                <TH className="text-right">Managed Revenue</TH>
              </TR>
            </THead>
            <TBody>
              {employees.map((employee) => (
                <TR key={employee.employeeNumber}>
                  <TD>
                    <div className="font-medium">{employee.employeeName}</div>
                    <div className="text-xs text-muted-foreground">{employee.email}</div>
                  </TD>
                  <TD>{employee.jobTitle}</TD>
                  <TD>
                    {employee.officeCity}, {employee.country}
                  </TD>
                  <TD>{employee.manager ?? "Executive"}</TD>
                  <TD className="text-right">{employee.customerCount}</TD>
                  <TD className="text-right font-medium">{currency(employee.managedRevenue)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
