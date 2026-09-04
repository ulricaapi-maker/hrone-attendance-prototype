const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pagePath = path.join(root, "01-基础配置", "02-成本分摊特例管理", "index.html");
const navPath = path.join(root, "assets", "unified-navigation.js");

assert.ok(fs.existsSync(pagePath), "missing cost allocation exception prototype");

const page = fs.readFileSync(pagePath, "utf8");
const nav = fs.readFileSync(navPath, "utf8");

assert.match(page, /data-unified-page="cost-allocation-exception"/);
assert.match(page, /data-unified-root="\.\.\/\.\.\/"/);
assert.match(page, />成本分摊规则</);
assert.match(page, />组织特例</);
assert.doesNotMatch(page, />成本中心特例</);
assert.doesNotMatch(page, />特例记录</);

assert.match(page, /id="exceptionName"[^>]*disabled/);
assert.match(page, /id="exceptionCode"[^>]*disabled/);
assert.match(page, /id="exceptionRemark"/);
assert.match(page, /id="costObjectOptions"/);
assert.match(page, /name="costObject" value="组织"/);
assert.match(page, /name="costObject" value="员工"/);
assert.match(page, /id="allocationRows"/);
assert.match(page, /id="saveException"/);
assert.doesNotMatch(page, /维护完分摊规则后自动写入/);
assert.doesNotMatch(page, /请完整维护分摊规则/);
assert.doesNotMatch(page, /id="allocationMessage"/);
assert.doesNotMatch(page, /id="allocationTotal"/);
assert.doesNotMatch(page, /class="allocation-summary"/);
assert.match(page, /id="definitionStatusQuery"/);

const definitionTable = page.match(/<table[^>]*class="[^"]*definition-table[^"]*"[\s\S]*?<\/table>/);
assert.ok(definitionTable, "missing cost center exception table");
for (const field of ["序号", "名称", "编码", "分摊规则", "成本对象", "状态", "创建人", "创建时间", "操作"]) {
  assert.ok(definitionTable[0].includes(field), `definition table missing field: ${field}`);
}
assert.match(definitionTable[0], /data-cost-objects="组织"/);
assert.match(definitionTable[0], /data-cost-objects="组织,员工"/);
assert.match(definitionTable[0], /aria-label="编辑"/);
assert.match(definitionTable[0], /aria-label="启用"/);
assert.match(definitionTable[0], /aria-label="停用"/);
assert.match(definitionTable[0], /tzl_cost-50%&amp;wx_Allen_AICenter-50%/);

const recordTable = page.match(/<table[^>]*id="exceptionRecordTable"[\s\S]*?<\/table>/);
assert.ok(recordTable, "missing exception record table");
for (const field of ["序号", "组织", "组织编码", "分摊规则"]) {
  assert.ok(recordTable[0].includes(field), `record table missing field: ${field}`);
}
assert.ok(!recordTable[0].includes("状态"), "record table must not show status");
assert.ok(!recordTable[0].includes("操作"), "record table must not show operations");
assert.ok(!recordTable[0].includes("创建人"), "record table must not show creator");
assert.ok(!recordTable[0].includes("创建时间"), "record table must not show creation time");
assert.match(recordTable[0], /hailey测试1-70%&amp;验收演示成本中心B3-30%/);
assert.doesNotMatch(recordTable[0], /hailey测试1:\s*70%;/);

assert.match(nav, /key:\s*"cost-allocation-exception"/);
assert.match(nav, /label:\s*"成本分摊特例管理"/);

console.log("cost allocation exception contract: passed");
