# 🔧 Authentication Error Fix Guide

## Problem
When trying to create a page, you get:
```
POST /api/sites/{siteId}/pages → 404/401
Response: { "message": "Unauthenticated.", "error": "Please login to access this resource." }
```

## Root Causes
1. Token not being saved correctly during OAuth callback
2. Token expired but not refreshed
3. Token is in localStorage but not being sent with API requests
4. User not logged in properly

## Solution Steps

### Step 1: Verify Current Auth Status

Visit: **http://localhost:5173/debug-auth**

This page will show you:
- ✅/❌ Token exists in localStorage
- ✅/❌ Zustand store is synced
- ✅/❌ API authentication is working

### Step 2: Clear Auth and Re-login (If Needed)

If debug page shows authentication failure:

**Option A - Manual Clear:**
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
localStorage.removeItem('token');
localStorage.removeItem('auth-storage');
window.location.href = '/login';
```

**Option B - Use Debug Page:**
1. Go to http://localhost:5173/debug-auth
2. Click "Clear Auth & Re-login" button

### Step 3: Verify Backend is Running

Make sure backend is running on http://localhost:8000:

```bash
# Check if backend is running
curl http://localhost:8000/api/auth/me

# Should get 401 if not logged in (this is correct!)
# Or user data if token is valid
```

### Step 4: Re-login via OAuth

1. Go to http://localhost:5173/login
2. Click "Login with Google`
3. Complete OAuth flow
4. You should be redirected to http://localhost:5173/auth/callback?token=...
5. Then redirected to homepage

### Step 5: Test Page Creation

After successful login:
1. Navigate to your site
2. Try creating a new page
3. Should work now!

## Common Issues & Solutions

### Issue 1: Token Exists But Still 401
**Symptoms:**
- Debug page shows token exists
- API test fails with 401

**Solution:**
```javascript
// Token is expired or invalid
// Clear and re-login:
localStorage.clear();
window.location.href = '/login';
```

### Issue 2: Redirect Loop After Login
**Symptoms:**
- After OAuth callback, keeps redirecting
- Never reaches homepage

**Solution:**
Check `authStore.js` line 42-48. Make sure `setAuth` is being called properly in `AuthCallbackPage`.

### Issue 3: CORS Error
**Symptoms:**
- Console shows CORS policy error
- Backend is unreachable

**Solution:**
Backend CORS middleware should allow localhost:5173. Check:
```bash
# In backend .env file
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost,127.0.0.1
```

### Issue 4: Sanctum Token Not Recognized
**Symptoms:**
- Token exists
- But backend says "Unauthenticated"

**Solution:**
```bash
# Clear Laravel cache
cd /backend
php artisan config:clear
php artisan cache:clear
```

## Verification Checklist

After fixing, verify:

- [ ] Visit /debug-auth → All checks pass ✅
- [ ] Can create a page without 401 error
- [ ] Page appears in the sidebar
- [ ] Can navigate to the new page

## Developer Notes

**Frontend Token Flow:**
1. User redirects to OAuth provider (Google/GitHub)
2. OAuth provider redirects to backend `/auth/google/callback`
3. Backend creates token: `$user->createToken('auth-token')->plainTextToken`
4. Backend redirects to frontend: `/auth/callback?token=xxx&user={}`
5. Frontend saves token: `localStorage.setItem('token', token)`
6. Frontend updates Zustand: `setAuth(user, token)`
7. All subsequent API calls include: `Authorization: Bearer {token}`

**Backend Token Verification:**
1. `auth:sanctum` middleware intercepts requests
2. Extracts token from `Authorization: Bearer ...` header
3. Looks up token in `personal_access_tokens` table
4. Verifies token hasn't expired
5. Loads associated user
6. Makes `$request->user()` available

**Key Files:**
- Frontend:
  - `src/api/client.js` (axios interceptor adds token)
  - `src/stores/authStore.js` (manages auth state)
  - `src/pages/AuthCallbackPage.jsx` (handles OAuth callback)
  - `src/pages/DebugAuthPage.jsx` (debugging tool)

- Backend:
  - `app/Http/Controllers/Api/AuthController.php` (creates tokens)
  - `app/Http/Middleware/HandleCors.php` (CORS)
  - `routes/api.php` (protected routes use `auth:sanctum`)
  - `config/sanctum.php` (token configuration)

## Quick Debug Commands

**Frontend (Browser Console):**
```javascript
// Check token
console.log(localStorage.getItem('token'));

// Check auth store
console.log(JSON.parse(localStorage.getItem('auth-storage')));

// Test API manually
fetch('http://localhost:8000/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Accept': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Backend (Terminal):**
```bash
# Check personal access tokens in database
php artisan tinker
> \App\Models\PersonalAccessToken::latest()->take(5)->get();

# Create test token manually
> $user = \App\Models\User::first();
> $token = $user->createToken('test')->plainTextToken;
> echo $token;
```

## Still Having Issues?

1. Check browser console for errors
2. Check backend logs: `tail -f storage/logs/laravel.log`
3. Use /debug-auth page for diagnostics
4. Verify .env variables are correct:
   ```env
   # Frontend (.env)
   VITE_API_URL=http://localhost:8000/api
   VITE_BACKEND_URL=http://localhost:8000
   
   # Backend (.env)
   FRONTEND_URL=http://localhost:5173
   SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost
   ```

---

**Last Updated:** 2026-02-14
**Status:** Ready for troubleshooting
