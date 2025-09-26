# Tasks: Bitbucket Data Center Repository Operations

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
Tasks for repository, branch, tag, source, and permission management endpoints in Bitbucket Data Center. Each endpoint follows the standard TDD workflow: write the contract test, then implement the operation to make it pass. All list operations must reuse the shared pagination utility defined in `tasks.md` (T400).

---

## Extended Coverage

### Data Center · Repositories Operations
- [ ] **T1238** [P]: Write contract test for `bitbucket.dc.projects.repos.archive.list` in `tests/contract/operations/data-center/projects/repos/archive/list.test.ts`.
- [ ] **T1239**: Implement `bitbucket.dc.projects.repos.archive.list` in `src/tools/operations/data-center/projects/repos/archive/list.ts`.
- [ ] **T1240** [P]: Write contract test for `bitbucket.dc.projects.repos.attachments.delete` in `tests/contract/operations/data-center/projects/repos/attachments/delete.test.ts`.
- [ ] **T1241**: Implement `bitbucket.dc.projects.repos.attachments.delete` in `src/tools/operations/data-center/projects/repos/attachments/delete.ts`.
- [ ] **T1242** [P]: Write contract test for `bitbucket.dc.projects.repos.attachments.get` in `tests/contract/operations/data-center/projects/repos/attachments/get.test.ts`.
- [ ] **T1243**: Implement `bitbucket.dc.projects.repos.attachments.get` in `src/tools/operations/data-center/projects/repos/attachments/get.ts`.
- [ ] **T1244** [P]: Write contract test for `bitbucket.dc.projects.repos.attachments.metadata.delete` in `tests/contract/operations/data-center/projects/repos/attachments/metadata/delete.test.ts`.
- [ ] **T1245**: Implement `bitbucket.dc.projects.repos.attachments.metadata.delete` in `src/tools/operations/data-center/projects/repos/attachments/metadata/delete.ts`.
- [ ] **T1246** [P]: Write contract test for `bitbucket.dc.projects.repos.attachments.metadata.list` in `tests/contract/operations/data-center/projects/repos/attachments/metadata/list.test.ts`.
- [ ] **T1247**: Implement `bitbucket.dc.projects.repos.attachments.metadata.list` in `src/tools/operations/data-center/projects/repos/attachments/metadata/list.ts`.
- [ ] **T1248** [P]: Write contract test for `bitbucket.dc.projects.repos.attachments.metadata.update` in `tests/contract/operations/data-center/projects/repos/attachments/metadata/update.test.ts`.
- [ ] **T1249**: Implement `bitbucket.dc.projects.repos.attachments.metadata.update` in `src/tools/operations/data-center/projects/repos/attachments/metadata/update.ts`.
- [ ] **T1250** [P]: Write contract test for `bitbucket.dc.projects.repos.compare.changes.list` in `tests/contract/operations/data-center/projects/repos/compare/changes/list.test.ts`.
- [ ] **T1251**: Implement `bitbucket.dc.projects.repos.compare.changes.list` in `src/tools/operations/data-center/projects/repos/compare/changes/list.ts`.
- [ ] **T1252** [P]: Write contract test for `bitbucket.dc.projects.repos.compare.commits.list` in `tests/contract/operations/data-center/projects/repos/compare/commits/list.test.ts`.
- [ ] **T1253**: Implement `bitbucket.dc.projects.repos.compare.commits.list` in `src/tools/operations/data-center/projects/repos/compare/commits/list.ts`.
- [ ] **T1254** [P]: Write contract test for `bitbucket.dc.projects.repos.compare.diff-path.get` in `tests/contract/operations/data-center/projects/repos/compare/diff-path/get.test.ts`.
- [ ] **T1255**: Implement `bitbucket.dc.projects.repos.compare.diff-path.get` in `src/tools/operations/data-center/projects/repos/compare/diff-path/get.ts`.
- [ ] **T1256** [P]: Write contract test for `bitbucket.dc.projects.repos.contributing.list` in `tests/contract/operations/data-center/projects/repos/contributing/list.test.ts`.
- [ ] **T1257**: Implement `bitbucket.dc.projects.repos.contributing.list` in `src/tools/operations/data-center/projects/repos/contributing/list.ts`.
- [ ] **T1258** [P]: Write contract test for `bitbucket.dc.projects.repos.create` in `tests/contract/operations/data-center/projects/repos/create.test.ts`.
- [ ] **T1259**: Implement `bitbucket.dc.projects.repos.create` in `src/tools/operations/data-center/projects/repos/create.ts`.
- [ ] **T1260** [P]: Write contract test for `bitbucket.dc.projects.repos.create` in `tests/contract/operations/data-center/projects/repos/create.test.ts`.
- [ ] **T1261**: Implement `bitbucket.dc.projects.repos.create` in `src/tools/operations/data-center/projects/repos/create.ts`.
- [ ] **T1262** [P]: Write contract test for `bitbucket.dc.projects.repos.default-branch.list` in `tests/contract/operations/data-center/projects/repos/default-branch/list.test.ts`.
- [ ] **T1263**: Implement `bitbucket.dc.projects.repos.default-branch.list` in `src/tools/operations/data-center/projects/repos/default-branch/list.ts`.
- [ ] **T1264** [P]: Write contract test for `bitbucket.dc.projects.repos.default-branch.update` in `tests/contract/operations/data-center/projects/repos/default-branch/update.test.ts`.
- [ ] **T1265**: Implement `bitbucket.dc.projects.repos.default-branch.update` in `src/tools/operations/data-center/projects/repos/default-branch/update.ts`.
- [ ] **T1266** [P]: Write contract test for `bitbucket.dc.projects.repos.delete` in `tests/contract/operations/data-center/projects/repos/delete.test.ts`.
- [ ] **T1267**: Implement `bitbucket.dc.projects.repos.delete` in `src/tools/operations/data-center/projects/repos/delete.ts`.
- [ ] **T1268** [P]: Write contract test for `bitbucket.dc.projects.repos.diff.get` in `tests/contract/operations/data-center/projects/repos/diff/get.test.ts`.
- [ ] **T1269**: Implement `bitbucket.dc.projects.repos.diff.get` in `src/tools/operations/data-center/projects/repos/diff/get.ts`.
- [ ] **T1270** [P]: Write contract test for `bitbucket.dc.projects.repos.diff.get` in `tests/contract/operations/data-center/projects/repos/diff/get.test.ts`.
- [ ] **T1271**: Implement `bitbucket.dc.projects.repos.diff.get` in `src/tools/operations/data-center/projects/repos/diff/get.ts`.
- [ ] **T1272** [P]: Write contract test for `bitbucket.dc.projects.repos.diff.list` in `tests/contract/operations/data-center/projects/repos/diff/list.test.ts`.
- [ ] **T1273**: Implement `bitbucket.dc.projects.repos.diff.list` in `src/tools/operations/data-center/projects/repos/diff/list.ts`.
- [ ] **T1274** [P]: Write contract test for `bitbucket.dc.projects.repos.diff.list` in `tests/contract/operations/data-center/projects/repos/diff/list.test.ts`.
- [ ] **T1275**: Implement `bitbucket.dc.projects.repos.diff.list` in `src/tools/operations/data-center/projects/repos/diff/list.ts`.
- [ ] **T1276** [P]: Write contract test for `bitbucket.dc.projects.repos.forks.list` in `tests/contract/operations/data-center/projects/repos/forks/list.test.ts`.
- [ ] **T1277**: Implement `bitbucket.dc.projects.repos.forks.list` in `src/tools/operations/data-center/projects/repos/forks/list.ts`.
- [ ] **T1278** [P]: Write contract test for `bitbucket.dc.projects.repos.get` in `tests/contract/operations/data-center/projects/repos/get.test.ts`.
- [ ] **T1279**: Implement `bitbucket.dc.projects.repos.get` in `src/tools/operations/data-center/projects/repos/get.ts`.
- [ ] **T1280** [P]: Write contract test for `bitbucket.dc.projects.repos.labels.create` in `tests/contract/operations/data-center/projects/repos/labels/create.test.ts`.
- [ ] **T1281**: Implement `bitbucket.dc.projects.repos.labels.create` in `src/tools/operations/data-center/projects/repos/labels/create.ts`.
- [ ] **T1282** [P]: Write contract test for `bitbucket.dc.projects.repos.labels.delete` in `tests/contract/operations/data-center/projects/repos/labels/delete.test.ts`.
- [ ] **T1283**: Implement `bitbucket.dc.projects.repos.labels.delete` in `src/tools/operations/data-center/projects/repos/labels/delete.ts`.
- [ ] **T1284** [P]: Write contract test for `bitbucket.dc.projects.repos.labels.list` in `tests/contract/operations/data-center/projects/repos/labels/list.test.ts`.
- [ ] **T1285**: Implement `bitbucket.dc.projects.repos.labels.list` in `src/tools/operations/data-center/projects/repos/labels/list.ts`.
- [ ] **T1286** [P]: Write contract test for `bitbucket.dc.projects.repos.last-modified.get` in `tests/contract/operations/data-center/projects/repos/last-modified/get.test.ts`.
- [ ] **T1287**: Implement `bitbucket.dc.projects.repos.last-modified.get` in `src/tools/operations/data-center/projects/repos/last-modified/get.ts`.
- [ ] **T1288** [P]: Write contract test for `bitbucket.dc.projects.repos.last-modified.list` in `tests/contract/operations/data-center/projects/repos/last-modified/list.test.ts`.
- [ ] **T1289**: Implement `bitbucket.dc.projects.repos.last-modified.list` in `src/tools/operations/data-center/projects/repos/last-modified/list.ts`.
- [ ] **T1290** [P]: Write contract test for `bitbucket.dc.projects.repos.license.list` in `tests/contract/operations/data-center/projects/repos/license/list.test.ts`.
- [ ] **T1291**: Implement `bitbucket.dc.projects.repos.license.list` in `src/tools/operations/data-center/projects/repos/license/list.ts`.
- [ ] **T1292** [P]: Write contract test for `bitbucket.dc.projects.repos.list` in `tests/contract/operations/data-center/projects/repos/list.test.ts`.
- [ ] **T1293**: Implement `bitbucket.dc.projects.repos.list` in `src/tools/operations/data-center/projects/repos/list.ts`.
- [ ] **T1294** [P]: Write contract test for `bitbucket.dc.projects.repos.participants.list` in `tests/contract/operations/data-center/projects/repos/participants/list.test.ts`.
- [ ] **T1295**: Implement `bitbucket.dc.projects.repos.participants.list` in `src/tools/operations/data-center/projects/repos/participants/list.ts`.
- [ ] **T1296** [P]: Write contract test for `bitbucket.dc.projects.repos.patch.list` in `tests/contract/operations/data-center/projects/repos/patch/list.test.ts`.
- [ ] **T1297**: Implement `bitbucket.dc.projects.repos.patch.list` in `src/tools/operations/data-center/projects/repos/patch/list.ts`.
- [ ] **T1298** [P]: Write contract test for `bitbucket.dc.projects.repos.readme.list` in `tests/contract/operations/data-center/projects/repos/readme/list.test.ts`.
- [ ] **T1299**: Implement `bitbucket.dc.projects.repos.readme.list` in `src/tools/operations/data-center/projects/repos/readme/list.ts`.
- [ ] **T1300** [P]: Write contract test for `bitbucket.dc.projects.repos.recreate.create` in `tests/contract/operations/data-center/projects/repos/recreate/create.test.ts`.
- [ ] **T1301**: Implement `bitbucket.dc.projects.repos.recreate.create` in `src/tools/operations/data-center/projects/repos/recreate/create.ts`.
- [ ] **T1302** [P]: Write contract test for `bitbucket.dc.projects.repos.ref-change-activities.branches.list` in `tests/contract/operations/data-center/projects/repos/ref-change-activities/branches/list.test.ts`.
- [ ] **T1303**: Implement `bitbucket.dc.projects.repos.ref-change-activities.branches.list` in `src/tools/operations/data-center/projects/repos/ref-change-activities/branches/list.ts`.
- [ ] **T1304** [P]: Write contract test for `bitbucket.dc.projects.repos.ref-change-activities.list` in `tests/contract/operations/data-center/projects/repos/ref-change-activities/list.test.ts`.
- [ ] **T1305**: Implement `bitbucket.dc.projects.repos.ref-change-activities.list` in `src/tools/operations/data-center/projects/repos/ref-change-activities/list.ts`.
- [ ] **T1306** [P]: Write contract test for `bitbucket.dc.projects.repos.related.list` in `tests/contract/operations/data-center/projects/repos/related/list.test.ts`.
- [ ] **T1307**: Implement `bitbucket.dc.projects.repos.related.list` in `src/tools/operations/data-center/projects/repos/related/list.ts`.
- [ ] **T1308** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.auto-decline.delete` in `tests/contract/operations/data-center/projects/repos/settings/auto-decline/delete.test.ts`.
- [ ] **T1309**: Implement `bitbucket.dc.projects.repos.settings.auto-decline.delete` in `src/tools/operations/data-center/projects/repos/settings/auto-decline/delete.ts`.
- [ ] **T1310** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.auto-decline.list` in `tests/contract/operations/data-center/projects/repos/settings/auto-decline/list.test.ts`.
- [ ] **T1311**: Implement `bitbucket.dc.projects.repos.settings.auto-decline.list` in `src/tools/operations/data-center/projects/repos/settings/auto-decline/list.ts`.
- [ ] **T1312** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.auto-decline.update` in `tests/contract/operations/data-center/projects/repos/settings/auto-decline/update.test.ts`.
- [ ] **T1313**: Implement `bitbucket.dc.projects.repos.settings.auto-decline.update` in `src/tools/operations/data-center/projects/repos/settings/auto-decline/update.ts`.
- [ ] **T1314** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.pull-requests.create` in `tests/contract/operations/data-center/projects/repos/settings/pull-requests/create.test.ts`.
- [ ] **T1315**: Implement `bitbucket.dc.projects.repos.settings.pull-requests.create` in `src/tools/operations/data-center/projects/repos/settings/pull-requests/create.ts`.
- [ ] **T1316** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.pull-requests.list` in `tests/contract/operations/data-center/projects/repos/settings/pull-requests/list.test.ts`.
- [ ] **T1317**: Implement `bitbucket.dc.projects.repos.settings.pull-requests.list` in `src/tools/operations/data-center/projects/repos/settings/pull-requests/list.ts`.
- [ ] **T1318** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.reviewer-groups.create` in `tests/contract/operations/data-center/projects/repos/settings/reviewer-groups/create.test.ts`.
- [ ] **T1319**: Implement `bitbucket.dc.projects.repos.settings.reviewer-groups.create` in `src/tools/operations/data-center/projects/repos/settings/reviewer-groups/create.ts`.
- [ ] **T1320** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.reviewer-groups.delete` in `tests/contract/operations/data-center/projects/repos/settings/reviewer-groups/delete.test.ts`.
- [ ] **T1321**: Implement `bitbucket.dc.projects.repos.settings.reviewer-groups.delete` in `src/tools/operations/data-center/projects/repos/settings/reviewer-groups/delete.ts`.
- [ ] **T1322** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.reviewer-groups.get` in `tests/contract/operations/data-center/projects/repos/settings/reviewer-groups/get.test.ts`.
- [ ] **T1323**: Implement `bitbucket.dc.projects.repos.settings.reviewer-groups.get` in `src/tools/operations/data-center/projects/repos/settings/reviewer-groups/get.ts`.
- [ ] **T1324** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.reviewer-groups.list` in `tests/contract/operations/data-center/projects/repos/settings/reviewer-groups/list.test.ts`.
- [ ] **T1325**: Implement `bitbucket.dc.projects.repos.settings.reviewer-groups.list` in `src/tools/operations/data-center/projects/repos/settings/reviewer-groups/list.ts`.
- [ ] **T1326** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.reviewer-groups.update` in `tests/contract/operations/data-center/projects/repos/settings/reviewer-groups/update.test.ts`.
- [ ] **T1327**: Implement `bitbucket.dc.projects.repos.settings.reviewer-groups.update` in `src/tools/operations/data-center/projects/repos/settings/reviewer-groups/update.ts`.
- [ ] **T1328** [P]: Write contract test for `bitbucket.dc.projects.repos.settings.reviewer-groups.users.list` in `tests/contract/operations/data-center/projects/repos/settings/reviewer-groups/users/list.test.ts`.
- [ ] **T1329**: Implement `bitbucket.dc.projects.repos.settings.reviewer-groups.users.list` in `src/tools/operations/data-center/projects/repos/settings/reviewer-groups/users/list.ts`.
- [ ] **T1330** [P]: Write contract test for `bitbucket.dc.projects.repos.update` in `tests/contract/operations/data-center/projects/repos/update.test.ts`.
- [ ] **T1331**: Implement `bitbucket.dc.projects.repos.update` in `src/tools/operations/data-center/projects/repos/update.ts`.
- [ ] **T1332** [P]: Write contract test for `bitbucket.dc.projects.repos.watch.create` in `tests/contract/operations/data-center/projects/repos/watch/create.test.ts`.
- [ ] **T1333**: Implement `bitbucket.dc.projects.repos.watch.create` in `src/tools/operations/data-center/projects/repos/watch/create.ts`.
- [ ] **T1334** [P]: Write contract test for `bitbucket.dc.projects.repos.watch.delete` in `tests/contract/operations/data-center/projects/repos/watch/delete.test.ts`.
- [ ] **T1335**: Implement `bitbucket.dc.projects.repos.watch.delete` in `src/tools/operations/data-center/projects/repos/watch/delete.ts`.
- [ ] **T1336** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.create` in `tests/contract/operations/data-center/projects/repos/webhooks/create.test.ts`.
- [ ] **T1337**: Implement `bitbucket.dc.projects.repos.webhooks.create` in `src/tools/operations/data-center/projects/repos/webhooks/create.ts`.
- [ ] **T1338** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.delete` in `tests/contract/operations/data-center/projects/repos/webhooks/delete.test.ts`.
- [ ] **T1339**: Implement `bitbucket.dc.projects.repos.webhooks.delete` in `src/tools/operations/data-center/projects/repos/webhooks/delete.ts`.
- [ ] **T1340** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.get` in `tests/contract/operations/data-center/projects/repos/webhooks/get.test.ts`.
- [ ] **T1341**: Implement `bitbucket.dc.projects.repos.webhooks.get` in `src/tools/operations/data-center/projects/repos/webhooks/get.ts`.
- [ ] **T1342** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.latest.list` in `tests/contract/operations/data-center/projects/repos/webhooks/latest/list.test.ts`.
- [ ] **T1343**: Implement `bitbucket.dc.projects.repos.webhooks.latest.list` in `src/tools/operations/data-center/projects/repos/webhooks/latest/list.ts`.
- [ ] **T1344** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.list` in `tests/contract/operations/data-center/projects/repos/webhooks/list.test.ts`.
- [ ] **T1345**: Implement `bitbucket.dc.projects.repos.webhooks.list` in `src/tools/operations/data-center/projects/repos/webhooks/list.ts`.
- [ ] **T1346** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.statistics.list` in `tests/contract/operations/data-center/projects/repos/webhooks/statistics/list.test.ts`.
- [ ] **T1347**: Implement `bitbucket.dc.projects.repos.webhooks.statistics.list` in `src/tools/operations/data-center/projects/repos/webhooks/statistics/list.ts`.
- [ ] **T1348** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.statistics.summary.list` in `tests/contract/operations/data-center/projects/repos/webhooks/statistics/summary/list.test.ts`.
- [ ] **T1349**: Implement `bitbucket.dc.projects.repos.webhooks.statistics.summary.list` in `src/tools/operations/data-center/projects/repos/webhooks/statistics/summary/list.ts`.
- [ ] **T1350** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.test.create` in `tests/contract/operations/data-center/projects/repos/webhooks/test/create.test.ts`.
- [ ] **T1351**: Implement `bitbucket.dc.projects.repos.webhooks.test.create` in `src/tools/operations/data-center/projects/repos/webhooks/test/create.ts`.
- [ ] **T1352** [P]: Write contract test for `bitbucket.dc.projects.repos.webhooks.update` in `tests/contract/operations/data-center/projects/repos/webhooks/update.test.ts`.
- [ ] **T1353**: Implement `bitbucket.dc.projects.repos.webhooks.update` in `src/tools/operations/data-center/projects/repos/webhooks/update.ts`.

### Data Center · Branches Operations
- [ ] **T1354** [P]: Write contract test for `bitbucket.dc.projects.repos.branches.create` in `tests/contract/operations/data-center/projects/repos/branches/create.test.ts`.
- [ ] **T1355**: Implement `bitbucket.dc.projects.repos.branches.create` in `src/tools/operations/data-center/projects/repos/branches/create.ts`.
- [ ] **T1356** [P]: Write contract test for `bitbucket.dc.projects.repos.branches.list` in `tests/contract/operations/data-center/projects/repos/branches/list.test.ts`.
- [ ] **T1357**: Implement `bitbucket.dc.projects.repos.branches.list` in `src/tools/operations/data-center/projects/repos/branches/list.ts`.

### Data Center · Default Branch Operations
- [ ] **T1358** [P]: Write contract test for `bitbucket.dc.projects.repos.branches.default.list` in `tests/contract/operations/data-center/projects/repos/branches/default/list.test.ts`.
- [ ] **T1359**: Implement `bitbucket.dc.projects.repos.branches.default.list` in `src/tools/operations/data-center/projects/repos/branches/default/list.ts`.
- [ ] **T1360** [P]: Write contract test for `bitbucket.dc.projects.repos.branches.default.update` in `tests/contract/operations/data-center/projects/repos/branches/default/update.test.ts`.
- [ ] **T1361**: Implement `bitbucket.dc.projects.repos.branches.default.update` in `src/tools/operations/data-center/projects/repos/branches/default/update.ts`.

### Data Center · Tags Operations
- [ ] **T1362** [P]: Write contract test for `bitbucket.dc.projects.repos.tags.create` in `tests/contract/operations/data-center/projects/repos/tags/create.test.ts`.
- [ ] **T1363**: Implement `bitbucket.dc.projects.repos.tags.create` in `src/tools/operations/data-center/projects/repos/tags/create.ts`.
- [ ] **T1364** [P]: Write contract test for `bitbucket.dc.projects.repos.tags.get` in `tests/contract/operations/data-center/projects/repos/tags/get.test.ts`.
- [ ] **T1365**: Implement `bitbucket.dc.projects.repos.tags.get` in `src/tools/operations/data-center/projects/repos/tags/get.ts`.
- [ ] **T1366** [P]: Write contract test for `bitbucket.dc.projects.repos.tags.list` in `tests/contract/operations/data-center/projects/repos/tags/list.test.ts`.
- [ ] **T1367**: Implement `bitbucket.dc.projects.repos.tags.list` in `src/tools/operations/data-center/projects/repos/tags/list.ts`.

### Data Center · Repo Permissions (Groups) Operations
- [ ] **T1368** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.groups.delete` in `tests/contract/operations/data-center/projects/repos/permissions/groups/delete.test.ts`.
- [ ] **T1369**: Implement `bitbucket.dc.projects.repos.permissions.groups.delete` in `src/tools/operations/data-center/projects/repos/permissions/groups/delete.ts`.
- [ ] **T1370** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.groups.list` in `tests/contract/operations/data-center/projects/repos/permissions/groups/list.test.ts`.
- [ ] **T1371**: Implement `bitbucket.dc.projects.repos.permissions.groups.list` in `src/tools/operations/data-center/projects/repos/permissions/groups/list.ts`.
- [ ] **T1372** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.groups.none.list` in `tests/contract/operations/data-center/projects/repos/permissions/groups/none/list.test.ts`.
- [ ] **T1373**: Implement `bitbucket.dc.projects.repos.permissions.groups.none.list` in `src/tools/operations/data-center/projects/repos/permissions/groups/none/list.ts`.
- [ ] **T1374** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.groups.update` in `tests/contract/operations/data-center/projects/repos/permissions/groups/update.test.ts`.
- [ ] **T1375**: Implement `bitbucket.dc.projects.repos.permissions.groups.update` in `src/tools/operations/data-center/projects/repos/permissions/groups/update.ts`.

### Data Center · Repo Permissions (Users) Operations
- [ ] **T1376** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.users.delete` in `tests/contract/operations/data-center/projects/repos/permissions/users/delete.test.ts`.
- [ ] **T1377**: Implement `bitbucket.dc.projects.repos.permissions.users.delete` in `src/tools/operations/data-center/projects/repos/permissions/users/delete.ts`.
- [ ] **T1378** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.users.list` in `tests/contract/operations/data-center/projects/repos/permissions/users/list.test.ts`.
- [ ] **T1379**: Implement `bitbucket.dc.projects.repos.permissions.users.list` in `src/tools/operations/data-center/projects/repos/permissions/users/list.ts`.
- [ ] **T1380** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.users.none.list` in `tests/contract/operations/data-center/projects/repos/permissions/users/none/list.test.ts`.
- [ ] **T1381**: Implement `bitbucket.dc.projects.repos.permissions.users.none.list` in `src/tools/operations/data-center/projects/repos/permissions/users/none/list.ts`.
- [ ] **T1382** [P]: Write contract test for `bitbucket.dc.projects.repos.permissions.users.update` in `tests/contract/operations/data-center/projects/repos/permissions/users/update.test.ts`.
- [ ] **T1383**: Implement `bitbucket.dc.projects.repos.permissions.users.update` in `src/tools/operations/data-center/projects/repos/permissions/users/update.ts`.

### Data Center · Repos Operations
- [ ] **T1384** [P]: Write contract test for `bitbucket.dc.repos.list` in `tests/contract/operations/data-center/repos/list.test.ts`.
- [ ] **T1385**: Implement `bitbucket.dc.repos.list` in `src/tools/operations/data-center/repos/list.ts`.

### Data Center · Source Operations
- [ ] **T1386** [P]: Write contract test for `bitbucket.dc.projects.repos.browse.get` in `tests/contract/operations/data-center/projects/repos/browse/get.test.ts`.
- [ ] **T1387**: Implement `bitbucket.dc.projects.repos.browse.get` in `src/tools/operations/data-center/projects/repos/browse/get.ts`.
- [ ] **T1388** [P]: Write contract test for `bitbucket.dc.projects.repos.browse.list` in `tests/contract/operations/data-center/projects/repos/browse/list.test.ts`.
- [ ] **T1389**: Implement `bitbucket.dc.projects.repos.browse.list` in `src/tools/operations/data-center/projects/repos/browse/list.ts`.
- [ ] **T1390** [P]: Write contract test for `bitbucket.dc.projects.repos.browse.update` in `tests/contract/operations/data-center/projects/repos/browse/update.test.ts`.
- [ ] **T1391**: Implement `bitbucket.dc.projects.repos.browse.update` in `src/tools/operations/data-center/projects/repos/browse/update.ts`.
- [ ] **T1392** [P]: Write contract test for `bitbucket.dc.projects.repos.files.get` in `tests/contract/operations/data-center/projects/repos/files/get.test.ts`.
- [ ] **T1393**: Implement `bitbucket.dc.projects.repos.files.get` in `src/tools/operations/data-center/projects/repos/files/get.ts`.
- [ ] **T1394** [P]: Write contract test for `bitbucket.dc.projects.repos.files.list` in `tests/contract/operations/data-center/projects/repos/files/list.test.ts`.
- [ ] **T1395**: Implement `bitbucket.dc.projects.repos.files.list` in `src/tools/operations/data-center/projects/repos/files/list.ts`.
- [ ] **T1396** [P]: Write contract test for `bitbucket.dc.projects.repos.raw.get` in `tests/contract/operations/data-center/projects/repos/raw/get.test.ts`.
- [ ] **T1397**: Implement `bitbucket.dc.projects.repos.raw.get` in `src/tools/operations/data-center/projects/repos/raw/get.ts`.
- [ ] **T1398** [P]: Write contract test for `bitbucket.dc.projects.repos.raw.list` in `tests/contract/operations/data-center/projects/repos/raw/list.test.ts`.
- [ ] **T1399**: Implement `bitbucket.dc.projects.repos.raw.list` in `src/tools/operations/data-center/projects/repos/raw/list.ts`.
