from django.shortcuts import render
from django.http import JsonResponse
import json
from pathlib import Path

def index(request):
    return render(request, 'chicago_map_app/index.html')

def get_geojson(request):
    # Path to the processed GeoJSON file
    geojson_path = Path('data/Chicago.geojson')
    if geojson_path.exists():
        with geojson_path.open('r') as file:
            data = json.load(file)
        return JsonResponse(data)
    return JsonResponse({"error": "GeoJSON file not found"}, status=404)
