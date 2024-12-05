// Initialize the map
const map = L.map('map').setView([41.8781, -87.6298], 10); // Centered on Chicago

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Heatmap layer placeholder
let heatmapLayer;

// Elements for controls and visualizations
const slider = document.getElementById('building-age-slider');
const sliderValue = document.getElementById('building-age-value');
const featureDropdown = document.getElementById('feature-dropdown');
const scatterCanvas = document.getElementById('scatterCanvas');
const barChartCanvas = document.getElementById('barChartCanvas');
const zipCodeElement = document.getElementById('zip-code');
const avgBuildingArea = document.getElementById('avg-building-area');
const avgGHGEmissions = document.getElementById('avg-ghg-emissions');
const avgNaturalGasUse = document.getElementById('avg-natural-gas-use');
const avgElectricityUse = document.getElementById('avg-electricity-use');

// Initialize scatter chart using Chart.js
const scatterChart = new Chart(scatterCanvas, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'Placeholder',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }],
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Building Area',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Feature Value',
                },
            },
        },
    },
});

// Initialize bar chart using Chart.js
const barChart = new Chart(barChartCanvas, {
    type: 'bar',
    data: {
        labels: [], // Placeholder labels
        datasets: [{
            label: 'Placeholder',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Building Area',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Feature Value',
                },
            },
        },
    },
});

// Function to update heatmap
function updateHeatmap(buildingAge, feature) {
    fetch(`/api/filtered-data/?building_age=${buildingAge}&feature=${feature}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.heatmap || data.heatmap.length === 0) {
                console.warn("No data for heatmap.");
                return;
            }

            const heatmapData = data.heatmap.map((item) => [
                parseFloat(item.Latitude),
                parseFloat(item.Longitude),
                parseFloat(item[feature]) || 0,
            ]);

            // Remove existing heatmap layer
            if (heatmapLayer) {
                map.removeLayer(heatmapLayer);
            }

            // Add new heatmap layer
            heatmapLayer = L.heatLayer(heatmapData, {
                radius: 20,
                blur: 15,
                maxZoom: 15,
            }).addTo(map);
        })
        .catch((error) => console.error("Error updating heatmap:", error));
}

// Function to update scatter plot
function updateScatterPlot(buildingAge, feature) {
    fetch(`/api/filtered-data/?building_age=${buildingAge}&feature=${feature}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.scatter || data.scatter.length === 0) {
                console.warn("No data for scatter plot.");
                scatterChart.data.datasets[0].data = [];
                scatterChart.update();
                return;
            }

            const scatterData = data.scatter.map((item) => ({
                x: parseFloat(item['Building Area']),
                y: parseFloat(item[feature]) || 0,
            }));

            // Update scatter chart data
            scatterChart.data.datasets[0].label = feature;
            scatterChart.data.datasets[0].data = scatterData;

            scatterChart.options.scales.x.title.text = 'Building Area';
            scatterChart.options.scales.y.title.text = feature;

            scatterChart.update();
        })
        .catch((error) => console.error("Error updating scatter plot:", error));
}


// Function to update bar chart
function updateBarChart(buildingAge, feature) {
    fetch(`/api/filtered-data/?building_age=${buildingAge}&feature=${feature}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.scatter || data.scatter.length === 0) {
                console.warn("No data for bar chart.");
                barChart.data.labels = [];
                barChart.data.datasets[0].data = [];
                barChart.update();
                return;
            }

            // Use scatter plot data for bar chart
            const barLabels = data.scatter.map((item) => item['Building Area']);
            const barData = data.scatter.map((item) => parseFloat(item[feature]) || 0);

            // Update bar chart
            barChart.data.labels = barLabels;
            barChart.data.datasets[0].label = `Average ${feature}`;
            barChart.data.datasets[0].data = barData;
            barChart.update();
        })
        .catch((error) => console.error('Error fetching bar chart data:', error));
}


// Function to fetch and display ZIP code details
function updateZipDetails(zipCode) {
    fetch(`/api/zip-details/?zip_code=${zipCode}`)
        .then((response) => response.json())
        .then((data) => {
            zipCodeElement.textContent = zipCode;
            avgBuildingArea.textContent = data['Building Area']?.toFixed(2) || 'N/A';
            avgGHGEmissions.textContent = data['GHG Emissions']?.toFixed(2) || 'N/A';
            avgNaturalGasUse.textContent = data['Natural Gas Use']?.toFixed(2) || 'N/A';
            avgElectricityUse.textContent = data['Electricity Use']?.toFixed(2) || 'N/A';
        })
        .catch((error) => {
            console.error('Error fetching ZIP code details:', error);
            zipCodeElement.textContent = 'N/A';
            avgBuildingArea.textContent = 'N/A';
            avgGHGEmissions.textContent = 'N/A';
            avgNaturalGasUse.textContent = 'N/A';
            avgElectricityUse.textContent = 'N/A';
        });
}

// Event listeners
slider.addEventListener('input', (event) => {
    const buildingAge = event.target.value;
    sliderValue.textContent = buildingAge;
    const selectedFeature = featureDropdown.value;

    updateHeatmap(buildingAge, selectedFeature);
    updateScatterPlot(buildingAge, selectedFeature);
    updateBarChart(buildingAge, selectedFeature);
});

featureDropdown.addEventListener('change', () => {
    const buildingAge = slider.value;
    const selectedFeature = featureDropdown.value;

    updateHeatmap(buildingAge, selectedFeature);
    updateScatterPlot(buildingAge, selectedFeature);
    updateBarChart(buildingAge, selectedFeature);
});

// Initial render
const initialFeature = featureDropdown.value;
const initialBuildingAge = slider.value;
updateHeatmap(initialBuildingAge, initialFeature);
updateScatterPlot(initialBuildingAge, initialFeature);
updateBarChart(initialBuildingAge, initialFeature);
