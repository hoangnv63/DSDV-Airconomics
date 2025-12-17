window.initChart3 = async function () {
    if (window.__chart3_initialized) return;
    window.__chart3_initialized = true;

    const geo = await d3.json(
        "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    );
    const csv = await d3.csv("../data/processed_data.csv");

    const years = Array.from(
        new Set(csv.filter(d => d.factor === "pm25").map(d => +d.year))
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

    /* -------- YEAR WATERMARK (BEHIND MAP) -------- */

    const yearWatermark = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", 180)
        .style("fill", "#000")
        .style("opacity", 0.06)
        .style("pointer-events", "none")
        .text(years[currentYearIndex]);

    /* ---------------- MAP LAYER ---------------- */

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

    const pm25ColorScale = [
        { label: "< 10", min: 0,  max: 10,  color: "#FFF8D9" },
        { label: "10 – 20", min: 10, max: 20, color: "#E5C6AE" },
        { label: "20 – 30", min: 20, max: 30, color: "#CB9582" },
        { label: "30 – 40", min: 30, max: 40, color: "#B26357" },
        { label: "40 – 50", min: 40, max: 50, color: "#98322B" },
        { label: "≥ 50",    min: 50, max: Infinity, color: "#580000ff" }
    ];

    function colorForValue(val) {
        if (val == null) return "#e0e0e0";
        const bucket = pm25ColorScale.find(
            d => val >= d.min && val < d.max
        );
        return bucket ? bucket.color : "#e0e0e0";
    }

    let dataMap = makeLookup(years[currentYearIndex]);

    const countries = g.selectAll("path")
        .data(geo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#222")
        .attr("stroke-width", 0.8)
        .attr("fill", d => colorForValue(dataMap.get(d.id)))
        .on("mouseenter", (event, d) => {
            countries.attr("fill-opacity", 0.25);
            d3.select(event.currentTarget)
                .attr("fill-opacity", 1);

            tooltip
                .style("opacity", 1)
                .html(
                    `<strong>${d.properties.name}</strong><br>
                    Year: ${years[currentYearIndex]}<br>
                    PM2.5: ${dataMap.get(d.id) ?? "No data"}`
                );
        })
        .on("mousemove", event => {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY + 12) + "px");
        })
        .on("mouseleave", () => {
            countries.attr("fill-opacity", 1);
            tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
            event.stopPropagation();
            zoomToCountry(d);
        });

    /* ---------------- ZOOM ---------------- */

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
            .duration(200)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale)
            );
    }

    /* ---------------- YEAR UPDATE ---------------- */

    function renderYear(year) {
        label.textContent = year;
        yearWatermark.text(year);
        dataMap = makeLookup(year);

        countries.attr("fill", d =>
            colorForValue(dataMap.get(d.id))
        );
    }

    slider.addEventListener("input", function () {
        currentYearIndex = years.indexOf(+this.value);
        renderYear(+this.value);
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

    /* ---------------- LEGEND (TOP RIGHT) ---------------- */

    const legendData = pm25ColorScale;

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 170}, 20)`);

    legend.append("rect")
        .attr("x", -14)
        .attr("y", -14)
        .attr("width", 155)
        .attr("height", legendData.length * 24 + 24)
        .attr("rx", 8)
        .attr("fill", "rgba(255,255,255,0.75)")
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5);

    const row = legend.selectAll(".legend-row")
        .data(legendData)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 24})`)
        .style("cursor", "pointer")
        .on("mouseover", (_, d) => {
            countries.attr("fill-opacity", c => {
                const v = dataMap.get(c.id);
                return v >= d.min && v < d.max ? 1 : 0.15;
            });
        })
        .on("mouseout", () => {
            countries.attr("fill-opacity", 1);
        });

    row.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => d.color);

    row.append("text")
        .attr("x", 26)
        .attr("y", 13)
        .style("font-size", "12px")
        .style("fill", "#111")
        .text(d => d.label);

    renderYear(years[currentYearIndex]);
};
