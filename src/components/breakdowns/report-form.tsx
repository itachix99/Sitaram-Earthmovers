"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createBreakdown } from "@/lib/actions/breakdowns";
import { toast } from "sonner";

export function ReportForm({ machines, defaultMachineId }: { machines: { id: string; name: string; registrationNumber: string }[]; defaultMachineId?: string }) {
  const [state, formAction, pending] = useActionState(createBreakdown as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success("Breakdown reported — admin will be notified");
  },[state]);
  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="machineId">Machine *</Label>
        <select id="machineId" name="machineId" required defaultValue={defaultMachineId ?? ""} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="">Select machine</option>
          {machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="severity">Severity</Label>
        <select id="severity" name="severity" defaultValue="MEDIUM" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical (machine → BROKEN_DOWN)</option>
        </select>
      </div>
      <div className="space-y-2"><Label htmlFor="issue">Issue Title *</Label><Input id="issue" name="issue" required placeholder="Hydraulic leak" /></div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label><textarea id="description" name="description" placeholder="Describe noise, leak, location..." className="w-full rounded-md border border-input bg-card p-3 text-sm min-h-[100px]" /></div>
      <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" placeholder="ABC Highway, km 12" /></div>
      <Button type="submit" size="xl" variant="charcoal" className="w-full" disabled={pending}>{pending?"Reporting...":"Submit Report"}</Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
    </form>
  );
}