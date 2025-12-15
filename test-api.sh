#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Wallet Service API ===${NC}\n"

# 1. Create first wallet
echo -e "${GREEN}1. Creating first wallet...${NC}"
WALLET1_RESPONSE=$(curl -s -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{"currency": "USD"}')
echo "$WALLET1_RESPONSE" | jq '.'
WALLET1_ID=$(echo "$WALLET1_RESPONSE" | jq -r '.data.id')
echo -e "Wallet 1 ID: ${WALLET1_ID}\n"

# 2. Create second wallet
echo -e "${GREEN}2. Creating second wallet...${NC}"
WALLET2_RESPONSE=$(curl -s -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{"currency": "USD"}')
echo "$WALLET2_RESPONSE" | jq '.'
WALLET2_ID=$(echo "$WALLET2_RESPONSE" | jq -r '.data.id')
echo -e "Wallet 2 ID: ${WALLET2_ID}\n"

# 3. Fund first wallet
echo -e "${GREEN}3. Funding first wallet with $200...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200}' | jq '.'
echo ""

# 4. Fund second wallet
echo -e "${GREEN}4. Funding second wallet with $100...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET2_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}' | jq '.'
echo ""

# 5. Transfer between wallets
echo -e "${GREEN}5. Transferring $50 from wallet 1 to wallet 2...${NC}"
curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"${WALLET2_ID}\", \"amount\": 50}" | jq '.'
echo ""

# 6. Get wallet 1 details
echo -e "${GREEN}6. Getting wallet 1 details with transaction history...${NC}"
curl -s -X GET "http://localhost:3000/wallets/${WALLET1_ID}" | jq '.'
echo ""

# 7. Get wallet 2 details
echo -e "${GREEN}7. Getting wallet 2 details with transaction history...${NC}"
curl -s -X GET "http://localhost:3000/wallets/${WALLET2_ID}" | jq '.'
echo ""

# 8. Get all wallets
echo -e "${GREEN}8. Getting all wallets...${NC}"
curl -s -X GET http://localhost:3000/wallets | jq '.'
echo ""

# 9. Test idempotency
echo -e "${GREEN}9. Testing idempotency (funding with same key twice)...${NC}"
echo "First request:"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 25, "idempotencyKey": "test-key-123"}' | jq '.'
echo ""
echo "Second request (should return same result):"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 25, "idempotencyKey": "test-key-123"}' | jq '.'
echo ""

# 10. Test error handling - insufficient balance
echo -e "${GREEN}10. Testing error handling (insufficient balance)...${NC}"
curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"${WALLET2_ID}\", \"amount\": 99999}" | jq '.'
echo ""

# 11. Test invalid wallet ID
echo -e "${GREEN}11. Testing invalid wallet ID...${NC}"
curl -s -X GET "http://localhost:3000/wallets/invalid-uuid-123" | jq '.'
echo ""

# 12. Test invalid amount (negative)
echo -e "${GREEN}12. Testing invalid amount (negative value)...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": -50}' | jq '.'
echo ""

# 13. Test invalid amount (zero)
echo -e "${GREEN}13. Testing invalid amount (zero value)...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 0}' | jq '.'
echo ""

# 14. Test transfer to same wallet
echo -e "${GREEN}14. Testing transfer to same wallet (should fail)...${NC}"
curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"${WALLET1_ID}\", \"amount\": 10}" | jq '.'
echo ""

# 15. Test invalid currency
echo -e "${GREEN}15. Testing invalid currency (should fail)...${NC}"
curl -s -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{"currency": "EUR"}' | jq '.'
echo ""

# 16. Test missing required fields
echo -e "${GREEN}16. Testing missing required fields...${NC}"
curl -s -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# 17. Test malformed JSON
echo -e "${GREEN}17. Testing malformed JSON...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": "invalid"}' | jq '.'
echo ""

# 18. Test duplicate transfer idempotency
echo -e "${GREEN}18. Testing duplicate transfer idempotency...${NC}"
echo "First transfer:"
TRANSFER1_RESPONSE=$(curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"${WALLET2_ID}\", \"amount\": 10, \"idempotencyKey\": \"transfer-key-456\"}")
echo "$TRANSFER1_RESPONSE" | jq '.'
echo ""
echo "Second transfer with same idempotency key:"
curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"${WALLET2_ID}\", \"amount\": 10, \"idempotencyKey\": \"transfer-key-456\"}" | jq '.'
echo ""

# 19. Test different idempotency key same operation
echo -e "${GREEN}19. Testing different idempotency key for same operation...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5, "idempotencyKey": "different-key-789"}' | jq '.'
echo ""

# 20. Test SQL injection attempt (security check)
echo -e "${GREEN}20. Testing SQL injection attempt (security check)...${NC}"
curl -s -X GET "http://localhost:3000/wallets/' OR '1'='1" | jq '.'
echo ""

# 21. Test XSS attempt (security check)
echo -e "${GREEN}21. Testing XSS attempt (security check)...${NC}"
curl -s -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{"currency": "<script>alert(\"xss\")</script>"}' | jq '.'
echo ""

# 22. Test very large amount (potential overflow)
echo -e "${GREEN}22. Testing very large amount (potential overflow)...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 999999999999}' | jq '.'
echo ""

# 23. Test concurrent operations simulation
echo -e "${GREEN}23. Testing concurrent operations simulation...${NC}"
# Fund wallet 1 with idempotency key
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '{"amount": 20, "idempotencyKey": "concurrent-test-1"}' | jq '.'
echo ""

# Try to transfer more than available (should fail)
curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"${WALLET2_ID}\", \"amount\": 1000}" | jq '.'
echo ""

# 24. Test transfer with non-existent wallet
echo -e "${GREEN}24. Testing transfer with non-existent wallet...${NC}"
curl -s -X POST http://localhost:3000/wallets/transfer \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\": \"${WALLET1_ID}\", \"toWalletId\": \"missing-wallet-9999\", \"amount\": 10}" | jq '.'
echo ""

# 25. Test empty request body
echo -e "${GREEN}25. Testing empty request body...${NC}"
curl -s -X POST "http://localhost:3000/wallets/${WALLET1_ID}/fund" \
  -H "Content-Type: application/json" \
  -d '' | jq '.'
echo ""

# 26. Final wallet balances
echo -e "${GREEN}26. Final wallet balances...${NC}"
echo "Wallet 1:"
curl -s -X GET "http://localhost:3000/wallets/${WALLET1_ID}" | jq '.data.wallet | {id, currency, balance}'
echo ""
echo "Wallet 2:"
curl -s -X GET "http://localhost:3000/wallets/${WALLET2_ID}" | jq '.data.wallet | {id, currency, balance}'
echo ""

echo -e "${BLUE}=== Enhanced API Testing Complete ===${NC}"
