#!/bin/bash
echo "=== Test 1: Valid Lead Creation ==="
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0500000001","password":"123456"}' \
  -s | jq -r '.token')

curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"000000018","businessName":"Test Restaurant","phone":"050-1234567","source":"Phone Call","initialNote":"Very interested"}' \
  -s | jq '.'

echo -e "\n\n=== Test 2: Invalid Israeli ID ==="
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"000000019","businessName":"Bad ID","phone":"050-9999999"}' \
  -s | jq '.'

echo -e "\n\n=== Test 3: Duplicate Identifier ==="
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"000000018","businessName":"Duplicate","phone":"050-8888888"}' \
  -s | jq '.'
