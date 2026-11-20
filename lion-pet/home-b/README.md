# Drastik in Claude Code (Home B)

A proud, sassy lion in your status line. Your work feeds him. This lion is separate from the one on the Claude page (Home A): same character and rules, separate state.

State lives in `~/.claude/lion-pet/state.json` (override with `LION_STATE`).

## Install

Add to `~/.claude/settings.json`, replacing `/ABS/PATH` with the absolute path to this repo's `lion-pet/home-b`:

```json
{
  "statusLine": { "type": "command", "command": "node /ABS/PATH/lion-pet/home-b/cli.mjs status" },
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "node /ABS/PATH/lion-pet/home-b/cli.mjs event feed" }] }],
    "PostToolUseFailure": [{ "hooks": [{ "type": "command", "command": "node /ABS/PATH/lion-pet/home-b/cli.mjs event sulk" }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node /ABS/PATH/lion-pet/home-b/cli.mjs event praise" }] }]
  }
}
```

## What feeds him

| Event | Effect |
|---|---|
| Claude finishes a turn | Feed |
| A tool call fails | He sulks (pride -8) |
| You say thanks / nice / good job / well done | Praise |
| You are away 30+ minutes | He naps (energy recovers) |

The hooks always exit 0 and print nothing, so he can never block Claude Code. He never dies; neglect only makes him dramatic.

## Try it

```
node cli.mjs status
node cli.mjs event feed
```
