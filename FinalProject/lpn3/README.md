# en la db
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON face_embeddings USING ivfflat (embedding vector_cosine_ops);
SET enable_seqscan = OFF;