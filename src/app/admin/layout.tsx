import { requireAdmin } from "@/lib/auth-guards";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const activeMachineryCount = await prisma.machine.count({ where: { status: { not: "RETIRED" } } });
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeMachineryCount={activeMachineryCount} />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
