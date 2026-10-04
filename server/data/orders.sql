CREATE TABLE IF NOT EXISTS orders (
    o_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(u_id),
    location    TEXT NOT NULL,
	phone_number VARCHAR(20) NOT NULL,
	status      VARCHAR(25) NOT NULL DEFAULT 'Processing' CHECK (status IN ('Processing', 'On the way', 'Delivered', 'Rejected')),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    method      VARCHAR(20) NOT NULL CHECK (method IN ('visa', 'cash')),
    created_at  TIMESTAMPTZ    DEFAULT NOW()
);