# Tasks: Bitbucket Data Center Project & Platform Operations

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
Tasks for project configuration, migrations, build/deployment hooks, and other platform endpoints in Bitbucket Data Center. Each endpoint follows the standard TDD workflow: write the contract test, then implement the operation to make it pass. All list operations must reuse the shared pagination utility defined in `tasks.md` (T400).

---

## Extended Coverage

### Data Center · Projects Operations
- [ ] **T1134** [P]: Write contract test for `bitbucket.dc.projects.avatar-png.create` in `tests/contract/operations/data-center/projects/avatar-png/create.test.ts`.
- [ ] **T1135**: Implement `bitbucket.dc.projects.avatar-png.create` in `src/tools/operations/data-center/projects/avatar-png/create.ts`.
- [ ] **T1136** [P]: Write contract test for `bitbucket.dc.projects.avatar-png.list` in `tests/contract/operations/data-center/projects/avatar-png/list.test.ts`.
- [ ] **T1137**: Implement `bitbucket.dc.projects.avatar-png.list` in `src/tools/operations/data-center/projects/avatar-png/list.ts`.
- [ ] **T1138** [P]: Write contract test for `bitbucket.dc.projects.create` in `tests/contract/operations/data-center/projects/create.test.ts`.
- [ ] **T1139**: Implement `bitbucket.dc.projects.create` in `src/tools/operations/data-center/projects/create.ts`.
- [ ] **T1140** [P]: Write contract test for `bitbucket.dc.projects.delete` in `tests/contract/operations/data-center/projects/delete.test.ts`.
- [ ] **T1141**: Implement `bitbucket.dc.projects.delete` in `src/tools/operations/data-center/projects/delete.ts`.
- [ ] **T1142** [P]: Write contract test for `bitbucket.dc.projects.get` in `tests/contract/operations/data-center/projects/get.test.ts`.
- [ ] **T1143**: Implement `bitbucket.dc.projects.get` in `src/tools/operations/data-center/projects/get.ts`.
- [ ] **T1144** [P]: Write contract test for `bitbucket.dc.projects.list` in `tests/contract/operations/data-center/projects/list.test.ts`.
- [ ] **T1145**: Implement `bitbucket.dc.projects.list` in `src/tools/operations/data-center/projects/list.ts`.
- [ ] **T1146** [P]: Write contract test for `bitbucket.dc.projects.permissions.all.create` in `tests/contract/operations/data-center/projects/permissions/all/create.test.ts`.
- [ ] **T1147**: Implement `bitbucket.dc.projects.permissions.all.create` in `src/tools/operations/data-center/projects/permissions/all/create.ts`.
- [ ] **T1148** [P]: Write contract test for `bitbucket.dc.projects.permissions.all.list` in `tests/contract/operations/data-center/projects/permissions/all/list.test.ts`.
- [ ] **T1149**: Implement `bitbucket.dc.projects.permissions.all.list` in `src/tools/operations/data-center/projects/permissions/all/list.ts`.
- [ ] **T1150** [P]: Write contract test for `bitbucket.dc.projects.permissions.groups.delete` in `tests/contract/operations/data-center/projects/permissions/groups/delete.test.ts`.
- [ ] **T1151**: Implement `bitbucket.dc.projects.permissions.groups.delete` in `src/tools/operations/data-center/projects/permissions/groups/delete.ts`.
- [ ] **T1152** [P]: Write contract test for `bitbucket.dc.projects.permissions.groups.list` in `tests/contract/operations/data-center/projects/permissions/groups/list.test.ts`.
- [ ] **T1153**: Implement `bitbucket.dc.projects.permissions.groups.list` in `src/tools/operations/data-center/projects/permissions/groups/list.ts`.
- [ ] **T1154** [P]: Write contract test for `bitbucket.dc.projects.permissions.groups.none.list` in `tests/contract/operations/data-center/projects/permissions/groups/none/list.test.ts`.
- [ ] **T1155**: Implement `bitbucket.dc.projects.permissions.groups.none.list` in `src/tools/operations/data-center/projects/permissions/groups/none/list.ts`.
- [ ] **T1156** [P]: Write contract test for `bitbucket.dc.projects.permissions.groups.update` in `tests/contract/operations/data-center/projects/permissions/groups/update.test.ts`.
- [ ] **T1157**: Implement `bitbucket.dc.projects.permissions.groups.update` in `src/tools/operations/data-center/projects/permissions/groups/update.ts`.
- [ ] **T1158** [P]: Write contract test for `bitbucket.dc.projects.permissions.users.delete` in `tests/contract/operations/data-center/projects/permissions/users/delete.test.ts`.
- [ ] **T1159**: Implement `bitbucket.dc.projects.permissions.users.delete` in `src/tools/operations/data-center/projects/permissions/users/delete.ts`.
- [ ] **T1160** [P]: Write contract test for `bitbucket.dc.projects.permissions.users.list` in `tests/contract/operations/data-center/projects/permissions/users/list.test.ts`.
- [ ] **T1161**: Implement `bitbucket.dc.projects.permissions.users.list` in `src/tools/operations/data-center/projects/permissions/users/list.ts`.
- [ ] **T1162** [P]: Write contract test for `bitbucket.dc.projects.permissions.users.none.list` in `tests/contract/operations/data-center/projects/permissions/users/none/list.test.ts`.
- [ ] **T1163**: Implement `bitbucket.dc.projects.permissions.users.none.list` in `src/tools/operations/data-center/projects/permissions/users/none/list.ts`.
- [ ] **T1164** [P]: Write contract test for `bitbucket.dc.projects.permissions.users.update` in `tests/contract/operations/data-center/projects/permissions/users/update.test.ts`.
- [ ] **T1165**: Implement `bitbucket.dc.projects.permissions.users.update` in `src/tools/operations/data-center/projects/permissions/users/update.ts`.
- [ ] **T1166** [P]: Write contract test for `bitbucket.dc.projects.settings.auto-decline.delete` in `tests/contract/operations/data-center/projects/settings/auto-decline/delete.test.ts`.
- [ ] **T1167**: Implement `bitbucket.dc.projects.settings.auto-decline.delete` in `src/tools/operations/data-center/projects/settings/auto-decline/delete.ts`.
- [ ] **T1168** [P]: Write contract test for `bitbucket.dc.projects.settings.auto-decline.list` in `tests/contract/operations/data-center/projects/settings/auto-decline/list.test.ts`.
- [ ] **T1169**: Implement `bitbucket.dc.projects.settings.auto-decline.list` in `src/tools/operations/data-center/projects/settings/auto-decline/list.ts`.
- [ ] **T1170** [P]: Write contract test for `bitbucket.dc.projects.settings.auto-decline.update` in `tests/contract/operations/data-center/projects/settings/auto-decline/update.test.ts`.
- [ ] **T1171**: Implement `bitbucket.dc.projects.settings.auto-decline.update` in `src/tools/operations/data-center/projects/settings/auto-decline/update.ts`.
- [ ] **T1172** [P]: Write contract test for `bitbucket.dc.projects.settings.hooks.enabled.delete` in `tests/contract/operations/data-center/projects/settings/hooks/enabled/delete.test.ts`.
- [ ] **T1173**: Implement `bitbucket.dc.projects.settings.hooks.enabled.delete` in `src/tools/operations/data-center/projects/settings/hooks/enabled/delete.ts`.
- [ ] **T1174** [P]: Write contract test for `bitbucket.dc.projects.settings.hooks.enabled.update` in `tests/contract/operations/data-center/projects/settings/hooks/enabled/update.test.ts`.
- [ ] **T1175**: Implement `bitbucket.dc.projects.settings.hooks.enabled.update` in `src/tools/operations/data-center/projects/settings/hooks/enabled/update.ts`.
- [ ] **T1176** [P]: Write contract test for `bitbucket.dc.projects.settings.hooks.get` in `tests/contract/operations/data-center/projects/settings/hooks/get.test.ts`.
- [ ] **T1177**: Implement `bitbucket.dc.projects.settings.hooks.get` in `src/tools/operations/data-center/projects/settings/hooks/get.ts`.
- [ ] **T1178** [P]: Write contract test for `bitbucket.dc.projects.settings.hooks.list` in `tests/contract/operations/data-center/projects/settings/hooks/list.test.ts`.
- [ ] **T1179**: Implement `bitbucket.dc.projects.settings.hooks.list` in `src/tools/operations/data-center/projects/settings/hooks/list.ts`.
- [ ] **T1180** [P]: Write contract test for `bitbucket.dc.projects.settings.hooks.settings.list` in `tests/contract/operations/data-center/projects/settings/hooks/settings/list.test.ts`.
- [ ] **T1181**: Implement `bitbucket.dc.projects.settings.hooks.settings.list` in `src/tools/operations/data-center/projects/settings/hooks/settings/list.ts`.
- [ ] **T1182** [P]: Write contract test for `bitbucket.dc.projects.settings.hooks.settings.update` in `tests/contract/operations/data-center/projects/settings/hooks/settings/update.test.ts`.
- [ ] **T1183**: Implement `bitbucket.dc.projects.settings.hooks.settings.update` in `src/tools/operations/data-center/projects/settings/hooks/settings/update.ts`.
- [ ] **T1184** [P]: Write contract test for `bitbucket.dc.projects.settings.pull-requests.create` in `tests/contract/operations/data-center/projects/settings/pull-requests/create.test.ts`.
- [ ] **T1185**: Implement `bitbucket.dc.projects.settings.pull-requests.create` in `src/tools/operations/data-center/projects/settings/pull-requests/create.ts`.
- [ ] **T1186** [P]: Write contract test for `bitbucket.dc.projects.settings.pull-requests.get` in `tests/contract/operations/data-center/projects/settings/pull-requests/get.test.ts`.
- [ ] **T1187**: Implement `bitbucket.dc.projects.settings.pull-requests.get` in `src/tools/operations/data-center/projects/settings/pull-requests/get.ts`.
- [ ] **T1188** [P]: Write contract test for `bitbucket.dc.projects.settings.reviewer-groups.create` in `tests/contract/operations/data-center/projects/settings/reviewer-groups/create.test.ts`.
- [ ] **T1189**: Implement `bitbucket.dc.projects.settings.reviewer-groups.create` in `src/tools/operations/data-center/projects/settings/reviewer-groups/create.ts`.
- [ ] **T1190** [P]: Write contract test for `bitbucket.dc.projects.settings.reviewer-groups.delete` in `tests/contract/operations/data-center/projects/settings/reviewer-groups/delete.test.ts`.
- [ ] **T1191**: Implement `bitbucket.dc.projects.settings.reviewer-groups.delete` in `src/tools/operations/data-center/projects/settings/reviewer-groups/delete.ts`.
- [ ] **T1192** [P]: Write contract test for `bitbucket.dc.projects.settings.reviewer-groups.get` in `tests/contract/operations/data-center/projects/settings/reviewer-groups/get.test.ts`.
- [ ] **T1193**: Implement `bitbucket.dc.projects.settings.reviewer-groups.get` in `src/tools/operations/data-center/projects/settings/reviewer-groups/get.ts`.
- [ ] **T1194** [P]: Write contract test for `bitbucket.dc.projects.settings.reviewer-groups.list` in `tests/contract/operations/data-center/projects/settings/reviewer-groups/list.test.ts`.
- [ ] **T1195**: Implement `bitbucket.dc.projects.settings.reviewer-groups.list` in `src/tools/operations/data-center/projects/settings/reviewer-groups/list.ts`.
- [ ] **T1196** [P]: Write contract test for `bitbucket.dc.projects.settings.reviewer-groups.update` in `tests/contract/operations/data-center/projects/settings/reviewer-groups/update.test.ts`.
- [ ] **T1197**: Implement `bitbucket.dc.projects.settings.reviewer-groups.update` in `src/tools/operations/data-center/projects/settings/reviewer-groups/update.ts`.
- [ ] **T1198** [P]: Write contract test for `bitbucket.dc.projects.update` in `tests/contract/operations/data-center/projects/update.test.ts`.
- [ ] **T1199**: Implement `bitbucket.dc.projects.update` in `src/tools/operations/data-center/projects/update.ts`.

### Data Center · Migration Operations
- [ ] **T1200** [P]: Write contract test for `bitbucket.dc.migration.exports.cancel.create` in `tests/contract/operations/data-center/migration/exports/cancel/create.test.ts`.
- [ ] **T1201**: Implement `bitbucket.dc.migration.exports.cancel.create` in `src/tools/operations/data-center/migration/exports/cancel/create.ts`.
- [ ] **T1202** [P]: Write contract test for `bitbucket.dc.migration.exports.create` in `tests/contract/operations/data-center/migration/exports/create.test.ts`.
- [ ] **T1203**: Implement `bitbucket.dc.migration.exports.create` in `src/tools/operations/data-center/migration/exports/create.ts`.
- [ ] **T1204** [P]: Write contract test for `bitbucket.dc.migration.exports.get` in `tests/contract/operations/data-center/migration/exports/get.test.ts`.
- [ ] **T1205**: Implement `bitbucket.dc.migration.exports.get` in `src/tools/operations/data-center/migration/exports/get.ts`.
- [ ] **T1206** [P]: Write contract test for `bitbucket.dc.migration.exports.messages.list` in `tests/contract/operations/data-center/migration/exports/messages/list.test.ts`.
- [ ] **T1207**: Implement `bitbucket.dc.migration.exports.messages.list` in `src/tools/operations/data-center/migration/exports/messages/list.ts`.
- [ ] **T1208** [P]: Write contract test for `bitbucket.dc.migration.exports.preview.create` in `tests/contract/operations/data-center/migration/exports/preview/create.test.ts`.
- [ ] **T1209**: Implement `bitbucket.dc.migration.exports.preview.create` in `src/tools/operations/data-center/migration/exports/preview/create.ts`.
- [ ] **T1210** [P]: Write contract test for `bitbucket.dc.migration.imports.cancel.create` in `tests/contract/operations/data-center/migration/imports/cancel/create.test.ts`.
- [ ] **T1211**: Implement `bitbucket.dc.migration.imports.cancel.create` in `src/tools/operations/data-center/migration/imports/cancel/create.ts`.
- [ ] **T1212** [P]: Write contract test for `bitbucket.dc.migration.imports.create` in `tests/contract/operations/data-center/migration/imports/create.test.ts`.
- [ ] **T1213**: Implement `bitbucket.dc.migration.imports.create` in `src/tools/operations/data-center/migration/imports/create.ts`.
- [ ] **T1214** [P]: Write contract test for `bitbucket.dc.migration.imports.get` in `tests/contract/operations/data-center/migration/imports/get.test.ts`.
- [ ] **T1215**: Implement `bitbucket.dc.migration.imports.get` in `src/tools/operations/data-center/migration/imports/get.ts`.
- [ ] **T1216** [P]: Write contract test for `bitbucket.dc.migration.imports.messages.list` in `tests/contract/operations/data-center/migration/imports/messages/list.test.ts`.
- [ ] **T1217**: Implement `bitbucket.dc.migration.imports.messages.list` in `src/tools/operations/data-center/migration/imports/messages/list.ts`.

### Data Center · Build Operations
- [ ] **T1218** [P]: Write contract test for `bitbucket.dc.build.capabilities.list` in `tests/contract/operations/data-center/build/capabilities/list.test.ts`.
- [ ] **T1219**: Implement `bitbucket.dc.build.capabilities.list` in `src/tools/operations/data-center/build/capabilities/list.ts`.

### Data Center · Deployment Operations
- [ ] **T1220** [P]: Write contract test for `bitbucket.dc.deployment.capabilities.list` in `tests/contract/operations/data-center/deployment/capabilities/list.test.ts`.
- [ ] **T1221**: Implement `bitbucket.dc.deployment.capabilities.list` in `src/tools/operations/data-center/deployment/capabilities/list.ts`.

### Data Center · Labels Operations
- [ ] **T1222** [P]: Write contract test for `bitbucket.dc.labels.get` in `tests/contract/operations/data-center/labels/get.test.ts`.
- [ ] **T1223**: Implement `bitbucket.dc.labels.get` in `src/tools/operations/data-center/labels/get.ts`.
- [ ] **T1224** [P]: Write contract test for `bitbucket.dc.labels.labeled.list` in `tests/contract/operations/data-center/labels/labeled/list.test.ts`.
- [ ] **T1225**: Implement `bitbucket.dc.labels.labeled.list` in `src/tools/operations/data-center/labels/labeled/list.ts`.
- [ ] **T1226** [P]: Write contract test for `bitbucket.dc.labels.list` in `tests/contract/operations/data-center/labels/list.test.ts`.
- [ ] **T1227**: Implement `bitbucket.dc.labels.list` in `src/tools/operations/data-center/labels/list.ts`.

### Data Center · Inbox Operations
- [ ] **T1228** [P]: Write contract test for `bitbucket.dc.inbox.pull-requests.count.list` in `tests/contract/operations/data-center/inbox/pull-requests/count/list.test.ts`.
- [ ] **T1229**: Implement `bitbucket.dc.inbox.pull-requests.count.list` in `src/tools/operations/data-center/inbox/pull-requests/count/list.ts`.
- [ ] **T1230** [P]: Write contract test for `bitbucket.dc.inbox.pull-requests.list` in `tests/contract/operations/data-center/inbox/pull-requests/list.test.ts`.
- [ ] **T1231**: Implement `bitbucket.dc.inbox.pull-requests.list` in `src/tools/operations/data-center/inbox/pull-requests/list.ts`.

### Data Center · Dashboard Operations
- [ ] **T1232** [P]: Write contract test for `bitbucket.dc.dashboard.pull-request-suggestions.list` in `tests/contract/operations/data-center/dashboard/pull-request-suggestions/list.test.ts`.
- [ ] **T1233**: Implement `bitbucket.dc.dashboard.pull-request-suggestions.list` in `src/tools/operations/data-center/dashboard/pull-request-suggestions/list.ts`.
- [ ] **T1234** [P]: Write contract test for `bitbucket.dc.dashboard.pull-requests.list` in `tests/contract/operations/data-center/dashboard/pull-requests/list.test.ts`.
- [ ] **T1235**: Implement `bitbucket.dc.dashboard.pull-requests.list` in `src/tools/operations/data-center/dashboard/pull-requests/list.ts`.

### Data Center · Markup Operations
- [ ] **T1236** [P]: Write contract test for `bitbucket.dc.markup.preview.create` in `tests/contract/operations/data-center/markup/preview/create.test.ts`.
- [ ] **T1237**: Implement `bitbucket.dc.markup.preview.create` in `src/tools/operations/data-center/markup/preview/create.ts`.
