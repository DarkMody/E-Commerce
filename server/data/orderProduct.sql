CREATE TABLE IF NOT EXISTS order_product (
    product_id UUID NOT NULL REFERENCES products(p_id),
    order_id UUID NOT NULL REFERENCES orders(o_id) ON DELETE CASCADE,
	quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1)
)