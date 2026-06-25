const fs = require('fs');
const path = require('path');

const summaryPath = path.resolve(__dirname, '../coverage/coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error("  \x1b[31m✖ Could not find coverage/coverage-summary.json\x1b[0m");
  process.exit(1);
}

const data = require(summaryPath);

const modules = ['applicant', 'manager', 'approver', 'accounting', 'admin', 'shared'];
const result = {};

for (const mod of modules) {
  result[mod] = { lines: { total: 0, covered: 0 } };
}

let totalLines = { total: 0, covered: 0 };

for (const [filepath, metrics] of Object.entries(data)) {
  if (filepath === 'total') {
    totalLines.total = metrics.lines.total;
    totalLines.covered = metrics.lines.covered;
    continue;
  }
  
  // Normalize path for Windows/Linux
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  for (const mod of modules) {
    if (normalizedPath.includes(`src/modules/${mod}/`)) {
      result[mod].lines.total += metrics.lines.total;
      result[mod].lines.covered += metrics.lines.covered;
      break;
    }
  }
}

console.log("  \x1b[1mCoverage Summary (Module Breakdown)\x1b[0m");
console.log("  ────────────────────────────────────────────────────────");
console.log("  Module               | % Lines | Covered / Total");
console.log("  ────────────────────────────────────────────────────────");

const formatRow = (name, total, covered) => {
  const pct = total === 0 ? "100.00" : ((covered / total) * 100).toFixed(2);
  const color = pct >= 80 ? "\x1b[32m" : "\x1b[33m"; // Green if >=80, Yellow otherwise
  console.log(`  ${name.padEnd(20)} | ${color}${pct.padStart(6)}%\x1b[0m | ${covered} / ${total}`);
  return parseFloat(pct);
};

const totalPct = formatRow("Project Total", totalLines.total, totalLines.covered);
console.log("  ────────────────────────────────────────────────────────");

for (const mod of modules) {
  formatRow(mod, result[mod].lines.total, result[mod].lines.covered);
}
console.log("  ────────────────────────────────────────────────────────");

if (totalPct < 80) {
  console.log("  \x1b[33m⚠ Currently evaluating coverage as a WARNING only. Rule: 80% minimum.\x1b[0m");
} else {
  console.log("  \x1b[32m✔ Project coverage meets the 80% requirement.\x1b[0m");
}
