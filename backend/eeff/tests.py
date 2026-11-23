from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class EstadoFinancieroApiTests(APITestCase):
    def test_listar_eeff_retorna_200_en_pen(self) -> None:
        url = reverse("eeff-list-create")
        response = self.client.get(url, {"empresa_id": 1, "mes": "01"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["moneda"], "PEN")
        self.assertTrue(response.data[0]["ecuacion_cuadrada"])

    def test_crear_eeff_borrador_rechaza_mes_invalido(self) -> None:
        url = reverse("eeff-list-create")
        response = self.client.post(
            url,
            {
                "empresa_id": 1,
                "anio": 2026,
                "mes": "14",
                "tipo_eeff": "BALANCE_GENERAL",
                "moneda": "PEN",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
