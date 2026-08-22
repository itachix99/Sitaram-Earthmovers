import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" asChild><Link href="/admin/projects"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link></Button>
      <div><h1 className="text-2xl font-bold tracking-tight">Add Job Site</h1><p className="text-sm text-muted-foreground">Create project, set billing, then assign machines & operators.</p></div>
      <ProjectForm />
    </div>
  );
}
