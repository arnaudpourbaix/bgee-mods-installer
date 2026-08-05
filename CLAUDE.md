# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Notifications during mod installs

Installs driven through this CLI (`ModService.install`, `execWeidu`, etc.) can run long and sometimes
require interactive input (WeiDU prompts, install-order choices, or a question from Claude itself).

When installing one of the mods below, proactively use the `PushNotification` tool as soon as a
question needs the user's input — don't wait, since they may have walked away during a slow install.
For mods not on this list, use normal judgment (per the tool's own guidance: don't over-notify).

**Slow / notify-worthy mods:**
- `STRATAGEMS` (SCS) — long compile time, many install-order/tweak prompts
- `ITEM_REV`
- `SPELL_REV`
- `FAITHS_AND_POWERS`
- `ARTISANSKITPACK`
- `JTWEAKS`
- `CDTWEAKS`

To add more, append the mod's `tp2File` folder name (as it appears in `weiDU.log`, e.g. `assets/current/BG1.log`
or `assets/current/BG2.log`) to the list above.
