-- CreateTable
CREATE TABLE "chat_citations" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "chunk_id" TEXT,
    "document_id" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "char_count" INTEGER NOT NULL,
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "distance" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_citations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_citations_message_id_idx" ON "chat_citations"("message_id");
CREATE INDEX "chat_citations_chunk_id_idx" ON "chat_citations"("chunk_id");
CREATE INDEX "chat_citations_document_id_idx" ON "chat_citations"("document_id");

ALTER TABLE "chat_citations"
ADD CONSTRAINT "chat_citations_message_id_fkey"
FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;