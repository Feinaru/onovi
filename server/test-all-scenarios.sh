#!/bin/bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"phone":"0500000001","password":"123456"}' -s | jq -r '.token')

echo "=== Test 1: Valid Israeli ID ==="
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"987654327","businessName":"Cafe Example","phone":"03-1234567"}' \
  -s | jq '{id, businessName, registrationStatus, timelineEventsCount: (.timelineEvents | length)}'

echo -e "\n=== Test 2: Invalid Israeli ID ==="
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"987654321","businessName":"Bad ID","phone":"050-9999999"}' \
  -s | jq '.'

echo -e "\n=== Test 3: Duplicate ID ==="
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"987654327","businessName":"Duplicate","phone":"050-8888888"}' \
  -s | jq '.'
