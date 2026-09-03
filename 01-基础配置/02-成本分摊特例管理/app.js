(function () {
  "use strict";

  const centers = ["tzl_cost", "wx_Allen_AICenter", "AI_center1", "AI_center2", "验收演示成本中心A", "验收演示成本中心B"];
  const modal = document.getElementById("exceptionModal");
  const rowsHost = document.getElementById("allocationRows");
  const nameInput = document.getElementById("exceptionName");
  const codeInput = document.getElementById("exceptionCode");
  const remarkInput = document.getElementById("exceptionRemark");
  const remarkCount = document.getElementById("remarkCount");
  const saveButton = document.getElementById("saveException");
  const deleteButton = document.getElementById("deleteAllocationRows");
  const selectAll = document.getElementById("selectAllAllocations");
  let editingRow = null;

  function optionMarkup(selected) {
    return ['<option value="">请选择</option>'].concat(centers.map(function (center) {
      return '<option value="' + center + '"' + (center === selected ? " selected" : "") + ">" + center + "</option>";
    })).join("");
  }

  function addRow(data) {
    const row = document.createElement("tr");
    row.innerHTML = '<td class="check-column"><input class="row-check" type="checkbox" aria-label="选择本行"></td>' +
      '<td class="sequence-column"></td>' +
      '<td><select class="center-select" aria-label="一级成本中心">' + optionMarkup(data && data.center) + '</select></td>' +
      '<td><div class="ratio-control"><input class="ratio-input" type="number" min="0.01" max="100" step="0.01" aria-label="分摊比例" value="' + ((data && data.ratio) || "") + '"><span>%</span></div></td>';
    rowsHost.appendChild(row);
    renumberRows();
    validateAllocation();
  }

  function renumberRows() {
    Array.from(rowsHost.rows).forEach(function (row, index) {
      row.cells[1].textContent = String(index + 1);
    });
  }

  function allocationData() {
    return Array.from(rowsHost.rows).map(function (row) {
      return {
        center: row.querySelector(".center-select").value,
        ratio: Number(row.querySelector(".ratio-input").value || 0)
      };
    });
  }

  function generatedName(data) {
    return data.map(function (item) { return item.center + "-" + item.ratio + "%"; }).join("&");
  }

  function formattedRule(data) {
    return data.map(function (item) { return item.center + ": " + item.ratio + "%"; }).join("; ");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function editIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"></path><path d="m13.5 6.5 4 4"></path></svg>';
  }

  function statusIcon(status) {
    if (status === "启用") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M6.4 6.4 17.6 17.6"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="m8.5 12 2.2 2.2 4.8-5"></path></svg>';
  }

  function operationMarkup(status) {
    const nextAction = status === "启用" ? "停用" : "启用";
    return '<div class="icon-actions"><button class="icon-action edit-exception" type="button" aria-label="编辑" title="编辑">' + editIcon() + '</button><button class="icon-action status-action" type="button" aria-label="' + nextAction + '" title="' + nextAction + '">' + statusIcon(status) + "</button></div>";
  }

  function setRowStatus(row, status) {
    row.dataset.status = status;
    row.cells[4].innerHTML = '<span class="status-tag ' + (status === "启用" ? "enabled" : "disabled") + '">' + status + "</span>";
    row.cells[7].innerHTML = operationMarkup(status);
  }

  function validateAllocation() {
    const data = allocationData();
    const total = data.reduce(function (sum, item) { return sum + item.ratio; }, 0);
    const complete = data.length >= 2 && data.every(function (item) { return item.center && item.ratio > 0 && item.ratio <= 100; });
    const unique = new Set(data.map(function (item) { return item.center; })).size === data.length;
    const valid = complete && unique && Math.abs(total - 100) < 0.001;

    nameInput.value = valid ? generatedName(data) : "";

    saveButton.disabled = !(valid && codeInput.value.trim());
  }

  function updateSelection() {
    const checks = Array.from(rowsHost.querySelectorAll(".row-check"));
    const selected = checks.filter(function (check) { return check.checked; });
    deleteButton.disabled = selected.length === 0;
    selectAll.checked = checks.length > 0 && selected.length === checks.length;
    selectAll.indeterminate = selected.length > 0 && selected.length < checks.length;
  }

  function nextCode() {
    const matches = Array.from(document.getElementById("definitionRows").rows).map(function (row) {
      return row.dataset.code.match(/^(FT\d{8})(\d{3})$/);
    }).filter(Boolean);
    const prefix = matches.length ? matches[0][1] : "FT20260903";
    const sequence = matches.reduce(function (max, match) {
      return match[1] === prefix ? Math.max(max, Number(match[2])) : max;
    }, 0) + 1;
    return prefix + String(sequence).padStart(3, "0");
  }

  function resetForm(data) {
    rowsHost.innerHTML = "";
    codeInput.value = (data && data.code) || nextCode();
    remarkInput.value = (data && data.remark) || "";
    remarkCount.textContent = String(remarkInput.value.length);
    nameInput.value = "";
    selectAll.checked = false;
    selectAll.indeterminate = false;
    (data && data.allocations ? data.allocations : [{ center: "tzl_cost", ratio: "" }, { center: "wx_Allen_AICenter", ratio: "" }]).forEach(addRow);
    updateSelection();
    validateAllocation();
  }

  function openModal(data, row) {
    editingRow = row || null;
    document.getElementById("modalTitle").textContent = row ? "编辑成本中心特例" : "新增成本中心特例";
    resetForm(data);
    modal.hidden = false;
    codeInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    editingRow = null;
  }

  function parseRule(rule) {
    return rule.split(";").map(function (part) {
      const match = part.trim().match(/^(.*):\s*([\d.]+)%$/);
      return match ? { center: match[1].trim(), ratio: match[2] } : null;
    }).filter(Boolean);
  }

  function showToast(text) {
    const toast = document.getElementById("toast");
    toast.textContent = text;
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }

  document.querySelectorAll(".page-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".page-tab").forEach(function (item) {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll(".tab-panel").forEach(function (panel) { panel.classList.remove("active"); });
      document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
    });
  });

  document.getElementById("addException").addEventListener("click", function () { openModal(); });
  document.querySelectorAll("[data-close]").forEach(function (button) { button.addEventListener("click", closeModal); });
  modal.addEventListener("click", function (event) { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !modal.hidden) closeModal(); });

  document.getElementById("addAllocationRow").addEventListener("click", function () { addRow(); });
  deleteButton.addEventListener("click", function () {
    const selected = Array.from(rowsHost.querySelectorAll(".row-check:checked"));
    if (rowsHost.rows.length - selected.length < 2) {
      showToast("分摊规则至少保留2行");
      return;
    }
    selected.forEach(function (check) { check.closest("tr").remove(); });
    renumberRows();
    updateSelection();
    validateAllocation();
  });

  selectAll.addEventListener("change", function () {
    rowsHost.querySelectorAll(".row-check").forEach(function (check) { check.checked = selectAll.checked; });
    updateSelection();
  });
  rowsHost.addEventListener("change", function (event) {
    if (event.target.matches(".row-check")) updateSelection();
    else validateAllocation();
  });
  rowsHost.addEventListener("input", validateAllocation);
  codeInput.addEventListener("input", validateAllocation);
  remarkInput.addEventListener("input", function () { remarkCount.textContent = String(remarkInput.value.length); });

  document.getElementById("definitionRows").addEventListener("click", function (event) {
    const statusTrigger = event.target.closest(".status-action");
    if (statusTrigger) {
      const statusRow = statusTrigger.closest("tr");
      const nextStatus = statusRow.dataset.status === "启用" ? "停用" : "启用";
      setRowStatus(statusRow, nextStatus);
      showToast("成本中心特例已" + nextStatus);
      return;
    }
    const editTrigger = event.target.closest(".edit-exception");
    if (!editTrigger) return;
    const row = editTrigger.closest("tr");
    openModal({ code: row.dataset.code, remark: row.dataset.remark || "", allocations: parseRule(row.dataset.rule) }, row);
  });

  saveButton.addEventListener("click", function () {
    validateAllocation();
    if (saveButton.disabled) return;
    const name = nameInput.value;
    const code = codeInput.value.trim();
    const rule = formattedRule(allocationData());
    const remark = remarkInput.value;
    const isEditing = Boolean(editingRow);
    if (isEditing) {
      editingRow.dataset.name = name;
      editingRow.dataset.code = code;
      editingRow.dataset.rule = rule;
      editingRow.dataset.remark = remark;
      editingRow.cells[1].querySelector(".name-text").textContent = name;
      editingRow.cells[2].textContent = code;
      editingRow.cells[3].textContent = rule;
    } else {
      const host = document.getElementById("definitionRows");
      const row = document.createElement("tr");
      row.dataset.name = name;
      row.dataset.code = code;
      row.dataset.rule = rule;
      row.dataset.remark = remark;
      row.dataset.status = "启用";
      row.innerHTML = '<td>' + (host.rows.length + 1) + '</td><td><span class="name-text">' + escapeHtml(name) + '</span></td><td>' + escapeHtml(code) + '</td><td class="rule-cell">' + escapeHtml(rule) + '</td><td class="status-cell"><span class="status-tag enabled">启用</span></td><td>黄东升</td><td>2026-09-03 10:20:00</td><td>' + operationMarkup("启用") + "</td>";
      host.appendChild(row);
      document.querySelector("#panel-definition .pagination span").textContent = "共 " + host.rows.length + " 条";
    }
    closeModal();
    showToast(isEditing ? "成本中心特例已更新" : "成本中心特例已新增");
  });

  function filterRows(host, query) {
    Array.from(host.rows).forEach(function (row) {
      row.hidden = query && !row.textContent.toLowerCase().includes(query.toLowerCase());
    });
  }
  function applyDefinitionFilters() {
    const name = document.getElementById("definitionNameQuery").value.trim().toLowerCase();
    const code = document.getElementById("definitionCodeQuery").value.trim().toLowerCase();
    const status = document.getElementById("definitionStatusQuery").value;
    Array.from(document.getElementById("definitionRows").rows).forEach(function (row) {
      const matchesName = !name || row.dataset.name.toLowerCase().includes(name);
      const matchesCode = !code || row.dataset.code.toLowerCase().includes(code);
      const matchesStatus = !status || row.dataset.status === status;
      row.hidden = !(matchesName && matchesCode && matchesStatus);
    });
  }
  document.getElementById("searchDefinition").addEventListener("click", applyDefinitionFilters);
  document.getElementById("resetDefinition").addEventListener("click", function () {
    document.getElementById("definitionNameQuery").value = "";
    document.getElementById("definitionCodeQuery").value = "";
    document.getElementById("definitionStatusQuery").value = "";
    applyDefinitionFilters();
  });
  document.getElementById("searchRecords").addEventListener("click", function () { filterRows(document.getElementById("recordRows"), document.getElementById("recordOrgQuery").value); });
  document.getElementById("resetRecords").addEventListener("click", function () { document.getElementById("recordOrgQuery").value = ""; filterRows(document.getElementById("recordRows"), ""); });
}());
