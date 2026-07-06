import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function ModulePlaceholder({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: ModulePlaceholderProps) {
  return (
    <AppShell>
      <PageHeader title={title} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </AppShell>
  );
}
