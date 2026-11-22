CREATE TABLE IF NOT EXISTS images (
	image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	image TEXT 	NOT NULL,
	product_id UUID NOT NULL REFERENCES products(p_id) ON DELETE CASCADE,
	sort_order 	INTEGER DEFAULT 0,
	created_at 	TIMESTAMP DEFAULT NOW(),
	accepted	BOOLEAN DEFAULT false
);