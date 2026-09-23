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
Row operations occupy three stable slots: 变更, 补卡, 更多. 补卡 acts on the overtime segment represented by the current row; its status and history are segment-scoped. The overflow menu contains 撤销, 撤回, 重新提交, plus 调整归属日期 for HR. Disabled actions remain visible.

Change pages preload the current effective segments and present only the resulting editable form. Users may add, delete, or modify segments; diff badges and comparison summaries are intentionally omitted.
Single-record adjustments use a 680px dialog: a three-item read-only time/duration summary and one two-column date row. Do not use disabled text boxes for the summary or leave an empty grid slot. Multiple overtime groups use an 880px dialog; repeated lines and import previews may scroll horizontally.
History shows business dates and values from each snapshot. Mobile dialogs scroll internally without expanding the viewport.
No additional field-level rule links, decorative blocks, or altered application layout.

Multi-segment applications expand to one list row per segment. Repeated application-level values and row actions are intentional; segment time, duration, actual time, and vesting date come from that row's segment.
Supplementary punch entry is grouped by overtime segment and repeats the last submitted segment values when opened again.
Change keeps the existing application form, enables segment add/delete/edit, and shows a compact difference summary before the change reason.
