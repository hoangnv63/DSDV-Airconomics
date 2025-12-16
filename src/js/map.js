window.initChart3 = async function () {
    if (window.__chart3_initialized) return;
    window.__chart3_initialized = true;

    const geo = await d3.json(
        "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    );
    const csv = await d3.csv("../data/processed_data.csv");

    const years = Array.from(
        new Set(
            csv
                .filter(d => d.factor === "pm25")
                .map(d => +d.year)
        )
    )
        .filter(y => y >= 1990 && y <= 2021)
        .sort((a, b) => a - b);

    let currentYearIndex = years.indexOf(2020);
    let isPlaying = false;
    let playTimer = null;

    const slider = document.getElementById("chart3-yearSlider");
    const label = document.getElementById("chart3-yearLabel");
    const playBtn = document.getElementById("chart3-playBtn");

    slider.min = years[0];
    slider.max = years[years.length - 1];
    slider.step = 1;
    slider.value = years[currentYearIndex];
    label.textContent = years[currentYearIndex];

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("pointer-events", "none");

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
        const map = new Map();
        csv.forEach(d => {
            if (d.factor !== "pm25") return;
            if (+d.year !== year) return;

            const iso = (d.REF_AREA || "").trim().toUpperCase();
            const val = parseFloat(
                (d.value || "").toString().replace(",", ".")
            );

            if (iso && !isNaN(val)) map.set(iso, val);
        });
        return map;
    }

    let dataMap = makeLookup(years[currentYearIndex]);

    const countries = g.selectAll("path")
        .data(geo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#222")
        .attr("stroke-width", 0.8)
        .attr("fill", "#e0e0e0")
        .on("mouseover", (event, d) => {
            const iso = (d.id || "").toUpperCase();
            const val = dataMap.get(iso);

            tooltip
                .style("opacity", 1)
                .html(
                    `<strong>${d.properties.name}</strong><br>
                     PM2.5: ${val ?? "No data"}`
                );

            d3.select(event.currentTarget)
                .attr("stroke-width", 2)
                .attr("stroke", "#000");
        })
        .on("mousemove", event => {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY + 12) + "px");
        })
        .on("mouseout", event => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget)
                .attr("stroke-width", 0.8)
                .attr("stroke", "#222");
        });

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", e => g.attr("transform", e.transform));

    svg.call(zoom);

    function renderYear(year) {
        label.textContent = year;
        dataMap = makeLookup(year);

        countries
            .transition()
            .duration(500)
            .attr("fill", d => {
                const iso = (d.id || "").toUpperCase();
                const val = dataMap.get(iso);
                if (val == null) return "#e0e0e0";
                if (val < 10) return "#ffe5e5";
                if (val < 20) return "#ffb3b3";
                if (val < 30) return "#ff8080";
                if (val < 40) return "#ff3333";
                if (val < 50) return "#8b0404";
                return "#470808";
            });
    }

    slider.addEventListener("input", function () {
        const y = +this.value;
        currentYearIndex = years.indexOf(y);
        renderYear(y);
    });

    playBtn.addEventListener("click", () => {
        if (!isPlaying) {
            isPlaying = true;
            playBtn.textContent = "Pause";

            playTimer = setInterval(() => {
                if (currentYearIndex < years.length - 1) {
                    currentYearIndex++;
                    const y = years[currentYearIndex];
                    slider.value = y;
                    renderYear(y);
                } else {
                    clearInterval(playTimer);
                    isPlaying = false;
                    playBtn.textContent = "▶ Play";
                }
            }, 900);
        } else {
            clearInterval(playTimer);
            isPlaying = false;
            playBtn.textContent = "▶ Play";
        }
    });

    renderYear(years[currentYearIndex]);
};
