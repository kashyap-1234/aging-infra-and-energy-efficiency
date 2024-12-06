# Aging Infra and Energy Efficiency

This repository, **Aging Infra and Energy Efficiency**, provides an interactive tool to analyze the relationship between aging infrastructure and energy efficiency in Chicago. The application is powered by Django on the backend and leverages Leaflet.js and Chart.js for front-end visualizations. It visualizes energy inefficiency hotspots through heatmaps, scatter plots, and bar charts.

---

## Key Features

### 1. Dynamic Heatmaps
- **Clustered Heatmap**: Displays individual buildings with varying intensities based on their Relative Performance Score (RPS).
- **Regional Heatmap**: Aggregated RPS data by regions for broader insights.
- **Intensity Scaling**: High RPS (inefficient) areas appear red, moderate RPS areas orange, and efficient areas green.

### 2. Interactive Scatter and Bar Charts
- **Scatter Plot**: Visualizes the correlation between building area and energy metrics (electricity use, GHG emissions, etc.).
- **Bar Chart**: Aggregates data by building areas or feature categories for high-level analysis.

### 3. RPS Interpretation Legend
Provides an easy-to-understand legend for interpreting RPS values:
- **Critical**: RPS ≥ 50
- **High**: 25 ≤ RPS < 50
- **Moderate**: 0 ≤ RPS < 25
- **Low**: -25 ≤ RPS < 0
- **Efficient**: RPS < -25

### 4. Dynamic Controls
- Filter visualizations by:
  - **Building Age** (using a slider).
  - **Energy Metrics** (electricity use, natural gas use, GHG emissions).

---

## Screenshots

### Heatmap with Intensity Legend
![Heatmap Example](path/to/heatmap.png)

### Scatter and Bar Charts
![Charts Example](path/to/charts.png)

### RPS Interpretation Legend
![RPS Legend Example](path/to/legend.png)

---

## Tech Stack

### Backend
- **Django**: Web framework for data management and API endpoints.
- **Python**: Data preprocessing and server-side logic.

### Frontend
- **HTML/CSS**: For responsive user interface design.
- **JavaScript**: For dynamic interactivity and rendering.
- **Leaflet.js**: For interactive maps and heatmaps.
- **Chart.js**: For scatter and bar chart visualizations.

### Data
- **GeoJSON**: Geospatial data for Chicago neighborhoods.
- **CSV**: Preprocessed building data with RPS scores and energy metrics.

---

## How to Run the Project

### Prerequisites
- Python 3.8 or higher.
- Virtual environment (recommended).
- Libraries specified in `requirements.txt`.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/username/Aging-Infra-and-Energy-Efficiency.git

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt

3. Run database migrations:
   ```bash
   python manage.py migrate

4. Start the development server:
   ```bash
   python manage.py runserver

5. Access the application: Open your browser and navigate to `http://127.0.0.1:8000`

## How It Works

- ### Data Loading: 
The backend loads cleaned datasets containing building details, energy consumption metrics, and geospatial data.

- ### Filtering and Aggregation:
User inputs (e.g., building age and selected feature) are passed to Django views.
Data is filtered, aggregated, and returned as JSON responses to the frontend.

- ### Dynamic Visualization:
Heatmaps are updated using Leaflet.js to show energy inefficiency hotspots.
Scatter and bar charts are refreshed using Chart.js with data relevant to user input.

- ### Legends and Tooltips:
Legends dynamically adjust based on data ranges.
Interactive tooltips provide detailed information about individual markers or regions.

