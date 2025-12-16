const margin = { top: 40, right: 40, bottom: 60, left: 80 };

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("background-color", "rgba(0,0,0,0.7)")
  .style("color", "#fff")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .style("line-height", "1.4")
  .style("z-index", 1000);

// Globals
let countries = [];
let allYears = [];
let currentYearIndex = 0;
let currentYear = null;
let isPlaying = false;
let playTimer = null;
let currentRegion = "all";

let svg, chartG, xScale, yScale, rScale, xAxisG, yAxisG, yearWatermark;
let REGION_COLORS;

// ---------------- DATA LOADING ----------------
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
    const gdp = {};
    const pm25 = {};
    const population = {};

    rows.forEach(r => {
      if (r.factor === "gdp") gdp[r.year] = r.value;
      if (r.factor === "pm25") pm25[r.year] = r.value;
      if (r.factor === "pop") population[r.year] = r.value;
    });

    return {
      country,
      region: rows[0].continent || "Other",
      gdp,
      pm25,
      population
    };
  });
}

// ----------------- INITIALIZATION -----------------
function initChart1() {
  loadDataLong().then(data => {
    countries = data;

    // Years
    allYears = Object.keys(countries[0].pm25).map(Number).sort((a, b) => a - b);
    currentYearIndex = 0;

    // Container
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

    // Scales
    const allPoints = [];
    countries.forEach(c => {
      allYears.forEach(y => {
        const gdp = c.gdp[y];
        const pm25 = c.pm25[y];
        const pop = c.population[y];
        if (gdp > 0 && pm25 != null && pop > 0) allPoints.push({ gdp, pm25, pop });
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
      .range([3, 30]);

    // Color scale
    const regions = Array.from(new Set(countries.map(c => c.region)));
    REGION_COLORS = d3.scaleOrdinal()
      .domain(regions)
      .range(d3.schemeTableau10);

    // Axes
    xAxisG = chartG.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6, "~s"));

    yAxisG = chartG.append("g")
      .call(d3.axisLeft(yScale));

    // Axis labels
    chartG.append("text")
      .attr("x", innerWidth)
      .attr("y", innerHeight + 45)
      .attr("text-anchor", "end")
      .text("GDP per capita");

    chartG.append("text")
      .attr("y", -15)
      .text("PM2.5 (µg/m³)");

    // Year watermark
    yearWatermark = chartG.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", Math.min(innerWidth, innerHeight) * 0.4)
      .style("fill", "#000")
      .style("opacity", 0.1)
      .style("pointer-events", "none")
      .text(allYears[currentYearIndex]);

    // Region dropdown
    const regionSelect = d3.select("#regionFilter");
    regionSelect.selectAll("option")
      .data(["all", ...regions])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    regionSelect.on("change", function() {
      currentRegion = this.value;
      renderYear(allYears[currentYearIndex]);
    });

    // Year slider + label
    const slider = d3.select("#yearSlider");
    const label = d3.select("#yearLabel");

    slider
      .attr("min", allYears[0])
      .attr("max", allYears[allYears.length - 1])
      .attr("step", 1)
      .attr("value", allYears[currentYearIndex])
      .on("input", function(event) {
        const y = +event.target.value;
        currentYearIndex = allYears.indexOf(y);
        renderYear(y);
      });

    // Play button
    const playBtn = d3.select("#playBtn");
    playBtn.on("click", () => {
      if (!isPlaying) {
        isPlaying = true;
        playBtn.text("Pause");
        playTimer = setInterval(() => {
          if (currentYearIndex < allYears.length - 1) {
            currentYearIndex++;
            slider.property("value", allYears[currentYearIndex]);
            renderYear(allYears[currentYearIndex]);
          } else {
            clearInterval(playTimer);
            isPlaying = false;
            playBtn.text("▶ Play");
          }
        }, 900);
      } else {
        clearInterval(playTimer);
        isPlaying = false;
        playBtn.text("▶ Play");
      }
    });

    // First render
    renderYear(allYears[currentYearIndex]);
  });
}

// ----------------- RENDER -----------------
function renderYear(year) {
  currentYear = year;
  d3.select("#yearLabel").text(year);

  // Filter data
  let data = countries.map(c => ({
    country: c.country,
    region: c.region,
    gdp: c.gdp[year],
    pm25: c.pm25[year],
    pop: c.population[year]
  })).filter(d => d.gdp > 0 && d.pm25 != null && d.pop > 0);

  if (currentRegion !== "all") {
    data = data.filter(d => d.region === currentRegion);
  }

  // Update watermark
  yearWatermark
    .transition().duration(300)
    .tween("text", function() {
      const that = d3.select(this);
      const i = d3.interpolateNumber(+that.text(), year);
      return t => that.text(Math.round(i(t)));
    });

  // Bind data
  const dots = chartG.selectAll("circle").data(data, d => d.country);

  dots.join(
    enter => enter.append("circle")
      .attr("cx", d => xScale(d.gdp))
      .attr("cy", d => yScale(d.pm25))
      .attr("r", 0)
      .attr("fill", d => REGION_COLORS(d.region))
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("opacity", 0.85)
      .on("mousemove", (event, d) => {
  tooltip
    .style("opacity", 1)
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 28) + "px")
    .html(`
      <div><strong>${d.country}</strong></div>
      <div>Region: ${d.region}</div>
      <div>Year: ${currentYear}</div>
      <div>PM2.5: ${d.pm25.toFixed(1)} µg/m³</div>
      <div>GDP per capita: ${d3.format(",")(d.gdp)}</div>
      <div>Population: ${d3.format(",")(d.pop)}</div>
    `);
})
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
      })
      .transition().duration(500)
      .attr("r", d => rScale(d.pop)),

    update => update.transition().duration(500)
      .attr("cx", d => xScale(d.gdp))
      .attr("cy", d => yScale(d.pm25))
      .attr("r", d => rScale(d.pop))
      .attr("fill", d => REGION_COLORS(d.region)),

    exit => exit.transition().duration(300)
      .attr("r", 0)
      .remove()
  );
}

// Expose to main.js
window.initChart1 = initChart1;
