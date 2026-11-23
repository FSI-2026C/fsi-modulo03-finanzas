import { EmpresaSimulada, EstadoFinancieroDoc, PeriodoMes } from '../types/finance';

function getUltimoDiaMes(anio: number, mes: PeriodoMes): string {
  if (mes === '00') {
    return `${anio}0101`;
  }
  if (mes === '13') {
    return `${anio}1231`;
  }
  const monthNum = parseInt(mes, 10);
  const lastDay = new Date(anio, monthNum, 0).getDate();
  return `${anio}${mes}${String(lastDay).padStart(2, '0')}`;
}

/**
 * Construye el nombre oficial de archivo plano PLE SUNAT:
 * LE + RUC(11) + AAAA + MM + DD(00) + LLLLLL(030100 o 032000) + CC(01) + O(1) + I(1) + M(1=PEN) + G(1) + .txt
 */
export function buildPleFilename(
  empresa: EmpresaSimulada,
  doc: EstadoFinancieroDoc
): string {
  const libroCodigo = doc.formatoPle === '3.1' ? '030100' : '032000';
  const mesPle = doc.mes === '00' ? '01' : doc.mes === '13' ? '12' : doc.mes;
  const oportunidad = doc.mes === '00' ? '04' : '01';
  // Moneda PEN = 1, Con información = 1, Operación activa = 1, PLE = 1
  return `LE${empresa.ruc}${doc.anio}${mesPle}00${libroCodigo}${oportunidad}1111.txt`;
}

/**
 * Genera el contenido .txt con formato PLE SUNAT (campos separados por '|'):
 * Periodo(AAAAMMDD) | CodigoCatalogo(Tabla22) | CodigoRubro(Tabla34) | SaldoRubro(PEN) | EstadoOperacion(1) |
 */
export function buildPleContent(doc: EstadoFinancieroDoc): {
  content: string;
  lineCount: number;
} {
  const fechaCorte = getUltimoDiaMes(doc.anio, doc.mes);
  const lines = doc.rubros.map((rubro) => {
    const monto = rubro.importePen.toFixed(2);
    return `${fechaCorte}|${doc.catalogoTabla22}|${rubro.codigoRubro}|${monto}|1|`;
  });

  return {
    content: lines.join('\r\n') + '\r\n',
    lineCount: lines.length,
  };
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
