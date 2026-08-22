import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><div className="h-6 w-20 bg-muted rounded mb-2" /><div className="h-4 w-32 bg-muted/70 rounded" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>
    </div>
  );
}
