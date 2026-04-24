# Applimatic Phase 1 MVP — START HERE

## 🚀 You're Ready to Launch Phase 1 Development

You have everything needed to execute the 4-week MVP sprint starting **today (Week 1, Monday)**.

---

## What You Have

### 1. **Complete 4-Week Sprint Plan**
📄 File: `APPLIMATIC_4_WEEK_SPRINT_PLAN.md`
- Week-by-week breakdown
- Daily tasks with specific deliverables
- Success criteria for each day
- Risk mitigations

### 2. **Database Setup (Week 1, Monday)**
📄 Files:
- `supabase-schema.sql` — Base schema (profiles, resumes, applications)
- `supabase-schema-update.sql` — Tailored outputs
- `supabase-schema-stripe.sql` — Stripe integration fields
- `001_create_feature_gating_and_job_search.sql` — ⭐ **TODAY'S WORK**

📄 Execution Guide: `WEEK_1_MONDAY_EXECUTION_GUIDE.md`
- Step-by-step instructions
- How to verify everything worked
- Troubleshooting guide
- Testing checklist

### 3. **API Development Path (Week 1, Tue-Fri)**
Ready to build:
- `POST /api/search` — LinkedIn job search with feature gating
- `POST /api/match` — Calculate match scores (role, salary, culture fit)
- `POST /api/tailor` — Complete existing endpoint (60% done) + feature gate
- Postman collection for testing

### 4. **Frontend Development Path (Week 2, Mon-Fri)**
Ready to build:
- Search page + job results display
- Match score visualization
- Tailor preview + PDF download
- Error handling + loading states
- Responsive mobile design

### 5. **Feature Gating + Payments (Week 3, Mon-Fri)**
Ready to implement:
- Feature gating UI components
- Stripe integration + checkout
- Upgrade flow (free → starter → pro)
- Usage tracking display
- Payment success emails

---

## Your Next 4 Actions

### Action 1: TODAY (Week 1, Monday) — Database Setup
**Time**: 3-4 hours

1. Open your Supabase project
2. Go to SQL Editor
3. Run these migration files IN ORDER:
   - `supabase-schema.sql` (if not already done)
   - `supabase-schema-update.sql` (if not already done)
   - `supabase-schema-stripe.sql` (if not already done)
   - **`001_create_feature_gating_and_job_search.sql`** ← **START HERE**
4. Follow the testing steps in `WEEK_1_MONDAY_EXECUTION_GUIDE.md`
5. Verify all tests pass (database ready for APIs)

**Success Criteria**:
- ✅ 6 new tables created (package_features, feature_usage, usage_limits, job_postings, user_searches, match_results)
- ✅ 2 RPC functions created (check_feature_limit, increment_feature_usage)
- ✅ All seed data inserted (4 features with tier limits)
- ✅ All RLS policies enabled
- ✅ Tested feature gating with real user data

---

### Action 2: TUESDAY (Week 1, Tuesday) — LinkedIn API Integration
**Time**: 4-5 hours

Start here:
- Create `/lib/linkedin/client.ts` — LinkedIn API wrapper
- Create `POST /api/search` endpoint
- Implement retry logic + error handling
- Test with 5 real LinkedIn jobs

**Inputs**: Database schema from Monday (job_postings table)
**Output**: `/api/search` endpoint working, returning real jobs

---

### Action 3: WEDNESDAY (Week 1, Wednesday) — Matching Engine
**Time**: 4-5 hours

Start here:
- Create role matcher (`/lib/matching/roleMatcher.ts`)
- Create salary matcher (`/lib/matching/salaryMatcher.ts`)
- Create culture matcher (`/lib/matching/cultureMatcher.ts`)
- Create `POST /api/match` endpoint
- Test with real resume + job pairs

**Inputs**: job_postings table from LinkedIn API (Tuesday)
**Output**: `/api/match` endpoint returning match scores

---

### Action 4: THURSDAY-FRIDAY (Week 1, Thu-Fri) — Polish & Testing
**Time**: 4-5 hours

- Complete tailor endpoint (currently 60% done)
- Create API documentation (`/docs/API.md`)
- Create Postman collection for testing
- End-to-end integration tests
- Deploy API skeleton to Railway for testing

**Inputs**: All endpoints from Mon-Wed
**Output**: All backend APIs working, tested, documented, ready for frontend

---

## Quick Start Checklist

**Before You Start**:
- [ ] You have access to your Supabase project (admin role)
- [ ] Your Next.js project is cloned locally
- [ ] Node.js 18+ installed
- [ ] Git configured (ready to commit)

**Week 1, Monday (TODAY)**:
- [ ] Read `WEEK_1_MONDAY_EXECUTION_GUIDE.md`
- [ ] Open Supabase SQL Editor
- [ ] Run `001_create_feature_gating_and_job_search.sql`
- [ ] Run all verification tests
- [ ] Commit: `git add migrations && git commit -m "Add feature gating + job search schema"`

**Week 1, Tuesday**:
- [ ] Start building LinkedIn API client
- [ ] Build `/api/search` endpoint
- [ ] Test with real data
- [ ] Commit daily

---

## File Navigation

**Sprint Planning**:
- `APPLIMATIC_4_WEEK_SPRINT_PLAN.md` — Full sprint roadmap

**Database Setup** (Week 1, Mon):
- `supabase-schema.sql` — Base tables
- `supabase-schema-update.sql` — Tailored outputs
- `supabase-schema-stripe.sql` — Stripe fields
- `001_create_feature_gating_and_job_search.sql` — Feature gating + job search (TODAY)
- `WEEK_1_MONDAY_EXECUTION_GUIDE.md` — How to execute Monday

**Deliverables** (As you complete each phase):
- `APPLIMATIC_JOB_SEARCH_ARCHITECTURE.md` — Technical overview
- `MVP_IMPLEMENTATION_ROADMAP.md` — Detailed Week 1-4 tasks
- `JOB_SEARCH_QUICKSTART.md` — Quick reference guide

---

## Key Dates

| Week | Phase | Start | Status | Deliverable |
|------|-------|-------|--------|-------------|
| 1 | Backend + Database | Today | 🟢 Ready | 4 API endpoints working |
| 2 | Frontend | Apr 23 | 🟡 Planned | 3 React pages (search, match, tailor) |
| 3 | Payments | Apr 30 | 🟡 Planned | Stripe integration, upgrade flow |
| 4 | Testing + Launch | May 6 | 🟡 Planned | Live on Railway, monitoring active |

---

## Success Metrics

### Week 1 (Database + APIs)
- ✅ Database schema complete
- ✅ All 4 endpoints working (search, match, tailor, checkout skeleton)
- ✅ Feature gating enforced
- ✅ All tests passing

### Week 2 (Frontend)
- ✅ Search page displays jobs
- ✅ Match scores calculate and display
- ✅ Tailor preview + PDF download works
- ✅ Mobile responsive

### Week 3 (Payments)
- ✅ Stripe integration complete
- ✅ Free → Starter → Pro upgrade flow works
- ✅ Feature access restricted by tier
- ✅ Usage tracking displayed

### Week 4 (Launch)
- ✅ All E2E scenarios passing
- ✅ Performance optimized (<2s load, <3s API)
- ✅ Deployed to Railway
- ✅ Live and monitoring

---

## Team Allocation

**You're solo** (1 person doing all the coding):
- Mon: Database setup (3-4h)
- Tue-Fri: Backend APIs (4-5h each day)
- Next Mon-Fri: Frontend (4-5h each day)
- Next Mon-Fri: Payments + gating (4-5h each day)
- Next Mon-Fri: Testing + deployment (4-5h each day)

**Total**: ~40-50 hours over 4 weeks (10-12h/week)

---

## Critical Path Dependencies

```
MON: Database schema
  ↓
TUE: LinkedIn API (uses job_postings table)
  ↓
WED: Matching engine (uses job_postings + match_results tables)
  ↓
THU-FRI: Polish + testing
  ↓
NEXT MON: Frontend (calls /api/search, /api/match, /api/tailor)
  ↓
NEXT WEEK: Payments + gating (uses feature_usage + usage_limits tables)
  ↓
FINAL WEEK: Testing + deployment
```

**If Monday slips, everything slips.** So focus on database setup first.

---

## Support Resources

**In This Folder**:
- `WEEK_1_MONDAY_EXECUTION_GUIDE.md` — Detailed step-by-step for today
- `APPLIMATIC_4_WEEK_SPRINT_PLAN.md` — Full sprint breakdown with daily tasks
- All SQL files ready to copy/paste

**Outside This Folder**:
- Supabase docs: https://supabase.com/docs
- Next.js API routes: https://nextjs.org/docs/api-routes/introduction
- Stripe integration: https://stripe.com/docs
- Railway deployment: https://railway.app/docs

---

## Let's Go 🚀

**Right now** (next 5 minutes):
1. Read `WEEK_1_MONDAY_EXECUTION_GUIDE.md`
2. Copy the migration file `001_create_feature_gating_and_job_search.sql`
3. Paste it into Supabase SQL Editor
4. Click "Run"
5. Verify tests pass

Then **commit to GitHub**:
```bash
git add supabase/ migrations/
git commit -m "Add feature gating, job posting, and matching schema (Week 1 Monday)"
git push
```

**You're 1 hour away from having the foundation for all backend APIs.**

This is the critical path. Everything else depends on this. Once Monday is done, the rest flows.

---

**Status**: All documentation complete. Ready for execution.  
**Next Step**: Run migration file, verify tests, move to Tuesday API development.  
**Goal**: 4-week MVP launch. You've got this. 🎯
