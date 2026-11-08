const R = require("react"); module.exports = { useEffect: R.useEffect, useRef: R.useRef, useState: R.useState, Fragment: R.Fragment,
 Button: (p) => R.createElement("button", { onClick: p.onClick }, p.label), Toggle: (p) => R.createElement("button", { onClick: () => p.onChange(!p.value) }, p.label),
 useGrokTheme: () => ({ font: { mono: "monospace", family: "sans-serif" }, text: { primary: "#eee", secondary: "#aaa" }, border: { default: "#444" }, dataviz: { categorical: ["#39f", "#fc3", "#3cf"] } }) };
