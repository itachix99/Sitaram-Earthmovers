"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createExpense } from "@/lib/actions/expenses";
import { toast } from "sonner";

export function ExpenseForm({ machines, sites }: { machines: { id: string; name: string; registrationNumber: string }[]; sites: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createExpense as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd:FormData)=>void, boolean];
  useEffect(()=>{ if(state?.error) toast.error(state.error); if(state?.success) toast.success("Expense recorded"); },[state]);
  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="category">Category *</Label><select id="category" name="category" required defaultValue="FUEL" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="FUEL">Fuel</option><option value="MAINTENANCE">Maintenance</option><option value="REPAIR">Repair</option><option value="SPARE_PARTS">Spare Parts</option><option value="OPERATOR_PAYMENT">Operator Payment</option><option value="TRANSPORT">Transport</option><option value="PERMITS">Permits</option><option value="OTHER">Other</option></select></div>
        <div className="space-y-2"><Label htmlFor="amount">Amount (₹) *</Label><Input id="amount" name="amount" type="number" step="0.01" required placeholder="12000" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="machineId">Machine (optional)</Label><select id="machineId" name="machineId" defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="">— None —</option>{machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="jobSiteId">Project (optional)</Label><select id="jobSiteId" name="jobSiteId" defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="">— None —</option>{sites.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0,10)} /></div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" placeholder="Engine oil, diesel..." /></div>
      <Button type="submit" disabled={pending} className="w-full" size="lg">{pending?"Saving...":"Record Expense"}</Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
    </form>
  );
}