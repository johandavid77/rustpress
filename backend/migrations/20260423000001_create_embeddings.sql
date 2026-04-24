CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  embedding  vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id)
);

CREATE INDEX IF NOT EXISTS product_embeddings_idx 
  ON product_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
