window.initChart3 = async function () {
    if (window.__chart3_initialized) return;
    window.__chart3_initialized = true;

    const geo = await d3.json(
        "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    );
    const csv = await d3.csv("../data/processed_data.csv");

    const years = Object.keys(csv[0])
    .filter(k => k.startsWith("pm25_"))
    .map(k => parseInt(k.replace("pm25_", "")))
    .filter(y => y >= 1990 && y <= 2021)
    .sort((a, b) => a - b);  

    const slider = document.getElementById("yearSlider");
    const label = document.getElementById("yearLabel");

    if (slider && label) {
        slider.min = years[0];
        slider.max = years[years.length - 1];
        slider.value = 2020;
        label.textContent = "2020";
    }

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("z-index", 999999)
        .style("background", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
        .style("opacity", 0);

    const container = d3.select("#chart3");
    container.selectAll("*").remove();

    const width = 1000;
    const height = 520;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g").attr("id", "map-layer");

    const projection = d3.geoNaturalEarth1()
        .scale(165)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    function makeLookup(year) {
        const field = "pm25_" + year;
        const map = new Map();

        csv.forEach(d => {
            const iso = (d.REF_AREA || "").trim().toUpperCase();
            let v = d[field];
            if (v) v = v.toString().trim().replace(",", ".");
            const num = parseFloat(v);
            if (iso && !isNaN(num)) map.set(iso, num);
        });

        return map;
    }

    let dataMap = makeLookup(2020);

    const countries = g
        .selectAll("path")
        .data(geo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#222")
        .attr("stroke-width", 0.8)
        .attr("fill", d => {
            const iso = (d.id || "").trim().toUpperCase();
            const val = dataMap.get(iso);
            if (val == null || isNaN(val)) return "#e0e0e0";
            if (val < 10) return "#ffe5e5";
            if (val < 20) return "#ffb3b3";
            if (val < 30) return "#ff8080";
            if (val < 40) return "#ff3333";
            if (val < 50) return "#8b0404ff";
            return "#470808ff";
        })
        .on("mouseover", (event, d) => {
            const iso = (d.id || "").trim().toUpperCase();
            const val = dataMap.get(iso);
            tooltip
                .style("opacity", 1)
                .html(`<strong>${d.properties.name}</strong><br>PM2.5: ${val ?? "No data"}`);
            d3.select(event.currentTarget)
                .attr("stroke-width", 2.5)
                .attr("stroke", "#000");
        })
        .on("mousemove", event => {
            tooltip.style("left", event.clientX + 14 + "px");
            tooltip.style("top", event.clientY + 14 + "px");
        })
        .on("mouseout", event => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget)
                .attr("stroke-width", 0.8)
                .attr("stroke", "#222");
        })
        .on("click", (event, d) => {
            event.stopPropagation();
            zoomToCountry(d);
        });

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", e => g.attr("transform", e.transform));

    svg.call(zoom);

    function zoomToCountry(d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        const scale = Math.min(
            8,
            0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)
        );

        const translate = [
            width / 2 - scale * (x0 + x1) / 2,
            height / 2 - scale * (y0 + y1) / 2
        ];

        svg.transition()
            .duration(750)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale)
            );
    }

    if (slider && label) {
        slider.addEventListener("input", function () {
            const y = Number(this.value);
            label.textContent = y;
            dataMap = makeLookup(y);

            countries.attr("fill", d => {
                const iso = (d.id || "").trim().toUpperCase();
                const val = dataMap.get(iso);
                if (val == null || isNaN(val)) return "#e0e0e0";
                if (val < 10) return "#ffe5e5";
                if (val < 20) return "#ffb3b3";
                if (val < 30) return "#ff8080";
                if (val < 40) return "#ff3333";
                if (val < 50) return "#8b0404ff";
                return "#470808ff";
            });
        });
    }
};
