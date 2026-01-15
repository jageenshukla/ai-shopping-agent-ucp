# UCP Proof of Concept (POC) - Implementation Plan

**Project Goal:** Create two separate applications demonstrating Universal Commerce Protocol (UCP) in action

**Last Updated:** January 15, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Application 1: UCP Seller Platform](#app1-seller)
3. [Application 2: UCP Buyer Agent](#app2-buyer)
4. [Phase 1: Basic UCP Implementation](#phase1)
5. [Phase 2: Agent-to-Agent (A2A) Protocol](#phase2)
6. [Technology Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Implementation Roadmap](#roadmap)
9. [Deployment Strategy](#deployment)

---

## Overview {#overview}

### What We're Building

**Two Separate Applications:**

1. **UCP Seller Platform** - A platform for businesses to sell products via UCP
   - Implements UCP server-side (merchant role)
   - Provides REST API endpoints for checkout
   - Handles product catalog, pricing, inventory
   - Integrates with payment processors (Stripe/PayPal)

2. **UCP Buyer Agent** - An AI agent that can purchase products via UCP
   - Implements UCP client-side (agent role)
   - Discovers UCP-enabled merchants
   - Creates checkout sessions
   - Handles user authorization and payment

### Implementation Phases

**Phase 1: Basic UCP (Core Focus)**
- UCP checkout flow (create, update, complete sessions)
- Product discovery
- Basic AP2 mandate support (simplified)
- Stripe payment integration
- Local/free operation

**Phase 2: Advanced Features (Optional)**
- Full AP2 mandate verification
- Agent-to-Agent (A2A) protocol
- Multi-merchant comparison
- MCP integration for product discovery
- Advanced agent capabilities

---

## Application 1: UCP Seller Platform {#app1-seller}

### Purpose
A web application that allows businesses to list products and sell them via UCP protocol.

### Key Features

#### Phase 1 (MVP)
- **Product Management**
  - Add/edit/delete products
  - Set prices, descriptions, images
  - Manage inventory

- **UCP Server Implementation**
  - `/.well-known/ucp` discovery endpoint
  - `POST /checkout-sessions` - Create session
  - `GET /checkout-sessions/{id}` - Retrieve session
  - `PUT /checkout-sessions/{id}` - Update session
  - `POST /checkout-sessions/{id}/complete` - Complete checkout
  - `POST /checkout-sessions/{id}/cancel` - Cancel session

- **Payment Integration**
  - Stripe integration for card payments
  - Basic AP2 mandate acceptance
  - Order confirmation and tracking

- **Dashboard**
  - View orders
  - Track sales
  - Monitor UCP requests

#### Phase 2 (Advanced)
- **A2A Integration**
  - Agent Card specification
  - Agent negotiation endpoints
  - Dynamic pricing for agents

- **MCP Server**
  - Expose products to AI models
  - Semantic search capabilities

- **Enhanced Security**
  - Full AP2 mandate verification
  - Hardware-backed key verification
  - Fraud detection

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Web Dashboard                        │
│  (React/Next.js + TypeScript + Tailwind CSS)            │
│  - Product Management UI                                │
│  - Order Management                                     │
│  - Analytics Dashboard                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Backend API Server                      │
│  (Python Flask/FastAPI or Node.js Express)              │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │         UCP Protocol Handler               │        │
│  │  - Discovery endpoint                      │        │
│  │  - Checkout session management             │        │
│  │  - State machine implementation            │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │         Business Logic Layer               │        │
│  │  - Product catalog                         │        │
│  │  - Pricing engine                          │        │
│  │  - Tax calculation                         │        │
│  │  - Inventory management                    │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │      Payment Integration Layer             │        │
│  │  - Stripe SDK                              │        │
│  │  - AP2 mandate parsing (basic)             │        │
│  │  - Payment credential handling             │        │
│  └────────────────────────────────────────────┘        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────────┐
│                     Database                             │
│  (PostgreSQL or SQLite for MVP)                         │
│  - Products                                             │
│  - Checkout Sessions                                    │
│  - Orders                                               │
│  - Customers                                            │
└─────────────────────────────────────────────────────────┘
```

### Database Schema (Simplified)

```sql
-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    image_url TEXT,
    inventory_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Checkout Sessions table
CREATE TABLE checkout_sessions (
    id UUID PRIMARY KEY,
    status VARCHAR(50) NOT NULL, -- incomplete, complete, canceled, expired
    items JSONB NOT NULL,
    buyer_info JSONB,
    shipping_address JSONB,
    total_amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_credential JSONB,
    ap2_mandate JSONB,
    continue_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    checkout_session_id UUID REFERENCES checkout_sessions(id),
    customer_email VARCHAR(255),
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2),
    currency VARCHAR(3),
    payment_status VARCHAR(50),
    fulfillment_status VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Application 2: UCP Buyer Agent {#app2-buyer}

### Purpose
An AI-powered agent that can discover products and make purchases on behalf of users via UCP.

### Key Features

#### Phase 1 (MVP)
- **Merchant Discovery**
  - Fetch `/.well-known/ucp` from merchants
  - Parse capabilities and endpoints
  - Display available products

- **UCP Client Implementation**
  - Create checkout sessions
  - Add items to cart
  - Update session with buyer info
  - Complete checkout with payment

- **User Interface**
  - Chat-based interface (CLI or Web Chat)
  - Natural language product search
  - Order confirmation flow
  - Basic authorization (simulated AP2)

- **Payment Handling**
  - Payment method input
  - Generate basic AP2 Cart Mandate
  - Send payment credential to merchant

#### Phase 2 (Advanced)
- **AI-Powered Features**
  - Integration with LLM (OpenAI, Anthropic, local)
  - Semantic product search
  - Price comparison across merchants
  - Shopping recommendations

- **A2A Capabilities**
  - Agent-to-agent negotiation
  - Bulk pricing requests
  - Automated reordering

- **Advanced Authorization**
  - Biometric simulation
  - Hardware-backed key generation
  - Full AP2 Intent Mandate support

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│               User Interface Layer                       │
│  Option A: CLI (Python/Node.js)                         │
│  Option B: Web Chat (React + WebSocket)                 │
│  Option C: Discord Bot / Telegram Bot                   │
│                                                          │
│  - Natural language input                               │
│  - Product browsing                                     │
│  - Checkout flow                                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Agent Core Engine                       │
│  (Python or TypeScript)                                 │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │         UCP Client Library                 │        │
│  │  - Discover merchants                      │        │
│  │  - Create/manage checkout sessions         │        │
│  │  - Parse UCP responses                     │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │      AI/NLP Layer (Optional Phase 1)       │        │
│  │  - OpenAI/Anthropic API integration        │        │
│  │  - OR local LLM (Ollama, LLaMA)           │        │
│  │  - Intent parsing                          │        │
│  │  - Product recommendation                  │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │      Authorization & Payment Layer         │        │
│  │  - AP2 mandate generation                  │        │
│  │  - Payment credential formatting           │        │
│  │  - User consent management                 │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │         Merchant Registry (Phase 1)        │        │
│  │  - Hardcoded list of UCP merchants         │        │
│  │  - Cache merchant capabilities             │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### User Flow Example

```
User: "I want to buy a coffee maker under $100"

Agent:
1. Queries configured UCP merchants
2. Searches product catalogs
3. Finds matches across merchants
4. Presents options with prices

Agent: "I found 3 coffee makers:
   1. Brand A - $85 at Store X
   2. Brand B - $95 at Store Y
   3. Brand C - $79 at Store X

   Which one would you like?"

User: "Get me option 1"

Agent:
1. Creates checkout session at Store X
2. Adds Brand A coffee maker to cart
3. Asks for shipping address
4. Shows total with tax/shipping
5. Requests payment authorization

Agent: "Total: $92.15 (including tax and shipping)
       Ship to: [confirms address]
       Authorize payment with your method?"

User: "Yes, confirm"

Agent:
1. Generates AP2 Cart Mandate
2. Completes checkout session
3. Receives order confirmation

Agent: "Order confirmed! Order #12345
       Expected delivery: Jan 20, 2026
       You can track at: [url]"
```

---

## Phase 1: Basic UCP Implementation {#phase1}

### Scope
Implement core UCP protocol with minimal dependencies and free/local operation.

### Features

#### Seller Platform
- ✅ REST API server (Python Flask or Node.js Express)
- ✅ UCP discovery endpoint (`/.well-known/ucp`)
- ✅ Checkout session CRUD operations
- ✅ SQLite database for MVP
- ✅ Basic product catalog (5-10 sample products)
- ✅ Stripe test mode integration
- ✅ Basic AP2 mandate acceptance (no verification)
- ✅ Simple web dashboard (optional for Phase 1)

#### Buyer Agent
- ✅ CLI-based interface
- ✅ UCP client library (fetch/parse UCP profiles)
- ✅ Checkout session management
- ✅ Merchant registry (hardcoded list)
- ✅ Simple product search (keyword matching)
- ✅ Mock AP2 mandate generation
- ✅ Payment credential formatting
- ✅ Order confirmation display

### Implementation Approach

**Minimal Dependencies:**
- Free tier services only (Stripe test mode, SQLite, etc.)
- No paid APIs required
- Can run entirely locally

**Code Complexity:**
- Seller Platform: ~500-800 lines of code
- Buyer Agent: ~400-600 lines of code
- Total implementation time: 40-60 hours

### Success Criteria

1. Seller Platform can:
   - Expose UCP discovery endpoint
   - Create and manage checkout sessions
   - Accept payments via Stripe test mode
   - Store orders in database

2. Buyer Agent can:
   - Discover UCP merchants
   - Browse products
   - Create checkout and complete purchase
   - Display order confirmation

3. End-to-End Demo:
   - Agent discovers seller
   - User requests product
   - Agent creates checkout
   - User authorizes payment
   - Order completes successfully

---

## Phase 2: Agent-to-Agent (A2A) Protocol {#phase2}

### Scope
Add advanced features including A2A negotiation, full AP2 verification, and AI integration.

### Features

#### Seller Platform Additions
- ✅ A2A Agent Card implementation
- ✅ Negotiation endpoints for agents
- ✅ Dynamic pricing rules for bulk orders
- ✅ Full AP2 mandate verification
- ✅ MCP server for product discovery
- ✅ Webhook support for order updates

#### Buyer Agent Additions
- ✅ LLM integration (OpenAI/Anthropic or local Ollama)
- ✅ Semantic product search
- ✅ Multi-merchant price comparison
- ✅ Agent-to-agent negotiation
- ✅ Intent-based shopping
- ✅ Full AP2 mandate generation with crypto signatures
- ✅ Learning from user preferences

### Advanced User Flows

**Example 1: Agent Negotiation**
```
User: "I need 100 USB cables"

Agent:
1. Discovers merchants with bulk capabilities
2. Initiates A2A negotiation
3. Requests bulk pricing

Merchant Agent: "100 USB-C cables: $2.50/unit (normally $3.50)"

User Agent: "Counter-offer: $2.25/unit for commitment"

Merchant Agent: "Accepted for orders over $200 total"

User: "Confirm"

Agent completes transaction at negotiated price.
```

**Example 2: Intent-Based Shopping**
```
User: "Keep my coffee stocked, budget $50/month"

Agent:
1. Generates AP2 Intent Mandate
2. Monitors user's coffee consumption
3. Automatically reorders when low
4. Finds best prices across merchants
5. Stays within budget
6. Sends notification after each order
```

### Success Criteria

1. Full A2A negotiation works between agents
2. AP2 mandates properly signed and verified
3. LLM can understand complex shopping intents
4. Multi-merchant comparison and optimization
5. Automated shopping scenarios work reliably

---

## Technology Stack {#tech-stack}

### Seller Platform

#### Backend Options

**Option A: Python (Recommended for POC)**
- **Framework:** Flask or FastAPI
- **Why:** Simple, great UCP samples available, easy AP2 integration
- **Libraries:**
  - `flask` or `fastapi` - Web framework
  - `stripe` - Payment processing
  - `sqlalchemy` - Database ORM
  - `uuid` - Session ID generation
  - `python-dotenv` - Environment variables

**Option B: Node.js/TypeScript**
- **Framework:** Express.js
- **Why:** TypeScript examples in UCP repo, modern async support
- **Libraries:**
  - `express` - Web framework
  - `stripe` - Payment processing
  - `prisma` or `typeorm` - Database ORM
  - `uuid` - Session ID generation
  - `dotenv` - Environment variables

#### Frontend (Optional for Phase 1)
- **Framework:** React + TypeScript or Next.js
- **Styling:** Tailwind CSS
- **State Management:** React Query + Context
- **Why:** Modern, fast development, great for dashboard

#### Database
- **Phase 1:** SQLite (zero setup, local file)
- **Phase 2:** PostgreSQL (production-ready, hosted on Render/Railway)

### Buyer Agent

#### Core Language

**Option A: Python (Recommended)**
- **Why:** Great AI/LLM libraries, simple CLI, cross-platform
- **Libraries:**
  - `requests` - HTTP client
  - `click` or `typer` - CLI framework
  - `rich` - Beautiful terminal UI
  - `openai` or `anthropic` - LLM APIs (Phase 2)
  - `cryptography` - AP2 signature generation

**Option B: TypeScript/Node.js**
- **Why:** Consistent with UCP TypeScript examples
- **Libraries:**
  - `axios` - HTTP client
  - `commander` or `yargs` - CLI framework
  - `chalk` - Terminal colors
  - `openai` - LLM integration

#### UI Options

**Phase 1:**
- CLI (Terminal-based using `rich` for Python or `chalk` for Node)

**Phase 2:**
- Web-based chat UI (React + WebSocket)
- Discord bot integration
- Telegram bot integration

#### LLM Integration (Phase 2)

**Option A: Cloud APIs**
- OpenAI GPT-4 API
- Anthropic Claude API
- **Pros:** Best quality, hosted
- **Cons:** Costs money, requires API keys

**Option B: Local LLMs**
- Ollama (LLaMA, Mistral, etc.)
- **Pros:** Free, runs locally, privacy
- **Cons:** Requires GPU, slower

**Option C: Hybrid**
- Use OpenAI for complex reasoning
- Use local LLM for simple queries
- Fallback system

### Development Tools

- **Version Control:** Git + GitHub
- **API Testing:** Postman or Thunder Client (VS Code)
- **Code Editor:** VS Code with extensions
- **Package Manager:**
  - Python: `pip` + `venv` or `poetry`
  - Node: `npm` or `pnpm`
- **Documentation:** Markdown in repo

---

## Project Structure {#project-structure}

### Repository Layout

```
ucp-poc/
├── README.md
├── LICENSE
├── .gitignore
│
├── seller-platform/              # Application 1: Seller Platform
│   ├── README.md
│   ├── requirements.txt          # Python deps
│   ├── .env.example              # Environment template
│   ├── .env                      # Local config (gitignored)
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # Flask/FastAPI app entry
│   │   ├── config.py             # Configuration
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── ucp_discovery.py  # /.well-known/ucp
│   │   │   ├── checkout.py       # Checkout session endpoints
│   │   │   ├── products.py       # Product CRUD
│   │   │   └── dashboard.py      # Web dashboard routes
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── product.py
│   │   │   ├── checkout_session.py
│   │   │   └── order.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ucp_handler.py    # UCP protocol logic
│   │   │   ├── payment.py        # Stripe integration
│   │   │   ├── pricing.py        # Price calculation
│   │   │   └── ap2_validator.py  # AP2 mandate parsing
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── database.py       # DB connection
│   │       └── helpers.py
│   │
│   ├── static/                   # Static files for dashboard
│   │   ├── css/
│   │   └── js/
│   │
│   ├── templates/                # HTML templates
│   │   ├── dashboard.html
│   │   └── orders.html
│   │
│   ├── tests/
│   │   ├── test_ucp_endpoints.py
│   │   └── test_checkout.py
│   │
│   └── .well-known/
│       └── ucp                   # UCP discovery file
│
├── buyer-agent/                  # Application 2: Buyer Agent
│   ├── README.md
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── main.py               # CLI entry point
│   │   ├── config.py
│   │   │
│   │   ├── ucp_client/
│   │   │   ├── __init__.py
│   │   │   ├── discovery.py      # Discover UCP merchants
│   │   │   ├── checkout.py       # Checkout session client
│   │   │   └── parser.py         # Parse UCP responses
│   │   │
│   │   ├── ai/                   # Phase 2
│   │   │   ├── __init__.py
│   │   │   ├── llm.py            # LLM integration
│   │   │   ├── intent.py         # Intent parsing
│   │   │   └── recommendations.py
│   │   │
│   │   ├── payment/
│   │   │   ├── __init__.py
│   │   │   ├── ap2_generator.py  # Generate AP2 mandates
│   │   │   └── credentials.py    # Payment credential handling
│   │   │
│   │   ├── merchants/
│   │   │   ├── __init__.py
│   │   │   ├── registry.py       # Merchant list
│   │   │   └── cache.py          # Cache merchant profiles
│   │   │
│   │   └── ui/
│   │       ├── __init__.py
│   │       ├── cli.py            # CLI interface
│   │       └── chat.py           # Chat interface (Phase 2)
│   │
│   └── tests/
│       ├── test_ucp_client.py
│       └── test_checkout_flow.py
│
├── shared/                       # Shared utilities
│   ├── schemas/
│   │   ├── ucp_profile.json      # UCP profile schema
│   │   ├── checkout_session.json
│   │   └── ap2_mandate.json
│   │
│   └── docs/
│       ├── API.md                # API documentation
│       ├── PHASE1.md             # Phase 1 implementation guide
│       └── PHASE2.md             # Phase 2 implementation guide
│
└── examples/                     # Example scenarios
    ├── demo_script.sh            # End-to-end demo
    ├── sample_products.json      # Sample product data
    └── test_merchants.json       # Test merchant list
```

---

## Implementation Roadmap {#roadmap}

### Phase 1: Core UCP Implementation (MVP)

**Timeline:** 4-6 weeks (part-time) or 2-3 weeks (full-time)

#### Week 1-2: Seller Platform Backend
- [ ] Set up project structure
- [ ] Implement UCP discovery endpoint
- [ ] Create database models and migrations
- [ ] Implement product CRUD API
- [ ] Implement checkout session endpoints
- [ ] Add Stripe test mode integration
- [ ] Basic AP2 mandate acceptance
- [ ] Add sample product data

**Deliverable:** Working UCP server that can handle checkout sessions

#### Week 2-3: Buyer Agent Core
- [ ] Set up project structure
- [ ] Implement UCP client library
- [ ] Create merchant registry system
- [ ] Build CLI interface
- [ ] Implement product search
- [ ] Create checkout flow
- [ ] Generate basic AP2 mandates
- [ ] Format payment credentials

**Deliverable:** Working CLI agent that can buy products

#### Week 3-4: Integration & Testing
- [ ] End-to-end testing
- [ ] Bug fixes and refinements
- [ ] Add error handling
- [ ] Write documentation
- [ ] Create demo script
- [ ] Record demo video

**Deliverable:** Fully working POC with documentation

#### Week 4: Polish & Demo
- [ ] Add seller dashboard (optional)
- [ ] Improve CLI user experience
- [ ] Add logging and monitoring
- [ ] Prepare demo scenarios
- [ ] Write blog post about implementation
- [ ] Share on social media

**Deliverable:** Polished demo ready to showcase

### Phase 2: Advanced Features (Optional)

**Timeline:** 4-6 weeks additional

#### Week 5-6: A2A Protocol
- [ ] Implement Agent Card specification
- [ ] Add negotiation endpoints
- [ ] Create agent-to-agent communication
- [ ] Dynamic pricing rules
- [ ] Bulk order handling

#### Week 7-8: AI/LLM Integration
- [ ] Integrate OpenAI or local LLM
- [ ] Natural language understanding
- [ ] Semantic product search
- [ ] Multi-merchant comparison
- [ ] Shopping recommendations

#### Week 9-10: Advanced Security
- [ ] Full AP2 mandate verification
- [ ] Cryptographic signature generation
- [ ] Hardware-backed key support
- [ ] Fraud detection rules

---

## Deployment Strategy {#deployment}

### Phase 1 Deployment

#### Seller Platform

**Option A: Local Development**
- Run on localhost
- SQLite database
- Perfect for testing and demo

**Option B: Free Cloud Hosting**
- **Backend:**
  - Render.com (free tier)
  - Railway.app (free tier)
  - Fly.io (free tier)
- **Database:**
  - Render PostgreSQL (free tier)
  - Supabase (free tier)
- **Domain:**
  - Use provided subdomain
  - Or custom domain via Cloudflare (free)

**Setup Steps:**
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy
5. Configure Stripe webhooks

#### Buyer Agent

**Local CLI:**
- No deployment needed
- Users run locally with `python agent/main.py`
- Configuration via `.env` file

**Optional Web Interface:**
- Deploy React frontend to:
  - Vercel (free)
  - Netlify (free)
  - Cloudflare Pages (free)

### Phase 2 Deployment

**Production-Ready Options:**
- AWS EC2 + RDS
- Google Cloud Run + Cloud SQL
- DigitalOcean App Platform
- Heroku (paid tiers)

**Considerations:**
- SSL certificates (Let's Encrypt free)
- Domain name (optional, ~$10/year)
- Monitoring (Sentry free tier)
- Analytics (PostHog free tier)

---

## Cost Breakdown

### Phase 1 Costs

**Completely Free Option:**
- Seller Platform: Render/Railway free tier
- Database: SQLite (local) or free PostgreSQL
- Buyer Agent: Run locally (CLI)
- Stripe: Test mode (free)
- **Total: $0/month**

**With Custom Domain:**
- Domain: ~$10-15/year
- Everything else free
- **Total: ~$1.25/month**

### Phase 2 Costs

**With LLM Integration:**
- OpenAI API: ~$5-20/month (depending on usage)
- OR Ollama (local LLM): Free but requires GPU

**With Production Hosting:**
- Render/Railway paid: $7-20/month
- Database: $5-10/month
- **Total: ~$17-50/month**

**Budget-Conscious Approach:**
- Use free tiers
- Local LLM (Ollama)
- Deploy only when needed
- **Can stay under $5/month**

---

## Success Metrics

### Phase 1 Metrics
- [ ] Seller platform can handle 10+ products
- [ ] End-to-end checkout completes in <30 seconds
- [ ] Agent can discover and buy from seller
- [ ] Full UCP compliance (validated against spec)
- [ ] Zero-cost operation possible
- [ ] Documentation complete enough for others to replicate

### Phase 2 Metrics
- [ ] LLM successfully interprets natural language requests
- [ ] Agent-to-agent negotiation works across merchants
- [ ] Multi-merchant price comparison accurate
- [ ] Full AP2 verification passes
- [ ] Can handle 100+ transactions/day
- [ ] Code is open-sourced and documented

---

## Risk Mitigation

### Technical Risks

**Risk:** UCP specification is complex
**Mitigation:** Start with minimal implementation, reference official samples

**Risk:** Payment integration issues
**Mitigation:** Use Stripe test mode extensively, implement proper error handling

**Risk:** AP2 verification is difficult
**Mitigation:** Phase 1 uses basic acceptance, Phase 2 adds full verification

**Risk:** LLM costs too high
**Mitigation:** Use local LLM (Ollama), implement caching, rate limiting

### Scope Risks

**Risk:** Feature creep
**Mitigation:** Strict phase separation, MVP-first approach

**Risk:** Taking too long
**Mitigation:** Time-box each phase, prioritize working demo over perfection

---

## Next Steps

### Immediate Actions

1. **Choose Technology Stack**
   - Recommended: Python for both (consistency)
   - Alternative: Python backend, TypeScript agent

2. **Set Up Development Environment**
   - Install Python 3.11+
   - Install VS Code + extensions
   - Set up virtual environment
   - Install Stripe CLI for testing

3. **Create GitHub Repository**
   - Initialize with README
   - Add license (Apache 2.0 to match UCP)
   - Set up project structure

4. **Start with Seller Platform**
   - Implement UCP discovery first
   - Add checkout endpoints
   - Test with curl/Postman

5. **Build Buyer Agent**
   - Create UCP client library
   - Test against seller platform
   - Build CLI interface

### Questions to Answer

1. **Which technology stack do you prefer?**
   - Python or TypeScript/Node.js?
   - CLI or web UI for agent?

2. **What's your primary goal?**
   - Learning UCP protocol?
   - Building a real product?
   - Creating educational content?

3. **How much time can you dedicate?**
   - Determines if we do Phase 1 only or both phases
   - Affects technology choices (simpler vs. more robust)

4. **Do you want to open-source this?**
   - If yes, we'll prioritize documentation
   - Add contribution guidelines
   - MIT or Apache 2.0 license

---

## Conclusion

This POC plan provides a complete roadmap for building both a UCP seller platform and buyer agent. The phased approach allows you to:

1. **Start Simple:** Phase 1 is achievable in 2-3 weeks with free tools
2. **Prove the Concept:** Working demo of UCP in action
3. **Learn by Doing:** Hands-on experience with UCP protocol
4. **Extend Later:** Phase 2 adds advanced features when ready
5. **Share Knowledge:** Documentation and code can help others learn UCP

**The result:** Two working applications demonstrating how AI agents can buy from businesses using open protocols, with complete control over both sides of the transaction.

---

**Ready to start building? Let me know which technology stack you prefer and we can begin implementing!**
