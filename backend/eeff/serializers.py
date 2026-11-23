"""Serializers DRF documentables con drf-spectacular (OpenAPI 3.0)."""
from decimal import Decimal
from rest_framework import serializers


class RubroSunatSerializer(serializers.Serializer):
    codigo_rubro = serializers.CharField(help_text="Código oficial SUNAT Tabla 34 (ej. 1D0109).")
    nombre_rubro = serializers.CharField(help_text="Denominación del rubro SUNAT Tabla 34.")
    seccion = serializers.CharField(help_text="Sección financiera (ACTIVO_CORRIENTE, PASIVO_CORRIENTE, etc.).")
    importe_pen = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        help_text="Importe del rubro expresado en moneda única PEN.",
    )


class EstadoFinancieroResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(help_text="Identificador único del snapshot de Estado Financiero.")
    empresa_id = serializers.IntegerField(help_text="Identificador de empresa (multiempresa).")
    anio = serializers.IntegerField(help_text="Año fiscal (ej. 2026).")
    mes = serializers.CharField(help_text="Periodo contable entre '00' (Apertura) y '13' (Cierre).")
    catalogo_tabla22 = serializers.CharField(help_text="Código SUNAT Tabla 22 ('01' BG, '02' ER).")
    formato_ple = serializers.CharField(help_text="Formato PLE SUNAT ('3.1' o '3.20').")
    tipo_eeff = serializers.ChoiceField(choices=["BALANCE_GENERAL", "ESTADO_RESULTADOS"])
    moneda = serializers.CharField(default="PEN", help_text="Moneda única v1: PEN.")
    estado = serializers.ChoiceField(choices=["BORRADOR", "VALIDADO", "APROBADO"])
    total_activo = serializers.DecimalField(max_digits=18, decimal_places=2)
    total_pasivo = serializers.DecimalField(max_digits=18, decimal_places=2)
    total_patrimonio = serializers.DecimalField(max_digits=18, decimal_places=2)
    ecuacion_cuadrada = serializers.BooleanField(
        help_text="True si Activo == Pasivo + Patrimonio."
    )
    habilitado_ple = serializers.BooleanField(
        help_text="True únicamente cuando estado es VALIDADO o APROBADO."
    )
    origen_datos = serializers.CharField(help_text="Modo de origen (SIMULACION_M1_M2 o PRODUCCION_M1_M2).")
    rubros = RubroSunatSerializer(many=True)


class GenerarEstadoFinancieroRequestSerializer(serializers.Serializer):
    empresa_id = serializers.IntegerField(min_value=1, help_text="ID de la empresa.")
    anio = serializers.IntegerField(min_value=2000, max_value=2100, default=2026)
    mes = serializers.RegexField(
        regex=r"^(0[0-9]|1[0-3])$",
        help_text="Periodo contable entre '00' y '13'.",
    )
    tipo_eeff = serializers.ChoiceField(
        choices=["BALANCE_GENERAL", "ESTADO_RESULTADOS"],
        default="BALANCE_GENERAL",
    )
    moneda = serializers.ChoiceField(choices=["PEN"], default="PEN")
    observaciones = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_moneda(self, value: str) -> str:
        if value != "PEN":
            raise serializers.ValidationError("El Módulo III v1 opera únicamente en moneda PEN.")
        return value


class EcuacionContableResumenSerializer(serializers.Serializer):
    total_activo = serializers.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    total_pasivo_mas_patrimonio = serializers.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    diferencia = serializers.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    cuadrado = serializers.BooleanField()
