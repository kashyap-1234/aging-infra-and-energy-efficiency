from django.shortcuts import render
from django.http import JsonResponse
import json
from pathlib import Path
import pandas as pd

# Load the dataset globally to avoid reloading it for every request
data_path = Path('data/cleaned_data.csv')
data = pd.read_csv(data_path)

# Index view
def index(request):
    return render(request, 'chicago_map_app/index.html')

# GeoJSON data view
def get_geojson(request):
    geojson_path = Path('data/Chicago.geojson')
    if geojson_path.exists():
        with geojson_path.open('r') as file:
            geojson_data = json.load(file)
        return JsonResponse(geojson_data, safe=False)
    return JsonResponse({"error": "GeoJSON file not found"}, status=404)

# Filtered data view
def get_filtered_data(request):
    try:
        # Retrieve parameters from the request
        building_age_threshold = int(request.GET.get('building_age', 0))
        feature = request.GET.get('feature', 'Building Area')

        # Calculate the minimum year based on the building age threshold
        current_year = 2024
        min_year_built = current_year - building_age_threshold

        # Filter the dataset based on 'Year Built'
        filtered_data = data[data['Year Built'] >= min_year_built]

        # Check if the selected feature exists in the dataset
        if feature in filtered_data.columns:
            # Aggregate data by ZIP Code and return the result
            agg_data = filtered_data.groupby('ZIP Code').mean()[[feature]].reset_index()
            return JsonResponse(agg_data.to_dict(orient='records'), safe=False)

        return JsonResponse({"error": "Feature not found"}, status=400)
    except Exception as e:
        print(f"Error in get_filtered_data: {e}")
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)

# ZIP code details view
def get_zip_details(request):
    try:
        # Retrieve ZIP code from the request
        zip_code = request.GET.get('zip_code', None)
        if not zip_code:
            return JsonResponse({"error": "ZIP Code not provided"}, status=400)

        # Filter the dataset for the specific ZIP Code
        zip_data = data[data['ZIP Code'] == int(zip_code)]

        if not zip_data.empty:
            # Calculate average values for the required columns
            stats = {
                'Building Area': zip_data['Building Area'].mean(),
                'GHG Emissions': zip_data['GHG Emissions'].mean(),
                'Natural Gas Use': zip_data['Natural Gas Use'].mean(),
                'Electricity Use': zip_data['Electricity Use'].mean(),
            }
            return JsonResponse(stats)
        return JsonResponse({"error": "No data found for this ZIP Code"}, status=404)
    except Exception as e:
        print(f"Error in get_zip_details: {e}")
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)
