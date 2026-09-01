(function () {
  "use strict";

  const groups = [
    { label: "基础配置", items: [
      { key: "leave-plan", label: "假期方案", href: "01-基础配置/01-假期方案/index.html" }
    ] },
    { label: "额度管理", items: [
      { key: "quota-balance", label: "假期余额", href: "02-额度管理/index.html?page=balance" },
      { key: "quota-comp-detail", label: "调休假明细", href: "02-额度管理/index.html?page=comp-detail" },
      { key: "quota-annual-settlement", label: "年假结算", href: "02-额度管理/index.html?page=annual-settlement" },
      { key: "quota-sick-settlement", label: "病假结算", href: "02-额度管理/index.html?page=sick-settlement" },
      { key: "quota-comp-settlement", label: "调休假结算", href: "02-额度管理/index.html?page=comp-settlement" }
    ] },
    { label: "假勤流程", items: [
      { key: "leave-hr", label: "休假", href: "03-休假管理/index.html?mode=hr" }
    ] },
    { label: "团队假期", items: [
      { key: "team-balance", label: "团队假期余额", href: "02-额度管理/index.html?page=team-balance" },
      { key: "team-leave", label: "团队休假", href: "03-休假管理/index.html?mode=team" }
    ] },
    { label: "我的假勤", items: [
      { key: "my-balance", label: "我的假期余额", href: "02-额度管理/index.html?page=my-balance" },
      { key: "my-leave-pc", label: "我的休假-PC端", href: "04-我的休假-PC端/index.html" },
      { key: "my-leave-mobile", label: "我的休假-移动端", href: "06-我的休假-移动端/index.html?from=unified", target: "_blank" }
    ] }
  ];

  const quotaRoutes = {
    balance: "quota-balance",
    "comp-detail": "quota-comp-detail",
    "annual-settlement": "quota-annual-settlement",
    "sick-settlement": "quota-sick-settlement",
    "comp-settlement": "quota-comp-settlement",
    "team-balance": "team-balance",
    "my-balance": "my-balance"
  };

  const leaveRoutes = { hr: "leave-hr", team: "team-leave", self: "my-leave-pc" };

  function queryValue(searchParams, name) {
    if (!searchParams) return "";
    if (typeof searchParams.get === "function") return searchParams.get(name) || "";
    return searchParams[name] || "";
  }

  function resolveActive(bodyDataset, searchParams) {
    const dataset = bodyDataset || {};
    const declaredPage = dataset.unifiedPage || dataset.page || "";
    const fallback = dataset.unifiedActive || declaredPage || "leave-plan";

    if (declaredPage === "quota") {
      return quotaRoutes[queryValue(searchParams, "page")] || fallback;
    }
    if (declaredPage === "leave-center") {
      return leaveRoutes[queryValue(searchParams, "mode")] || fallback;
    }
    if (declaredPage === "leave-application") {
      return leaveRoutes[queryValue(searchParams, "mode")] || fallback;
    }
    if (declaredPage === "my-leave-detail") {
      return leaveRoutes[queryValue(searchParams, "entryMode")] || fallback;
    }
    if (declaredPage === "my-leave") return "my-leave-pc";
    return fallback;
  }

  function render(options) {
    const config = options || {};
    const host = document.getElementById("unifiedAttendanceNav");
    if (!host) return;
    const root = config.root || "";
    const active = config.active || "leave-plan";
    const sections = groups.map(function (group) {
      const items = group.items.map(function (item) {
        const attributes = [
          'class="unified-nav__item"',
          'href="' + root + item.href + '"',
          'data-unified-key="' + item.key + '"'
        ];
        if (item.key === "leave-plan") attributes.push('id="navPlans"');
        if (item.key === active) attributes.push('aria-current="page"');
        if (item.target) attributes.push('target="' + item.target + '"', 'rel="noopener"');
        return "<a " + attributes.join(" ") + ">" + item.label + "</a>";
      }).join("");
      return '<section class="unified-nav__section"><div class="unified-nav__group">' + group.label + "</div>" + items + "</section>";
    }).join("");

    host.innerHTML = '<nav class="unified-nav" aria-label="HR One 考勤菜单">' +
      '<div class="unified-nav__logo">HR One</div>' +
      '<a class="unified-nav__home" href="' + root + 'index.html">首页</a>' +
      sections +
      "</nav>";
  }

  function renderDeclaredPage() {
    const body = document.body;
    if (!body || !document.getElementById("unifiedAttendanceNav")) return;
    const params = new URLSearchParams(window.location.search);
    render({
      root: body.dataset.unifiedRoot || "",
      active: resolveActive(body.dataset, params)
    });
  }

  window.UnifiedAttendanceNav = { groups: groups, render: render, resolveActive: resolveActive };
  if (document.getElementById("unifiedAttendanceNav")) {
    renderDeclaredPage();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderDeclaredPage, { once: true });
  } else {
    renderDeclaredPage();
  }
}());
