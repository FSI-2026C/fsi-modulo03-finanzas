import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {
  EmpresaSimulada,
  EstadoFinancieroDoc,
  ExportacionPleRegistro,
  PeriodoMes,
} from '../types/finance';
import {
  buildPleContent,
  buildPleFilename,
  downloadTextFile,
} from '../utils/pleGenerator';

interface ExportacionPleTabProps {
  empresa: EmpresaSimulada;
  mes: PeriodoMes;
  balanceDoc?: EstadoFinancieroDoc;
  resultadosDoc?: EstadoFinancieroDoc;
  logs: ExportacionPleRegistro[];
  onRegistrarExportacion: (registro: ExportacionPleRegistro) => void;
  onGoToEstadosFinancieros: () => void;
}

export const ExportacionPleTab: React.FC<ExportacionPleTabProps> = ({
  empresa,
  mes,
  balanceDoc,
  resultadosDoc,
  logs,
  onRegistrarExportacion,
  onGoToEstadosFinancieros,
}) => {
  const renderPleCard = (
    titulo: string,
    subtitulo: string,
    formato: '3.1' | '3.20',
    doc?: EstadoFinancieroDoc
  ) => {
    const habilitado =
      doc !== undefined && (doc.estado === 'VALIDADO' || doc.estado === 'APROBADO');
    const filename = doc ? buildPleFilename(empresa, doc) : '—';
    const preview = doc ? buildPleContent(doc) : { content: '', lineCount: 0 };

    const handleDownload = () => {
      if (!doc || !habilitado) return;
      downloadTextFile(filename, preview.content);
      onRegistrarExportacion({
        id: `${Date.now()}-${formato}`,
        empresaId: empresa.id,
        anio: doc.anio,
        mes: doc.mes,
        formatoPle: formato,
        nombreArchivo: filename,
        estadoEeffAlExportar: doc.estado as 'VALIDADO' | 'APROBADO',
        cantidadLineas: preview.lineCount,
        fechaHora: new Date().toLocaleString('es-PE'),
      });
    };

    return (
      <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="h6">{titulo}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitulo}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={doc ? `Estado: ${doc.estado}` : 'Sin datos'}
            color={
              !doc
                ? 'default'
                : doc.estado === 'APROBADO'
                  ? 'success'
                  : doc.estado === 'VALIDADO'
                    ? 'info'
                    : 'warning'
            }
          />
        </Stack>

        <Divider />

        {!doc ? (
          <Alert severity="info">
            No existen datos para el periodo <strong>2026-{mes}</strong>. Selecciona Mes 00
            o Mes 01.
          </Alert>
        ) : (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Nomenclatura oficial PLE SUNAT (Moneda PEN = 1):
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 600,
                  wordBreak: 'break-all',
                  mt: 0.25,
                }}
              >
                {filename}
              </Typography>
            </Box>

            {!habilitado ? (
              <Alert
                severity="warning"
                icon={<LockOutlinedIcon />}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={onGoToEstadosFinancieros}
                  >
                    Ir a Validar
                  </Button>
                }
              >
                Descarga bloqueada: el documento está en estado{' '}
                <strong>{doc.estado}</strong>. Debe estar <strong>VALIDADO</strong> o{' '}
                <strong>APROBADO</strong> para habilitar la exportación PLE.
              </Alert>
            ) : (
              <Alert severity="success" icon={<CheckCircleOutlineRoundedIcon />}>
                Listo para descarga oficial ({preview.lineCount} registros SUNAT Tabla 34).
              </Alert>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                Vista previa del archivo plano (.txt · delimitador pipe &quot;|&quot;):
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: '#0F172A',
                  color: '#E2E8F0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  overflowX: 'auto',
                  maxHeight: 190,
                }}
              >
                {preview.content}
              </Box>
            </Box>

            <Box sx={{ mt: 'auto', pt: 1 }}>
              <Tooltip
                title={
                  habilitado
                    ? `Descargar ${filename}`
                    : 'Habilitado únicamente cuando el Estado Financiero esté VALIDADO o APROBADO'
                }
              >
                <span>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadRoundedIcon />}
                    disabled={!habilitado}
                    onClick={handleDownload}
                  >
                    Descargar .txt — Formato PLE {formato}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </>
        )}
      </Paper>
    );
  };

  const logsEmpresa = logs.filter((l) => l.empresaId === empresa.id);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5">
          Exportación PLE SUNAT · Libro de Inventarios y Balances
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generación de archivos planos <code>.txt</code> reales en moneda nacional{' '}
          <strong>PEN</strong> compatibles con SUNAT (Formatos 3.1 y 3.20). Solo se
          habilitan cuando el Estado Financiero se encuentra <strong>VALIDADO</strong> o{' '}
          <strong>APROBADO</strong>.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
        }}
      >
        {renderPleCard(
          'Formato 3.1 — Balance General',
          'Libro de Inventarios y Balances · Catálogo Tabla 22 (01) · Rubros Tabla 34',
          '3.1',
          balanceDoc
        )}
        {renderPleCard(
          'Formato 3.20 — Estado de Resultados',
          'Estado de Ganancias y Pérdidas por Función · Catálogo Tabla 22 (02) · Rubros Tabla 34',
          '3.20',
          resultadosDoc
        )}
      </Box>

      {/* Bitácora local simulando m3_exportacion_ple_log */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="h6" gutterBottom>
          Bitácora de Exportaciones PLE (m3_exportacion_ple_log)
        </Typography>
        {logsEmpresa.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aún no se han descargado archivos PLE para {empresa.nombreComercial} en esta
            sesión.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha y Hora</TableCell>
                  <TableCell>Periodo</TableCell>
                  <TableCell>Formato PLE</TableCell>
                  <TableCell>Nombre de Archivo</TableCell>
                  <TableCell>Estado EEFF</TableCell>
                  <TableCell align="right">Líneas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logsEmpresa.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.fechaHora}</TableCell>
                    <TableCell>
                      {log.anio}-{log.mes}
                    </TableCell>
                    <TableCell>Formato {log.formatoPle}</TableCell>
                    <TableCell
                      sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}
                    >
                      {log.nombreArchivo}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={log.estadoEeffAlExportar}
                        color={log.estadoEeffAlExportar === 'APROBADO' ? 'success' : 'info'}
                      />
                    </TableCell>
                    <TableCell align="right">{log.cantidadLineas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
};
