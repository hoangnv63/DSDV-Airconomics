const margin = { top: 40, right: 40, bottom: 60, left: 80 };

// ---------------- TOOLTIP ----------------
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("background", "rgba(0,0,0,0.75)")
  .style("color", "#fff")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .style("z-index", 1000);

// ---------------- GLOBALS ----------------
let countries = [];
let allYears = [];
let currentYearIndex = 0;
let currentYear = null;
let isPlaying = false;
let playTimer = null;
let currentRegion = "all";

let svg, chartG, xScale, yScale, rScale, yearWatermark;
let REGION_COLORS;

// ---------------- DATA ----------------
async function loadDataLong() {
  const raw = await d3.csv("../data/processed_data.csv", d => ({
    country: d.REF_AREA_LABEL,
    code: d.REF_AREA,
    continent: d.continent,
    year: +d.year,
    factor: d.factor,
    value: d.value === "" ? null : +d.value
  }));

  const byCountry = d3.group(raw, d => d.country);

  return Array.from(byCountry, ([country, rows]) => {
    const gdp = {}, pm25 = {}, population = {};
    rows.forEach(r => {
      if (r.factor === "gdp") gdp[r.year] = r.value;
      if (r.factor === "pm25") pm25[r.year] = r.value;
      if (r.factor === "pop") population[r.year] = r.value;
    });

    return {
      country,
      region: rows[0].continent || "Other",
      gdp, pm25, population
    };
  });
}

// ---------------- INIT ----------------
function initChart1() {
  loadDataLong().then(data => {
    countries = data;

    allYears = Object.keys(countries[0].pm25).map(Number).sort((a, b) => a - b);
    currentYearIndex = 0;

    const container = d3.select("#chart1");
    container.selectAll("*").remove();

    const width = container.node().clientWidth || 900;
    const height = 520;

    svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    chartG = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // -------- SCALES --------
    const allPoints = [];
    countries.forEach(c => {
      allYears.forEach(y => {
        if (c.gdp[y] && c.pm25[y] && c.population[y]) {
          allPoints.push({ gdp: c.gdp[y], pm25: c.pm25[y], pop: c.population[y] });
        }
      });
    });

    xScale = d3.scaleLog()
      .domain(d3.extent(allPoints, d => d.gdp))
      .range([0, innerWidth])
      .nice();

    yScale = d3.scaleLinear()
      .domain([0, d3.max(allPoints, d => d.pm25)])
      .range([innerHeight, 0])
      .nice();

    rScale = d3.scaleSqrt()
      .domain(d3.extent(allPoints, d => d.pop))
      .range([4, 30]);

    const regions = Array.from(new Set(countries.map(d => d.region)));
    REGION_COLORS = d3.scaleOrdinal(regions, d3.schemeTableau10);

    chartG.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6, "~s"));

    chartG.append("g")
      .call(d3.axisLeft(yScale));

    // X-axis title
    chartG.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#222")
      .text("GDP per Capita (USD, log scale)");

    // Y-axis title
    chartG.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -55)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#222")
      .text("PM2.5 Concentration (µg/m³)");


    // -------- YEAR WATERMARK --------
    yearWatermark = chartG.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", Math.min(innerWidth, innerHeight) * 0.4)
      .style("fill", "#000")
      .style("opacity", 0.08)
      .style("pointer-events", "none")
      .lower();

    // -------- REGION FILTER --------
    const regionSelect = d3.select("#regionFilter");
    regionSelect.selectAll("option")
      .data(["all", ...regions])
      .join("option")
      .attr("value", d => d)
      .text(d => d === "all" ? "World (All Regions)" : d);

    regionSelect.on("change", function () {
      currentRegion = this.value;
      renderYear(currentYear);
    });

    // -------- SLIDER --------
    const slider = d3.select("#yearSlider");
    slider
      .attr("min", allYears[0])
      .attr("max", allYears.at(-1))
      .attr("step", 1)
      .property("value", allYears[0]) 
      .on("input", e => {
        currentYearIndex = allYears.indexOf(+e.target.value);
        renderYear(+e.target.value);
      });

    // -------- PLAY --------
    d3.select("#playBtn").on("click", function () {
      if (isPlaying) {
        clearInterval(playTimer);
        isPlaying = false;
        this.textContent = "▶ Play";
      } else {
        isPlaying = true;
        this.textContent = "Pause";
        playTimer = setInterval(() => {
          if (currentYearIndex < allYears.length - 1) {
            currentYearIndex++;
            slider.property("value", allYears[currentYearIndex]);
            renderYear(allYears[currentYearIndex]);
          }
        }, 400);
      }
    });

    // -------- STATIC LEGEND --------
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 190}, 40)`);

    legend.append("rect")
      .attr("width", 170)
      .attr("height", regions.length * 22 + 10)
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("rx", 8);

    const legendItem = legend.selectAll(".legend-item")
      .data(regions)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(10,${10 + i * 22})`);

    legendItem.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", d => REGION_COLORS(d));

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d);

    renderYear(allYears[0]);
  });
}

// ----------------- RENDER -----------------
function renderYear(year) {
  currentYear = year;
  d3.select("#yearLabel").text(year);
  yearWatermark.text(year);

  let data = countries
    .filter(c => currentRegion === "all" || c.region === currentRegion)
    .map(c => ({
      country: c.country,
      region: c.region,
      gdp: c.gdp[year],
      pm25: c.pm25[year],
      pop: c.population[year]
    }))
    .filter(d => d.gdp && d.pm25 && d.pop);

  const dots = chartG.selectAll("circle")
    .data(data, d => d.country);

  dots.join(
    enter => enter.append("circle")
      .attr("cx", d => xScale(d.gdp))
      .attr("cy", d => yScale(d.pm25))
      .attr("r", d => rScale(d.pop))
      .attr("fill", d => REGION_COLORS(d.region))
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("opacity", 0.85)
      .on("mouseenter", function (e, d) {
        chartG.selectAll("circle").attr("opacity", 0.25);
        d3.select(this).attr("opacity", 1).attr("stroke-width", 2);

        tooltip.style("opacity", 1)
          .html(`
            <strong>${d.country}</strong><br>
            ${d.region}<br>
            PM2.5: ${d.pm25}<br>
            GDP: ${d3.format(",")(d.gdp)}<br>
            Population: ${d3.format(",")(d.pop)}
          `);
      })
      .on("mousemove", e => {
        tooltip.style("left", e.pageX + 12 + "px")
               .style("top", e.pageY - 28 + "px");
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
        chartG.selectAll("circle")
          .attr("opacity", 0.85)
          .attr("stroke-width", 1);
      }),

    update => update
      .transition().duration(120)
      .attr("cx", d => xScale(d.gdp))
      .attr("cy", d => yScale(d.pm25))
      .attr("r", d => rScale(d.pop)),

    exit => exit.remove()
  );
}

window.initChart1 = initChart1;
