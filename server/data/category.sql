CREATE TABLE IF NOT EXISTS category (
    c_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL unique
)