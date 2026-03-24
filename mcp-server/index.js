#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://sharingtools.services/api/v1";
const API_KEY = process.env.SHARINGTOOLS_API_KEY;

if (!API_KEY) {
  console.error("[sharingtools-mcp] ERROR: SHARINGTOOLS_API_KEY is not set.");
  console.error("[sharingtools-mcp] Set it in your MCP config or .env file.");
  process.exit(1);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function api(method, path, body = null, query = null) {
  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null))
    );
    if (params.toString()) url += `?${params}`;
  }
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { result: 0, message: text };
  }
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  // ── Dashboard & User ──────────────────────────────────────────────────────
  {
    name: "get_dashboard",
    description: "Get full dashboard overview: user info, account counts, post counts, wallet balance, recent posts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_user",
    description: "Get current user profile and account details.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_user",
    description: "Update user profile (firstname, lastname, email).",
    inputSchema: {
      type: "object",
      properties: {
        firstname: { type: "string" },
        lastname: { type: "string" },
        email: { type: "string" },
      },
    },
  },
  {
    name: "get_statistics",
    description: "Get platform-wide statistics: account counts, post counts, follower growth.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_wallet",
    description: "Get wallet balance and currency.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_transactions",
    description: "Get wallet transaction history.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number" },
        per_page: { type: "number" },
        type: { type: "string", enum: ["credit", "debit"] },
        status: { type: "string", enum: ["pending", "completed", "failed"] },
      },
    },
  },
  {
    name: "get_subscription",
    description: "Get current subscription/package details and expiry.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_packages",
    description: "List available subscription packages and their features.",
    inputSchema: { type: "object", properties: {} },
  },

  // ── Accounts ─────────────────────────────────────────────────────────────
  {
    name: "list_accounts",
    description: "List Instagram accounts. Filter by login_required, slave, or search by username.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Results per page (default 20)" },
        search: { type: "string", description: "Search by username" },
        login_required: { type: "number", description: "Filter: 1 = needs re-login" },
        slave: { type: "number", description: "Filter: 1 = slave accounts only" },
      },
    },
  },
  {
    name: "get_account",
    description: "Get details for a single Instagram account by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number", description: "Account ID" } },
      required: ["id"],
    },
  },
  {
    name: "add_account",
    description: "Add a new Instagram account. Optionally assign a proxy.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string" },
        password: { type: "string" },
        proxy: { type: "string", description: "Proxy in format host:port or user:pass@host:port" },
      },
      required: ["username", "password"],
    },
  },
  {
    name: "login_account",
    description: "Login or re-login an Instagram account. Handles 2FA and IMAP email verification. Returns challenge token if verification is needed.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string" },
        password: { type: "string" },
        proxy: { type: "string" },
        twofa_secret: { type: "string", description: "2FA TOTP secret (optional)" },
        imap_server: { type: "string" },
        imap_port: { type: "number" },
        imap_username: { type: "string" },
        imap_password: { type: "string" },
      },
      required: ["username", "password"],
    },
  },
  {
    name: "complete_challenge",
    description: "Complete an Instagram login challenge (email/SMS code). Use after login_account returns needs_challenge=true.",
    inputSchema: {
      type: "object",
      properties: {
        challenge_token: { type: "string", description: "Token returned by login_account" },
        code: { type: "string", description: "Verification code (leave blank for IMAP auto-fetch)" },
        auto_imap: { type: "boolean", description: "Auto-fetch code via IMAP" },
      },
      required: ["challenge_token"],
    },
  },
  {
    name: "update_account",
    description: "Update an Instagram account's proxy, mobile proxy, or password.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number" },
        password: { type: "string" },
        proxy: { type: "string" },
        mobile_proxy: { type: "string" },
        login_required: { type: "number" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_account",
    description: "Delete an Instagram account from the platform.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "get_account_stats",
    description: "Get 30-day follower/following history for a specific Instagram account.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number", description: "Account ID" } },
      required: ["id"],
    },
  },

  // ── Posts ────────────────────────────────────────────────────────────────
  {
    name: "list_posts",
    description: "List posts. Filter by status (saved/scheduled/published/failed), account, or scheduled flag.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number" },
        per_page: { type: "number" },
        account_id: { type: "number" },
        status: { type: "string", enum: ["saved", "scheduled", "published", "failed"] },
        is_scheduled: { type: "number" },
      },
    },
  },
  {
    name: "get_post",
    description: "Get a single post by ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "create_post",
    description: "Create or schedule a post for an Instagram account.",
    inputSchema: {
      type: "object",
      properties: {
        account_id: { type: "number" },
        caption: { type: "string" },
        type: { type: "string", enum: ["photo", "video", "album", "reel", "story"] },
        first_comment: { type: "string", description: "Auto-post this as first comment" },
        location: { type: "string" },
        link: { type: "string" },
        media_ids: { type: "string", description: "Comma-separated media IDs" },
        is_scheduled: { type: "number" },
        schedule_date: { type: "string", description: "Date/time in Y-m-d H:i:s format" },
      },
      required: ["account_id", "caption", "type"],
    },
  },
  {
    name: "update_post",
    description: "Update a post's caption, schedule date, first comment, or other fields.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number" },
        caption: { type: "string" },
        first_comment: { type: "string" },
        location: { type: "string" },
        is_scheduled: { type: "number" },
        schedule_date: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_post",
    description: "Delete a post.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },

  // ── Captions ──────────────────────────────────────────────────────────────
  {
    name: "list_captions",
    description: "List saved caption templates.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number" },
        per_page: { type: "number" },
        search: { type: "string" },
      },
    },
  },
  {
    name: "create_caption",
    description: "Save a new caption template. Supports spintax: {option1|option2}.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        caption: { type: "string" },
      },
      required: ["title", "caption"],
    },
  },
  {
    name: "update_caption",
    description: "Update an existing caption template.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number" },
        title: { type: "string" },
        caption: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_caption",
    description: "Delete a caption template.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },

  // ── Proxies & API Keys ───────────────────────────────────────────────────
  {
    name: "list_proxies",
    description: "List available proxies. Filter by country code.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number" },
        per_page: { type: "number" },
        country_code: { type: "string", description: "ISO country code e.g. US, TR, DE" },
      },
    },
  },
  {
    name: "get_api_keys",
    description: "Get current API key info (name, usage count, last used).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "generate_api_key",
    description: "Generate a new API key. WARNING: this replaces your current key.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Label for the new key" },
      },
    },
  },
  {
    name: "revoke_api_key",
    description: "Revoke the current API key. WARNING: this will invalidate your session.",
    inputSchema: { type: "object", properties: {} },
  },

  // ── Reactions Pro ────────────────────────────────────────────────────────
  {
    name: "list_reactions_schedules",
    description: "List all Reactions Pro automation schedules with their active/running status.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number" },
        per_page: { type: "number" },
      },
    },
  },
  {
    name: "get_reactions_schedule",
    description: "Get Reactions Pro schedule for a specific account.",
    inputSchema: {
      type: "object",
      properties: { account_id: { type: "number" } },
      required: ["account_id"],
    },
  },
  {
    name: "get_reactions_settings",
    description: "Get all Reactions Pro settings for an account (targets, speed, filters, daily pause, etc.).",
    inputSchema: {
      type: "object",
      properties: { account_id: { type: "number" } },
      required: ["account_id"],
    },
  },
  {
    name: "update_reactions_settings",
    description: "Update Reactions Pro settings for an account. Provide only the fields you want to change.",
    inputSchema: {
      type: "object",
      properties: {
        account_id: { type: "number" },
        speed: { type: "number", description: "Actions per hour" },
        is_active: { type: "number" },
        daily_pause: { type: "number" },
        daily_pause_from: { type: "string", description: "HH:MM" },
        daily_pause_to: { type: "string", description: "HH:MM" },
        filter_business: { type: "number" },
        filter_followers_min: { type: "number" },
        filter_followers_max: { type: "number" },
      },
      required: ["account_id"],
    },
  },
  {
    name: "activate_reactions",
    description: "Activate Reactions Pro automation for an account.",
    inputSchema: {
      type: "object",
      properties: { account_id: { type: "number" } },
      required: ["account_id"],
    },
  },
  {
    name: "pause_reactions",
    description: "Pause Reactions Pro automation for an account.",
    inputSchema: {
      type: "object",
      properties: { account_id: { type: "number" } },
      required: ["account_id"],
    },
  },
  {
    name: "bulk_activate_reactions",
    description: "Activate Reactions Pro for multiple accounts at once. Leave account_ids empty to activate all.",
    inputSchema: {
      type: "object",
      properties: {
        account_ids: { type: "array", items: { type: "number" }, description: "Leave empty to activate all" },
      },
    },
  },
  {
    name: "bulk_pause_reactions",
    description: "Pause Reactions Pro for multiple accounts at once. Leave account_ids empty to pause all.",
    inputSchema: {
      type: "object",
      properties: {
        account_ids: { type: "array", items: { type: "number" } },
      },
    },
  },
  {
    name: "bulk_stop_reactions",
    description: "Force-stop running Reactions Pro tasks for multiple accounts.",
    inputSchema: {
      type: "object",
      properties: {
        account_ids: { type: "array", items: { type: "number" } },
      },
    },
  },
  {
    name: "get_reactions_logs",
    description: "Get Reactions Pro activity logs. Optionally filter by account.",
    inputSchema: {
      type: "object",
      properties: {
        account_id: { type: "number", description: "Filter by account (optional)" },
        page: { type: "number" },
        per_page: { type: "number" },
      },
    },
  },
  {
    name: "get_reactions_stats",
    description: "Get Reactions Pro statistics. Optionally for a specific account.",
    inputSchema: {
      type: "object",
      properties: {
        account_id: { type: "number", description: "Specific account (optional)" },
      },
    },
  },
];

// ─── Tool handlers ───────────────────────────────────────────────────────────

async function handleTool(name, args) {
  switch (name) {
    // ── Dashboard & User ────────────────────────────────────────────────────
    case "get_dashboard":    return api("GET", "/dashboard");
    case "get_user":         return api("GET", "/user");
    case "update_user":      return api("PATCH", "/user", args);
    case "get_statistics":   return api("GET", "/statistics");
    case "get_wallet":       return api("GET", "/wallet");
    case "get_transactions": return api("GET", "/wallet/transactions", null, args);
    case "get_subscription": return api("GET", "/user/subscription");
    case "list_packages":    return api("GET", "/packages");

    // ── Accounts ────────────────────────────────────────────────────────────
    case "list_accounts":    return api("GET", "/accounts", null, args);
    case "get_account":      return api("GET", `/accounts/${args.id}`);
    case "add_account":      return api("POST", "/accounts", args);
    case "login_account":    return api("POST", "/accounts/login", args);
    case "complete_challenge": return api("POST", "/accounts/challenge", args);
    case "update_account": {
      const { id, ...body } = args;
      return api("PATCH", `/accounts/${id}`, body);
    }
    case "delete_account":   return api("DELETE", `/accounts/${args.id}`);
    case "get_account_stats": return api("GET", `/statistics/accounts/${args.id}`);

    // ── Posts ────────────────────────────────────────────────────────────────
    case "list_posts":  return api("GET", "/posts", null, args);
    case "get_post":    return api("GET", `/posts/${args.id}`);
    case "create_post": return api("POST", "/posts", args);
    case "update_post": {
      const { id, ...body } = args;
      return api("PATCH", `/posts/${id}`, body);
    }
    case "delete_post": return api("DELETE", `/posts/${args.id}`);

    // ── Captions ─────────────────────────────────────────────────────────────
    case "list_captions":   return api("GET", "/captions", null, args);
    case "create_caption":  return api("POST", "/captions", args);
    case "update_caption": {
      const { id, ...body } = args;
      return api("PATCH", `/captions/${id}`, body);
    }
    case "delete_caption": return api("DELETE", `/captions/${args.id}`);

    // ── Proxies & API Keys ───────────────────────────────────────────────────
    case "list_proxies":    return api("GET", "/proxies", null, args);
    case "get_api_keys":    return api("GET", "/keys");
    case "generate_api_key": return api("POST", "/keys/generate", args);
    case "revoke_api_key":  return api("POST", "/keys/revoke");

    // ── Reactions Pro ────────────────────────────────────────────────────────
    case "list_reactions_schedules": return api("GET", "/reactions/schedules", null, args);
    case "get_reactions_schedule":   return api("GET", `/reactions/schedules/${args.account_id}`);
    case "get_reactions_settings":   return api("GET", `/reactions/schedules/${args.account_id}/settings`);
    case "update_reactions_settings": {
      const { account_id, ...body } = args;
      return api("PATCH", `/reactions/schedules/${account_id}/settings`, body);
    }
    case "activate_reactions": return api("POST", `/reactions/schedules/${args.account_id}/activate`);
    case "pause_reactions":    return api("POST", `/reactions/schedules/${args.account_id}/pause`);
    case "bulk_activate_reactions": return api("POST", "/reactions/schedules/bulk/activate", args);
    case "bulk_pause_reactions":    return api("POST", "/reactions/schedules/bulk/pause", args);
    case "bulk_stop_reactions":     return api("POST", "/reactions/schedules/bulk/stop", args);
    case "get_reactions_logs":  return api("GET", "/reactions/logs", null, args);
    case "get_reactions_stats": return api("GET", "/reactions/stats", null, args);

    default:
      return { result: 0, message: `Unknown tool: ${name}` };
  }
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "sharingtools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    const result = await handleTool(name, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[sharingtools-mcp] Server running.");
