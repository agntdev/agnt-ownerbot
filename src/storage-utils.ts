export interface ActionRecord {
  id: string;
  timestamp: string;
  instruction: string;
  result: string;
  error_details?: string;
}

export interface SessionData {
  actions?: ActionRecord[];
  log_retention_days?: number;
}

let _seq = 0;
export function nextActionId(): string {
  return `act_${Date.now()}_${++_seq}`;
}

export function now(): Date {
  return new Date();
}

export function addActionRecord(session: SessionData, record: ActionRecord): void {
  if (!session.actions) session.actions = [];
  session.actions.push(record);
}

export function getActionRecords(
  session: SessionData,
  limit = 10,
  offset = 0,
): ActionRecord[] {
  const all = session.actions ?? [];
  return all.slice().reverse().slice(offset, offset + limit);
}

export function getActionCount(session: SessionData): number {
  return (session.actions ?? []).length;
}
