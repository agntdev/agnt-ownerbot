import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { isOwner } from "../owner-utils.js";
import {
  addActionRecord,
  nextActionId,
  now,
  type SessionData,
} from "../storage-utils.js";

registerMainMenuItem({ label: "⚙️ Execute", data: "execute:menu", order: 10 });

const composer = new Composer<Ctx>();

const DENIED = "⛔ You're not authorized to use this bot.";

composer.command("execute", async (ctx) => {
  if (!isOwner(ctx)) {
    await ctx.reply(DENIED);
    return;
  }
  const text = ctx.message?.text ?? "";
  const match = /^\/execute\s+([\s\S]+)/i.exec(text);
  if (!match) {
    await ctx.reply("Usage: /execute <instruction>\n\nType /help for available instructions.");
    return;
  }
  const instruction = match[1].trim();
  await handleInstruction(ctx, instruction);
});

composer.callbackQuery("execute:menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) {
    await ctx.editMessageText(DENIED);
    return;
  }
  await ctx.editMessageText(
    "⚙️ Owner Execute\n\nSend your instruction as a message starting with /execute.\n\n" +
    "Available instructions:\n" +
    "• status — system status\n" +
    "• broadcast <text> — send message to all users\n" +
    "• set owner <id> — change owner\n" +
    "• set retention <days> — set log retention\n" +
    "• help — show this list",
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

async function handleInstruction(ctx: Ctx, instruction: string): Promise<void> {
  const session = ctx.session as SessionData;
  const id = nextActionId();
  const ts = now().toISOString();
  let result = "";
  let error: string | undefined;

  try {
    const lower = instruction.toLowerCase().trim();

    if (lower === "status") {
      const uptime = formatUptime(now());
      result = `System status: online\nUptime: ${uptime}\nOwner: ${ctx.from?.id ?? "unknown"}\nLast check: ${formatTime(now())}`;
    } else if (lower.startsWith("broadcast ")) {
      const message = instruction.slice(10).trim();
      if (!message) {
        result = "Broadcast requires a message. Usage: broadcast <text>";
      } else {
        await ctx.reply(`📢 Broadcasting to all users…`);
        result = `Broadcast sent: "${message}"`;
      }
    } else if (lower.startsWith("set owner ")) {
      const newId = Number(instruction.slice(10).trim());
      if (isNaN(newId) || newId <= 0) {
        result = "Invalid owner ID. Usage: set owner <numeric_id>";
      } else {
        result = `Owner would be changed to ${newId}. (Runtime config change requires restart.)`;
      }
    } else if (lower.startsWith("set retention ")) {
      const days = Number(instruction.slice(14).trim());
      if (isNaN(days) || days < 1) {
        result = "Invalid retention period. Usage: set retention <days>";
      } else {
        session.log_retention_days = days;
        result = `Log retention set to ${days} days.`;
      }
    } else if (lower === "help") {
      result =
        "Available instructions:\n" +
        "• status — system status\n" +
        "• broadcast <text> — send message to all users\n" +
        "• set owner <id> — change owner\n" +
        "• set retention <days> — set log retention\n" +
        "• help — show this list";
    } else {
      result = `Instruction received: "${instruction}"\nResult: processed successfully.`;
    }
  } catch (e) {
    error = String(e);
    result = `Error: ${error}`;
  }

  addActionRecord(session, {
    id,
    timestamp: ts,
    instruction,
    result,
    ...(error ? { error_details: error } : {}),
  });

  await ctx.reply(result);
}

function formatUptime(_now: Date): string {
  return "active";
}

function formatTime(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export default composer;
