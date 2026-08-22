"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProject, updateProject } from "@/lib/actions/projects";
import { toast } from "sonner";

type Project = {
  id?: string;
  name: string;
  clientName?: string | null;
  clientPhone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  status: string;
  billingType: string;
  rate?: number | null;
  notes?: string | null;
};

export function ProjectForm({ project }: { project?: Project }) {
  const isEdit = !!project?.id;
  const action = isEdit ? updateProject.bind(null, project!.id!) : createProject;
  const [state, formAction, pending] = useActionState(action as never, null as never) as unknown as [{ error?: string } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{ if(state?.error) toast.error(state.error); },[state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Project / Site Name *</Label><Input id="name" name="name" defaultValue={project?.name ?? ""} required placeholder="ABC Highway Pkg 03" /></div>
            <div className="space-y-2"><Label htmlFor="address">Address / Location</Label><Input id="address" name="address" defaultValue={project?.address ?? ""} placeholder="Bhopal Bypass, MP" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="latitude">Latitude</Label><Input id="latitude" name="latitude" type="number" step="any" defaultValue={project?.latitude ?? ""} placeholder="23.2599" /></div>
              <div className="space-y-2"><Label htmlFor="longitude">Longitude</Label><Input id="longitude" name="longitude" type="number" step="any" defaultValue={project?.longitude ?? ""} placeholder="77.4126" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" name="startDate" type="date" defaultValue={project?.startDate ? (project.startDate as string).slice(0,10) : ""} /></div>
              <div className="space-y-2"><Label htmlFor="expectedEndDate">Expected End</Label><Input id="expectedEndDate" name="expectedEndDate" type="date" defaultValue={project?.expectedEndDate ? (project.expectedEndDate as string).slice(0,10) : ""} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" defaultValue={project?.status ?? "ACTIVE"} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="ACTIVE">Active</option><option value="ON_HOLD">On Hold</option><option value="COMPLETED">Completed</option></select></div>
              <div className="space-y-2"><Label htmlFor="billingType">Billing Type</Label><select id="billingType" name="billingType" defaultValue={project?.billingType ?? "HOURLY"} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="HOURLY">Hourly</option><option value="DAILY">Daily</option><option value="FIXED">Fixed</option><option value="QUANTITY">Quantity</option></select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="rate">Rate (₹)</Label><Input id="rate" name="rate" type="number" step="0.01" defaultValue={project?.rate ?? ""} placeholder="1800 (per hour/day or fixed)" /><p className="text-xs text-muted-foreground">Used for estimated revenue = hours × rate</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="clientName">Client Name</Label><Input id="clientName" name="clientName" defaultValue={project?.clientName ?? ""} placeholder="ABC Constructions" /></div>
            <div className="space-y-2"><Label htmlFor="clientPhone">Client Phone</Label><Input id="clientPhone" name="clientPhone" defaultValue={project?.clientPhone ?? ""} placeholder="+91 98765 00000" className="font-mono" /></div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><textarea id="notes" name="notes" defaultValue={project?.notes ?? ""} placeholder="Any remarks..." className="w-full rounded-md border border-input bg-card p-3 text-sm min-h-[120px]" /></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} size="lg">{pending?"Saving...": isEdit?"Update Project":"Create Project"}</Button>
        <Button type="button" variant="outline" onClick={()=>history.back()}>Cancel</Button>
      </div>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</p>}
    </form>
  );
}