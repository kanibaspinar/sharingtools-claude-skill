# Account Actions — Full Reference

Base: `https://sharingtools.services/api/v1/accounts`
All endpoints require Bearer auth. `account_id` / `{id}` = np_accounts.id (integer).

---

## Per-Account Actions

### Refresh Session Cookies
`POST /accounts/{id}/refresh-cookies`
Re-logs into Instagram and refreshes the session. No body required.
Returns: `{id, username, last_login, login_required: false}`
500 if login fails (wrong password, challenge, network error).
Note: if plan has `only-custom-proxies`, account must have a proxy assigned first.

### Login Activity (read-only)
`GET /accounts/{id}/login-activity`
Returns current status without making any live Instagram call.
Returns: `{id, username, last_login, login_required (bool), proxy, mobile_proxy, country_code, platform, counter}`

### Change Proxy (single account)
`POST /accounts/{id}/change-proxy`
Body (optional): `{"proxy": "host:port"}` — omit to request a system proxy from ProxyManagerPro.
Returns: `{id, proxy}`
- 400 if account is a slave (system proxies unavailable for slave accounts)
- 409 if account already has a user-defined proxy and no new proxy value is sent
- 503 if ProxyManagerPro not installed and no proxy provided

### Change Proxy (bulk)
`POST /accounts/change-proxy/bulk`
Requires ProxyManagerPro plugin.
Body: `{"type": "main"}` — values: `main` | `slave` | `all` (default: `main`)
Accounts with `proxy_added_by_user=1` are skipped.
Returns: `{changed (int), skipped (int), total (int)}`
503 if ProxyManagerPro not installed.

### Update Password (single account — DB only, no live call)
`PATCH /accounts/{id}/password`
Body: `{"password": "new_password"}` (required)
Returns: `{id, username}`
**Important:** This updates the stored password in the DB only. It does NOT re-authenticate with Instagram. Use `/accounts/login` to re-login with the new password.

### Update Password (bulk)
`POST /accounts/password/bulk`
Body:
```json
{
  "accounts": [
    {"id": 1, "password": "new_pass_1"},
    {"id": 2, "password": "new_pass_2"}
  ]
}
```
Accounts not owned by caller are silently skipped with an error entry.
Returns: `{updated (int), errors (array of strings)}`

### Set Profile Public
`POST /accounts/{id}/set-public`
Makes a live Instagram API call. Session must be valid (`login_required=0`).
Returns: `{id, username, visibility: "public"}`
500 if Instagram API call fails.

### Set Profile Private
`POST /accounts/{id}/set-private`
Makes a live Instagram API call. Session must be valid.
Returns: `{id, username, visibility: "private"}`
500 if Instagram API call fails.

### Get 2FA Backup Codes
`GET /accounts/{id}/2fa-backup`
Makes a live Instagram API call. 2FA must be enabled on the account.
Returns: `{id, username, codes: ["code1", "code2", ...]}`
500 if 2FA not enabled, login fails, or Instagram API call fails.

### Get Account Options
`GET /accounts/{id}/options`
Read-only. No live Instagram call.
Returns:
```json
{
  "id": 42,
  "username": "myaccount",
  "slave": false,
  "child": false,
  "rpa": false,
  "engagement_mod": false,
  "login_required": false,
  "proxy": "host:port",
  "mobile_proxy": null,
  "proxy_added_by_user": 1,
  "options": {
    "country_code": "US",
    "platform": "instagram",
    "is_proxies_removed": false,
    "comment_mode": "default"
  }
}
```

---

## Admin Endpoints (admin/developer account_type only)

### List All API Keys
`GET /admin/keys?user_id=&is_active=&page=&per_page=`
Returns all keys across all users.

### Revoke Any Key
`POST /admin/keys/{id}/revoke`
Revokes any key by its ID.

### Request Logs
`GET /admin/logs?user_id=&api_key_id=&method=&status_code=&status_class=4xx|5xx&page=&per_page=`
Returns all API request logs.

### Platform Stats
`GET /admin/stats`
Returns: `{total_requests, top_endpoints (array), top_users (array by request count)}`

### All Users
`GET /admin/users?search=&is_active=&page=&per_page=`
Returns all users with their API key counts.

---

## Common Patterns

**Refresh all login_required accounts:**
```bash
# Get accounts needing re-login
curl -s ".../accounts?login_required=1" -H "Authorization: Bearer $API_KEY" | \
  python3 -c "import sys,json; [print(a['id']) for a in json.load(sys.stdin)['data']['data']]"

# Refresh each one
curl -s -X POST ".../accounts/42/refresh-cookies" -H "Authorization: Bearer $API_KEY"
```

**Bulk update passwords:**
```bash
curl -s -X POST ".../accounts/password/bulk" \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"accounts":[{"id":1,"password":"newpass1"},{"id":2,"password":"newpass2"}]}'
```

**Change proxy for all main accounts:**
```bash
curl -s -X POST ".../accounts/change-proxy/bulk" \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"type":"main"}'
```
