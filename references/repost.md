# Repost Pro — Full Reference

Base: `https://sharingtools.services/api/v1/repost`
Requires: Repost Pro plugin + "repost-pro" module in user plan.
`account_id` = np_accounts.id. Schedules must be created first via the web panel.

---

## Endpoints

| Action | Method | Path |
|--------|--------|------|
| List all schedules | GET | /repost/schedules |
| Get one schedule | GET | /repost/schedules/{account_id} |
| Bulk activate | POST | /repost/schedules/bulk/activate |
| Bulk pause | POST | /repost/schedules/bulk/pause |
| Activate one | POST | /repost/schedules/{account_id}/activate |
| Pause one | POST | /repost/schedules/{account_id}/pause |
| List target types | GET | /repost/targets/types |
| Get targets | GET | /repost/schedules/{account_id}/targets |
| Add target | POST | /repost/schedules/{account_id}/targets |
| Remove target | DELETE | /repost/schedules/{account_id}/targets |
| Get settings | GET | /repost/schedules/{account_id}/settings |
| Update settings | PATCH | /repost/schedules/{account_id}/settings |
| All logs | GET | /repost/logs |
| Logs for account | GET | /repost/logs/{account_id} |

Bulk body (optional): `{"account_ids":[1,2,3]}` — omit for all. Returns `{"data":{"affected":N,"account_ids":[...],"skipped":[]}}`.

---

## Target Types (13)

| type | requires_id | notes |
|------|-------------|-------|
| hashtag | false | Posts under a hashtag |
| hashtag_reels | false | Reels under a hashtag |
| location | true | id = numeric Instagram location ID |
| people | false | Posts from a specific user |
| people_reels | false | Reels from a specific user |
| music | true | id = Instagram music track ID |
| collection | true | id = Instagram collection ID |
| instagram_post | false | value = full post URL (/p/ /reel/ /tv/) |
| tiktok_hashtag | false | TikTok posts under a hashtag |
| tiktok_user | false | TikTok posts from a user |
| tiktok_keyword | false | TikTok posts matching a keyword |
| tiktok_trending | false | value = region code e.g. "US" |
| tiktok_post | false | value = TikTok video URL |

### Add target body:
```json
{"type": "hashtag", "value": "nature"}
{"type": "location", "value": "Central Park", "id": "213385402"}
{"type": "instagram_post", "value": "https://www.instagram.com/p/CODE/"}
```
409 if same type+value already exists.

### Remove target body:
```json
{"type": "hashtag", "value": "nature"}   // remove specific
{"type": "hashtag"}                        // remove ALL of this type
```
Returns `{"data":{"removed":N,"total":N}}`.

---

## Settings (PATCH /repost/schedules/{account_id}/settings)

Only send fields to change. `is_active` is read-only here — use /activate or /pause.
Returns `{"data":{"account_id":N,"updated_fields":[...]}}`.

### Schedule
| field | type | notes |
|-------|------|-------|
| speed | str | very_slow \| slow \| medium \| fast \| very_fast |
| remove_delay | int | Seconds before auto-delete (0=never, 900=15min, 3600=1h, 604800=7days) |
| daily_pause | bool | Enable daily pause |
| daily_pause_from | str HH:MM | Pause start (UTC) |
| daily_pause_to | str HH:MM | Pause end (UTC) |
| metadata_location | bool | Copy original post location tag |
| metadata_user | bool | Tag original content creator |
| collections_shuffle | bool | Shuffle media order in collections |

### Caption
| field | type | notes |
|-------|------|-------|
| caption | str | Supports spintax `({a\|b\|c}` and `{{original_caption}}` placeholder |
| first_comment | str | Posted immediately after repost; spintax supported; empty = skip |

### Media Types (filter what gets reposted)
| field | type | notes |
|-------|------|-------|
| photo_posts | bool | Include photos |
| video_posts | bool | Include videos |
| album_posts | bool | Include albums |
| reels_posts | bool | Include reels |
| Note: all false = accept all types ||

### Targeting
| field | type | notes |
|-------|------|-------|
| targets_shuffle | bool | Randomise feed order instead of most-recent |
| custom_repost_time | str | Override speed with exact times e.g. `"repost[10:00],repost[18:00]"` — empty = use speed |

---

## Log Fields

`status`: success \| error \| skipped
`original_media_code`: Instagram shortcode of the source post
`is_removable`: scheduled for auto-deletion
`remove_scheduled`: datetime of auto-delete
`is_deleted`: whether auto-delete has run
`status_share_to_stories`, `status_first_comment`, `status_caption`: sub-action results

---

## Common Workflows

**Add a hashtag target and activate:**
```bash
# Add target
curl -s -X POST .../repost/schedules/42/targets \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"type":"hashtag","value":"nature"}'

# Activate
curl -s -X POST .../repost/schedules/42/activate \
  -H "Authorization: Bearer $API_KEY"
```

**Set speed to fast with daily pause:**
```bash
curl -s -X PATCH .../repost/schedules/42/settings \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"speed":"fast","daily_pause":true,"daily_pause_from":"02:00","daily_pause_to":"08:00"}'
```

**Bulk pause all repost schedules:**
```bash
curl -s -X POST .../repost/schedules/bulk/pause \
  -H "Authorization: Bearer $API_KEY"
```
