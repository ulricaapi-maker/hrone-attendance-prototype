(function () {
  var unitHeaderNames = new Set([
    "年假可休额度",
    "病假可休额度",
    "调休假可休额度",
    "可休额度",
    "已休额度",
    "调整额度",
    "当年标准额度",
    "当年发放额度",
    "当年剩余额度",
    "结转额度",
    "结转剩余额度",
    "已失效额度",
    "已结算额度",
    "生成额度",
    "剩余额度",
    "已转加班费额度",
    "结算总额度",
    "结算额度",
    "可休总额度",
    "调休假转加班费总时长",
    "调休假转加班费时长",
    "扣减休息时长",
    "使用额度",
    "最终使用额度"
  ]);

  function unitizedHeader(text) {
    var clean = text.trim().replace(/\((?:小时|H|h)\)$/, "");
    if (unitHeaderNames.has(clean) || /^OT\s/.test(clean)) return clean + "（h）";
    return text.trim();
  }

  function normalizeTableUnits(root) {
    var scope = root || document;
    scope.querySelectorAll("table thead th").forEach(function (th) {
      th.textContent = unitizedHeader(th.textContent);
    });
    scope.querySelectorAll("table tbody td:not(.split-summary)").forEach(function (td) {
      var value = td.textContent.trim();
      var match = value.match(/^(-?\d+(?:\.\d+)?)\s*(?:小时|H|h)$/);
      if (!match) return;
      if (td.children.length === 0) {
        td.textContent = match[1];
      } else if (td.children.length === 1 && td.firstElementChild.textContent.trim() === value) {
        td.firstElementChild.textContent = match[1];
      }
    });
  }

  var commonDialog = document.getElementById("commonDialog");
  var baseOpenDialog = openDialog;
  openDialog = function (title, html) {
    commonDialog.classList.remove("quota-breakdown-mode");
    baseOpenDialog(title, html);
    normalizeTableUnits(document.getElementById("dialogBody"));
  };

  ["dialogClose", "dialogCancel", "dialogOk"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function () {
      commonDialog.classList.remove("quota-breakdown-mode");
    }, true);
  });
  commonDialog.addEventListener("click", function (event) {
    if (event.target === commonDialog) commonDialog.classList.remove("quota-breakdown-mode");
  });

  breakdownCell = function (total, kind, title, items) {
    var data = encodeURIComponent(JSON.stringify(items));
    return '<td class="breakdown-column breakdown-cell-hotspot" data-field="' + kind + '" data-breakdown-kind="' + kind + '" data-breakdown-title="' + title + '" data-breakdown-items="' + data + '"><span class="quota-breakdown-cell"><button type="button" class="breakdown-hotspot" aria-label="查看' + title + '"><span class="breakdown-total">' + total + '</span></button></span></td>';
  };

  function convertBreakdownCells() {
    document.querySelectorAll("#balance-detail [data-breakdown-items]").forEach(function (cell) {
      var total = cell.querySelector(".breakdown-total") ? cell.querySelector(".breakdown-total").textContent.trim() : "—";
      cell.classList.add("breakdown-cell-hotspot");
      cell.innerHTML = '<span class="quota-breakdown-cell"><button type="button" class="breakdown-hotspot" aria-label="查看' + cell.dataset.breakdownTitle + '"><span class="breakdown-total">' + total + '</span></button></span>';
    });
  }

  function openBreakdownDialog(cell) {
    var rows = JSON.parse(decodeURIComponent(cell.dataset.breakdownItems));
    var body = '<div class="table-wrap"><table class="quota-detail-table"><thead><tr><th>额度组成</th><th>额度（h）</th></tr></thead><tbody>';
    rows.forEach(function (row) {
      body += "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>";
    });
    body += "</tbody></table></div>";
    openDialog(cell.dataset.breakdownTitle, body);
    commonDialog.classList.add("quota-breakdown-mode");
  }

  document.addEventListener("click", function (event) {
    var hotspot = event.target.closest(".breakdown-hotspot");
    if (!hotspot) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openBreakdownDialog(hotspot.closest("[data-breakdown-items]"));
  }, true);

  twoColExtend = function (data) {
    var dateField = data.type === "年假"
      ? '<div class="dialog-field"><label class="required">结转有效期</label><input value="' + (data.carryValid === "—" ? "" : data.carryValid) + '" placeholder="请选择结转有效期"></div>'
      : '<div class="dialog-field"><label class="required">当年有效期</label><input value="' + (data.annualValid === "—" ? "" : data.annualValid) + '" placeholder="请选择当年有效期"></div>';
    return '<div class="dialog-form"><div class="dialog-field"><label>假期类型</label>' + readOnlyBox(data.type) + '</div><div class="dialog-field"><label>员工</label>' + readOnlyBox(data.employee) + '</div>' + dateField + '<div class="dialog-field full"><label class="required">调整原因</label><textarea placeholder="请输入调整原因"></textarea></div></div>';
  };

  function selectedBatchLeaveType() {
    var types = Array.from(new Set(selectedBalanceRows().map(function (row) {
      return row.dataset.rowType;
    })));
    if (types.length === 1) return types[0];
    var filter = document.getElementById("leaveType");
    return filter && filter.value !== "全部" ? filter.value : (types[0] || "年假");
  }

  twoColBatchExtend = function () {
    var type = selectedBatchLeaveType();
    var dateField = type === "年假"
      ? '<div class="dialog-field"><label class="required">结转有效期</label><input placeholder="请选择结转有效期"></div>'
      : '<div class="dialog-field"><label class="required">当年有效期</label><input placeholder="请选择当年有效期"></div>';
    return '<div class="dialog-form"><div class="dialog-field"><label>假期类型</label>' + readOnlyBox(type) + '</div>' + dateField + '<div class="dialog-field full"><label class="required">调整原因</label><textarea placeholder="请输入调整原因"></textarea></div></div>';
  };

  compExtendDialog = function () {
    return '<div class="dialog-form"><div class="dialog-field"><label>假期类型</label>' + readOnlyBox("调休假") + '</div><div class="dialog-field"><label>员工</label>' + readOnlyBox("张三｜zt000031") + '</div><div class="dialog-field"><label class="required">当年有效期</label><input placeholder="请选择当年有效期"></div><div class="dialog-field full"><label class="required">调整原因</label><textarea placeholder="请输入调整原因"></textarea></div></div>';
  };

  function usageRecordLinks(value) {
    return value.split("；").map(function (item) {
      return '<a class="text-link vacation-record" data-toast="已打开休假记录。">' + item + "</a>";
    }).join("；");
  }

  function rebuildUsageRows() {
    var usage = document.getElementById("balance-usage");
    if (!usage) return;
    var typeSelect = Array.from(usage.querySelectorAll("select")).find(function (select) {
      return Array.from(select.options).some(function (option) { return option.textContent.trim() === "年假"; });
    });
    if (typeSelect && !Array.from(typeSelect.options).some(function (option) { return option.textContent.trim() === "调休假"; })) {
      typeSelect.add(new Option("调休假", "调休假"));
    }
    var headers = Array.from(usage.querySelectorAll("thead th"));
    headers.forEach(function (th) {
      if (th.textContent.trim() === "已休额度") th.textContent = "已休额度（h）";
      if (["额度使用分摊", "额度使用明细"].includes(th.textContent.trim())) th.textContent = "使用明细";
    });
    var rows = [
      ["1", "张三", "zt000031", "运营组", "正式", "2024/03/01", "年假", "2026/08/10 09:00 - 2026/08/11 18:00", "16", "<div>2025｜结转额度｜8h</div><div>2026｜当年发放额度｜8h</div>", "原休假单：XJ202608001"],
      ["2", "李四", "zt000041", "财务部", "正式", "2023/06/12", "病假", "2026/08/13 09:00 - 2026/08/13 18:00", "8", "2026｜病假额度｜8h", "原休假单：XJ202608019"],
      ["3", "王五", "zt000087", "产品部", "试用", "2026/01/10", "年假", "2026/08/18 14:00 - 2026/08/18 18:00", "4", "2026｜当年发放额度｜4h", "原休假单：XJ202608025；变更单：BG202608003"],
      ["4", "赵六", "zt000102", "运营组", "正式", "2022/11/21", "年假", "2026/08/20 09:00 - 2026/08/20 18:00", "8", "2026｜当年发放额度｜8h", "原休假单：XJ202608033"],
      ["5", "孙七", "zt000126", "客服组", "正式", "2025/05/08", "调休假", "2026/08/22 09:00 - 2026/08/22 13:00", "4", "2026-07-12加班｜4h", "原休假单：XJ202608041"],
      ["6", "周八", "zt000138", "产品部", "正式", "2021/09/15", "年假", "2026/08/25 09:00 - 2026/08/26 13:00", "12", "<div>2025｜结转额度｜4h</div><div>2026｜当年发放额度｜8h</div>", "原休假单：XJ202608052"]
    ];
    var tbody = usage.querySelector("tbody");
    tbody.innerHTML = rows.map(function (row) {
      return '<tr data-usage-type="' + row[6] + '"><td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + '</td><td>' + row[3] + '</td><td>' + row[4] + '</td><td>' + row[5] + '</td><td>' + row[6] + '</td><td>' + row[7] + '</td><td class="metric-deducted">' + row[8] + '</td><td class="split-summary">' + row[9] + '</td><td>' + usageRecordLinks(row[10]) + '</td><td><a class="text-link split-action">查看使用明细</a></td></tr>';
    }).join("");
  }

  var selectedUsageDetailType = "年假";
  document.addEventListener("pointerdown", function (event) {
    var action = event.target.closest("#balance-usage .split-action");
    if (action) selectedUsageDetailType = action.closest("tr").dataset.usageType || "年假";
  }, true);

  openSplitTableDialog = function () {
    var usageType = selectedUsageDetailType;
    var body;
    if (usageType === "调休假") {
      body = '<div class="table-wrap split-table"><table><thead><tr><th>休假日期</th><th>休假时段</th><th>扣减休息时长（h）</th><th>加班日期</th><th>额度有效期</th><th>使用额度（h）</th></tr></thead><tbody><tr><td>2026/08/22</td><td>09:00-13:00</td><td>4</td><td>2026/07/12</td><td>2027/01/31</td><td>4</td></tr></tbody></table></div>';
    } else {
      body = '<div class="table-wrap split-table"><table><thead><tr><th>休假日期</th><th>休假时段</th><th>扣减休息时长（h）</th><th>年度</th><th>额度组成</th><th>额度有效期</th><th>使用额度（h）</th></tr></thead><tbody><tr><td>2026/08/10</td><td>09:00-18:00</td><td>8</td><td>2025</td><td>结转额度</td><td>2026/03/31</td><td>8</td></tr><tr><td>2026/08/11</td><td>09:00-18:00</td><td>8</td><td>2026</td><td>当年发放额度</td><td>2026/12/31</td><td>8</td></tr></tbody></table></div>';
    }
    openDialog("使用明细", body);
    commonDialog.classList.add("split-mode");
  };

  rebuildUsageRows();
  convertBreakdownCells();
  normalizeTableUnits(document);
})();

(function () {
  var dialogElement = document.getElementById("commonDialog");
  var dialogBodyElement = document.getElementById("dialogBody");
  var dialogOkButton = document.getElementById("dialogOk");
  var dialogCancelButton = document.getElementById("dialogCancel");
  var pendingSettlementConfirm = null;

  function clean(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function readonlyField(label, value, attrs) {
    return '<div class="dialog-field"><label>' + label + '</label><input ' + (attrs || "") + ' value="' + value + '" disabled></div>';
  }

  function requiredSelect(label, field, options, value) {
    return '<div class="dialog-field"><label class="required">' + label + '</label><select data-required data-field="' + field + '">' + options.map(function (option) {
      var optionValue = typeof option === "string" ? option : option[0];
      var optionLabel = typeof option === "string" ? option : option[1];
      return '<option value="' + optionValue + '"' + (value === optionValue ? " selected" : "") + '>' + optionLabel + '</option>';
    }).join("") + '</select></div>';
  }

  function scopeField(name, targetField, targetLabel, employeePlaceholder) {
    return '<div class="dialog-field full settlement-scope-field"><label>结算范围</label><div class="settlement-radio-group">' +
      '<label><input type="radio" name="' + name + '" value="employee" checked> 员工</label>' +
      '<label><input type="radio" name="' + name + '" value="organization"> 组织</label>' +
      '</div></div>' +
      '<div class="dialog-field full settlement-target-field" data-target-field="' + targetField + '"><label>' + targetLabel + '</label><input placeholder="' + employeePlaceholder + '"></div>';
  }

  function resetSettlementDialog() {
    pendingSettlementConfirm = null;
    dialogElement.classList.remove("quota-breakdown-mode", "split-mode", "settlement-readonly-mode", "settlement-confirm-mode", "settlement-success-mode");
    dialogElement.classList.add("settlement-dialog-mode");
    dialogOkButton.style.display = "inline-flex";
    dialogCancelButton.style.display = "inline-flex";
    dialogOkButton.textContent = "确定";
    dialogCancelButton.textContent = "取消";
  }

  function openSettlementDialog(title, body, options) {
    resetSettlementDialog();
    openDialog(title, body);
    var settings = options || {};
    if (settings.readonly) {
      dialogElement.classList.add("settlement-readonly-mode");
      dialogOkButton.style.display = "none";
      dialogCancelButton.textContent = "关闭";
    }
    if (settings.confirm) dialogElement.classList.add("settlement-confirm-mode");
    if (settings.okLabel) dialogOkButton.textContent = settings.okLabel;
    pendingSettlementConfirm = settings.onConfirm || null;
  }

  function openSettlementSuccess() {
    openSettlementDialog("操作成功", '<div class="settlement-result"><span class="settlement-result-icon">✓</span><div><strong>结算任务已提交</strong><p>处理完成后系统将向您发送消息，请稍后前往“消息中心”查看结果。</p></div></div>', { readonly: true });
    dialogElement.classList.add("settlement-success-mode");
    dialogCancelButton.textContent = "知道了";
  }

  function clearFieldErrors() {
    dialogBodyElement.querySelectorAll(".field-error-message").forEach(function (item) { item.remove(); });
    dialogBodyElement.querySelectorAll(".field-error").forEach(function (item) { item.classList.remove("field-error"); });
  }

  function validateRequiredFields() {
    clearFieldErrors();
    var firstInvalid = null;
    dialogBodyElement.querySelectorAll("[data-required]").forEach(function (control) {
      if (clean(control.value)) return;
      control.classList.add("field-error");
      var message = document.createElement("span");
      message.className = "field-error-message";
      message.textContent = "必填项不能为空";
      control.parentNode.appendChild(message);
      if (!firstInvalid) firstInvalid = control;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function bindScopeSwitch(radioName) {
    dialogBodyElement.querySelectorAll('input[name="' + radioName + '"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        var target = dialogBodyElement.querySelector(".settlement-target-field");
        if (!target) return;
        var organization = radio.value === "organization";
        target.querySelector("label").textContent = organization ? "组织" : "员工";
        target.querySelector("input").placeholder = organization ? "请选择组织" : "请输入姓名或工号";
      });
    });
  }

  function selectedRows(pageId) {
    return Array.from(document.querySelectorAll("#" + pageId + " tbody tr")).filter(function (row) {
      var checkbox = row.querySelector('input[type="checkbox"]');
      return checkbox && checkbox.checked;
    });
  }

  function annualOverdueDialog() {
    var body = '<div class="dialog-form settlement-form">' +
      requiredSelect("年度", "annual-years", [["2025,2026", "2025 - 2026"], ["2026", "2026"], ["2025", "2025"]], "2025,2026") +
      requiredSelect("划分区域", "divide-area", [["", "请选择"], ["FBU-美东区", "FBU-美东区"]], "") +
      '<div class="dialog-field"><label class="required">结算额度所属日期</label><input type="date" data-required data-field="settlement-belong-date" value="2026-08-31"></div>' +
      scopeField("annual-settlement-scope", "annual-target", "员工", "请输入姓名或工号，不填则按区域处理") +
      '</div>';
    openSettlementDialog("过期结算", body, {
      onConfirm: function () {
        if (!validateRequiredFields()) return false;
        openSettlementSuccess();
        return true;
      }
    });
    bindScopeSwitch("annual-settlement-scope");
  }

  function annualDimissionDialog() {
    var body = '<div class="dialog-form settlement-form">' +
      requiredSelect("划分区域", "divide-area", [["", "请选择"], ["FBU-美东区", "FBU-美东区"]], "") +
      readonlyField("结算额度所属日期", "系统自动取离职日期", 'data-field="settlement-belong-date"') +
      scopeField("annual-dimission-scope", "annual-dimission-target", "员工", "请输入姓名或工号，不填则按区域处理") +
      '</div>';
    openSettlementDialog("离职结算", body, {
      onConfirm: function () {
        if (!validateRequiredFields()) return false;
        openSettlementSuccess();
        return true;
      }
    });
    bindScopeSwitch("annual-dimission-scope");
  }

  function annualCancelDialog() {
    var rows = selectedRows("annual-settle-summary");
    if (!rows.length) {
      showToast("请先勾选数据");
      return;
    }
    var body = '<div class="settlement-confirm-content"><div class="settlement-warning-icon">!</div><div><strong>确认撤销已选 ' + rows.length + ' 条年假结算记录吗？</strong><p>撤销后，系统将重新计算可休额度。已封存的考勤日或员工已重新入职时，对应记录不执行撤销。</p></div></div>';
    openSettlementDialog("撤销年假结算", body, { confirm: true, okLabel: "确认撤销", onConfirm: openSettlementSuccess });
  }

  function compBalanceDialog() {
    var body = '<div class="dialog-form settlement-form">' +
      requiredSelect("考勤周期", "attendance-cycle", [["", "请选择"], ["2026月度周期", "2026月度周期"]], "") +
      requiredSelect("考勤时间段", "attendance-cycle-detail", [["", "请选择"], ["2026/07/01 - 2026/07/31", "2026/07/01 - 2026/07/31"]], "") +
      scopeField("comp-settlement-scope", "comp-target", "员工", "请输入姓名或工号，不填则处理周期内全部人员") +
      '</div>';
    openSettlementDialog("余额结算", body, {
      onConfirm: function () {
        if (!validateRequiredFields()) return false;
        openSettlementSuccess();
        return true;
      }
    });
    bindScopeSwitch("comp-settlement-scope");
  }

  function compDimissionDialog() {
    var body = '<div class="dialog-form settlement-form"><div class="dialog-field full"><label class="required">员工</label><input data-required data-field="employee" placeholder="请选择已离职且有最后工作日的员工"></div></div>';
    openSettlementDialog("离职结算", body, {
      onConfirm: function () {
        if (!validateRequiredFields()) return false;
        openSettlementSuccess();
        return true;
      }
    });
  }

  function compCancelDialog() {
    var rows = selectedRows("comp-settle-summary");
    if (!rows.length) {
      showToast("请至少选择一条数据");
      return;
    }
    var body = '<div class="settlement-confirm-content"><div class="settlement-warning-icon">!</div><div><strong>确认撤销可处理的调休假结算吗？</strong><p>系统已校验所选记录，将自动排除已撤销或考勤周期已封存的数据。</p></div></div>' +
      '<div class="settlement-verify-grid"><div><span>选中数量</span><strong>' + rows.length + '</strong></div><div><span>可撤销</span><strong>' + rows.length + '</strong></div><div><span>已撤销</span><strong>0</strong></div><div><span>已封存</span><strong>0</strong></div></div>';
    openSettlementDialog("撤销调休假结算", body, { confirm: true, okLabel: "确认撤销", onConfirm: openSettlementSuccess });
  }

  function settlementLogDialog(type) {
    var body = '<div class="settlement-log-query"><label>操作时间</label><input placeholder="请选择日期范围"><label>操作人</label><input placeholder="请输入姓名或工号"><button class="btn primary">查询</button><button class="btn">重置</button></div>' +
      '<div class="table-wrap settlement-log-table"><table><thead><tr><th>操作类型</th><th>操作人</th><th>操作时间</th></tr></thead><tbody><tr><td>' + (type === "年假" ? "过期结算" : "余额结算") + '</td><td>admin</td><td>2026/08/31 10:26:18</td></tr></tbody></table></div>';
    openSettlementDialog(type + "结算日志", body, { readonly: true });
    var logButtons = dialogBodyElement.querySelectorAll(".settlement-log-query .btn");
    logButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (clean(button.textContent) === "重置") {
          dialogBodyElement.querySelectorAll(".settlement-log-query input").forEach(function (input) { input.value = ""; });
          return;
        }
        showToast("已按当前条件查询结算日志");
      });
    });
  }

  function searchControl(pageId, labelText) {
    var item = Array.from(document.querySelectorAll("#" + pageId + " .search-item")).find(function (searchItem) {
      var label = searchItem.querySelector("label");
      return label && clean(label.textContent) === labelText;
    });
    return item ? item.querySelector("input,select") : null;
  }

  function setControlValue(control, value) {
    if (!control) return;
    if (control.tagName === "SELECT" && !Array.from(control.options).some(function (option) { return option.value === value; })) {
      control.add(new Option(value, value));
    }
    control.value = value;
  }

  function headerValue(row, headerText) {
    var table = row.closest("table");
    var headers = Array.from(table.querySelectorAll("thead th")).map(function (header) { return clean(header.textContent); });
    var index = headers.indexOf(headerText);
    return index > -1 && row.children[index] ? clean(row.children[index].textContent) : "";
  }

  function drillSettlementDetail(link) {
    var pageType = link.dataset.settlePage;
    var row = link.closest("tr");
    if (!row) return;
    if (pageType === "annual") {
      setControlValue(searchControl("page-annual-settlement", "员工"), headerValue(row, "姓名"));
      setControlValue(searchControl("page-annual-settlement", "结算类型"), headerValue(row, "结算类型"));
      setControlValue(searchControl("page-annual-settlement", "结算额度所属日期"), headerValue(row, "结算额度所属日期"));
      showSettle("annual", "detail");
      return;
    }
    setControlValue(searchControl("page-comp-settlement", "员工"), headerValue(row, "姓名"));
    var start = headerValue(row, "周期开始日期");
    var end = headerValue(row, "周期结束日期");
    setControlValue(searchControl("page-comp-settlement", "考勤日期"), start && end ? start + " - " + end : "");
    showSettle("comp", "detail");
  }

  function sickDimissionDialog() {
    var rows = selectedRows("page-sick-settlement");
    if (!rows.length) {
      showToast("请先勾选数据");
      return;
    }
    var hasPending = rows.some(function (row) { return row.dataset.hasPendingApply === "true"; });
    var warning = hasPending
      ? '<div class="settlement-alert"><strong>存在审批中的病假或销假单</strong><p>这些单据审批完成后可能继续扣减或恢复病假额度。如果现在结算，结算额度可能不是最终结果，建议先处理完这些单据。</p></div>'
      : "";
    var body = warning + '<div class="settlement-confirm-summary"><span>已选记录</span><strong>' + rows.length + ' 条</strong></div><p class="settlement-confirm-note">系统将按员工所属病假方案执行离职结算，结算额度所属日期取员工离职日期。</p>';
    openSettlementDialog("病假离职结算确认", body, { confirm: true, okLabel: hasPending ? "仍要结算" : "确认结算", onConfirm: openSettlementSuccess });
    if (hasPending) dialogCancelButton.textContent = "暂不结算";
  }

  function sickCancelDialog() {
    var rows = selectedRows("page-sick-settlement");
    if (!rows.length) {
      showToast("请先勾选数据");
      return;
    }
    var body = '<div class="settlement-confirm-content"><div class="settlement-warning-icon">!</div><div><strong>确认撤销已选 ' + rows.length + ' 条病假结算记录吗？</strong><p>撤销后，系统将清除结算标记和所属日期，并按年度汇总重新计算、恢复可休额度。结算所属考勤周期已封存时不执行撤销。</p></div></div>';
    openSettlementDialog("撤销病假结算", body, { confirm: true, okLabel: "确认撤销", onConfirm: openSettlementSuccess });
  }

  function actionButton(pageId, text) {
    return Array.from(document.querySelectorAll("#" + pageId + " .toolbar .btn")).find(function (button) {
      return clean(button.textContent) === text;
    });
  }

  var settlementPageConfigs = {
    "page-annual-settlement": {
      title: "年假结算",
      exportFields: ["姓名", "工号", "划分区域", "部门", "人员状态", "入职日期", "离职日期", "结算总额度", "结算额度所属日期", "结算类型", "数据状态", "操作人", "操作时间"]
    },
    "page-sick-settlement": {
      title: "病假结算",
      exportFields: ["姓名", "工号", "划分区域", "部门", "人员状态", "入职日期", "离职日期", "可休额度（h）", "是否结算", "结算额度（h）", "结算额度所属日期", "最近操作人", "最近操作时间"]
    },
    "page-comp-settlement": {
      title: "调休假结算",
      exportFields: ["姓名", "工号", "划分区域", "部门", "人员状态", "考勤周期", "周期开始日期", "周期结束日期", "可休总额度（h）", "调休假转加班费总时长（h）", "结算类型", "计算状态", "计算人", "计算时间", "数据状态"]
    }
  };

  function settlementPageFrom(target) {
    var page = target.closest("#page-annual-settlement, #page-sick-settlement, #page-comp-settlement");
    return page && settlementPageConfigs[page.id] ? page : null;
  }

  function resetSettlementSearch(page) {
    page.querySelectorAll(".search-bar input").forEach(function (input) { input.value = ""; });
    page.querySelectorAll(".search-bar select").forEach(function (select) { select.selectedIndex = 0; });
  }

  function openSettlementExportSetting(config) {
    var body = '<div class="settlement-export-fields">' + config.exportFields.map(function (field) {
      return '<label><input type="checkbox" checked> <span>' + field + '</span></label>';
    }).join("") + '</div>';
    openSettlementDialog(config.title + "导出设置", body, {
      okLabel: "保存",
      onConfirm: function () {
        showToast("导出字段设置已保存");
        closeDialog();
        return true;
      }
    });
  }

  function removeSickLegacyActions() {
    var table = document.querySelector("#page-sick-settlement table");
    if (!table) return;
    var headers = Array.from(table.querySelectorAll("thead th"));
    var operationIndex = headers.findIndex(function (header) { return clean(header.textContent) === "操作"; });
    if (operationIndex < 0) return;
    headers[operationIndex].remove();
    table.querySelectorAll("tbody tr").forEach(function (row) {
      if (row.children[operationIndex]) row.children[operationIndex].remove();
    });
    table.style.minWidth = "1460px";
  }

  function tagSettlementActions() {
    var annualActions = { "过期结算": "annual-overdue", "离职结算": "annual-dimission", "撤销结算": "annual-cancel" };
    Object.keys(annualActions).forEach(function (text) {
      var button = actionButton("page-annual-settlement", text);
      if (button) button.dataset.settlementAction = annualActions[text];
    });
    var compActions = { "余额结算": "comp-balance", "离职结算": "comp-dimission", "撤销结算": "comp-cancel" };
    Object.keys(compActions).forEach(function (text) {
      var button = actionButton("page-comp-settlement", text);
      if (button) button.dataset.settlementAction = compActions[text];
    });
    var sickActions = { "离职结算": "sick-dimission", "撤销结算": "sick-cancel" };
    Object.keys(sickActions).forEach(function (text) {
      var button = actionButton("page-sick-settlement", text);
      if (button) button.dataset.settlementAction = sickActions[text];
    });
    document.querySelectorAll("#annual-settle-summary .row-actions a").forEach(function (link) {
      if (clean(link.textContent) === "日志") {
        link.classList.add("settlement-log-action");
        link.dataset.settlementLog = "annual";
      }
    });
    document.querySelectorAll("#comp-settle-summary .row-actions a").forEach(function (link) {
      if (clean(link.textContent) === "日志") {
        link.classList.add("settlement-log-action");
        link.dataset.settlementLog = "comp";
      }
    });
    var sickSampleRow = document.querySelector("#page-sick-settlement tbody tr");
    if (sickSampleRow) sickSampleRow.dataset.hasPendingApply = "true";
  }

  var handlers = {
    "annual-overdue": annualOverdueDialog,
    "annual-dimission": annualDimissionDialog,
    "annual-cancel": annualCancelDialog,
    "comp-balance": compBalanceDialog,
    "comp-dimission": compDimissionDialog,
    "comp-cancel": compCancelDialog,
    "sick-dimission": sickDimissionDialog,
    "sick-cancel": sickCancelDialog
  };

  document.addEventListener("click", function (event) {
    var settlementPage = settlementPageFrom(event.target);
    if (settlementPage) {
      var config = settlementPageConfigs[settlementPage.id];
      var searchButton = event.target.closest(".search-actions .btn");
      if (searchButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (clean(searchButton.textContent) === "重置") {
          resetSettlementSearch(settlementPage);
          showToast("查询条件已重置");
        } else {
          showToast("已按当前条件查询" + config.title);
        }
        return;
      }
      var toolbarButton = event.target.closest(".toolbar .btn");
      if (toolbarButton && clean(toolbarButton.textContent) === "导出设置") {
        event.preventDefault();
        event.stopImmediatePropagation();
        openSettlementExportSetting(config);
        return;
      }
      if (toolbarButton && toolbarButton.classList.contains("export-btn")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showToast(config.title + "导出任务已提交");
        return;
      }
    }
    var action = event.target.closest("[data-settlement-action]");
    if (action) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handlers[action.dataset.settlementAction]();
      return;
    }
    var logAction = event.target.closest(".settlement-log-action");
    if (logAction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      settlementLogDialog(logAction.dataset.settlementLog === "annual" ? "年假" : "调休假");
      return;
    }
    var drillAction = event.target.closest(".settle-drill[data-settle-page]");
    if (drillAction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      drillSettlementDetail(drillAction);
    }
  }, true);

  document.addEventListener("click", function (event) {
    if (event.target !== dialogOkButton || !dialogElement.classList.contains("settlement-dialog-mode")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pendingSettlementConfirm) pendingSettlementConfirm();
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && dialogElement.classList.contains("open") && dialogElement.classList.contains("settlement-dialog-mode")) {
      closeDialog();
    }
  });

  removeSickLegacyActions();
  tagSettlementActions();
})();

(function () {
  var queryKeyByLabel = {
    "划分区域": "area",
    "部门": "department",
    "员工": "employee",
    "人员状态": "employee-status",
    "假期类型": "leave-type",
    "年度": "year",
    "休假日期": "leave-date"
  };
  var currentEmployee = {
    area: "FBU-美东区",
    department: "运营组",
    employee: "张三",
    status: "正式"
  };
  var audienceConfigs = {
    team: { pageTitle: "团队假期余额" },
    my: { pageTitle: "我的假期余额" }
  };

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function tableHeaders(panel) {
    return Array.from(panel.querySelectorAll("thead th")).map(function (th) {
      return cleanText(th.textContent);
    });
  }

  function cellText(row, headers, name) {
    var index = headers.indexOf(name);
    return index > -1 && row.children[index] ? cleanText(row.children[index].textContent) : "";
  }

  function annotateRows(panel, kind) {
    var headers = tableHeaders(panel);
    panel.querySelectorAll("tbody tr").forEach(function (row) {
      row.dataset.employee = cellText(row, headers, kind === "summary" ? "员工" : "姓名");
      row.dataset.employeeCode = cellText(row, headers, "工号");
      row.dataset.department = cellText(row, headers, "部门");
      row.dataset.employeeStatus = cellText(row, headers, "人员状态");
      row.dataset.leaveType = kind === "summary" ? "" : cellText(row, headers, "假期类型");
      row.dataset.year = cellText(row, headers, "年度");
      row.dataset.available = cellText(row, headers, "可休额度（h）") || cellText(row, headers, "可休额度");
      row.dataset.leavePeriod = cellText(row, headers, "休假时段");
    });
  }

  function removeColumns(panel, names) {
    var headers = tableHeaders(panel);
    var indexes = [];
    headers.forEach(function (header, index) {
      if (names.includes(header)) indexes.push(index);
    });
    indexes.sort(function (a, b) { return b - a; }).forEach(function (index) {
      panel.querySelectorAll("table tr").forEach(function (row) {
        if (row.children[index]) row.children[index].remove();
      });
    });
  }

  function replaceToolbar(panel) {
    var toolbar = panel.querySelector(".card-header .toolbar");
    if (!toolbar) return;
    toolbar.innerHTML = '<button type="button" class="btn small audience-export">导出</button><button type="button" class="btn small audience-export-setting">导出设置</button>';
  }

  function selectValue(control, value) {
    if (!control) return;
    if (control.tagName === "SELECT") {
      var option = Array.from(control.options).find(function (item) {
        return item.value === value || cleanText(item.textContent) === value;
      });
      if (!option) control.add(new Option(value, value));
      control.value = value;
    } else {
      control.value = value;
    }
  }

  function configureQueries(panel, scope, kind) {
    panel.querySelectorAll(".search-item").forEach(function (item) {
      var label = item.querySelector("label");
      var control = item.querySelector("input,select");
      if (!label || !control) return;
      var key = queryKeyByLabel[cleanText(label.textContent)];
      if (!key) return;
      control.dataset.queryKey = key;
      var defaultValues = {
        area: "全部区域",
        department: "全部部门",
        employee: "",
        "employee-status": "全部",
        "leave-type": "全部",
        year: "全部年度",
        "leave-date": ""
      };
      selectValue(control, defaultValues[key]);
      if (scope === "my" && ["area", "department", "employee", "employee-status"].includes(key)) {
        var fixedValue = key === "employee-status" ? currentEmployee.status : currentEmployee[key];
        selectValue(control, fixedValue);
        control.disabled = true;
        item.classList.add("audience-fixed-query");
      }
      control.dataset.defaultValue = control.value;
    });

    if (scope === "my" && kind === "detail") {
      var actions = panel.querySelector(".search-actions");
      var statusItem = document.createElement("div");
      statusItem.className = "search-item audience-balance-status";
      statusItem.innerHTML = '<label>余额状态</label><select data-query-key="balance-status" data-default-value="有可休额度"><option value="有可休额度">有可休额度</option><option value="全部">全部</option></select>';
      actions.parentNode.insertBefore(statusItem, actions);
    }
  }

  function prepareSummaryDrills(panel) {
    var headers = tableHeaders(panel);
    var leaveTypeByHeader = {
      "年假可休额度（h）": "年假",
      "病假可休额度（h）": "病假",
      "调休假可休额度（h）": "调休假"
    };
    Object.keys(leaveTypeByHeader).forEach(function (header) {
      var index = headers.indexOf(header);
      if (index < 0) return;
      panel.querySelectorAll("tbody tr").forEach(function (row) {
        var link = row.children[index] && row.children[index].querySelector("a");
        if (!link) return;
        link.classList.remove("quota-link");
        link.classList.add("audience-summary-quota-link");
        link.removeAttribute("data-open-balance");
        link.removeAttribute("data-open-page");
        link.dataset.audienceDrill = "detail";
        link.dataset.leaveType = leaveTypeByHeader[header];
      });
    });
  }

  function prepareDetailDrills(panel) {
    panel.querySelectorAll(".used-quota-link").forEach(function (link) {
      link.classList.remove("used-quota-link");
      link.classList.add("audience-used-quota-link");
    });
  }

  function prepareUsageActions(panel) {
    panel.querySelectorAll(".split-action").forEach(function (link) {
      link.classList.remove("split-action");
      link.classList.add("audience-split-action");
    });
  }

  function cloneAudiencePanel(scope, kind) {
    var source = document.getElementById("balance-" + kind);
    var panel = source.cloneNode(true);
    panel.id = scope + "-balance-" + kind;
    panel.className = "view-panel audience-panel audience-" + kind;
    panel.dataset.audienceScope = scope;
    panel.dataset.audienceKind = kind;
    panel.querySelectorAll("[id]").forEach(function (item) { item.removeAttribute("id"); });
    annotateRows(panel, kind);
    replaceToolbar(panel);
    if (scope === "my" && kind === "usage") {
      var searchBar = panel.querySelector(".search-bar");
      var areaItem = document.createElement("div");
      areaItem.className = "search-item";
      areaItem.innerHTML = '<label>划分区域</label><select><option>全部区域</option><option>FBU-美东区</option></select>';
      searchBar.insertBefore(areaItem, searchBar.firstElementChild);
    }
    configureQueries(panel, scope, kind);

    if (kind === "summary") {
      prepareSummaryDrills(panel);
      removeColumns(panel, ["假期方案"]);
    }
    if (kind === "detail") {
      prepareDetailDrills(panel);
      removeColumns(panel, ["", "操作", "假期方案", "计算时间", "当年标准额度（h）", "已失效额度（h）", "已结算额度（h）"]);
      panel.querySelector("table").style.minWidth = "";
    }
    if (kind === "usage") {
      prepareUsageActions(panel);
      panel.querySelector("table").style.minWidth = "";
    }

    if (scope === "my") {
      panel.querySelectorAll("tbody tr").forEach(function (row) {
        if (row.dataset.employee !== currentEmployee.employee) row.remove();
      });
      if (kind === "summary") removeColumns(panel, ["序号", "员工", "工号", "部门", "人员状态"]);
      if (kind === "detail") removeColumns(panel, ["姓名", "工号", "部门", "人员状态"]);
      if (kind === "usage") removeColumns(panel, ["姓名", "工号", "部门", "人员状态"]);
    }
    return panel;
  }

  function panelFor(scope, kind) {
    return document.getElementById(scope + "-balance-" + kind);
  }

  function myBalanceCardMarkup() {
    var source = document.getElementById("balance-summary");
    var headers = source ? tableHeaders(source) : [];
    var row = source ? Array.from(source.querySelectorAll("tbody tr")).find(function (item) {
      return cellText(item, headers, "员工") === currentEmployee.employee;
    }) : null;
    var cardConfigs = [
      { type: "年假", headers: ["年假可休额度（h）", "年假可休额度"], expiry: "2026-03-31" },
      { type: "病假", headers: ["病假可休额度（h）", "病假可休额度"], expiry: "2026-12-31" },
      { type: "调休假", headers: ["调休假可休额度（h）", "调休假可休额度"], expiry: "2026-12-31" }
    ];
    return '<div class="my-balance-cards" aria-label="我的假期剩余额度">' + cardConfigs.map(function (config) {
      var value = "—";
      config.headers.some(function (header) {
        var text = row ? cellText(row, headers, header) : "";
        if (!text) return false;
        var matched = text.match(/-?\d+(?:\.\d+)?/);
        value = matched ? matched[0] + "h" : "—";
        return true;
      });
      return '<button type="button" class="my-balance-card" data-leave-type="' + config.type + '" aria-pressed="false"><span class="my-balance-card-main"><span class="my-balance-card-type">' + config.type + '</span><strong class="my-balance-card-value">' + value + '</strong></span><span class="my-balance-card-expiry"><span>最近到期</span><strong>' + config.expiry + '</strong></span></button>';
    }).join("") + '</div>';
  }

  function syncMyBalanceCards(page, leaveType) {
    if (!page) return;
    page.querySelectorAll(".my-balance-card").forEach(function (card) {
      var active = card.dataset.leaveType === leaveType;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function switchAudienceTab(scope, kind) {
    var page = document.getElementById("page-" + scope + "-balance");
    page.querySelectorAll(".audience-balance-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.audienceTab === kind);
    });
    page.querySelectorAll(".audience-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.dataset.audienceKind === kind);
    });
  }

  function queryValue(panel, key) {
    var control = panel.querySelector('[data-query-key="' + key + '"]');
    return control ? cleanText(control.value) : "";
  }

  function isAllValue(value) {
    return !value || value === "全部" || value === "全部区域" || value === "全部部门" || value === "全部年度";
  }

  function applyAudienceFilters(panel) {
    var employee = queryValue(panel, "employee").toLowerCase();
    var department = queryValue(panel, "department");
    var status = queryValue(panel, "employee-status");
    var leaveType = queryValue(panel, "leave-type");
    var year = queryValue(panel, "year");
    var leaveDate = queryValue(panel, "leave-date");
    var balanceStatus = queryValue(panel, "balance-status");
    var personalScope = panel.dataset.audienceScope === "my";
    var visible = 0;
    panel.querySelectorAll("tbody tr").forEach(function (row) {
      var employeeMatch = personalScope || !employee || (row.dataset.employee + " " + row.dataset.employeeCode).toLowerCase().includes(employee);
      var departmentMatch = personalScope || isAllValue(department) || row.dataset.department === department;
      var statusMatch = personalScope || isAllValue(status) || row.dataset.employeeStatus === status;
      var typeMatch = isAllValue(leaveType) || row.dataset.leaveType === leaveType;
      var yearMatch = isAllValue(year) || row.dataset.year === year;
      var dateMatch = !leaveDate || row.dataset.leavePeriod.includes(leaveDate);
      var availableMatch = balanceStatus !== "有可休额度" || Number(row.dataset.available) > 0;
      var show = employeeMatch && departmentMatch && statusMatch && typeMatch && yearMatch && dateMatch && availableMatch;
      row.hidden = !show;
      if (show) visible += 1;
    });
    var total = panel.querySelector(".pagination > span");
    if (total) total.textContent = "共 " + visible + " 条记录，第 1/1 页";
  }

  function resetAudienceFilters(panel) {
    panel.querySelectorAll("[data-query-key]").forEach(function (control) {
      selectValue(control, control.dataset.defaultValue || "");
    });
    applyAudienceFilters(panel);
  }

  function setAudienceQuery(panel, key, value) {
    var control = panel.querySelector('[data-query-key="' + key + '"]');
    if (control) selectValue(control, value);
  }

  function openAudienceUsageDetail(type) {
    var body;
    if (type === "调休假") {
      body = '<div class="table-wrap split-table"><table><thead><tr><th>休假日期</th><th>休假时段</th><th>扣减休息时长（h）</th><th>加班日期</th><th>额度有效期</th><th>使用额度（h）</th></tr></thead><tbody><tr><td>2026/08/22</td><td>09:00-13:00</td><td>4</td><td>2026/07/12</td><td>2027/01/31</td><td>4</td></tr></tbody></table></div>';
    } else {
      body = '<div class="table-wrap split-table"><table><thead><tr><th>休假日期</th><th>休假时段</th><th>扣减休息时长（h）</th><th>年度</th><th>额度组成</th><th>额度有效期</th><th>使用额度（h）</th></tr></thead><tbody><tr><td>2026/08/10</td><td>09:00-18:00</td><td>8</td><td>2025</td><td>结转额度</td><td>2026/03/31</td><td>8</td></tr><tr><td>2026/08/11</td><td>09:00-18:00</td><td>8</td><td>2026</td><td>当年发放额度</td><td>2026/12/31</td><td>8</td></tr></tbody></table></div>';
    }
    openDialog("使用明细", body);
    document.getElementById("commonDialog").classList.add("split-mode");
  }

  function bindAudiencePage(scope) {
    var page = document.getElementById("page-" + scope + "-balance");
    page.addEventListener("click", function (event) {
      var balanceCard = event.target.closest(".my-balance-card");
      if (scope === "my" && balanceCard) {
        var myDetail = panelFor("my", "detail");
        var leaveType = balanceCard.dataset.leaveType;
        setAudienceQuery(myDetail, "leave-type", leaveType);
        switchAudienceTab("my", "detail");
        applyAudienceFilters(myDetail);
        syncMyBalanceCards(page, leaveType);
        return;
      }
      var tab = event.target.closest(".audience-balance-tab");
      if (tab) {
        switchAudienceTab(scope, tab.dataset.audienceTab);
        return;
      }
      var queryButton = event.target.closest(".search-actions .btn");
      if (queryButton) {
        var queryPanel = queryButton.closest(".audience-panel");
        if (queryButton.classList.contains("primary")) applyAudienceFilters(queryPanel);
        else resetAudienceFilters(queryPanel);
        if (scope === "my" && queryPanel.dataset.audienceKind === "detail") {
          syncMyBalanceCards(page, queryValue(queryPanel, "leave-type"));
        }
        return;
      }
      var summaryLink = event.target.closest(".audience-summary-quota-link");
      if (summaryLink) {
        event.preventDefault();
        var summaryRow = summaryLink.closest("tr");
        var detail = panelFor(scope, "detail");
        setAudienceQuery(detail, "leave-type", summaryLink.dataset.leaveType);
        if (scope === "team") setAudienceQuery(detail, "employee", summaryRow.dataset.employee);
        switchAudienceTab(scope, "detail");
        applyAudienceFilters(detail);
        return;
      }
      var usedLink = event.target.closest(".audience-used-quota-link");
      if (usedLink) {
        event.preventDefault();
        var detailRow = usedLink.closest("tr");
        var usage = panelFor(scope, "usage");
        setAudienceQuery(usage, "leave-type", detailRow.dataset.leaveType);
        if (scope === "team") setAudienceQuery(usage, "employee", detailRow.dataset.employee);
        switchAudienceTab(scope, "usage");
        applyAudienceFilters(usage);
        return;
      }
      var split = event.target.closest(".audience-split-action");
      if (split) {
        event.preventDefault();
        openAudienceUsageDetail(split.closest("tr").dataset.leaveType || "年假");
        return;
      }
      if (event.target.closest(".audience-export")) {
        showToast("已按当前查询条件导出。");
        return;
      }
      if (event.target.closest(".audience-export-setting")) showToast("已打开导出设置。");
    });
  }

  function renderAudiencePage(scope) {
    var config = audienceConfigs[scope];
    var page = document.getElementById("page-" + scope + "-balance");
    var kinds;
    var defaultKind;
    if (scope === "my") {
      page.innerHTML = '<div class="page-title">' + config.pageTitle + '</div>' + myBalanceCardMarkup() + '<div class="tabs audience-balance-tabs"><button type="button" class="tab audience-balance-tab active" data-audience-tab="detail">余额明细</button><button type="button" class="tab audience-balance-tab" data-audience-tab="usage">已休明细</button></div>';
      kinds = ["detail", "usage"];
      defaultKind = "detail";
    } else {
      page.innerHTML = '<div class="page-title">' + config.pageTitle + '</div><div class="tabs audience-balance-tabs"><button type="button" class="tab audience-balance-tab active" data-audience-tab="summary">余额汇总</button><button type="button" class="tab audience-balance-tab" data-audience-tab="detail">余额明细</button><button type="button" class="tab audience-balance-tab" data-audience-tab="usage">已休明细</button></div>';
      kinds = ["summary", "detail", "usage"];
      defaultKind = "summary";
    }
    kinds.forEach(function (kind) {
      var panel = cloneAudiencePanel(scope, kind);
      if (kind === defaultKind) panel.classList.add("active");
      page.appendChild(panel);
      applyAudienceFilters(panel);
    });
    bindAudiencePage(scope);
  }

  renderAudiencePage("team");
  renderAudiencePage("my");

  function normalizeAreaControls(root) {
    root.querySelectorAll(".search-item, .dialog-row, .dialog-field").forEach(function (item) {
      var label = item.querySelector("label");
      var select = item.querySelector("select");
      if (!label || !select || cleanText(label.textContent) !== "划分区域") return;
      Array.from(select.options).forEach(function (option) {
        if (cleanText(option.textContent) === "深圳") {
          option.textContent = "FBU-美东区";
          option.value = "FBU-美东区";
        }
      });
      if (!Array.from(select.options).some(function (option) { return cleanText(option.textContent) === "FBU-美东区"; })) {
        select.add(new Option("FBU-美东区", "FBU-美东区"));
      }
    });
  }

  normalizeAreaControls(document);
  var commonDialog = document.getElementById("commonDialog");
  if (commonDialog) {
    new MutationObserver(function () { normalizeAreaControls(commonDialog); }).observe(commonDialog, { childList: true, subtree: true });
  }

  document.querySelectorAll("table").forEach(function (table) {
    var headers = Array.from(table.querySelectorAll("thead th")).map(function (header) { return cleanText(header.textContent); });
    var areaIndex = headers.indexOf("划分区域");
    if (areaIndex < 0) return;
    table.querySelectorAll("tbody tr").forEach(function (row) {
      if (row.children[areaIndex] && cleanText(row.children[areaIndex].textContent) === "深圳") {
        row.children[areaIndex].textContent = "FBU-美东区";
      }
    });
  });
})();

(function () {
  function cleanNumber(value) {
    var normalized = (value || "").replace(/[^\d.-]/g, "");
    var number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function displayNumber(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  }

  function addTotalAvailableColumn(panelId, audience) {
    var panel = document.getElementById(panelId);
    var table = panel && panel.querySelector("table");
    if (!table) return;
    var headers = Array.from(table.querySelectorAll("thead th"));
    if (headers.some(function (header) { return header.textContent.trim() === "总可休额度（h）"; })) return;
    var annualIndex = headers.findIndex(function (header) { return header.textContent.trim() === "年假可休额度（h）"; });
    var sickIndex = headers.findIndex(function (header) { return header.textContent.trim() === "病假可休额度（h）"; });
    var compIndex = headers.findIndex(function (header) { return header.textContent.trim() === "调休假可休额度（h）"; });
    if (annualIndex < 0 || sickIndex < 0 || compIndex < 0) return;

    var totalHeader = document.createElement("th");
    totalHeader.textContent = "总可休额度（h）";
    totalHeader.title = "年假、病假、调休假当前可休额度合计，仅用于汇总展示，不代表各类额度可互换。";
    headers[annualIndex].before(totalHeader);

    table.querySelectorAll("tbody tr").forEach(function (row) {
      var cells = Array.from(row.children);
      var total = cleanNumber(cells[annualIndex] && cells[annualIndex].textContent) +
        cleanNumber(cells[sickIndex] && cells[sickIndex].textContent) +
        cleanNumber(cells[compIndex] && cells[compIndex].textContent);
      var cell = document.createElement("td");
      var totalText = displayNumber(total);
      cell.className = "total-available-quota";
      cell.textContent = totalText;
      cells[annualIndex].before(cell);
    });
  }

  addTotalAvailableColumn("balance-summary", false);
  addTotalAvailableColumn("team-balance-summary", true);
})();
