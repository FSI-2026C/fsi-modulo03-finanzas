"""Modelos base de Django alineados a database/schema_modulo03.sql."""
from django.core.validators import RegexValidator
from django.db import models

MES_CONTABLES_CHOICES = [(f"{m:02d}", f"Mes {m:02d}") for m in range(14)]


class EstadoFinanciero(models.Model):
    class TipoEEFF(models.TextChoices):
        BALANCE_GENERAL = "BALANCE_GENERAL", "Balance General (PLE 3.1)"
        ESTADO_RESULTADOS = "ESTADO_RESULTADOS", "Estado de Resultados (PLE 3.20)"

    class EstadoCiclo(models.TextChoices):
        BORRADOR = "BORRADOR", "Borrador"
        VALIDADO = "VALIDADO", "Validado"
        APROBADO = "APROBADO", "Aprobado"

    empresa_id = models.BigIntegerField(db_index=True)
    anio = models.PositiveSmallIntegerField()
    mes = models.CharField(
        max_length=2,
        choices=MES_CONTABLES_CHOICES,
        validators=[RegexValidator(r"^(0[0-9]|1[0-3])$", "El mes debe estar entre '00' y '13'.")],
    )
    catalogo_codigo = models.CharField(max_length=4, default="01")
    tipo_eeff = models.CharField(max_length=30, choices=TipoEEFF.choices)
    moneda = models.CharField(max_length=3, default="PEN", editable=False)
    version = models.PositiveSmallIntegerField(default=1)
    estado = models.CharField(
        max_length=15,
        choices=EstadoCiclo.choices,
        default=EstadoCiclo.BORRADOR,
    )
    total_activo = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_pasivo = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_patrimonio = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    resultado_periodo = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    ecuacion_cuadrada = models.BooleanField(default=False)
    observaciones = models.TextField(blank=True, default="")

    # Auditoría
    creado_por = models.CharField(max_length=100, default="sistema_m3")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    modificado_por = models.CharField(max_length=100, blank=True, null=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "m3_estado_financiero"
        ordering = ["-anio", "-mes", "tipo_eeff"]
        constraints = [
            models.UniqueConstraint(
                fields=["empresa_id", "anio", "mes", "tipo_eeff", "version"],
                name="uq_django_m3_eeff_emp_per_tipo_ver",
            )
        ]

    def __str__(self) -> str:
        return f"EEFF #{self.pk} | Emp {self.empresa_id} | {self.anio}-{self.mes} | {self.tipo_eeff} ({self.estado})"
