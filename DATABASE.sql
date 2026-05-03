CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    role VARCHAR(50),
    phone VARCHAR(255),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
    CHECK (role IN ('STUDENT','ADMIN','FACULTY','TNP'))
);

CREATE TABLE halls (
    hall_id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INT NOT NULL,

    location VARCHAR(255),
    amenities VARCHAR(255),

    is_active BOOLEAN DEFAULT true,
    image_urls VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    visibility VARCHAR(50),
    coordinator_email VARCHAR(255),
    type VARCHAR(50),

    CONSTRAINT check_hall_type
    CHECK (type IN ('LAB','HALL','CLASSROOM','CABIN')),

    CONSTRAINT halls_visibility_check
    CHECK (visibility IN ('PUBLIC','TNP_ONLY'))
);

CREATE TABLE booking (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    hall_id BIGINT NOT NULL,

    description VARCHAR(255) NOT NULL,
    student_count INT,

    status VARCHAR(50) DEFAULT 'PENDING',
    admin_note VARCHAR(255),

    approved_by BIGINT,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    start_time TIMESTAMP,
    end_time TIMESTAMP,

    club_name VARCHAR(255),
    designation VARCHAR(255),
    event_type VARCHAR(255),
    event_title VARCHAR(255),

    resources_needed VARCHAR(255),

    contact_phone VARCHAR(255),
    coordinator_name VARCHAR(255),
    coordinator_phone VARCHAR(255),

    CONSTRAINT booking_status_check
    CHECK (status IN ('APPROVED','PENDING','REJECTED','CANCELLED')),

    -- 🔗 FOREIGN KEYS
    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    CONSTRAINT fk_booking_hall
        FOREIGN KEY (hall_id) REFERENCES halls(hall_id),

    CONSTRAINT fk_booking_admin
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE TABLE tnp_requests (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    company_name VARCHAR(255) NOT NULL,
    drive_type VARCHAR(100),

    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    expected_students INT,
    description TEXT,

    priority VARCHAR(20) DEFAULT 'HIGH',
    status VARCHAR(20) DEFAULT 'PENDING',

    admin_note TEXT,
    approved_by BIGINT,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    round_type VARCHAR(100),

    -- 🔗 FOREIGN KEYS
    CONSTRAINT fk_tnp_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

    CONSTRAINT fk_tnp_admin 
        FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE tnp_request_halls (
    id BIGSERIAL PRIMARY KEY,

    tnp_request_id BIGINT NOT NULL,
    hall_id BIGINT NOT NULL,

    requirement_type VARCHAR(100),

    -- 🔗 FOREIGN KEYS
    CONSTRAINT fk_tnp_req
        FOREIGN KEY (tnp_request_id) REFERENCES tnp_requests(id) ON DELETE CASCADE,

    CONSTRAINT fk_tnp_hall
        FOREIGN KEY (hall_id) REFERENCES halls(hall_id) ON DELETE CASCADE
);