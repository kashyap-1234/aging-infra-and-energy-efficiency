from django.urls import path
from . import views

urlpatterns = [
    # Route to render the main map page
    path('', views.index, name='index'),

    # API endpoint to serve GeoJSON data for the map
    path('api/geojson/', views.get_geojson, name='geojson'),

    # API endpoint to fetch filtered data based on building age and feature
    path('api/filtered-data/', views.get_filtered_data, name='filtered_data'),

    # API endpoint to fetch ZIP code details for statistics
    path('api/zip-details/', views.get_zip_details, name='zip_details'),
]
