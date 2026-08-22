"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { endWork } from "@/lib/actions/work-sessions";
import { toast } from "sonner";

export function EndWorkForm({ sessionId, openingMeter }: { sessionId: string; openingMeter: number }) {
  const [state, formAction, pending] = useActionState(endWork as never, null as never) as unknown as [{ error?: string; success?: boolean; workingHours?: number } | null, (fd:FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success(`Work completed — ${state.workingHours?.toFixed(1)} h`);
  },[state]);
  return (
    <form action={formAction} className="space-y-3 border-t pt-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="space-y-2">
        <Label htmlFor="closingHourMeter">Closing Hour Meter *</Label>
        <Input id="closingHourMeter" name="closingHourMeter" type="number" step="0.1" required placeholder={`${(openingMeter+8).toFixed(1)}`} className="h-12 text-lg font-mono" />
        <p className="text-xs text-muted-foreground">Opening: {openingMeter.toFixed(1)} h • Closing must be ≥ opening</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fuelUsed">Fuel Used (L) — optional</Label>
        <Input id="fuelUsed" name="fuelUsed" type="number" step="0.1" placeholder="e.g. 35" className="font-mono" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Work Notes</Label>
        <textarea id="notes" name="notes" placeholder="Work done, issues..." className="w-full rounded-md border border-input bg-card p-3 text-sm min-h-[80px]" />
      </div>
      <Button type="submit" size="xl" variant="charcoal" className="w-full" disabled={pending}>{pending?"Submitting...":"End Work — Submit Report"}</Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">Submitted — {state.workingHours?.toFixed(1)} h calculated server-side</p>}
    </form>
  );
}