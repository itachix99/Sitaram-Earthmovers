import { MachineForm } from "@/components/machines/machine-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewMachinePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" asChild><Link href="/admin/machines"><ArrowLeft className="h-4 w-4" /> Back to Machinery</Link></Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Machinery</h1>
        <p className="text-sm text-muted-foreground">Create a new machine record. Registration must be unique.</p>
      </div>
      <MachineForm />
    </div>
  );
}
