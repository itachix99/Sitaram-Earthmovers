"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createMaintenance } from "@/lib/actions/maintenance";
import { toast } from "sonner";

export function MaintenanceForm({ machines }: { machines: { id: string; name: string; registrationNumber: string; currentHourMeter: number }[] }) {
  const [state, formAction, pending] = useActionState(createMaintenance as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{
    if(state?.error) toast.error(state.error);
    if(state?.success) toast.success("Maintenance record saved — machine last service updated");
  },[state]);
  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="machineId">Machine *</Label>
        <select id="machineId" name="machineId" required className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
          <option value="">Select machine</option>
          {machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber} • {m.currentHourMeter.toFixed(1)} h</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="serviceType">Service Type</Label><select id="serviceType" name="serviceType" defaultValue="SCHEDULED" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="SCHEDULED">Scheduled</option><option value="UNSCHEDULED">Unscheduled</option><option value="REPAIR">Repair</option></select></div>
        <div className="space-y-2"><Label htmlFor="serviceDate">Service Date</Label><Input id="serviceDate" name="serviceDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" placeholder="Engine oil, filters..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="meterReading">Meter Reading</Label><Input id="meterReading" name="meterReading" type="number" step="0.1" placeholder="4929.9" className="font-mono" /></div>
        <div className="space-y-2"><Label htmlFor="serviceProvider">Provider</Label><Input id="serviceProvider" name="serviceProvider" placeholder="Sitaram Workshop" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="nextServiceHours">Next Service (hours)</Label><Input id="nextServiceHours" name="nextServiceHours" type="number" placeholder="5429.9" className="font-mono" /></div>
        <div className="space-y-2"><Label htmlFor="nextServiceDate">Next Service Date</Label><Input id="nextServiceDate" name="nextServiceDate" type="date" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="partsCost">Parts Cost (₹)</Label><Input id="partsCost" name="partsCost" type="number" placeholder="12000" /></div>
        <div className="space-y-2"><Label htmlFor="laborCost">Labor Cost (₹)</Label><Input id="laborCost" name="laborCost" type="number" placeholder="3000" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Input id="notes" name="notes" placeholder="Any remarks..." /></div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending?"Saving...":"Save Maintenance Record"}</Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
    </form>
  );
}