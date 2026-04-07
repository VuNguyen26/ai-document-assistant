CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "document_chunk_embeddings" (
  "id" TEXT NOT NULL,
  "chunk_id" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "dimensions" INTEGER NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_chunk_embeddings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_chunk_embeddings_chunk_id_key" UNIQUE ("chunk_id"),
  CONSTRAINT "document_chunk_embeddings_chunk_id_fkey"
    FOREIGN KEY ("chunk_id")
    REFERENCES "document_chunks"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "document_chunk_embeddings_chunk_id_idx"
  ON "document_chunk_embeddings"("chunk_id");