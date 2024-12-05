from django.shortcuts import render
from django.http import JsonResponse
from pathlib import Path
import json
import pandas as pd

# Load and preprocess data
data_path = Path('data/cleaned_data.csv')
if data_path.exists():
    data = pd.read_csv(data_path)
    data['Year Built'] = pd.to_numeric(data['Year Built'], errors='coerce')
    data['ZIP Code'] = data['ZIP Code'].astype(str).str.zfill(5)
else:
    data = pd.DataFrame()

# Mapping for feature dropdown
feature_mapping = {
    'Building Area': 'Building Area',
    'Electricity Use': 'Electricity Use',
    'Natural Gas Use': 'Natural Gas Use',
    'GHG Emissions': 'GHG Emissions',
}

# Render the main index page
def index(request):
    return render(request, 'chicago_map_app/index.html')

# Serve GeoJSON data for the map
def get_geojson(request):
    geojson_path = Path('data/Chicago.geojson')
    if geojson_path.exists():
        with geojson_path.open('r') as file:
            geojson_data = json.load(file)
        return JsonResponse(geojson_data)
    return JsonResponse({"error": "GeoJSON file not found"}, status=404)

# API endpoint to get filtered data
def get_filtered_data(request):
    try:
        building_age_threshold = int(request.GET.get('building_age', 0))
        feature = request.GET.get('feature', 'Building Area')

        # Map the selected feature to the dataset column
        feature_column = feature_mapping.get(feature, feature)
        current_year = 2024
        min_year_built = current_year - building_age_threshold

        # Filter data based on Year Built
        filtered_data = data[data['Year Built'] >= min_year_built]

        if filtered_data.empty:
            return JsonResponse([], safe=False)

        # Filter relevant columns for heatmap
        heatmap_data = filtered_data[['Latitude', 'Longitude', feature_column]].dropna()

        # Prepare data for scatter plot as well
        scatter_plot_data = (
            filtered_data[['Building Area', feature_column]]
            .groupby('Building Area')
            .mean(numeric_only=True)
            .reset_index()
        )

        # Combine both sets of data into a response
        response_data = {
            "heatmap": heatmap_data.to_dict(orient='records'),
            "scatter": scatter_plot_data.to_dict(orient='records'),
        }

        # Debugging log
        print("Heatmap Data:", heatmap_data.head())
        print("Scatter Plot Data:", scatter_plot_data.head())

        return JsonResponse(response_data, safe=False)

    except Exception as e:
        print(f"Error in get_filtered_data: {e}")
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)

# API endpoint to get details for a specific ZIP code
def get_zip_details(request):
    try:
        zip_code = request.GET.get('zip_code')
        if not zip_code:
            return JsonResponse({"error": "ZIP code not provided"}, status=400)

        zip_data = data[data['ZIP Code'] == zip_code]

        if zip_data.empty:
            return JsonResponse({"error": "No data found for the provided ZIP code"}, status=404)

        details = {
            'Building Area': zip_data['Building Area'].mean(),
            'GHG Emissions': zip_data['GHG Emissions'].mean(),
            'Natural Gas Use': zip_data['Natural Gas Use'].mean(),
            'Electricity Use': zip_data['Electricity Use'].mean(),
        }

        return JsonResponse(details)

    except Exception as e:
        print(f"Error in get_zip_details: {e}")
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)
