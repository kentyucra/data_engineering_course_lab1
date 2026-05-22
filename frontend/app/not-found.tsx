import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Record Not Found" description="The requested operational record does not exist in the Classic Models database." />
      <Card>
        <CardContent className="p-5">
          <LinkButton href="/">Return to dashboard</LinkButton>
        </CardContent>
      </Card>
    </>
  );
}
