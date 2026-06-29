#!/bin/bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"phone":"0500000001","password":"123456"}' -s | jq -r '.token')

echo "=== Creating New Valid Lead ==="
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"identifierType":"ISRAELI_ID","identifierValue":"123456782","businessName":"New Restaurant","phone":"050-7777777","source":"Website"}' \
  -s | jq '.'
