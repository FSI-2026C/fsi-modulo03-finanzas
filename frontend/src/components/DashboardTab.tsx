import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import {
  EmpresaSimulada,
  EstadoFinancieroDoc,
  PartidaPresupuestal,
  PeriodoMes,
} from '../types/finance';
import {
  analizarPartidaPresupuestal,
  calcularResumenBalance,
  calcularResumenResultados,
  formatPen,
  formatPercent,
} from '../utils/formatters';

interface DashboardTabProps {
  empresa: EmpresaSimulada;
  mes: PeriodoMes;
  balanceDoc?: EstadoFinancieroDoc;
  resultadosDoc?: EstadoFinancieroDoc;
  partidasPresupuesto: PartidaPresupuestal[];
  onNavigateTab: (tabIndex: number) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  empresa,
  mes,
  balanceDoc,
  resultadosDoc,
  partidasPresupuesto,
  onNavigateTab,
}) => {
  const balance = calcularResumenBalance(balanceDoc);
  const resultados = calcularResumenResultados(resultadosDoc);
  const partidasAnalizadas = partidasPresupuesto.map(analizarPartidaPresupuestal);

  const liquidezCorriente =
    balance.pasivoCorriente > 0
      ? balance.activoCorriente / balance.pasivoCorriente
      : 0;
  const endeudamientoPct =
    balance.totalActivo > 0
      ? (balance.totalPasivo / balance.totalActivo) * 100
      : 0;
  const margenNetoPct =
    resultados.ventasNetas > 0
      ? (resultados.utilidadNeta / resultados.ventasNetas) * 100
      : null;

  const sobreejecutadas = partidasAnalizadas.filter(
    (p) => p.nivelAlerta === 'SOBREEJECUCION'
  );
  const excesoTotalPen = sobreejecutadas.reduce(
    (acc, p) => acc + Math.max(0, p.variacionAbsoluta),
    0
  );

  const liquidezStatus =
    liquidezCorriente >= 1.5
      ? { label: 'Óptimo', color: 'success' as const }
      : liquidezCorriente >= 1.0
        ? { label: 'Alerta preventiva', color: 'warning' as const }
        : { label: 'Crítico', color: 'error' as const };

  const endeudamientoStatus =
    endeudamientoPct <= 50
      ? { label: 'Saludable', color: 'success' as const }
      : endeudamientoPct <= 60
        ? { label: 'Moderado', color: 'warning' as const }
        : { label: 'Elevado (>60%)', color: 'error' as const };

  const margenStatus =
    margenNetoPct === null
      ? { label: 'Sin ventas (Apertura)', color: 'default' as const }
      : margenNetoPct >= 15
        ? { label: 'Óptimo', color: 'success' as const }
        : margenNetoPct >= 5
          ? { label: 'Aceptable', color: 'warning' as const }
          : { label: 'Bajo (<5%)', color: 'error' as const };

  const tieneDatos = Boolean(balanceDoc);

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h5">Dashboard Ejecutivo KPI</Typography>
          <Typography variant="body2" color="text.secondary">
            {empresa.razonSocial} (RUC {empresa.ruc}) · Periodo 2026-{mes} · Moneda PEN
          </Typography>
        </Box>
        {balanceDoc && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              label={`Balance General: ${balanceDoc.estado}`}
              color={
                balanceDoc.estado === 'APROBADO'
                  ? 'success'
                  : balanceDoc.estado === 'VALIDADO'
                    ? 'info'
                    : 'warning'
              }
              variant="outlined"
            />
            {resultadosDoc && (
              <Chip
                size="small"
                label={`Estado de Resultados: ${resultadosDoc.estado}`}
                color={
                  resultadosDoc.estado === 'APROBADO'
                    ? 'success'
                    : resultadosDoc.estado === 'VALIDADO'
                      ? 'info'
                      : 'warning'
                }
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Box>

      {!tieneDatos ? (
        <Alert severity="info">
          El periodo <strong>2026-{mes}</strong> se encuentra en estado{' '}
          <strong>ABIERTO</strong> en el Módulo II simulado (sin lote de saldos cerrados
          todavía). Selecciona <strong>Mes 00 (Apertura)</strong> o{' '}
          <strong>Mes 01 (Enero 2026)</strong> en la barra superior para visualizar los
          indicadores calculados.
        </Alert>
      ) : (
        <>
          {/* 4 Tarjetas KPI principales */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2.5,
            }}
          >
            {/* KPI 1: Liquidez Corriente */}
            <Paper variant="outlined" sx={{ p: 2.5, borderTop: '4px solid #0D9488' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Liquidez Corriente
                </Typography>
                <WaterDropOutlinedIcon color="secondary" fontSize="small" />
              </Stack>
              <Typography
                variant="h4"
                sx={{ mt: 1.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
              >
                {liquidezCorriente.toFixed(2)}x
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Activo Cte / Pasivo Cte ({formatPen(balance.activoCorriente)} /{' '}
                {formatPen(balance.pasivoCorriente)})
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Chip size="small" label={liquidezStatus.label} color={liquidezStatus.color} />
              </Box>
            </Paper>

            {/* KPI 2: Endeudamiento */}
            <Paper variant="outlined" sx={{ p: 2.5, borderTop: '4px solid #0F2942' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Endeudamiento Total
                </Typography>
                <AccountBalanceOutlinedIcon color="primary" fontSize="small" />
              </Stack>
              <Typography
                variant="h4"
                sx={{ mt: 1.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
              >
                {formatPercent(endeudamientoPct)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Pasivo Total / Activo Total ({formatPen(balance.totalPasivo)} /{' '}
                {formatPen(balance.totalActivo)})
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  size="small"
                  label={endeudamientoStatus.label}
                  color={endeudamientoStatus.color}
                />
              </Box>
            </Paper>

            {/* KPI 3: Margen Neto */}
            <Paper variant="outlined" sx={{ p: 2.5, borderTop: '4px solid #2563EB' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Margen Neto
                </Typography>
                <TrendingUpOutlinedIcon sx={{ color: '#2563EB' }} fontSize="small" />
              </Stack>
              <Typography
                variant="h4"
                sx={{ mt: 1.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
              >
                {margenNetoPct !== null ? formatPercent(margenNetoPct) : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {margenNetoPct !== null
                  ? `Utilidad Neta / Ventas (${formatPen(resultados.utilidadNeta)} / ${formatPen(
                      resultados.ventasNetas
                    )})`
                  : 'Periodo de apertura patrimonial (sin resultados)'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Chip size="small" label={margenStatus.label} color={margenStatus.color} />
              </Box>
            </Paper>

            {/* KPI 4: Alertas de Sobreejecución Presupuestal */}
            <Paper
              variant="outlined"
              onClick={() => onNavigateTab(2)}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                borderTop: `4px solid ${sobreejecutadas.length > 0 ? '#B91C1C' : '#15803D'}`,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 2 },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary">
                  Alertas Sobreejecución
                </Typography>
                {sobreejecutadas.length > 0 ? (
                  <WarningAmberRoundedIcon color="error" fontSize="small" />
                ) : (
                  <CheckCircleOutlineRoundedIcon color="success" fontSize="small" />
                )}
              </Stack>
              <Typography
                variant="h4"
                color={sobreejecutadas.length > 0 ? 'error.main' : 'success.main'}
                sx={{ mt: 1.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
              >
                {sobreejecutadas.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {sobreejecutadas.length > 0
                  ? `Desviación acumulada: +${formatPen(excesoTotalPen)}`
                  : partidasAnalizadas.length > 0
                    ? 'Todas las partidas dentro del límite'
                    : 'Sin partidas presupuestales en Mes 00'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  size="small"
                  label={
                    sobreejecutadas.length > 0
                      ? 'Requiere revisión →'
                      : 'Control en rango'
                  }
                  color={sobreejecutadas.length > 0 ? 'error' : 'success'}
                />
              </Box>
            </Paper>
          </Box>

          {/* Detalle analítico en 2 columnas */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2.5,
            }}
          >
            {/* Estructura Patrimonial */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Estructura Patrimonial (PEN)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Composición de Activos, Pasivos y Patrimonio mapeados desde Tabla 34 SUNAT.
              </Typography>
              <Stack spacing={2}>
                {[
                  {
                    label: 'Activo Corriente',
                    value: balance.activoCorriente,
                    pct: balance.totalActivo
                      ? (balance.activoCorriente / balance.totalActivo) * 100
                      : 0,
                    color: 'secondary' as const,
                  },
                  {
                    label: 'Activo No Corriente',
                    value: balance.activoNoCorriente,
                    pct: balance.totalActivo
                      ? (balance.activoNoCorriente / balance.totalActivo) * 100
                      : 0,
                    color: 'primary' as const,
                  },
                  {
                    label: 'Pasivo Total',
                    value: balance.totalPasivo,
                    pct: balance.totalActivo
                      ? (balance.totalPasivo / balance.totalActivo) * 100
                      : 0,
                    color: 'warning' as const,
                  },
                  {
                    label: 'Patrimonio Neto',
                    value: balance.totalPatrimonio,
                    pct: balance.totalActivo
                      ? (balance.totalPatrimonio / balance.totalActivo) * 100
                      : 0,
                    color: 'success' as const,
                  },
                ].map((item) => (
                  <Box key={item.label}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatPen(item.value)} ({item.pct.toFixed(1)}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Math.max(0, item.pct))}
                      color={item.color}
                      sx={{ height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' }}
                    />
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2.5 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Ecuación Contable (Activo = Pasivo + Patrimonio)
                </Typography>
                <Chip
                  size="small"
                  color={balance.estaCuadrado ? 'success' : 'error'}
                  label={
                    balance.estaCuadrado
                      ? `Cuadrado (${formatPen(balance.totalActivo)})`
                      : `Descuadre: ${formatPen(balance.diferencia)}`
                  }
                />
              </Stack>
            </Paper>

            {/* Panel de Alertas de Sobreejecución Presupuestal */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Alertas de Sobreejecución Presupuestal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cruce de Presupuesto M1 vs. Ejecutado M2 para el periodo 2026-{mes}.
              </Typography>

              {partidasAnalizadas.length === 0 ? (
                <Alert severity="info">
                  No existen partidas de ejecución presupuestal registradas para el periodo{' '}
                  <strong>2026-{mes}</strong> (Mes 00 corresponde a saldos de apertura).
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  {partidasAnalizadas.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor:
                          item.nivelAlerta === 'SOBREEJECUCION'
                            ? '#FCA5A5'
                            : item.nivelAlerta === 'ALERTA'
                              ? '#FCD34D'
                              : '#E2E8F0',
                        backgroundColor:
                          item.nivelAlerta === 'SOBREEJECUCION'
                            ? '#FEF2F2'
                            : item.nivelAlerta === 'ALERTA'
                              ? '#FFFBEB'
                              : '#F8FAFC',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {item.centroCostoCodigo} · {item.centroCostoNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cuenta {item.cuentaPcge} — {item.nombreCuenta}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={`${item.porcentajeEjecucion.toFixed(1)}%`}
                          color={
                            item.nivelAlerta === 'SOBREEJECUCION'
                              ? 'error'
                              : item.nivelAlerta === 'ALERTA'
                                ? 'warning'
                                : 'success'
                          }
                        />
                      </Stack>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        sx={{ mt: 0.75, fontVariantNumeric: 'tabular-nums' }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Ppto: {formatPen(item.presupuestadoPen)} · Ejec:{' '}
                          {formatPen(item.ejecutadoPen)}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={
                            item.variacionAbsoluta > 0 ? 'error.main' : 'success.main'
                          }
                        >
                          {item.variacionAbsoluta > 0 ? '+' : ''}
                          {formatPen(item.variacionAbsoluta)} (
                          {item.variacionPorcentual > 0 ? '+' : ''}
                          {item.variacionPorcentual.toFixed(2)}%)
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
        </>
      )}
    </Stack>
  );
};
