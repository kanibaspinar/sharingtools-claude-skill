# Sharingtools Claude Skill

A Claude skill that turns Claude into a full-featured account manager for [Sharingtools](https://sharingtools.services) — an Instagram/TikTok/X automation SaaS platform.

## What It Does

Install this skill and Claude can manage your entire Sharingtools account through natural conversation:

- **Account management** — add, login, re-login (with 2FA/IMAP auto-fetch support), update, delete Instagram accounts
- **Reactions Pro** — activate/pause/stop automation per account or in bulk, configure speed, filters, targets, schedules, and 100+ settings
- **Repost Pro** — manage repost schedules, targets (Instagram + TikTok), and settings
- **Post scheduling** — create and schedule photo, video, reel, story, and album posts
- **Post Actions** — like/comment/follow jobs dispatched across your accounts
- **Leads Finder** — start/stop parse schedules, export collected leads
- **AI-DM** — view schedules, conversation threads, and messages
- **Welcome DM & First Comment** — manage schedules and logs
- **InBox** — list and reply to DMs, comments, and reviews across platforms
- **Direct Basic** — access Instagram DMs natively (inbox, pending, accept/decline)
- **Analytics** — follower growth charts, reactions stats, platform-wide statistics
- **Billing** — wallet balance, transactions, subscription, packages
- **API key & proxy management**
- **Admin tools** (admin/developer accounts only)

---

## Installation

### Step 1 — Download the skill file

Download [`sharingtools.skill`](./sharingtools.skill) from this repository (click the file → **Download raw file**).

### Step 2 — Install in Claude

**Claude Desktop (Cowork mode):**
1. Open the Claude Desktop app
2. Click the **Plugins** or **Skills** icon in the sidebar
3. Click **Install from file** (or drag and drop the `.skill` file)
4. Select the downloaded `sharingtools.skill` file
5. Click **Install** — the skill will appear in your skills list

**Claude Code (terminal):**
```bash
claude skill install /path/to/sharingtools.skill
```

Or clone the repo and install directly:
```bash
git clone https://github.com/kanibaspinar/sharingtools-claude-skill.git
claude skill install sharingtools-claude-skill/sharingtools.skill
```

---

## First-Time Setup

On first use, Claude will prompt you for your **Sharingtools REST API key**.

**How to get your API key:**
1. Log in to [sharingtools.services](https://sharingtools.services)
2. Go to **Settings → REST API** (or visit `https://sharingtools.services/e/rest-api/` directly)
3. Copy your existing key or click **Generate** to create a new one
4. Your key starts with `sht_`

**How Claude saves it:**
- Claude saves your key to `~/.sharingtools_config.json` with restricted permissions (`chmod 600`)
- Claude will never ask for it again in future sessions
- To reset: tell Claude *"Reset my Sharingtools API key"* — it will delete the saved file and walk you through setup again

---

## How to Use

Once the skill is installed and your API key is saved, just talk to Claude naturally. The skill activates automatically for any Sharingtools-related request.

**Dashboard & overview:**
```
Show me my Sharingtools dashboard
What are my platform-wide statistics?
```

**Account management:**
```
List all my Instagram accounts and flag any that need re-login
Re-login account 42 — here's the new password: mypassword
Add a new Instagram account: username / password
```

**Reactions Pro automation:**
```
Activate Reactions Pro for all accounts and set speed to 30 actions/hour
Pause reactions on account 15
Show me reactions stats for the last 7 days
Add hashtag target "fitness" to account 42's reactions schedule
```

**Repost Pro:**
```
Activate the repost schedule for account 7
Add TikTok target @username to account 10's repost schedule
```

**Post scheduling:**
```
Schedule a photo post for tomorrow at 10am with caption "Hello world!" on account 5
List all my scheduled posts
```

**Post Actions (like / comment / follow):**
```
Like this post with 20 accounts: https://www.instagram.com/p/ABC123/
Follow @johndoe using 10 accounts
Comment "Nice!" on this post with 5 accounts: https://www.instagram.com/p/XYZ/
```

**Analytics:**
```
Show me the follower growth for account @myusername over the last 30 days
What are the reactions stats for account 5?
```

**Billing:**
```
What's my wallet balance and when does my subscription expire?
Show me my last 10 transactions
```

**Leads Finder:**
```
Start the leads finder schedule for account 33
Export leads from schedule 5
```

**Direct messages:**
```
Show me the DM inbox for account 12
List pending DM requests for account 8
```

---

## MCP Server (for developers / self-hosted setups)

If you want Claude to connect to Sharingtools **without** the packaged `.skill` file — or if you're building your own Claude integration — you can run the included MCP server locally. This is a standard Node.js package that exposes all 40 Sharingtools tools over the [Model Context Protocol](https://modelcontextprotocol.io).

### Prerequisites

- Node.js 18 or later
- npm
- A Sharingtools API key (`sht_...`)

### Install

```bash
git clone https://github.com/kanibaspinar/sharingtools-claude-skill.git
cd sharingtools-claude-skill/mcp-server
npm install
```

### Configure your API key

**Option A — environment variable (recommended):**
```bash
export SHARINGTOOLS_API_KEY=sht_your_key_here
```

**Option B — .env file:**
```bash
cp .env.example .env
# Edit .env and paste your key
```

### Add to Claude Desktop

Edit your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sharingtools": {
      "command": "node",
      "args": ["/absolute/path/to/sharingtools-claude-skill/mcp-server/index.js"],
      "env": {
        "SHARINGTOOLS_API_KEY": "sht_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop — you'll see **sharingtools** listed as a connected MCP server.

### Add to Claude Code

```bash
claude mcp add sharingtools \
  --command "node /absolute/path/to/sharingtools-claude-skill/mcp-server/index.js" \
  --env SHARINGTOOLS_API_KEY=sht_your_key_here
```

Or add it manually to your `~/.claude/claude_code_config.json`:
```json
{
  "mcpServers": {
    "sharingtools": {
      "command": "node",
      "args": ["/absolute/path/to/sharingtools-claude-skill/mcp-server/index.js"],
      "env": {
        "SHARINGTOOLS_API_KEY": "sht_your_key_here"
      }
    }
  }
}
```

### Test it

```bash
SHARINGTOOLS_API_KEY=sht_your_key node mcp-server/index.js
# Should print: [sharingtools-mcp] Server running.
```

### Available MCP tools

The server exposes **40 tools** covering the full Sharingtools API:

| Category | Tools |
|----------|-------|
| Dashboard & User | `get_dashboard`, `get_user`, `update_user`, `get_statistics` |
| Billing | `get_wallet`, `get_transactions`, `get_subscription`, `list_packages` |
| Accounts | `list_accounts`, `get_account`, `add_account`, `login_account`, `complete_challenge`, `update_account`, `delete_account`, `get_account_stats` |
| Posts | `list_posts`, `get_post`, `create_post`, `update_post`, `delete_post` |
| Captions | `list_captions`, `create_caption`, `update_caption`, `delete_caption` |
| Proxies & Keys | `list_proxies`, `get_api_keys`, `generate_api_key`, `revoke_api_key` |
| Reactions Pro | `list_reactions_schedules`, `get_reactions_schedule`, `get_reactions_settings`, `update_reactions_settings`, `activate_reactions`, `pause_reactions`, `bulk_activate_reactions`, `bulk_pause_reactions`, `bulk_stop_reactions`, `get_reactions_logs`, `get_reactions_stats` |

---

## File Structure

```
sharingtools-claude-skill/
├── sharingtools.skill          # Packaged skill — install this in Claude Desktop/Cowork
├── SKILL.md                    # Main skill instructions (loaded by Claude)
├── references/
│   ├── reactions.md            # Reactions Pro: all 100+ settings fields + target types
│   ├── repost.md               # Repost Pro: schedules, targets, settings
│   ├── modules.md              # Post Actions, Leads, AI-DM, Welcome DM, First Comment, InBox, Direct
│   └── account-actions.md     # Per-account actions + admin endpoints
├── mcp-server/
│   ├── index.js                # MCP server — 40 tools, connects to Sharingtools REST API
│   ├── package.json
│   └── .env.example            # Copy to .env and add your API key
└── README.md
```

---

## Requirements

- [Claude Desktop](https://claude.ai/download) (Cowork mode) **or** [Claude Code](https://claude.ai/code)
- A [Sharingtools](https://sharingtools.services) account with REST API access enabled
- Your Sharingtools REST API key (`sht_...`)

---

## API Coverage

This skill covers the full Sharingtools REST API v2.0.0 (`2026-03-24`):

| Module | Endpoints |
|--------|-----------|
| Auth & User | `/auth/token`, `/user`, `/user/subscription` |
| Dashboard | `/dashboard`, `/statistics` |
| Accounts | `/accounts` CRUD + `/accounts/login` + `/accounts/challenge` |
| Account Actions | `refresh-cookies`, `login-activity`, `change-proxy`, `set-public/private`, `2fa-backup`, `options`, `password` (single + bulk) |
| Posts | `/posts` CRUD |
| Captions | `/captions` CRUD |
| Reactions Pro | `/reactions/schedules`, targets, settings (100+ fields), logs, stats |
| Repost Pro | `/repost/schedules`, targets (13 types), settings, logs |
| Post Actions | `/post-actions/jobs` (like/comment/follow), logs, usage |
| Leads Finder | `/leads/schedules`, export, logs, stats |
| AI-DM | `/ai-dm/schedules`, threads, messages, logs |
| Welcome DM | `/welcomedm/schedules`, logs |
| First Comment | `/first-comment/schedules` CRUD, logs |
| InBox | `/inbox/threads`, reply, archive, tags |
| Direct Basic | `/direct/{id}/inbox`, pending, messages, accept/decline/delete |
| Wallet | `/wallet`, `/wallet/transactions` |
| Packages & Proxies | `/packages`, `/proxies` |
| API Keys | `/keys`, generate, revoke |
| Admin | `/admin/keys`, logs, stats, users |

---

## License

MIT — see [LICENSE](./LICENSE)
