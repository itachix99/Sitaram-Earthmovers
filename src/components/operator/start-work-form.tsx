"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { startWork } from "@/lib/actions/work-sessions";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export function StartWorkForm({ machineId, jobSiteId, currentMeter }: { machineId: string; jobSiteId: string | null; currentMeter: number }) {
  const [state, formAction, pending] = useActionState(startWork as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success("Work started — session active");
  },[state]);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="machineId" value={machineId} />
      <input type="hidden" name="jobSiteId" value={jobSiteId ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="openingHourMeter">Opening Hour Meter *</Label>
        <Input id="openingHourMeter" name="openingHourMeter" type="number" step="0.1" required placeholder={String(currentMeter)} className="h-12 text-lg font-mono" />
        <p className="text-xs text-muted-foreground">Current meter: {currentMeter.toFixed(1)} h • Opening must be ≥ current</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" placeholder="Any remarks..." />
      </div>
      <Button variant="outline" type="button" className="w-full h-12" onClick={()=>toast.info("Photo upload arrives Phase 6 storage — placeholder")}><Camera className="h-4 w-4" /> Add Meter Photo (optional)</Button>
      <Button type="submit" size="xl" className="w-full text-base font-bold" disabled={pending}>
        {pending ? "Starting..." : "Start Work — Tap to Begin"}
      </Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
      <p className="text-center text-xs text-muted-foreground">Duplicate sessions blocked server-side.</p>
    </form>
  );
}
