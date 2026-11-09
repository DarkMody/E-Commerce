CREATE TABLE IF NOT EXISTS products (
    p_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)   NOT NULL,
    description TEXT,
    price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    quantity    INT            NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    seller_id   UUID           NOT NULL REFERENCES users(u_id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ    DEFAULT NOW(),
    sold        INT DEFAULT 0,
    discount    INT DEFAULT 0 CHECK (discount BETWEEN 0 AND 100)
);