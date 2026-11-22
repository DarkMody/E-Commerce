CREATE TABLE IF NOT EXISTS pending_product (
    product_id  UUID PRIMARY KEY REFERENCES products(p_id) ON DELETE CASCADE,
    name        VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);