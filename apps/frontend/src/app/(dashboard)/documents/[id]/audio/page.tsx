import DocumentAudioPageView from '@/features/audio/components/DocumentAudioPageView';

type DocumentAudioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentAudioPage({
  params,
}: DocumentAudioPageProps) {
  const { id } = await params;

  return <DocumentAudioPageView documentId={id} />;
}