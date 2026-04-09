-- Ưu tiên READY nếu document đã có embedding
UPDATE "documents" d
SET "status" = 'READY'
WHERE d."deleted_at" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "document_chunks" dc
    INNER JOIN "document_chunk_embeddings" dce
      ON dce."chunk_id" = dc."id"
    WHERE dc."document_id" = d."id"
  );

-- Nếu đã có chunks nhưng chưa có embeddings thì là CHUNKED
UPDATE "documents" d
SET "status" = 'CHUNKED'
WHERE d."deleted_at" IS NULL
  AND d."status" <> 'READY'
  AND EXISTS (
    SELECT 1
    FROM "document_chunks" dc
    WHERE dc."document_id" = d."id"
  );

-- Nếu đã có extracted content nhưng chưa có chunks thì là EXTRACTED
UPDATE "documents" d
SET "status" = 'EXTRACTED'
WHERE d."deleted_at" IS NULL
  AND d."status" NOT IN ('READY', 'CHUNKED')
  AND EXISTS (
    SELECT 1
    FROM "document_contents" dc
    WHERE dc."document_id" = d."id"
  );

-- Nếu không còn FAILED thì dọn error_message
UPDATE "documents"
SET "error_message" = NULL
WHERE "status" <> 'FAILED';