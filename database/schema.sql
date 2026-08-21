-- Creates the 'wells' table
CREATE TABLE wells (
    -- Auto-incrementing integer primary key
    id SERIAL PRIMARY KEY,
    -- Well identifier (unique, required)
    well_name VARCHAR(100) NOT NULL UNIQUE,
    -- Field name where the well is located (required)
    field_name VARCHAR(100) NOT NULL,
    -- Kelly bushing elevation in meters (required)
    kb_elevation NUMERIC(6,2) NOT NULL
);
-- End of 'wells' table definition

-- Creates the 'well_logs' table
CREATE TABLE well_logs (
    -- Auto-incrementing big integer primary key
    id BIGSERIAL PRIMARY KEY,
    -- Foreign key referencing wells(id); deletes logs if well is removed
    well_id INT REFERENCES wells(id) ON DELETE CASCADE,
    -- Measured depth along the wellbore in meters (required)
    measured_depth NUMERIC(8,2) NOT NULL,
    -- True vertical depth subsea in meters (required)
    tvdss NUMERIC(8,2) NOT NULL,
    -- Gamma ray measurement in API units (optional)
    gamma_ray NUMERIC(5,2),
    -- Resistivity measurement in ohm-meters (optional)
    resistivity NUMERIC(7,2),
    -- Volume of shale as a fraction (optional)
    v_shale NUMERIC(4,3),
    -- Lithology identifier string (optional)
    lithology_flag VARCHAR(20),
    -- Record timestamp; defaults to insertion time
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- End of 'well_logs' table definition

-- Inserts a sample well record into the wells table
INSERT INTO wells (well_name, field_name, kb_elevation) 
-- Values: well name, field name, and KB elevation
VALUES ('OMU-04_ST1', 'OML-123_Swamp', 45.50);
