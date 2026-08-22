"use client";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAssignment } from "@/lib/actions/assignments";
import { toast } from "sonner";

export function AssignmentForm({ machines, operators, jobSiteId }: { machines: { id: string; name: string; registrationNumber: string }[]; operators: { id: string; name: string; phone: string }[]; jobSiteId: string }) {
  const [state, formAction, pending] = useActionState(createAssignment as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success("Assignment created — previous machine assignment ended if existed");
  },[state]);
  return (
    <form action={formAction} className="flex flex-wrap gap-3 items-end rounded-xl border bg-card p-4">
      <input type="hidden" name="jobSiteId" value={jobSiteId} />
      <div className="flex-1 min-w-[180px] space-y-1">
        <Label htmlFor="machineId">Machine *</Label>
        <select id="machineId" name="machineId" required className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="">Select machine</option>
          {machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[180px] space-y-1">
        <Label htmlFor="operatorId">Operator *</Label>
        <select id="operatorId" name="operatorId" required className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="">Select operator</option>
          {operators.map(o=> <option key={o.id} value={o.id}>{o.name} • {o.phone}</option>)}
        </select>
      </div>
      <Button type="submit" disabled={pending}>{pending?"Assigning...":"Assign"}</Button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}