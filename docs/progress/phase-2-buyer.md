# Phase 2: Buyer Agent Progress

**Target**: 50-60 hours
**Status**: Not Started (Waiting for Phase 1 completion)
**Completed**: 0 hours

---

## Backend Setup (6h)
**Status**: ⏸️ Not Started

- [ ] Backend directory created (`buyer-agent/backend/`)
- [ ] npm initialized
- [ ] TypeScript configured
- [ ] Dependencies installed (express, axios, ws, uuid)
- [ ] `.env.example` created
- [ ] `.env` configured with seller URL

**Estimated**: 6h | **Actual**: ___h

---

## UCP Client Library (8h)
**Status**: ⏸️ Not Started

### Discovery Client (2h)
- [ ] Discovery module created (`src/ucp/discovery.ts`)
- [ ] UCPProfile interface defined
- [ ] discoverMerchant function
- [ ] hasCheckoutCapability function
- [ ] Error handling
- [ ] **Test**: Can fetch seller's UCP profile

### Checkout Client (6h)
- [ ] Checkout module created (`src/ucp/checkout.ts`)
- [ ] CheckoutSession interface
- [ ] UCPCheckoutClient class
- [ ] createSession method
- [ ] getSession method
- [ ] updateSession method
- [ ] completeCheckout method
- [ ] cancelSession method
- [ ] UCP-Agent header included
- [ ] **Test**: Can create and complete session

**Estimated**: 8h | **Actual**: ___h

---

## AP2 Mandate Generation (4h)
**Status**: ⏸️ Not Started

- [ ] AP2 module created (`src/ap2/generator.ts`)
- [ ] CartMandate interface
- [ ] generateCartMandate function
- [ ] Generates unique nonce (uuid)
- [ ] Sets timestamp
- [ ] Creates payload structure
- [ ] Generates mock signature
- [ ] generatePaymentCredential function
- [ ] **Test**: Generated mandate validates on seller

**Estimated**: 4h | **Actual**: ___h

---

## WebSocket Server (8h)
**Status**: ⏸️ Not Started

- [ ] Chat service created (`src/services/chat.ts`)
- [ ] WebSocket server setup
- [ ] Connection handling
- [ ] Message routing
- [ ] Command parsing (e.g., "buy coffee maker")
- [ ] Response formatting
- [ ] Error handling
- [ ] **Test**: Can connect and echo messages

**Estimated**: 8h | **Actual**: ___h

---

## Backend Server (4h)
**Status**: ⏸️ Not Started

- [ ] Server entry point (`src/server.ts`)
- [ ] Express app setup
- [ ] WebSocket upgrade handling
- [ ] REST endpoints for chat history
- [ ] Health check endpoint
- [ ] CORS configuration
- [ ] **Test**: Backend starts and accepts connections

**Estimated**: 4h | **Actual**: ___h

---

## Frontend Setup (8h)
**Status**: ⏸️ Not Started

- [ ] Frontend directory created (`buyer-agent/frontend/`)
- [ ] Vite + React + TypeScript initialized
- [ ] Tailwind CSS configured
- [ ] Project structure set up
- [ ] Dependencies installed
- [ ] Dev server runs
- [ ] **Test**: `npm run dev` shows default Vite page

**Estimated**: 8h | **Actual**: ___h

---

## Chat Interface (12h)
**Status**: ⏸️ Not Started

### WebSocket Hook (3h)
- [ ] useWebSocket hook created (`src/hooks/useWebSocket.ts`)
- [ ] Connection management
- [ ] Send message function
- [ ] Receive message handling
- [ ] Reconnection logic
- [ ] **Test**: Hook connects to backend

### Chat UI Components (9h)
- [ ] ChatInterface component (`src/components/ChatInterface.tsx`)
- [ ] Message list with scrolling
- [ ] Message input with send button
- [ ] Message bubbles (user vs agent)
- [ ] Typing indicator
- [ ] Loading states
- [ ] Error display
- [ ] Styled with Tailwind
- [ ] **Test**: Can send and display messages

**Estimated**: 12h | **Actual**: ___h

---

## Product Display (6h)
**Status**: ⏸️ Not Started

- [ ] ProductCard component (`src/components/ProductCard.tsx`)
- [ ] Displays product image, name, price
- [ ] Buy button
- [ ] Quantity selector
- [ ] Responsive design
- [ ] ProductList component
- [ ] Grid layout for multiple products
- [ ] **Test**: Products display nicely

**Estimated**: 6h | **Actual**: ___h

---

## Checkout Flow (10h)
**Status**: ⏸️ Not Started

### Form Components (4h)
- [ ] CheckoutFlow component (`src/components/CheckoutFlow.tsx`)
- [ ] Email input field
- [ ] Name input field
- [ ] Shipping address form (optional)
- [ ] Validation
- [ ] **Test**: Form collects user info

### Purchase Integration (6h)
- [ ] Connect chat to UCP client
- [ ] Product search command handler
- [ ] Buy command handler
- [ ] Collect buyer info flow
- [ ] Show order summary
- [ ] Confirmation step
- [ ] Generate AP2 mandate
- [ ] Complete checkout
- [ ] Display confirmation
- [ ] **Test**: Can complete full purchase

**Estimated**: 10h | **Actual**: ___h

---

## Integration & Testing (8h)
**Status**: ⏸️ Not Started

### E2E Flow (6h)
- [ ] User can type "show products"
- [ ] Agent displays product cards
- [ ] User can click "Buy"
- [ ] Agent collects email/name
- [ ] Agent shows order summary
- [ ] User confirms purchase
- [ ] Agent completes checkout
- [ ] Agent shows order confirmation
- [ ] **Test**: Full flow works end-to-end

### Error Handling (2h)
- [ ] Handle seller offline
- [ ] Handle invalid products
- [ ] Handle payment failures
- [ ] Show user-friendly errors
- [ ] **Test**: Errors display properly

**Estimated**: 8h | **Actual**: ___h

---

## Documentation (4h)
**Status**: ⏸️ Not Started

- [ ] README.md created
- [ ] Setup instructions (backend + frontend)
- [ ] Environment variables documented
- [ ] Usage instructions
- [ ] Screenshots/demo included
- [ ] Troubleshooting section

**Estimated**: 4h | **Actual**: ___h

---

## Total Progress

**Estimated Total**: 62h
**Actual Total**: ___h
**Completion**: 0% (0/11 sections)

---

## Checkpoints

**✅ Checkpoint 5**: Backend can discover seller and create sessions
**✅ Checkpoint 6**: WebSocket chat works (can send/receive)
**✅ Checkpoint 7**: End-to-end purchase completes successfully

---

## Blockers / Notes

(Add any issues or decisions here as you work)

---

## Last Updated

**Date**: January 15, 2026
**By**: Pre-implementation setup
**Next**: Wait for Phase 1 to complete
