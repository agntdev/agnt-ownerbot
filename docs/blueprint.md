# Owner-Controlled Execution Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that executes arbitrary instructions exclusively from a pre-configured owner account, with immediate execution, owner authentication, and action logging. Supports text/structured commands and maintains audit logs with configurable retention.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- single owner account

## Success criteria

- Execute owner instructions immediately without confirmation
- Reject all non-owner commands with access-denied
- Maintain auditable action logs with timestamps and outcomes

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open owner authentication menu
- **/execute** (command, actor: user, command: /execute) — Submit arbitrary instruction for immediate execution
  - inputs: instruction_text
  - outputs: execution_result
- **View Logs** (button, actor: user, callback: logs:show) — Display recent action logs
  - inputs: log_filter
  - outputs: log_entries

## Flows

### Owner Authentication
_Trigger:_ any message to bot

1. Verify sender is configured owner
2. Reject non-owner with access-denied
3. Process instruction if owner

_Data touched:_ Owner, Instruction

### Instruction Execution
_Trigger:_ /execute or text message

1. Parse instruction content
2. Execute without confirmation
3. Send execution summary
4. Log action with timestamp

_Data touched:_ Instruction, ActionRecord

### Log Management
_Trigger:_ logs:show callback

1. Fetch recent logs
2. Format filtered log entries
3. Display with pagination controls

_Data touched:_ ActionRecord

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Owner** _(retention: persistent)_ — Telegram user ID with execution privileges
  - fields: telegram_user_id, authentication_token
- **Instruction** _(retention: session)_ — User-submitted command for execution
  - fields: raw_text, parsed_command, execution_context
- **ActionRecord** _(retention: persistent)_ — Logged execution history
  - fields: timestamp, instruction, result, error_details

## Integrations

- **Telegram** (required) — Bot API messaging and owner authentication
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Set primary owner Telegram ID
- Configure log retention period (default 90 days)
- View execution logs with filters

## Notifications

- Immediate execution confirmation in original chat
- Error notifications with stack traces for failed actions
- Log retention expiration warnings

## Permissions & privacy

- Strict owner authentication via pre-configured user ID
- No third-party data sharing
- All logs stored securely with owner access only

## Edge cases

- Non-owner command attempts
- Malformed instruction parsing
- Long-running execution tasks
- Log retention period expiration

## Required tests

- Verify owner-only access enforcement
- Test immediate execution without confirmation
- Validate log persistence and retention rules
- Confirm error handling with detailed reporting

## Assumptions

- Owner will provide valid Telegram user ID during setup
- Execution environment has required permissions for all actions
- Default 90-day retention is acceptable unless specified
