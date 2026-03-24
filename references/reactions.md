# Reactions Pro — Full Reference

Base: `https://sharingtools.services/api/v1/reactions`
Requires: Reactions Pro plugin + "reactions" module in user plan. 503 = plugin missing, 403 = plan restriction.
`account_id` = np_accounts.id (integer), NOT Instagram numeric ID.

---

## Target Types

GET /reactions/targets/types — returns catalog of all 14 valid types.

| type | requires_id | description |
|------|-------------|-------------|
| timeline | false | User's own timeline feed |
| hashtag | false | Posts under a hashtag |
| hashtag_likers | false | Likers of posts under a hashtag |
| keyword | false | Posts matching a keyword |
| keyword_likers | false | Likers of keyword posts |
| keyword_reels | false | Reels matching a keyword |
| keyword_reels_likers | false | Likers of keyword reels |
| people | true | Posts from a specific user (id = Instagram numeric user ID) |
| people_followers | true | Followers of a specific user |
| people_followings | true | Followings of a specific user |
| people_likers | true | Likers of a specific user's posts |
| location | true | Posts at a location (id = Instagram location ID) |
| location_likers | true | Likers of posts at a location |
| user_id_list | false | Custom list of user IDs |

`requires_id=true` → must supply `"id"` field (numeric Instagram ID).
`requires_id=false` → id auto-set to value if omitted.

### Manage Targets (REST only)

**List targets:**
GET /reactions/schedules/{account_id}/targets
→ `{"data":{"targets":[{"type":"hashtag","id":"photography","value":"photography"},...], "total":N}}`

**Add a target:**
POST /reactions/schedules/{account_id}/targets
```json
{"type": "hashtag", "value": "photography"}
{"type": "people", "value": "someuser", "id": "123456789"}
```

**Remove a target:**
DELETE /reactions/schedules/{account_id}/targets
```json
{"type": "hashtag", "value": "photography"}   // remove specific
{"type": "hashtag"}                             // remove ALL of this type
```

---

## Settings Fields (PATCH /reactions/schedules/{account_id}/settings)

Only send fields you want to change. Returns `{"data":{"account_id":N,"updated_fields":[...]}}`.
422 if unknown or read-only field sent.

### Schedule
| field | type | notes |
|-------|------|-------|
| daily_pause | bool | Enable daily rest window |
| daily_pause_from | str HH:MM | Start of pause window (UTC) |
| daily_pause_to | str HH:MM | End of pause window (UTC) |
| expiration | bool | Enable auto-expiry |
| expiration_date | str Y-m-d H:i:s | When to auto-stop |
| is_pause_until | bool | Pause until schedule_date |
| is_reset_hl | bool | Reset hourly limit |
| autopilot | bool | Autopilot mode |

### Story Reactions
| field | type |
|-------|------|
| is_poll | bool |
| is_poll_slider | bool |
| is_quiz | bool |
| is_answer | bool |
| is_countdown | bool |
| is_masslooking | bool |
| fresh_stories | bool |
| is_story_likes | bool |
| like_stories_algorithm | int |
| like_stories_type | int |
| is_emoji | bool |
| emojis | str |
| emoji_speed | int |

### Intervals
| field | type |
|-------|------|
| massvoting_interval | float |
| like_stories_interval | float |
| masslooking_interval | float |
| comment_interval | int |
| dm_interval | int |
| like_comments_interval | int |
| like_comments_speed | int |

### Likes
| field | type |
|-------|------|
| is_likes | bool |
| likes_speed | int |
| likes_per_user | int |
| is_likes_timeline | bool |
| is_c_likes | bool |
| c_likes_speed | int |

### Comments
| field | type |
|-------|------|
| is_comment | bool |
| comment_speed | int |
| is_comment_filter | bool |

### Follow / Unfollow
| field | type | notes |
|-------|------|-------|
| is_follow | bool | |
| follow_speed | int | |
| follow_limit | int | |
| mute_type | str | |
| is_unfollow | bool | |
| unfollow_speed | int | |
| unfollow_skip_followers | bool | |
| unfollow_non_followers | bool | |
| auto_follow_unfollow | bool | |
| unfollow_interval | int | |

### DM / Reply DM / Welcome DM
| field | type |
|-------|------|
| is_dm | bool |
| dm_speed | int |
| dm_mute | bool |
| dm_move_to_general | bool |
| dm_only_text | bool |
| dm_skip_following | bool |
| dm_skip_following_request | bool |
| dm_remove_from_list | bool |
| is_reply_dm | bool |
| is_not_like_dm | bool |
| is_not_mute_dm | bool |
| is_only_text_dm | bool |
| is_welcome_dm | bool |
| welcome_dm_mute | bool |
| welcome_dm_only_text | bool |
| welcome_dm_move | bool |
| welcome_dm_speed | int |

### Filters / Metrics
| field | type | notes |
|-------|------|-------|
| post_min_likes | int | Post engagement filter |
| post_max_likes | int | |
| post_min_views | int | |
| post_max_views | int | |
| is_metrics_filter | bool | Enable follower-count filter |
| followers_min | int | |
| followers_max | int | |
| followings_min | int | |
| followings_max | int | |
| posts_min | int | |
| posts_max | int | |
| last_posted_min | int | Days since last post |
| last_posted_max | int | |
| verified_filter | int | 0=all, 1=only verified, 2=skip verified |
| is_username_filter | bool | |
| is_username_filter_match_mode | bool | |
| is_username_filter_whitelist | bool | |
| is_gender_by_name_filter | bool | |
| gender_by_name_choice | str | |
| is_gender_skip_mode | bool | |
| is_filter_by_id | bool | |
| bypass_potential_spam | bool | |
| potential_spam_flag_checker | bool | |
| mass_actions_no_stories | bool | |

### Reposts
| field | type |
|-------|------|
| reposts_enable | bool |
| reposts_action | str |
| reposts_min | int |
| reposts_max | int |
| reposts_speed | int |
| reposts_max_per_day | int |

### Close Friends
| field | type |
|-------|------|
| cf_enable | bool |
| cf_followers | bool |
| cf_action | str |
| cf_number | int |
| cf_speed | int |
| cf_skip_suggested | bool |
| cf_infinite | bool |
| cf_new_followers | bool |

### Notifications (Telegram)
| field | type |
|-------|------|
| is_telegram_analytics | bool |
| is_telegram_errors | bool |
| tg_chat_id | int |
| delay_telegram | int |

### Proxy & Advanced
| field | type |
|-------|------|
| custom_proxy | str |
| custom_proxy_data_scrapping | bool |
| mqtt | bool |
| async_masslooking | bool |
| async_masslooking_batch | int |
| async_story_likes | bool |
| async_story_likes_batch | int |
| debug_mode | bool |
| keywords_cleaner | bool |
| bypass_challenges_automatically | bool |
| use_get_likers | bool |
| dfs_enable | bool |
| source_tracking | bool |
| track_only_new_followers | bool |
| target_quality_tracking | bool |

### Activity Time
| field | type |
|-------|------|
| activity_time | bool |
| activity_time_randomize | bool |
| activity_time_min_hd | str HH:MM |
| activity_time_max_hd | str HH:MM |
| activity_time_min_h | str HH:MM |
| activity_time_max_h | str HH:MM |

### Mother-Child
| field | type |
|-------|------|
| mc_target_linking_interval | int |
| mc_interaction_frequency | int |

### Language
| field | type |
|-------|------|
| language_detection_notices | bool |
| language_web_data | bool |
| language_skip_accounts | bool |

### Bookmarks
| field | type |
|-------|------|
| add_users_bm | bool |
| add_users_bm_days | int |

### Actions
| field | type |
|-------|------|
| prorate_algorithm | bool |
| prorate_reverse_looping | bool |
