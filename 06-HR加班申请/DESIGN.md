---
name: HR One overtime operations
colors:
  primary: "#0E66FB"
  background: "#FAFBFC"
  surface: "#FFFFFF"
  border: "#E6E6E8"
typography:
  body: "14px PingFang SC, Microsoft YaHei, sans-serif"
rounded:
  control: 4px
spacing:
  panel: 24px
---

Compact HR operational UI. Preserve the current four-column query area and white navigation.
Row operations occupy three stable slots: 变更, 补卡, 更多. The overflow menu contains 撤销, 撤回, 重新提交, plus 调整归属日期 for HR. Disabled actions remain visible.
Single-record adjustments use a 680px dialog: a three-item read-only time/duration summary and one two-column date row. Do not use disabled text boxes for the summary or leave an empty grid slot. Multiple overtime groups use an 880px dialog; repeated lines and import previews may scroll horizontally.
History shows business dates and values from each snapshot. Mobile dialogs scroll internally without expanding the viewport.
No additional field-level rule links, decorative blocks, or altered application layout.
