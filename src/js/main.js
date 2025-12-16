
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section");
  const header = document.querySelector(".header");
  const headerHeight = header ? header.offsetHeight : 0;

  // Smooth scroll on click
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Set active class
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Get target section
      let targetSelector = link.dataset.target;
      if (!targetSelector.startsWith("#")) targetSelector = "#" + targetSelector;

      const target = document.querySelector(targetSelector);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  // ------------------ LOAD DATASET TABLE ------------------
  async function loadDatasetTable() {
  const dataSection = document.querySelector("#data");
  const table = dataSection.querySelector("#data-table");
  const tableBody = table.querySelector("tbody");
  const countryFilter = document.querySelector("#countryFilter");

  // Wrap table in chart-wrapper if not already
  let wrapper = dataSection.querySelector(".chart-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.classList.add("chart-wrapper");

    const tableWrapper = document.createElement("div");
    tableWrapper.style.overflowX = "auto";
    tableWrapper.style.overflowY = "auto";
    tableWrapper.style.maxHeight = "600px";

    tableWrapper.appendChild(table);
    wrapper.appendChild(tableWrapper);
    dataSection.appendChild(wrapper);
  }

  // Load CSV data
  const rawData = await d3.csv("../data/processed_data.csv");

  // ---------------- SORT Z → A by country name ----------------
  rawData.sort((a, b) =>
    b.REF_AREA_LABEL.localeCompare(a.REF_AREA_LABEL)
  );

  // ---------------- POPULATE FILTER ----------------
  const countries = Array.from(
    new Set(rawData.map(d => d.REF_AREA_LABEL))
  ).sort((a, b) => a.localeCompare(b));

  countryFilter.innerHTML =
    `<option value="all">All countries</option>` +
    countries.map(c => `<option value="${c}">${c}</option>`).join("");

  // ---------------- RENDER FUNCTION ----------------
  function renderTable(filterValue = "all") {
    tableBody.innerHTML = "";

    rawData
      .filter(d => filterValue === "all" || d.REF_AREA_LABEL === filterValue)
      .forEach((d, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${d.REF_AREA_LABEL}</td>
          <td>${d.REF_AREA}</td>
          <td>${d.continent}</td>
          <td>${d.year}</td>
          <td>${d.factor}</td>
          <td>${d.value}</td>
        `;

        // Alternate row background (low opacity)
        row.style.background = i % 2 === 0
          ? "rgba(90,159,107,0.06)"
          : "rgba(255,255,255,0.04)";

        // Hover effect
        row.addEventListener("mouseenter", () => {
          row.style.background = "rgba(90,159,107,0.16)";
        });
        row.addEventListener("mouseleave", () => {
          row.style.background = i % 2 === 0
            ? "rgba(90,159,107,0.06)"
            : "rgba(255,255,255,0.04)";
        });

        tableBody.appendChild(row);
      });
  }

  // Initial render (Z → A)
  renderTable();

  // Filter listener
  countryFilter.addEventListener("change", (e) => {
    renderTable(e.target.value);
  });
}

  loadDatasetTable(); 

  // ------------------ INTERSECTION OBSERVER ------------------
  const observerOptions = {
    root: null,
    rootMargin: `-${headerHeight}px 0px 0px 0px`,
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          if (link.dataset.target === "#" + id || link.dataset.target === id) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // ------------------ INIT CHARTS ------------------
  if (window.initChart1) window.initChart1();
  if (window.initChart2) window.initChart2();
  if (window.initChart3) window.initChart3();
});
