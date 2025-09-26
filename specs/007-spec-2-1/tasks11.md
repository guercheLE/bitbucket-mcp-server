# Tasks: Add-ons, Reports, and Auxiliary Cloud Operations

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
Tasks for Bitbucket Cloud add-on management, commit reports, and any uncategorised cloud endpoints. Each endpoint follows the standard TDD workflow: write the contract test, then implement the operation to make it pass. All list operations must reuse the shared pagination utility defined in `tasks.md` (T400).

---

## Extended Coverage

### Cloud · Addon Operations
- [ ] **T406** [P]: Write contract test for `bitbucket.addon.delete` in `tests/contract/operations/addon/delete.test.ts`.
- [ ] **T407**: Implement `bitbucket.addon.delete` in `src/tools/operations/addon/delete.ts`.
- [ ] **T408** [P]: Write contract test for `bitbucket.addon.linkers.get` in `tests/contract/operations/addon/linkers/get.test.ts`.
- [ ] **T409**: Implement `bitbucket.addon.linkers.get` in `src/tools/operations/addon/linkers/get.ts`.
- [ ] **T410** [P]: Write contract test for `bitbucket.addon.linkers.list` in `tests/contract/operations/addon/linkers/list.test.ts`.
- [ ] **T411**: Implement `bitbucket.addon.linkers.list` in `src/tools/operations/addon/linkers/list.ts`.
- [ ] **T412** [P]: Write contract test for `bitbucket.addon.linkers.values.create` in `tests/contract/operations/addon/linkers/values/create.test.ts`.
- [ ] **T413**: Implement `bitbucket.addon.linkers.values.create` in `src/tools/operations/addon/linkers/values/create.ts`.
- [ ] **T414** [P]: Write contract test for `bitbucket.addon.linkers.values.delete` in `tests/contract/operations/addon/linkers/values/delete.test.ts`.
- [ ] **T415**: Implement `bitbucket.addon.linkers.values.delete` in `src/tools/operations/addon/linkers/values/delete.ts`.
- [ ] **T416** [P]: Write contract test for `bitbucket.addon.linkers.values.delete` in `tests/contract/operations/addon/linkers/values/delete.test.ts`.
- [ ] **T417**: Implement `bitbucket.addon.linkers.values.delete` in `src/tools/operations/addon/linkers/values/delete.ts`.
- [ ] **T418** [P]: Write contract test for `bitbucket.addon.linkers.values.get` in `tests/contract/operations/addon/linkers/values/get.test.ts`.
- [ ] **T419**: Implement `bitbucket.addon.linkers.values.get` in `src/tools/operations/addon/linkers/values/get.ts`.
- [ ] **T420** [P]: Write contract test for `bitbucket.addon.linkers.values.list` in `tests/contract/operations/addon/linkers/values/list.test.ts`.
- [ ] **T421**: Implement `bitbucket.addon.linkers.values.list` in `src/tools/operations/addon/linkers/values/list.ts`.
- [ ] **T422** [P]: Write contract test for `bitbucket.addon.linkers.values.update` in `tests/contract/operations/addon/linkers/values/update.test.ts`.
- [ ] **T423**: Implement `bitbucket.addon.linkers.values.update` in `src/tools/operations/addon/linkers/values/update.ts`.
- [ ] **T424** [P]: Write contract test for `bitbucket.addon.update` in `tests/contract/operations/addon/update.test.ts`.
- [ ] **T425**: Implement `bitbucket.addon.update` in `src/tools/operations/addon/update.ts`.

### Cloud · Reports Operations
- [ ] **T426** [P]: Write contract test for `bitbucket.repositories.commit.reports.annotations.bulk` in `tests/contract/operations/repositories/commit/reports/annotations/bulk.test.ts`.
- [ ] **T427**: Implement `bitbucket.repositories.commit.reports.annotations.bulk` in `src/tools/operations/repositories/commit/reports/annotations/bulk.ts`.
- [ ] **T428** [P]: Write contract test for `bitbucket.repositories.commit.reports.annotations.delete` in `tests/contract/operations/repositories/commit/reports/annotations/delete.test.ts`.
- [ ] **T429**: Implement `bitbucket.repositories.commit.reports.annotations.delete` in `src/tools/operations/repositories/commit/reports/annotations/delete.ts`.
- [ ] **T430** [P]: Write contract test for `bitbucket.repositories.commit.reports.annotations.get` in `tests/contract/operations/repositories/commit/reports/annotations/get.test.ts`.
- [ ] **T431**: Implement `bitbucket.repositories.commit.reports.annotations.get` in `src/tools/operations/repositories/commit/reports/annotations/get.ts`.
- [ ] **T432** [P]: Write contract test for `bitbucket.repositories.commit.reports.annotations.list` in `tests/contract/operations/repositories/commit/reports/annotations/list.test.ts`.
- [ ] **T433**: Implement `bitbucket.repositories.commit.reports.annotations.list` in `src/tools/operations/repositories/commit/reports/annotations/list.ts`.
- [ ] **T434** [P]: Write contract test for `bitbucket.repositories.commit.reports.annotations.update` in `tests/contract/operations/repositories/commit/reports/annotations/update.test.ts`.
- [ ] **T435**: Implement `bitbucket.repositories.commit.reports.annotations.update` in `src/tools/operations/repositories/commit/reports/annotations/update.ts`.
- [ ] **T436** [P]: Write contract test for `bitbucket.repositories.commit.reports.delete` in `tests/contract/operations/repositories/commit/reports/delete.test.ts`.
- [ ] **T437**: Implement `bitbucket.repositories.commit.reports.delete` in `src/tools/operations/repositories/commit/reports/delete.ts`.
- [ ] **T438** [P]: Write contract test for `bitbucket.repositories.commit.reports.get` in `tests/contract/operations/repositories/commit/reports/get.test.ts`.
- [ ] **T439**: Implement `bitbucket.repositories.commit.reports.get` in `src/tools/operations/repositories/commit/reports/get.ts`.
- [ ] **T440** [P]: Write contract test for `bitbucket.repositories.commit.reports.list` in `tests/contract/operations/repositories/commit/reports/list.test.ts`.
- [ ] **T441**: Implement `bitbucket.repositories.commit.reports.list` in `src/tools/operations/repositories/commit/reports/list.ts`.
- [ ] **T442** [P]: Write contract test for `bitbucket.repositories.commit.reports.update` in `tests/contract/operations/repositories/commit/reports/update.test.ts`.
- [ ] **T443**: Implement `bitbucket.repositories.commit.reports.update` in `src/tools/operations/repositories/commit/reports/update.ts`.
