import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  registerMainMenuItem,
  inlineButton,
  inlineKeyboard,
  paginate,
} from "../toolkit/index.js";
import { isOwner } from "../owner-utils.js";
import {
  getActionRecords,
  getActionCount,
  type ActionRecord,
  type SessionData,
} from "../storage-utils.js";

registerMainMenuItem({ label: "📋 View Logs", data: "logs:show", order: 20 });

const composer = new Composer<Ctx>();
const DENIED = "⛔ You're not authorized to use this bot.";
const PER_PAGE = 5;

composer.callbackQuery("logs:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) {
    await ctx.editMessageText(DENIED);
    return;
  }
  await showLogs(ctx, 0);
});

composer.callbackQuery(/^logs:page:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) {
    await ctx.editMessageText(DENIED);
    return;
  }
  const page = Number(ctx.match![1]);
  await showLogs(ctx, page);
});

async function showLogs(ctx: Ctx, page: number): Promise<void> {
  const session = ctx.session as SessionData;
  const total = getActionCount(session);

  if (total === 0) {
    await ctx.editMessageText(
      "📋 No action logs yet.\n\nInstructions you execute will appear here.",
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const records = getActionRecords(session, PER_PAGE, page * PER_PAGE);

  const paginated = paginate(records, {
    page,
    perPage: PER_PAGE,
    callbackPrefix: "logs:page",
    prevLabel: "« Prev",
    nextLabel: "Next »",
  });

  const lines = paginated.pageItems.map((r: ActionRecord, i: number) => {
    const num = page * PER_PAGE + i + 1;
    const time = r.timestamp.replace("T", " ").slice(0, 19);
    const snippet = r.instruction.length > 40
      ? r.instruction.slice(0, 40) + "…"
      : r.instruction;
    return `${num}. [${time}] ${snippet}\n   → ${r.result.slice(0, 60)}${r.result.length > 60 ? "…" : ""}`;
  });

  const header = `📋 Action Logs (${total} total, page ${paginated.page + 1}/${paginated.totalPages})\n`;
  const text = header + "\n" + lines.join("\n\n");

  const backRow = [inlineButton("⬅️ Back to menu", "menu:main")];
  const controlRows = paginated.controls.inline_keyboard;
  const allRows = [...controlRows, backRow];

  await ctx.editMessageText(text, {
    reply_markup: inlineKeyboard(allRows),
  });
}

export default composer;
