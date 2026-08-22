"use client";
import { useActionState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateBreakdown } from "@/lib/actions/breakdowns";
import { toast } from "sonner";

export function BreakdownStatusForm({ id, currentStatus }: { id: string; currentStatus: string }) {
  const action = updateBreakdown.bind(null, id);
  const [state, formAction, pending] = useActionState(action as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd:FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success("Breakdown updated");
  },[state]);
  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-end">
      <div className="space-y-1">
        <Label htmlFor={`status-${id}`}>Status</Label>
        <select id={`status-${id}`} name="status" defaultValue={currentStatus} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
          <option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option>
        </select>
      </div>
      <div className="flex-1 min-w-[160px] space-y-1">
        <Label htmlFor={`resolutionNotes-${id}`}>Resolution Notes</Label>
        <input id={`resolutionNotes-${id}`} name="resolutionNotes" placeholder="Fixed, parts replaced..." className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{pending?"Saving...":"Update"}</Button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}