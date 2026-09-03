const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = "http://127.0.0.1:4173";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));

  try {
    await page.goto(`${base}/01-%E5%9F%BA%E7%A1%80%E9%85%8D%E7%BD%AE/02-%E6%88%90%E6%9C%AC%E5%88%86%E6%91%8A%E7%89%B9%E4%BE%8B%E7%AE%A1%E7%90%86/index.html`);
    assert.equal(await page.locator('[data-unified-key="cost-allocation-exception"][aria-current="page"]').count(), 1);

    await page.getByRole("tab", { name: "特例记录" }).click();
    const recordHeaders = await page.locator("#exceptionRecordTable th").allInnerTexts();
    assert.deepEqual(recordHeaders, ["序号", "组织", "组织编码", "分摊规则"]);
    assert.equal(await page.locator("#recordRows tr").first().locator(".rule-cell").innerText(), "hailey测试1-70%&验收演示成本中心B3-30%");
    assert.equal(await page.locator("#panel-records #addException").count(), 0);

    await page.getByRole("tab", { name: "成本中心特例" }).click();
    const definitionHeaders = await page.locator(".definition-table th").allInnerTexts();
    assert.deepEqual(definitionHeaders, ["序号", "名称", "编码", "分摊规则", "状态", "创建人", "创建时间", "操作"]);
    assert.equal(await page.locator("#definitionStatusQuery").count(), 1);
    const firstDefinitionRow = page.locator("#definitionRows tr").first();
    const secondDefinitionRow = page.locator("#definitionRows tr").nth(1);
    assert.equal(await firstDefinitionRow.getByRole("button", { name: "编辑" }).count(), 1);
    assert.equal(await firstDefinitionRow.getByRole("button", { name: "停用" }).count(), 1);
    assert.equal(await firstDefinitionRow.getByRole("button", { name: "启用" }).count(), 0);
    assert.equal(await secondDefinitionRow.getByRole("button", { name: "启用" }).count(), 1);
    assert.equal(await secondDefinitionRow.getByRole("button", { name: "停用" }).count(), 0);

    await firstDefinitionRow.getByRole("button", { name: "停用" }).click();
    assert.equal(await firstDefinitionRow.locator(".status-tag").innerText(), "停用");
    assert.equal(await firstDefinitionRow.getByRole("button", { name: "启用" }).count(), 1);
    await page.locator("#definitionStatusQuery").selectOption("停用");
    await page.locator("#searchDefinition").click();
    assert.equal(await page.locator('#definitionRows tr:not([hidden])').count(), 2);
    await page.locator("#resetDefinition").click();

    const originalCount = await page.locator("#definitionRows tr").count();
    await page.locator("#addException").click();
    assert.equal(await page.locator("#exceptionModal").isVisible(), true);
    assert.equal(await page.locator("#exceptionName").isDisabled(), true);
    assert.equal(await page.locator("#exceptionName").getAttribute("placeholder"), null);
    assert.equal(await page.locator("#allocationMessage").count(), 0);
    assert.equal(await page.locator(".allocation-summary").count(), 0);
    assert.equal(await page.locator("#exceptionCode").isDisabled(), true);
    assert.equal(await page.locator("#exceptionCode").inputValue(), "FT20260903003");
    const selects = page.locator("#allocationRows .center-select");
    const ratios = page.locator("#allocationRows .ratio-input");
    await selects.nth(0).selectOption("tzl_cost");
    await ratios.nth(0).fill("60");
    await selects.nth(1).selectOption("wx_Allen_AICenter");
    await ratios.nth(1).fill("30");
    assert.equal(await page.locator("#exceptionName").inputValue(), "");
    assert.equal(await page.locator("#saveException").isDisabled(), true);

    await ratios.nth(1).fill("40");
    assert.equal(await page.locator("#exceptionName").inputValue(), "tzl_cost-60%&wx_Allen_AICenter-40%");
    assert.equal(await page.locator("#saveException").isEnabled(), true);

    await page.locator("#saveException").click();
    assert.equal(await page.locator("#exceptionModal").isHidden(), true);
    assert.equal(await page.locator("#definitionRows tr").count(), originalCount + 1);
    assert.equal(await page.locator("#definitionRows tr").last().locator("td").nth(1).innerText(), "tzl_cost-60%&wx_Allen_AICenter-40%");
    assert.equal(await page.locator("#definitionRows tr").last().locator("td").nth(3).innerText(), "tzl_cost: 60%; wx_Allen_AICenter: 40%");
    assert.equal(await page.locator("#definitionRows tr").last().locator(".status-tag").innerText(), "启用");
    assert.equal(await page.locator("#definitionRows tr").last().getByRole("button", { name: "停用" }).count(), 1);
    assert.equal(await page.locator("#toast").innerText(), "成本中心特例已新增");

    await page.locator("#definitionRows tr").last().getByRole("button", { name: "编辑" }).click();
    assert.equal(await page.locator("#saveException").isEnabled(), true);
    await page.locator("#saveException").click();
    assert.equal(await page.locator("#toast").innerText(), "成本中心特例已更新");

    assert.deepEqual(errors, []);
    console.log("cost allocation exception e2e: passed");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
