"""Vistas DRF del Módulo III preparadas para documentación OpenAPI (drf-spectacular)."""
from decimal import Decimal
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    EstadoFinancieroResponseSerializer,
    GenerarEstadoFinancieroRequestSerializer,
)

# Dataset de referencia coherente con database/seeds_simulacion_m1_m2.sql
SIMULATED_EEFF_CATALOG = [
    {
        "id": 1,
        "empresa_id": 1,
        "anio": 2026,
        "mes": "00",
        "catalogo_tabla22": "01",
        "formato_ple": "3.1",
        "tipo_eeff": "BALANCE_GENERAL",
        "moneda": "PEN",
        "estado": "VALIDADO",
        "total_activo": Decimal("850000.00"),
        "total_pasivo": Decimal("350000.00"),
        "total_patrimonio": Decimal("500000.00"),
        "ecuacion_cuadrada": True,
        "habilitado_ple": True,
        "origen_datos": "SIMULACION_M1_M2",
        "rubros": [
            {"codigo_rubro": "1D0109", "nombre_rubro": "Efectivo y Equivalentes al Efectivo", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("185000.00")},
            {"codigo_rubro": "1D0103", "nombre_rubro": "Cuentas por Cobrar Comerciales (neto)", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("120000.00")},
            {"codigo_rubro": "1D0105", "nombre_rubro": "Otras Cuentas por Cobrar (neto)", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("15000.00")},
            {"codigo_rubro": "1D0106", "nombre_rubro": "Inventarios (Existencias)", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("160000.00")},
            {"codigo_rubro": "1D0112", "nombre_rubro": "Servicios y Otros Contratados por Anticipado", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("20000.00")},
            {"codigo_rubro": "1D0205", "nombre_rubro": "Propiedades, Planta y Equipo (neto)", "seccion": "ACTIVO_NO_CORRIENTE", "importe_pen": Decimal("350000.00")},
            {"codigo_rubro": "1D0301", "nombre_rubro": "Tributos, Contraprestaciones y Aportes por Pagar", "seccion": "PASIVO_CORRIENTE", "importe_pen": Decimal("32000.00")},
            {"codigo_rubro": "1D0302", "nombre_rubro": "Remuneraciones y Participaciones por Pagar", "seccion": "PASIVO_CORRIENTE", "importe_pen": Decimal("28000.00")},
            {"codigo_rubro": "1D0303", "nombre_rubro": "Cuentas por Pagar Comerciales", "seccion": "PASIVO_CORRIENTE", "importe_pen": Decimal("140000.00")},
            {"codigo_rubro": "1D0401", "nombre_rubro": "Obligaciones Financieras a Largo Plazo", "seccion": "PASIVO_NO_CORRIENTE", "importe_pen": Decimal("150000.00")},
            {"codigo_rubro": "1D0701", "nombre_rubro": "Capital Emitido", "seccion": "PATRIMONIO", "importe_pen": Decimal("400000.00")},
            {"codigo_rubro": "1D0704", "nombre_rubro": "Otras Reservas de Capital (Reserva Legal)", "seccion": "PATRIMONIO", "importe_pen": Decimal("40000.00")},
            {"codigo_rubro": "1D0707", "nombre_rubro": "Resultados Acumulados", "seccion": "PATRIMONIO", "importe_pen": Decimal("60000.00")},
        ],
    },
    {
        "id": 2,
        "empresa_id": 1,
        "anio": 2026,
        "mes": "01",
        "catalogo_tabla22": "01",
        "formato_ple": "3.1",
        "tipo_eeff": "BALANCE_GENERAL",
        "moneda": "PEN",
        "estado": "BORRADOR",
        "total_activo": Decimal("895000.00"),
        "total_pasivo": Decimal("355000.00"),
        "total_patrimonio": Decimal("540000.00"),
        "ecuacion_cuadrada": True,
        "habilitado_ple": False,
        "origen_datos": "SIMULACION_M1_M2",
        "rubros": [
            {"codigo_rubro": "1D0109", "nombre_rubro": "Efectivo y Equivalentes al Efectivo", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("224000.00")},
            {"codigo_rubro": "1D0103", "nombre_rubro": "Cuentas por Cobrar Comerciales (neto)", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("148000.00")},
            {"codigo_rubro": "1D0105", "nombre_rubro": "Otras Cuentas por Cobrar (neto)", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("16000.00")},
            {"codigo_rubro": "1D0106", "nombre_rubro": "Inventarios (Existencias)", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("144000.00")},
            {"codigo_rubro": "1D0112", "nombre_rubro": "Servicios y Otros Contratados por Anticipado", "seccion": "ACTIVO_CORRIENTE", "importe_pen": Decimal("18000.00")},
            {"codigo_rubro": "1D0205", "nombre_rubro": "Propiedades, Planta y Equipo (neto)", "seccion": "ACTIVO_NO_CORRIENTE", "importe_pen": Decimal("345000.00")},
            {"codigo_rubro": "1D0301", "nombre_rubro": "Tributos, Contraprestaciones y Aportes por Pagar", "seccion": "PASIVO_CORRIENTE", "importe_pen": Decimal("38000.00")},
            {"codigo_rubro": "1D0302", "nombre_rubro": "Remuneraciones y Participaciones por Pagar", "seccion": "PASIVO_CORRIENTE", "importe_pen": Decimal("31000.00")},
            {"codigo_rubro": "1D0303", "nombre_rubro": "Cuentas por Pagar Comerciales", "seccion": "PASIVO_CORRIENTE", "importe_pen": Decimal("146000.00")},
            {"codigo_rubro": "1D0401", "nombre_rubro": "Obligaciones Financieras a Largo Plazo", "seccion": "PASIVO_NO_CORRIENTE", "importe_pen": Decimal("140000.00")},
            {"codigo_rubro": "1D0701", "nombre_rubro": "Capital Emitido", "seccion": "PATRIMONIO", "importe_pen": Decimal("400000.00")},
            {"codigo_rubro": "1D0704", "nombre_rubro": "Otras Reservas de Capital (Reserva Legal)", "seccion": "PATRIMONIO", "importe_pen": Decimal("40000.00")},
            {"codigo_rubro": "1D0707", "nombre_rubro": "Resultados Acumulados", "seccion": "PATRIMONIO", "importe_pen": Decimal("60000.00")},
            {"codigo_rubro": "1D0708", "nombre_rubro": "Resultado del Ejercicio", "seccion": "PATRIMONIO", "importe_pen": Decimal("40000.00")},
        ],
    },
]


class EstadoFinancieroListCreateAPIView(APIView):
    """Endpoint base /api/v1/eeff/ para consultar y generar Estados Financieros en PEN."""

    @extend_schema(
        tags=["Estados Financieros"],
        summary="Listar Estados Financieros por empresa y periodo (00–13)",
        description=(
            "Retorna los Estados Financieros (Balance General y Estado de Resultados) "
            "en moneda única PEN con rubros SUNAT Tabla 34 y validación de ecuación contable."
        ),
        parameters=[
            OpenApiParameter(
                name="empresa_id",
                type=int,
                required=False,
                description="Filtrar por identificador de empresa (ej. 1 o 2).",
            ),
            OpenApiParameter(
                name="anio",
                type=int,
                required=False,
                description="Filtrar por ejercicio fiscal (ej. 2026).",
            ),
            OpenApiParameter(
                name="mes",
                type=str,
                required=False,
                description="Filtrar por periodo contable entre '00' y '13'.",
            ),
            OpenApiParameter(
                name="tipo_eeff",
                type=str,
                required=False,
                enum=["BALANCE_GENERAL", "ESTADO_RESULTADOS"],
                description="Tipo de Estado Financiero.",
            ),
        ],
        responses={200: EstadoFinancieroResponseSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        empresa_id = request.query_params.get("empresa_id")
        anio = request.query_params.get("anio")
        mes = request.query_params.get("mes")
        tipo_eeff = request.query_params.get("tipo_eeff")

        resultados = SIMULATED_EEFF_CATALOG
        if empresa_id:
            resultados = [r for r in resultados if str(r["empresa_id"]) == str(empresa_id)]
        if anio:
            resultados = [r for r in resultados if str(r["anio"]) == str(anio)]
        if mes:
            resultados = [r for r in resultados if r["mes"] == mes]
        if tipo_eeff:
            resultados = [r for r in resultados if r["tipo_eeff"] == tipo_eeff]

        serializer = EstadoFinancieroResponseSerializer(resultados, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Estados Financieros"],
        summary="Generar snapshot BORRADOR de Estado Financiero",
        description=(
            "Crea un nuevo Estado Financiero en estado BORRADOR en moneda única PEN "
            "para la empresa y periodo contable (00–13) indicados."
        ),
        request=GenerarEstadoFinancieroRequestSerializer,
        responses={201: EstadoFinancieroResponseSerializer},
    )
    def post(self, request: Request) -> Response:
        req_serializer = GenerarEstadoFinancieroRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)
        data = req_serializer.validated_data

        es_bg = data["tipo_eeff"] == "BALANCE_GENERAL"
        nuevo = {
            "id": len(SIMULATED_EEFF_CATALOG) + 1,
            "empresa_id": data["empresa_id"],
            "anio": data["anio"],
            "mes": data["mes"],
            "catalogo_tabla22": "01" if es_bg else "02",
            "formato_ple": "3.1" if es_bg else "3.20",
            "tipo_eeff": data["tipo_eeff"],
            "moneda": "PEN",
            "estado": "BORRADOR",
            "total_activo": Decimal("0.00"),
            "total_pasivo": Decimal("0.00"),
            "total_patrimonio": Decimal("0.00"),
            "ecuacion_cuadrada": True,
            "habilitado_ple": False,
            "origen_datos": "SIMULACION_M1_M2",
            "rubros": [],
        }
        res_serializer = EstadoFinancieroResponseSerializer(nuevo)
        return Response(res_serializer.data, status=status.HTTP_201_CREATED)
