# API Documentation - Automation Suite

## Base URL
```
http://localhost:3001/api
```

## Authentication
Hiện tại API không yêu cầu authentication. Trong production nên implement JWT tokens.

## Response Format
Tất cả API responses đều có format JSON:

### Success Response
```json
{
  "data": {...},
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Proxy Management APIs

### GET /proxy
Lấy danh sách tất cả proxy

**Response:**
```json
[
  {
    "id": 1,
    "host": "127.0.0.1",
    "port": 8080,
    "username": null,
    "password": null,
    "protocol": "http",
    "status": "untested",
    "speed": null,
    "lastTested": null,
    "isAssigned": false,
    "assignedTo": null,
    "notes": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /proxy
Tạo proxy mới

**Request Body:**
```json
{
  "host": "127.0.0.1",
  "port": 8080,
  "username": "optional",
  "password": "optional",
  "protocol": "http",
  "notes": "Optional notes"
}
```

### POST /proxy/bulk
Import nhiều proxy cùng lúc

**Request Body:**
```json
{
  "proxies": "host1:port1\nhost2:port2:user:pass"
}
```

### POST /proxy/:id/test
Test proxy cụ thể

**Response:**
```json
{
  "status": "working",
  "speed": 1234,
  "message": "Proxy is working"
}
```

### DELETE /proxy/:id
Xóa proxy

### DELETE /proxy/bulk
Xóa nhiều proxy

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

## Profile Management APIs

### GET /profile
Lấy danh sách profiles

**Response:**
```json
[
  {
    "id": 1,
    "name": "Test Profile 1",
    "fingerprint": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Linux",
      "screen": {"width": 1920, "height": 1080},
      "cpu": 8,
      "memory": 8,
      "timezone": "Asia/Ho_Chi_Minh",
      "language": "en-US",
      "webGLInfo": {
        "vendor": "Intel Inc.",
        "renderer": "Intel HD Graphics"
      }
    },
    "proxyId": null,
    "userDataDir": "/path/to/userdata",
    "status": "inactive",
    "lastUsed": null,
    "notes": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /profile
Tạo profile mới

**Request Body:**
```json
{
  "name": "Profile Name",
  "proxyId": 1,
  "notes": "Optional notes"
}
```

### POST /profile/bulk
Tạo nhiều profile cùng lúc

**Request Body:**
```json
{
  "count": 5,
  "namePrefix": "Profile",
  "assignProxies": true
}
```

### POST /profile/:id/roll-fingerprint
Tạo fingerprint mới cho profile

### POST /profile/:id/assign-proxy
Gán proxy cho profile

**Request Body:**
```json
{
  "proxyId": 1
}
```

### DELETE /profile/:id
Xóa profile

## Browser Management APIs

### GET /browser/sessions
Lấy danh sách browser sessions

**Response:**
```json
[
  {
    "id": 1,
    "profileId": 1,
    "pid": 12345,
    "wsEndpoint": "ws://localhost:9222/devtools/browser/...",
    "status": "running",
    "startedAt": "2024-01-01T00:00:00.000Z",
    "stoppedAt": null,
    "isMaster": false,
    "currentUrl": "https://example.com",
    "lastActivity": "2024-01-01T00:00:00.000Z",
    "profile": {
      "id": 1,
      "name": "Test Profile 1"
    }
  }
]
```

### POST /browser/start/:profileId
Khởi động browser với profile

**Request Body:**
```json
{
  "headless": false
}
```

### POST /browser/stop/:profileId
Dừng browser

### POST /browser/start-bulk
Khởi động nhiều browser

**Request Body:**
```json
{
  "profileIds": [1, 2, 3],
  "headless": false
}
```

### POST /browser/stop-bulk
Dừng nhiều browser

**Request Body:**
```json
{
  "profileIds": [1, 2, 3]
}
```

### POST /browser/set-master/:profileId
Đặt browser làm master

### POST /browser/add-slave/:profileId
Thêm browser vào slave group

### POST /browser/remove-slave/:profileId
Loại bỏ browser khỏi slave group

### POST /browser/execute-master
Thực thi action trên master browser

**Request Body:**
```json
{
  "action": "navigate",
  "args": ["https://example.com"]
}
```

### POST /browser/execute-slaves
Thực thi action trên tất cả slave browsers

### POST /browser/execute/:profileId
Thực thi action trên browser cụ thể

### POST /browser/cleanup
Dừng tất cả browser sessions

## Script Management APIs

### GET /script
Lấy danh sách scripts

**Response:**
```json
[
  {
    "id": 1,
    "name": "Test Script",
    "description": "Script description",
    "actions": [
      {
        "type": "navigate",
        "value": "https://example.com",
        "stopOnError": true
      }
    ],
    "schedule": "0 0 * * * *",
    "isActive": true,
    "lastRun": null,
    "runCount": 0,
    "successCount": 0,
    "failureCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /script
Tạo script mới

**Request Body:**
```json
{
  "name": "Script Name",
  "description": "Script description",
  "schedule": "0 0 * * * *",
  "actions": [
    {
      "type": "navigate",
      "value": "https://example.com",
      "stopOnError": true
    },
    {
      "type": "click",
      "selector": "#button",
      "stopOnError": true
    }
  ]
}
```

### PUT /script/:id
Cập nhật script

### DELETE /script/:id
Xóa script

### POST /script/:id/execute
Thực thi script

**Request Body:**
```json
{
  "profileIds": [1, 2, 3]
}
```

### POST /script/:id/toggle
Bật/tắt script

### GET /script/:id/history
Lấy lịch sử thực thi script

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Events
- `connection`: Kết nối thành công
- `browser_status`: Cập nhật trạng thái browser
- `script_execution`: Kết quả thực thi script
- `proxy_status`: Cập nhật trạng thái proxy
- `server_status`: Trạng thái server

### Example Event
```json
{
  "type": "browser_status",
  "data": {
    "profileId": 1,
    "status": "running",
    "url": "https://example.com"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Codes

- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `500`: Internal Server Error - Server error

## Rate Limiting
Hiện tại không có rate limiting. Trong production nên implement để tránh abuse.

## Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Tạo proxy mới
const createProxy = async () => {
  try {
    const response = await axios.post('http://localhost:3001/api/proxy', {
      host: '127.0.0.1',
      port: 8080,
      protocol: 'http'
    });
    console.log('Proxy created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Khởi động browser
const startBrowser = async (profileId) => {
  try {
    const response = await axios.post(`http://localhost:3001/api/browser/start/${profileId}`, {
      headless: false
    });
    console.log('Browser started:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Python
```python
import requests

# Tạo profile mới
def create_profile(name, proxy_id=None):
    url = 'http://localhost:3001/api/profile'
    data = {
        'name': name,
        'proxyId': proxy_id
    }
    response = requests.post(url, json=data)
    return response.json()

# Thực thi script
def execute_script(script_id, profile_ids):
    url = f'http://localhost:3001/api/script/{script_id}/execute'
    data = {
        'profileIds': profile_ids
    }
    response = requests.post(url, json=data)
    return response.json()
```

