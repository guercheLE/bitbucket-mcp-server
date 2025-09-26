# Tasks: Pipelines and Deployments Management

**Input**: Design documents from `/specs/007-spec-2-1/`
**Prerequisites**: tasks.md

## Execution Flow
This file lists the tasks for implementing the **Pipelines and Deployments** API endpoints.

---

## Phase 3.2: Core Implementation (Pipelines & Deployments)

### Group 5.1: Pipelines Operations
- [ ] **T111** [P]: Write contract test for `bitbucket.pipelines.list` in `tests/contract/operations/pipelines/list.test.ts`.
- [ ] **T112**: Implement `bitbucket.pipelines.list` in `src/tools/operations/pipelines/list.ts`.
- [ ] **T113** [P]: Write contract test for `bitbucket.pipelines.get` in `tests/contract/operations/pipelines/get.test.ts`.
- [ ] **T114**: Implement `bitbucket.pipelines.get` in `src/tools/operations/pipelines/get.ts`.
- [ ] **T115** [P]: Write contract test for `bitbucket.pipelines.stop` in `tests/contract/operations/pipelines/stop.test.ts`.
- [ ] **T116**: Implement `bitbucket.pipelines.stop` in `src/tools/operations/pipelines/stop.ts`.

### Group 5.2: Deployments Operations
- [ ] **T117** [P]: Write contract test for `bitbucket.deployments.list` in `tests/contract/operations/deployments/list.test.ts`.
- [ ] **T118**: Implement `bitbucket.deployments.list` in `src/tools/operations/deployments/list.ts`.
- [ ] **T119** [P]: Write contract test for `bitbucket.deployments.get` in `tests/contract/operations/deployments/get.test.ts`.
- [ ] **T120**: Implement `bitbucket.deployments.get` in `src/tools/operations/deployments/get.ts`.
- [ ] **T121** [P]: Write contract test for `bitbucket.deployments.environments.list` in `tests/contract/operations/deployments/environments/list.test.ts`.
- [ ] **T122**: Implement `bitbucket.deployments.environments.list` in `src/tools/operations/deployments/environments/list.ts`.

## Extended Coverage

### Cloud · Pipelines Operations
- [ ] **T782** [P]: Write contract test for `bitbucket.repositories.deployments-config.environments.variables.create` in `tests/contract/operations/repositories/deployments-config/environments/variables/create.test.ts`.
- [ ] **T783**: Implement `bitbucket.repositories.deployments-config.environments.variables.create` in `src/tools/operations/repositories/deployments-config/environments/variables/create.ts`.
- [ ] **T784** [P]: Write contract test for `bitbucket.repositories.deployments-config.environments.variables.delete` in `tests/contract/operations/repositories/deployments-config/environments/variables/delete.test.ts`.
- [ ] **T785**: Implement `bitbucket.repositories.deployments-config.environments.variables.delete` in `src/tools/operations/repositories/deployments-config/environments/variables/delete.ts`.
- [ ] **T786** [P]: Write contract test for `bitbucket.repositories.deployments-config.environments.variables.list` in `tests/contract/operations/repositories/deployments-config/environments/variables/list.test.ts`.
- [ ] **T787**: Implement `bitbucket.repositories.deployments-config.environments.variables.list` in `src/tools/operations/repositories/deployments-config/environments/variables/list.ts`.
- [ ] **T788** [P]: Write contract test for `bitbucket.repositories.deployments-config.environments.variables.update` in `tests/contract/operations/repositories/deployments-config/environments/variables/update.test.ts`.
- [ ] **T789**: Implement `bitbucket.repositories.deployments-config.environments.variables.update` in `src/tools/operations/repositories/deployments-config/environments/variables/update.ts`.
- [ ] **T790** [P]: Write contract test for `bitbucket.repositories.pipelines-config.build-number.update` in `tests/contract/operations/repositories/pipelines-config/build-number/update.test.ts`.
- [ ] **T791**: Implement `bitbucket.repositories.pipelines-config.build-number.update` in `src/tools/operations/repositories/pipelines-config/build-number/update.ts`.
- [ ] **T792** [P]: Write contract test for `bitbucket.repositories.pipelines-config.caches.content-uri.get` in `tests/contract/operations/repositories/pipelines-config/caches/content-uri/get.test.ts`.
- [ ] **T793**: Implement `bitbucket.repositories.pipelines-config.caches.content-uri.get` in `src/tools/operations/repositories/pipelines-config/caches/content-uri/get.ts`.
- [ ] **T794** [P]: Write contract test for `bitbucket.repositories.pipelines-config.caches.delete` in `tests/contract/operations/repositories/pipelines-config/caches/delete.test.ts`.
- [ ] **T795**: Implement `bitbucket.repositories.pipelines-config.caches.delete` in `src/tools/operations/repositories/pipelines-config/caches/delete.ts`.
- [ ] **T796** [P]: Write contract test for `bitbucket.repositories.pipelines-config.caches.delete` in `tests/contract/operations/repositories/pipelines-config/caches/delete.test.ts`.
- [ ] **T797**: Implement `bitbucket.repositories.pipelines-config.caches.delete` in `src/tools/operations/repositories/pipelines-config/caches/delete.ts`.
- [ ] **T798** [P]: Write contract test for `bitbucket.repositories.pipelines-config.caches.list` in `tests/contract/operations/repositories/pipelines-config/caches/list.test.ts`.
- [ ] **T799**: Implement `bitbucket.repositories.pipelines-config.caches.list` in `src/tools/operations/repositories/pipelines-config/caches/list.ts`.
- [ ] **T800** [P]: Write contract test for `bitbucket.repositories.pipelines-config.get` in `tests/contract/operations/repositories/pipelines-config/get.test.ts`.
- [ ] **T801**: Implement `bitbucket.repositories.pipelines-config.get` in `src/tools/operations/repositories/pipelines-config/get.ts`.
- [ ] **T802** [P]: Write contract test for `bitbucket.repositories.pipelines-config.schedules.create` in `tests/contract/operations/repositories/pipelines-config/schedules/create.test.ts`.
- [ ] **T803**: Implement `bitbucket.repositories.pipelines-config.schedules.create` in `src/tools/operations/repositories/pipelines-config/schedules/create.ts`.
- [ ] **T804** [P]: Write contract test for `bitbucket.repositories.pipelines-config.schedules.delete` in `tests/contract/operations/repositories/pipelines-config/schedules/delete.test.ts`.
- [ ] **T805**: Implement `bitbucket.repositories.pipelines-config.schedules.delete` in `src/tools/operations/repositories/pipelines-config/schedules/delete.ts`.
- [ ] **T806** [P]: Write contract test for `bitbucket.repositories.pipelines-config.schedules.executions.list` in `tests/contract/operations/repositories/pipelines-config/schedules/executions/list.test.ts`.
- [ ] **T807**: Implement `bitbucket.repositories.pipelines-config.schedules.executions.list` in `src/tools/operations/repositories/pipelines-config/schedules/executions/list.ts`.
- [ ] **T808** [P]: Write contract test for `bitbucket.repositories.pipelines-config.schedules.get` in `tests/contract/operations/repositories/pipelines-config/schedules/get.test.ts`.
- [ ] **T809**: Implement `bitbucket.repositories.pipelines-config.schedules.get` in `src/tools/operations/repositories/pipelines-config/schedules/get.ts`.
- [ ] **T810** [P]: Write contract test for `bitbucket.repositories.pipelines-config.schedules.list` in `tests/contract/operations/repositories/pipelines-config/schedules/list.test.ts`.
- [ ] **T811**: Implement `bitbucket.repositories.pipelines-config.schedules.list` in `src/tools/operations/repositories/pipelines-config/schedules/list.ts`.
- [ ] **T812** [P]: Write contract test for `bitbucket.repositories.pipelines-config.schedules.update` in `tests/contract/operations/repositories/pipelines-config/schedules/update.test.ts`.
- [ ] **T813**: Implement `bitbucket.repositories.pipelines-config.schedules.update` in `src/tools/operations/repositories/pipelines-config/schedules/update.ts`.
- [ ] **T814** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.key-pair.delete` in `tests/contract/operations/repositories/pipelines-config/ssh/key-pair/delete.test.ts`.
- [ ] **T815**: Implement `bitbucket.repositories.pipelines-config.ssh.key-pair.delete` in `src/tools/operations/repositories/pipelines-config/ssh/key-pair/delete.ts`.
- [ ] **T816** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.key-pair.get` in `tests/contract/operations/repositories/pipelines-config/ssh/key-pair/get.test.ts`.
- [ ] **T817**: Implement `bitbucket.repositories.pipelines-config.ssh.key-pair.get` in `src/tools/operations/repositories/pipelines-config/ssh/key-pair/get.ts`.
- [ ] **T818** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.key-pair.update` in `tests/contract/operations/repositories/pipelines-config/ssh/key-pair/update.test.ts`.
- [ ] **T819**: Implement `bitbucket.repositories.pipelines-config.ssh.key-pair.update` in `src/tools/operations/repositories/pipelines-config/ssh/key-pair/update.ts`.
- [ ] **T820** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.known-hosts.create` in `tests/contract/operations/repositories/pipelines-config/ssh/known-hosts/create.test.ts`.
- [ ] **T821**: Implement `bitbucket.repositories.pipelines-config.ssh.known-hosts.create` in `src/tools/operations/repositories/pipelines-config/ssh/known-hosts/create.ts`.
- [ ] **T822** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.known-hosts.delete` in `tests/contract/operations/repositories/pipelines-config/ssh/known-hosts/delete.test.ts`.
- [ ] **T823**: Implement `bitbucket.repositories.pipelines-config.ssh.known-hosts.delete` in `src/tools/operations/repositories/pipelines-config/ssh/known-hosts/delete.ts`.
- [ ] **T824** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.known-hosts.get` in `tests/contract/operations/repositories/pipelines-config/ssh/known-hosts/get.test.ts`.
- [ ] **T825**: Implement `bitbucket.repositories.pipelines-config.ssh.known-hosts.get` in `src/tools/operations/repositories/pipelines-config/ssh/known-hosts/get.ts`.
- [ ] **T826** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.known-hosts.list` in `tests/contract/operations/repositories/pipelines-config/ssh/known-hosts/list.test.ts`.
- [ ] **T827**: Implement `bitbucket.repositories.pipelines-config.ssh.known-hosts.list` in `src/tools/operations/repositories/pipelines-config/ssh/known-hosts/list.ts`.
- [ ] **T828** [P]: Write contract test for `bitbucket.repositories.pipelines-config.ssh.known-hosts.update` in `tests/contract/operations/repositories/pipelines-config/ssh/known-hosts/update.test.ts`.
- [ ] **T829**: Implement `bitbucket.repositories.pipelines-config.ssh.known-hosts.update` in `src/tools/operations/repositories/pipelines-config/ssh/known-hosts/update.ts`.
- [ ] **T830** [P]: Write contract test for `bitbucket.repositories.pipelines-config.update` in `tests/contract/operations/repositories/pipelines-config/update.test.ts`.
- [ ] **T831**: Implement `bitbucket.repositories.pipelines-config.update` in `src/tools/operations/repositories/pipelines-config/update.ts`.
- [ ] **T832** [P]: Write contract test for `bitbucket.repositories.pipelines-config.variables.create` in `tests/contract/operations/repositories/pipelines-config/variables/create.test.ts`.
- [ ] **T833**: Implement `bitbucket.repositories.pipelines-config.variables.create` in `src/tools/operations/repositories/pipelines-config/variables/create.ts`.
- [ ] **T834** [P]: Write contract test for `bitbucket.repositories.pipelines-config.variables.delete` in `tests/contract/operations/repositories/pipelines-config/variables/delete.test.ts`.
- [ ] **T835**: Implement `bitbucket.repositories.pipelines-config.variables.delete` in `src/tools/operations/repositories/pipelines-config/variables/delete.ts`.
- [ ] **T836** [P]: Write contract test for `bitbucket.repositories.pipelines-config.variables.get` in `tests/contract/operations/repositories/pipelines-config/variables/get.test.ts`.
- [ ] **T837**: Implement `bitbucket.repositories.pipelines-config.variables.get` in `src/tools/operations/repositories/pipelines-config/variables/get.ts`.
- [ ] **T838** [P]: Write contract test for `bitbucket.repositories.pipelines-config.variables.list` in `tests/contract/operations/repositories/pipelines-config/variables/list.test.ts`.
- [ ] **T839**: Implement `bitbucket.repositories.pipelines-config.variables.list` in `src/tools/operations/repositories/pipelines-config/variables/list.ts`.
- [ ] **T840** [P]: Write contract test for `bitbucket.repositories.pipelines-config.variables.update` in `tests/contract/operations/repositories/pipelines-config/variables/update.test.ts`.
- [ ] **T841**: Implement `bitbucket.repositories.pipelines-config.variables.update` in `src/tools/operations/repositories/pipelines-config/variables/update.ts`.
- [ ] **T842** [P]: Write contract test for `bitbucket.repositories.pipelines.get` in `tests/contract/operations/repositories/pipelines/get.test.ts`.
- [ ] **T843**: Implement `bitbucket.repositories.pipelines.get` in `src/tools/operations/repositories/pipelines/get.ts`.
- [ ] **T844** [P]: Write contract test for `bitbucket.repositories.pipelines.list` in `tests/contract/operations/repositories/pipelines/list.test.ts`.
- [ ] **T845**: Implement `bitbucket.repositories.pipelines.list` in `src/tools/operations/repositories/pipelines/list.ts`.
- [ ] **T846** [P]: Write contract test for `bitbucket.repositories.pipelines.run` in `tests/contract/operations/repositories/pipelines/run.test.ts`.
- [ ] **T847**: Implement `bitbucket.repositories.pipelines.run` in `src/tools/operations/repositories/pipelines/run.ts`.
- [ ] **T848** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.get` in `tests/contract/operations/repositories/pipelines/steps/get.test.ts`.
- [ ] **T849**: Implement `bitbucket.repositories.pipelines.steps.get` in `src/tools/operations/repositories/pipelines/steps/get.ts`.
- [ ] **T850** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.list` in `tests/contract/operations/repositories/pipelines/steps/list.test.ts`.
- [ ] **T851**: Implement `bitbucket.repositories.pipelines.steps.list` in `src/tools/operations/repositories/pipelines/steps/list.ts`.
- [ ] **T852** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.log.get` in `tests/contract/operations/repositories/pipelines/steps/log/get.test.ts`.
- [ ] **T853**: Implement `bitbucket.repositories.pipelines.steps.log.get` in `src/tools/operations/repositories/pipelines/steps/log/get.ts`.
- [ ] **T854** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.logs.get` in `tests/contract/operations/repositories/pipelines/steps/logs/get.test.ts`.
- [ ] **T855**: Implement `bitbucket.repositories.pipelines.steps.logs.get` in `src/tools/operations/repositories/pipelines/steps/logs/get.ts`.
- [ ] **T856** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.test-reports.get` in `tests/contract/operations/repositories/pipelines/steps/test-reports/get.test.ts`.
- [ ] **T857**: Implement `bitbucket.repositories.pipelines.steps.test-reports.get` in `src/tools/operations/repositories/pipelines/steps/test-reports/get.ts`.
- [ ] **T858** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.test-reports.test-cases.get` in `tests/contract/operations/repositories/pipelines/steps/test-reports/test-cases/get.test.ts`.
- [ ] **T859**: Implement `bitbucket.repositories.pipelines.steps.test-reports.test-cases.get` in `src/tools/operations/repositories/pipelines/steps/test-reports/test-cases/get.ts`.
- [ ] **T860** [P]: Write contract test for `bitbucket.repositories.pipelines.steps.test-reports.test-cases.test-case-reasons.get` in `tests/contract/operations/repositories/pipelines/steps/test-reports/test-cases/test-case-reasons/get.test.ts`.
- [ ] **T861**: Implement `bitbucket.repositories.pipelines.steps.test-reports.test-cases.test-case-reasons.get` in `src/tools/operations/repositories/pipelines/steps/test-reports/test-cases/test-case-reasons/get.ts`.
- [ ] **T862** [P]: Write contract test for `bitbucket.repositories.pipelines.stoppipeline.stop` in `tests/contract/operations/repositories/pipelines/stoppipeline/stop.test.ts`.
- [ ] **T863**: Implement `bitbucket.repositories.pipelines.stoppipeline.stop` in `src/tools/operations/repositories/pipelines/stoppipeline/stop.ts`.
- [ ] **T864** [P]: Write contract test for `bitbucket.teams.pipelines-config.variables.create` in `tests/contract/operations/teams/pipelines-config/variables/create.test.ts`.
- [ ] **T865**: Implement `bitbucket.teams.pipelines-config.variables.create` in `src/tools/operations/teams/pipelines-config/variables/create.ts`.
- [ ] **T866** [P]: Write contract test for `bitbucket.teams.pipelines-config.variables.delete` in `tests/contract/operations/teams/pipelines-config/variables/delete.test.ts`.
- [ ] **T867**: Implement `bitbucket.teams.pipelines-config.variables.delete` in `src/tools/operations/teams/pipelines-config/variables/delete.ts`.
- [ ] **T868** [P]: Write contract test for `bitbucket.teams.pipelines-config.variables.get` in `tests/contract/operations/teams/pipelines-config/variables/get.test.ts`.
- [ ] **T869**: Implement `bitbucket.teams.pipelines-config.variables.get` in `src/tools/operations/teams/pipelines-config/variables/get.ts`.
- [ ] **T870** [P]: Write contract test for `bitbucket.teams.pipelines-config.variables.list` in `tests/contract/operations/teams/pipelines-config/variables/list.test.ts`.
- [ ] **T871**: Implement `bitbucket.teams.pipelines-config.variables.list` in `src/tools/operations/teams/pipelines-config/variables/list.ts`.
- [ ] **T872** [P]: Write contract test for `bitbucket.teams.pipelines-config.variables.update` in `tests/contract/operations/teams/pipelines-config/variables/update.test.ts`.
- [ ] **T873**: Implement `bitbucket.teams.pipelines-config.variables.update` in `src/tools/operations/teams/pipelines-config/variables/update.ts`.
- [ ] **T874** [P]: Write contract test for `bitbucket.users.pipelines-config.variables.create` in `tests/contract/operations/users/pipelines-config/variables/create.test.ts`.
- [ ] **T875**: Implement `bitbucket.users.pipelines-config.variables.create` in `src/tools/operations/users/pipelines-config/variables/create.ts`.
- [ ] **T876** [P]: Write contract test for `bitbucket.users.pipelines-config.variables.delete` in `tests/contract/operations/users/pipelines-config/variables/delete.test.ts`.
- [ ] **T877**: Implement `bitbucket.users.pipelines-config.variables.delete` in `src/tools/operations/users/pipelines-config/variables/delete.ts`.
- [ ] **T878** [P]: Write contract test for `bitbucket.users.pipelines-config.variables.get` in `tests/contract/operations/users/pipelines-config/variables/get.test.ts`.
- [ ] **T879**: Implement `bitbucket.users.pipelines-config.variables.get` in `src/tools/operations/users/pipelines-config/variables/get.ts`.
- [ ] **T880** [P]: Write contract test for `bitbucket.users.pipelines-config.variables.list` in `tests/contract/operations/users/pipelines-config/variables/list.test.ts`.
- [ ] **T881**: Implement `bitbucket.users.pipelines-config.variables.list` in `src/tools/operations/users/pipelines-config/variables/list.ts`.
- [ ] **T882** [P]: Write contract test for `bitbucket.users.pipelines-config.variables.update` in `tests/contract/operations/users/pipelines-config/variables/update.test.ts`.
- [ ] **T883**: Implement `bitbucket.users.pipelines-config.variables.update` in `src/tools/operations/users/pipelines-config/variables/update.ts`.
- [ ] **T884** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.identity.oidc.keys-json.get` in `tests/contract/operations/workspaces/pipelines-config/identity/oidc/keys-json/get.test.ts`.
- [ ] **T885**: Implement `bitbucket.workspaces.pipelines-config.identity.oidc.keys-json.get` in `src/tools/operations/workspaces/pipelines-config/identity/oidc/keys-json/get.ts`.
- [ ] **T886** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.identity.oidc.well-known.openid-configuration.get` in `tests/contract/operations/workspaces/pipelines-config/identity/oidc/well-known/openid-configuration/get.test.ts`.
- [ ] **T887**: Implement `bitbucket.workspaces.pipelines-config.identity.oidc.well-known.openid-configuration.get` in `src/tools/operations/workspaces/pipelines-config/identity/oidc/well-known/openid-configuration/get.ts`.
- [ ] **T888** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.variables.create` in `tests/contract/operations/workspaces/pipelines-config/variables/create.test.ts`.
- [ ] **T889**: Implement `bitbucket.workspaces.pipelines-config.variables.create` in `src/tools/operations/workspaces/pipelines-config/variables/create.ts`.
- [ ] **T890** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.variables.delete` in `tests/contract/operations/workspaces/pipelines-config/variables/delete.test.ts`.
- [ ] **T891**: Implement `bitbucket.workspaces.pipelines-config.variables.delete` in `src/tools/operations/workspaces/pipelines-config/variables/delete.ts`.
- [ ] **T892** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.variables.get` in `tests/contract/operations/workspaces/pipelines-config/variables/get.test.ts`.
- [ ] **T893**: Implement `bitbucket.workspaces.pipelines-config.variables.get` in `src/tools/operations/workspaces/pipelines-config/variables/get.ts`.
- [ ] **T894** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.variables.list` in `tests/contract/operations/workspaces/pipelines-config/variables/list.test.ts`.
- [ ] **T895**: Implement `bitbucket.workspaces.pipelines-config.variables.list` in `src/tools/operations/workspaces/pipelines-config/variables/list.ts`.
- [ ] **T896** [P]: Write contract test for `bitbucket.workspaces.pipelines-config.variables.update` in `tests/contract/operations/workspaces/pipelines-config/variables/update.test.ts`.
- [ ] **T897**: Implement `bitbucket.workspaces.pipelines-config.variables.update` in `src/tools/operations/workspaces/pipelines-config/variables/update.ts`.

### Cloud · Deployments Operations
- [ ] **T898** [P]: Write contract test for `bitbucket.repositories.deploy-keys.add` in `tests/contract/operations/repositories/deploy-keys/add.test.ts`.
- [ ] **T899**: Implement `bitbucket.repositories.deploy-keys.add` in `src/tools/operations/repositories/deploy-keys/add.ts`.
- [ ] **T900** [P]: Write contract test for `bitbucket.repositories.deploy-keys.delete` in `tests/contract/operations/repositories/deploy-keys/delete.test.ts`.
- [ ] **T901**: Implement `bitbucket.repositories.deploy-keys.delete` in `src/tools/operations/repositories/deploy-keys/delete.ts`.
- [ ] **T902** [P]: Write contract test for `bitbucket.repositories.deploy-keys.get` in `tests/contract/operations/repositories/deploy-keys/get.test.ts`.
- [ ] **T903**: Implement `bitbucket.repositories.deploy-keys.get` in `src/tools/operations/repositories/deploy-keys/get.ts`.
- [ ] **T904** [P]: Write contract test for `bitbucket.repositories.deploy-keys.list` in `tests/contract/operations/repositories/deploy-keys/list.test.ts`.
- [ ] **T905**: Implement `bitbucket.repositories.deploy-keys.list` in `src/tools/operations/repositories/deploy-keys/list.ts`.
- [ ] **T906** [P]: Write contract test for `bitbucket.repositories.deploy-keys.update` in `tests/contract/operations/repositories/deploy-keys/update.test.ts`.
- [ ] **T907**: Implement `bitbucket.repositories.deploy-keys.update` in `src/tools/operations/repositories/deploy-keys/update.ts`.
- [ ] **T908** [P]: Write contract test for `bitbucket.repositories.deployments.get` in `tests/contract/operations/repositories/deployments/get.test.ts`.
- [ ] **T909**: Implement `bitbucket.repositories.deployments.get` in `src/tools/operations/repositories/deployments/get.ts`.
- [ ] **T910** [P]: Write contract test for `bitbucket.repositories.deployments.list` in `tests/contract/operations/repositories/deployments/list.test.ts`.
- [ ] **T911**: Implement `bitbucket.repositories.deployments.list` in `src/tools/operations/repositories/deployments/list.ts`.
- [ ] **T912** [P]: Write contract test for `bitbucket.repositories.environments.changes.update` in `tests/contract/operations/repositories/environments/changes/update.test.ts`.
- [ ] **T913**: Implement `bitbucket.repositories.environments.changes.update` in `src/tools/operations/repositories/environments/changes/update.ts`.
- [ ] **T914** [P]: Write contract test for `bitbucket.repositories.environments.create` in `tests/contract/operations/repositories/environments/create.test.ts`.
- [ ] **T915**: Implement `bitbucket.repositories.environments.create` in `src/tools/operations/repositories/environments/create.ts`.
- [ ] **T916** [P]: Write contract test for `bitbucket.repositories.environments.delete` in `tests/contract/operations/repositories/environments/delete.test.ts`.
- [ ] **T917**: Implement `bitbucket.repositories.environments.delete` in `src/tools/operations/repositories/environments/delete.ts`.
- [ ] **T918** [P]: Write contract test for `bitbucket.repositories.environments.get` in `tests/contract/operations/repositories/environments/get.test.ts`.
- [ ] **T919**: Implement `bitbucket.repositories.environments.get` in `src/tools/operations/repositories/environments/get.ts`.
- [ ] **T920** [P]: Write contract test for `bitbucket.repositories.environments.list` in `tests/contract/operations/repositories/environments/list.test.ts`.
- [ ] **T921**: Implement `bitbucket.repositories.environments.list` in `src/tools/operations/repositories/environments/list.ts`.
- [ ] **T922** [P]: Write contract test for `bitbucket.workspaces.projects.deploy-keys.create` in `tests/contract/operations/workspaces/projects/deploy-keys/create.test.ts`.
- [ ] **T923**: Implement `bitbucket.workspaces.projects.deploy-keys.create` in `src/tools/operations/workspaces/projects/deploy-keys/create.ts`.
- [ ] **T924** [P]: Write contract test for `bitbucket.workspaces.projects.deploy-keys.delete` in `tests/contract/operations/workspaces/projects/deploy-keys/delete.test.ts`.
- [ ] **T925**: Implement `bitbucket.workspaces.projects.deploy-keys.delete` in `src/tools/operations/workspaces/projects/deploy-keys/delete.ts`.
- [ ] **T926** [P]: Write contract test for `bitbucket.workspaces.projects.deploy-keys.get` in `tests/contract/operations/workspaces/projects/deploy-keys/get.test.ts`.
- [ ] **T927**: Implement `bitbucket.workspaces.projects.deploy-keys.get` in `src/tools/operations/workspaces/projects/deploy-keys/get.ts`.
- [ ] **T928** [P]: Write contract test for `bitbucket.workspaces.projects.deploy-keys.list` in `tests/contract/operations/workspaces/projects/deploy-keys/list.test.ts`.
- [ ] **T929**: Implement `bitbucket.workspaces.projects.deploy-keys.list` in `src/tools/operations/workspaces/projects/deploy-keys/list.ts`.
