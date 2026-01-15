# UCP Proof of Concept

**Universal Commerce Protocol** implementation demonstrating AI-agent commerce capabilities.

**Status**: 🚧 In Development (Planning Complete)

---

## Quick Links

- 📋 **Full Plan**: [`.claude/plans/melodic-tickling-abelson.md`](./.claude/plans/melodic-tickling-abelson.md)
- 📊 **Current Status**: [`STATUS.md`](./STATUS.md) ← **Check here first!**
- 📖 **UCP Reference**: [`docs/reference/UCP_AP2_Reference_Guide.md`](./docs/reference/UCP_AP2_Reference_Guide.md)

---

## Project Overview

### What This Is

A working demonstration of the Universal Commerce Protocol (UCP) consisting of:

1. **Seller Platform** - UCP-compliant REST API for businesses to sell products
   - Express.js + TypeScript
   - SQLite database
   - Stripe payment integration
   - AP2 mandate validation

2. **Buyer Agent** - AI agent that purchases products via UCP
   - React chat interface
   - WebSocket communication
   - UCP client library
   - AP2 mandate generation

### Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Buyer Agent       │         │  Seller Platform     │
│   (Web Chat UI)     │◄──HTTP─►│  (REST API)          │
│                     │         │                      │
│ - React Frontend    │         │ - UCP Endpoints      │
│ - WebSocket Client  │         │ - Stripe Integration │
│ - UCP Client        │         │ - SQLite Database    │
│ - AP2 Generator     │         │ - AP2 Validation     │
└─────────────────────┘         └──────────────────────┘
```

---

## Project Structure

```
ucp/
├── README.md                    # This file
├── STATUS.md                    # Current implementation status ⭐
├── UCP_POC_PLAN.md             # High-level POC overview
│
├── .claude/
│   └── plans/
│       └── melodic-tickling-abelson.md  # Detailed implementation plan ⭐
│
├── docs/
│   ├── reference/
│   │   └── UCP_AP2_Reference_Guide.md   # Technical reference
│   └── progress/                         # Progress tracking ⭐
│       ├── phase-1-seller.md            # Seller checklist
│       ├── phase-2-buyer.md             # Buyer checklist
│       └── daily-log.md                 # Daily progress log
│
├── blog/                        # Blog content (gitignored)
│
├── seller-platform/             # Phase 1 (to be created)
│   ├── src/
│   │   ├── routes/              # UCP API endpoints
│   │   ├── services/            # Business logic
│   │   └── db/                  # Database
│   └── tests/                   # E2E tests
│
└── buyer-agent/                 # Phase 2 (to be created)
    ├── backend/                 # UCP client + WebSocket
    └── frontend/                # React chat UI
```

---

## Timeline

**Total**: 2.5-3 weeks (100-120 hours)

- **Week 1-1.5** (50-60h): Seller Platform
- **Week 2-2.5** (50-60h): Buyer Agent with Web Chat UI

---

## Progress Tracking

### Check Implementation Status

```bash
# Quick status check
cat STATUS.md

# Detailed progress for current phase
cat docs/progress/phase-1-seller.md  # If in Phase 1
cat docs/progress/phase-2-buyer.md   # If in Phase 2

# See daily log
cat docs/progress/daily-log.md
```

### Update Progress

After each coding session:
1. Update checkboxes in `docs/progress/phase-X.md`
2. Update `STATUS.md` with current state
3. Add entry to `docs/progress/daily-log.md`
4. Commit changes

---

## How to Resume Implementation

**After restarting IDE or taking a break:**

1. **Say to Claude**: "resume implementation" or "continue UCP POC"

2. **Claude will**:
   - Read `STATUS.md` to see current phase
   - Check progress files to see what's done
   - Review git log for recent commits
   - Continue from next unchecked item

3. **You can also**:
   - Check `STATUS.md` yourself
   - Review relevant progress file
   - Run `git log --oneline -10` to see recent work

---

## Key Files for Resumption

These files make resumption seamless:

1. **STATUS.md** - High-level status at a glance
2. **docs/progress/phase-1-seller.md** - Detailed Phase 1 checklist (30+ items)
3. **docs/progress/phase-2-buyer.md** - Detailed Phase 2 checklist (40+ items)
4. **docs/progress/daily-log.md** - Daily work log with hours
5. **.claude/plans/melodic-tickling-abelson.md** - Full implementation plan

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge
- Stripe account (test mode, free)
- Git

### Starting Implementation

```bash
# 1. Check current status
cat STATUS.md

# 2. Create project directories (if not done)
mkdir -p seller-platform/{src/{routes,services,db},tests}
mkdir -p buyer-agent/{backend/src/{ucp,ap2,services},frontend/src/components}

# 3. Follow the plan
# See .claude/plans/melodic-tickling-abelson.md for step-by-step instructions

# 4. Track progress
# Update docs/progress/*.md as you complete items
```

---

## Testing

### Seller Platform

```bash
cd seller-platform
npm run dev

# In another terminal
./tests/e2e-test.sh  # Automated E2E tests
```

### Buyer Agent

```bash
# Terminal 1: Backend
cd buyer-agent/backend
npm run dev

# Terminal 2: Frontend
cd buyer-agent/frontend
npm run dev

# Open http://localhost:5173
```

### End-to-End

1. Start seller platform
2. Start buyer backend
3. Start buyer frontend
4. Open chat UI
5. Type: "show me coffee makers"
6. Click Buy
7. Complete purchase
8. Verify order in seller database

---

## Documentation

- **UCP Specification**: https://ucp.dev/specification/overview/
- **AP2 Protocol**: https://ap2-protocol.org/
- **Stripe Test Mode**: https://stripe.com/docs/testing
- **Local Reference**: `docs/reference/UCP_AP2_Reference_Guide.md`

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All 4 UCP endpoints working
- ✅ Can complete checkout with mock AP2
- ✅ Orders saved to database
- ✅ E2E test script passes

### Phase 2 Complete When:
- ✅ Web chat UI loads and connects
- ✅ Can discover seller capabilities
- ✅ Can search and display products
- ✅ Can complete purchase via chat
- ✅ Shows order confirmation

### POC Complete When:
- ✅ Can demo full flow: chat → buy → confirmed
- ✅ Order appears in seller database
- ✅ All progress files show 100%
- ✅ Demo video recorded

---

## Technologies Used

**Seller Platform**:
- TypeScript, Node.js, Express.js
- SQLite (better-sqlite3)
- Stripe SDK
- Zod (validation)

**Buyer Agent Backend**:
- TypeScript, Node.js, Express.js
- Axios (HTTP client)
- ws (WebSocket)

**Buyer Agent Frontend**:
- React, TypeScript
- Vite (build tool)
- Tailwind CSS
- WebSocket client

---

## Need Help?

1. **Implementation stuck?**
   - Check `docs/progress/phase-X.md` for next step
   - Review plan: `.claude/plans/melodic-tickling-abelson.md`

2. **UCP/AP2 questions?**
   - See `docs/reference/UCP_AP2_Reference_Guide.md`
   - Check official docs: https://ucp.dev

3. **Want to resume?**
   - Just say "resume implementation" to Claude

---

## License

This is a POC/demo project. See individual dependencies for their licenses.

---

**Last Updated**: January 15, 2026
**Current Phase**: Pre-Implementation (Planning Complete)
**Next Action**: Create project structure and begin Phase 1
