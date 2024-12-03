document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/geojson/')
        .then(response => response.json())
        .then(data => {
            const width = 800;
            const height = 600;

            const svg = d3.select("#map")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            const projection = d3.geoMercator()
                .fitSize([width, height], data);

            const path = d3.geoPath().projection(projection);

            svg.selectAll("path")
                .data(data.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", "black")
                .attr("fill", "lightblue")
                .on("click", (event, d) => {
                    const zipCode = d.properties.ZIP_CODE; // Adjust property name as needed
                    updatePlaceholders(zipCode);
                });
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
});

function updatePlaceholders(zipCode) {
    document.getElementById('left-placeholder').textContent = `Details for ZIP: ${zipCode}`;
    document.getElementById('bottom-placeholder-1').textContent = `Chart for ZIP: ${zipCode}`;
    document.getElementById('bottom-placeholder-2').textContent = `Analytics for ZIP: ${zipCode}`;
}