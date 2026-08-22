"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createFuelLog } from "@/lib/actions/fuel";
import { toast } from "sonner";

export function FuelForm({ machines, jobSites, defaultMachineId, defaultJobSiteId, currentMeter }: { machines: { id: string; name: string; registrationNumber: string }[]; jobSites: { id: string; name: string }[]; defaultMachineId?: string; defaultJobSiteId?: string | null; currentMeter?: number }) {
  const [state, formAction, pending] = useActionState(createFuelLog as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success("Fuel logged — efficiency will be calculated");
  },[state]);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="machineId">Machine *</Label>
        <select id="machineId" name="machineId" defaultValue={defaultMachineId ?? ""} required className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="">Select machine</option>
          {machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jobSiteId">Job Site (optional)</Label>
        <select id="jobSiteId" name="jobSiteId" defaultValue={defaultJobSiteId ?? ""} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="">— No site —</option>
          {jobSites.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="litres">Litres *</Label><Input id="litres" name="litres" type="number" step="0.1" required placeholder="35" className="h-12 text-lg font-mono" /></div>
        <div className="space-y-2"><Label htmlFor="costPerLitre">Price / L (₹)</Label><Input id="costPerLitre" name="costPerLitre" type="number" step="0.01" placeholder="94.2" className="font-mono" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="meterReading">Meter Reading</Label><Input id="meterReading" name="meterReading" type="number" step="0.1" defaultValue={currentMeter ?? ""} placeholder={currentMeter ? String(currentMeter) : "4925.0"} className="font-mono" /></div>
        <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="fuelStation">Fuel Station</Label><Input id="fuelStation" name="fuelStation" placeholder="HP Pump Bhopal" /></div>
      <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Input id="notes" name="notes" placeholder="Full tank..." /></div>
      <Button type="submit" size="xl" className="w-full" disabled={pending}>{pending?"Saving...":"Save Fuel Entry"}</Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">Saved — totalCost = litres × price calculated server-side</p>}
    </form>
  );
}