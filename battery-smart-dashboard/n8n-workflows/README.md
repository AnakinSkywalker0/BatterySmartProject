# n8n Workflows for Battery Smart Dashboard

This folder contains n8n workflow definitions that plug into the Battery Smart dashboard.

## Battery Smart - Dashboard Actions

**File:** `battery-smart-actions.json`

**Purpose:** Receives action executions from the dashboard (Reroute, Maintenance, Rebalance), runs the corresponding logic, then notifies the dashboard and responds to the caller.

**Flow (aligned with your existing n8n style):**

1. **Dashboard Action Webhook** – Trigger. Receives `POST` with body:
   - `actionId`: `1` = Reroute, `2` = Maintenance, `3` = Rebalance
   - `title`: e.g. `"Reroute to DEL-03"`
   - `payload`: e.g. `{ "subtitle": "Low load (25%)" }`
   - `source`: `"battery-smart-dashboard"`

2. **If nodes** – Branch by `actionId` (same pattern as your “Is Med Alert?” / “User Exists?”):
   - **Is Reroute?** → Set Reroute Payload → Reroute Action (Placeholder)
   - **Is Maintenance?** → Set Maintenance Payload → Maintenance Action (Placeholder)
   - **Is Rebalance?** → Set Rebalance Payload → Rebalance Action (Placeholder)

3. **Set nodes** – Shape payload (like your “Set Preferences (Existing User)1”).

4. **Real APIs (three branches):**
   - **Reroute** → **Twilio SMS** – `POST https://api.twilio.com/.../Messages.json` (notify drivers to reroute)
   - **Maintenance** → **Jira** – `POST https://{domain}.atlassian.net/rest/api/3/issue` (create maintenance ticket)
   - **Rebalance** → **Inventory API** – `POST {INVENTORY_API_URL}/v1/inventory/transfer` (transfer batteries between stations)

5. **Callback to Dashboard** – `POST` to your app’s webhook with:
   - `type`: `"action_completed"`
   - `actionId`, `title`, `payload`, `completedAt`, `runId`  
   URL is taken from n8n env `DASHBOARD_WEBHOOK_URL` (e.g. `https://your-app.vercel.app/api/webhooks/n8n`).

6. **Respond to Webhook** – Sends JSON back to the dashboard (`ok`, `runId`, `actionId`).

### How to test

**Option A – Dashboard only (no n8n)**  
1. In the project root, don’t set `N8N_WEBHOOK_URL` (or leave it empty in `.env`).  
2. Run the app: `pnpm dev` (or `npm run dev`).  
3. Open the dashboard, go to the **Actions** panel, and click **Execute** on any action (Reroute, Maintenance, Rebalance).  
4. You should see the action appear under **Recent Actions** and in the UI; the app responds with `simulated: true` because n8n isn’t configured.

**Option B – Dashboard + n8n (full flow)**  
1. **Start n8n** (Docker or local):  
   `docker run -it --rm -p 5678:5678 n8nio/n8n`  
   Or install and run n8n locally. Open http://localhost:5678.  
2. **Import the workflow:** Workflows → Import from File → `n8n-workflows/battery-smart-actions.json`.  
3. **Activate the workflow** (toggle in n8n).  
4. **Copy the Production webhook URL** from the “Dashboard Action Webhook” node (e.g. `http://localhost:5678/webhook/battery-smart-actions` for local).  
5. **Set dashboard env:** in project root `.env` add:  
   `N8N_WEBHOOK_URL=http://localhost:5678/webhook/battery-smart-actions`  
   (Use your real n8n URL if not local.)  
6. **Optional – callback:** To have n8n notify the app, set in n8n env (or in the “Callback to Dashboard” node):  
   `DASHBOARD_WEBHOOK_URL=http://localhost:3000/api/webhooks/n8n`  
   (Replace with your app URL; for local dev use `http://localhost:3000` if the app runs on 3000.)  
7. **Run the app:** `pnpm dev`, open the dashboard, and click **Execute** on an action.  
8. In n8n, open **Executions** and confirm a run for that action; the branch (Reroute / Maintenance / Rebalance) will run. If Twilio/Jira/Inventory aren’t configured, those HTTP nodes may fail; you can temporarily point them to `https://httpbin.org/post` to test the flow without real APIs.

**Option C – Call the APIs directly (curl)**  
- **Dashboard execute (simulated if no n8n):**  
  `curl -X POST http://localhost:3000/api/actions/execute -H "Content-Type: application/json" -d "{\"actionId\":1,\"title\":\"Reroute to DEL-03\",\"payload\":{\"subtitle\":\"Low load (25%)\"}}"`  
- **n8n webhook (when n8n is running):**  
  `curl -X POST http://localhost:5678/webhook/battery-smart-actions -H "Content-Type: application/json" -d "{\"actionId\":1,\"title\":\"Reroute to DEL-03\",\"payload\":{\"subtitle\":\"Low load (25%)\"},\"source\":\"battery-smart-dashboard\"}"`  
  Replace the URL with your n8n Production webhook URL.

---

### How to use

1. **Import in n8n**  
   In n8n: Workflows → Import from File → choose `battery-smart-actions.json`.

2. **Webhook URL**  
   After import, open the “Dashboard Action Webhook” node and copy the **Production** webhook URL (e.g. `https://your-n8n.com/webhook/battery-smart-actions`).

3. **Dashboard env**  
   In the Battery Smart app (e.g. `.env` or Vercel):
   ```bash
   N8N_WEBHOOK_URL=https://your-n8n.com/webhook/battery-smart-actions
   ```
   Or use `N8N_ACTIONS_WEBHOOK_URL` (same value).

4. **Callback URL (optional)**  
   So n8n can notify the app when an action is done, set in n8n (e.g. env or workflow expression):
   ```bash
   DASHBOARD_WEBHOOK_URL=https://your-app.vercel.app/api/webhooks/n8n
   ```
   Replace with your real dashboard base URL. The workflow uses this in the “Callback to Dashboard” HTTP node.

5. **Configure the three APIs**  
   Set n8n **environment variables** and **credentials** as below.

### Action IDs (match dashboard)

| actionId | Title example              | Branch      |
|----------|----------------------------|-------------|
| 1        | Reroute to DEL-03          | Reroute     |
| 2        | Raise Maintenance Ticket   | Maintenance |
| 3        | Rebalance Inventory        | Rebalance   |

The dashboard already sends these when the user clicks Execute in the Action Panel; no dashboard code change is required for this workflow.

---

## 1. Reroute – Twilio SMS API

**Node:** `Twilio SMS (Reroute Drivers)`  
**API:** [Twilio Messages](https://www.twilio.com/docs/messaging/api/message-resource) – send SMS to drivers to reroute.

**n8n setup:**

- **Credentials:** Attach **HTTP Basic Auth** to the node.  
  - User: your **Twilio Account SID**  
  - Password: your **Twilio Auth Token**

- **Environment variables (optional overrides):**
  - `TWILIO_ACCOUNT_SID` – used in the request URL (or set in credential)
  - `TWILIO_FROM_NUMBER` – your Twilio phone number (e.g. `+1234567890`)
  - `TWILIO_DRIVER_PHONE` – default “To” number for testing (e.g. `+919876543210`)

**Request:** `POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`  
**Body (form-urlencoded):** `To`, `From`, `Body` (message built from dashboard `title` + `payload.subtitle`).

---

## 2. Maintenance – Jira Create Issue API

**Node:** `Jira Create Maintenance Ticket`  
**API:** [Jira REST API – Create issue](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post) – create a maintenance task.

**n8n setup:**

- **Credentials:** Attach **HTTP Basic Auth** to the node.  
  - User: your **Jira account email**  
  - Password: your **Jira API token** ([Create API token](https://id.atlassian.com/manage-profile/security/api-tokens))

- **Environment variables (optional overrides):**
  - `JIRA_DOMAIN` – your Atlassian domain (e.g. `mycompany` for `mycompany.atlassian.net`)
  - `JIRA_PROJECT_KEY` – project key for new issues (e.g. `FLEET`)
  - `JIRA_ISSUE_TYPE` – issue type name (e.g. `Task`, `Bug`)

**Request:** `POST https://{JIRA_DOMAIN}.atlassian.net/rest/api/3/issue`  
**Body (JSON):** `fields.project.key`, `fields.issuetype.name`, `fields.summary` (from dashboard `title`), `fields.description` (from `payload.subtitle` e.g. “Root cause: Overheat”).

---

## 3. Rebalance – Inventory Transfer API

**Node:** `Inventory Transfer API (Rebalance)`  
**API:** Your own or third-party inventory/fleet API – create a battery transfer (e.g. DEL-07 → DEL-05, quantity 20).

**n8n setup:**

- **Environment variables (required):**
  - `INVENTORY_API_URL` – base URL (e.g. `https://api.batterysmart.io`). Request URL is `{INVENTORY_API_URL}/v1/inventory/transfer`.
  - `INVENTORY_API_KEY` – API key or Bearer token; sent as `Authorization: Bearer {key}` and `x-api-key: {key}`.

**Request:** `POST {INVENTORY_API_URL}/v1/inventory/transfer`  
**Body (JSON):** `fromStation` (DEL-07), `toStation` (DEL-05), `quantity` (20), `reason` (from dashboard title + payload), `source` (battery-smart-dashboard).

If you use a different endpoint or body shape, edit the node URL and `jsonBody` in the workflow to match your API.
