import { OperatorForm } from "@/components/operators/operator-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewOperatorPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" asChild><Link href="/admin/operators"><ArrowLeft className="h-4 w-4" /> Back to Operators</Link></Button>
      <div><h1 className="text-2xl font-bold tracking-tight">Add Operator</h1><p className="text-sm text-muted-foreground">Creates User + Operator linked. Login via phone/email + password.</p></div>
      <OperatorForm />
    </div>
  );
}
