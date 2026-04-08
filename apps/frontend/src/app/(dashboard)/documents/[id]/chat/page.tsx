import ChatBox from "@/features/chat/components/ChatBox";

type ChatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <div className="p-4 md:p-6">
      <ChatBox documentId={id} />
    </div>
  );
}