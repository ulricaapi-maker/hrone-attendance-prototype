const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = "http://127.0.0.1:4173";
const canonicalMobileUrl = "https://ulricaapi-maker.github.io/hrone-leave-plan-prototype/leave-prototype/07-%E7%A7%BB%E5%8A%A8%E7%AB%AF%E4%BC%91%E5%81%87%E5%8E%9F%E5%9E%8B/";
const routes = [
  ["leave-plan", "/01-基础配置/01-假期方案/index.html", ""],
  ["quota-balance", "/02-额度管理/index.html", "page=balance"],
  ["quota-comp-detail", "/02-额度管理/index.html", "page=comp-detail"],
  ["quota-annual-settlement", "/02-额度管理/index.html", "page=annual-settlement"],
  ["quota-sick-settlement", "/02-额度管理/index.html", "page=sick-settlement"],
  ["quota-comp-settlement", "/02-额度管理/index.html", "page=comp-settlement"],
  ["leave-hr", "/03-休假管理/index.html", "mode=hr"],
  ["team-balance", "/02-额度管理/index.html", "page=team-balance"],
  ["team-leave", "/03-休假管理/index.html", "mode=team"],
  ["my-balance", "/02-额度管理/index.html", "page=my-balance"],
  ["my-leave-pc", "/04-我的休假-PC端/index.html", ""],
];
const quotaPages = [
  "balance", "comp-detail", "annual-settlement", "sick-settlement",
  "comp-settlement", "team-balance", "my-balance"
];
let testBrowser;

function collectErrors(page, errors) {
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
}

async function assertActive(page, key) {
  const current = page.locator('.unified-nav__item[aria-current="page"]');
  assert.equal(await current.count(), 1, `${key} 应且仅应高亮一个菜单`);
  assert.equal(await current.getAttribute("data-unified-key"), key, `${key} 高亮错误`);
}

async function assertRoute(page, expectedPath, expectedQuery) {
  const current = new URL(page.url());
  assert.equal(decodeURIComponent(current.pathname), expectedPath);
  assert.equal(current.searchParams.toString(), expectedQuery);
}

async function verifyApplicationRoundTrip(page, mode) {
  await page.goto(`${base}/03-休假管理/index.html?mode=${mode}`);
  await page.locator("#addBtn").click();
  await page.waitForLoadState("domcontentloaded");
  assert.equal(new URL(page.url()).searchParams.get("mode"), mode);
  await assertActive(page, mode === "team" ? "team-leave" : "leave-hr");
  await page.locator("#closeForm").click();
  await page.waitForLoadState("domcontentloaded");
  await assertRoute(page, "/03-休假管理/index.html", `mode=${mode}`);
}

async function verifyDetailRoundTrip(page, mode) {
  const listUrl = mode === "self"
    ? `${base}/04-我的休假-PC端/index.html`
    : `${base}/03-休假管理/index.html?mode=${mode}`;
  await page.goto(listUrl);
  await page.locator('[data-action="detail"]').first().click();
  await page.waitForLoadState("domcontentloaded");
  assert.equal(new URL(page.url()).searchParams.get("entryMode"), mode);
  await page.locator("#backBtn").click();
  await page.waitForLoadState("domcontentloaded");
  if (mode === "self") {
    await assertRoute(page, "/04-我的休假-PC端/index.html", "");
  } else {
    await assertRoute(page, "/03-休假管理/index.html", `mode=${mode}`);
  }
}

(async () => {
  const browser = testBrowser = await chromium.launch({ headless: true, executablePath: chromePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  collectErrors(page, errors);

  await page.goto(`${base}/`);
  await page.waitForLoadState("domcontentloaded");
  await assertRoute(page, "/01-基础配置/01-假期方案/index.html", "");
  await assertActive(page, "leave-plan");
  assert.equal(await page.locator("#unifiedAttendanceNav").getByText("附件类型").count(), 0);

  for (const [key, expectedPath, expectedQuery] of routes) {
    await page.goto(`${base}/01-基础配置/01-假期方案/index.html`);
    await page.locator(`[data-unified-key="${key}"]`).click();
    await page.waitForLoadState("domcontentloaded");
    await assertRoute(page, expectedPath, expectedQuery);
    await assertActive(page, key);
  }

  await page.goto(`${base}/01-基础配置/01-假期方案/index.html`);
  const mobileAnchor = page.locator('[data-unified-key="my-leave-mobile"]');
  assert.equal(await mobileAnchor.getAttribute("target"), "_blank");
  assert.equal(await mobileAnchor.getAttribute("rel"), "noopener");
  assert.equal(await mobileAnchor.getAttribute("href"), canonicalMobileUrl);
  const [mobilePopup] = await Promise.all([
    context.waitForEvent("page"),
    mobileAnchor.click()
  ]);
  collectErrors(mobilePopup, errors);
  await mobilePopup.waitForURL(canonicalMobileUrl);
  await mobilePopup.waitForLoadState("domcontentloaded");
  assert.equal(mobilePopup.url(), canonicalMobileUrl);
  assert.equal(await mobilePopup.title(), "HR One 移动端休假交互方案");
  await mobilePopup.locator(".quick-app.leave").click();
  assert.equal(await mobilePopup.locator("#scenario-trigger").isVisible(), true);
  assert.equal(await mobilePopup.locator("#scenario-value").innerText(), "固定班次·按休息时长休");
  assert.equal(page.url(), `${base}/01-%E5%9F%BA%E7%A1%80%E9%85%8D%E7%BD%AE/01-%E5%81%87%E6%9C%9F%E6%96%B9%E6%A1%88/index.html`);
  await assertActive(page, "leave-plan");
  await mobilePopup.close();

  for (const quotaPage of quotaPages) {
    await page.goto(`${base}/02-额度管理/index.html?page=${quotaPage}`);
    const activePages = page.locator(".page.active");
    assert.equal(await activePages.count(), 1, `${quotaPage} 应只展示一个页面`);
    assert.equal(await activePages.first().getAttribute("id"), `page-${quotaPage}`);
  }

  await page.goto(`${base}/02-额度管理/index.html?page=my-balance`);
  const myBalanceCards = page.locator("#page-my-balance .my-balance-card");
  assert.equal(await myBalanceCards.count(), 3);
  assert.deepEqual(
    await page.locator("#page-my-balance .my-balance-card-value").allInnerTexts(),
    ["72h", "40h", "16h"]
  );
  assert.deepEqual(
    await page.locator("#page-my-balance .my-balance-card-expiry strong").allInnerTexts(),
    ["2026-03-31", "2026-12-31", "2026-12-31"]
  );
  assert.equal(await page.locator("#page-my-balance .my-balance-cards").getByText("剩余", { exact: false }).count(), 0);
  const myCardBoxes = await myBalanceCards.evaluateAll(cards => cards.map(card => {
    const box = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    return { width: box.width, radius: parseFloat(style.borderRadius), background: style.backgroundColor };
  }));
  assert.ok(myCardBoxes.every(card => card.width >= 240), "我的余额卡片应铺满可用宽度");
  assert.ok(myCardBoxes.every(card => card.radius >= 6), "我的余额卡片应有清晰层次");
  await myBalanceCards.first().click();
  assert.equal(await page.locator('#page-my-balance .audience-balance-tab[data-audience-tab="detail"].active').count(), 1);

  await verifyApplicationRoundTrip(page, "team");
  await verifyApplicationRoundTrip(page, "hr");

  await page.goto(`${base}/04-我的休假-PC端/index.html`);
  await page.locator("#addBtn").click();
  await page.waitForLoadState("domcontentloaded");
  assert.equal(new URL(page.url()).searchParams.get("mode"), "self");
  await assertActive(page, "my-leave-pc");
  const quotaSummary = page.locator("#quotaSummary");
  assert.deepEqual(
    await quotaSummary.locator(".quota-value").allInnerTexts(),
    ["40小时", "32小时", "40小时"]
  );
  assert.equal(await quotaSummary.getByText("查看全部", { exact: false }).count(), 1);
  assert.equal(await quotaSummary.getByText("最近休假", { exact: false }).count(), 0);
  await page.locator("#closeForm").click();
  await page.waitForLoadState("domcontentloaded");
  await assertRoute(page, "/04-我的休假-PC端/index.html", "");

  await verifyDetailRoundTrip(page, "self");
  await verifyDetailRoundTrip(page, "team");
  await verifyDetailRoundTrip(page, "hr");

  await context.close();
  await browser.close();
  assert.deepEqual(errors, [], `浏览器错误:\n${errors.join("\n")}`);
  console.log("unified attendance flows: passed");
})().catch(error => {
  console.error(error);
  Promise.resolve(testBrowser?.close()).finally(() => { process.exitCode = 1; });
});
