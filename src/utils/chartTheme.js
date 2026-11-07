/**
 * Chart chrome for the dark console.
 *
 * Vega and the hand-drawn SVG charts are painted, not styled: a stylesheet cannot reach a canvas.
 * Their specs come from the application definitions, where `config` is usually empty — which means
 * Vega's default theme, black labels and titles, invisible on a dark page. These helpers repaint the
 * **chrome** (axes, legend, titles, text) and leave the marks alone, because their colours carry the
 * meaning the author chose.
 */

/**
 * The spec comes from the application definition and its colours are the author's: most of them
 * leave `config` empty, which means Vega's **default** theme — black labels, black titles on a
 * transparent background. On the dark console that is a chart whose text disappears.
 *
 * Only the chrome is repainted (axes, legend, titles, text); the marks keep the colours the author
 * chose, because they carry meaning. An explicit value in the spec still wins: the merge puts the
 * theme first and the author's keys on top.
 */
export function darkChartConfig(config) {
  const base = config || {};
  return Object.assign({}, base, {
    background: "transparent",
    axis: Object.assign({
      domainColor: "#3a4356",
      gridColor: "#2f3646",
      tickColor: "#3a4356",
      labelColor: "#dfe4ed",
      titleColor: "#dfe4ed"
    }, base.axis),
    legend: Object.assign({ labelColor: "#dfe4ed", titleColor: "#dfe4ed" }, base.legend),
    title: Object.assign({ color: "#dfe4ed", subtitleColor: "#9aa4b5" }, base.title),
    text: Object.assign({ fill: "#dfe4ed" }, base.text),
    view: Object.assign({ stroke: null }, base.view)
  });
}
