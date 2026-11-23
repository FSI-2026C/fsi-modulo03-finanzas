# Módulo III — Estados Financieros, Control Presupuestal y Analítica

**ERP Académico | Fundamentos de Sistemas de Información | UNSA | 2026-B**

## Descripción general

Este repositorio contiene la documentación, el diseño y la implementación del **Módulo III: Estados Financieros, Control Presupuestal y Analítica** (Tribu 3 — Finanzas), perteneciente al ERP académico multiempresa desarrollado en el curso de Fundamentos de Sistemas de Información de la Universidad Nacional de San Agustín de Arequipa.

El módulo cumple el rol **decisional** dentro de la Tribu Finanzas: consume la información contable y presupuestal consolidada por los Equipos 1 y 2 para generar, validar y publicar Estados Financieros mensuales (periodos `00` a `13`), calcular ratios financieros, controlar desviaciones presupuestales, proyectar el flujo de caja y visualizar indicadores en un Dashboard gerencial, contemplando compatibilidad con los estándares de la **SUNAT (Tablas del Anexo 3 y exportación PLE)**.

> **Estado del proyecto:** etapa de análisis, diseño y alineación de base de datos unificada en Supabase con la Tribu Finanzas.

---

## 1. Objetivo general

Diseñar e implementar un módulo financiero decisional e integrado al ERP académico multiempresa que permita emitir y aprobar Estados Financieros, evaluar la ejecución presupuestal, calcular ratios y proyectar el flujo de caja en moneda nacional (`PEN`), garantizando integridad contable, trazabilidad y cumplimiento parcial de requisitos SUNAT.

### Objetivos específicos

- Implementar la transacción de **generación, validación y aprobación de Estados Financieros** (Balance General y Estado de Resultados) con *snapshot* inmutable de saldos por empresa y periodo (`Mes 00` a `Mes 13`).
- Validar la ecuación contable ($\text{Activo} = \text{Pasivo} + \text{Patrimonio}$) antes de aprobar cualquier reporte oficial.
- Cruzar el presupuesto asignado (Módulo I) contra los saldos ejecutados del Libro Diario (Módulo II) para detectar desviaciones (**Presupuestado vs. Ejecutado**).
- Calcular **ratios financieros** clave (liquidez, solvencia y rentabilidad) y exponerlos en un **Dashboard interactivo**.
- Proyectar el **Flujo de Caja** a partir de saldos reales y compromisos de cobro/pago para apoyar decisiones de liquidez.
- Alinear los rubros financieros a las **Tablas SUNAT** y habilitar la exportación en formatos PDF, Excel y archivo plano `.txt` compatible con el **PLE** (Libro de Inventarios y Balances: Formatos 3.1 y 3.20).

---

## 2. Alcance funcional (v1 — Acuerdos de Tribu Finanzas)

### Dentro del alcance (MVP v1)

1. **Emisión y aprobación de Estados Financieros (Transacción principal):**
   - Generación mensual por `empresa_id` y periodo (`anio`, `mes` de `00` a `13`).
   - **Balance General** (cuentas 10 a 59, incluyendo saldo de apertura en `Mes 00`).
   - **Estado de Resultados / P&G** (cuentas de ingresos, costos y gastos).
   - Mapeo de cuentas del PCGE a códigos de rubros de la **Tabla 34 SUNAT**.
   - Ciclo de vida auditable del documento: `BORRADOR` → `VALIDADO` → `APROBADO`.
2. **Control Presupuestal (Presupuestado vs. Ejecutado):**
   - Comparación por cuenta contable, centro de costo y mes entre el presupuesto (Módulo I) y lo ejecutado en el Libro Diario (Módulo II).
   - Cálculo de variaciones absolutas y porcentuales con alertas de sobreejecución.
3. **Ratios Financieros y Dashboard Decisional:**
   - Cálculo automático de indicadores (liquidez corriente, endeudamiento, margen bruto/neto).
   - Gráficos comparativos, filtros por empresa y periodo, y tarjetas KPI.
4. **Flujo de Caja proyectado y Exportación:**
   - Vista de entradas, salidas y proyección de liquidez derivada de cuentas reales (cuentas por cobrar vs. cuentas por pagar).
   - Exportación de reportes a PDF, Excel y formato `.txt` compatible con **PLE SUNAT**.

### Fuera del alcance en v1 (acordado por POs de Tribu)

- Gestión multimoneda, tipos de cambio diarios y revaluación cambiaria (la tribu opera con **moneda única `PEN`**).
- Configuración de tasas tributarias e impuestos (se mantiene fuera del alcance v1).
- Registro de asientos en el Libro Diario y cierre de periodos contables `Mes 13` (responsabilidad exclusiva del **Equipo 2 — Motor Contable**).

---

## 3. Arquitectura y stack tecnológico (Acuerdo de Tribu)

La Tribu Finanzas trabaja con una **arquitectura de 3 capas** (Presentación, Lógica de Negocio y Persistencia), base de datos unificada y comunicación mediante **APIs REST documentadas con OpenAPI**.

| Componente | Tecnología acordada | Uso en el Módulo III |
|---|---|---|
| **Backend** | Django Framework (Python) | Servicios de dominio, validaciones contables, APIs REST y documentación OpenAPI. |
| **Frontend** | React + TypeScript + Material UI (MUI) | Dashboard, tablas comparativas, filtros por periodo/empresa, KPIs y exportación. |
| **Base de Datos** | PostgreSQL (Supabase) | Esquema unificado de la Tribu Finanzas con permisos controlados por módulo. |
| **Integración** | REST API / OpenAPI + BD compartida | Lectura de PCGE/Presupuesto (Módulo I) y saldos cerrados (Módulo II) bajo enfoque de cierre y envío (Caso A). |
| **CI/CD y Control** | GitHub + GitHub Actions | Flujo de ramas con validación automática y matriz de aceptación. |

### Principios de integración y gobernanza

- **Multiempresa:** todas las tablas y consultas incluyen `empresa_id` (soporte para empresa oficial y empresa de prueba/capacitación).
- **Periodos contables `00`–`13`:** `Mes 00` corresponde a saldos de apertura (cuentas 10–59), `Mes 01`–`12` a operación mensual y `Mes 13` al cierre anual ejecutado por el Módulo II.
- **Propiedad del dato:** el Módulo III tiene permisos de **solo lectura** sobre las tablas de los Módulos I y II, y escritura exclusiva sobre sus propias tablas de estados financieros, ratios y auditoría.
- **Auditoría:** las tablas contemplan campos de trazabilidad (`creado_por`, `fecha_creacion`, `modificado_por`, `fecha_modificacion`).
- **Cumplimiento SUNAT:** alineación con Tablas SUNAT (Tabla 4 Moneda `PEN`, Tabla 17 Plan de Cuentas PCGE, Tabla 22 Catálogo de EEFF y Tabla 34 Rubros de EEFF).

---

## 4. Estructura del repositorio

> Esta estructura está preparada para integrarse al **monorepo general del ERP** cuando se consoliden los módulos de las tres tribus.

```text
fsi-modulo03-finanzas/
│
├── README.md
├── .gitignore
│
├── docs/
│   ├── arquitectura/
│   │   └── Propuesta_Arquitectura_Modulo_III.pdf
│   │
│   └── diccionario-datos/
│       └── Diccionario_Modulo_III.xlsx
│
├── backend/          # Proyecto Django (API REST, lógica contable, OpenAPI, tests)
├── frontend/         # Aplicación React + TypeScript + Material UI
└── database/         # Scripts SQL para PostgreSQL / Supabase
```

---

## 5. Flujo de trabajo en Git (Acuerdo de Tribu)

Todo cambio sigue el flujo de integración controlada acordado por los equipos de Finanzas:

```text
rama feature/* ──> GitHub Actions (tests/lint) ──> PR a develop ──> Matriz de Aceptación (PO/QA) ──> GitHub Actions ──> main
```

- Ningún cambio se sube directamente a `main`.
- El paso de `develop` a `main` requiere aprobar los criterios de la **Matriz de Aceptación** y pasar las pruebas unitarias y de integración.

---

## 6. Equipo de trabajo

**Universidad:** Universidad Nacional de San Agustín de Arequipa  
**Curso:** Fundamentos de Sistemas de Información — 2026-B  
**Tribu:** 3 — Finanzas | **Grupo:** C | **Equipo:** 3  

| Integrante | Rol principal | Roles de apoyo | Estado |
|---|---|---|---|
| Dávila Flores Mathias Dario | Product Owner / Scrum Master (interino) | QA, Matriz de Aceptación y DevOps (CI/CD) | Activo |
| Quispe Diaz Sara Sofia | Backend / Frontend | Arquitectura y Patrones de Diseño | Activa |
| Subia Huaicane Edson Fabricio | Scrum Master (asignación original) | — | Sin reporte actual |

*Nota: Ante la falta de reporte del Scrum Master original, la coordinación ágil y gestión de ramas es asumida temporalmente por Mathias Dávila para garantizar la continuidad del equipo.*

---

## 7. Estado y planificación

| Etapa | Situación |
|---|---|
| Análisis del alcance y acuerdos de Tribu | Completado |
| Organización de repositorio y tablero (`FSI-2026C`) | Completado |
| Propuesta de arquitectura (v0.1) | Elaborada (en actualización con stack oficial) |
| Diccionario de datos | Elaborado (en ajuste para SQL unificado en Supabase) |
| Épicas, User Stories y Matriz de Aceptación | En elaboración |
| Scripts SQL en Supabase | Pendiente de consolidación con Equipos 1 y 2 |
| Implementación Backend (Django + OpenAPI) | Pendiente |
| Implementación Frontend (React + TS + MUI) | Pendiente |
| Pruebas unitarias, integración y despliegue en hosting | Pendiente |

---

**Universidad Nacional de San Agustín de Arequipa**  
**Fundamentos de Sistemas de Información — 2026-B | Tribu Finanzas | Grupo C | Equipo 3**