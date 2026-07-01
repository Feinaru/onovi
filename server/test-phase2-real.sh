#!/bin/bash

# Phase 2 QA - Real API Tests
# Tests actual server with curl commands

set -e

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0aW1lZmlsbC5sb2NhbCIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4MjkxMzEwMywiZXhwIjoxNzgyOTE2NzAzfQ.h1YDvYWxn9VSfRu05_QtcYzRzWf6riNIdK2nrjBjh4"
BASE_URL="http://localhost:3000"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    exit 1
}

info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

echo "========================================"
echo "Phase 2 QA - Real API Tests"
echo "========================================"
echo ""

# Test 1: Create Field
info "Test 1: Create Field 'QA_Test_Field'"
FIELD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "QA_Test_Field",
    "nameHebrew": "שדה בדיקה",
    "displayOrder": 999
  }')

FIELD_ID=$(echo "$FIELD_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$FIELD_ID" ]; then
    fail "Field creation failed: $FIELD_RESPONSE"
fi

pass "Field created with ID: $FIELD_ID"

# Test 2: Duplicate field (exact case) - should fail
info "Test 2: Try duplicate field (exact case)"
DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "QA_Test_Field",
    "nameHebrew": "שדה בדיקה 2"
  }')

if echo "$DUP_RESPONSE" | grep -q "already exists"; then
    pass "Exact case duplicate blocked"
else
    fail "Exact case duplicate NOT blocked: $DUP_RESPONSE"
fi

# Test 3: Duplicate field (lowercase) - should fail
info "Test 3: Try duplicate field (lowercase)"
LOWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "qa_test_field",
    "nameHebrew": "שדה בדיקה 3"
  }')

if echo "$LOWER_RESPONSE" | grep -q "already exists"; then
    pass "Case-insensitive duplicate blocked (lowercase)"
else
    fail "Case-insensitive duplicate NOT blocked (lowercase): $LOWER_RESPONSE"
fi

# Test 4: Duplicate field (uppercase) - should fail
info "Test 4: Try duplicate field (uppercase)"
UPPER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "QA_TEST_FIELD",
    "nameHebrew": "שדה בדיקה 4"
  }')

if echo "$UPPER_RESPONSE" | grep -q "already exists"; then
    pass "Case-insensitive duplicate blocked (uppercase)"
else
    fail "Case-insensitive duplicate NOT blocked (uppercase): $UPPER_RESPONSE"
fi

# Test 5: Duplicate field (extra whitespace) - should fail
info "Test 5: Try duplicate field (extra whitespace)"
SPACE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "  QA_Test_Field  ",
    "nameHebrew": "שדה בדיקה 5"
  }')

if echo "$SPACE_RESPONSE" | grep -q "already exists"; then
    pass "Whitespace-normalized duplicate blocked"
else
    fail "Whitespace normalization NOT working: $SPACE_RESPONSE"
fi

# Test 6: Create Profession
info "Test 6: Create Profession 'QA_Test_Profession'"
PROF_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/professions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"fieldId\": $FIELD_ID,
    \"name\": \"QA_Test_Profession\",
    \"nameHebrew\": \"מקצוע בדיקה\",
    \"displayOrder\": 999
  }")

PROF_ID=$(echo "$PROF_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$PROF_ID" ]; then
    fail "Profession creation failed: $PROF_RESPONSE"
fi

pass "Profession created with ID: $PROF_ID"

# Test 7: Duplicate profession (lowercase) - should fail
info "Test 7: Try duplicate profession (lowercase)"
PROF_DUP=$(curl -s -X POST "$BASE_URL/api/admin/professions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"fieldId\": $FIELD_ID,
    \"name\": \"qa_test_profession\",
    \"nameHebrew\": \"מקצוע בדיקה 2\"
  }")

if echo "$PROF_DUP" | grep -q "already exists"; then
    pass "Case-insensitive profession duplicate blocked"
else
    fail "Case-insensitive profession duplicate NOT blocked: $PROF_DUP"
fi

# Test 8: Duplicate profession (whitespace) - should fail
info "Test 8: Try duplicate profession (whitespace)"
PROF_SPACE=$(curl -s -X POST "$BASE_URL/api/admin/professions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"fieldId\": $FIELD_ID,
    \"name\": \"  QA_Test_Profession  \",
    \"nameHebrew\": \"מקצוע בדיקה 3\"
  }")

if echo "$PROF_SPACE" | grep -q "already exists"; then
    pass "Whitespace-normalized profession duplicate blocked"
else
    fail "Whitespace profession duplicate NOT blocked: $PROF_SPACE"
fi

# Test 9: Create ServiceTemplate
info "Test 9: Create ServiceTemplate 'QA_Test_Service'"
SVC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/service-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"professionId\": $PROF_ID,
    \"name\": \"QA_Test_Service\",
    \"nameHebrew\": \"שירות בדיקה\",
    \"defaultDurationMinutes\": 30,
    \"defaultPrice\": 100,
    \"displayOrder\": 999
  }")

SVC_ID=$(echo "$SVC_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$SVC_ID" ]; then
    fail "ServiceTemplate creation failed: $SVC_RESPONSE"
fi

pass "ServiceTemplate created with ID: $SVC_ID"

# Test 10: Duplicate service (lowercase) - should fail
info "Test 10: Try duplicate service (lowercase)"
SVC_DUP=$(curl -s -X POST "$BASE_URL/api/admin/service-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"professionId\": $PROF_ID,
    \"name\": \"qa_test_service\",
    \"nameHebrew\": \"שירות בדיקה 2\",
    \"defaultDurationMinutes\": 30
  }")

if echo "$SVC_DUP" | grep -q "already exists"; then
    pass "Case-insensitive service duplicate blocked"
else
    fail "Case-insensitive service duplicate NOT blocked: $SVC_DUP"
fi

# Test 11: Duplicate service (whitespace) - should fail
info "Test 11: Try duplicate service (whitespace)"
SVC_SPACE=$(curl -s -X POST "$BASE_URL/api/admin/service-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"professionId\": $PROF_ID,
    \"name\": \"  QA_Test_Service  \",
    \"nameHebrew\": \"שירות בדיקה 3\",
    \"defaultDurationMinutes\": 30
  }")

if echo "$SVC_SPACE" | grep -q "already exists"; then
    pass "Whitespace-normalized service duplicate blocked"
else
    fail "Whitespace service duplicate NOT blocked: $SVC_SPACE"
fi

# Test 12: Try to delete field with profession - should fail
info "Test 12: Try delete field with profession (should fail)"
DEL_FIELD=$(curl -s -X DELETE "$BASE_URL/api/admin/fields/$FIELD_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DEL_FIELD" | grep -q "professions"; then
    pass "Field deletion blocked when professions exist"
else
    fail "Field deletion NOT blocked: $DEL_FIELD"
fi

# Test 13: Try to delete profession with service - should fail
info "Test 13: Try delete profession with service (should fail)"
DEL_PROF=$(curl -s -X DELETE "$BASE_URL/api/admin/professions/$PROF_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DEL_PROF" | grep -q "service templates"; then
    pass "Profession deletion blocked when services exist"
else
    fail "Profession deletion NOT blocked: $DEL_PROF"
fi

# Test 14: Archive service
info "Test 14: Archive service"
ARCHIVE_SVC=$(curl -s -X PATCH "$BASE_URL/api/admin/service-templates/$SVC_ID/archive" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ARCHIVE_SVC" | grep -q '"status":"ARCHIVED"'; then
    pass "Service archived successfully"
else
    fail "Service archive failed: $ARCHIVE_SVC"
fi

# Test 15: Restore service
info "Test 15: Restore service"
RESTORE_SVC=$(curl -s -X PATCH "$BASE_URL/api/admin/service-templates/$SVC_ID/restore" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESTORE_SVC" | grep -q '"status":"ACTIVE"'; then
    pass "Service restored successfully"
else
    fail "Service restore failed: $RESTORE_SVC"
fi

# Cleanup: Delete in correct order
info "Cleanup: Deleting test data"

curl -s -X DELETE "$BASE_URL/api/admin/service-templates/$SVC_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

curl -s -X DELETE "$BASE_URL/api/admin/professions/$PROF_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

curl -s -X DELETE "$BASE_URL/api/admin/fields/$FIELD_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

pass "Cleanup completed"

echo ""
echo "========================================"
echo "All tests passed!"
echo "========================================"
