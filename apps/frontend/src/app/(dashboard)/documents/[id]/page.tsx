import DocumentDetailView from "@/features/documents/components/DocumentDetailView";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;

  return <DocumentDetailView documentId={id} />;
}