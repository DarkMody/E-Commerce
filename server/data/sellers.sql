CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    store_name VARCHAR(100),
    store_location TEXT,
    sub_type VARCHAR(100) DEFAULT 'PLAT',
    CONSTRAINT sellers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(u_id)
);