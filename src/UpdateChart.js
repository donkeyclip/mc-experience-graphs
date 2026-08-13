import { Effect } from "@donkeyclip/motorcortex";
import { sanitizeOption } from "./sanitize";

export default class UpdateChart extends Effect {
  getScratchValue() {
    return {};
  }

  onGetContext() {
    const mode = this.attrs?.attrs?.mode || "new";
    this._mode = mode;

    if (mode === "edit") {
      const from = sanitizeOption(this.initialValue);
      const to = sanitizeOption(this.targetValue);
      this._tweens = buildTweens(from, to);
      this._baseState = deepClone(from);
    }
  }

  onProgress(millisecond) {
    const fraction = this.getFraction(millisecond);
    const chart = this.element?.entity;
    if (!chart || typeof chart.setOption !== "function") return;

    const container = chart.getDom();
    if (!container) return;

    if (this._mode === "edit") {
      this._applyEdit(chart, fraction);
    } else {
      this._applyNew(chart, container, fraction);
    }
  }

  _applyNew(chart, container, fraction) {
    if (!this._introReady) {
      // 1. Apply target so ECharts computes final layout
      const target = sanitizeOption(this.targetValue);
      target.animation = false;
      chart.setOption(target, true);

      // 2. Compute axis bounds from target data and lock them
      const locked = deepClone(target);
      lockAxisBounds(locked);

      // 4. Build "from" state: same as locked but data zeroed + labels transparent
      const from = deepClone(locked);
      zeroSeriesData(from);
      makeLabelsTransparent(from);

      // 5. Build "to" state: locked with original labels (visible)
      const to = deepClone(locked);

      // 6. Build tweens — this captures BOTH data value tweens AND color tweens
      this._introTweens = buildTweens(from, to);
      this._introBase = from;
      this._introReady = true;
    }

    // Single continuous tween — no state switch at any fraction
    const state = deepClone(this._introBase);
    const tweens = this._introTweens;
    if (tweens && tweens.length > 0) {
      for (let i = 0; i < tweens.length; i++) {
        const tw = tweens[i];
        setAtPath(state, tw.path, lerp(tw.from, tw.to, fraction));
      }
    }

    state.animation = false;
    chart.setOption(state, true);
    container.style.opacity = fraction === 0 ? "0" : String(Math.min(fraction * 2, 1));
  }

  _applyEdit(chart, fraction) {
    const tweens = this._tweens;
    if (!tweens || tweens.length === 0) return;

    const state = deepClone(this._baseState);

    for (let i = 0; i < tweens.length; i++) {
      const tw = tweens[i];
      setAtPath(state, tw.path, lerp(tw.from, tw.to, fraction));
    }

    state.animation = false;
    chart.setOption(state, true);
  }
}

// ── Intro helpers ─────────────────────────────────────────────────

function lockAxisBounds(option) {
  // Collect all numeric values from series data, split by dimension
  const xVals = [];
  const yVals = [];
  if (option.series) {
    const series = Array.isArray(option.series) ? option.series : [option.series];
    for (const s of series) {
      if (!s.data) continue;
      for (const d of s.data) {
        if (typeof d === "number") {
          yVals.push(d);
        } else if (isObj(d) && typeof d.value === "number") {
          yVals.push(d.value);
        } else if (Array.isArray(d)) {
          if (d.length >= 1 && typeof d[0] === "number") xVals.push(d[0]);
          if (d.length >= 2 && typeof d[1] === "number") yVals.push(d[1]);
        }
      }
    }
  }

  for (const axisKey of ["xAxis", "yAxis", "radiusAxis", "angleAxis"]) {
    const axes = option[axisKey];
    if (!axes) continue;
    const list = Array.isArray(axes) ? axes : [axes];
    for (const axis of list) {
      if (axis.type !== "value") continue;
      const vals = axisKey === "xAxis" ? xVals : yVals;
      const useVals = vals.length > 0 ? vals : [...xVals, ...yVals];
      if (useVals.length === 0) continue;
      const min = Math.min(...useVals, 0);
      const max = Math.max(...useVals);
      axis.min = min;
      axis.max = niceNum(max);
    }
  }
}

function niceNum(value) {
  if (value <= 0) return 0;
  const exp = Math.floor(Math.log10(value));
  const frac = value / Math.pow(10, exp);
  let nice;
  if (frac <= 1.2) nice = 1.5;
  else if (frac <= 2.5) nice = 3;
  else if (frac <= 4) nice = 5;
  else if (frac <= 7) nice = 8;
  else nice = 10;
  return nice * Math.pow(10, exp);
}

function makeLabelsTransparent(option) {
  const transparent = "rgba(0,0,0,0)";
  for (const axisKey of ["xAxis", "yAxis", "radiusAxis", "angleAxis"]) {
    const axes = option[axisKey];
    if (!axes) continue;
    const list = Array.isArray(axes) ? axes : [axes];
    for (const axis of list) {
      axis.axisLabel = { ...(axis.axisLabel || {}), color: transparent };
      axis.axisTick = { ...(axis.axisTick || {}), lineStyle: { color: transparent } };
      axis.splitLine = { ...(axis.splitLine || {}), lineStyle: { color: transparent } };
      axis.axisLine = { ...(axis.axisLine || {}), lineStyle: { color: transparent } };
      axis.nameTextStyle = { ...(axis.nameTextStyle || {}), color: transparent };
    }
  }
  if (option.title) {
    const titles = Array.isArray(option.title) ? option.title : [option.title];
    for (const t of titles) {
      t.textStyle = { ...(t.textStyle || {}), color: transparent };
    }
  }
  if (option.legend) {
    const legends = Array.isArray(option.legend) ? option.legend : [option.legend];
    for (const l of legends) {
      l.textStyle = { ...(l.textStyle || {}), color: transparent };
    }
  }
}

function zeroSeriesData(option) {
  if (!option.series) return;
  const series = Array.isArray(option.series) ? option.series : [option.series];
  for (const s of series) {
    if (!s.data) continue;
    for (let i = 0; i < s.data.length; i++) {
      if (typeof s.data[i] === "number") {
        s.data[i] = 0;
      } else if (isObj(s.data[i]) && s.data[i].value !== undefined) {
        s.data[i] = { ...s.data[i], value: 0 };
      } else if (Array.isArray(s.data[i])) {
        s.data[i] = s.data[i].map(v => typeof v === "number" ? 0 : v);
      }
    }
  }
}

// ── Tween builder ──────────────────────────────────────────────────

function buildTweens(from, to, path = [], result = []) {
  if (from === to) return result;

  if (typeof from === "number" && typeof to === "number") {
    if (from !== to) result.push({ path: path.slice(), from, to });
    return result;
  }

  if (typeof from === "string" && typeof to === "string") {
    const fc = parseColor(from);
    const tc = parseColor(to);
    if (fc && tc) {
      result.push({ path: path.slice(), from: fc, to: tc, type: "color" });
    }
    return result;
  }

  if (Array.isArray(from) && Array.isArray(to)) {
    const len = Math.max(from.length, to.length);
    for (let i = 0; i < len; i++) {
      const fv = i < from.length ? from[i] : inferZero(to[i]);
      const tv = i < to.length ? to[i] : inferZero(from[i]);
      buildTweens(fv, tv, [...path, i], result);
    }
    return result;
  }

  if (isObj(from) && isObj(to)) {
    const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
    for (const k of keys) {
      if (k in from && k in to) {
        buildTweens(from[k], to[k], [...path, k], result);
      } else if (k in to && typeof to[k] === "number") {
        result.push({ path: [...path, k], from: 0, to: to[k] });
      }
    }
    return result;
  }

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────

function lerp(from, to, t) {
  if (typeof from === "number") return from + (to - from) * t;
  if (from.r !== undefined) {
    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    return `rgb(${r},${g},${b})`;
  }
  return to;
}

function inferZero(ref) {
  if (typeof ref === "number") return 0;
  if (isObj(ref) && ref.value !== undefined) {
    return { ...ref, value: 0 };
  }
  return ref;
}

function setAtPath(obj, path, value) {
  let target = obj;
  for (let i = 0; i < path.length - 1; i++) {
    target = target[path[i]];
    if (target == null) return;
  }
  target[path[path.length - 1]] = value;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isObj(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function parseColor(str) {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(str);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(str);
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  }
  return null;
}
