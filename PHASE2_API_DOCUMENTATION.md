# Phase 2 — Admin Master Data Management API

## Overview

Admin-only REST API for managing the Field → Profession → Service Template hierarchy.

**Base URL**: `/api/admin`

**Authentication**: All endpoints require admin authentication via JWT token.

**Authorization Header**:
```
Authorization: Bearer <admin_jwt_token>
```

---

## Field Management

Base path: `/api/admin/fields`

### 1. Get All Fields

**GET** `/api/admin/fields`

**Query Parameters**:
- `status` (optional): Filter by status (DRAFT, ACTIVE, ARCHIVED)
- `search` (optional): Search in name or nameHebrew (case-insensitive)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "publicId": "uuid-here",
    "name": "Health",
    "nameHebrew": "בריאות",
    "icon": "health-icon",
    "displayOrder": 0,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "professions": 5
    }
  }
]
```

---

### 2. Get Single Field

**GET** `/api/admin/fields/:id`

**Response**: `200 OK`
```json
{
  "id": 1,
  "publicId": "uuid-here",
  "name": "Health",
  "nameHebrew": "בריאות",
  "icon": "health-icon",
  "displayOrder": 0,
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "professions": [...],
  "_count": {
    "professions": 5
  }
}
```

**Errors**:
- `404 Not Found`: Field not found

---

### 3. Create Field

**POST** `/api/admin/fields`

**Request Body**:
```json
{
  "name": "Health",
  "nameHebrew": "בריאות",
  "icon": "health-icon",
  "displayOrder": 0,
  "status": "ACTIVE"
}
```

**Required**: `name`, `nameHebrew`
**Optional**: `icon`, `displayOrder` (default: 0), `status` (default: ACTIVE)

**Response**: `201 Created`
```json
{
  "id": 1,
  "publicId": "uuid-here",
  "name": "Health",
  "nameHebrew": "בריאות",
  "icon": "health-icon",
  "displayOrder": 0,
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors**:
- `400 Bad Request`: Name and nameHebrew are required
- `400 Bad Request`: Field with this name already exists

---

### 4. Update Field

**PATCH** `/api/admin/fields/:id`

**Request Body** (all optional):
```json
{
  "name": "Updated Health",
  "nameHebrew": "בריאות מעודכנת",
  "icon": "new-icon",
  "displayOrder": 1,
  "status": "ARCHIVED"
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "publicId": "uuid-here",
  "name": "Updated Health",
  "nameHebrew": "בריאות מעודכנת",
  ...
}
```

**Errors**:
- `404 Not Found`: Field not found
- `400 Bad Request`: Field with this name already exists

---

### 5. Archive Field

**PATCH** `/api/admin/fields/:id/archive`

Sets field status to ARCHIVED.

**Response**: `200 OK`

---

### 6. Restore Field

**PATCH** `/api/admin/fields/:id/restore`

Sets field status to ACTIVE.

**Response**: `200 OK`

---

### 7. Delete Field

**DELETE** `/api/admin/fields/:id`

**Response**: `200 OK`
```json
{
  "message": "Field deleted successfully"
}
```

**Errors**:
- `404 Not Found`: Field not found
- `400 Bad Request`: Cannot delete field with existing professions

---

## Profession Management

Base path: `/api/admin/professions`

### 1. Get All Professions

**GET** `/api/admin/professions`

**Query Parameters**:
- `fieldId` (optional): Filter by parent field
- `status` (optional): Filter by status (DRAFT, ACTIVE, ARCHIVED)
- `search` (optional): Search in name or nameHebrew (case-insensitive)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "publicId": "uuid-here",
    "fieldId": 1,
    "name": "Doctor",
    "nameHebrew": "רופא",
    "displayOrder": 0,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "field": {
      "id": 1,
      "name": "Health",
      "nameHebrew": "בריאות"
    },
    "_count": {
      "serviceTemplates": 10
    }
  }
]
```

---

### 2. Get Single Profession

**GET** `/api/admin/professions/:id`

**Response**: `200 OK`
```json
{
  "id": 1,
  "publicId": "uuid-here",
  "fieldId": 1,
  "name": "Doctor",
  "nameHebrew": "רופא",
  "displayOrder": 0,
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "field": {
    "id": 1,
    "name": "Health",
    "nameHebrew": "בריאות",
    "status": "ACTIVE"
  },
  "serviceTemplates": [...],
  "_count": {
    "serviceTemplates": 10
  }
}
```

**Errors**:
- `404 Not Found`: Profession not found

---

### 3. Create Profession

**POST** `/api/admin/professions`

**Request Body**:
```json
{
  "fieldId": 1,
  "name": "Doctor",
  "nameHebrew": "רופא",
  "displayOrder": 0,
  "status": "ACTIVE"
}
```

**Required**: `fieldId`, `name`, `nameHebrew`
**Optional**: `displayOrder` (default: 0), `status` (default: ACTIVE)

**Response**: `201 Created`

**Errors**:
- `400 Bad Request`: fieldId, name and nameHebrew are required
- `400 Bad Request`: Field not found
- `400 Bad Request`: Profession with this name already exists in this field

---

### 4. Update Profession

**PATCH** `/api/admin/professions/:id`

**Request Body** (all optional):
```json
{
  "fieldId": 2,
  "name": "Updated Doctor",
  "nameHebrew": "רופא מעודכן",
  "displayOrder": 1,
  "status": "ARCHIVED"
}
```

**Response**: `200 OK`

**Errors**:
- `404 Not Found`: Profession not found
- `400 Bad Request`: Field not found
- `400 Bad Request`: Profession with this name already exists in this field

---

### 5. Archive Profession

**PATCH** `/api/admin/professions/:id/archive`

Sets profession status to ARCHIVED.

**Response**: `200 OK`

---

### 6. Restore Profession

**PATCH** `/api/admin/professions/:id/restore`

Sets profession status to ACTIVE.

**Response**: `200 OK`

---

### 7. Delete Profession

**DELETE** `/api/admin/professions/:id`

**Response**: `200 OK`
```json
{
  "message": "Profession deleted successfully"
}
```

**Errors**:
- `404 Not Found`: Profession not found
- `400 Bad Request`: Cannot delete profession with existing service templates

---

## Service Template Management

Base path: `/api/admin/service-templates`

### 1. Get All Service Templates

**GET** `/api/admin/service-templates`

**Query Parameters**:
- `professionId` (optional): Filter by parent profession
- `status` (optional): Filter by status (DRAFT, ACTIVE, ARCHIVED)
- `colorLevel` (optional): Filter by color level (GREEN, YELLOW, RED)
- `search` (optional): Search in name, nameHebrew or description (case-insensitive)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "publicId": "uuid-here",
    "professionId": 1,
    "name": "General Checkup",
    "nameHebrew": "בדיקה כללית",
    "description": "Annual health checkup",
    "defaultDurationMinutes": 30,
    "defaultPrice": 150,
    "colorLevel": "GREEN",
    "colorNote": "Low risk",
    "displayOrder": 0,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "profession": {
      "id": 1,
      "name": "Doctor",
      "nameHebrew": "רופא",
      "field": {
        "id": 1,
        "name": "Health",
        "nameHebrew": "בריאות"
      }
    },
    "_count": {
      "businessServices": 5
    }
  }
]
```

---

### 2. Get Single Service Template

**GET** `/api/admin/service-templates/:id`

**Response**: `200 OK`
```json
{
  "id": 1,
  "publicId": "uuid-here",
  "professionId": 1,
  "name": "General Checkup",
  "nameHebrew": "בדיקה כללית",
  "description": "Annual health checkup",
  "defaultDurationMinutes": 30,
  "defaultPrice": 150,
  "colorLevel": "GREEN",
  "colorNote": "Low risk",
  "displayOrder": 0,
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "profession": {
    "id": 1,
    "name": "Doctor",
    "nameHebrew": "רופא",
    "status": "ACTIVE",
    "field": {
      "id": 1,
      "name": "Health",
      "nameHebrew": "בריאות",
      "status": "ACTIVE"
    }
  },
  "documentRequirements": [...],
  "_count": {
    "businessServices": 5
  }
}
```

**Errors**:
- `404 Not Found`: Service template not found

---

### 3. Create Service Template

**POST** `/api/admin/service-templates`

**Request Body**:
```json
{
  "professionId": 1,
  "name": "General Checkup",
  "nameHebrew": "בדיקה כללית",
  "description": "Annual health checkup",
  "defaultDurationMinutes": 30,
  "defaultPrice": 150,
  "colorLevel": "GREEN",
  "colorNote": "Low risk",
  "displayOrder": 0,
  "status": "ACTIVE"
}
```

**Required**: `professionId`, `name`, `nameHebrew`, `defaultDurationMinutes`
**Optional**: `description`, `defaultPrice`, `colorLevel` (default: GREEN), `colorNote`, `displayOrder` (default: 0), `status` (default: ACTIVE)

**Response**: `201 Created`

**Errors**:
- `400 Bad Request`: professionId, name, nameHebrew and defaultDurationMinutes are required
- `400 Bad Request`: defaultDurationMinutes must be positive
- `400 Bad Request`: defaultPrice cannot be negative
- `400 Bad Request`: colorLevel must be GREEN, YELLOW or RED
- `400 Bad Request`: Profession not found
- `400 Bad Request`: Service template with this name already exists in this profession

---

### 4. Update Service Template

**PATCH** `/api/admin/service-templates/:id`

**Request Body** (all optional):
```json
{
  "professionId": 2,
  "name": "Updated Checkup",
  "nameHebrew": "בדיקה מעודכנת",
  "description": "Updated description",
  "defaultDurationMinutes": 45,
  "defaultPrice": 200,
  "colorLevel": "YELLOW",
  "colorNote": "Medium risk",
  "displayOrder": 1,
  "status": "ARCHIVED"
}
```

**Response**: `200 OK`

**Errors**:
- `404 Not Found`: Service template not found
- `400 Bad Request`: defaultDurationMinutes must be positive
- `400 Bad Request`: defaultPrice cannot be negative
- `400 Bad Request`: colorLevel must be GREEN, YELLOW or RED
- `400 Bad Request`: Profession not found
- `400 Bad Request`: Service template with this name already exists in this profession

---

### 5. Archive Service Template

**PATCH** `/api/admin/service-templates/:id/archive`

Sets service template status to ARCHIVED.

**Response**: `200 OK`

---

### 6. Restore Service Template

**PATCH** `/api/admin/service-templates/:id/restore`

Sets service template status to ACTIVE.

**Response**: `200 OK`

---

### 7. Delete Service Template

**DELETE** `/api/admin/service-templates/:id`

**Response**: `200 OK`
```json
{
  "message": "Service template deleted successfully"
}
```

**Errors**:
- `404 Not Found`: Service template not found
- `400 Bad Request`: Cannot delete service template that is used by businesses

---

## Manual API Testing Guide

### Prerequisites

1. Start the server:
```bash
cd server
npm start
```

2. Get admin JWT token:
```bash
# Login as admin user
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Copy the JWT token from the response.

3. Set token variable:
```bash
export TOKEN="your_jwt_token_here"
```

---

### Test Field Endpoints

#### 1. Create Field
```bash
curl -X POST http://localhost:5000/api/admin/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Health",
    "nameHebrew": "בריאות",
    "icon": "health-icon",
    "displayOrder": 0,
    "status": "ACTIVE"
  }'
```

#### 2. Get All Fields
```bash
curl -X GET http://localhost:5000/api/admin/fields \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Get All Fields with Filters
```bash
# Filter by status
curl -X GET "http://localhost:5000/api/admin/fields?status=ACTIVE" \
  -H "Authorization: Bearer $TOKEN"

# Search
curl -X GET "http://localhost:5000/api/admin/fields?search=health" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Get Single Field
```bash
curl -X GET http://localhost:5000/api/admin/fields/1 \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Update Field
```bash
curl -X PATCH http://localhost:5000/api/admin/fields/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Health",
    "displayOrder": 1
  }'
```

#### 6. Archive Field
```bash
curl -X PATCH http://localhost:5000/api/admin/fields/1/archive \
  -H "Authorization: Bearer $TOKEN"
```

#### 7. Restore Field
```bash
curl -X PATCH http://localhost:5000/api/admin/fields/1/restore \
  -H "Authorization: Bearer $TOKEN"
```

#### 8. Delete Field (must have no professions)
```bash
curl -X DELETE http://localhost:5000/api/admin/fields/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test Profession Endpoints

#### 1. Create Profession
```bash
curl -X POST http://localhost:5000/api/admin/professions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fieldId": 1,
    "name": "Doctor",
    "nameHebrew": "רופא",
    "displayOrder": 0,
    "status": "ACTIVE"
  }'
```

#### 2. Get All Professions
```bash
curl -X GET http://localhost:5000/api/admin/professions \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Get Professions by Field
```bash
curl -X GET "http://localhost:5000/api/admin/professions?fieldId=1" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Get Single Profession
```bash
curl -X GET http://localhost:5000/api/admin/professions/1 \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Update Profession
```bash
curl -X PATCH http://localhost:5000/api/admin/professions/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Doctor",
    "displayOrder": 1
  }'
```

#### 6. Archive Profession
```bash
curl -X PATCH http://localhost:5000/api/admin/professions/1/archive \
  -H "Authorization: Bearer $TOKEN"
```

#### 7. Restore Profession
```bash
curl -X PATCH http://localhost:5000/api/admin/professions/1/restore \
  -H "Authorization: Bearer $TOKEN"
```

#### 8. Delete Profession (must have no service templates)
```bash
curl -X DELETE http://localhost:5000/api/admin/professions/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test Service Template Endpoints

#### 1. Create Service Template
```bash
curl -X POST http://localhost:5000/api/admin/service-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "professionId": 1,
    "name": "General Checkup",
    "nameHebrew": "בדיקה כללית",
    "description": "Annual health checkup",
    "defaultDurationMinutes": 30,
    "defaultPrice": 150,
    "colorLevel": "GREEN",
    "colorNote": "Low risk",
    "displayOrder": 0,
    "status": "ACTIVE"
  }'
```

#### 2. Get All Service Templates
```bash
curl -X GET http://localhost:5000/api/admin/service-templates \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Get Service Templates with Filters
```bash
# Filter by profession
curl -X GET "http://localhost:5000/api/admin/service-templates?professionId=1" \
  -H "Authorization: Bearer $TOKEN"

# Filter by color level
curl -X GET "http://localhost:5000/api/admin/service-templates?colorLevel=GREEN" \
  -H "Authorization: Bearer $TOKEN"

# Search
curl -X GET "http://localhost:5000/api/admin/service-templates?search=checkup" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Get Single Service Template
```bash
curl -X GET http://localhost:5000/api/admin/service-templates/1 \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Update Service Template
```bash
curl -X PATCH http://localhost:5000/api/admin/service-templates/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Updated Checkup",
    "defaultDurationMinutes": 45,
    "defaultPrice": 200,
    "colorLevel": "YELLOW"
  }'
```

#### 6. Archive Service Template
```bash
curl -X PATCH http://localhost:5000/api/admin/service-templates/1/archive \
  -H "Authorization: Bearer $TOKEN"
```

#### 7. Restore Service Template
```bash
curl -X PATCH http://localhost:5000/api/admin/service-templates/1/restore \
  -H "Authorization: Bearer $TOKEN"
```

#### 8. Delete Service Template (must not be used by businesses)
```bash
curl -X DELETE http://localhost:5000/api/admin/service-templates/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Validation Rules Summary

### Fields
- `name` and `nameHebrew` are required
- `name` must be unique across all fields
- Cannot delete if field has professions

### Professions
- `fieldId`, `name`, and `nameHebrew` are required
- `fieldId` must reference an existing field
- `name` must be unique within the same field (can duplicate across different fields)
- Cannot delete if profession has service templates

### Service Templates
- `professionId`, `name`, `nameHebrew`, and `defaultDurationMinutes` are required
- `professionId` must reference an existing profession
- `defaultDurationMinutes` must be positive (> 0)
- `defaultPrice` cannot be negative (>= 0)
- `colorLevel` must be GREEN, YELLOW, or RED
- `name` must be unique within the same profession (can duplicate across different professions)
- Cannot delete if service template is used by any businesses

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

For deletion errors with counts:
```json
{
  "error": "Cannot delete field with existing professions",
  "professionCount": 5
}
```

---

## Status Codes

- `200 OK`: Successful GET, PATCH, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Validation error, duplicate, or cannot delete due to children
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not admin
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
