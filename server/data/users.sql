CREATE TABLE IF NOT EXISTS users (
    u_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) not null,
    email VARCHAR(100) UNIQUE not null,
    password VARCHAR(255) not null,
    image TEXT DEFAULT 'https://res.cloudinary.com/i8dsiy94/image/upload/v1795205345/download.jpg',
    role VARCHAR(10) DEFAULT 'customer' NOT NULL CHECK (role IN ('customer', 'seller', 'admin', 'manager', 'employee')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);