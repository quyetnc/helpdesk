# Daily Process & Training Documents

This folder contains step-by-step guidance for completing training days. Start here to navigate your daily work.

---

## 📚 Document Index

### Core Training Documents (Day 14-15)

| Document | Purpose | Use When |
|----------|---------|----------|
| **day-14-15-understanding.md** | Deep explanations of concepts | Before starting — read first to understand WHY |
| **day-14-15-process.md** | Detailed 11-phase walkthrough | During work — follow exact steps + commands |
| **day-14-15-checklist.md** | Quick reference checklist | Active work — print & check off boxes |

---

## 🚀 Quick Start Workflow

### Step 1: Read Understanding (30 min)
**File:** `day-14-15-understanding.md`

- [ ] Day 14 section: Read "The Non-Negotiable Rule"
- [ ] Day 14 section: Understand "ConfigMap vs Secret"
- [ ] Day 14 section: Learn "In-Cluster DNS"
- [ ] Day 15 section: Understand "Why Helm"
- [ ] Day 15 section: Learn "Release History & Rollback"
- [ ] Answer 8 self-test questions at the end

**Goal:** Mental model is correct before touching cluster

---

### Step 2: Print Checklist (5 min)
**File:** `day-14-15-checklist.md`

- [ ] Print or open on second monitor
- [ ] Keep open while working
- [ ] Check off items as you complete them

**Goal:** Visual progress tracking; don't skip verification steps

---

### Step 3: Execute Process (3-4 hours Day 14, 2-2.5 hours Day 15)
**File:** `day-14-15-process.md`

**Day 14 Phases:**
- [ ] Phase 1: Planning (30 min)
- [ ] Phase 2: Directory Structure (5 min)
- [ ] Phase 3: ConfigMaps (45 min)
- [ ] Phase 4: Secrets (30 min)
- [ ] Phase 5: First Service Deployment (1 hour)
- [ ] Phase 6: Remaining Services (1.5-2 hours)
- [ ] Phase 7: Inter-Service DNS (30 min)
- [ ] Phase 8: Ingress (45 min)
- [ ] Phase 9: End-to-End Verification (30 min)
- [ ] Phase 10: Write Memory File (15 min)
- [ ] Phase 11: Git Commit & Report (20 min)

**Day 15 Phases:**
- [ ] Phase 1: Watch Video (30 min)
- [ ] Phase 2: Create Helm Chart (45 min)
- [ ] Phase 3: Add Bitnami Repo (10 min)
- [ ] Phase 4: Inspect Chart Values (30 min)
- [ ] Phase 5: Create Values File (15 min)
- [ ] Phase 6: Dry-Run Before Install (5 min)
- [ ] Phase 7: Install Chart (20 min)
- [ ] Phase 8: Connect Application (30 min)
- [ ] Phase 9: Helm Lifecycle (45 min)
- [ ] Phase 10: Write Memory File (15 min)
- [ ] Phase 11: Git Commit & Report (15 min)

---

## ✅ Day 14 Done Criteria

### Configuration & Deployment
- [ ] Deployment checklist from DOP completed
- [ ] ConfigMaps written + applied for all services
- [ ] No hardcoded env vars in any Deployment YAML
- [ ] Secrets created via `kubectl create secret` (no YAML in Git)
- [ ] ConfigMap wiring verified: `kubectl exec [pod] -- env | grep [KEY]`

### Service Status
- [ ] All Pods Running: `kubectl get pods` shows `Running 1/1`
- [ ] Inter-service DNS updated (no Docker Compose hostnames)
- [ ] Services can reach each other (tested with nslookup)

### Ingress & End-to-End
- [ ] Ingress applied + all paths tested with curl
- [ ] End-to-end API call made (real application logic exercised)
- [ ] Full stack screenshot: `kubectl get all`

### Documentation & Git
- [ ] `memory/kubernetes-project.md` written:
  - [ ] Service table (name, K8s name, port)
  - [ ] ConfigMap vs Secret rule (your version)
  - [ ] In-cluster DNS pattern
  - [ ] Apply order
  - [ ] Failures + fixes
- [ ] `k8s/` directory committed with all YAML files
- [ ] Git commit pushed: `Day 14 — K8s deploy: all services + ConfigMap + Secret + Ingress`
- [ ] Daily log filled + tomorrow's context block complete

---

## ✅ Day 15 Done Criteria

### Prerequisites
- [ ] Day 14 fully complete (all services Running)
- [ ] Helm installed: `helm version` shows v3.x
- [ ] Helm video watched (00:32:00 → 2:03:00)

### Learning & Setup
- [ ] `helm create myapp` run + structure understood
- [ ] Bitnami repo added: `helm repo add bitnami https://charts.bitnami.com/bitnami`
- [ ] Searched for your service: `helm search repo [redis/rabbitmq/postgresql]`

### Chart Installation
- [ ] Values file written: `k8s/my-[service]-values.yaml`
- [ ] Dry-run successful: `helm template . --debug` rendered without errors
- [ ] Chart installed: `helm install my-[service] bitnami/[chart] -f values.yaml`
- [ ] Installation verified: `helm list` shows `deployed`
- [ ] **NOTES.txt read carefully** — service hostname noted

### Application Connection
- [ ] ConfigMap updated with Helm service name
- [ ] Deployment restarted: `kubectl rollout restart deployment [app]`
- [ ] Connection tested: `kubectl exec [pod] -- redis-cli -h [service-name] ping` → PONG
- [ ] Full stack verified: `kubectl get all` shows both app + Helm services

### Helm Operations Practice
- [ ] `helm upgrade` run at least once
- [ ] Values changed + revision incremented
- [ ] `helm history [release]` shows 2+ revisions
- [ ] `helm rollback [release] [revision]` run successfully
- [ ] Post-rollback state verified: `helm history` shows new revision

### Documentation & Git
- [ ] `memory/helm-basics.md` written:
  - [ ] Three concepts (chart, release, repo)
  - [ ] Install workflow with exact commands
  - [ ] Five operations (install, upgrade, rollback, list, uninstall)
  - [ ] Values override precedence
  - [ ] How to find service name
  - [ ] Common failures + fixes
  - [ ] Project's installed charts table
- [ ] Values file committed to `k8s/my-[service]-values.yaml`
- [ ] Git commit pushed: `Day 15 — Helm intro: [chart-name] installed + memory/helm-basics.md`
- [ ] Daily log filled + tomorrow's context block complete

---

## 🎓 Interview Questions to Study

### Day 14 Questions (Answer without notes)
- [ ] Q1: ConfigMap vs Secret — rule for deciding which?
- [ ] Q2: Difference between `envFrom.configMapRef` and `env.valueFrom.configMapKeyRef`?
- [ ] Q3: Updated ConfigMap but Pod still has old value — fix?
- [ ] Q4: Pod in `CreateContainerConfigError` — cause + debug command?
- [ ] Q5: Docker Compose hostname in K8s — what changes?
- [ ] Q6: Ingress returns 502 — likely cause + debug command?
- [ ] Q7: Why never commit Secret YAML to Git (even private repo)?
- [ ] Q8: Mounting Secret as file vs env var — security difference?

### Day 15 Questions (Answer without notes)
- [ ] Q1: Chart vs Release vs Repository — define each
- [ ] Q2: After `helm install`, how to find service hostname?
- [ ] Q3: When use `--set` vs `--values`? When is `--set` wrong?
- [ ] Q4: What does `helm template . --debug` do? Why before install?
- [ ] Q5: Why StatefulSet for Redis vs Deployment?
- [ ] Q6: `helm rollback` — rewrite history or new revision?
- [ ] Q7: Redis Pod Pending — PVC issue. Quick dev fix?
- [ ] Q8: Teammate used `--set auth.password=secret123`. Two problems + fix?

---

## 📂 Folder Structure

```
daily-logs/
├── README.md (← you are here)
├── day-14-15-understanding.md     (WHY — concepts & explanations)
├── day-14-15-process.md           (HOW — detailed steps)
├── day-14-15-checklist.md         (QUICK — print & check off)
├── day-14-15.html                 (Original training brief)
├── day-13-trainer-report.txt      (Previous day report)
└── [daily logs for other days]
```

---

## 🔗 Connected Documents (In memory/)

After Day 14 completion, create:
- `memory/kubernetes-project.md` — your project's K8s reference

After Day 15 completion, create:
- `memory/helm-basics.md` — your Helm reference

---

## ⏱️ Time Budget

| Day | Phase | Time | Status |
|-----|-------|------|--------|
| 14 | Planning | 30 min | ⬜ |
| 14 | ConfigMaps | 45 min | ⬜ |
| 14 | Secrets | 30 min | ⬜ |
| 14 | First Service | 1 hr | ⬜ |
| 14 | Remaining Services | 2 hrs | ⬜ |
| 14 | DNS + Ingress | 1.5 hrs | ⬜ |
| 14 | Verification + Git | 45 min | ⬜ |
| **14 TOTAL** | | **~6.5 hours** | ⬜ |
| | | | |
| 15 | Video + Setup | 1 hr | ⬜ |
| 15 | Chart Exploration | 45 min | ⬜ |
| 15 | Install + Connection | 1 hr | ⬜ |
| 15 | Upgrade + Rollback | 45 min | ⬜ |
| 15 | Memory + Git | 30 min | ⬜ |
| **15 TOTAL** | | **~4 hours** | ⬜ |
| | | | |
| **BOTH DAYS** | | **~10.5 hours** | ⬜ |

---

## 🚨 Critical Path (Don't Skip)

1. ✅ Read understanding.md (mental model first)
2. ✅ Day 14 Phase 5 (first service) — proves the pattern works
3. ✅ Day 14 Phase 9 (end-to-end verification) — real proof
4. ✅ Day 15 Phase 8 (app connection test) — not just helm install, but working integration
5. ✅ Practice rollback on Day 15 before it's a production emergency

---

## 💡 Success Tips

### Before You Start
- [ ] Read day-14-15-understanding.md completely
- [ ] Do NOT skip any verification steps (kubectl exec, nslookup, curl tests)
- [ ] Have two terminals open (one for commands, one for kubectl -w watch)

### During Work
- [ ] Deploy one service at a time (don't dump 5 at once)
- [ ] Test connectivity before moving to next service
- [ ] Read error messages carefully (usually tells you exactly what's wrong)
- [ ] Use debugging commands from process.md when stuck

### End of Each Day
- [ ] Write memory file while fresh (captures most important lessons)
- [ ] Include failures + fixes you hit (most valuable for future)
- [ ] Don't leave without git commit + push
- [ ] Fill daily log completely (context block for next day)

---

## 📞 When Stuck

### Immediate Debugging (30 seconds)
```bash
kubectl get pods                    # See all Pods
kubectl describe pod [name]         # Full details + Events
kubectl logs [pod] --previous       # If crashed
kubectl get events --sort-by=.lastTimestamp  # Recent events
```

### ConfigMap/Secret Issues
```bash
kubectl get configmaps              # List all
kubectl get secrets                 # List all
kubectl exec [pod] -- env | grep    # Verify injected
```

### Ingress Issues
```bash
kubectl get endpoints [service]     # Should NOT be <none>
kubectl get svc                     # Verify service exists
kubectl exec [pod] -- nslookup      # Test DNS
```

### Helm Issues
```bash
helm status [release]               # Check status
helm get values [release]           # See current overrides
helm template . --debug             # Render locally
```

---

## ✨ What You'll Have After Day 15

✅ All project services running in Kubernetes (Day 14)
✅ 3rd-party service (Redis/RabbitMQ/PostgreSQL) installed via Helm (Day 15)
✅ App successfully connected to Helm service
✅ End-to-end API call working
✅ `memory/kubernetes-project.md` — K8s reference for future
✅ `memory/helm-basics.md` — Helm reference for future
✅ Understanding of: config separation, in-cluster DNS, release tracking, values precedence
✅ Experience with: kubectl, ConfigMap/Secret, Helm install/upgrade/rollback

---

**Ready to start? Open `day-14-15-understanding.md` and begin reading.** 🚀

