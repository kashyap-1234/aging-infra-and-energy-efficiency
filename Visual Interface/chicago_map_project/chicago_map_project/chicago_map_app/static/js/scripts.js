// Initialize the Map
const map = L.map('map').setView([41.8781, -87.6298], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const slider = document.getElementById('building-age-slider');
const sliderValue = document.getElementById('building-age-value');
const dropdown = document.getElementById('feature-dropdown');
const scatterChartCanvas = document.getElementById('scatterChartCanvas').getContext('2d');
const zipDetails = document.getElementById('zip-stats');
const zipCodeElement = document.getElementById('zip-code');

let scatterChart = null;

// Fetch GeoJSON Data and Add to Map
function fetchGeoJSON() {
    fetch('/api/geojson/')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: '#3388ff',
                    weight: 2,
                },
                onEachFeature: function (feature, layer) {
                    layer.on('click', function () {
                        fetchZipDetails(feature.properties.ZIP);
                    });
                }
            }).addTo(map);
        });
}

// Fetch Filtered Data Based on Slider and Dropdown
function fetchFilteredData() {
    const buildingAge = slider.value;
    const feature = dropdown.value;

    fetch(`/api/filtered-data/?building_age=${buildingAge}&feature=${feature}`)
        .then(response => response.json())
        .then(data => {
            updateHeatmap(data, feature);
            updateScatterChart(data, feature);
        });
}

// Fetch Details for a Specific ZIP Code
function fetchZipDetails(zipCode) {
    fetch(`/api/zip-details/?zip_code=${zipCode}`)
        .then(response => response.json())
        .then(data => {
            zipCodeElement.textContent = zipCode;
            zipDetails.innerHTML = `
                <li>Average Building Area: ${data['Building Area'] || 'N/A'}</li>
                <li>Average GHG Emissions: ${data['GHG Emissions'] || 'N/A'}</li>
                <li>Average Natural Gas Use: ${data['Natural Gas Use'] || 'N/A'}</li>
                <li>Average Electricity Use: ${data['Electricity Use'] || 'N/A'}</li>
            `;
        });
}

// Update Heatmap with Filtered Data
function updateHeatmap(data, feature) {
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });

    L.geoJSON(data, {
        style: feature => ({
            fillColor: getColor(feature.properties[feature]),
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7,
        }),
        onEachFeature: function (feature, layer) {
            layer.on('click', function () {
                fetchZipDetails(feature.properties.ZIP);
            });
        }
    }).addTo(map);
}

// Generate Colors for Heatmap Based on Value
function getColor(value) {
    if (!value) return '#f0f0f0';
    return value > 1000
        ? '#800026'
        : value > 500
        ? '#BD0026'
        : value > 200
        ? '#E31A1C'
        : value > 100
        ? '#FC4E2A'
        : value > 50
        ? '#FD8D3C'
        : value > 20
        ? '#FEB24C'
        : value > 10
        ? '#FED976'
        : '#FFEDA0';
}

// Update Scatter Chart with Filtered Data
function updateScatterChart(data, feature) {
    const scatterData = data.map(d => ({
        x: d['ZIP Code'],
        y: d[feature]
    }));

    if (scatterChart) scatterChart.destroy();

    scatterChart = new Chart(scatterChartCanvas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: feature,
                data: scatterData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'ZIP Code' } },
                y: { title: { display: true, text: feature } }
            }
        }
    });
}

// Event Listeners
slider.addEventListener('input', () => {
    sliderValue.textContent = slider.value;
    fetchFilteredData();
});

dropdown.addEventListener('change', fetchFilteredData);

// Initialize the App
fetchGeoJSON();
fetchFilteredData();
