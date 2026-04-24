# UI Integration: Auth + Workspace

This document describes what the frontend must implement to integrate the authentication and workspace features of the Hule API. It covers HTTP contracts, required UI screens, auth-state lifecycle, and the path-prefix migration that every existing data fetch must follow.

---

## 1. High-level model

1. A **User** has `username`, `email`, `name`, `password`. The password never leaves the server.
2. A **Workspace** is an organization container. All content (spaces, lists, tasks, comments, files) belongs to exactly one workspace.
3. A user can belong to many workspaces. Registration auto-creates one workspace (`"{name}'s workspace"`) and makes the new user its owner.
4. The API issues a **single long-lived JWT** (30 days). There is no refresh token. The JWT embeds `workspaceIds` (the list of workspaces the user is a member of at issue time).
5. Every data endpoint (except auth, health, Swagger, and `GET/POST /workspaces`) is mounted under `/api/workspaces/:workspaceId/...`. The server rejects requests where `workspaceId` is not in `req.user.workspaceIds`.
6. When a workspace is **created** or **joined**, the server issues a new JWT that contains the updated `workspaceIds`. The frontend must replace the stored token with the new one.

---

## 2. HTTP contracts

All paths below are relative to the API base (default `/api`). All request/response bodies are JSON unless noted. Errors follow `{ statusCode, message, ... }` with standard HTTP status codes (`400`, `401`, `403`, `404`).

The JWT goes in `Authorization: Bearer <access_token>` on every request except the public ones listed below.

### 2.1 Public endpoints (no Bearer)

| Method | Path              | Body                                            | Response             |
| ------ | ----------------- | ----------------------------------------------- | -------------------- |
| POST   | `/auth/register`  | `CreateUserDto`                                 | `AuthResponseDto`    |
| POST   | `/auth/login`     | `LoginDto`                                      | `AuthResponseDto`    |
| GET    | `/health`         | —                                               | `{ status: 'ok' }`   |
| GET    | `/documentation`  | —                                               | Swagger UI (HTML)    |

### 2.2 Authenticated user endpoints

| Method | Path        | Body | Response    | Notes                           |
| ------ | ----------- | ---- | ----------- | ------------------------------- |
| GET    | `/auth/me`  | —    | `UserDto`   | Returns the current user record |

### 2.3 Workspace endpoints

| Method | Path                                                    | Body                      | Response               | Role           |
| ------ | ------------------------------------------------------- | ------------------------- | ---------------------- | -------------- |
| GET    | `/workspaces`                                           | —                         | `WorkspaceDto[]`       | any member     |
| POST   | `/workspaces`                                           | `CreateWorkspaceDto`      | `WorkspaceCreatedDto`  | any user       |
| GET    | `/workspaces/:workspaceId`                              | —                         | `WorkspaceDto`         | member         |
| PATCH  | `/workspaces/:workspaceId`                              | `UpdateWorkspaceDto`      | `WorkspaceDto`         | **owner only** |
| DELETE | `/workspaces/:workspaceId`                              | —                         | `204 No Content`       | **owner only** |
| POST   | `/workspaces/:workspaceId/members`                      | `InviteMemberDto`         | `WorkspaceDto`         | **owner only** |
| DELETE | `/workspaces/:workspaceId/members/:memberId`            | —                         | `WorkspaceDto`         | owner OR self  |

`POST /workspaces` returns `WorkspaceCreatedDto = { access_token, workspace }`. The new token contains the new workspace id; the old token does not. **Replace the stored token with the new one before navigating.**

`DELETE /workspaces/:id/members/:memberId` — a member can remove themselves (leave a workspace). Only the owner can remove other members. The owner cannot be removed this way; they must delete the whole workspace.

### 2.4 DTO shapes

```ts
// CreateUserDto
{
  username: string   // 3–32, /^[a-zA-Z0-9_]+$/
  email: string      // valid email, max 254
  name: string       // 1–100
  password: string   // 8–128
}

// LoginDto
{
  login: string      // username OR email, max 254
  password: string   // 1–128
}

// AuthResponseDto
{
  access_token: string
  user: UserDto
}

// UserDto
{
  id: string
  username: string
  email: string
  name: string
  createdAt: string  // ISO 8601
  updatedAt: string
}

// CreateWorkspaceDto
{ name: string }          // 1–100

// UpdateWorkspaceDto
{ name?: string }         // 1–100

// InviteMemberDto
{ login: string }         // username OR email of an existing user

// WorkspaceDto
{
  id: string
  name: string
  ownerId: string
  memberIds: string[]     // includes the owner
  createdAt: string
  updatedAt: string
}

// WorkspaceCreatedDto
{
  access_token: string    // fresh JWT, includes the new workspace
  workspace: WorkspaceDto
}
```

### 2.5 JWT payload

Decoded payload shape — useful if the UI needs any of this before calling `/auth/me`:

```ts
{
  sub: string
  id: string
  username: string
  email: string
  name: string
  workspaceIds: string[]   // source of truth for "which workspaces can I access?"
  createdAt: string
  updatedAt: string
  iat: number
  exp: number
}
```

Do not trust the JWT blindly for display — `user.name`/`email` can change on the server. Use `/auth/me` to refresh the user record after login/register and on app boot. `workspaceIds` from the JWT is authoritative for access checks against the `:workspaceId` path param.

---

## 3. Authentication lifecycle

### 3.1 State to persist

Store in `localStorage` (or equivalent):

- `access_token` — the JWT string.
- `activeWorkspaceId` — the workspace the user last opened. Used to redirect to `/w/:workspaceId/...` after reload.

Do **not** store the user or workspace list — fetch them on boot. Do **not** store the password.

### 3.2 Boot flow

1. Read `access_token` from storage.
2. If missing → route to `/login`.
3. If present:
   - Call `GET /auth/me` to load the user. On `401`, clear the token and go to `/login`.
   - Call `GET /workspaces` to load the workspace list.
   - If `activeWorkspaceId` is in the list → redirect to `/w/:activeWorkspaceId/...`.
   - Else if the list is non-empty → pick the first workspace, redirect there, and write it as `activeWorkspaceId`.
   - Else → route to "create your first workspace" screen. (This shouldn't happen for a freshly registered user because register auto-creates a workspace, but handle it defensively — the user may have deleted their only workspace.)

### 3.3 Register flow

1. User fills `username` / `email` / `name` / `password`. Mirror the server validation client-side (see DTO constraints).
2. `POST /auth/register` → `AuthResponseDto`.
3. Store `access_token`. Call `GET /workspaces` to discover the auto-created workspace; set `activeWorkspaceId` to its `id`.
4. Redirect to `/w/:activeWorkspaceId/...` (the default landing view, e.g. spaces list).

### 3.4 Login flow

1. User enters **login** (username OR email) + **password**.
2. `POST /auth/login` → `AuthResponseDto`.
3. Store `access_token`. Same workspace-resolution as boot flow.

### 3.5 Logout flow

There is no server-side logout endpoint. Simply clear `access_token` and `activeWorkspaceId` from storage and route to `/login`.

### 3.6 Token expiry / 401 handling

The token lives 30 days. Any authenticated request can still return `401` if the token is missing, malformed, or expired. Global handler: on `401`, clear the token, clear `activeWorkspaceId`, and redirect to `/login`. Do not attempt to refresh — there is no refresh endpoint.

On `403` (workspace access denied) do **not** log out. Show a "not allowed" screen or redirect to the workspace picker — the user is authenticated but the workspace is not theirs (usually because they were just removed from it or typed a URL manually).

---

## 4. Workspace membership lifecycle

After any mutation that changes `workspaceIds`, the stored token is stale. Handle each case:

| Action                                           | What the server returns                           | What the UI must do                                                                 |
| ------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `POST /workspaces` (create)                      | `WorkspaceCreatedDto { access_token, workspace }` | **Replace the stored token** with `access_token`. Set `activeWorkspaceId`. Navigate. |
| `DELETE /workspaces/:id` (owner deletes)         | `204`                                             | Current token still lists the deleted id but the workspace is gone. Refresh the token: re-login OR re-issue by calling `POST /workspaces` or refetch. Simplest: after delete, call `GET /workspaces`, pick a remaining workspace as active, and — because the stale token will `403` — force a logout + prompt to log in again. **Recommended MVP behavior: redirect to `/login` after deletion.** |
| `POST /workspaces/:id/members` (invite existing user) | `WorkspaceDto` (the invitee is not you)      | Nothing for the current session. The invited user's token updates on their next login. |
| `DELETE /workspaces/:id/members/:memberId` where `memberId === me` (leave) | `WorkspaceDto` | Same problem as delete-own-workspace: the token still claims access. **Redirect to `/login`.** |
| `DELETE /workspaces/:id/members/:memberId` where `memberId !== me` (owner removes someone) | `WorkspaceDto` | Update the local workspace state with the new `memberIds`. |

> **Why the forced re-login on leave/delete:** the JWT's `workspaceIds` is frozen at issue time. The server has no per-token revocation, so the only way to remove a workspace from the client's embedded list is to issue a new token. For the MVP we do not add a token-refresh endpoint; we force the user to log in again. Document this in the UI with a one-line notice so it doesn't feel like a bug.

---

## 5. URL structure and routing

All authenticated routes live under `/w/:workspaceId/...`. The workspace id in the URL is the single source of truth for "which workspace am I viewing". Do not stash it only in a Pinia/Vuex store — it must survive a reload via the URL.

Suggested routes (Vue Router):

| Path                                        | Screen                              |
| ------------------------------------------- | ----------------------------------- |
| `/login`                                    | Login form                          |
| `/register`                                 | Register form                       |
| `/workspaces`                               | Workspace picker (list + create)    |
| `/w/:workspaceId`                           | Default workspace view (redirects to spaces/first-space) |
| `/w/:workspaceId/settings`                  | Workspace settings (rename, members, delete) |
| `/w/:workspaceId/spaces/:spaceId/...`       | Existing content routes, now nested under workspace |
| `/w/:workspaceId/timeline`                  | Timeline (was `/timeline`)          |

A route guard should:
1. Let `/login`, `/register` through unconditionally.
2. For everything else: require a token. If missing → `/login`.
3. If the route has `:workspaceId`, check that it is in the JWT's `workspaceIds`. If not → `/workspaces` (picker).

---

## 6. UI screens to implement

### 6.1 Login screen (`/login`)

- Inputs: `login` (username or email), `password`.
- Submit → `POST /auth/login`.
- On success: store token, resolve workspace (see §3.4), navigate.
- On `401`: show "Invalid username/email or password."
- Link to `/register`.

### 6.2 Register screen (`/register`)

- Inputs: `username`, `email`, `name`, `password`.
- Client-side validation mirroring the DTO (§2.4). Show inline errors.
- Submit → `POST /auth/register`.
- On success: store token, resolve workspace, navigate.
- On `400 username already taken` / `email already taken`: show the relevant field error.
- Link to `/login`.

### 6.3 Workspace picker (`/workspaces`)

- List of the user's workspaces (`GET /workspaces`). Each item is a name + a "open" action.
- "Create new workspace" button → modal with `name` field → `POST /workspaces` → store the returned `access_token`, set `activeWorkspaceId`, navigate into it.
- Empty-state copy for when the list is empty.
- Useful entry point after logout-and-login, or accessible from a menu inside the app.

### 6.4 Workspace switcher (in-app)

A control in the main navigation (sidebar header) showing the current workspace name. Clicking it opens a menu:

- The user's other workspaces — click to navigate to `/w/:id/...`.
- "Manage workspace" → `/w/:workspaceId/settings`.
- "Create new workspace" → modal (same as above).

### 6.5 Workspace settings (`/w/:workspaceId/settings`)

Tabs or sections:

**General**
- Name field (inline edit) → `PATCH /workspaces/:id` (owner only; hide/disable for non-owners).

**Members**
- List of `memberIds` resolved to user objects. Each row shows name + username + email + "Owner" badge for the owner. For now the `WorkspaceDto` only returns ids — to render names, we need one of:
  - a server-side expansion of memberIds to UserDto (not implemented yet), or
  - a `GET /users/:id` endpoint (not implemented yet).
  - **MVP workaround:** show the current user clearly (from `/auth/me`) and render other members as their ids. Open a ticket to add member expansion server-side before this ships to real users.
- "Invite" field (username or email) → `POST /workspaces/:id/members` with `{ login }`. On `404 User not found`: show "No user with that username or email." On `400 User is already a member`: show "Already a member."
- Row action per member: "Remove" (owner removing someone) → `DELETE /workspaces/:id/members/:memberId`. Update local state.
- "Leave workspace" button (any non-owner) → `DELETE /workspaces/:id/members/:me` → force logout (see §4).

**Danger zone** (owner only)
- "Delete workspace" → confirmation modal → `DELETE /workspaces/:id` → force logout.

### 6.6 Access-denied / not-found screen

- On `403` from any workspace endpoint: render "You don't have access to this workspace" with a button "Back to workspaces" → `/workspaces`.
- On `404` from a workspace fetch where the user *should* have access: same thing, but copy "Workspace not found".

---

## 7. Required changes to existing data fetching

Every existing API call must be re-prefixed with `/api/workspaces/:workspaceId/...`. The path was previously flat. Example:

```diff
- http<Space[]>('/api/spaces')
+ http<Space[]>(`/api/workspaces/${workspaceId}/spaces`)
```

Recommended pattern: a small helper that takes the active workspace id from a Pinia store (or the router) and prefixes it, so call sites stay short.

```ts
// apps/web/src/app/api/httpClient.ts
function wsPath(workspaceId: string, path: string): string {
  return `/api/workspaces/${workspaceId}${path.startsWith('/') ? path : `/${path}`}`
}
```

Endpoints that need to be re-prefixed (non-exhaustive — migrate every current call site):

| Old path                         | New path                                                       |
| -------------------------------- | -------------------------------------------------------------- |
| `GET /api/spaces`                | `GET /api/workspaces/:wsId/spaces`                             |
| `POST /api/spaces`               | `POST /api/workspaces/:wsId/spaces`                            |
| `PATCH /api/spaces/:id`          | `PATCH /api/workspaces/:wsId/spaces/:id`                       |
| `DELETE /api/spaces/:id`         | `DELETE /api/workspaces/:wsId/spaces/:id`                      |
| `POST /api/spaces/reorder`       | `POST /api/workspaces/:wsId/spaces/reorder`                    |
| `GET /api/lists?spaceId=...`     | `GET /api/workspaces/:wsId/lists?spaceId=...`                  |
| `POST /api/lists`                | `POST /api/workspaces/:wsId/lists`                             |
| ...and so on for tasks, comments, files | `/api/workspaces/:wsId/tasks`, `/api/workspaces/:wsId/tasks/timeline`, `/api/workspaces/:wsId/tasks/:id`, `/api/workspaces/:wsId/tasks/:id/subtree`, `/api/workspaces/:wsId/tasks/:id/move`, `/api/workspaces/:wsId/tasks/:id/comments`, `/api/workspaces/:wsId/comments/:id`, `/api/workspaces/:wsId/files/:id` |

### 7.1 Attaching the Bearer token

Update [httpClient.ts](apps/web/src/app/api/httpClient.ts) to read `access_token` from storage and attach `Authorization` automatically. Centralize `401` handling here (clear storage + redirect to `/login`).

```ts
const token = localStorage.getItem('access_token')
const headers = {
  ...(init.body != null && !(init.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
  ...(token ? { authorization: `Bearer ${token}` } : {}),
  ...(init.headers ?? {}),
}
```

### 7.2 File downloads

Files are now scoped to a workspace. A stored file `<fileId>` is only downloadable via `/api/workspaces/:wsId/files/:fileId`. If you render attachment URLs anywhere (e.g. inside comment bodies), rebuild them to include the current workspace id.

---

## 8. State management recommendations

- `useAuthStore` (Pinia): `token`, `user`, `login()`, `register()`, `logout()`, `loadMe()`.
- `useWorkspacesStore`: `workspaces: WorkspaceDto[]`, `activeWorkspaceId: string | null`, `loadAll()`, `create()`, `rename()`, `remove()`, `addMember()`, `removeMember()`, `setActive()`.
- Reset all content stores (spaces, lists, tasks, comments) when `activeWorkspaceId` changes. The simplest is to key each store by workspace id or to call `$reset()` on switch.

---

## 9. Testing checklist

- [ ] Register → lands inside the auto-created workspace, content CRUD works.
- [ ] Logout → storage cleared, `/login` shows.
- [ ] Login with username and login with email both work.
- [ ] Wrong password → `401` handled inline, no crash.
- [ ] Creating a workspace replaces the token and lets the user open the new workspace's content immediately.
- [ ] Renaming a workspace as a non-owner is blocked client-side and would return `403` if attempted.
- [ ] Inviting a user by username/email adds them to `memberIds` in the next `GET /workspaces/:id`.
- [ ] Removing yourself from a workspace forces logout.
- [ ] Deleting a workspace forces logout and the workspace no longer appears after the next login.
- [ ] Typing a URL with a workspace id the user doesn't belong to → `/workspaces` picker (not a blank screen).
- [ ] File attachments uploaded in workspace A cannot be downloaded via workspace B's path (returns `403`).
- [ ] Token expiry (manually set `exp` in the past or wait) → next call returns `401`, UI logs out cleanly.

---

## 10. Open follow-ups (not blocking MVP, but flag to backend)

- Member expansion on `WorkspaceDto` (return `members: UserDto[]` alongside `memberIds`) so the Members tab can render names without a second lookup.
- A token-refresh or self-info endpoint that re-issues a JWT for the current user, so "leave workspace" and "delete workspace" don't require a full re-login.
- Per-user avatars / display images — currently `UserDto` has no avatar field.
