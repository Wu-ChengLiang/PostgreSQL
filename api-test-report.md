# API Test Report - Mingyi Platform

**Test Date**: 2025-06-16  
**Server**: http://localhost:3001

## Summary

Total endpoints tested: 8  
Successful: 6  
Failed: 2  

## Test Results

### 1. Health Check Endpoint ✅
- **Endpoint**: GET /health
- **Status Code**: 200
- **Result**: Success
- **Response Sample**:
```json
{
  "status": "ok",
  "service": "名医堂数据平台3.0",
  "timestamp": "2025-06-16T07:04:35.884Z"
}
```

### 2. Cache Stats Endpoint ✅
- **Endpoint**: GET /cache/stats
- **Status Code**: 200
- **Result**: Success
- **Response Sample**:
```json
{
  "status": "ok",
  "stats": {
    "hits": 0,
    "misses": 0,
    "sets": 0,
    "deletes": 0,
    "size": 0,
    "hitRate": "0%"
  },
  "timestamp": "2025-06-16T07:04:41.484Z"
}
```

### 3. Client - Get Stores ✅
- **Endpoint**: GET /api/v1/client/stores
- **Status Code**: 200
- **Result**: Success
- **Response Sample**: 23 stores returned, including:
  - 名医堂·肩颈腰腿特色调理（港汇店）
  - 名医堂·颈肩腰腿特色调理（宜山路店）
  - 名医堂·颈肩腰腿特色调理（关山路店）
  - And 20 more stores...

### 4. Client - Search Therapists ✅
- **Endpoint**: GET /api/v1/client/therapists/search
- **Status Code**: 200
- **Result**: Success
- **Response Sample**: 20 therapists returned with details including:
  - ID, name, position, years of experience
  - Specialties array
  - Store information
  - Honors (if any)

### 5. Client - Get Store Therapists Schedule ❌
- **Endpoint**: GET /api/v1/client/stores/:storeName/therapists-schedule
- **Status Code**: 404
- **Result**: Failed
- **Error**: 
```json
{
  "success": false,
  "error": {
    "code": "STORE_NOT_FOUND",
    "message": "未找到该门店"
  }
}
```
- **Issue**: The endpoint seems to have an issue with store name matching, even with properly URL-encoded Chinese store names.

### 6. Admin - Login ✅
- **Endpoint**: POST /api/v1/admin/login
- **Status Code**: 200
- **Result**: Success (with correct credentials)
- **Credentials Used**: 
  - Username: admin
  - Password: admin123
- **Response Sample**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "store_id": null,
      "role": "super_admin"
    }
  }
}
```
- **Note**: Initial test with password "123456" failed. The correct password is "admin123".

### 7. Admin - Get Stores ✅
- **Endpoint**: GET /api/v1/admin/stores
- **Status Code**: 200
- **Result**: Success (with authentication token)
- **Response**: Same as client stores endpoint, returns 23 stores with additional admin details

### 8. Admin - Get Therapists ✅
- **Endpoint**: GET /api/v1/admin/therapists
- **Status Code**: 200
- **Result**: Success (with authentication token)
- **Response Sample**: Paginated list of therapists with:
  - Total: 26 therapists
  - Page 1 of 2 (20 per page)
  - Detailed therapist information including store assignments

## Issues Identified

1. **Store Therapists Schedule Endpoint**: The endpoint `/api/v1/client/stores/:storeName/therapists-schedule` is returning 404 errors even with properly encoded store names. This appears to be a bug in the store lookup logic.

2. **Admin Login Error Handling**: When incorrect credentials are provided, the server returns a 500 error instead of a more appropriate 401 or 400 error.

3. **API Documentation**: The `/api-docs` endpoint returns 404, indicating that API documentation is not available at the expected URL.

## Recommendations

1. Fix the store therapists schedule endpoint to properly handle URL-encoded Chinese store names
2. Improve error handling for authentication failures to return appropriate HTTP status codes
3. Implement or fix the API documentation endpoint
4. Consider adding rate limiting information to the cache stats

## Performance Notes

- All successful endpoints responded quickly
- Database connection is established on demand and working properly
- Cache system is operational but showing no usage during tests