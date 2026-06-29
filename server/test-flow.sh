#!/bin/bash
set -e
BASE_URL="http://localhost:3000"

echo "1. Server health"
curl -s "$BASE_URL" | grep -q "TimeFill"
echo "OK"

echo "2. Business login"
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"phone":"0500000002","password":"123456"}')
TOKEN=$(echo "$LOGIN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
echo "OK"

echo "3. Create business"
BUSINESS=$(curl -s -X POST "$BASE_URL/businesses" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"בדיקת QA עסק","description":"עסק בדיקה אוטומטית","phone":"0501111111","city":"רחובות","address":"בדיקה 1","categoryId":1}')
BUSINESS_ID=$(echo "$BUSINESS" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
echo "Business $BUSINESS_ID"

echo "4. Create service"
SERVICE=$(curl -s -X POST "$BASE_URL/services" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"businessId\":$BUSINESS_ID,\"name\":\"שירות QA\",\"description\":\"שירות בדיקה\",\"durationMinutes\":60,\"regularPrice\":250}")
SERVICE_ID=$(echo "$SERVICE" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
echo "Service $SERVICE_ID"

echo "5. Create slot"
SLOT=$(curl -s -X POST "$BASE_URL/slots" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"businessId\":$BUSINESS_ID,\"serviceId\":$SERVICE_ID,\"date\":\"2026-06-25\",\"startTime\":\"12:00\",\"endTime\":\"13:00\",\"regularPrice\":250,\"dealPrice\":190}")
SLOT_ID=$(echo "$SLOT" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
echo "Slot $SLOT_ID"

echo "6. Create booking"
BOOKING=$(curl -s -X POST "$BASE_URL/bookings" -H "Content-Type: application/json" -d "{\"slotId\":$SLOT_ID,\"customerName\":\"לקוח QA\",\"customerPhone\":\"0502222222\",\"customerNote\":\"בדיקה\"}")
BOOKING_ID=$(echo "$BOOKING" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
STATUS=$(echo "$BOOKING" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).status")
[ "$STATUS" = "PENDING" ] || exit 1
echo "Booking $BOOKING_ID PENDING"

echo "7. Prevent double booking"
DOUBLE=$(curl -s -o /tmp/timefill_double.json -w "%{http_code}" -X POST "$BASE_URL/bookings" -H "Content-Type: application/json" -d "{\"slotId\":$SLOT_ID,\"customerName\":\"לקוח שני\",\"customerPhone\":\"0503333333\"}")
[ "$DOUBLE" = "409" ] || (cat /tmp/timefill_double.json && exit 1)
echo "OK 409"

echo "8. Confirm booking"
CONFIRMED=$(curl -s -X PATCH "$BASE_URL/bookings/$BOOKING_ID/confirm" -H "Authorization: Bearer $TOKEN")
CONFIRMED_STATUS=$(echo "$CONFIRMED" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).status")
[ "$CONFIRMED_STATUS" = "CONFIRMED" ] || exit 1
echo "OK CONFIRMED"

echo "✅ PASS: Full authenticated TimeFill flow works"
