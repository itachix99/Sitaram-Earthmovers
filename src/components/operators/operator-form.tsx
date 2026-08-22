"use client";
import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOperator, updateOperator } from "@/lib/actions/operators";
import { toast } from "sonner";

type Op = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  joiningDate?: string | null;
  salaryType: string;
  salaryAmount?: number | null;
  status: string;
};

export function OperatorForm({ operator }: { operator?: Op }) {
  const isEdit = !!operator?.id;
  const action = isEdit ? updateOperator.bind(null, operator!.id!) : createOperator;
  const [state, formAction, pending] = useActionState(action as never, null as never) as unknown as [{ error?: string } | null, (fd: FormData)=>void, boolean];
  useEffect(()=>{ if(state?.error) toast.error(state.error); },[state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal & Login</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Full Name *</Label><Input id="name" name="name" defaultValue={operator?.name ?? ""} required placeholder="Ramesh Kumar" /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone *</Label><Input id="phone" name="phone" defaultValue={operator?.phone ?? ""} required placeholder="+919876543210" className="font-mono" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email (optional)</Label><Input id="email" name="email" type="email" defaultValue={operator?.email ?? ""} placeholder="ramesh@sitaram.co.in" /></div>
            <div className="space-y-2"><Label htmlFor="password">{isEdit?"New Password (leave blank to keep)":"Password *"}</Label><Input id="password" name="password" type="password" placeholder={isEdit?"••••••••":"operator123"} required={!isEdit} /><p className="text-xs text-muted-foreground">Operators login with phone or email + password. Role is always OPERATOR.</p></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" defaultValue={operator?.status ?? "ACTIVE"} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Operator Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="licenseNumber">License Number</Label><Input id="licenseNumber" name="licenseNumber" defaultValue={operator?.licenseNumber ?? ""} placeholder="MP-2021-88431" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="licenseExpiry">License Expiry</Label><Input id="licenseExpiry" name="licenseExpiry" type="date" defaultValue={operator?.licenseExpiry ? (operator.licenseExpiry as string).slice(0,10) : ""} /></div>
              <div className="space-y-2"><Label htmlFor="joiningDate">Joining Date</Label><Input id="joiningDate" name="joiningDate" type="date" defaultValue={operator?.joiningDate ? (operator.joiningDate as string).slice(0,10) : ""} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="salaryType">Salary Type</Label><select id="salaryType" name="salaryType" defaultValue={operator?.salaryType ?? "MONTHLY"} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"><option value="MONTHLY">Monthly</option><option value="DAILY">Daily</option><option value="HOURLY">Hourly</option></select></div>
              <div className="space-y-2"><Label htmlFor="salaryAmount">Salary Amount (₹)</Label><Input id="salaryAmount" name="salaryAmount" type="number" defaultValue={operator?.salaryAmount ?? ""} placeholder="22000" /></div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Avoid duplicating User — this form creates User + Operator in one transaction. Changing phone/email here updates login.</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} size="lg">{pending?"Saving...": isEdit?"Update Operator":"Create Operator"}</Button>
        <Button type="button" variant="outline" onClick={()=>history.back()}>Cancel</Button>
      </div>
      {state?.error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</p>}
    </form>
  );
}