import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  EmpresaSimulada,
  EstadoCicloVida,
  EstadoFinancieroDoc,
  PeriodoMes,
  SeccionSunat,
  TipoEstadoFinanciero,
} from '../types/finance';
import {
  calcularResumenBalance,
  calcularResumenResultados,
  formatPen,
} from '../utils/formatters';

interface EstadosFinancierosTabProps {
  empresa: EmpresaSimulada;
  mes: PeriodoMes;
  balanceDoc?: EstadoFinancieroDoc;
  resultadosDoc?: EstadoFinancieroDoc;
  onUpdateRubro: (
    docId: string,
    codigoRubro: string,
    nuevoImportePen: number
  ) => void;
  onResetDoc: (docId: string) => void;
  onTransitionEstado: (docId: string, nuevoEstado: EstadoCicloVida) => void;
  onSelectPeriodo: (mes: PeriodoMes) => void;
}

const SECCION_LABELS: Record<SeccionSunat, string> = {
  ACTIVO_CORRIENTE: 'ACTIVO CORRIENTE',
  ACTIVO_NO_CORRIENTE: 'ACTIVO NO CORRIENTE',
  PASIVO_CORRIENTE: 'PASIVO CORRIENTE',
  PASIVO_NO_CORRIENTE: 'PASIVO NO CORRIENTE',
  PATRIMONIO: 'PATRIMONIO NETO',
  INGRESOS_OPERACIONALES: 'INGRESOS OPERACIONALES',
  COSTOS_GASTOS_OPERACIONALES: 'COSTOS Y GASTOS OPERACIONALES',
  OTROS_INGRESOS_GASTOS: 'OTROS INGRESOS Y GASTOS FINANCIEROS',
};

const CICLO_STEPS: EstadoCicloVida[] = ['BORRADOR', 'VALIDADO', 'APROBADO'];

export const EstadosFinancierosTab: React.FC<EstadosFinancierosTabProps> = ({
  empresa,
  mes,
  balanceDoc,
  resultadosDoc,
  onUpdateRubro,
  onResetDoc,
  onTransitionEstado,
  onSelectPeriodo,
}) => {
  const [tipoActivo, setTipoActivo] =
    useState<TipoEstadoFinanciero>('BALANCE_GENERAL');

  const activeDoc =
    tipoActivo === 'BALANCE_GENERAL' ? balanceDoc : resultadosDoc;

  if (!activeDoc) {
    return (
      <Stack spacing={2.5}>
        <Typography variant="h5">Estados Financieros (SUNAT Tabla 34)</Typography>
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => onSelectPeriodo('01')}
            >
              Ir a Mes 01 (Enero)
            </Button>
          }
        >
          El periodo <strong>2026-{mes}</strong> aún no posee saldos cerrados en la
          simulación de Módulo II. Selecciona <strong>Mes 00 (Apertura)</strong> o{' '}
          <strong>Mes 01 (Enero 2026)</strong> para generar y aprobar Estados Financieros.
        </Alert>
      </Stack>
    );
  }

  const isAprobado = activeDoc.estado === 'APROBADO';
  const isBorrador = activeDoc.estado === 'BORRADOR';
  const isValidado = activeDoc.estado === 'VALIDADO';
  const activeStepIndex = CICLO_STEPS.indexOf(activeDoc.estado);

  const resumenBG = calcularResumenBalance(balanceDoc);
  const resumenER = calcularResumenResultados(resultadosDoc);

  const puedeValidar =
    isBorrador &&
    (tipoActivo === 'ESTADO_RESULTADOS' || resumenBG.estaCuadrado);

  const seccionesOrden: SeccionSunat[] =
    tipoActivo === 'BALANCE_GENERAL'
      ? [
          'ACTIVO_CORRIENTE',
          'ACTIVO_NO_CORRIENTE',
          'PASIVO_CORRIENTE',
          'PASIVO_NO_CORRIENTE',
          'PATRIMONIO',
        ]
      : [
          'INGRESOS_OPERACIONALES',
          'COSTOS_GASTOS_OPERACIONALES',
          'OTROS_INGRESOS_GASTOS',
        ];

  return (
    <Stack spacing={3}>
      {/* Cabecera + Selector BG / ER */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5">Estados Financieros · Rubros SUNAT Tabla 34</Typography>
          <Typography variant="body2" color="text.secondary">
            {empresa.razonSocial} · Periodo 2026-{mes} · Tabla 22 Código{' '}
            <strong>{activeDoc.catalogoTabla22}</strong> · Formato PLE{' '}
            <strong>{activeDoc.formatoPle}</strong>
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={tipoActivo}
          exclusive
          onChange={(_, val) => {
            if (val) setTipoActivo(val);
          }}
          size="small"
          color="primary"
        >
          <ToggleButton value="BALANCE_GENERAL">
            Balance General (PLE 3.1)
          </ToggleButton>
          <ToggleButton value="ESTADO_RESULTADOS">
            Estado de Resultados (PLE 3.20)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Banner de bloqueo si está APROBADO */}
      {isAprobado && (
        <Alert severity="success" icon={<LockRoundedIcon />}>
          <strong>Estado Financiero APROBADO (Snapshot Inmutable):</strong> Este documento
          ha sido aprobado oficialmente el {activeDoc.fechaAprobacion} por{' '}
          <code>{activeDoc.aprobadoPor}</code>. Todas las ediciones de rubros y cambios de
          estado están bloqueados permanentemente para garantizar integridad y auditoría.
        </Alert>
      )}

      {/* Panel de Ciclo de Vida: BORRADOR -> VALIDADO -> APROBADO */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2.5}
        >
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ciclo de Vida Auditable del Estado Financiero
            </Typography>
            <Stepper activeStep={activeStepIndex} alternativeLabel>
              {CICLO_STEPS.map((step) => (
                <Step key={step} completed={CICLO_STEPS.indexOf(step) < activeStepIndex || isAprobado}>
                  <StepLabel>{step}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="flex-end">
            {isBorrador && (
              <Tooltip title="Restaurar los importes originales cargados desde el lote M2 simulado">
                <span>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<RestoreRoundedIcon />}
                    onClick={() => onResetDoc(activeDoc.id)}
                  >
                    Restaurar M2
                  </Button>
                </span>
              </Tooltip>
            )}

            {isValidado && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ArrowBackRoundedIcon />}
                disabled={isAprobado}
                onClick={() => onTransitionEstado(activeDoc.id, 'BORRADOR')}
              >
                Devolver a Borrador
              </Button>
            )}

            <Tooltip
              title={
                isAprobado
                  ? 'Bloqueado: el documento ya está APROBADO'
                  : !puedeValidar && isBorrador
                    ? 'Debe cuadrar la ecuación Activo = Pasivo + Patrimonio antes de validar'
                    : ''
              }
            >
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<VerifiedOutlinedIcon />}
                  disabled={!puedeValidar || isAprobado}
                  onClick={() => onTransitionEstado(activeDoc.id, 'VALIDADO')}
                >
                  Validar (BORRADOR → VALIDADO)
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                isAprobado
                  ? 'Documento ya APROBADO e inmutable'
                  : !isValidado
                    ? 'Primero debe pasar por estado VALIDADO'
                    : 'Al aprobar se bloquea cualquier edición o cambio futuro'
              }
            >
              <span>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<LockRoundedIcon />}
                  disabled={!isValidado || isAprobado}
                  onClick={() => onTransitionEstado(activeDoc.id, 'APROBADO')}
                >
                  Aprobar (VALIDADO → APROBADO)
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* Validación automática de la ecuación contable (Balance General) */}
      {tipoActivo === 'BALANCE_GENERAL' && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderColor: resumenBG.estaCuadrado ? '#86EFAC' : '#FCA5A5',
            backgroundColor: resumenBG.estaCuadrado ? '#F0FDF4' : '#FEF2F2',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {resumenBG.estaCuadrado ? (
                <CheckCircleRoundedIcon color="success" fontSize="large" />
              ) : (
                <ErrorOutlineRoundedIcon color="error" fontSize="large" />
              )}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={resumenBG.estaCuadrado ? 'success.main' : 'error.main'}
                >
                  {resumenBG.estaCuadrado
                    ? 'Validación Automática: Activo = Pasivo + Patrimonio (CUADRADO)'
                    : 'Descuadre Contable Detectado: Activo ≠ Pasivo + Patrimonio'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {resumenBG.estaCuadrado
                    ? 'La ecuación contable fundamental se cumple exactamente al céntimo en PEN.'
                    : 'Corrige los rubros en estado BORRADOR o restaura los saldos M2 para habilitar la validación.'}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={3}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  TOTAL ACTIVO
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatPen(resumenBG.totalActivo)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  PASIVO + PATRIMONIO
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatPen(resumenBG.totalPasivoMasPatrimonio)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  DIFERENCIA
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={resumenBG.estaCuadrado ? 'success.main' : 'error.main'}
                >
                  {formatPen(resumenBG.diferencia)}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Tabla principal de rubros SUNAT Tabla 34 */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 130 }}>Rubro Tabla 34</TableCell>
              <TableCell>Denominación del Rubro SUNAT</TableCell>
              <TableCell sx={{ width: 130 }}>Cuentas PCGE</TableCell>
              <TableCell align="right" sx={{ width: 210 }}>
                Importe (PEN)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seccionesOrden.map((sec) => {
              const items = activeDoc.rubros.filter((r) => r.seccion === sec);
              if (items.length === 0) return null;
              const subtotal = items.reduce((sum, r) => sum + r.importePen, 0);

              return (
                <React.Fragment key={sec}>
                  <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="caption" fontWeight={700} color="primary.main">
                        {SECCION_LABELS[sec]}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {items.map((rubro) => (
                    <TableRow key={rubro.codigoRubro} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={rubro.codigoRubro}
                          variant="outlined"
                          sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}
                        />
                      </TableCell>
                      <TableCell>{rubro.nombreRubro}</TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.secondary' }}
                        >
                          {rubro.cuentasPcge}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {isBorrador ? (
                          <TextField
                            type="number"
                            size="small"
                            value={rubro.importePen}
                            disabled={isAprobado}
                            inputProps={{
                              step: '100',
                              style: {
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                padding: '4px 8px',
                              },
                            }}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value);
                              onUpdateRubro(
                                activeDoc.id,
                                rubro.codigoRubro,
                                Number.isNaN(parsed) ? 0 : parsed
                              );
                            }}
                            sx={{ width: 150 }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight={500}>
                            {formatPen(rubro.importePen)}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" fontWeight={700}>
                        Subtotal {SECCION_LABELS[sec]}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {formatPen(subtotal)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}

            {/* Totales finales */}
            {tipoActivo === 'BALANCE_GENERAL' ? (
              <>
                <TableRow sx={{ backgroundColor: '#0F2942' }}>
                  <TableCell colSpan={3} sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                    TOTAL ACTIVO (PEN)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: '#FFFFFF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPen(resumenBG.totalActivo)}
                  </TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: '#1E3A5F' }}>
                  <TableCell colSpan={3} sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                    TOTAL PASIVO + PATRIMONIO (PEN)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: '#FFFFFF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPen(resumenBG.totalPasivoMasPatrimonio)}
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <>
                <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    UTILIDAD BRUTA (Ventas Netas − Costo de Ventas)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatPen(resumenER.utilidadBruta)}
                  </TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    UTILIDAD OPERATIVA (EBIT)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatPen(resumenER.utilidadOperativa)}
                  </TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: '#0F2942' }}>
                  <TableCell colSpan={3} sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                    UTILIDAD NETA DEL PERIODO (PEN)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: '#FFFFFF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPen(resumenER.utilidadNeta)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary">
        {isBorrador
          ? 'Modo edición habilitado (BORRADOR): puedes ajustar temporalmente un importe para verificar cómo la validación automática detecta descuadres y bloquea el paso a VALIDADO.'
          : isValidado
            ? 'Documento VALIDADO: los importes son de solo lectura y la exportación PLE está habilitada. Puedes aprobarlo definitivamente o devolverlo a BORRADOR.'
            : 'Documento APROBADO: bloqueado permanentemente contra ediciones y transiciones de estado.'}
      </Typography>
    </Stack>
  );
};
