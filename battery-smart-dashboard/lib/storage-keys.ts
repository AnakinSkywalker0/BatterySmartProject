/** LocalStorage keys used across the dashboard. */
export const STORAGE_KEYS = {
  CHAT_HISTORY: 'battery-smart-chat-history',
  RECENT_ACTIONS: 'battery-smart-recent-actions',
  LANGUAGE: 'battery-smart-language',
  AGENT_STATUS: 'battery-smart-agent-status',
  N8N_EVENTS: 'battery-smart-n8n-events',
} as const;

export type Language = 'en' | 'hi';
export type AgentStatus = 'idle' | 'monitoring' | 'acting';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

export interface RecentAction {
  timestamp: string;
  title: string;
  actionId?: number;
  n8nRunId?: string;
}

export interface N8nEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota or parse errors
  }
}

export const storage = {
  getChatHistory: (): ChatMessage[] =>
    safeParse<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY, []),
  setChatHistory: (messages: ChatMessage[]) =>
    safeSet(STORAGE_KEYS.CHAT_HISTORY, messages),

  getRecentActions: (): RecentAction[] =>
    safeParse<RecentAction[]>(STORAGE_KEYS.RECENT_ACTIONS, []),
  setRecentActions: (actions: RecentAction[]) =>
    safeSet(STORAGE_KEYS.RECENT_ACTIONS, actions),

  getLanguage: (): Language =>
    safeParse<Language>(STORAGE_KEYS.LANGUAGE, 'en'),
  setLanguage: (lang: Language) =>
    safeSet(STORAGE_KEYS.LANGUAGE, lang),

  getAgentStatus: (): AgentStatus =>
    safeParse<AgentStatus>(STORAGE_KEYS.AGENT_STATUS, 'monitoring'),
  setAgentStatus: (status: AgentStatus) =>
    safeSet(STORAGE_KEYS.AGENT_STATUS, status),

  getN8nEvents: (): N8nEvent[] =>
    safeParse<N8nEvent[]>(STORAGE_KEYS.N8N_EVENTS, []),
  setN8nEvents: (events: N8nEvent[]) =>
    safeSet(STORAGE_KEYS.N8N_EVENTS, events),
};
