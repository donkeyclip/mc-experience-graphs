import { BrowserClip } from "@donkeyclip/motorcortex";
import * as echarts from "echarts";
import { sanitizeOption } from "./sanitize";

/**
 * ChartClip is a BrowserClip that renders an ECharts instance.
 *
 * Attrs:
 *   option {object} Initial ECharts option (series, xAxis, yAxis, etc.)
 *                    Sanitized on render: functions and inline JS are stripped.
 *
 * The ECharts instance is exposed as a custom entity named "chart" so
 * UpdateChart Effects can target it with selector "!#chart".
 */
export default class ChartClip extends BrowserClip {
  onAfterRender() {
    const container = this.context.rootElement;

    // Walk up to find the MC container with explicit pixel dimensions.
    // BrowserClip wraps rootElement in a div with the containerParams
    // dimensions set as inline styles.
    const mcContainer = container.closest("[data-motorcortex-container]")
      || container.parentElement;
    const w = mcContainer?.clientWidth || container.clientWidth || 800;
    const h = mcContainer?.clientHeight || container.clientHeight || 600;

    // Create a dedicated div with explicit pixel dimensions for ECharts.
    const chartDiv = document.createElement("div");
    chartDiv.style.width = w + "px";
    chartDiv.style.height = h + "px";
    container.appendChild(chartDiv);

    const chart = echarts.init(chartDiv);

    // Apply initial option if provided
    const initialOption =
      this.attrs && this.attrs.option
        ? sanitizeOption(this.attrs.option)
        : {};
    initialOption.animation = false;
    chart.setOption(initialOption, true);

    // Expose the chart instance as a custom entity
    this.context.setCustomEntity("chart", chart, ["charts"]);

    // Resize ECharts when the container resizes
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chartDiv.style.width = width + "px";
          chartDiv.style.height = height + "px";
          chart.resize();
        }
      }
    });
    observer.observe(mcContainer || container);
    this._resizeObserver = observer;

    this.contextLoaded();
  }
}
