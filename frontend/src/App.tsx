import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
  ANIO_EJERCICIO,
  buildDocKey,
  createInitialEstadosFinancieros,
  EMPRESAS_SIMULADAS,
  PARTIDAS_PRESUPUESTALES_SIMULADAS,
  PERIODOS_CONTABLES,
} from './data/simulationData';
import {
  EstadoCicloVida,
  EstadoFinancieroDoc,
  ExportacionPleRegistro,
  PeriodoMes,
} from './types/finance';
import { DashboardTab } from './components/DashboardTab';
import { EstadosFinancierosTab } from './components/EstadosFinancierosTab';
import { ControlPresupuestalTab } from './components/ControlPresupuestalTab';
import { ExportacionPleTab } from './components/ExportacionPleTab';

export const App: React.FC = () => {
  const [empresaId, setEmpresaId] = useState<number>(1);
  const [mes, setMes] = useState<PeriodoMes>('01');
  const [activeTab, setActiveTab] = useState<number>(0);

  const [docsById, setDocsById] = useState<Record<string, EstadoFinancieroDoc>>(() =>
    createInitialEstadosFinancieros()
  );
  const [pleLogs, setPleLogs] = useState<ExportacionPleRegistro[]>([]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'info' });

  const empresaActual = useMemo(
    () => EMPRESAS_SIMULADAS.find((e) => e.id === empresaId) ?? EMPRESAS_SIMULADAS[0],
    [empresaId]
  );

  const balanceDoc = docsById[buildDocKey(empresaId, mes, 'BALANCE_GENERAL')];
  const resultadosDoc = docsById[buildDocKey(empresaId, mes, 'ESTADO_RESULTADOS')];

  const partidasPeriodo = useMemo(
    () =>
      PARTIDAS_PRESUPUESTALES_SIMULADAS.filter(
        (p) => p.empresaId === empresaId && p.mes === mes
      ),
    [empresaId, mes]
  );

  const handleUpdateRubro = (
    docId: string,
    codigoRubro: string,
    nuevoImportePen: number
  ) => {
    setDocsById((prev) => {
      const target = prev[docId];
      // Bloqueo estricto: nunca permitir edición si el estado es APROBADO o distinto de BORRADOR
      if (!target || target.estado !== 'BORRADOR') return prev;
      return {
        ...prev,
        [docId]: {
          ...target,
          rubros: target.rubros.map((r) =>
            r.codigoRubro === codigoRubro ? { ...r, importePen: nuevoImportePen } : r
          ),
        },
      };
    });
  };

  const handleResetDoc = (docId: string) => {
    const iniciales = createInitialEstadosFinancieros();
    const original = iniciales[docId];
    setDocsById((prev) => {
      const current = prev[docId];
      if (!current || current.estado === 'APROBADO' || !original) return prev;
      return {
        ...prev,
        [docId]: {
          ...original,
          estado: 'BORRADOR',
        },
      };
    });
    setToast({
      open: true,
      message: 'Importes restaurados desde el lote simulado de Módulo II (PEN).',
      severity: 'info',
    });
  };

  const handleTransitionEstado = (docId: string, nuevoEstado: EstadoCicloVida) => {
    setDocsById((prev) => {
      const target = prev[docId];
      if (!target) return prev;
      // Regla de inmutabilidad: si ya está APROBADO, se bloquea cualquier cambio
      if (target.estado === 'APROBADO') return prev;

      const timestamp = new Date().toLocaleString('es-PE');
      const updated: EstadoFinancieroDoc = {
        ...target,
        estado: nuevoEstado,
        validadoPor:
          nuevoEstado === 'VALIDADO' ? 'contador.m3@unsa.edu.pe' : target.validadoPor,
        fechaValidacion:
          nuevoEstado === 'VALIDADO' ? timestamp : target.fechaValidacion,
        aprobadoPor:
          nuevoEstado === 'APROBADO' ? 'gerencia.finanzas@unsa.edu.pe' : target.aprobadoPor,
        fechaAprobacion:
          nuevoEstado === 'APROBADO' ? timestamp : target.fechaAprobacion,
      };

      return { ...prev, [docId]: updated };
    });

    if (nuevoEstado === 'VALIDADO') {
      setToast({
        open: true,
        message: 'Estado Financiero VALIDADO. La exportación PLE ya está habilitada.',
        severity: 'info',
      });
    } else if (nuevoEstado === 'APROBADO') {
      setToast({
        open: true,
        message:
          'Estado Financiero APROBADO definitivamente. Documento bloqueado contra ediciones.',
        severity: 'success',
      });
    } else {
      setToast({
        open: true,
        message: 'Documento devuelto a estado BORRADOR para correcciones.',
        severity: 'warning',
      });
    }
  };

  const handleRegistrarExportacion = (registro: ExportacionPleRegistro) => {
    setPleLogs((prev) => [registro, ...prev]);
    setToast({
      open: true,
      message: `Archivo ${registro.nombreArchivo} generado y descargado correctamente.`,
      severity: 'success',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Barra superior con Badge visible, Selector de Empresa y Selector de Periodo (00 a 13) */}
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar
          sx={{
            flexWrap: 'wrap',
            gap: 2,
            py: 1.25,
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 28, color: '#5EEAD4' }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                ERP Académico · Módulo III Finanzas
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                Estados Financieros, Control Presupuestal y Analítica · UNSA
              </Typography>
            </Box>

            <Chip
              icon={<ScienceRoundedIcon sx={{ color: '#451A03 !important' }} />}
              label="MODO SIMULACIÓN M1/M2 · MONEDA PEN"
              size="small"
              sx={{
                ml: { xs: 0, md: 1.5 },
                fontWeight: 700,
                letterSpacing: '0.02em',
                backgroundColor: '#FDE68A',
                color: '#451A03',
                border: '1px solid #F59E0B',
              }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            {/* Selector de Empresa */}
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel
                id="empresa-select-label"
                sx={{ color: 'rgba(255,255,255,0.8)', '&.Mui-focused': { color: '#5EEAD4' } }}
              >
                Empresa (Multiempresa)
              </InputLabel>
              <Select
                labelId="empresa-select-label"
                label="Empresa (Multiempresa)"
                value={empresaId}
                onChange={(e) => setEmpresaId(Number(e.target.value))}
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.6)',
                  },
                  '.MuiSvgIcon-root': { color: '#FFFFFF' },
                }}
              >
                {EMPRESAS_SIMULADAS.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.nombreComercial} ({emp.tipoEntorno === 'OFICIAL' ? 'Oficial' : 'Prueba'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selector de Periodo 00 a 13 */}
            <FormControl size="small" sx={{ minWidth: 210 }}>
              <InputLabel
                id="periodo-select-label"
                sx={{ color: 'rgba(255,255,255,0.8)', '&.Mui-focused': { color: '#5EEAD4' } }}
              >
                Periodo ({ANIO_EJERCICIO} · 00–13)
              </InputLabel>
              <Select
                labelId="periodo-select-label"
                label={`Periodo (${ANIO_EJERCICIO} · 00–13)`}
                value={mes}
                onChange={(e) => setMes(e.target.value as PeriodoMes)}
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.6)',
                  },
                  '.MuiSvgIcon-root': { color: '#FFFFFF' },
                }}
              >
                {PERIODOS_CONTABLES.map((p) => (
                  <MenuItem key={p.mes} value={p.mes}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                      sx={{ width: '100%' }}
                    >
                      <span>{p.label}</span>
                      {p.tieneSaldosSimulados && (
                        <Chip size="small" label="M2 OK" color="success" sx={{ height: 20, fontSize: 10 }} />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Toolbar>

        {/* Navegación de 4 pestañas */}
        <Paper square elevation={0} sx={{ borderBottom: '1px solid #CBD5E1' }}>
          <Container maxWidth="xl">
            <Tabs
              value={activeTab}
              onChange={(_, newValue: number) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="secondary"
            >
              <Tab
                icon={<DashboardOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Dashboard KPI"
              />
              <Tab
                icon={<AssessmentOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Estados Financieros"
              />
              <Tab
                icon={<TrackChangesOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Control Presupuestal"
              />
              <Tab
                icon={<DescriptionOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Exportación PLE"
              />
            </Tabs>
          </Container>
        </Paper>
      </AppBar>

      {/* Contenido principal */}
      <Container maxWidth="xl" sx={{ py: 3.5, flex: 1 }}>
        {activeTab === 0 && (
          <DashboardTab
            empresa={empresaActual}
            mes={mes}
            balanceDoc={balanceDoc}
            resultadosDoc={resultadosDoc}
            partidasPresupuesto={partidasPeriodo}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 1 && (
          <EstadosFinancierosTab
            empresa={empresaActual}
            mes={mes}
            balanceDoc={balanceDoc}
            resultadosDoc={resultadosDoc}
            onUpdateRubro={handleUpdateRubro}
            onResetDoc={handleResetDoc}
            onTransitionEstado={handleTransitionEstado}
            onSelectPeriodo={setMes}
          />
        )}

        {activeTab === 2 && (
          <ControlPresupuestalTab
            empresa={empresaActual}
            mes={mes}
            partidas={partidasPeriodo}
          />
        )}

        {activeTab === 3 && (
          <ExportacionPleTab
            empresa={empresaActual}
            mes={mes}
            balanceDoc={balanceDoc}
            resultadosDoc={resultadosDoc}
            logs={pleLogs}
            onRegistrarExportacion={handleRegistrarExportacion}
            onGoToEstadosFinancieros={() => setActiveTab(1)}
          />
        )}
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;
