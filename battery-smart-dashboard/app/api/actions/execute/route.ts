import { NextRequest, NextResponse } from 'next/server';
import { appendN8nEvent } from '@/lib/store-n8n-events';
import { prisma } from '@/lib/prisma';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? process.env.N8N_ACTIONS_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { actionId, title, payload = {} } = body as {
    actionId?: number;
    title?: string;
    payload?: Record<string, unknown>;
  };

  const actionTitle = title ?? `Action ${actionId ?? 'unknown'}`;

  let runId: string | undefined;

  if (!N8N_WEBHOOK_URL) {
    runId = `local-${Date.now()}`;
    appendN8nEvent('action_executed', {
      actionId,
      title: actionTitle,
      payload,
      simulated: true,
      message: 'n8n not configured; action logged only.',
    });
  } else {
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          title: actionTitle,
          source: 'battery-smart-dashboard',
          ...payload,
        }),
      });

      const data = await res.json().catch(() => ({}));
      runId = (data as { executionId?: string }).executionId ?? (data as { runId?: string }).runId ?? `n8n-${Date.now()}`;

      appendN8nEvent('action_executed', {
        actionId,
        title: actionTitle,
        payload,
        runId,
        status: res.ok ? 'ok' : 'error',
        statusCode: res.status,
      });

      if (!res.ok) {
        await logAction(actionId, actionTitle, payload, runId);
        return NextResponse.json(
          { ok: false, error: 'Workflow request failed', statusCode: res.status, runId },
          { status: 502 }
        );
      }
    } catch (err) {
      console.error('Execute action error:', err);
      runId = `err-${Date.now()}`;
      appendN8nEvent('action_error', {
        actionId,
        title: actionTitle,
        payload,
        error: err instanceof Error ? err.message : 'Request failed',
      });
      await logAction(actionId, actionTitle, payload, runId);
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Execute failed', runId },
        { status: 500 }
      );
    }
  }

  await logAction(actionId, actionTitle, payload, runId);

  return NextResponse.json({
    ok: true,
    runId,
    ...(N8N_WEBHOOK_URL ? {} : { simulated: true, message: 'Action recorded. Configure N8N_WEBHOOK_URL to run real workflows.' }),
  });
}

async function logAction(
  actionId: number | undefined,
  title: string,
  payload: Record<string, unknown>,
  runId?: string
) {
  try {
    await prisma.actionLog.create({
      data: {
        actionId: actionId ?? 0,
        title,
        payload: JSON.stringify(payload),
        runId: runId ?? null,
        source: 'dashboard',
      },
    });
  } catch (e) {
    console.error('ActionLog create error:', e);
  }
}
