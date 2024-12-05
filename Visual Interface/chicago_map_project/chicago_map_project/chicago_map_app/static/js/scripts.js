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

            // Normalize RPS values for intensity scaling
            const maxRPS = Math.max(...data.heatmap.map((item) => parseFloat(item.RPS) || 0));
            const minRPS = Math.min(...data.heatmap.map((item) => parseFloat(item.RPS) || 0));

            // Create a marker cluster group
            const markers = L.markerClusterGroup();

            // Add markers based on data
            data.heatmap.forEach((item) => {
                const intensity = (parseFloat(item.RPS) - minRPS) / (maxRPS - minRPS) || 0;
                const color = intensity > 0.8 ? 'red' : intensity > 0.5 ? 'orange' : 'green';

                const circleMarker = L.circleMarker([item.Latitude, item.Longitude], {
                    radius: 10 + intensity * 10, // Size increases with intensity
                    fillColor: color,
                    color: color,
                    fillOpacity: 0.6,
                });

                // Define the tooltip without 'Building Area'
                circleMarker.bindPopup(`<b>RPS:</b> ${item.RPS}`);
                markers.addLayer(circleMarker);
            });

            // Clear previous markers
            if (heatmapLayer) {
                map.removeLayer(heatmapLayer);
            }

            heatmapLayer = markers;
            map.addLayer(heatmapLayer);
        })
        .catch((error) => console.error("Error updating heatmap:", error));
}

// // Add legend to the map
// const legend = L.control({ position: 'bottomright' });

// legend.onAdd = function () {
//     const div = L.DomUtil.create('div', 'info legend');
//     const grades = [0, 0.5, 0.8]; // Define thresholds for intensities
//     const colors = ['green', 'orange', 'red']; // Corresponding colors

//     div.innerHTML = '<h4>RPS Intensity</h4>';
//     for (let i = 0; i < grades.length; i++) {
//         div.innerHTML +=
//             '<i style="background:' +
//             colors[i] +
//             '"></i> ' +
//             (grades[i] * 100) +
//             (grades[i + 1] ? '&ndash;' + grades[i + 1] * 100 + '<br>' : '+');
//     }
//     return div;
// };

// legend.addTo(map);


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
            barChart.data.datasets[0].label = `Average EUI`;
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

// Add a legend to the map
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
    // Create the legend container
    const div = L.DomUtil.create('div', 'info legend');
    
    // Apply inline styles directly to avoid CSS conflicts
    div.style.background = 'white';
    div.style.padding = '10px';
    div.style.border = '1px solid black';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)'; // Add a subtle shadow
    div.style.fontSize = '12px';
    div.style.lineHeight = '18px';

    // Add a title for the legend
    div.innerHTML = '<h4 style="margin: 0; text-align: center;">RPS Intensity</h4>';

    // Define grades and colors
    const grades = [0, 50, 80]; // RPS thresholds
    const colors = ['green', 'orange', 'red']; // Corresponding colors

    // Generate legend items dynamically
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML += `
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <i style="
                    background: ${colors[i]};
                    width: 15px;
                    height: 15px;
                    display: inline-block;
                    margin-right: 10px;
                    border-radius: 50%;
                    "></i>
                ${grades[i]}${grades[i + 1] ? `–${grades[i + 1]}` : '+'}
            </div>
        `;
    }

    return div;
};

// Add the legend to the map
legend.addTo(map);

// Add RPS Interpretation Legend
const rpsInterpretationLegend = L.control({ position: 'bottomright' });

rpsInterpretationLegend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info interpretation-legend');

    // Apply inline styles for white background and formatting
    div.style.background = 'white';
    div.style.padding = '10px';
    div.style.border = '1px solid black';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    div.style.fontSize = '12px';
    div.style.lineHeight = '18px';
    div.style.overflowY = 'auto'; // Handle large content with scrolling

    // Add a title for the legend
    div.innerHTML = `
        <h4 style="margin: 0; text-align: center;">RPS Interpretation</h4>
        <table class="legend-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background: rgba(240, 240, 240, 0.8);">
                    <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">RPS Range</th>
                    <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">Priority</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 5px;">RPS ≥ 50</td>
                    <td style="border: 1px solid #ddd; padding: 5px;">Critical</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 5px;">25 ≤ RPS &lt; 50</td>
                    <td style="border: 1px solid #ddd; padding: 5px;">High</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 5px;">0 ≤ RPS &lt; 25</td>
                    <td style="border: 1px solid #ddd; padding: 5px;">Moderate</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 5px;">-25 ≤ RPS &lt; 0</td>
                    <td style="border: 1px solid #ddd; padding: 5px;">Low</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 5px;">RPS &lt; -25</td>
                    <td style="border: 1px solid #ddd; padding: 5px;">Efficient</td>
                </tr>
            </tbody>
        </table>
    `;

    return div;
};

// Add the updated legend to the map
rpsInterpretationLegend.addTo(map);
