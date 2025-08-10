CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    number VARCHAR(255) NOT NULL UNIQUE,
    route VARCHAR(255) NOT NULL,
    date VARCHAR(255) NOT NULL,
    time VARCHAR(255) NOT NULL,
    gate VARCHAR(255) NOT NULL,
    interested INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'owner', 'hr', 'personnel'
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    staff_username VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'kick', 'warn', 'ban', 'other'
    target_user VARCHAR(255) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial user if not exists
INSERT INTO users (username, password, role, created_by)
VALUES ('rex', '887719', 'owner', 'system')
ON CONFLICT (username) DO NOTHING;
