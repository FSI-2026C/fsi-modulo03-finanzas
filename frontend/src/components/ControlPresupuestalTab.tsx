import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {
  EmpresaSimulada,
  NivelAlertaPresupuesto,
  PartidaPresupuestal,
  PeriodoMes,
} from '../types/finance';
import {
  analizarPartidaPresupuestal,
  formatPen,
  formatPercent,
} from '../utils/formatters';

interface ControlPresupuestalTabProps {
  empresa: EmpresaSimulada;
  mes: PeriodoMes;
  partidas: PartidaPresupuestal[];
}

export const ControlPresupuestalTab: React.FC<ControlPresupuestalTabProps> = ({
  empresa,
  mes,
  partidas,
}) => {
  const [filtroCC, setFiltroCC] = useState<string>('TODOS');
  const [filtroAlerta, setFiltroAlerta] = useState<string>('TODOS');

  const analizadas = useMemo(
    () => partidas.map(analizarPartidaPresupuestal),
    [partidas]
  );

  const centrosCosto = useMemo(() => {
    const map = new Map<string, string>();
    analizadas.forEach((p) => map.set(p.centroCostoCodigo, p.centroCostoNombre));
    return Array.from(map.entries());
  }, [analizadas]);

  const filtradas = useMemo(() => {
    return analizadas.filter((p) => {
      if (filtroCC !== 'TODOS' && p.centroCostoCodigo !== filtroCC) return false;
      if (filtroAlerta !== 'TODOS' && p.nivelAlerta !== filtroAlerta) return false;
      return true;
    });
  }, [analizadas, filtroCC, filtroAlerta]);

  const totalPresupuestado = filtradas.reduce((acc, p) => acc + p.presupuestadoPen, 0);
  const totalEjecutado = filtradas.reduce((acc, p) => acc + p.ejecutadoPen, 0);
  const totalVariacionAbs = Number((totalEjecutado - totalPresupuestado).toFixed(2));
  const totalVariacionPct =
    totalPresupuestado > 0 ? (totalVariacionAbs / totalPresupuestado) * 100 : 0;
  const ejecucionGlobalPct =
    totalPresupuestado > 0 ? (totalEjecutado / totalPresupuestado) * 100 : 0;

  const renderSemaforo = (nivel: NivelAlertaPresupuesto) => {
    if (nivel === 'SOBREEJECUCION') {
      return (
        <Chip
          size="small"
          color="error"
          icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
          label="SOBREEJECUCIÓN"
        />
      );
    }
    if (nivel === 'ALERTA') {
      return (
        <Chip
          size="small"
          color="warning"
          icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
          label="ALERTA (85–100%)"
        />
      );
    }
    return (
      <Chip
        size="small"
        color="success"
        icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
        label="NORMAL (<85%)"
      />
    );
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5">
          Control Presupuestal · Presupuestado (M1) vs. Ejecutado (M2)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {empresa.razonSocial} · Periodo 2026-{mes} · Comparación por centro de costo y
          cuenta PCGE en PEN.
        </Typography>
      </Box>

      {analizadas.length === 0 ? (
        <Alert severity="info">
          No existen partidas presupuestales registradas para el periodo{' '}
          <strong>2026-{mes}</strong>. Selecciona <strong>Mes 01 (Enero 2026)</strong> en la
          barra superior para analizar la ejecución presupuestal simulada.
        </Alert>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                TOTAL PRESUPUESTADO (M1)
              </Typography>
              <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
                {formatPen(totalPresupuestado)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                TOTAL EJECUTADO (M2)
              </Typography>
              <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
                {formatPen(totalEjecutado)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                VARIACIÓN ABSOLUTA
              </Typography>
              <Typography
                variant="h6"
                color={totalVariacionAbs > 0 ? 'error.main' : 'success.main'}
                sx={{ fontVariantNumeric: 'tabular-nums', mt: 0.5 }}
              >
                {totalVariacionAbs > 0 ? '+' : ''}
                {formatPen(totalVariacionAbs)}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                EJECUCIÓN GLOBAL
              </Typography>
              <Typography
                variant="h6"
                color={ejecucionGlobalPct > 100 ? 'error.main' : 'primary.main'}
                sx={{ fontVariantNumeric: 'tabular-nums', mt: 0.5 }}
              >
                {formatPercent(ejecucionGlobalPct)}
              </Typography>
            </Paper>
          </Box>

          {/* Filtros */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Centro de Costo</InputLabel>
              <Select
                label="Centro de Costo"
                value={filtroCC}
                onChange={(e) => setFiltroCC(e.target.value)}
              >
                <MenuItem value="TODOS">Todos los Centros de Costo</MenuItem>
                {centrosCosto.map(([cod, nom]) => (
                  <MenuItem key={cod} value={cod}>
                    {cod} — {nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Semáforo de Alerta</InputLabel>
              <Select
                label="Semáforo de Alerta"
                value={filtroAlerta}
                onChange={(e) => setFiltroAlerta(e.target.value)}
              >
                <MenuItem value="TODOS">Todos los niveles</MenuItem>
                <MenuItem value="SOBREEJECUCION">Rojo · Sobreejecución (&gt;100%)</MenuItem>
                <MenuItem value="ALERTA">Ámbar · Alerta (85–100%)</MenuItem>
                <MenuItem value="NORMAL">Verde · Normal (&lt;85%)</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Tabla comparativa */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Centro de Costo</TableCell>
                  <TableCell>Cuenta PCGE</TableCell>
                  <TableCell align="right">Presupuestado M1 (PEN)</TableCell>
                  <TableCell align="right">Ejecutado M2 (PEN)</TableCell>
                  <TableCell align="right">Variación Abs. (PEN)</TableCell>
                  <TableCell align="right">Variación %</TableCell>
                  <TableCell sx={{ width: 150 }}>Avance</TableCell>
                  <TableCell align="center">Semáforo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtradas.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      backgroundColor:
                        row.nivelAlerta === 'SOBREEJECUCION' ? '#FEF2F2' : undefined,
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.centroCostoCodigo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.centroCostoNombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {row.cuentaPcge}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.nombreCuenta}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPen(row.presupuestadoPen)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatPen(row.ejecutadoPen)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: row.variacionAbsoluta > 0 ? 'error.main' : 'success.main',
                      }}
                    >
                      {row.variacionAbsoluta > 0 ? '+' : ''}
                      {formatPen(row.variacionAbsoluta)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: row.variacionPorcentual > 0 ? 'error.main' : 'success.main',
                      }}
                    >
                      {row.variacionPorcentual > 0 ? '+' : ''}
                      {formatPercent(row.variacionPorcentual)}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatPercent(row.porcentajeEjecucion)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, row.porcentajeEjecucion)}
                          color={
                            row.nivelAlerta === 'SOBREEJECUCION'
                              ? 'error'
                              : row.nivelAlerta === 'ALERTA'
                                ? 'warning'
                                : 'success'
                          }
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="center">{renderSemaforo(row.nivelAlerta)}</TableCell>
                  </TableRow>
                ))}

                {/* Fila de totales */}
                <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>
                    TOTAL CONSOLIDADO ({filtradas.length} partidas)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPen(totalPresupuestado)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPen(totalEjecutado)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: totalVariacionAbs > 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {totalVariacionAbs > 0 ? '+' : ''}
                    {formatPen(totalVariacionAbs)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: totalVariacionPct > 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {totalVariacionPct > 0 ? '+' : ''}
                    {formatPercent(totalVariacionPct)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Stack>
  );
};
