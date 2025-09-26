# Tasks: Administration and Server Settings

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing **Administration and Server Settings** API endpoints, which are primarily for Bitbucket Data Center.

---

## Phase 3.2: Core Implementation (Admin & Settings)

### Group 9.1: User and Group Management (Admin)
- [ ] **T163** [P]: Write contract test for `bitbucket.dc.admin.users.create` in `tests/contract/operations/admin/users/create.test.ts`.
- [ ] **T164**: Implement `bitbucket.dc.admin.users.create` in `src/tools/operations/admin/users/create.ts`.
- [ ] **T165** [P]: Write contract test for `bitbucket.dc.admin.users.list` in `tests/contract/operations/admin/users/list.test.ts`.
- [ ] **T166**: Implement `bitbucket.dc.admin.users.list` in `src/tools/operations/admin/users/list.ts`.

### Group 9.2: Permissions Management (Admin)
- [ ] **T167** [P]: Write contract test for `bitbucket.dc.admin.permissions.groups.list` in `tests/contract/operations/admin/permissions/groups/list.test.ts`.
- [ ] **T168**: Implement `bitbucket.dc.admin.permissions.groups.list` in `src/tools/operations/admin/permissions/groups/list.ts`.
- [ ] **T169** [P]: Write contract test for `bitbucket.dc.admin.permissions.users.list` in `tests/contract/operations/admin/permissions/users/list.test.ts`.
- [ ] **T170**: Implement `bitbucket.dc.admin.permissions.users.list` in `src/tools/operations/admin/permissions/users/list.ts`.

### Group 9.3: Server Settings
- [ ] **T171** [P]: Write contract test for `bitbucket.dc.admin.license.get` in `tests/contract/operations/admin/license/get.test.ts`.
- [ ] **T172**: Implement `bitbucket.dc.admin.license.get` in `src/tools/operations/admin/license/get.ts`.
- [ ] **T173** [P]: Write contract test for `bitbucket.dc.admin.mailServer.get` in `tests/contract/operations/admin/mailServer/get.test.ts`.
- [ ] **T174**: Implement `bitbucket.dc.admin.mailServer.get` in `src/tools/operations/admin/mailServer/get.ts`.

## Extended Coverage

### Data Center · Admin Operations
- [ ] **T1008** [P]: Write contract test for `bitbucket.dc.admin.banner.delete` in `tests/contract/operations/data-center/admin/banner/delete.test.ts`.
- [ ] **T1009**: Implement `bitbucket.dc.admin.banner.delete` in `src/tools/operations/data-center/admin/banner/delete.ts`.
- [ ] **T1010** [P]: Write contract test for `bitbucket.dc.admin.banner.list` in `tests/contract/operations/data-center/admin/banner/list.test.ts`.
- [ ] **T1011**: Implement `bitbucket.dc.admin.banner.list` in `src/tools/operations/data-center/admin/banner/list.ts`.
- [ ] **T1012** [P]: Write contract test for `bitbucket.dc.admin.banner.update` in `tests/contract/operations/data-center/admin/banner/update.test.ts`.
- [ ] **T1013**: Implement `bitbucket.dc.admin.banner.update` in `src/tools/operations/data-center/admin/banner/update.ts`.
- [ ] **T1014** [P]: Write contract test for `bitbucket.dc.admin.cluster.list` in `tests/contract/operations/data-center/admin/cluster/list.test.ts`.
- [ ] **T1015**: Implement `bitbucket.dc.admin.cluster.list` in `src/tools/operations/data-center/admin/cluster/list.ts`.
- [ ] **T1016** [P]: Write contract test for `bitbucket.dc.admin.default-branch.delete` in `tests/contract/operations/data-center/admin/default-branch/delete.test.ts`.
- [ ] **T1017**: Implement `bitbucket.dc.admin.default-branch.delete` in `src/tools/operations/data-center/admin/default-branch/delete.ts`.
- [ ] **T1018** [P]: Write contract test for `bitbucket.dc.admin.default-branch.list` in `tests/contract/operations/data-center/admin/default-branch/list.test.ts`.
- [ ] **T1019**: Implement `bitbucket.dc.admin.default-branch.list` in `src/tools/operations/data-center/admin/default-branch/list.ts`.
- [ ] **T1020** [P]: Write contract test for `bitbucket.dc.admin.default-branch.update` in `tests/contract/operations/data-center/admin/default-branch/update.test.ts`.
- [ ] **T1021**: Implement `bitbucket.dc.admin.default-branch.update` in `src/tools/operations/data-center/admin/default-branch/update.ts`.
- [ ] **T1022** [P]: Write contract test for `bitbucket.dc.admin.groups.add-user.create` in `tests/contract/operations/data-center/admin/groups/add-user/create.test.ts`.
- [ ] **T1023**: Implement `bitbucket.dc.admin.groups.add-user.create` in `src/tools/operations/data-center/admin/groups/add-user/create.ts`.
- [ ] **T1024** [P]: Write contract test for `bitbucket.dc.admin.groups.add-users.create` in `tests/contract/operations/data-center/admin/groups/add-users/create.test.ts`.
- [ ] **T1025**: Implement `bitbucket.dc.admin.groups.add-users.create` in `src/tools/operations/data-center/admin/groups/add-users/create.ts`.
- [ ] **T1026** [P]: Write contract test for `bitbucket.dc.admin.groups.more-members.list` in `tests/contract/operations/data-center/admin/groups/more-members/list.test.ts`.
- [ ] **T1027**: Implement `bitbucket.dc.admin.groups.more-members.list` in `src/tools/operations/data-center/admin/groups/more-members/list.ts`.
- [ ] **T1028** [P]: Write contract test for `bitbucket.dc.admin.groups.more-non-members.list` in `tests/contract/operations/data-center/admin/groups/more-non-members/list.test.ts`.
- [ ] **T1029**: Implement `bitbucket.dc.admin.groups.more-non-members.list` in `src/tools/operations/data-center/admin/groups/more-non-members/list.ts`.
- [ ] **T1030** [P]: Write contract test for `bitbucket.dc.admin.groups.remove-user.create` in `tests/contract/operations/data-center/admin/groups/remove-user/create.test.ts`.
- [ ] **T1031**: Implement `bitbucket.dc.admin.groups.remove-user.create` in `src/tools/operations/data-center/admin/groups/remove-user/create.ts`.
- [ ] **T1032** [P]: Write contract test for `bitbucket.dc.admin.license.create` in `tests/contract/operations/data-center/admin/license/create.test.ts`.
- [ ] **T1033**: Implement `bitbucket.dc.admin.license.create` in `src/tools/operations/data-center/admin/license/create.ts`.
- [ ] **T1034** [P]: Write contract test for `bitbucket.dc.admin.license.list` in `tests/contract/operations/data-center/admin/license/list.test.ts`.
- [ ] **T1035**: Implement `bitbucket.dc.admin.license.list` in `src/tools/operations/data-center/admin/license/list.ts`.
- [ ] **T1036** [P]: Write contract test for `bitbucket.dc.admin.mail-server.delete` in `tests/contract/operations/data-center/admin/mail-server/delete.test.ts`.
- [ ] **T1037**: Implement `bitbucket.dc.admin.mail-server.delete` in `src/tools/operations/data-center/admin/mail-server/delete.ts`.
- [ ] **T1038** [P]: Write contract test for `bitbucket.dc.admin.mail-server.list` in `tests/contract/operations/data-center/admin/mail-server/list.test.ts`.
- [ ] **T1039**: Implement `bitbucket.dc.admin.mail-server.list` in `src/tools/operations/data-center/admin/mail-server/list.ts`.
- [ ] **T1040** [P]: Write contract test for `bitbucket.dc.admin.mail-server.sender-address.delete` in `tests/contract/operations/data-center/admin/mail-server/sender-address/delete.test.ts`.
- [ ] **T1041**: Implement `bitbucket.dc.admin.mail-server.sender-address.delete` in `src/tools/operations/data-center/admin/mail-server/sender-address/delete.ts`.
- [ ] **T1042** [P]: Write contract test for `bitbucket.dc.admin.mail-server.sender-address.list` in `tests/contract/operations/data-center/admin/mail-server/sender-address/list.test.ts`.
- [ ] **T1043**: Implement `bitbucket.dc.admin.mail-server.sender-address.list` in `src/tools/operations/data-center/admin/mail-server/sender-address/list.ts`.
- [ ] **T1044** [P]: Write contract test for `bitbucket.dc.admin.mail-server.sender-address.update` in `tests/contract/operations/data-center/admin/mail-server/sender-address/update.test.ts`.
- [ ] **T1045**: Implement `bitbucket.dc.admin.mail-server.sender-address.update` in `src/tools/operations/data-center/admin/mail-server/sender-address/update.ts`.
- [ ] **T1046** [P]: Write contract test for `bitbucket.dc.admin.mail-server.update` in `tests/contract/operations/data-center/admin/mail-server/update.test.ts`.
- [ ] **T1047**: Implement `bitbucket.dc.admin.mail-server.update` in `src/tools/operations/data-center/admin/mail-server/update.ts`.
- [ ] **T1048** [P]: Write contract test for `bitbucket.dc.admin.permissions.groups.delete` in `tests/contract/operations/data-center/admin/permissions/groups/delete.test.ts`.
- [ ] **T1049**: Implement `bitbucket.dc.admin.permissions.groups.delete` in `src/tools/operations/data-center/admin/permissions/groups/delete.ts`.
- [ ] **T1050** [P]: Write contract test for `bitbucket.dc.admin.permissions.groups.none.list` in `tests/contract/operations/data-center/admin/permissions/groups/none/list.test.ts`.
- [ ] **T1051**: Implement `bitbucket.dc.admin.permissions.groups.none.list` in `src/tools/operations/data-center/admin/permissions/groups/none/list.ts`.
- [ ] **T1052** [P]: Write contract test for `bitbucket.dc.admin.permissions.groups.update` in `tests/contract/operations/data-center/admin/permissions/groups/update.test.ts`.
- [ ] **T1053**: Implement `bitbucket.dc.admin.permissions.groups.update` in `src/tools/operations/data-center/admin/permissions/groups/update.ts`.
- [ ] **T1054** [P]: Write contract test for `bitbucket.dc.admin.permissions.users.delete` in `tests/contract/operations/data-center/admin/permissions/users/delete.test.ts`.
- [ ] **T1055**: Implement `bitbucket.dc.admin.permissions.users.delete` in `src/tools/operations/data-center/admin/permissions/users/delete.ts`.
- [ ] **T1056** [P]: Write contract test for `bitbucket.dc.admin.permissions.users.none.list` in `tests/contract/operations/data-center/admin/permissions/users/none/list.test.ts`.
- [ ] **T1057**: Implement `bitbucket.dc.admin.permissions.users.none.list` in `src/tools/operations/data-center/admin/permissions/users/none/list.ts`.
- [ ] **T1058** [P]: Write contract test for `bitbucket.dc.admin.permissions.users.update` in `tests/contract/operations/data-center/admin/permissions/users/update.test.ts`.
- [ ] **T1059**: Implement `bitbucket.dc.admin.permissions.users.update` in `src/tools/operations/data-center/admin/permissions/users/update.ts`.
- [ ] **T1060** [P]: Write contract test for `bitbucket.dc.admin.pull-requests.create` in `tests/contract/operations/data-center/admin/pull-requests/create.test.ts`.
- [ ] **T1061**: Implement `bitbucket.dc.admin.pull-requests.create` in `src/tools/operations/data-center/admin/pull-requests/create.ts`.
- [ ] **T1062** [P]: Write contract test for `bitbucket.dc.admin.pull-requests.get` in `tests/contract/operations/data-center/admin/pull-requests/get.test.ts`.
- [ ] **T1063**: Implement `bitbucket.dc.admin.pull-requests.get` in `src/tools/operations/data-center/admin/pull-requests/get.ts`.
- [ ] **T1064** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.history.list` in `tests/contract/operations/data-center/admin/rate-limit/history/list.test.ts`.
- [ ] **T1065**: Implement `bitbucket.dc.admin.rate-limit.history.list` in `src/tools/operations/data-center/admin/rate-limit/history/list.ts`.
- [ ] **T1066** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.list` in `tests/contract/operations/data-center/admin/rate-limit/settings/list.test.ts`.
- [ ] **T1067**: Implement `bitbucket.dc.admin.rate-limit.settings.list` in `src/tools/operations/data-center/admin/rate-limit/settings/list.ts`.
- [ ] **T1068** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.update` in `tests/contract/operations/data-center/admin/rate-limit/settings/update.test.ts`.
- [ ] **T1069**: Implement `bitbucket.dc.admin.rate-limit.settings.update` in `src/tools/operations/data-center/admin/rate-limit/settings/update.ts`.
- [ ] **T1070** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.users.create` in `tests/contract/operations/data-center/admin/rate-limit/settings/users/create.test.ts`.
- [ ] **T1071**: Implement `bitbucket.dc.admin.rate-limit.settings.users.create` in `src/tools/operations/data-center/admin/rate-limit/settings/users/create.ts`.
- [ ] **T1072** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.users.delete` in `tests/contract/operations/data-center/admin/rate-limit/settings/users/delete.test.ts`.
- [ ] **T1073**: Implement `bitbucket.dc.admin.rate-limit.settings.users.delete` in `src/tools/operations/data-center/admin/rate-limit/settings/users/delete.ts`.
- [ ] **T1074** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.users.get` in `tests/contract/operations/data-center/admin/rate-limit/settings/users/get.test.ts`.
- [ ] **T1075**: Implement `bitbucket.dc.admin.rate-limit.settings.users.get` in `src/tools/operations/data-center/admin/rate-limit/settings/users/get.ts`.
- [ ] **T1076** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.users.list` in `tests/contract/operations/data-center/admin/rate-limit/settings/users/list.test.ts`.
- [ ] **T1077**: Implement `bitbucket.dc.admin.rate-limit.settings.users.list` in `src/tools/operations/data-center/admin/rate-limit/settings/users/list.ts`.
- [ ] **T1078** [P]: Write contract test for `bitbucket.dc.admin.rate-limit.settings.users.update` in `tests/contract/operations/data-center/admin/rate-limit/settings/users/update.test.ts`.
- [ ] **T1079**: Implement `bitbucket.dc.admin.rate-limit.settings.users.update` in `src/tools/operations/data-center/admin/rate-limit/settings/users/update.ts`.
- [ ] **T1080** [P]: Write contract test for `bitbucket.dc.admin.users.add-group.create` in `tests/contract/operations/data-center/admin/users/add-group/create.test.ts`.
- [ ] **T1081**: Implement `bitbucket.dc.admin.users.add-group.create` in `src/tools/operations/data-center/admin/users/add-group/create.ts`.
- [ ] **T1082** [P]: Write contract test for `bitbucket.dc.admin.users.add-groups.create` in `tests/contract/operations/data-center/admin/users/add-groups/create.test.ts`.
- [ ] **T1083**: Implement `bitbucket.dc.admin.users.add-groups.create` in `src/tools/operations/data-center/admin/users/add-groups/create.ts`.
- [ ] **T1084** [P]: Write contract test for `bitbucket.dc.admin.users.captcha.delete` in `tests/contract/operations/data-center/admin/users/captcha/delete.test.ts`.
- [ ] **T1085**: Implement `bitbucket.dc.admin.users.captcha.delete` in `src/tools/operations/data-center/admin/users/captcha/delete.ts`.
- [ ] **T1086** [P]: Write contract test for `bitbucket.dc.admin.users.credentials.update` in `tests/contract/operations/data-center/admin/users/credentials/update.test.ts`.
- [ ] **T1087**: Implement `bitbucket.dc.admin.users.credentials.update` in `src/tools/operations/data-center/admin/users/credentials/update.ts`.
- [ ] **T1088** [P]: Write contract test for `bitbucket.dc.admin.users.delete` in `tests/contract/operations/data-center/admin/users/delete.test.ts`.
- [ ] **T1089**: Implement `bitbucket.dc.admin.users.delete` in `src/tools/operations/data-center/admin/users/delete.ts`.
- [ ] **T1090** [P]: Write contract test for `bitbucket.dc.admin.users.erasure.create` in `tests/contract/operations/data-center/admin/users/erasure/create.test.ts`.
- [ ] **T1091**: Implement `bitbucket.dc.admin.users.erasure.create` in `src/tools/operations/data-center/admin/users/erasure/create.ts`.
- [ ] **T1092** [P]: Write contract test for `bitbucket.dc.admin.users.erasure.list` in `tests/contract/operations/data-center/admin/users/erasure/list.test.ts`.
- [ ] **T1093**: Implement `bitbucket.dc.admin.users.erasure.list` in `src/tools/operations/data-center/admin/users/erasure/list.ts`.
- [ ] **T1094** [P]: Write contract test for `bitbucket.dc.admin.users.more-members.list` in `tests/contract/operations/data-center/admin/users/more-members/list.test.ts`.
- [ ] **T1095**: Implement `bitbucket.dc.admin.users.more-members.list` in `src/tools/operations/data-center/admin/users/more-members/list.ts`.
- [ ] **T1096** [P]: Write contract test for `bitbucket.dc.admin.users.more-non-members.list` in `tests/contract/operations/data-center/admin/users/more-non-members/list.test.ts`.
- [ ] **T1097**: Implement `bitbucket.dc.admin.users.more-non-members.list` in `src/tools/operations/data-center/admin/users/more-non-members/list.ts`.
- [ ] **T1098** [P]: Write contract test for `bitbucket.dc.admin.users.remove-group.create` in `tests/contract/operations/data-center/admin/users/remove-group/create.test.ts`.
- [ ] **T1099**: Implement `bitbucket.dc.admin.users.remove-group.create` in `src/tools/operations/data-center/admin/users/remove-group/create.ts`.
- [ ] **T1100** [P]: Write contract test for `bitbucket.dc.admin.users.rename.create` in `tests/contract/operations/data-center/admin/users/rename/create.test.ts`.
- [ ] **T1101**: Implement `bitbucket.dc.admin.users.rename.create` in `src/tools/operations/data-center/admin/users/rename/create.ts`.
- [ ] **T1102** [P]: Write contract test for `bitbucket.dc.admin.users.update` in `tests/contract/operations/data-center/admin/users/update.test.ts`.
- [ ] **T1103**: Implement `bitbucket.dc.admin.users.update` in `src/tools/operations/data-center/admin/users/update.ts`.

### Data Center · Users Operations
- [ ] **T1104** [P]: Write contract test for `bitbucket.dc.users.avatar-png.create` in `tests/contract/operations/data-center/users/avatar-png/create.test.ts`.
- [ ] **T1105**: Implement `bitbucket.dc.users.avatar-png.create` in `src/tools/operations/data-center/users/avatar-png/create.ts`.
- [ ] **T1106** [P]: Write contract test for `bitbucket.dc.users.avatar-png.delete` in `tests/contract/operations/data-center/users/avatar-png/delete.test.ts`.
- [ ] **T1107**: Implement `bitbucket.dc.users.avatar-png.delete` in `src/tools/operations/data-center/users/avatar-png/delete.ts`.
- [ ] **T1108** [P]: Write contract test for `bitbucket.dc.users.credentials.update` in `tests/contract/operations/data-center/users/credentials/update.test.ts`.
- [ ] **T1109**: Implement `bitbucket.dc.users.credentials.update` in `src/tools/operations/data-center/users/credentials/update.ts`.
- [ ] **T1110** [P]: Write contract test for `bitbucket.dc.users.get` in `tests/contract/operations/data-center/users/get.test.ts`.
- [ ] **T1111**: Implement `bitbucket.dc.users.get` in `src/tools/operations/data-center/users/get.ts`.
- [ ] **T1112** [P]: Write contract test for `bitbucket.dc.users.list` in `tests/contract/operations/data-center/users/list.test.ts`.
- [ ] **T1113**: Implement `bitbucket.dc.users.list` in `src/tools/operations/data-center/users/list.ts`.
- [ ] **T1114** [P]: Write contract test for `bitbucket.dc.users.settings.create` in `tests/contract/operations/data-center/users/settings/create.test.ts`.
- [ ] **T1115**: Implement `bitbucket.dc.users.settings.create` in `src/tools/operations/data-center/users/settings/create.ts`.
- [ ] **T1116** [P]: Write contract test for `bitbucket.dc.users.settings.list` in `tests/contract/operations/data-center/users/settings/list.test.ts`.
- [ ] **T1117**: Implement `bitbucket.dc.users.settings.list` in `src/tools/operations/data-center/users/settings/list.ts`.
- [ ] **T1118** [P]: Write contract test for `bitbucket.dc.users.update` in `tests/contract/operations/data-center/users/update.test.ts`.
- [ ] **T1119**: Implement `bitbucket.dc.users.update` in `src/tools/operations/data-center/users/update.ts`.

### Data Center · Groups Operations
- [ ] **T1120** [P]: Write contract test for `bitbucket.dc.groups.list` in `tests/contract/operations/data-center/groups/list.test.ts`.
- [ ] **T1121**: Implement `bitbucket.dc.groups.list` in `src/tools/operations/data-center/groups/list.ts`.

### Data Center · Application Properties Operations
- [ ] **T1122** [P]: Write contract test for `bitbucket.dc.application-properties.list` in `tests/contract/operations/data-center/application-properties/list.test.ts`.
- [ ] **T1123**: Implement `bitbucket.dc.application-properties.list` in `src/tools/operations/data-center/application-properties/list.ts`.

### Data Center · Logs Operations
- [ ] **T1124** [P]: Write contract test for `bitbucket.dc.logs.logger.get` in `tests/contract/operations/data-center/logs/logger/get.test.ts`.
- [ ] **T1125**: Implement `bitbucket.dc.logs.logger.get` in `src/tools/operations/data-center/logs/logger/get.ts`.
- [ ] **T1126** [P]: Write contract test for `bitbucket.dc.logs.logger.update` in `tests/contract/operations/data-center/logs/logger/update.test.ts`.
- [ ] **T1127**: Implement `bitbucket.dc.logs.logger.update` in `src/tools/operations/data-center/logs/logger/update.ts`.
- [ ] **T1128** [P]: Write contract test for `bitbucket.dc.logs.rootlogger.list` in `tests/contract/operations/data-center/logs/rootlogger/list.test.ts`.
- [ ] **T1129**: Implement `bitbucket.dc.logs.rootlogger.list` in `src/tools/operations/data-center/logs/rootlogger/list.ts`.
- [ ] **T1130** [P]: Write contract test for `bitbucket.dc.logs.rootlogger.update` in `tests/contract/operations/data-center/logs/rootlogger/update.test.ts`.
- [ ] **T1131**: Implement `bitbucket.dc.logs.rootlogger.update` in `src/tools/operations/data-center/logs/rootlogger/update.ts`.

### Data Center · Profile Operations
- [ ] **T1132** [P]: Write contract test for `bitbucket.dc.profile.recent.repos.list` in `tests/contract/operations/data-center/profile/recent/repos/list.test.ts`.
- [ ] **T1133**: Implement `bitbucket.dc.profile.recent.repos.list` in `src/tools/operations/data-center/profile/recent/repos/list.ts`.
