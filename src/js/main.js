document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section");
  const header = document.querySelector(".header");
  const headerHeight = header ? header.offsetHeight : 0;

  // ------------------ NAV SCROLL ------------------
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

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
    const yearFilter = document.querySelector("#yearFilter");
    const factorFilter = document.querySelector("#factorFilter");

    const rawData = await d3.csv("../data/processed_data.csv");

    // Sort Z → A by country
    rawData.sort((a, b) =>
      b.REF_AREA_LABEL.localeCompare(a.REF_AREA_LABEL)
    );

    // ---------------- POPULATE FILTERS ----------------
    const countries = Array.from(new Set(rawData.map(d => d.REF_AREA_LABEL)))
      .sort((a, b) => a.localeCompare(b));

    const years = Array.from(new Set(rawData.map(d => d.year)))
      .sort((a, b) => a - b);

    const factors = Array.from(new Set(rawData.map(d => d.factor)))
      .sort((a, b) => a.localeCompare(b));

    countryFilter.innerHTML =
      `<option value="all">All countries</option>` +
      countries.map(c => `<option value="${c}">${c}</option>`).join("");

    yearFilter.innerHTML =
      `<option value="all">All years</option>` +
      years.map(y => `<option value="${y}">${y}</option>`).join("");

    factorFilter.innerHTML =
      `<option value="all">All factors</option>` +
      factors.map(f => `<option value="${f}">${f}</option>`).join("");

    // ---------------- RENDER TABLE ----------------
    function renderTable() {
      const cVal = countryFilter.value;
      const yVal = yearFilter.value;
      const fVal = factorFilter.value;

      tableBody.innerHTML = "";

      rawData
        .filter(d =>
          (cVal === "all" || d.REF_AREA_LABEL === cVal) &&
          (yVal === "all" || d.year === yVal) &&
          (fVal === "all" || d.factor === fVal)
        )
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

          // Low-opacity zebra rows
          row.style.background = i % 2 === 0
            ? "rgba(90,159,107,0.06)"
            : "rgba(255,255,255,0.04)";

          row.addEventListener("mouseenter", () => {
            row.style.background = "rgba(90,159,107,0.18)";
          });

          row.addEventListener("mouseleave", () => {
            row.style.background = i % 2 === 0
              ? "rgba(90,159,107,0.06)"
              : "rgba(255,255,255,0.04)";
          });

          tableBody.appendChild(row);
        });
    }

    // Initial render
    renderTable();

    // Filter listeners
    countryFilter.addEventListener("change", renderTable);
    yearFilter.addEventListener("change", renderTable);
    factorFilter.addEventListener("change", renderTable);
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
