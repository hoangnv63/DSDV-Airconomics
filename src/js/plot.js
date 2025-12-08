window.initChart1 = async function() {
  if (window.__chart1_initialized) return;
  window.__chart1_initialized = true;

  const raw = await d3.csv("../data/processed_data.csv");
  const years = Object.keys(raw[0]).filter(k => k.startsWith("gdp_")).map(k => k.slice(4)).sort();
  const year = years.includes("2019") ? "2019" : years[years.length - 1];

  const data = raw.map(r => ({
    country: r.REF_AREA_LABEL || r.REF_AREA || r.REF_AREA_LABEL,
    gdp: r["gdp_" + year] ? +r["gdp_" + year] : null,
    pm25: r["pm25_" + year] ? +r["pm25_" + year] : null,
    pop: r["pop_" + year] ? +r["pop_" + year] : null
  })).filter(d => d.gdp && d.pop && d.pm25 !== null);

  const container = d3.select("#chart1");
  container.selectAll("*").remove();

  const width = Math.min(1000, document.querySelector(".chart-wrapper").clientWidth - 40);
  const height = 520;
  const margin = { top: 50, right: 30, bottom: 60, left: 80 };

  const svg = container.append("svg").attr("width", width).attr("height", height);

  const x = d3.scaleLog()
    .domain([d3.min(data, d => d.gdp)*0.9, d3.max(data, d => d.gdp)*1.1])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.pm25)*1.05])
    .range([height - margin.bottom, margin.top]);

  const r = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.pop)])
    .range([3, 36]);

  const xAxis = d3.axisBottom(x).ticks(7, "~s");
  const yAxis = d3.axisLeft(y);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  svg.append("text")
    .attr("x", width/2).attr("y", 28).attr("text-anchor","middle")
    .style("font-size","16px").text(`GDP vs PM2.5 — ${year}`);

  const tooltip = d3.select("body").append("div")
    .attr("class","d3-tooltip")
    .style("position","absolute")
    .style("pointer-events","none")
    .style("background","#fff")
    .style("z-index", 999999)
    .style("padding","8px")
    .style("border-radius","6px")
    .style("box-shadow","0 4px 12px rgba(0,0,0,0.12)")
    .style("display","none")
    .style("font-size","12px");

  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d.gdp))
    .attr("cy", d => y(d.pm25))
    .attr("r", d => r(d.pop))
    .attr("fill", "#4ecdc4")
    .attr("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip.style("display","block")
        .html(`<strong>${d.country}</strong><br/>GDP: ${d.gdp}<br/>PM2.5: ${d.pm25}<br/>Pop: ${d.pop}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY + 12) + "px");
    })
    .on("mouseout", () => tooltip.style("display","none"));
};
