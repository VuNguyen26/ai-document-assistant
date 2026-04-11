import WorkspaceDetailView from '@/features/workspaces/components/WorkspaceDetailView';

type WorkspaceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  const { id } = await params;

  return <WorkspaceDetailView workspaceId={id} />;
}