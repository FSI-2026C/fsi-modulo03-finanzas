export type PeriodoMes =
  | '00'
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13';

export type EstadoCicloVida = 'BORRADOR' | 'VALIDADO' | 'APROBADO';

export type TipoEstadoFinanciero = 'BALANCE_GENERAL' | 'ESTADO_RESULTADOS';

export type SeccionSunat =
  | 'ACTIVO_CORRIENTE'
  | 'ACTIVO_NO_CORRIENTE'
  | 'PASIVO_CORRIENTE'
  | 'PASIVO_NO_CORRIENTE'
  | 'PATRIMONIO'
  | 'INGRESOS_OPERACIONALES'
  | 'COSTOS_GASTOS_OPERACIONALES'
  | 'OTROS_INGRESOS_GASTOS';

export interface EmpresaSimulada {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  tipoEntorno: 'OFICIAL' | 'PRUEBA_CAPACITACION';
  moneda: 'PEN';
}

export interface PeriodoOption {
  mes: PeriodoMes;
  label: string;
  estadoM2: 'CERRADO' | 'ABIERTO';
  tieneSaldosSimulados: boolean;
}

export interface RubroEEFF {
  codigoRubro: string; // SUNAT Tabla 34
  nombreRubro: string;
  seccion: SeccionSunat;
  cuentasPcge: string;
  importePen: number;
  signoResultado?: 1 | -1; // Para cálculo de Estado de Resultados
}

export interface EstadoFinancieroDoc {
  id: string;
  empresaId: number;
  anio: number;
  mes: PeriodoMes;
  tipo: TipoEstadoFinanciero;
  catalogoTabla22: '01' | '02';
  formatoPle: '3.1' | '3.20';
  moneda: 'PEN';
  estado: EstadoCicloVida;
  rubros: RubroEEFF[];
  validadoPor?: string;
  fechaValidacion?: string;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  observaciones?: string;
}

export type NivelAlertaPresupuesto = 'NORMAL' | 'ALERTA' | 'SOBREEJECUCION';

export interface PartidaPresupuestal {
  id: string;
  empresaId: number;
  anio: number;
  mes: PeriodoMes;
  centroCostoCodigo: string;
  centroCostoNombre: string;
  cuentaPcge: string;
  nombreCuenta: string;
  presupuestadoPen: number;
  ejecutadoPen: number;
}

export interface ExportacionPleRegistro {
  id: string;
  empresaId: number;
  anio: number;
  mes: PeriodoMes;
  formatoPle: '3.1' | '3.20';
  nombreArchivo: string;
  estadoEeffAlExportar: 'VALIDADO' | 'APROBADO';
  cantidadLineas: number;
  fechaHora: string;
}
