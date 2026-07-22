import type { Ctx } from "./bot.js";

let _ownerId: number | null = null;

export function getOwnerId(): number | null {
  if (_ownerId === null) {
    const raw = process.env.OWNER_ID;
    if (raw) _ownerId = Number(raw);
  }
  return _ownerId;
}

export function isOwner(ctx: Ctx): boolean {
  const ownerId = getOwnerId();
  return ownerId !== null && ctx.from?.id === ownerId;
}
