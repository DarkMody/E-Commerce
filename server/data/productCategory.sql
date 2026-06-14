CREATE TABLE IF NOT EXISTS product_category (
    product_id UUID NOT NULL REFERENCES products(p_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES category(c_id) ON DELETE CASCADE
)