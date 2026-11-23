import {
  EstadoFinancieroDoc,
  NivelAlertaPresupuesto,
  PartidaPresupuestal,
} from '../types/finance';

export function formatPen(value: number): string {
  const formatted = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `S/ ${formatted}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export interface ResumenBalance {
  activoCorriente: number;
  activoNoCorriente: number;
  totalActivo: number;
  pasivoCorriente: number;
  pasivoNoCorriente: number;
  totalPasivo: number;
  totalPatrimonio: number;
  totalPasivoMasPatrimonio: number;
  diferencia: number;
  estaCuadrado: boolean;
}

export function calcularResumenBalance(doc?: EstadoFinancieroDoc): ResumenBalance {
  if (!doc) {
    return {
      activoCorriente: 0,
      activoNoCorriente: 0,
      totalActivo: 0,
      pasivoCorriente: 0,
      pasivoNoCorriente: 0,
      totalPasivo: 0,
      totalPatrimonio: 0,
      totalPasivoMasPatrimonio: 0,
      diferencia: 0,
      estaCuadrado: true,
    };
  }

  const sumBy = (sec: string) =>
    doc.rubros
      .filter((r) => r.seccion === sec)
      .reduce((acc, r) => acc + r.importePen, 0);

  const activoCorriente = sumBy('ACTIVO_CORRIENTE');
  const activoNoCorriente = sumBy('ACTIVO_NO_CORRIENTE');
  const totalActivo = Number((activoCorriente + activoNoCorriente).toFixed(2));

  const pasivoCorriente = sumBy('PASIVO_CORRIENTE');
  const pasivoNoCorriente = sumBy('PASIVO_NO_CORRIENTE');
  const totalPasivo = Number((pasivoCorriente + pasivoNoCorriente).toFixed(2));

  const totalPatrimonio = Number(sumBy('PATRIMONIO').toFixed(2));
  const totalPasivoMasPatrimonio = Number((totalPasivo + totalPatrimonio).toFixed(2));
  const diferencia = Number((totalActivo - totalPasivoMasPatrimonio).toFixed(2));

  return {
    activoCorriente,
    activoNoCorriente,
    totalActivo,
    pasivoCorriente,
    pasivoNoCorriente,
    totalPasivo,
    totalPatrimonio,
    totalPasivoMasPatrimonio,
    diferencia,
    estaCuadrado: Math.abs(diferencia) < 0.005,
  };
}

export interface ResumenResultados {
  ventasNetas: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadOperativa: number;
  ingresosFinancieros: number;
  gastosFinancieros: number;
  utilidadNeta: number;
}

export function calcularResumenResultados(doc?: EstadoFinancieroDoc): ResumenResultados {
  if (!doc) {
    return {
      ventasNetas: 0,
      costoVentas: 0,
      utilidadBruta: 0,
      gastosOperativos: 0,
      utilidadOperativa: 0,
      ingresosFinancieros: 0,
      gastosFinancieros: 0,
      utilidadNeta: 0,
    };
  }

  const getVal = (code: string) =>
    doc.rubros.find((r) => r.codigoRubro === code)?.importePen ?? 0;

  const ventasNetas = getVal('2D0101');
  const costoVentas = getVal('2D0201');
  const utilidadBruta = Number((ventasNetas - costoVentas).toFixed(2));
  const gastosVentas = getVal('2D0301');
  const gastosAdmin = getVal('2D0302');
  const gastosOperativos = Number((gastosVentas + gastosAdmin).toFixed(2));
  const utilidadOperativa = Number((utilidadBruta - gastosOperativos).toFixed(2));
  const ingresosFinancieros = getVal('2D0401');
  const gastosFinancieros = getVal('2D0402');
  const utilidadNeta = Number(
    (utilidadOperativa + ingresosFinancieros - gastosFinancieros).toFixed(2)
  );

  return {
    ventasNetas,
    costoVentas,
    utilidadBruta,
    gastosOperativos,
    utilidadOperativa,
    ingresosFinancieros,
    gastosFinancieros,
    utilidadNeta,
  };
}

export interface AnalisisPartidaPresupuestal extends PartidaPresupuestal {
  variacionAbsoluta: number;
  variacionPorcentual: number;
  porcentajeEjecucion: number;
  nivelAlerta: NivelAlertaPresupuesto;
}

export function analizarPartidaPresupuestal(
  p: PartidaPresupuestal
): AnalisisPartidaPresupuestal {
  const variacionAbsoluta = Number((p.ejecutadoPen - p.presupuestadoPen).toFixed(2));
  const porcentajeEjecucion =
    p.presupuestadoPen > 0
      ? Number(((p.ejecutadoPen / p.presupuestadoPen) * 100).toFixed(2))
      : 0;
  const variacionPorcentual =
    p.presupuestadoPen > 0
      ? Number(((variacionAbsoluta / p.presupuestadoPen) * 100).toFixed(2))
      : 0;

  let nivelAlerta: NivelAlertaPresupuesto = 'NORMAL';
  if (porcentajeEjecucion > 100) {
    nivelAlerta = 'SOBREEJECUCION';
  } else if (porcentajeEjecucion >= 85) {
    nivelAlerta = 'ALERTA';
  }

  return {
    ...p,
    variacionAbsoluta,
    variacionPorcentual,
    porcentajeEjecucion,
    nivelAlerta,
  };
}
