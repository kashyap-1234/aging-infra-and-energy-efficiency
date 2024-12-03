from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # Main page
    path('api/geojson/', views.get_geojson, name='get_geojson'),  # API for GeoJSON
]