import WorkspaceChatView from '@/features/workspaces/components/WorkspaceChatView';

type WorkspaceChatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspaceChatPage({
  params,
}: WorkspaceChatPageProps) {
  const { id } = await params;

  return <WorkspaceChatView workspaceId={id} />;
}