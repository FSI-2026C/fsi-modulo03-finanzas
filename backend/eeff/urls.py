from django.urls import path
from .views import EstadoFinancieroListCreateAPIView

urlpatterns = [
    path("", EstadoFinancieroListCreateAPIView.as_view(), name="eeff-list-create"),
]
