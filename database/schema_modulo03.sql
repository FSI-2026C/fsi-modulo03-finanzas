-- ============================================================================
-- ERP Académico | Tribu 3 - Finanzas | Módulo III:
-- Estados Financieros, Control Presupuestal y Analítica
-- Archivo: database/schema_modulo03.sql
-- Motor: PostgreSQL 15+ (Supabase)
-- Convenciones:
--   * Multiempresa: empresa_id en tablas operativas y configurables
--   * Moneda única v1: moneda = 'PEN' (Tabla 4 SUNAT)
--   * Periodos contables: mes BETWEEN '00' AND '13' (00 Apertura, 01-12 Meses, 13 Cierre)
--   * Auditoría completa: creado_por, fecha_creacion, modificado_por, fecha_modificacion
--   * Propiedad del dato: 10 tablas propias del Módulo III
-- ============================================================================

-- Extensión opcional para UUID en Supabase (compatible con gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- FUNCIÓN AUXILIAR DE AUDITORÍA (actualización automática de fecha_modificacion)
-- ============================================================================
CREATE OR REPLACE FUNCTION m3_set_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. sunat_tabla22_catalogo_eeff
-- Catálogo oficial SUNAT Tabla 22: Catálogo de Estados Financieros
-- ============================================================================
CREATE TABLE IF NOT EXISTS sunat_tabla22_catalogo_eeff (
    codigo              VARCHAR(4) PRIMARY KEY,
    descripcion         VARCHAR(150) NOT NULL,
    tipo_eeff           VARCHAR(30) NOT NULL
                        CHECK (tipo_eeff IN ('BALANCE_GENERAL', 'ESTADO_RESULTADOS', 'CAMBIOS_PATRIMONIO', 'FLUJOS_EFECTIVO')),
    formato_ple         VARCHAR(10) NOT NULL, -- Ej: '3.1', '3.20'
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    -- Auditoría
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sunat_tabla22_catalogo_eeff IS 'Catálogo oficial SUNAT Tabla 22 de Estados Financieros (Módulo III).';

DROP TRIGGER IF EXISTS trg_sunat_t22_modificacion ON sunat_tabla22_catalogo_eeff;
CREATE TRIGGER trg_sunat_t22_modificacion
BEFORE UPDATE ON sunat_tabla22_catalogo_eeff
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 2. sunat_tabla34_rubros_eeff
-- Catálogo oficial SUNAT Tabla 34: Código de Rubros de los Estados Financieros
-- ============================================================================
CREATE TABLE IF NOT EXISTS sunat_tabla34_rubros_eeff (
    codigo_rubro        VARCHAR(10) PRIMARY KEY,
    catalogo_codigo     VARCHAR(4) NOT NULL REFERENCES sunat_tabla22_catalogo_eeff(codigo),
    tipo_eeff           VARCHAR(30) NOT NULL
                        CHECK (tipo_eeff IN ('BALANCE_GENERAL', 'ESTADO_RESULTADOS')),
    seccion             VARCHAR(40) NOT NULL
                        CHECK (seccion IN (
                            'ACTIVO_CORRIENTE',
                            'ACTIVO_NO_CORRIENTE',
                            'PASIVO_CORRIENTE',
                            'PASIVO_NO_CORRIENTE',
                            'PATRIMONIO',
                            'INGRESOS_OPERACIONALES',
                            'COSTOS_GASTOS_OPERACIONALES',
                            'OTROS_INGRESOS_GASTOS',
                            'RESULTADO_PERIODO'
                        )),
    nombre_rubro        VARCHAR(180) NOT NULL,
    orden_presentacion  SMALLINT NOT NULL,
    naturaleza_saldo    CHAR(1) NOT NULL CHECK (naturaleza_saldo IN ('D', 'A')), -- D: Deudor, A: Acreedor
    es_subtotal         BOOLEAN NOT NULL DEFAULT FALSE,
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    -- Auditoría
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sunat_tabla34_rubros_eeff IS 'Rubros oficiales SUNAT Tabla 34 para Balance General y Estado de Resultados.';
CREATE INDEX IF NOT EXISTS idx_sunat_t34_tipo_orden ON sunat_tabla34_rubros_eeff (tipo_eeff, orden_presentacion);

DROP TRIGGER IF EXISTS trg_sunat_t34_modificacion ON sunat_tabla34_rubros_eeff;
CREATE TRIGGER trg_sunat_t34_modificacion
BEFORE UPDATE ON sunat_tabla34_rubros_eeff
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 3. m3_mapeo_pcge_rubro
-- Regla de mapeo entre cuentas del PCGE (Módulo I) y rubros SUNAT Tabla 34
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_mapeo_pcge_rubro (
    id                  BIGSERIAL PRIMARY KEY,
    empresa_id          BIGINT NOT NULL,
    cuenta_pcge_prefijo VARCHAR(12) NOT NULL, -- Ej: '10', '12', '39', '70'
    codigo_rubro        VARCHAR(10) NOT NULL REFERENCES sunat_tabla34_rubros_eeff(codigo_rubro),
    signo_aplicacion    SMALLINT NOT NULL DEFAULT 1 CHECK (signo_aplicacion IN (-1, 1)),
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    vigente_desde_mes   CHAR(2) NOT NULL DEFAULT '00' CHECK (vigente_desde_mes BETWEEN '00' AND '13'),
    vigente_hasta_mes   CHAR(2) NOT NULL DEFAULT '13' CHECK (vigente_hasta_mes BETWEEN '00' AND '13'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    -- Auditoría
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_m3_mapeo_emp_cta_rubro UNIQUE (empresa_id, cuenta_pcge_prefijo, codigo_rubro),
    CONSTRAINT chk_m3_mapeo_rango_mes CHECK (vigente_desde_mes <= vigente_hasta_mes)
);

COMMENT ON TABLE m3_mapeo_pcge_rubro IS 'Mapeo multiempresa de prefijos/cuentas PCGE hacia rubros SUNAT Tabla 34.';
CREATE INDEX IF NOT EXISTS idx_m3_mapeo_empresa_cta ON m3_mapeo_pcge_rubro (empresa_id, cuenta_pcge_prefijo);

DROP TRIGGER IF EXISTS trg_m3_mapeo_modificacion ON m3_mapeo_pcge_rubro;
CREATE TRIGGER trg_m3_mapeo_modificacion
BEFORE UPDATE ON m3_mapeo_pcge_rubro
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 4. m3_catalogo_ratios
-- Definición de indicadores/ratios financieros y umbrales de alerta
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_catalogo_ratios (
    codigo_ratio        VARCHAR(30) PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL,
    categoria           VARCHAR(30) NOT NULL
                        CHECK (categoria IN ('LIQUIDEZ', 'SOLVENCIA', 'RENTABILIDAD', 'GESTION')),
    formula_legible     VARCHAR(250) NOT NULL,
    unidad              VARCHAR(15) NOT NULL CHECK (unidad IN ('VECES', 'PORCENTAJE', 'PEN')),
    umbral_optimo_min   NUMERIC(12, 4),
    umbral_alerta_min   NUMERIC(12, 4),
    umbral_alerta_max   NUMERIC(12, 4),
    moneda              CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    -- Auditoría
    creado_por          VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por      VARCHAR(100),
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE m3_catalogo_ratios IS 'Catálogo de ratios financieros (Liquidez Corriente, Endeudamiento, Margen Neto, etc.).';

DROP TRIGGER IF EXISTS trg_m3_cat_ratios_modificacion ON m3_catalogo_ratios;
CREATE TRIGGER trg_m3_cat_ratios_modificacion
BEFORE UPDATE ON m3_catalogo_ratios
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 5. m3_estado_financiero
-- Cabecera inmutable (al aprobarse) del Estado Financiero por empresa y periodo
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_estado_financiero (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL,
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    catalogo_codigo         VARCHAR(4) NOT NULL REFERENCES sunat_tabla22_catalogo_eeff(codigo),
    tipo_eeff               VARCHAR(30) NOT NULL
                            CHECK (tipo_eeff IN ('BALANCE_GENERAL', 'ESTADO_RESULTADOS')),
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    version                 SMALLINT NOT NULL DEFAULT 1 CHECK (version >= 1),
    estado                  VARCHAR(15) NOT NULL DEFAULT 'BORRADOR'
                            CHECK (estado IN ('BORRADOR', 'VALIDADO', 'APROBADO')),
    total_activo            NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_pasivo            NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    total_patrimonio        NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    resultado_periodo       NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    ecuacion_cuadrada       BOOLEAN NOT NULL DEFAULT FALSE,
    origen_datos            VARCHAR(30) NOT NULL DEFAULT 'SIMULACION_M1_M2'
                            CHECK (origen_datos IN ('PRODUCCION_M1_M2', 'SIMULACION_M1_M2')),
    observaciones           TEXT,
    validado_por            VARCHAR(100),
    fecha_validacion        TIMESTAMPTZ,
    aprobado_por            VARCHAR(100),
    fecha_aprobacion        TIMESTAMPTZ,
    -- Auditoría
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_m3_eeff_emp_periodo_tipo_ver UNIQUE (empresa_id, anio, mes, tipo_eeff, version),
    CONSTRAINT chk_m3_eeff_aprobado_cuadrado CHECK (
        estado <> 'APROBADO' OR (
            tipo_eeff = 'ESTADO_RESULTADOS' OR ecuacion_cuadrada = TRUE
        )
    )
);

COMMENT ON TABLE m3_estado_financiero IS 'Cabecera de Estados Financieros (Balance General y Estado de Resultados) con ciclo BORRADOR -> VALIDADO -> APROBADO.';
CREATE INDEX IF NOT EXISTS idx_m3_eeff_emp_periodo ON m3_estado_financiero (empresa_id, anio, mes);
CREATE INDEX IF NOT EXISTS idx_m3_eeff_estado ON m3_estado_financiero (estado);

-- Trigger de inmutabilidad: bloquea UPDATE y DELETE cuando estado = 'APROBADO'
CREATE OR REPLACE FUNCTION m3_bloquear_modificacion_eeff_aprobado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado = 'APROBADO' THEN
        RAISE EXCEPTION 'Operación denegada: el Estado Financiero (id=%) está APROBADO y es inmutable.', OLD.id;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        NEW.fecha_modificacion := NOW();
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_m3_eeff_inmutable ON m3_estado_financiero;
CREATE TRIGGER trg_m3_eeff_inmutable
BEFORE UPDATE OR DELETE ON m3_estado_financiero
FOR EACH ROW EXECUTE FUNCTION m3_bloquear_modificacion_eeff_aprobado();

-- ============================================================================
-- 6. m3_estado_financiero_detalle
-- Snapshot de importes por rubro SUNAT Tabla 34 para cada Estado Financiero
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_estado_financiero_detalle (
    id                      BIGSERIAL PRIMARY KEY,
    estado_financiero_id    BIGINT NOT NULL REFERENCES m3_estado_financiero(id) ON DELETE CASCADE,
    empresa_id              BIGINT NOT NULL,
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    codigo_rubro            VARCHAR(10) NOT NULL REFERENCES sunat_tabla34_rubros_eeff(codigo_rubro),
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    importe_pen             NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    importe_comparativo_pen NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    nota_explicativa        VARCHAR(250),
    -- Auditoría
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_m3_eeff_det_cab_rubro UNIQUE (estado_financiero_id, codigo_rubro)
);

COMMENT ON TABLE m3_estado_financiero_detalle IS 'Detalle de rubros SUNAT Tabla 34 del snapshot de un Estado Financiero.';
CREATE INDEX IF NOT EXISTS idx_m3_eeff_det_emp_periodo ON m3_estado_financiero_detalle (empresa_id, anio, mes);

-- Trigger que impide editar/insertar/borrar detalles si la cabecera está APROBADA
CREATE OR REPLACE FUNCTION m3_bloquear_detalle_si_eeff_aprobado()
RETURNS TRIGGER AS $$
DECLARE
    v_estado VARCHAR(15);
    v_eeff_id BIGINT;
BEGIN
    v_eeff_id := COALESCE(NEW.estado_financiero_id, OLD.estado_financiero_id);
    SELECT estado INTO v_estado FROM m3_estado_financiero WHERE id = v_eeff_id;
    IF v_estado = 'APROBADO' THEN
        RAISE EXCEPTION 'Operación denegada: no se puede alterar el detalle del Estado Financiero id=% porque está APROBADO.', v_eeff_id;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        NEW.fecha_modificacion := NOW();
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_m3_eeff_det_inmutable ON m3_estado_financiero_detalle;
CREATE TRIGGER trg_m3_eeff_det_inmutable
BEFORE INSERT OR UPDATE OR DELETE ON m3_estado_financiero_detalle
FOR EACH ROW EXECUTE FUNCTION m3_bloquear_detalle_si_eeff_aprobado();

-- ============================================================================
-- 7. m3_control_presupuestal
-- Comparativo Presupuestado (M1) vs. Ejecutado (M2) por centro de costo y cuenta
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_control_presupuestal (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL,
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    centro_costo_codigo     VARCHAR(20) NOT NULL,
    cuenta_pcge_codigo      VARCHAR(12) NOT NULL,
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    monto_presupuestado     NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (monto_presupuestado >= 0),
    monto_ejecutado         NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (monto_ejecutado >= 0),
    variacion_absoluta      NUMERIC(18, 2) GENERATED ALWAYS AS (monto_ejecutado - monto_presupuestado) STORED,
    variacion_porcentual    NUMERIC(9, 2) NOT NULL DEFAULT 0.00,
    nivel_alerta            VARCHAR(15) NOT NULL DEFAULT 'NORMAL'
                            CHECK (nivel_alerta IN ('NORMAL', 'ALERTA', 'SOBREEJECUCION')),
    observacion             VARCHAR(250),
    -- Auditoría
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_m3_ctrl_pres_unico UNIQUE (empresa_id, anio, mes, centro_costo_codigo, cuenta_pcge_codigo)
);

COMMENT ON TABLE m3_control_presupuestal IS 'Snapshot analítico de control presupuestal (Presupuestado M1 vs. Ejecutado M2) con alertas.';
CREATE INDEX IF NOT EXISTS idx_m3_ctrl_pres_emp_periodo ON m3_control_presupuestal (empresa_id, anio, mes);
CREATE INDEX IF NOT EXISTS idx_m3_ctrl_pres_alerta ON m3_control_presupuestal (empresa_id, nivel_alerta);

DROP TRIGGER IF EXISTS trg_m3_ctrl_pres_modificacion ON m3_control_presupuestal;
CREATE TRIGGER trg_m3_ctrl_pres_modificacion
BEFORE UPDATE ON m3_control_presupuestal
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 8. m3_ratio_calculado
-- Resultados históricos de ratios financieros por empresa y periodo
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_ratio_calculado (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL,
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    estado_financiero_id    BIGINT REFERENCES m3_estado_financiero(id) ON DELETE SET NULL,
    codigo_ratio            VARCHAR(30) NOT NULL REFERENCES m3_catalogo_ratios(codigo_ratio),
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    numerador_pen           NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    denominador_pen         NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    valor_calculado         NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    estado_semaforo         VARCHAR(15) NOT NULL DEFAULT 'OPTIMO'
                            CHECK (estado_semaforo IN ('OPTIMO', 'ALERTA', 'CRITICO')),
    -- Auditoría
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_m3_ratio_emp_per_cod UNIQUE (empresa_id, anio, mes, codigo_ratio)
);

COMMENT ON TABLE m3_ratio_calculado IS 'Valores calculados de ratios financieros por empresa y periodo contable.';
CREATE INDEX IF NOT EXISTS idx_m3_ratio_emp_periodo ON m3_ratio_calculado (empresa_id, anio, mes);

DROP TRIGGER IF EXISTS trg_m3_ratio_calc_modificacion ON m3_ratio_calculado;
CREATE TRIGGER trg_m3_ratio_calc_modificacion
BEFORE UPDATE ON m3_ratio_calculado
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 9. m3_flujo_caja_proyeccion
-- Proyección de entradas, salidas y saldo neto de liquidez en PEN
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_flujo_caja_proyeccion (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL,
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    fecha_proyectada        DATE NOT NULL,
    tipo_movimiento         VARCHAR(15) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    categoria_flujo         VARCHAR(25) NOT NULL CHECK (categoria_flujo IN ('OPERATIVO', 'INVERSION', 'FINANCIAMIENTO')),
    cuenta_pcge_referencia  VARCHAR(12), -- Ej: 12 (CxC) o 42 (CxP)
    concepto                VARCHAR(180) NOT NULL,
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    monto_proyectado_pen    NUMERIC(18, 2) NOT NULL CHECK (monto_proyectado_pen >= 0),
    monto_real_pen          NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (monto_real_pen >= 0),
    escenario               VARCHAR(15) NOT NULL DEFAULT 'BASE'
                            CHECK (escenario IN ('BASE', 'OPTIMISTA', 'CONSERVADOR')),
    -- Auditoría
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE m3_flujo_caja_proyeccion IS 'Proyección de flujo de caja en PEN derivada de cuentas reales (CxC/CxP) y compromisos.';
CREATE INDEX IF NOT EXISTS idx_m3_flujo_emp_periodo ON m3_flujo_caja_proyeccion (empresa_id, anio, mes, fecha_proyectada);

DROP TRIGGER IF EXISTS trg_m3_flujo_modificacion ON m3_flujo_caja_proyeccion;
CREATE TRIGGER trg_m3_flujo_modificacion
BEFORE UPDATE ON m3_flujo_caja_proyeccion
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- ============================================================================
-- 10. m3_exportacion_ple_log
-- Auditoría de exportaciones de archivos planos PLE SUNAT (.txt)
-- ============================================================================
CREATE TABLE IF NOT EXISTS m3_exportacion_ple_log (
    id                      BIGSERIAL PRIMARY KEY,
    empresa_id              BIGINT NOT NULL,
    anio                    SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    mes                     CHAR(2) NOT NULL CHECK (mes BETWEEN '00' AND '13'),
    estado_financiero_id    BIGINT NOT NULL REFERENCES m3_estado_financiero(id),
    formato_ple             VARCHAR(10) NOT NULL CHECK (formato_ple IN ('3.1', '3.20')),
    nombre_archivo          VARCHAR(120) NOT NULL, -- Ej: LE2060123456120260100030100011111.txt
    moneda                  CHAR(3) NOT NULL DEFAULT 'PEN' CHECK (moneda = 'PEN'),
    estado_eeff_al_exportar VARCHAR(15) NOT NULL CHECK (estado_eeff_al_exportar IN ('VALIDADO', 'APROBADO')),
    cantidad_lineas         INTEGER NOT NULL CHECK (cantidad_lineas >= 0),
    checksum_sha256         CHAR(64),
    -- Auditoría
    creado_por              VARCHAR(100) NOT NULL DEFAULT 'sistema_m3',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modificado_por          VARCHAR(100),
    fecha_modificacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE m3_exportacion_ple_log IS 'Bitácora auditable de exportaciones PLE SUNAT (Formatos 3.1 y 3.20), permitidas solo en estado VALIDADO o APROBADO.';
CREATE INDEX IF NOT EXISTS idx_m3_ple_log_emp_periodo ON m3_exportacion_ple_log (empresa_id, anio, mes);

DROP TRIGGER IF EXISTS trg_m3_ple_log_modificacion ON m3_exportacion_ple_log;
CREATE TRIGGER trg_m3_ple_log_modificacion
BEFORE UPDATE ON m3_exportacion_ple_log
FOR EACH ROW EXECUTE FUNCTION m3_set_fecha_modificacion();

-- Trigger que garantiza que solo se registre exportación PLE si el EEFF está VALIDADO o APROBADO
CREATE OR REPLACE FUNCTION m3_validar_estado_para_ple()
RETURNS TRIGGER AS $$
DECLARE
    v_estado VARCHAR(15);
BEGIN
    SELECT estado INTO v_estado FROM m3_estado_financiero WHERE id = NEW.estado_financiero_id;
    IF v_estado IS NULL OR v_estado NOT IN ('VALIDADO', 'APROBADO') THEN
        RAISE EXCEPTION 'No se permite exportar PLE: el Estado Financiero id=% debe estar VALIDADO o APROBADO (actual: %).',
            NEW.estado_financiero_id, COALESCE(v_estado, 'NO_ENCONTRADO');
    END IF;
    NEW.estado_eeff_al_exportar := v_estado;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_m3_ple_validar_eeff ON m3_exportacion_ple_log;
CREATE TRIGGER trg_m3_ple_validar_eeff
BEFORE INSERT ON m3_exportacion_ple_log
FOR EACH ROW EXECUTE FUNCTION m3_validar_estado_para_ple();

-- ============================================================================
-- SEMILLA DE CATÁLOGOS PROPIOS DEL MÓDULO III (SUNAT TABLAS 22, 34 Y RATIOS)
-- ============================================================================
INSERT INTO sunat_tabla22_catalogo_eeff (codigo, descripcion, tipo_eeff, formato_ple, moneda, creado_por)
VALUES
    ('01', 'SECTOR DIVERSAS - INDIVIDUAL (BALANCE GENERAL)', 'BALANCE_GENERAL', '3.1', 'PEN', 'seed_m3'),
    ('02', 'SECTOR DIVERSAS - INDIVIDUAL (ESTADO DE RESULTADOS)', 'ESTADO_RESULTADOS', '3.20', 'PEN', 'seed_m3')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO sunat_tabla34_rubros_eeff
    (codigo_rubro, catalogo_codigo, tipo_eeff, seccion, nombre_rubro, orden_presentacion, naturaleza_saldo, es_subtotal, moneda, creado_por)
VALUES
    -- Balance General (Formato 3.1) - Activo Corriente
    ('1D0109', '01', 'BALANCE_GENERAL', 'ACTIVO_CORRIENTE',    'Efectivo y Equivalentes al Efectivo', 10, 'D', FALSE, 'PEN', 'seed_m3'),
    ('1D0103', '01', 'BALANCE_GENERAL', 'ACTIVO_CORRIENTE',    'Cuentas por Cobrar Comerciales (neto)', 20, 'D', FALSE, 'PEN', 'seed_m3'),
    ('1D0105', '01', 'BALANCE_GENERAL', 'ACTIVO_CORRIENTE',    'Otras Cuentas por Cobrar (neto)', 30, 'D', FALSE, 'PEN', 'seed_m3'),
    ('1D0106', '01', 'BALANCE_GENERAL', 'ACTIVO_CORRIENTE',    'Inventarios (Existencias)', 40, 'D', FALSE, 'PEN', 'seed_m3'),
    ('1D0112', '01', 'BALANCE_GENERAL', 'ACTIVO_CORRIENTE',    'Servicios y Otros Contratados por Anticipado', 50, 'D', FALSE, 'PEN', 'seed_m3'),
    -- Balance General - Activo No Corriente
    ('1D0205', '01', 'BALANCE_GENERAL', 'ACTIVO_NO_CORRIENTE', 'Propiedades, Planta y Equipo (neto)', 60, 'D', FALSE, 'PEN', 'seed_m3'),
    -- Balance General - Pasivo Corriente
    ('1D0301', '01', 'BALANCE_GENERAL', 'PASIVO_CORRIENTE',    'Tributos, Contraprestaciones y Aportes por Pagar', 70, 'A', FALSE, 'PEN', 'seed_m3'),
    ('1D0302', '01', 'BALANCE_GENERAL', 'PASIVO_CORRIENTE',    'Remuneraciones y Participaciones por Pagar', 80, 'A', FALSE, 'PEN', 'seed_m3'),
    ('1D0303', '01', 'BALANCE_GENERAL', 'PASIVO_CORRIENTE',    'Cuentas por Pagar Comerciales', 90, 'A', FALSE, 'PEN', 'seed_m3'),
    -- Balance General - Pasivo No Corriente
    ('1D0401', '01', 'BALANCE_GENERAL', 'PASIVO_NO_CORRIENTE', 'Obligaciones Financieras a Largo Plazo', 100, 'A', FALSE, 'PEN', 'seed_m3'),
    -- Balance General - Patrimonio
    ('1D0701', '01', 'BALANCE_GENERAL', 'PATRIMONIO',          'Capital Emitido', 110, 'A', FALSE, 'PEN', 'seed_m3'),
    ('1D0704', '01', 'BALANCE_GENERAL', 'PATRIMONIO',          'Otras Reservas de Capital (Reserva Legal)', 120, 'A', FALSE, 'PEN', 'seed_m3'),
    ('1D0707', '01', 'BALANCE_GENERAL', 'PATRIMONIO',          'Resultados Acumulados', 130, 'A', FALSE, 'PEN', 'seed_m3'),
    ('1D0708', '01', 'BALANCE_GENERAL', 'PATRIMONIO',          'Resultado del Ejercicio', 140, 'A', FALSE, 'PEN', 'seed_m3'),

    -- Estado de Resultados (Formato 3.20)
    ('2D0101', '02', 'ESTADO_RESULTADOS', 'INGRESOS_OPERACIONALES',      'Ingresos de Actividades Ordinarias (Ventas Netas)', 10, 'A', FALSE, 'PEN', 'seed_m3'),
    ('2D0201', '02', 'ESTADO_RESULTADOS', 'COSTOS_GASTOS_OPERACIONALES', 'Costo de Ventas', 20, 'D', FALSE, 'PEN', 'seed_m3'),
    ('2D0301', '02', 'ESTADO_RESULTADOS', 'COSTOS_GASTOS_OPERACIONALES', 'Gastos de Ventas y Distribución', 30, 'D', FALSE, 'PEN', 'seed_m3'),
    ('2D0302', '02', 'ESTADO_RESULTADOS', 'COSTOS_GASTOS_OPERACIONALES', 'Gastos de Administración', 40, 'D', FALSE, 'PEN', 'seed_m3'),
    ('2D0401', '02', 'ESTADO_RESULTADOS', 'OTROS_INGRESOS_GASTOS',       'Ingresos Financieros', 50, 'A', FALSE, 'PEN', 'seed_m3'),
    ('2D0402', '02', 'ESTADO_RESULTADOS', 'OTROS_INGRESOS_GASTOS',       'Gastos Financieros', 60, 'D', FALSE, 'PEN', 'seed_m3')
ON CONFLICT (codigo_rubro) DO NOTHING;

INSERT INTO m3_catalogo_ratios
    (codigo_ratio, nombre, categoria, formula_legible, unidad, umbral_optimo_min, umbral_alerta_min, umbral_alerta_max, moneda, creado_por)
VALUES
    ('LIQUIDEZ_CORRIENTE', 'Liquidez Corriente', 'LIQUIDEZ', 'Activo Corriente / Pasivo Corriente', 'VECES', 1.5000, 1.0000, NULL, 'PEN', 'seed_m3'),
    ('ENDEUDAMIENTO_TOTAL', 'Endeudamiento Total', 'SOLVENCIA', '(Pasivo Total / Activo Total) * 100', 'PORCENTAJE', NULL, NULL, 60.0000, 'PEN', 'seed_m3'),
    ('MARGEN_NETO', 'Margen Neto', 'RENTABILIDAD', '(Utilidad Neta / Ventas Netas) * 100', 'PORCENTAJE', 15.0000, 5.0000, NULL, 'PEN', 'seed_m3'),
    ('MARGEN_BRUTO', 'Margen Bruto', 'RENTABILIDAD', '(Utilidad Bruta / Ventas Netas) * 100', 'PORCENTAJE', 35.0000, 20.0000, NULL, 'PEN', 'seed_m3')
ON CONFLICT (codigo_ratio) DO NOTHING;
