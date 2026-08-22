"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createRevenue } from "@/lib/actions/revenue";
import { toast } from "sonner";

export function RevenueForm({ machines, sites }: { machines: { id: string; name: string; registrationNumber: string }[]; sites: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createRevenue as never, null as never) as unknown as [{ error?: string; success?: boolean } | null, (fd:FormData)=>void, boolean];
  useEffect(()=>{ if(state?.error) toast.error(state.error); if(state?.success) toast.success("Revenue recorded"); },[state]);
  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="invoiceNumber">Invoice # *</Label><Input id="invoiceNumber" name="invoiceNumber" required placeholder="INV-2026-001" /></div>
        <div className="space-y-2"><Label htmlFor="amount">Amount (₹) *</Label><Input id="amount" name="amount" type="number" step="0.01" required placeholder="180000" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="amountReceived">Received (₹)</Label><Input id="amountReceived" name="amountReceived" type="number" step="0.01" defaultValue={0} placeholder="0" /></div>
        <div className="space-y-2"><Label htmlFor="paymentStatus">Payment Status</Label><select id="paymentStatus" name="paymentStatus" defaultValue="PENDING" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="PENDING">Pending</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="jobSiteId">Project</Label><select id="jobSiteId" name="jobSiteId" defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="">— None —</option>{sites.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="machineId">Machine</Label><select id="machineId" name="machineId" defaultValue="" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="">— None —</option>{machines.map(m=> <option key={m.id} value={m.id}>{m.name} • {m.registrationNumber}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="clientName">Client</Label><Input id="clientName" name="clientName" placeholder="ABC Constructions" /></div>
        <div className="space-y-2"><Label htmlFor="billingStart">Billing Start</Label><Input id="billingStart" name="billingStart" type="date" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="billingEnd">Billing End</Label><Input id="billingEnd" name="billingEnd" type="date" /></div>
        <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Input id="notes" name="notes" placeholder="August billing..." /></div>
      </div>
      <Button type="submit" disabled={pending} className="w-full" size="lg">{pending?"Saving...":"Record Revenue"}</Button>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{state.error}</p>}
    </form>
  );
}