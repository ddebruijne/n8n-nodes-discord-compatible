# n8n-nodes-discord-compatible

An n8n community node that mirrors the built-in **Discord** node (Message, Channel, Member + Webhook
connection) but talks to **any Discord-compatible REST API**, chosen by a configurable base URL:

- Discord itself (`https://discord.com/api/v10`, the default)
- a self-hosted [Fluxer](https://fluxer.app) instance (`https://your-host` — `/api` is appended for you)
- other Discord-compatible servers (Spacebar and friends), as long as they implement the same routes

Everything is a normal n8n node: no core patches, installable as a community node.

## Install

On the npm registry: **Settings → Community nodes → Install** and enter
`n8n-nodes-discord-compatible`, or in a self-hosted n8n install:

```bash
npm install n8n-nodes-discord-compatible
```

**From source** (if you want to hack on it):

```bash
git clone https://github.com/ddebruijne/n8n-nodes-discord-compatible.git
cd n8n-nodes-discord-compatible
npm install --ignore-scripts   # --ignore-scripts skips a native dep that is only needed for types
npm run build                  # compiles to dist/ and copies the icons
```

Then point your n8n at the checkout and restart it:

```bash
N8N_CUSTOM_EXTENSIONS=/absolute/path/to/n8n-nodes-discord-compatible n8n start
```

Note that n8n's Community Nodes UI installs from the npm registry only — a GitHub URL will not work
there, even though the repo is public.

## Credentials

| Credential | Use |
| --- | --- |
| **Discord-Compatible API** | Bot token + base URL. Used by the Channel, Message and Member resources. |
| **Discord-Compatible Webhook** | A full webhook URL. Used by the Webhook connection type. |

The bot token is sent as `Authorization: Bot <token>`. The credential test calls `GET /users/@me`.

Base URL examples:

| Server | Base URL |
| --- | --- |
| Discord | `https://discord.com/api/v10` |
| Fluxer | `https://fluxer.example.com` or `https://fluxer.example.com/api` |

A base URL with no path gets the conventional `/api` suffix, so the site URL your host documents is
usually enough.

## Operations

**Message**

| Operation | Endpoint |
| --- | --- |
| Send | `POST /channels/{channel_id}/messages` (content, embeds, files, reply, TTS, flags) |
| Get | `GET /channels/{channel_id}/messages/{message_id}` |
| Get Many | `GET /channels/{channel_id}/messages` (paginated when *Return All*) |
| Delete | `DELETE /channels/{channel_id}/messages/{message_id}` |
| React | `PUT /channels/{channel_id}/messages/{message_id}/reactions/{emoji}/@me` |

*Send* can post to a channel or open a DM with a user (`POST /users/@me/channels` first), and
attaches files from binary input data via multipart (`payload_json` + `files[n]`).

**Channel**

| Operation | Endpoint |
| --- | --- |
| Create | `POST /guilds/{guild_id}/channels` |
| Get | `GET /channels/{channel_id}` |
| Get Many | `GET /guilds/{guild_id}/channels` (optional type filter) |
| Update | `PATCH /channels/{channel_id}` |
| Delete | `DELETE /channels/{channel_id}` |

**Member**

| Operation | Endpoint |
| --- | --- |
| Get Many | `GET /guilds/{guild_id}/members` (paginated when *Return All*) |
| Add Role / Remove Role | `PUT` / `DELETE /guilds/{guild_id}/members/{user_id}/roles/{role_id}` |
| Kick | `DELETE /guilds/{guild_id}/members/{user_id}` |
| Ban / Unban | `PUT` / `DELETE /guilds/{guild_id}/bans/{user_id}` |
| Timeout | `PATCH /guilds/{guild_id}/members/{user_id}` (`communication_disabled_until`) |

Moderation operations write the selected reason to the `X-Audit-Log-Reason` header.

**Webhook (connection type)** — Send posts to the credential's webhook URL, with content, embeds,
files, username/avatar override and flags.

Servers and channels are picked with resource locators: search by name, paste a URL, or type an ID.

## Differences from the built-in Discord node

- **No OAuth2 connection type.** The OAuth2 flow is Discord-specific; use a bot token.
- **No "Send and Wait for Response".** That needs n8n's internal webhook/send-and-wait machinery.
- **No agent-channel tooling** (application ID / public key).

HTTP `429` responses are retried up to three times with exponential backoff, since Discord-compatible
APIs rate-limit aggressively.

## Compatibility

Developed and tested against `n8n-workflow` 2.x (n8n 2.x). The node is single-version (`version: 1`).

## Develop

```bash
npm install            # use --ignore-scripts if a native dependency refuses to build
npm run build          # tsc + copies the SVG icons into dist/
```

Then link the package into your n8n install (`npm link`) or point a custom `N8N_CUSTOM_EXTENSIONS`
directory at the repository.

## License

MIT
