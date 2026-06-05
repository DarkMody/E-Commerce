CREATE TABLE IF NOT EXISTS users (
    u_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(10) DEFAULT 'customer'
);