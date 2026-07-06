import { EmptyState } from "@/src/shared/components/empty-state";
import { PageHeader } from "@/src/shared/components/page-header";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

type ModulePageProps = {
  title: string;
  description: string;
};

export function ModulePage({ title, description }: ModulePageProps) {
  return (
    <ProtectedLayout>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Em desenvolvimento"
        description="A infraestrutura visual desta página já está disponível. As regras de negócio, integração com API e fluxos operacionais serão implementados nas próximas sprints."
      />
    </ProtectedLayout>
  );
}
