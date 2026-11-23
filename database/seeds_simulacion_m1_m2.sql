-- ============================================================================
-- ERP Académico | Tribu 3 - Finanzas | Plan de Contingencia (Simulación M1/M2)
-- Archivo: database/seeds_simulacion_m1_m2.sql
-- Motor: PostgreSQL 15+ (Supabase)
-- Propósito:
--   Simular en modo SOLO LECTURA las tablas externas propiedad de:
--     * Módulo I (Configuración y Presupuestos):
--         - empresa
--         - plan_cuentas_pcge
--         - centro_costo
--         - presupuesto_detalle
--     * Módulo II (Motor Contable / Libro Diario):
--         - periodo_contable
--         - saldo_contable_mensual
--   Incluye saldos contables CUADRADOS (Activo = Pasivo + Patrimonio) para
--   Mes '00' (Apertura) y Mes '01' (Enero 2026) en moneda única 'PEN'.
-- ============================================================================

-- ============================================================================
-- BLOQUE A: TABLAS EXTERNAS SIMULADAS DEL MÓDULO I (SOLO LECTURA PARA M3)
-- ============================================================================

-- 1. empresa (Módulo I)
CREATE TABLE IF NOT EXISTS empresa (
    id                  BIGSERIAL PRIMARY KEY,
    ruc                 CHAR(11) NOT NULL UNIQUE,
    razon_social        VARCHAR(180) NOT NULL,
    nombre_comercial    VARCHAR(150),
    tipo_entorno        VARCHAR(25) NOT NULL DEFAULT 'OFICIAL'
                        CHECK (tipo_entorno IN ('OFICIAL', 'PRUEBA_CAPACITACION')),
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sim_m1',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE empresa IS '[SIMULACIÓN M1 - SOLO LECTURA M3] Maestro multiempresa en moneda PEN.';

-- 2. plan_cuentas_pcge (Módulo I - Alineado a SUNAT Tabla 17)
CREATE TABLE IF NOT EXISTS plan_cuentas_pcge (
    id                  BIGSERIAL PRIMARY KEY,
    empresa_id          BIGINT NOT NULL REFERENCES empresa(id),
    codigo_cuenta       VARCHAR(12) NOT NULL,
    nombre_cuenta       VARCHAR(180) NOT NULL,
    elemento            CHAR(1) NOT NULL CHECK (elemento IN ('1','2','3','4','5','6','7','8','9','0')),
    tipo_cuenta         VARCHAR(20) NOT NULL
                        CHECK (tipo_cuenta IN ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO', 'RESULTADO')),
    naturaleza          CHAR(1) NOT NULL CHECK (naturaleza IN ('D', 'A')),
    es_imputable        BOOLEAN NOT NULL DEFAULT TRUE,
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sim_m1',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pcge_emp_codigo UNIQUE (empresa_id, codigo_cuenta)
);

COMMENT ON TABLE plan_cuentas_pcge IS '[SIMULACIÓN M1 - SOLO LECTURA M3] Plan Contable General Empresarial (PCGE).';

-- 3. centro_costo (Módulo I)
CREATE TABLE IF NOT EXISTS centro_costo (
    id                  BIGSERIAL PRIMARY KEY,
    empresa_id          BIGINT NOT NULL REFERENCES empresa(id),
    codigo              VARCHAR(20) NOT NULL,
    nombre              VARCHAR(120) NOT NULL,
    responsable         VARCHAR(120),
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sim_m1',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cc_emp_codigo UNIQUE (empresa_id, codigo)
);

COMMENT ON TABLE centro_costo IS '[SIMULACIÓN M1 - SOLO LECTURA M3] Catálogo de centros de costo por empresa.';

-- 4. presupuesto_detalle (Módulo I)
CREATE TABLE IF NOT EXISTS presupuesto_detalle (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL REFERENCES empresa(id),
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    centro_costo_id         BIGINT NOT NULL REFERENCES centro_costo(id),
    cuenta_pcge_codigo      VARCHAR(12) NOT NULL,
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    monto_presupuestado_pen NUMERIC(18, 2) NOT NULL CHECK (monto_presupuestado_pen >= 0),
    estado                  VARCHAR(20) NOT NULL DEFAULT 'APROBADO'
                            CHECK (estado IN ('BORRADOR', 'APROBADO')),
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sim_m1',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pres_det_emp_per_cc_cta UNIQUE (empresa_id, anio, mes, centro_costo_id, cuenta_pcge_codigo)
);

COMMENT ON TABLE presupuesto_detalle IS '[SIMULACIÓN M1 - SOLO LECTURA M3] Presupuesto mensual aprobado por centro de costo y cuenta PCGE en PEN.';

-- ============================================================================
-- BLOQUE B: TABLAS EXTERNAS SIMULADAS DEL MÓDULO II (SOLO LECTURA PARA M3)
-- ============================================================================

-- 5. periodo_contable (Módulo II)
CREATE TABLE IF NOT EXISTS periodo_contable (
    id                  BIGSERIAL PRIMARY KEY,
    empresa_id          BIGINT NOT NULL REFERENCES empresa(id),
    anio                SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                 CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    descripcion         VARCHAR(60) NOT NULL,
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE NOT NULL,
    estado_cierre       VARCHAR(20) NOT NULL DEFAULT 'ABIERTO'
                        CHECK (estado_cierre IN ('ABIERTO', 'CERRADO_PARCIAL', 'CERRADO')),
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sim_m2',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_periodo_emp_anio_mes UNIQUE (empresa_id, anio, mes)
);

COMMENT ON TABLE periodo_contable IS '[SIMULACIÓN M2 - SOLO LECTURA M3] Periodos contables 00 a 13 por empresa.';

-- 6. saldo_contable_mensual (Módulo II)
CREATE TABLE IF NOT EXISTS saldo_contable_mensual (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL REFERENCES empresa(id),
    periodo_id              BIGINT NOT NULL REFERENCES periodo_contable(id),
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    cuenta_pcge_codigo      VARCHAR(12) NOT NULL,
    centro_costo_codigo     VARCHAR(20), -- Opcional para cuentas de gasto/costo
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    debe_pen                NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (debe_pen >= 0),
    haber_pen               NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (haber_pen >= 0),
    saldo_deudor_pen        NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (saldo_deudor_pen >= 0),
    saldo_acreedor_pen      NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (saldo_acreedor_pen >= 0),
    lote_cierre_codigo      VARCHAR(50) NOT NULL DEFAULT 'LOTE-SIM-2026',
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sim_m2',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE saldo_contable_mensual IS '[SIMULACIÓN M2 - SOLO LECTURA M3] Saldos contables consolidados mensuales en PEN (cuadrados).';
CREATE INDEX IF NOT EXISTS idx_saldo_m2_emp_periodo ON saldo_contable_mensual (empresa_id, anio, mes, cuenta_pcge_codigo);

-- ============================================================================
-- BLOQUE C: INSERCIÓN DE DATOS DE SIMULACIÓN (MULTIEMPRESA, PEN, MES 00 Y 01)
-- ============================================================================

-- 1. Empresas (Oficial y Prueba/Capacitación)
INSERT INTO empresa (id, ruc, razon_social, nombre_comercial, tipo_entorno, moneda, creado_por)
VALUES
    (1, '20601234561', 'CORPORACIÓN ANDINA DE DISTRIBUCIÓN S.A.C.', 'Corporación Andina', 'OFICIAL', 'PEN', 'seed_m1'),
    (2, '20609876543', 'COMERCIAL AREQUIPA DEMO S.A.C.', 'Comercial Arequipa Demo', 'PRUEBA_CAPACITACION', 'PEN', 'seed_m1')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('empresa', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM empresa), 2));

-- 2. Plan de Cuentas PCGE para ambas empresas
INSERT INTO plan_cuentas_pcge (empresa_id, codigo_cuenta, nombre_cuenta, elemento, tipo_cuenta, naturaleza, moneda, creado_por)
SELECT e.id, c.codigo, c.nombre, c.elem, c.tipo, c.nat, 'PEN', 'seed_m1'
FROM empresa e
CROSS JOIN (VALUES
    ('101', 'Caja y Bancos - Moneda Nacional',                  '1', 'ACTIVO',     'D'),
    ('121', 'Facturas, Boletas y Otros Comprobantes por Cobrar','1', 'ACTIVO',     'D'),
    ('141', 'Cuentas por Cobrar al Personal y Otras',           '1', 'ACTIVO',     'D'),
    ('182', 'Seguros y Servicios Contratados por Anticipado',   '1', 'ACTIVO',     'D'),
    ('201', 'Mercaderías Manufacturadas',                       '2', 'ACTIVO',     'D'),
    ('331', 'Propiedades, Planta y Equipo',                     '3', 'ACTIVO',     'D'),
    ('391', 'Depreciación Acumulada',                           '3', 'ACTIVO',     'A'),
    ('401', 'Gobierno Nacional - Tributos por Pagar',           '4', 'PASIVO',     'A'),
    ('411', 'Remuneraciones por Pagar',                         '4', 'PASIVO',     'A'),
    ('421', 'Facturas, Boletas y Otros Comprobantes por Pagar', '4', 'PASIVO',     'A'),
    ('451', 'Préstamos de Instituciones Financieras LP',        '4', 'PASIVO',     'A'),
    ('501', 'Capital Social',                                   '5', 'PATRIMONIO', 'A'),
    ('582', 'Reserva Legal',                                    '5', 'PATRIMONIO', 'A'),
    ('591', 'Utilidades No Distribuidas',                       '5', 'PATRIMONIO', 'A'),
    ('673', 'Intereses por Préstamos y Gastos Financieros',     '6', 'GASTO',      'D'),
    ('691', 'Costo de Ventas - Mercaderías',                    '6', 'GASTO',      'D'),
    ('701', 'Ventas de Mercaderías',                            '7', 'INGRESO',    'A'),
    ('772', 'Rendimientos Ganados - Ingresos Financieros',      '7', 'INGRESO',    'A'),
    ('891', 'Resultado del Ejercicio',                          '8', 'RESULTADO',  'A'),
    ('941', 'Gastos de Administración',                         '9', 'GASTO',      'D'),
    ('951', 'Gastos de Ventas y Distribución',                  '9', 'GASTO',      'D')
) AS c(codigo, nombre, elem, tipo, nat)
WHERE e.id IN (1, 2)
ON CONFLICT (empresa_id, codigo_cuenta) DO NOTHING;

-- 3. Centros de Costo (Módulo I)
INSERT INTO centro_costo (empresa_id, codigo, nombre, responsable, moneda, creado_por)
VALUES
    -- Empresa 1
    (1, 'CC-ADM', 'Administración y Finanzas', 'Jefatura de Administración', 'PEN', 'seed_m1'),
    (1, 'CC-VEN', 'Ventas y Comercialización', 'Gerencia Comercial',         'PEN', 'seed_m1'),
    (1, 'CC-OPE', 'Operaciones y Logística',   'Jefatura de Operaciones',    'PEN', 'seed_m1'),
    (1, 'CC-TI',  'Tecnología y Sistemas',     'Coordinación de TI',         'PEN', 'seed_m1'),
    -- Empresa 2
    (2, 'CC-ADM', 'Administración General',    'Administración Demo',        'PEN', 'seed_m1'),
    (2, 'CC-VEN', 'Ventas Tienda Arequipa',    'Supervisión Comercial',      'PEN', 'seed_m1'),
    (2, 'CC-OPE', 'Almacén y Distribución',    'Jefatura Almacén',           'PEN', 'seed_m1')
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- 4. Periodos Contables 00 a 13 para el año 2026 (Módulo II)
INSERT INTO periodo_contable (empresa_id, anio, mes, descripcion, fecha_inicio, fecha_fin, estado_cierre, moneda, creado_por)
SELECT e.id, 2026, p.mes, p.desc_mes, p.f_ini, p.f_fin, p.estado, 'PEN', 'seed_m2'
FROM empresa e
CROSS JOIN (VALUES
    ('00', 'Apertura 2026',    DATE '2026-01-01', DATE '2026-01-01', 'CERRADO'),
    ('01', 'Enero 2026',       DATE '2026-01-01', DATE '2026-01-31', 'CERRADO'),
    ('02', 'Febrero 2026',     DATE '2026-02-01', DATE '2026-02-28', 'ABIERTO'),
    ('03', 'Marzo 2026',       DATE '2026-03-01', DATE '2026-03-31', 'ABIERTO'),
    ('04', 'Abril 2026',       DATE '2026-04-01', DATE '2026-04-30', 'ABIERTO'),
    ('05', 'Mayo 2026',        DATE '2026-05-01', DATE '2026-05-31', 'ABIERTO'),
    ('06', 'Junio 2026',       DATE '2026-06-01', DATE '2026-06-30', 'ABIERTO'),
    ('07', 'Julio 2026',       DATE '2026-07-01', DATE '2026-07-31', 'ABIERTO'),
    ('08', 'Agosto 2026',      DATE '2026-08-01', DATE '2026-08-31', 'ABIERTO'),
    ('09', 'Septiembre 2026',  DATE '2026-09-01', DATE '2026-09-30', 'ABIERTO'),
    ('10', 'Octubre 2026',     DATE '2026-10-01', DATE '2026-10-31', 'ABIERTO'),
    ('11', 'Noviembre 2026',   DATE '2026-11-01', DATE '2026-11-30', 'ABIERTO'),
    ('12', 'Diciembre 2026',   DATE '2026-12-01', DATE '2026-12-31', 'ABIERTO'),
    ('13', 'Cierre Anual 2026',DATE '2026-12-31', DATE '2026-12-31', 'ABIERTO')
) AS p(mes, desc_mes, f_ini, f_fin, estado)
WHERE e.id IN (1, 2)
ON CONFLICT (empresa_id, anio, mes) DO NOTHING;

-- 5. Presupuesto Detalle (Módulo I) - Mes 01 (Enero 2026) en PEN
INSERT INTO presupuesto_detalle (empresa_id, anio, mes, centro_costo_id, cuenta_pcge_codigo, moneda, monto_presupuestado_pen, estado, creado_por)
SELECT cc.empresa_id, 2026, '01', cc.id, v.cuenta, 'PEN', v.monto, 'APROBADO', 'seed_m1'
FROM (VALUES
    -- Empresa 1: casos Normal, Alerta (85-100%) y Sobreejecución (>100%)
    (1, 'CC-OPE', '691', 135000.00), -- Ejecutado: 132,000.00 (97.78% -> ALERTA)
    (1, 'CC-VEN', '951',  25000.00), -- Ejecutado:  30,000.00 (120.00% -> SOBREEJECUCION)
    (1, 'CC-ADM', '941',  26000.00), -- Ejecutado:  22,000.00 (84.62% -> NORMAL)
    (1, 'CC-TI',  '941',  12000.00), -- Ejecutado:  14,000.00 (116.67% -> SOBREEJECUCION)
    (1, 'CC-ADM', '673',   7000.00), -- Ejecutado:   6,500.00 (92.86% -> ALERTA)
    -- Empresa 2
    (2, 'CC-OPE', '691',  70000.00), -- Ejecutado:  74,000.00 (105.71% -> SOBREEJECUCION)
    (2, 'CC-VEN', '951',  15000.00), -- Ejecutado:  16,500.00 (110.00% -> SOBREEJECUCION)
    (2, 'CC-ADM', '941',  14000.00), -- Ejecutado:  12,000.00 (85.71% -> ALERTA)
    (2, 'CC-ADM', '673',   4000.00)  -- Ejecutado:   3,300.00 (82.50% -> NORMAL)
) AS v(emp_id, cc_cod, cuenta, monto)
JOIN centro_costo cc ON cc.empresa_id = v.emp_id AND cc.codigo = v.cc_cod
ON CONFLICT (empresa_id, anio, mes, centro_costo_id, cuenta_pcge_codigo) DO NOTHING;

-- 6. Saldos Contables Mensuales CUADRADOS (Módulo II)
-- Limpiamos lotes simulados previos para garantizar idempotencia
DELETE FROM saldo_contable_mensual WHERE lote_cierre_codigo IN ('LOTE-SIM-2026-00', 'LOTE-SIM-2026-01');

-- 6.1 EMPRESA 1 - MES 00 (Apertura 2026)
-- Total Activo Neto = 850,000.00 | Total Pasivo = 350,000.00 | Total Patrimonio = 500,000.00
-- Verificación: 850,000.00 = 350,000.00 + 500,000.00 (CUADRADO)
INSERT INTO saldo_contable_mensual
    (empresa_id, periodo_id, anio, mes, cuenta_pcge_codigo, centro_costo_codigo, moneda, debe_pen, haber_pen, saldo_deudor_pen, saldo_acreedor_pen, lote_cierre_codigo, creado_por)
SELECT 1, p.id, 2026, '00', s.cta, NULL, 'PEN', s.debe, s.haber, s.s_deu, s.s_acr, 'LOTE-SIM-2026-00', 'seed_m2'
FROM periodo_contable p
CROSS JOIN (VALUES
    ('101', 185000.00,      0.00, 185000.00,      0.00),
    ('121', 120000.00,      0.00, 120000.00,      0.00),
    ('141',  15000.00,      0.00,  15000.00,      0.00),
    ('182',  20000.00,      0.00,  20000.00,      0.00),
    ('201', 160000.00,      0.00, 160000.00,      0.00),
    ('331', 420000.00,      0.00, 420000.00,      0.00),
    ('391',      0.00,  70000.00,      0.00,  70000.00),
    ('401',      0.00,  32000.00,      0.00,  32000.00),
    ('411',      0.00,  28000.00,      0.00,  28000.00),
    ('421',      0.00, 140000.00,      0.00, 140000.00),
    ('451',      0.00, 150000.00,      0.00, 150000.00),
    ('501',      0.00, 400000.00,      0.00, 400000.00),
    ('582',      0.00,  40000.00,      0.00,  40000.00),
    ('591',      0.00,  60000.00,      0.00,  60000.00)
) AS s(cta, debe, haber, s_deu, s_acr)
WHERE p.empresa_id = 1 AND p.anio = 2026 AND p.mes = '00';

-- 6.2 EMPRESA 1 - MES 01 (Enero 2026)
-- Balance General: Activo Neto = 895,000.00 | Pasivo = 355,000.00 | Patrimonio (incl. Resultado 40,000) = 540,000.00 -> CUADRADO
-- Estado de Resultados: Ingresos (240,000 + 4,500) - Costos/Gastos (132,000 + 30,000 + 36,000 + 6,500) = 40,000.00
INSERT INTO saldo_contable_mensual
    (empresa_id, periodo_id, anio, mes, cuenta_pcge_codigo, centro_costo_codigo, moneda, debe_pen, haber_pen, saldo_deudor_pen, saldo_acreedor_pen, lote_cierre_codigo, creado_por)
SELECT 1, p.id, 2026, '01', s.cta, s.cc, 'PEN', s.debe, s.haber, s.s_deu, s.s_acr, 'LOTE-SIM-2026-01', 'seed_m2'
FROM periodo_contable p
CROSS JOIN (VALUES
    -- Cuentas de Balance (acumuladas a fin de Mes 01)
    ('101', NULL,     385000.00, 161000.00, 224000.00,      0.00),
    ('121', NULL,     288000.00, 140000.00, 148000.00,      0.00),
    ('141', NULL,      18000.00,   2000.00,  16000.00,      0.00),
    ('182', NULL,      20000.00,   2000.00,  18000.00,      0.00),
    ('201', NULL,     276000.00, 132000.00, 144000.00,      0.00),
    ('331', NULL,     420000.00,      0.00, 420000.00,      0.00),
    ('391', NULL,          0.00,  75000.00,      0.00,  75000.00),
    ('401', NULL,      24000.00,  62000.00,      0.00,  38000.00),
    ('411', NULL,      25000.00,  56000.00,      0.00,  31000.00),
    ('421', NULL,     110000.00, 256000.00,      0.00, 146000.00),
    ('451', NULL,      10000.00, 150000.00,      0.00, 140000.00),
    ('501', NULL,          0.00, 400000.00,      0.00, 400000.00),
    ('582', NULL,          0.00,  40000.00,      0.00,  40000.00),
    ('591', NULL,          0.00,  60000.00,      0.00,  60000.00),
    ('891', NULL,          0.00,  40000.00,      0.00,  40000.00),
    -- Cuentas de Resultados y Ejecución Presupuestal por Centro de Costo (Mes 01)
    ('701', 'CC-VEN',      0.00, 240000.00,      0.00, 240000.00),
    ('691', 'CC-OPE', 132000.00,      0.00, 132000.00,      0.00),
    ('951', 'CC-VEN',  30000.00,      0.00,  30000.00,      0.00),
    ('941', 'CC-ADM',  22000.00,      0.00,  22000.00,      0.00),
    ('941', 'CC-TI',   14000.00,      0.00,  14000.00,      0.00),
    ('772', 'CC-ADM',      0.00,   4500.00,      0.00,   4500.00),
    ('673', 'CC-ADM',   6500.00,      0.00,   6500.00,      0.00)
) AS s(cta, cc, debe, haber, s_deu, s_acr)
WHERE p.empresa_id = 1 AND p.anio = 2026 AND p.mes = '01';

-- 6.3 EMPRESA 2 - MES 00 (Apertura 2026)
-- Total Activo Neto = 350,000.00 | Total Pasivo = 230,000.00 | Total Patrimonio = 120,000.00 -> CUADRADO
INSERT INTO saldo_contable_mensual
    (empresa_id, periodo_id, anio, mes, cuenta_pcge_codigo, centro_costo_codigo, moneda, debe_pen, haber_pen, saldo_deudor_pen, saldo_acreedor_pen, lote_cierre_codigo, creado_por)
SELECT 2, p.id, 2026, '00', s.cta, NULL, 'PEN', s.debe, s.haber, s.s_deu, s.s_acr, 'LOTE-SIM-2026-00', 'seed_m2'
FROM periodo_contable p
CROSS JOIN (VALUES
    ('101',  62000.00,      0.00,  62000.00,      0.00),
    ('121',  48000.00,      0.00,  48000.00,      0.00),
    ('201',  90000.00,      0.00,  90000.00,      0.00),
    ('331', 180000.00,      0.00, 180000.00,      0.00),
    ('391',      0.00,  30000.00,      0.00,  30000.00),
    ('401',      0.00,  18000.00,      0.00,  18000.00),
    ('411',      0.00,  14000.00,      0.00,  14000.00),
    ('421',      0.00, 118000.00,      0.00, 118000.00),
    ('451',      0.00,  80000.00,      0.00,  80000.00),
    ('501',      0.00, 100000.00,      0.00, 100000.00),
    ('582',      0.00,   8000.00,      0.00,   8000.00),
    ('591',      0.00,  12000.00,      0.00,  12000.00)
) AS s(cta, debe, haber, s_deu, s_acr)
WHERE p.empresa_id = 2 AND p.anio = 2026 AND p.mes = '00';

-- 6.4 EMPRESA 2 - MES 01 (Enero 2026)
-- Balance General: Activo Neto = 355,000.00 | Pasivo = 230,000.00 | Patrimonio (incl. Resultado 5,000) = 125,000.00 -> CUADRADO
-- Estado de Resultados: Ingresos (110,000 + 800) - Costos/Gastos (74,000 + 16,500 + 12,000 + 3,300) = 5,000.00
INSERT INTO saldo_contable_mensual
    (empresa_id, periodo_id, anio, mes, cuenta_pcge_codigo, centro_costo_codigo, moneda, debe_pen, haber_pen, saldo_deudor_pen, saldo_acreedor_pen, lote_cierre_codigo, creado_por)
SELECT 2, p.id, 2026, '01', s.cta, s.cc, 'PEN', s.debe, s.haber, s.s_deu, s.s_acr, 'LOTE-SIM-2026-01', 'seed_m2'
FROM periodo_contable p
CROSS JOIN (VALUES
    ('101', NULL,     144000.00,  90000.00,  54000.00,      0.00),
    ('121', NULL,     128000.00,  70000.00,  58000.00,      0.00),
    ('201', NULL,     170000.00,  74000.00,  96000.00,      0.00),
    ('331', NULL,     180000.00,      0.00, 180000.00,      0.00),
    ('391', NULL,          0.00,  33000.00,      0.00,  33000.00),
    ('401', NULL,      11000.00,  32000.00,      0.00,  21000.00),
    ('411', NULL,      12000.00,  28000.00,      0.00,  16000.00),
    ('421', NULL,      68000.00, 186000.00,      0.00, 118000.00),
    ('451', NULL,       5000.00,  80000.00,      0.00,  75000.00),
    ('501', NULL,          0.00, 100000.00,      0.00, 100000.00),
    ('582', NULL,          0.00,   8000.00,      0.00,   8000.00),
    ('591', NULL,          0.00,  12000.00,      0.00,  12000.00),
    ('891', NULL,          0.00,   5000.00,      0.00,   5000.00),
    ('701', 'CC-VEN',      0.00, 110000.00,      0.00, 110000.00),
    ('691', 'CC-OPE',  74000.00,      0.00,  74000.00,      0.00),
    ('951', 'CC-VEN',  16500.00,      0.00,  16500.00,      0.00),
    ('941', 'CC-ADM',  12000.00,      0.00,  12000.00,      0.00),
    ('772', 'CC-ADM',      0.00,    800.00,      0.00,    800.00),
    ('673', 'CC-ADM',   3300.00,      0.00,   3300.00,      0.00)
) AS s(cta, cc, debe, haber, s_deu, s_acr)
WHERE p.empresa_id = 2 AND p.anio = 2026 AND p.mes = '01';

-- ============================================================================
-- BLOQUE D: VISTAS DE CONSUMO EN MODO SOLO LECTURA PARA MÓDULO III
-- ============================================================================
CREATE OR REPLACE VIEW vw_m3_consumo_saldos_m2 AS
SELECT
    s.empresa_id,
    e.ruc,
    e.razon_social,
    s.anio,
    s.mes,
    s.cuenta_pcge_codigo,
    c.nombre_cuenta,
    c.tipo_cuenta,
    s.centro_costo_codigo,
    s.moneda,
    s.saldo_deudor_pen,
    s.saldo_acreedor_pen,
    (s.saldo_deudor_pen - s.saldo_acreedor_pen) AS saldo_neto_deudor_pen,
    p.estado_cierre
FROM saldo_contable_mensual s
JOIN empresa e ON e.id = s.empresa_id
JOIN periodo_contable p ON p.id = s.periodo_id
JOIN plan_cuentas_pcge c ON c.empresa_id = s.empresa_id AND c.codigo_cuenta = s.cuenta_pcge_codigo;

CREATE OR REPLACE VIEW vw_m3_consumo_presupuesto_vs_ejecutado AS
SELECT
    pd.empresa_id,
    pd.anio,
    pd.mes,
    cc.codigo AS centro_costo_codigo,
    cc.nombre AS centro_costo_nombre,
    pd.cuenta_pcge_codigo,
    c.nombre_cuenta,
    pd.moneda,
    pd.monto_presupuestado_pen,
    COALESCE(SUM(s.saldo_deudor_pen), 0.00) AS monto_ejecutado_pen,
    COALESCE(SUM(s.saldo_deudor_pen), 0.00) - pd.monto_presupuestado_pen AS variacion_absoluta_pen,
    CASE
        WHEN pd.monto_presupuestado_pen = 0 THEN 0.00
        ELSE ROUND(((COALESCE(SUM(s.saldo_deudor_pen), 0.00) - pd.monto_presupuestado_pen) / pd.monto_presupuestado_pen) * 100, 2)
    END AS variacion_porcentual
FROM presupuesto_detalle pd
JOIN centro_costo cc ON cc.id = pd.centro_costo_id
JOIN plan_cuentas_pcge c ON c.empresa_id = pd.empresa_id AND c.codigo_cuenta = pd.cuenta_pcge_codigo
LEFT JOIN saldo_contable_mensual s
    ON s.empresa_id = pd.empresa_id
   AND s.anio = pd.anio
   AND s.mes = pd.mes
   AND s.cuenta_pcge_codigo = pd.cuenta_pcge_codigo
   AND s.centro_costo_codigo = cc.codigo
GROUP BY
    pd.empresa_id, pd.anio, pd.mes, cc.codigo, cc.nombre,
    pd.cuenta_pcge_codigo, c.nombre_cuenta, pd.moneda, pd.monto_presupuestado_pen;

-- ============================================================================
-- BLOQUE E: SEED CONDICIONAL DE MAPEO PCGE -> RUBROS SUNAT T34 (SI EXISTE M3)
-- ============================================================================
DO $$
BEGIN
    IF to_regclass('public.m3_mapeo_pcge_rubro') IS NOT NULL THEN
        INSERT INTO m3_mapeo_pcge_rubro (empresa_id, cuenta_pcge_prefijo, codigo_rubro, signo_aplicacion, moneda, creado_por)
        SELECT e.id, m.prefijo, m.rubro, m.signo, 'PEN', 'seed_m3_sim'
        FROM empresa e
        CROSS JOIN (VALUES
            ('10', '1D0109',  1),
            ('12', '1D0103',  1),
            ('14', '1D0105',  1),
            ('20', '1D0106',  1),
            ('18', '1D0112',  1),
            ('33', '1D0205',  1),
            ('39', '1D0205', -1),
            ('40', '1D0301',  1),
            ('41', '1D0302',  1),
            ('42', '1D0303',  1),
            ('45', '1D0401',  1),
            ('50', '1D0701',  1),
            ('58', '1D0704',  1),
            ('59', '1D0707',  1),
            ('89', '1D0708',  1),
            ('70', '2D0101',  1),
            ('69', '2D0201',  1),
            ('95', '2D0301',  1),
            ('94', '2D0302',  1),
            ('77', '2D0401',  1),
            ('67', '2D0402',  1)
        ) AS m(prefijo, rubro, signo)
        WHERE e.id IN (1, 2)
        ON CONFLICT (empresa_id, cuenta_pcge_prefijo, codigo_rubro) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- BLOQUE F: GOBERNANZA DE SOLO LECTURA (REFERENCIA SUPABASE / RLS)
-- ============================================================================
-- En Supabase, otorgar únicamente SELECT sobre las tablas de M1 y M2 al rol de M3:
--   REVOKE INSERT, UPDATE, DELETE ON empresa, plan_cuentas_pcge, centro_costo,
--       presupuesto_detalle, periodo_contable, saldo_contable_mensual FROM authenticated;
--   GRANT SELECT ON empresa, plan_cuentas_pcge, centro_costo,
--       presupuesto_detalle, periodo_contable, saldo_contable_mensual TO authenticated;
