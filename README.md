# mc-experience-graphs

A [MotorCortex](https://motorcortexjs.com/) plugin for animating charts using [ECharts](https://echarts.apache.org/).

## Installation

```bash
npm install @donkeyclip/mc-experience-graphs
```

## Usage

```js
import { loadPlugin } from "@donkeyclip/motorcortex";
import ChartsDef from "@donkeyclip/mc-experience-graphs";

const Charts = loadPlugin(ChartsDef);
```

### ChartClip

Creates an ECharts instance. Pass any valid ECharts option as `option`.

```js
const chart = new Charts.Clip(
  {
    option: {
      xAxis: { type: "category", data: ["A", "B", "C"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: [10, 20, 30] }],
    },
  },
  {
    host: document.getElementById("clip"),
    containerParams: { width: "1280px", height: "720px" },
  }
);
```

### UpdateChart

An Effect that transitions the chart to a new state with an opacity fade-in.

The plugin receives **complete ECharts option states** (not deltas). Each `UpdateChart` replaces the entire chart configuration. The chart only re-renders when the new state differs from the current live state.

```js
chart.addIncident(
  new Charts.UpdateChart(
    {
      animatedAttrs: {
        option: {
          xAxis: { type: "category", data: ["A", "B", "C", "D"] },
          yAxis: { type: "value" },
          series: [
            {
              type: "bar",
              data: [10, 20, 30, 40],
              itemStyle: { color: "#2a9d8f" },
            },
          ],
        },
      },
    },
    { selector: "!#chart", duration: 1000 }
  ),
  2000
);
```

### Highlighting Individual Items

To highlight a specific data point, include `itemStyle` on the target item in the data array:

```js
series: [{
  type: "bar",
  data: [
    { value: 10, itemStyle: { opacity: 0.3 } },
    { value: 20, itemStyle: { opacity: 1, borderColor: "#fff", borderWidth: 2 } }, // highlighted
    { value: 30, itemStyle: { opacity: 0.3 } },
  ],
}]
```

Items are identified by `name` or array index. The full data array must be provided since ECharts replaces arrays wholesale.

## Supported Chart Types

Any chart type supported by ECharts: bar, line, pie, scatter, radar, heatmap, treemap, sunburst, and more.

## Sanitization

All option objects are sanitized before being applied — function values and inline JS strings are stripped for security.

## License

[MIT](LICENSE)
