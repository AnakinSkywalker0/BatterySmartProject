/** In-memory store for n8n webhook events. Client can poll /api/n8n-events and merge into localStorage. */
const MAX_EVENTS = 100;

export interface N8nWebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

const events: N8nWebhookEvent[] = [];

export function appendN8nEvent(type: string, payload: Record<string, unknown>): void {
  events.unshift({
    id: `n8n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    receivedAt: new Date().toISOString(),
  });
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
}

export function getN8nEvents(limit = 50): N8nWebhookEvent[] {
  return events.slice(0, limit);
}

export function clearN8nEvents(): void {
  events.length = 0;
}
