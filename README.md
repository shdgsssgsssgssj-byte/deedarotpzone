# IVAS Data Fetcher

Automated data fetcher for IVAS system with cookie-based authentication.

## Features

- ✅ Supports HttpOnly cookies
- ✅ Automatic retry on failure
- ✅ Data backup system
- ✅ Logging system
- ✅ GitHub Actions integration
- ✅ Error handling

## Setup

### 1. Get Cookies from Browser

1. Login to https://www.ivasms.com
2. Open Developer Tools (F12)
3. Go to Network tab
4. Refresh page
5. Click any request
6. Copy full cookie string from Request Headers

### 2. Set Environment Variable

**Local:**
```bash
cp .env.example .env
# Edit .env and add your cookies
