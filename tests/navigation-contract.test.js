const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const navPath = path.join(root, "assets/unified-navigation.js");
const cssPath = path.join(root, "assets/unified-navigation.css");

assert.ok(fs.existsSync(navPath), "missing unified-navigation.js");
assert.ok(fs.existsSync(cssPath), "missing unified-navigation.css");

const navSource = fs.readFileSync(navPath, "utf8");
const expectedGroups = ["基础配置", "额度管理", "假勤流程", "团队假期", "我的假勤"];
const expectedItems = [
  ["leave-plan", "假期方案"],
  ["quota-balance", "假期余额"],
  ["quota-comp-detail", "调休假明细"],
  ["quota-annual-settlement", "年假结算"],
  ["quota-sick-settlement", "病假结算"],
  ["quota-comp-settlement", "调休假结算"],
  ["leave-hr", "休假"],
  ["team-balance", "团队假期余额"],
  ["team-leave", "团队休假"],
  ["my-balance", "我的假期余额"],
  ["my-leave-pc", "我的休假-PC端"],
  ["my-leave-mobile", "我的休假-移动端"],
];

function assertOrdered(source, values, label) {
  let previous = -1;
  for (const value of values) {
    const current = source.indexOf(value, previous + 1);
    assert.ok(current > previous, `${label} order missing: ${value}`);
    previous = current;
  }
}

assertOrdered(navSource, expectedGroups, "group");
assertOrdered(navSource, expectedItems.flat(), "menu item");
assert.ok(!navSource.includes("附件类型"), "unified navigation must not expose 附件类型");
assert.match(navSource, /target:\s*"_blank"/);

const leavePlan = fs.readFileSync(path.join(root, "01-基础配置/01-假期方案/index.html"), "utf8");
assert.match(leavePlan, /data-unified-page="leave-plan"/);
assert.match(leavePlan, /data-unified-root="\.\.\/\.\.\/"/);
assert.match(leavePlan, /id="unifiedAttendanceNav"/);
assert.match(leavePlan, /unified-navigation\.css/);
assert.match(leavePlan, /unified-navigation\.js/);

const quota = fs.readFileSync(path.join(root, "02-额度管理/index.html"), "utf8");
assert.match(quota, /data-unified-page="quota"/);
assert.match(quota, /data-unified-root="\.\.\/"/);
assert.match(quota, /unified-navigation\.css/);
assert.match(quota, /unified-navigation\.js/);
assert.match(quota, /const allowedQuotaPages = new Set\(\[\s*"balance",\s*"comp-detail",\s*"annual-settlement",\s*"sick-settlement",\s*"comp-settlement",\s*"team-balance",\s*"my-balance"\s*\]\)/);
assert.match(quota, /new URLSearchParams\(location\.search\)\.get\("page"\)/);
assert.match(quota, /allowedQuotaPages\.has\(requestedQuotaPage\) \? requestedQuotaPage : "balance"/);

const leaveCenter = fs.readFileSync(path.join(root, "03-休假管理/index.html"), "utf8");
const leaveApplication = fs.readFileSync(path.join(root, "05-休假申请/index.html"), "utf8");
assert.match(leaveCenter, /data-unified-page="leave-center"/);
assert.match(leaveCenter, /data-unified-root="\.\.\/"/);
assert.match(leaveApplication, /data-unified-page="leave-application"/);
assert.match(leaveApplication, /data-unified-root="\.\.\/"/);
assert.match(leaveCenter, /params\.get\('mode'\)==='hr'\?'hr':'team'/);
assert.match(leaveApplication, /\['team','hr'\]\.includes\(entryParams\.get\('mode'\)\)\?entryParams\.get\('mode'\):'self'/);
assert.match(leaveCenter, /const applicationHref = `\.\.\/05-休假申请\/index\.html\?mode=\$\{mode\}`/);
assert.match(leaveCenter, /const detailHref = `\.\.\/04-我的休假-PC端\/detail\.html\?\$\{detailParams\}`/);
assert.match(leaveApplication, /entryMode==='self'\?'\.\.\/04-我的休假-PC端\/index\.html':`\.\.\/03-休假管理\/index\.html\?mode=\$\{entryMode\}`/);

const myLeave = fs.readFileSync(path.join(root, "04-我的休假-PC端/index.html"), "utf8");
const myLeaveDetail = fs.readFileSync(path.join(root, "04-我的休假-PC端/detail.html"), "utf8");
const mobileLeave = fs.readFileSync(path.join(root, "06-我的休假-移动端/index.html"), "utf8");
assert.match(myLeave, /data-unified-page="my-leave"/);
assert.match(myLeaveDetail, /data-unified-page="my-leave-detail"/);
assert.match(myLeave, /unified-navigation\.css/);
assert.match(myLeaveDetail, /unified-navigation\.js/);
assert.match(myLeave, /\.\.\/05-休假申请\/index\.html\?mode=self/);
assert.match(myLeave, /entryMode:'self'/);
assert.match(myLeaveDetail, /const unifiedReturn = record\.entryMode === "self"/);
assert.match(myLeaveDetail, /\.\.\/03-休假管理\/index\.html\?mode=\$\{record\.entryMode\}/);
assert.ok(!mobileLeave.includes("unified-navigation.js"), "mobile must remain standalone");
assert.match(navSource, /target="' \+ item\.target \+ '"', 'rel="noopener"'/);

console.log("navigation contract: passed");
