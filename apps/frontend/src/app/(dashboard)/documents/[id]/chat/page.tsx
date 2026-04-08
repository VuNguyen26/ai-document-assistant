import ChatDocumentPageView from "@/features/chat/components/ChatDocumentPageView";

type DocumentChatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentChatPage({
  params,
}: DocumentChatPageProps) {
  const { id } = await params;

  return <ChatDocumentPageView documentId={id} />;
}