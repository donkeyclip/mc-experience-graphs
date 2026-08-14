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

      // Axis max will be read from ECharts on first _applyEdit call
      this._editMaxReady = false;
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
      // 1. Apply full target so ECharts computes final layout
      const target = sanitizeOption(this.targetValue);
      target.animation = false;
      chart.setOption(target, true);

      // 2. Read ECharts' actual computed axis bounds
      this._axisBounds = readAxisBounds(chart);

      // 3. Analyse series for intro strategy
      this._introSeriesInfo = analyseSeriesIntro(target);

      // 4. Base state: zeroed data + hidden furniture
      const base = deepClone(target);
      zeroSeriesData(base);
      setFurnitureOpacity(base, 0);
      this._introBase = base;
      this._introTarget = target;
      this._introReady = true;
    }

    // Phase 1 (0→0.8): data values animate, labels stay transparent
    // Phase 2 (0.8→1): data at target, labels fade in
    const dataFraction = Math.min(fraction / 0.8, 1);
    const labelFraction = fraction <= 0.8 ? 0 : (fraction - 0.8) / 0.2;

    const state = deepClone(this._introBase);
    applyIntroData(state, this._introTarget, this._introSeriesInfo, dataFraction);

    setFurnitureOpacity(state, labelFraction);

    state.animation = false;
    chart.setOption(state, true);

    // Lock axis bounds via merge mode — ECharts' own computed values
    if (this._axisBounds) {
      chart.setOption(this._axisBounds, false);
    }

    container.style.opacity = fraction === 0 ? "0" : String(Math.min(fraction * 2, 1));
  }

  _applyEdit(chart, fraction) {
    const tweens = this._tweens;
    if (!tweens || tweens.length === 0) return;

    // On first call, read ECharts' actual computed axis extent
    if (!this._editMaxReady) {
      const bounds = readAxisBounds(chart);
      this._editFromMax = bounds?.yAxis?.max ?? null;

      // Compute target max: temporarily apply target, read extent, restore
      const targetClean = sanitizeOption(this.targetValue);
      targetClean.animation = false;
      chart.setOption(targetClean, true);
      const targetBounds = readAxisBounds(chart);
      this._editToMax = targetBounds?.yAxis?.max ?? null;

      // Restore to initial state
      const baseClean = deepClone(this._baseState);
      baseClean.animation = false;
      chart.setOption(baseClean, true);

      this._editMaxGrows = this._editToMax > this._editFromMax;
      this._editMaxReady = true;
    }

    const maxChanges = this._editFromMax !== null && this._editToMax !== null
      && this._editFromMax !== this._editToMax;

    let dataFraction, maxFraction;

    if (!maxChanges) {
      // No axis change — just tween data linearly
      dataFraction = fraction;
      maxFraction = 1;
    } else if (this._editMaxGrows) {
      // Max grows: first expand axis (0→0.4), then animate data (0.4→1)
      maxFraction = Math.min(fraction / 0.4, 1);
      dataFraction = fraction <= 0.4 ? 0 : (fraction - 0.4) / 0.6;
    } else {
      // Max shrinks: first animate data (0→0.6), then shrink axis (0.6→1)
      dataFraction = Math.min(fraction / 0.6, 1);
      maxFraction = fraction <= 0.6 ? 0 : (fraction - 0.6) / 0.4;
    }

    const state = deepClone(this._baseState);

    if (dataFraction > 0) {
      for (let i = 0; i < tweens.length; i++) {
        const tw = tweens[i];
        setAtPath(state, tw.path, lerp(tw.from, tw.to, dataFraction));
      }
    }

    // Set axis max in the state
    if (maxChanges) {
      const rawMax = this._editFromMax + (this._editToMax - this._editFromMax) * maxFraction;
      const currentMax = Math.round(rawMax * 10) / 10;
      if (state.yAxis) {
        const yList = Array.isArray(state.yAxis) ? state.yAxis : [state.yAxis];
        for (const y of yList) {
          if (y.type === "value" || !y.type) y.max = currentMax;
        }
      }
    }

    state.animation = false;
    chart.setOption(state, true);
  }
}

// ── Intro data animation ──────────────────────────────────────────

function analyseSeriesIntro(option) {
  if (!option.series) return [];
  const series = Array.isArray(option.series) ? option.series : [option.series];
  return series.map(s => {
    const isSequential = s.type === "line" || s.type === "scatter";
    const pointCount = s.data ? s.data.length : 0;
    return { type: s.type, isSequential, pointCount };
  });
}

function applyIntroData(state, target, seriesInfo, fraction) {
  if (!state.series || !target.series) return;
  const sList = Array.isArray(state.series) ? state.series : [state.series];
  const tList = Array.isArray(target.series) ? target.series : [target.series];

  for (let si = 0; si < sList.length && si < tList.length; si++) {
    const s = sList[si];
    const t = tList[si];
    const info = seriesInfo[si];
    if (!s.data || !t.data) continue;

    if (info && info.isSequential && info.pointCount > 1) {
      // Sequential with overlap: each point starts 20% before previous ends
      const n = info.pointCount;
      const slotWidth = 1 / n;
      const stride = slotWidth * 0.8;
      const totalSpan = (n - 1) * stride + slotWidth;

      for (let i = 0; i < n; i++) {
        const pointStart = (i * stride) / totalSpan;
        const pointEnd = (i * stride + slotWidth) / totalSpan;
        const pointFraction = fraction <= pointStart ? 0
          : fraction >= pointEnd ? 1
          : (fraction - pointStart) / (pointEnd - pointStart);

        if (pointFraction <= 0) {
          // Not yet revealed — null so ECharts skips this segment
          s.data[i] = null;
        } else {
          s.data[i] = lerpDataPoint(s.data[i], t.data[i], pointFraction);
        }
      }
    } else {
      // Simultaneous: all points tween together (bar, pie, etc.)
      for (let i = 0; i < s.data.length && i < t.data.length; i++) {
        s.data[i] = lerpDataPoint(s.data[i], t.data[i], fraction);
      }
    }
  }
}

function lerpDataPoint(from, to, fraction) {
  if (typeof from === "number" && typeof to === "number") {
    return from + (to - from) * fraction;
  }
  if (isObj(from) && isObj(to) && from.value !== undefined && to.value !== undefined) {
    if (Array.isArray(from.value) && Array.isArray(to.value)) {
      const val = from.value.map((v, i) =>
        typeof v === "number" && typeof to.value[i] === "number"
          ? v + (to.value[i] - v) * fraction : to.value[i]
      );
      return { ...to, value: val };
    }
    return { ...to, value: from.value + (to.value - from.value) * fraction };
  }
  if (Array.isArray(from) && Array.isArray(to)) {
    return from.map((v, i) => {
      if (typeof v === "number" && typeof to[i] === "number") {
        return v + (to[i] - v) * fraction;
      }
      return fraction >= 1 ? to[i] : v;
    });
  }
  return fraction >= 1 ? to : from;
}

// ── Intro helpers ─────────────────────────────────────────────────

function readAxisBounds(chart) {
  const bounds = {};
  const model = chart.getModel();
  if (!model) return null;

  for (const axisKey of ["xAxis", "yAxis"]) {
    const compType = axisKey;
    let idx = 0;
    let comp = model.getComponent(compType, idx);
    if (!comp) continue;

    const list = [];
    while (comp) {
      const extent = comp.axis?.scale?.getExtent?.();
      if (extent) {
        list.push({ min: extent[0], max: extent[1] });
      }
      idx++;
      comp = model.getComponent(compType, idx);
    }

    if (list.length > 0) {
      bounds[axisKey] = list.length === 1 ? list[0] : list;
    }
  }

  return Object.keys(bounds).length > 0 ? bounds : null;
}

function setFurnitureOpacity(option, opacity) {
  for (const axisKey of ["xAxis", "yAxis", "radiusAxis", "angleAxis"]) {
    const axes = option[axisKey];
    if (!axes) continue;
    const list = Array.isArray(axes) ? axes : [axes];
    for (const axis of list) {
      axis.axisLabel = { ...(axis.axisLabel || {}), opacity };
      axis.axisTick = { ...(axis.axisTick || {}), lineStyle: { ...(axis.axisTick?.lineStyle || {}), opacity } };
      axis.splitLine = { ...(axis.splitLine || {}), lineStyle: { ...(axis.splitLine?.lineStyle || {}), opacity } };
      axis.axisLine = { ...(axis.axisLine || {}), lineStyle: { ...(axis.axisLine?.lineStyle || {}), opacity } };
      axis.nameTextStyle = { ...(axis.nameTextStyle || {}), opacity };
    }
  }
  if (option.title) {
    const titles = Array.isArray(option.title) ? option.title : [option.title];
    for (const t of titles) {
      t.textStyle = { ...(t.textStyle || {}), opacity };
    }
  }
  if (option.legend) {
    const legends = Array.isArray(option.legend) ? option.legend : [option.legend];
    for (const l of legends) {
      l.textStyle = { ...(l.textStyle || {}), opacity };
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
        const v = s.data[i].value;
        s.data[i] = { ...s.data[i], value: Array.isArray(v) ? v.map(() => 0) : 0 };
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
    const fa = from.a !== undefined ? from.a : 1;
    const ta = to.a !== undefined ? to.a : 1;
    if (fa !== 1 || ta !== 1) {
      const a = +(fa + (ta - fa) * t).toFixed(3);
      return `rgba(${r},${g},${b},${a})`;
    }
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
      a: 1,
    };
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(str);
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: 1 };
  }
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(str);
  if (rgba) {
    return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: +rgba[4] };
  }
  return null;
}
