# Advanced Modules — Full Reference

Base: `https://sharingtools.services/api/v1`
All modules require the corresponding plan module to be enabled (403 = plan restriction, 503 = plugin not installed).

---

## Post Actions API
Module: "post-actions-api"
Actions: `like` | `comment` | `follow`

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| List action types | GET | /post-actions/actions |
| Create job | POST | /post-actions/jobs |
| List jobs | GET | /post-actions/jobs?status=pending\|processing\|success\|partial\|failed\|cancelled |
| Get job | GET | /post-actions/jobs/{id} |
| Cancel job | DELETE | /post-actions/jobs/{id} (only pending) |
| All run logs | GET | /post-actions/logs?post_url=&action= |
| Logs for job | GET | /post-actions/logs/{job_id} |
| Usage records | GET | /post-actions/usage?post_url=&action= |

### Create job body
```json
{
  "action": "like",
  "post_url": "https://www.instagram.com/p/CODE/",
  "count": 10
}
```
```json
{
  "action": "comment",
  "post_url": "https://www.instagram.com/p/CODE/",
  "count": 5,
  "comment_text": "Nice post!"
}
```
```json
{
  "action": "follow",
  "target_username": "johndoe",
  "count": 20
}
```
- `count`: default 10, max 10000
- For `follow`: accepts post URL (follows post owner), profile URL, or `target_username`
- Each account can only perform each action on a post once (unique constraint)

### Job status flow
`pending → processing → success | partial | failed`
`pending → cancelled` (via DELETE)
Jobs stuck in "processing" >30 min auto-reset to "pending".

### Polling pattern
```bash
# Create job
JOB_ID=$(curl -s -X POST .../post-actions/jobs \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"action":"like","post_url":"https://www.instagram.com/p/CODE/","count":10}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# Poll until done
curl -s .../post-actions/jobs/$JOB_ID -H "Authorization: Bearer $API_KEY"

# Get per-account results
curl -s ".../post-actions/logs/$JOB_ID" -H "Authorization: Bearer $API_KEY"
```

---

## Leads Finder
Module: "parser"

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| List schedules | GET | /leads/schedules |
| Get schedule | GET | /leads/schedules/{id} |
| Start schedule | POST | /leads/schedules/{id}/start |
| Stop schedule | POST | /leads/schedules/{id}/stop |
| Export leads | GET | /leads/schedules/{id}/export?page=1&per_page=1000 |
| All logs | GET | /leads/logs?account_id=&status= |
| Single log | GET | /leads/logs/{id} |
| Stats | GET | /leads/stats?account_id=&type= |

**Export:** Returns paginated list of usernames (plain strings). max per_page=5000. Returns 404 with hint if parser hasn't run yet.

**Schedule status:** running \| active \| scheduled \| inactive

**Target types (14):** people_followers, people_likers, people_following, people_followers_following, people_followers_followers, people_following_followers, people_following_following, hashtag, hashtag_likers, location, location_likers, explore, explore_likers, user_id_list

**Data fields collected (booleans):** nickname, user_id, user_link, full_name, is_business, business_category, city, link, profile_bio, followers_count, is_verified, home_country, whatsapp_number, is_new_to_instagram, is_new_to_instagram_30d

**Filters:** followers_min/max, followings_min/max, posts_min/max, last_posted_min/max (0 = no limit)

---

## AI-DM
Module: "ai-dm"

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| List schedules | GET | /ai-dm/schedules |
| Get schedule | GET | /ai-dm/schedules/{id} |
| Activate | POST | /ai-dm/schedules/{id}/activate |
| Pause | POST | /ai-dm/schedules/{id}/pause |
| All logs | GET | /ai-dm/logs?account_id=&type=&status= |
| Single log | GET | /ai-dm/logs/{id} |
| All threads | GET | /ai-dm/threads?account_id= |
| Single thread | GET | /ai-dm/threads/{id} |
| Thread messages | GET | /ai-dm/threads/{id}/messages |

**Schedule status:** running \| active \| inactive
**Note:** OpenAI api_key is never returned by the API.

**Schedule key fields:**
- `cta`: `{platform, username, spintax}` — call-to-action
- `settings.system_prompt`: the AI persona/instructions
- `settings.model`: e.g. "gpt-3.5-turbo" or "gpt-4"
- `settings.folder`: DM inbox folder ("0" = primary)
- `settings.max_per_conversation`, `max_per_day_requests`, `max_per_run_requests`, `max_per_day_messages`, `max_per_run_messages`, `max_time`

**Thread fields:** thread_v2_id, them_username, them_fullname, item_count, last_activity_at

---

## Welcome DM
Module: "welcomedm"

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| List schedules | GET | /welcomedm/schedules |
| Get schedule | GET | /welcomedm/schedules/{id} |
| Activate | POST | /welcomedm/schedules/{id}/activate |
| Pause | POST | /welcomedm/schedules/{id}/pause |
| All logs | GET | /welcomedm/logs?account_id=&status= |
| Single log | GET | /welcomedm/logs/{id} |

**Schedule key fields:**
- `messages`: JSON array of message variants (spintax supported)
- `speed`: "auto" or int 1–5
- `settings.skip_opened`, `mute_thread`, `has_attachment`, `debug_mode`
- `daily_pause`: `{enabled, from, to}`

---

## First Comment
Module: "first-comment"

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| List schedules | GET | /first-comment/schedules?account_id= |
| Get schedule | GET | /first-comment/schedules/{id} |
| Create schedule | POST | /first-comment/schedules |
| Update schedule | PATCH | /first-comment/schedules/{id} |
| Delete schedule | DELETE | /first-comment/schedules/{id} |
| Activate | POST | /first-comment/schedules/{id}/activate |
| Pause | POST | /first-comment/schedules/{id}/pause |
| All logs | GET | /first-comment/logs |
| Account logs | GET | /first-comment/logs/{account_id}?status= |

### Create body
```json
{
  "account_id": 42,
  "targets": [{"username": "target_user", "user_pk": "123456789"}],
  "comments": ["Great post!", "Love this!", "Amazing content!"],
  "is_active": true,
  "comment_mode": "random"
}
```
`comment_mode`: "random" (default) | "sequential"

**Updatable fields:** targets, comments, is_active, comment_mode

**Log fields:** account_id, status, target_username, post_code, comment_text, date

---

## InBox
Module: InboxPackageLimitService (configured per package by admin)
Requires: Multi Posting plugin + Zernio API configured.
`channel_type` values: `dm` | `comment` | `review`
Thread IDs are compound strings: `{localAccountId}_{channelType}_{base64url(remoteThreadId)}`

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| List threads | GET | /inbox/threads?channel_type=&account_id=&platform=&search=&offset=&limit= |
| Get thread + messages | GET | /inbox/threads/{compound_id} |
| Reply to thread | POST | /inbox/threads/{compound_id}/reply |
| Archive thread | POST | /inbox/threads/{compound_id}/archive |
| Unarchive thread | POST | /inbox/threads/{compound_id}/unarchive |
| List tags | GET | /inbox/tags |
| Create tag | POST | /inbox/tags |
| Delete tag | DELETE | /inbox/tags/{id} |

**List threads query params:**
- `channel_type`: dm, comment, or review (all if omitted)
- `account_id`: np_mp_accounts.id (multi-posting account)
- `platform`: instagram, facebook, tiktok, ...
- `offset`/`limit`: pagination (default limit=30, max=100)

**Thread fields:** id, platform, channel_type, participant_name, participant_handle, latest_snippet, latest_message_at, is_unread, is_archived

**Reply body:** `{"content": "reply text"}` (max 2000 chars)
400 if platform doesn't support replies or monthly reply limit reached.

**Create tag body:** `{"name":"Tag Name","color":"#3789ff"}` → 409 if name exists

---

## Direct Basic
Module: "direct-basic"
Uses native Instagram API session. `account_id` = np_accounts.id. `thread_id` = Instagram thread ID (long numeric string).

### Endpoints
| Action | Method | Path |
|--------|--------|------|
| DM inbox | GET | /direct/{account_id}/inbox?cursor=&folder=0 |
| Pending requests | GET | /direct/{account_id}/pending?cursor= |
| Thread messages | GET | /direct/{account_id}/threads/{thread_id}/messages?cursor= |
| Accept pending | POST | /direct/{account_id}/threads/{thread_id}/accept |
| Decline pending | POST | /direct/{account_id}/threads/{thread_id}/decline |
| Delete thread | POST | /direct/{account_id}/threads/{thread_id}/delete |

**folder param:** 0 = primary (default), 1 = general

**Inbox thread fields:** thread_id, thread_title, is_group, unread_count, participants, last_message (type/timestamp/text), last_activity_at, pending, archived

**Message fields:** id, type, timestamp, user_id, text, is_sent_by_me

**Pagination:** use `next_cursor` from response as `cursor` param for next page.
