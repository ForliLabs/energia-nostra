import { PageHeader } from "@/components/ui/page-header";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Caricamento"
        title="Sto preparando la dashboard"
        description="Raccogliamo dati energia, notifiche e indicatori prima di mostrarti la panoramica aggiornata."
      />
      <StatsSkeleton />
      <div className="grid gap-6 xl:grid-cols-2">
        <TableSkeleton rows={4} columns={2} />
        <TableSkeleton rows={4} columns={2} />
      </div>
    </div>
  );
}
