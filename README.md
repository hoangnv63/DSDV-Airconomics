# 🌍 Airconomics — Environmental Data Visualization

**Airconomics** is an interactive web-based project for the course **Data Science & Data Visualization** at International University, VNU-HCM. The web explores the relationship between **air quality (PM2.5)**, **economic growth (GDP)**, and **population** across countries over time.

The project focuses on helping users understand global environmental inequality and long-term pollution trends from **1990 to 2020** through interactive charts and maps.

---

## 📊 Features

### 1. Bubble Chart
Visualizes the relationship between GDP per capita, PM2.5 air pollution, and population size. 
- **X-axis**: GDP (log scale)
- **Y-axis**: PM2.5 concentration (µg/m³)
- **Bubble size**: Population
- **Color**: Region / Continent
- **Interactions**:
    - Year slider with play animation
    - Region filter (World / continents)
    - Hover tooltip with country details
    - Year watermark in background

### 2. Line Chart
Displays PM2.5 trends over time of different countries and the World.
- **X-axis**: PM2.5 concentration (µg/m³)
- **Y-axis**: Year (1990 - 2020)
- Always includes **world average** as a reference line
- Allows users to select one or more countries to compare against the world trend or to each other
- **Interactions**:
    - Dynamic country selection
    - Hover tooltip showing values by year
    - Clear visual comparison between global and country-level trends

### 3. Choropleth Map
Demonstrates PM2.5 levels by country for a selected year.
- World map colored by PM2.5 level:
    - Lighter red: lower level of PM2.5
    - Darker red: higher level of PM2.5
- **Interactions**:
    - Year slider with play button
    - Hover tooltip for country values
    - Click-to-zoom on countries
    - Background year watermark
    - Color legend with transparent background
---

## 🧱 Project Structure

DSDV-AIRCONOMICS/
│
├── data/
│ ├── countryContinent.csv  # continent dataset
│ ├── gdp.csv               # gdp per capita dataset
│ ├── pm25.csv              # pm2.5 dataset
│ ├── population.csv        # population dataset
│ └── processed_data.csv    # Cleaned dataset
│
├── index.html      # Main HTML file
├── styles.css      # Global styles
│
├── js/
│ ├── main.js       # Navigation & initialization
│ ├── plot.js       # Bubble chart logic
│ ├── line.js       # Line chart logic
│ ├── map.js        # Choropleth map logic
│ └── datatable.js  # Dataset table logic
│
└── README.md

---

## 🛠️ Technologies Used

- HTML5 / CSS3
- Python
- JavaScript (ES6)
- D3.js v7
- Chart.js
- GeoJSON / TopoJSON

---

## 📁 Dataset

The dataset includes:
- PM2.5 concentration
- GDP
- Population
- Country name, ISO code, continent
- Years: 1990–2020

The data is preprocessed into a long-format CSV for efficient visualization.

---

## ▶️ How to Run

Because the project loads CSV and GeoJSON files, it must be served via a local server.

### Option 1: VS Code Live Server
1. Open the project folder in VS Code
2. Install the Live Server extension
3. Right-click `index.html`, then open with `Go Live`
---

## 🎨 Design Decisions

- Bubble chart encodes GDP, PM2.5, and population simultaneously.
- Log scale improves GDP readability.
- Minimal animation avoids distracting analysis.
- Region-based coloring ensures consistency.
- Coordinated views support cross-chart analysis.

---

## 👥 Team Members

- Member 1 – Vũ Như Huệ Lan
- Member 2 – Nguyễn Việt Hoàng
- Member 3 – Nguyễn Huỳnh Ngân Anh

---

## 📌 Notes

- This project focuses on exploratory analysis.
- All data is preprocessed before visualization.
- Designed for academic and educational use.

---

## 📄 License

Educational use only.
