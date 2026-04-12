'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { getDocumentById } from '@/features/documents/api/documents.api';
import type { DocumentDetailResponse } from '@/features/documents/types/documents.types';
import { getSummaries } from '@/features/summaries/api/summaries.api';
import type { SummaryItem } from '@/features/summaries/types/summaries.types';
import {
  createAudioVersion,
  deleteAudioVersion,
  getAudioFileBlob,
  getAudioVersions,
} from '../api/audio.api';
import type {
  AudioSourceType,
  AudioVersionItem,
  AudioVersionsListResponse,
} from '../types/audio.types';

type DocumentAudioPageViewProps = {
  documentId: string;
};

const PAGE_SIZE = 10;

const BUILT_IN_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return '—';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function DocumentAudioPageView({
  documentId,
}: DocumentAudioPageViewProps) {
  const [document, setDocument] = useState<DocumentDetailResponse | null>(null);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [audioVersions, setAudioVersions] = useState<AudioVersionItem[]>([]);
  const [pagination, setPagination] =
    useState<AudioVersionsListResponse['pagination']>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState<AudioSourceType>('DOCUMENT');
  const [summaryId, setSummaryId] = useState('');
  const [language, setLanguage] = useState('');
  const [voiceName, setVoiceName] = useState('alloy');
  const [speed, setSpeed] = useState('1');
  const [instructions, setInstructions] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function loadDocument() {
    const data = await getDocumentById(documentId);
    setDocument(data);
  }

  async function loadSummaries() {
    try {
      const data = await getSummaries({
        page: 1,
        limit: 100,
        documentId,
      });

      setSummaries(data.items);
    } catch {
      setSummaries([]);
    }
  }

  async function loadAudioVersions() {
    const data = await getAudioVersions({
      page: 1,
      limit: PAGE_SIZE,
      documentId,
    });

    setAudioVersions(data.items);
    setPagination(data.pagination);
  }

  async function loadPageData() {
    try {
      setLoading(true);
      await Promise.all([loadDocument(), loadSummaries(), loadAudioVersions()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể tải trang audio',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [documentId]);

  const selectedSummary = useMemo(
    () => summaries.find((item) => item.id === summaryId) || null,
    [summaries, summaryId],
  );

  async function handleGenerate() {
    if (sourceType === 'SUMMARY' && !summaryId) {
      toast.error('Anh cần chọn summary trước.');
      return;
    }

    try {
      setGenerating(true);

      await createAudioVersion({
        documentId,
        sourceType,
        sourceId: sourceType === 'SUMMARY' ? summaryId : undefined,
        language: language.trim() || undefined,
        voiceName,
        speed: Number(speed),
        instructions: instructions.trim() || undefined,
      });

      toast.success('Tạo audio thành công.');
      await loadAudioVersions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Tạo audio thất bại',
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handlePlay(audioId: string) {
    try {
      setPlayingAudioId(audioId);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const blob = await getAudioFileBlob(audioId);
      const nextUrl = URL.createObjectURL(blob);

      setAudioUrl(nextUrl);

      window.setTimeout(() => {
        audioRef.current?.play().catch(() => {
          toast.error('Không thể phát audio.');
        });
      }, 50);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể tải file audio',
      );
    } finally {
      setPlayingAudioId(null);
    }
  }

  async function handleDelete(audioId: string) {
    const confirmed = window.confirm('Xóa audio version này?');
    if (!confirmed) return;

    try {
      setDeletingId(audioId);
      await deleteAudioVersion(audioId);
      toast.success('Đã xóa audio.');
      await loadAudioVersions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Xóa audio thất bại',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="mt-6 h-[560px] animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-3">
            <Link
              href={`/documents/${documentId}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ← Về Document
            </Link>

            <Link
              href="/documents"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Documents
            </Link>
          </div>

          <p className="text-sm font-medium text-slate-500">Document Audio / TTS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {document?.title || 'Audio'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Tạo bản audio từ nội dung document hoặc summary. Lưu ý: đây là giọng nói do AI tạo ra.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Generate audio
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Dùng TTS để tạo file audio MP3 từ source text hiện có.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="audio-source-type"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Source type
                </label>
                <select
                  id="audio-source-type"
                  value={sourceType}
                  onChange={(e) =>
                    setSourceType(e.target.value as AudioSourceType)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="DOCUMENT">Document content</option>
                  <option value="SUMMARY">Summary</option>
                </select>
              </div>

              {sourceType === 'SUMMARY' ? (
                <div>
                  <label
                    htmlFor="audio-summary-source"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Summary source
                  </label>
                  <select
                    id="audio-summary-source"
                    value={summaryId}
                    onChange={(e) => setSummaryId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="">Chọn summary...</option>
                    {summaries.map((summary) => (
                      <option key={summary.id} value={summary.id}>
                        {summary.summaryType} — {summary.language}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="audio-language"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Language
                  </label>
                  <input
                    id="audio-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder={document?.sourceLanguage || 'vi / en / ja...'}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="audio-voice"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Voice
                  </label>
                  <select
                    id="audio-voice"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {BUILT_IN_VOICES.map((voice) => (
                      <option key={voice} value={voice}>
                        {voice}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="audio-speed"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Speed
                </label>
                <input
                  id="audio-speed"
                  type="number"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="audio-instructions"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Voice instructions
                </label>
                <textarea
                  id="audio-instructions"
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ví dụ: Giọng tự nhiên, chậm rãi, rõ ràng, thân thiện..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>
                  Document status:{' '}
                  <strong className="text-slate-800">{document?.status}</strong>
                </p>
                {selectedSummary ? (
                  <p className="mt-2">
                    Summary nguồn: <strong>{selectedSummary.summaryType}</strong>{' '}
                    • {selectedSummary.language}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating}
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {generating ? 'Đang tạo audio...' : 'Generate audio'}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Audio history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Danh sách các audio versions đã tạo cho tài liệu này.
              </p>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label
                htmlFor="audio-player"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Audio player
              </label>
              <audio
                id="audio-player"
                ref={audioRef}
                controls
                src={audioUrl || undefined}
                className="w-full"
              />
            </div>

            {audioVersions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl">
                  🔊
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Chưa có audio version nào
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Hãy tạo audio đầu tiên ở cột bên trái.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {audioVersions.map((audio) => (
                  <article
                    key={audio.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">
                          {audio.documentTitle || 'Untitled document'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {audio.sourceLabel}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            Voice {audio.voiceName}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            Speed {audio.speed}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {audio.language}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {audio.status}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            Duration {formatDuration(audio.durationSeconds)}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Created: {formatDate(audio.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handlePlay(audio.id)}
                          disabled={playingAudioId === audio.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {playingAudioId === audio.id ? 'Đang tải...' : 'Play'}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(audio.id)}
                          disabled={deletingId === audio.id}
                          className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === audio.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

                <div className="text-xs text-slate-400">
                  Showing {audioVersions.length} / {pagination.total} audio version(s)
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}