"use client";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMachine, updateMachine } from "@/lib/actions/machines";
import { toast } from "sonner";
import { useEffect } from "react";

type Machine = {
  id?: string;
  name: string;
  registrationNumber: string;
  machineType: string;
  manufacturer?: string | null;
  model?: string | null;
  manufacturingYear?: number | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  currentHourMeter: number;
  expectedFuelEfficiency?: number | null;
  serviceIntervalHours?: number | null;
  status: string;
  notes?: string | null;
};

export function MachineForm({ machine }: { machine?: Machine }) {
  const isEdit = !!machine?.id;
  const action = isEdit ? updateMachine.bind(null, machine!.id!) : createMachine;
  const [state, formAction, pending] = useActionState(action as never, null as never) as unknown as [{ error?: string } | null, (fd: FormData)=>void, boolean];

  useEffect(()=>{ if(state?.error) toast.error(state.error); }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Machine Name *</Label>
              <Input id="name" name="name" defaultValue={machine?.name ?? ""} placeholder="e.g. JCB 3DX" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input id="registrationNumber" name="registrationNumber" defaultValue={machine?.registrationNumber ?? ""} placeholder="MP15 AB 1234" required className="font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="machineType">Type *</Label>
                <select id="machineType" name="machineType" defaultValue={machine?.machineType ?? "JCB"} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
                  <option value="JCB">JCB</option>
                  <option value="EXCAVATOR">Excavator</option>
                  <option value="BACKHOE_LOADER">Backhoe Loader</option>
                  <option value="BULLDOZER">Bulldozer</option>
                  <option value="LOADER">Loader</option>
                  <option value="TIPPER">Tipper</option>
                  <option value="DUMP_TRUCK">Dump Truck</option>
                  <option value="CRANE">Crane</option>
                  <option value="TRACTOR">Tractor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select id="status" name="status" defaultValue={machine?.status ?? "ACTIVE"} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
                  <option value="ACTIVE">Active</option>
                  <option value="WORKING">Working</option>
                  <option value="IDLE">Idle</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="BROKEN_DOWN">Broken Down</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="manufacturer">Manufacturer</Label><Input id="manufacturer" name="manufacturer" defaultValue={machine?.manufacturer ?? ""} placeholder="JCB" /></div>
              <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" name="model" defaultValue={machine?.model ?? ""} placeholder="3DX Xtra" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="manufacturingYear">Year</Label><Input id="manufacturingYear" name="manufacturingYear" type="number" defaultValue={machine?.manufacturingYear ?? ""} placeholder="2019" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operational Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentHourMeter">Current Hour Meter *</Label>
              <Input id="currentHourMeter" name="currentHourMeter" type="number" step="0.1" defaultValue={machine?.currentHourMeter ?? 0} required className="font-mono" />
              <p className="text-xs text-muted-foreground">This is the source of truth. Updated after each work session.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="expectedFuelEfficiency">Exp. Fuel (L/hr)</Label><Input id="expectedFuelEfficiency" name="expectedFuelEfficiency" type="number" step="0.1" defaultValue={machine?.expectedFuelEfficiency ?? ""} placeholder="6.0" className="font-mono" /></div>
              <div className="space-y-2"><Label htmlFor="serviceIntervalHours">Service Interval (h)</Label><Input id="serviceIntervalHours" name="serviceIntervalHours" type="number" defaultValue={machine?.serviceIntervalHours ?? 500} placeholder="500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="purchasePrice">Purchase Price (₹)</Label><Input id="purchasePrice" name="purchasePrice" type="number" defaultValue={machine?.purchasePrice ?? ""} placeholder="2800000" /></div>
              <div className="space-y-2"><Label htmlFor="purchaseDate">Purchase Date</Label><Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={machine?.purchaseDate ? (machine.purchaseDate as string).slice(0,10) : ""} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><textarea id="notes" name="notes" defaultValue={machine?.notes ?? ""} placeholder="Any remarks..." className="w-full rounded-md border border-input bg-card p-3 text-sm min-h-[80px]" /></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} size="lg">{pending ? "Saving..." : isEdit ? "Update Machine" : "Create Machine"}</Button>
        <Button type="button" variant="outline" onClick={()=>history.back()}>Cancel</Button>
      </div>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</p>}
    </form>
  );
}