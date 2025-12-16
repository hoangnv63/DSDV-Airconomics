window.initDataTable = async function () {
  const dataSection = document.querySelector("#data");
  const table = dataSection.querySelector("#data-table");
  const tableBody = table.querySelector("tbody");

  const countryFilter = document.querySelector("#countryFilter");
  const yearFilter = document.querySelector("#yearFilter");
  const factorFilter = document.querySelector("#factorFilter");

  const rawData = await d3.csv("../data/processed_data.csv");

  rawData.sort((a, b) =>
    b.REF_AREA_LABEL.localeCompare(a.REF_AREA_LABEL)
  );

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

  renderTable();

  countryFilter.addEventListener("change", renderTable);
  yearFilter.addEventListener("change", renderTable);
  factorFilter.addEventListener("change", renderTable);
};
