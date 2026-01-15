#!/bin/bash

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================"
echo "UCP Seller Platform - E2E Test Script"
echo "======================================"
echo ""

echo "[1/7] Testing Health Check..."
response=$(curl -s "$BASE_URL/health")
if [[ $response == *"ok"* ]]; then
  echo -e "${GREEN}✓ Health check passed${NC}"
else
  echo -e "${RED}✗ Health check failed${NC}"
  exit 1
fi

echo ""
echo "[2/7] Testing UCP Discovery Endpoint..."
response=$(curl -s "$BASE_URL/.well-known/ucp")
if [[ $response == *"version"* ]] && [[ $response == *"checkout"* ]]; then
  echo -e "${GREEN}✓ UCP discovery endpoint working${NC}"
else
  echo -e "${RED}✗ UCP discovery failed${NC}"
  exit 1
fi

echo ""
echo "[3/7] Testing Products API..."
response=$(curl -s "$BASE_URL/api/v1/products")
if [[ $response == *"COFFEE-001"* ]]; then
  echo -e "${GREEN}✓ Products API working${NC}"
else
  echo -e "${RED}✗ Products API failed${NC}"
  exit 1
fi

echo ""
echo "[4/7] Testing Create Checkout Session..."
response=$(curl -s -X POST "$BASE_URL/api/v1/checkout-sessions" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"sku":"COFFEE-001","quantity":1}]}')

SESSION_ID=$(echo $response | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ ! -z "$SESSION_ID" ]]; then
  echo -e "${GREEN}✓ Checkout session created: $SESSION_ID${NC}"
else
  echo -e "${RED}✗ Failed to create checkout session${NC}"
  exit 1
fi

echo ""
echo "[5/7] Testing Get Checkout Session..."
response=$(curl -s "$BASE_URL/api/v1/checkout-sessions/$SESSION_ID")
if [[ $response == *"$SESSION_ID"* ]] && [[ $response == *"incomplete"* ]]; then
  echo -e "${GREEN}✓ Retrieved checkout session${NC}"
else
  echo -e "${RED}✗ Failed to retrieve checkout session${NC}"
  exit 1
fi

TOTAL_AMOUNT=$(echo $response | grep -o '"total_amount":[0-9.]*' | cut -d':' -f2)
echo "  Total amount: \$$TOTAL_AMOUNT"

echo ""
echo "[6/7] Testing Update Checkout Session..."
response=$(curl -s -X PUT "$BASE_URL/api/v1/checkout-sessions/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_info": {
      "email": "test@example.com",
      "name": "Test User"
    },
    "shipping_address": {
      "line1": "123 Test St",
      "city": "Test City",
      "state": "CA",
      "postal_code": "12345",
      "country": "US"
    }
  }')

if [[ $response == *"updated"* ]]; then
  echo -e "${GREEN}✓ Updated checkout session${NC}"
else
  echo -e "${RED}✗ Failed to update checkout session${NC}"
  exit 1
fi

echo ""
echo "[7/7] Testing Complete Checkout..."
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
NONCE=$(openssl rand -hex 16)

response=$(curl -s -X POST "$BASE_URL/api/v1/checkout-sessions/$SESSION_ID/complete" \
  -H "Content-Type: application/json" \
  -d "{
    \"ap2_mandate\": {
      \"version\": \"1.0\",
      \"type\": \"cart_mandate\",
      \"merchant_id\": \"demo-merchant-001\",
      \"session_id\": \"$SESSION_ID\",
      \"amount\": $TOTAL_AMOUNT,
      \"currency\": \"USD\",
      \"timestamp\": \"$TIMESTAMP\",
      \"nonce\": \"$NONCE\",
      \"signature\": \"mock_signature_for_testing\"
    },
    \"payment_credential\": {
      \"type\": \"card\",
      \"last4\": \"4242\"
    }
  }")

ORDER_ID=$(echo $response | grep -o '"order_id":"[^"]*"' | cut -d'"' -f4)

if [[ ! -z "$ORDER_ID" ]]; then
  echo -e "${GREEN}✓ Checkout completed successfully${NC}"
  echo "  Order ID: $ORDER_ID"
else
  echo -e "${RED}✗ Failed to complete checkout${NC}"
  echo "  Response: $response"
  exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}All tests passed! ✓${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  - Session ID: $SESSION_ID"
echo "  - Order ID: $ORDER_ID"
echo "  - Total Amount: \$$TOTAL_AMOUNT"
echo ""
