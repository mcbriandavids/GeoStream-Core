-- Creates the 'wells' table
CREATE TABLE wells (
    -- Auto-incrementing integer primary key
    id INT IDENTITY(1,1) PRIMARY KEY,
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
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    -- Foreign key referencing wells(id); deletes logs if well is removed
    well_id INT REFERENCES wells(id) ON DELETE CASCADE,
    -- Measured depth along the wellbore in meters (required)
    measured_depth DECIMAL(8,2) NOT NULL,
    -- True vertical depth subsea in meters (required)
    tvdss DECIMAL(8,2) NOT NULL,
    -- Gamma ray measurement in API units (optional)
    gamma_ray DECIMAL(5,2),
    -- Resistivity measurement in ohm-meters (optional)
    resistivity DECIMAL(7,2),
    -- Volume of shale as a fraction (optional)
    v_shale DECIMAL(4,3),
    -- Lithology identifier string (optional)
    lithology_flag VARCHAR(20),
    -- Record timestamp; defaults to insertion time
    [timestamp] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    
-- =========================================================================
-- SUBSURFACE SCHEMA EVOLUTION: INTEGRATING ADVANCED PETROPHYSICAL CURVES
-- =========================================================================

    -- Neutron porosity (NPHI)
    neutron_porosity DECIMAL(5,4) CHECK (neutron_porosity BETWEEN -0.15 AND 1.00),

    -- Bulk density (RHOB)
    bulk_density DECIMAL(4,3) CHECK (bulk_density BETWEEN 1.00 AND 3.50),

    -- Acoustic interval transit delta-time (DT)
    delta_time DECIMAL(5,2) CHECK (delta_time BETWEEN 30.00 AND 200.00),

    -- Structural pay-zone indicator
    is_pay_zone BIT NOT NULL DEFAULT 0
);

-- Build high-speed performance indexes for composite depth lookups.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_well_logs_lookup' AND object_id = OBJECT_ID('well_logs'))
    CREATE INDEX idx_well_logs_lookup ON well_logs (well_id, measured_depth DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_well_logs_timestamp' AND object_id = OBJECT_ID('well_logs'))
    CREATE INDEX idx_well_logs_timestamp ON well_logs ([timestamp] DESC);



-- End of 'well_logs' table definition

-- Inserts a sample well record into the wells table
INSERT INTO wells (well_name, field_name, kb_elevation) 
-- Values: well name, field name, and KB elevation
VALUES ('OMU-04_ST1', 'OML-123_Swamp', 45.50);
