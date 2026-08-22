import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Construction } from "lucide-react";
export default function Page(){return (<div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground">Company and users — Phase 2</p></div><EmptyState icon={Construction} title="Coming in next phases" description="Shell ready." /><Card><CardHeader><CardTitle>Phase 1 — Design Shell</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">UI tokens live.</CardContent></Card></div>);}
