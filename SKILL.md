---
name: sharingtools
description: >
  Your Sharingtools account manager for Instagram automation. Use this skill whenever the user
  wants to manage Instagram accounts on Sharingtools — adding, logging in, updating, or deleting
  accounts; configuring and controlling Reactions Pro automation (activate, pause, stop, bulk
  operations, speed/filter settings, schedules, targets); Repost Pro; Post Actions (like/comment/follow
  jobs); Leads Finder; AI-DM; Welcome DM; First Comment; InBox; Direct Basic DMs; creating,
  scheduling, or managing Instagram posts; handling captions; viewing stats, follower growth,
  wallet balance, subscription info, or transactions; managing API keys or proxies; or checking
  the dashboard. Trigger this skill for any request mentioning Sharingtools, Instagram account
  management, reactions automation, reposting, leads, DMs, or social media scheduling via Sharingtools.
---

# Sharingtools Account Manager

**Base URL:** `https://sharingtools.services/api/v1`
**Auth header:** `Authorization: Bearer sht_<key>` (or `X-API-Key: sht_<key>`)
**Response format:** `{"result":1,"message":"...","data":{...}}` on success, `{"result":0,...}` on error
**Pagination:** `?page=1&per_page=20` (max 100)

## Reference files (read when needed)
- `references/reactions.md` — Reactions Pro: full settings fields + targets CRUD
- `references/repost.md` — Repost Pro: schedules, targets, settings, logs
- `references/modules.md` — Post Actions API, Leads Finder, AI-DM, Welcome DM, First Comment, InBox, Direct Basic
- `references/account-actions.md` — refresh-cookies, change-proxy, set-public/private, 2FA backup, password bulk, options

---

## Step 1: API Key Setup (First-Time Users)

Check for a saved key:
```bash
cat ~/.sharingtools_config.json 2>/dev/null
```

**If missing:** Tell the user — *"I need your Sharingtools API key. Find it in your dashboard under Settings → API Keys. Or I can generate one if you share your username and password."*

**To generate a key via the API (no prior key needed):**
```bash
curl -s -X POST https://sharingtools.services/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"USER","password":"PASS"}'
```
Returns `api_key` (shown once only — save it immediately).

**Save the key:**
```bash
echo '{"api_key":"sht_..."}' > ~/.sharingtools_config.json && chmod 600 ~/.sharingtools_config.json
```
Confirm to the user: *"Saved! You won't need to enter it again."*

**If the file exists:** Load silently and proceed.
```bash
API_KEY=$(python3 -c "import json; print(json.load(open('$HOME/.sharingtools_config.json'))['api_key'])")
```

To reset: delete `~/.sharingtools_config.json` and re-run setup.

---

## Making REST API Calls

Use this helper pattern for all REST calls:
```bash
API_KEY=$(python3 -c "import json; print(json.load(open('$HOME/.sharingtools_config.json'))['api_key'])")
curl -s -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  https://sharingtools.services/api/v1/ENDPOINT
```
For PATCH/POST/PUT/DELETE, add `-X METHOD -d '{"field":"value"}'`.

**Note:** MCP tools (`mcp__sharingtools__*`) are also available and handle auth automatically — prefer them for standard operations. Use REST calls for modules not covered by MCP (Repost Pro, Post Actions, Leads, AI-DM, Welcome DM, First Comment, InBox, Direct).

---

## Core Modules

### Dashboard & User
| Goal | MCP tool | REST |
|------|----------|------|
| Dashboard overview | `mcp__sharingtools__get_dashboard` | GET /dashboard |
| User profile | `mcp__sharingtools__get_user` | GET /user |
| Update name/email | `mcp__sharingtools__update_user` | PATCH /user |
| Subscription info | `mcp__sharingtools__get_subscription` | GET /user/subscription |
| Wallet balance | `mcp__sharingtools__get_wallet` | GET /wallet |
| Transactions | `mcp__sharingtools__get_transactions` | GET /wallet/transactions |
| Platform stats | `mcp__sharingtools__get_statistics` | GET /statistics |
| Packages list | `mcp__sharingtools__list_packages` | GET /packages |

### Accounts
| Goal | MCP tool | REST |
|------|----------|------|
| List all accounts | `mcp__sharingtools__list_accounts` | GET /accounts |
| Get one account | `mcp__sharingtools__get_account` | GET /accounts/{id} |
| Add account (no login) | `mcp__sharingtools__add_account` | POST /accounts |
| Live login | `mcp__sharingtools__login_account` | POST /accounts/login |
| Complete challenge | `mcp__sharingtools__complete_challenge` | POST /accounts/challenge |
| Update proxy/password | `mcp__sharingtools__update_account` | PATCH /accounts/{id} |
| Delete account | `mcp__sharingtools__delete_account` | DELETE /accounts/{id} |
| 30-day growth stats | `mcp__sharingtools__get_account_stats` | GET /statistics/accounts/{id} |

**Login flow:**
1. Call `mcp__sharingtools__login_account` (supports `twofa_secret` for auto-TOTP; `imap_server/port/username/password` for auto-email-code)
2. If response has `needs_challenge:true`, ask user for code from email/SMS — then call `mcp__sharingtools__complete_challenge` with `challenge_token` + `code`. Or pass `auto_imap:true` to fetch code automatically (may need to retry on 202)
3. If re-logging in an account with `login_required=1`, use the same login endpoint — it updates in place (HTTP 200)

**Account Actions** (refresh session, change proxy, set public/private, 2FA backup, password): see `references/account-actions.md`

### Posts
| Goal | MCP tool | REST |
|------|----------|------|
| List posts | `mcp__sharingtools__list_posts` | GET /posts?status=saved\|scheduled\|published\|failed |
| Get post | `mcp__sharingtools__get_post` | GET /posts/{id} |
| Create/schedule post | `mcp__sharingtools__create_post` | POST /posts |
| Update post | `mcp__sharingtools__update_post` | PATCH /posts/{id} |
| Delete post | `mcp__sharingtools__delete_post` | DELETE /posts/{id} |

Post body fields: `account_id` (required), `caption`, `type` (photo/video/album/reel/story), `first_comment`, `location`, `link`, `media_ids` (comma-separated), `is_scheduled` (bool), `schedule_date` (Y-m-d H:i:s)

### Captions
| Goal | MCP tool | REST |
|------|----------|------|
| List captions | `mcp__sharingtools__list_captions` | GET /captions |
| Create caption | `mcp__sharingtools__create_caption` | POST /captions |
| Update caption | `mcp__sharingtools__update_caption` | PATCH /captions/{id} |
| Delete caption | `mcp__sharingtools__delete_caption` | DELETE /captions/{id} |

Captions support spintax: `{option1|option2|option3}`

### Proxies & API Keys
| Goal | MCP tool | REST |
|------|----------|------|
| List proxies | `mcp__sharingtools__list_proxies` | GET /proxies |
| List API keys | `mcp__sharingtools__get_api_keys` | GET /keys |
| Generate new key | `mcp__sharingtools__generate_api_key` | POST /keys/generate |
| Revoke key | `mcp__sharingtools__revoke_api_key` | POST /keys/revoke |

---

## Reactions Pro

For full settings fields and target types, read `references/reactions.md`.

| Goal | MCP tool | REST |
|------|----------|------|
| List all schedules | `mcp__sharingtools__list_reactions_schedules` | GET /reactions/schedules |
| Get schedule | `mcp__sharingtools__get_reactions_schedule` | GET /reactions/schedules/{account_id} |
| Get settings | `mcp__sharingtools__get_reactions_settings` | GET /reactions/schedules/{account_id}/settings |
| Update settings | `mcp__sharingtools__update_reactions_settings` | PATCH /reactions/schedules/{account_id}/settings |
| Activate one | `mcp__sharingtools__activate_reactions` | POST /reactions/schedules/{account_id}/activate |
| Pause one | `mcp__sharingtools__pause_reactions` | POST /reactions/schedules/{account_id}/pause |
| Bulk activate all | `mcp__sharingtools__bulk_activate_reactions` | POST /reactions/schedules/bulk/activate |
| Bulk pause all | `mcp__sharingtools__bulk_pause_reactions` | POST /reactions/schedules/bulk/pause |
| Bulk stop all | `mcp__sharingtools__bulk_stop_reactions` | POST /reactions/schedules/bulk/stop |
| Logs | `mcp__sharingtools__get_reactions_logs` | GET /reactions/logs |
| Stats | `mcp__sharingtools__get_reactions_stats` | GET /reactions/stats |

Bulk body (optional): `{"account_ids":[1,2,3]}` — omit to affect all.
**Stop vs Pause:** pause prevents new cycles; stop also clears a stuck `is_running=1` flag.

---

## Advanced Modules (REST only — read reference files before using)

| Module | Reference | Key endpoints |
|--------|-----------|---------------|
| **Repost Pro** | `references/repost.md` | /repost/schedules, /repost/schedules/{id}/targets, /repost/schedules/{id}/settings |
| **Post Actions** | `references/modules.md` | /post-actions/jobs (like/comment/follow), /post-actions/logs |
| **Leads Finder** | `references/modules.md` | /leads/schedules, /leads/schedules/{id}/export |
| **AI-DM** | `references/modules.md` | /ai-dm/schedules, /ai-dm/threads, /ai-dm/threads/{id}/messages |
| **Welcome DM** | `references/modules.md` | /welcomedm/schedules |
| **First Comment** | `references/modules.md` | /first-comment/schedules |
| **InBox** | `references/modules.md` | /inbox/threads, /inbox/threads/{id}/reply |
| **Direct Basic** | `references/modules.md` | /direct/{account_id}/inbox, /direct/{id}/threads/{tid}/messages |

All advanced modules are gated on the corresponding plan module being enabled. If you get 503, the plugin isn't installed. If you get 403, the user's plan doesn't include that module.

---

## Response Tips

- Always present data in a readable summary — not raw JSON
- Flag any accounts with `login_required:1` proactively
- Confirm before any destructive action (delete, revoke, bulk stop)
- For bulk operations, show which accounts will be affected before proceeding
- `schedule_date` / `expire_date` fields: always clarify timezone with user if not specified (API uses UTC)
- When a 202 retry comes back (IMAP challenge), re-send the exact same request after a few seconds
- Pagination: default page=1, per_page=20. Remind the user if a large result is truncated
