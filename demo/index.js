import { loadPlugin } from "@donkeyclip/motorcortex";
import Player from "@donkeyclip/motorcortex-player";
import ChartsDef from "../dist/bundle.esm.js";

const Charts = loadPlugin(ChartsDef);

const dark = {
  backgroundColor: "#1a1a2e",
  textStyle: { color: "#e0e0e0" },
};

const chart = new Charts.Clip(
  { option: { backgroundColor: "#1a1a2e" } },
  {
    host: document.getElementById("clip"),
    containerParams: { width: "1280px", height: "720px" },
  }
);

let t = 500;

// ── 1. BAR CHART (new) ──────────────────────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "GDP by Country", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: ["USA", "China", "Japan", "Germany", "India"] },
          yAxis: { type: "value", name: "GDP (T$)" },
          series: [{
            type: "bar",
            data: [25.5, 17.9, 4.2, 4.1, 3.7],
            itemStyle: { color: "#2a9d8f" },
          }],
        },
      },
    },
    { selector: "!#chart", duration: 2000 }
  ),
  t
);
t += 3000;

// ── 2. BAR CHART (edit — values change) ─────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      attrs: { mode: "edit" },
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "GDP by Country", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: ["USA", "China", "Japan", "Germany", "India"] },
          yAxis: { type: "value", name: "GDP (T$)" },
          series: [{
            type: "bar",
            data: [32.0, 19.5, 4.8, 4.5, 4.2],
            itemStyle: { color: "#e76f51" },
          }],
        },
      },
    },
    { selector: "!#chart", duration: 1500 }
  ),
  t
);
t += 2500;

// ── 3. PIE CHART (new) ─────────────────────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Market Share", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "item" },
          series: [{
            type: "pie",
            radius: ["30%", "60%"],
            data: [
              { value: 35, name: "Product A" },
              { value: 25, name: "Product B" },
              { value: 20, name: "Product C" },
              { value: 12, name: "Product D" },
              { value: 8, name: "Other" },
            ],
          }],
        },
      },
    },
    { selector: "!#chart", duration: 2000 }
  ),
  t
);
t += 3000;

// ── 4. PIE CHART (edit — values shift) ──────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      attrs: { mode: "edit" },
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Market Share", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "item" },
          series: [{
            type: "pie",
            radius: ["30%", "60%"],
            data: [
              { value: 28, name: "Product A" },
              { value: 30, name: "Product B" },
              { value: 22, name: "Product C" },
              { value: 15, name: "Product D" },
              { value: 5, name: "Other" },
            ],
          }],
        },
      },
    },
    { selector: "!#chart", duration: 1500 }
  ),
  t
);
t += 2500;

// ── 5. LINE CHART (new) ────────────────────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Temperature Trend", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "axis" },
          legend: { data: ["2023", "2024"], textStyle: { color: "#ccc" }, top: 30 },
          xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
          yAxis: { type: "value", name: "°C" },
          series: [
            {
              name: "2023",
              type: "line",
              data: [5, 8, 14, 18, 22, 27],
              lineStyle: { color: "#2a9d8f" },
              itemStyle: { color: "#2a9d8f" },
            },
            {
              name: "2024",
              type: "line",
              data: [6, 9, 15, 20, 24, 29],
              lineStyle: { color: "#e76f51" },
              itemStyle: { color: "#e76f51" },
            },
          ],
        },
      },
    },
    { selector: "!#chart", duration: 2000 }
  ),
  t
);
t += 3000;

// ── 6. LINE CHART (edit — values update) ────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      attrs: { mode: "edit" },
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Temperature Trend", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "axis" },
          legend: { data: ["2023", "2024"], textStyle: { color: "#ccc" }, top: 30 },
          xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
          yAxis: { type: "value", name: "°C" },
          series: [
            {
              name: "2023",
              type: "line",
              data: [3, 5, 8, 10, 12, 15],
              lineStyle: { color: "#2a9d8f" },
              itemStyle: { color: "#2a9d8f" },
            },
            {
              name: "2024",
              type: "line",
              data: [4, 6, 9, 12, 14, 17],
              lineStyle: { color: "#e76f51" },
              itemStyle: { color: "#e76f51" },
            },
          ],
        },
      },
    },
    { selector: "!#chart", duration: 1500 }
  ),
  t
);
t += 2500;

// ── 7. SCATTER CHART (new) ──────────────────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Height vs Weight", left: "center", textStyle: { color: "#fff" } },
          tooltip: { trigger: "item" },
          xAxis: { type: "value", name: "Height (cm)" },
          yAxis: { type: "value", name: "Weight (kg)" },
          series: [{
            type: "scatter",
            symbolSize: 12,
            data: [
              [165, 60], [170, 65], [175, 72], [180, 80], [160, 55],
              [172, 68], [168, 63], [178, 76], [182, 85], [158, 52],
            ],
            itemStyle: { color: "#e9c46a" },
          }],
        },
      },
    },
    { selector: "!#chart", duration: 2000 }
  ),
  t
);
t += 3000;

// ── 8. RADAR CHART (new) ───────────────────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Player Stats", left: "center", textStyle: { color: "#fff" } },
          tooltip: {},
          radar: {
            indicator: [
              { name: "Speed", max: 100 },
              { name: "Shooting", max: 100 },
              { name: "Passing", max: 100 },
              { name: "Dribbling", max: 100 },
              { name: "Defense", max: 100 },
              { name: "Physical", max: 100 },
            ],
            axisName: { color: "#ccc" },
          },
          series: [{
            type: "radar",
            data: [
              {
                value: [90, 85, 78, 92, 45, 70],
                name: "Player A",
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: "#2a9d8f" },
                itemStyle: { color: "#2a9d8f" },
              },
              {
                value: [70, 60, 88, 75, 85, 90],
                name: "Player B",
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: "#e76f51" },
                itemStyle: { color: "#e76f51" },
              },
            ],
          }],
        },
      },
    },
    { selector: "!#chart", duration: 2000 }
  ),
  t
);
t += 3000;

// ── 9. RADAR CHART (edit — stats change) ────────────────────────

chart.addIncident(
  new Charts.UpdateChart(
    {
      attrs: { mode: "edit" },
      animatedAttrs: {
        option: {
          ...dark,
          title: { text: "Player Stats", left: "center", textStyle: { color: "#fff" } },
          tooltip: {},
          radar: {
            indicator: [
              { name: "Speed", max: 100 },
              { name: "Shooting", max: 100 },
              { name: "Passing", max: 100 },
              { name: "Dribbling", max: 100 },
              { name: "Defense", max: 100 },
              { name: "Physical", max: 100 },
            ],
            axisName: { color: "#ccc" },
          },
          series: [{
            type: "radar",
            data: [
              {
                value: [95, 90, 82, 88, 50, 75],
                name: "Player A",
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: "#2a9d8f" },
                itemStyle: { color: "#2a9d8f" },
              },
              {
                value: [65, 70, 92, 80, 90, 85],
                name: "Player B",
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: "#e76f51" },
                itemStyle: { color: "#e76f51" },
              },
            ],
          }],
        },
      },
    },
    { selector: "!#chart", duration: 1500 }
  ),
  t
);

new Player({ clip: chart });
