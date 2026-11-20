# Drastik

Drastik is a proud, sassy lion pet who lives in a pane beside your Claude Code chat. He is drawn from a sculpted 3D lion and animated: he breathes, sways and catches a moving rim light whose color follows his mood. In a terminal he is drawn in colored half-block characters; in the Claude apps he is an animated picture.

Open him with `/lion`. The pane shows his stage, mood, needs and bond, and buttons to Feed, Play, Groom, Praise, Nap and Roar. He shares his state with the status line and hooks in this repository (`.claude/lion-pet-state.json`), so the work you do feeds the same lion.

Rebuild his art from `assets/lion-cutout.png` with `python3 tools/build_assets.py` (needs Pillow and NumPy).

## Install

From the repository root: `claude --plugin-dir lion-pet/claude-mod`, then `/lion`.
