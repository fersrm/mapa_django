from django.urls import path
from MapaApp import views

urlpatterns = [
    path("", views.MapaTemplaView.as_view(), name="Mapa"),
    path("mapa_carga/", views.MapaFormView.as_view(), name="MapaCarga"),
]
