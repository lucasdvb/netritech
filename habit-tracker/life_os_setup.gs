/**
 * Life OS · finish setup for Google Sheets
 * Extensions → Apps Script → paste this file → Save → run finishSetup once (allow access).
 * Safe to run again at any time: it keeps your ticks and only restyles.
 */
const LIFE_OS = {
  bg: '#141B2D', panel: '#1C2438', panel2: '#232D45', line: '#2E3852', text: '#E8ECF4', muted: '#8D97B0',
  font: 'Montserrat',
  checkboxes: {
  "Oct 2026": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Nov 2026": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Dec 2026": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Jan 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Feb 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Mar 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Apr 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "May 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Jun 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Jul 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Aug 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Sep 2027": [
    "E10:AI18",
    "E20:AI32",
    "E34:AI37"
  ],
  "Week Plan": [
    "C31:C33",
    "C35:C42",
    "F31:F33",
    "F35:F42",
    "I31:I33",
    "I35:I42",
    "L31:L33",
    "L35:L42",
    "O31:O33",
    "O35:O42",
    "R31:R33",
    "R35:R42",
    "U31:U33",
    "U35:U42"
  ],
  "Body": [
    "J17:J43"
  ],
  "Weekly Review": [
    "AA8:AA60",
    "AB8:AB60",
    "AI8:AI60"
  ],
  "Monthly Review": [
    "T8:T19"
  ]
},
  charts: {
  "Oct 2026": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Nov 2026": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Dec 2026": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Jan 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Feb 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Mar 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Apr 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "May 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Jun 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Jul 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Aug 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Sep 2027": [
    {
      "kind": "area",
      "row": 43,
      "col": 5,
      "colors": [
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "line",
      "row": 72,
      "col": 5,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "weight",
      "row": 72,
      "col": 21,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    }
  ],
  "Dashboard": [
    {
      "kind": "combo",
      "row": 55,
      "col": 2,
      "colors": [
        "#F5C542",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "weight",
      "row": 55,
      "col": 11,
      "colors": [
        "#8B5CF6",
        "#19C3C3"
      ]
    },
    {
      "kind": "combo",
      "row": 72,
      "col": 2,
      "colors": [
        "#19C3C3",
        "#F5C542"
      ]
    },
    {
      "kind": "line",
      "row": 72,
      "col": 11,
      "colors": [
        "#4F7CF7",
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    }
  ],
  "Week Plan": [
    {
      "kind": "bar",
      "row": 6,
      "col": 2,
      "colors": [],
      "vmin": 0,
      "vmax": 1,
      "fmt": "percent"
    },
    {
      "kind": "donut",
      "row": 6,
      "col": 11,
      "colors": [
        "#19C3C3",
        "#232D45"
      ]
    },
    {
      "kind": "line",
      "row": 6,
      "col": 14,
      "colors": [
        "#F5C542",
        "#F0508A",
        "#19C3C3"
      ],
      "vmin": 0,
      "vmax": 10
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 2,
      "colors": [
        "#8B5CF6",
        "#232D45"
      ]
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 5,
      "colors": [
        "#4F7CF7",
        "#232D45"
      ]
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 8,
      "colors": [
        "#19C3C3",
        "#232D45"
      ]
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 11,
      "colors": [
        "#22C55E",
        "#232D45"
      ]
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 14,
      "colors": [
        "#A3E635",
        "#232D45"
      ]
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 17,
      "colors": [
        "#F5C542",
        "#232D45"
      ]
    },
    {
      "kind": "donut",
      "row": 21,
      "col": 20,
      "colors": [
        "#F59E42",
        "#232D45"
      ]
    }
  ],
  "Body": [
    {
      "kind": "line",
      "row": 6,
      "col": 13,
      "colors": [
        "#8B5CF6"
      ]
    },
    {
      "kind": "line",
      "row": 27,
      "col": 13,
      "colors": [
        "#19C3C3"
      ]
    }
  ]
},
  monthSheets: ["Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027", "Apr 2027", "May 2027", "Jun 2027", "Jul 2027", "Aug 2027", "Sep 2027"],
  order: ["Start Here", "Dashboard", "Week Plan", "Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027", "Apr 2027", "May 2027", "Jun 2027", "Jul 2027", "Aug 2027", "Sep 2027", "Body", "Weekly Review", "Monthly Review", "Habit Library", "Plan & Routines", "Settings", "Calc", "Data"],
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Life OS')
    .addItem('Go to today', 'goToToday')
    .addItem('New week: clear Week Plan tasks', 'clearWeekPlan')
    .addSeparator()
    .addItem('Finish setup (checkboxes, font, charts)', 'finishSetup')
    .addToUi();
}

function finishSetup() {
  const ss = SpreadsheetApp.getActive();
  setupCheckboxes_(ss);
  ss.getSheets().forEach(function (sh) {
    try { sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setFontFamily(LIFE_OS.font); } catch (e) {}
    try { sh.setHiddenGridlines(true); } catch (e) {}
    paintOutside_(sh);
  });
  styleCharts_(ss);
  ['Calc', 'Data'].forEach(function (n) { const s = ss.getSheetByName(n); if (s) s.hideSheet(); });
  SpreadsheetApp.flush();
  ss.toast('Life OS is ready. Use the Life OS menu → Go to today.', 'Life OS', 8);
}

function setupCheckboxes_(ss) {
  Object.keys(LIFE_OS.checkboxes).forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    LIFE_OS.checkboxes[name].forEach(function (a1) {
      const r = sh.getRange(a1);
      const keep = r.getValues().map(function (row) {
        return row.map(function (v) { return v === true || String(v).toLowerCase() === 'x'; });
      });
      r.clearDataValidations();
      r.insertCheckboxes();
      r.setValues(keep);
    });
  });
}

function paintOutside_(sh) {
  const lastRow = Math.max(sh.getLastRow(), 1), lastCol = Math.max(sh.getLastColumn(), 1);
  const maxRow = sh.getMaxRows(), maxCol = sh.getMaxColumns();
  if (maxRow > lastRow) sh.getRange(lastRow + 1, 1, maxRow - lastRow, maxCol).setBackground(LIFE_OS.bg);
  if (maxCol > lastCol) sh.getRange(1, lastCol + 1, lastRow, maxCol - lastCol).setBackground(LIFE_OS.bg);
}

function styleCharts_(ss) {
  const axis = { textStyle: { color: LIFE_OS.muted, fontName: LIFE_OS.font, fontSize: 10 },
                 gridlines: { color: LIFE_OS.line }, baselineColor: LIFE_OS.line };
  Object.keys(LIFE_OS.charts).forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const specs = LIFE_OS.charts[name].slice();
    sh.getCharts().forEach(function (ch, i) {
      const spec = takeSpec_(specs, ch);
      if (!spec) return;
      try {
        const b = ch.modify()
          .setOption('backgroundColor', LIFE_OS.panel)
          .setOption('chartArea', { backgroundColor: LIFE_OS.panel })
          .setOption('fontName', LIFE_OS.font)
          .setOption('title', '');
        if (spec.colors.length) b.setOption('colors', spec.colors);
        if (spec.kind === 'donut') {
          b.setOption('pieHole', 0.72).setOption('legend', { position: 'none' })
           .setOption('pieSliceText', 'none').setOption('pieSliceBorderColor', LIFE_OS.panel);
        } else {
          const v = JSON.parse(JSON.stringify(axis));
          if (spec.vmin !== undefined) v.viewWindow = { min: spec.vmin, max: spec.vmax };
          if (spec.fmt === 'percent') v.format = 'percent';
          b.setOption('vAxis', v)
           .setOption('hAxis', { textStyle: axis.textStyle, gridlines: { color: 'transparent' }, baselineColor: LIFE_OS.line })
           .setOption('legend', { position: 'bottom', textStyle: { color: LIFE_OS.muted, fontName: LIFE_OS.font } });
          if (spec.kind === 'area') b.setOption('areaOpacity', 0.35).setOption('lineWidth', 2).setOption('legend', { position: 'none' });
          if (spec.kind === 'line' || spec.kind === 'weight') b.setOption('curveType', 'function').setOption('lineWidth', 2);
          if (spec.kind === 'bar') b.setOption('legend', { position: 'none' });
        }
        sh.updateChart(b.build());
      } catch (e) {
        console.log('Chart style skipped on ' + name + ' #' + i + ': ' + e);
      }
    });
  });
}

// Pick the style whose anchor is closest to where this chart sits.
function takeSpec_(specs, ch) {
  if (!specs.length) return null;
  let row = 0, col = 0;
  try { const ci = ch.getContainerInfo(); row = ci.getAnchorRow(); col = ci.getAnchorColumn(); } catch (e) {}
  let best = 0, bestD = Infinity;
  specs.forEach(function (s, i) {
    const d = Math.abs(s.row - row) + Math.abs(s.col - col);
    if (d < bestD) { bestD = d; best = i; }
  });
  return specs.splice(best, 1)[0];
}

function goToToday() {
  const ss = SpreadsheetApp.getActive();
  const tz = ss.getSpreadsheetTimeZone();
  const now = new Date();
  const name = Utilities.formatDate(now, tz, 'MMM yyyy');
  const sh = ss.getSheetByName(name) || ss.getSheetByName('Dashboard');
  ss.setActiveSheet(sh);
  if (LIFE_OS.monthSheets.indexOf(name) >= 0) {
    const day = Number(Utilities.formatDate(now, tz, 'd'));
    sh.setActiveRange(sh.getRange(10, 4 + day));
  }
}

function clearWeekPlan() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Week Plan');
  if (!sh) return;
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Clear this week\'s Top 3 and tasks?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  for (let d = 0; d < 7; d++) {
    const c = 2 + d * 3;
    sh.getRange(31, c, 3, 1).clearContent();
    sh.getRange(35, c, 8, 1).clearContent();
    sh.getRange(31, c + 1, 3, 1).uncheck();
    sh.getRange(35, c + 1, 8, 1).uncheck();
  }
}
