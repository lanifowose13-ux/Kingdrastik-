# Drastik

Drastik is a proud, sassy lion pet who lives in a pane beside your Claude Code chat. She is drawn from a sculpted 3D lion and animated: she breathes, sways and catches a moving rim light whose color follows her mood. In a terminal she is drawn in colored half-block characters; in the Claude apps she is an animated picture.

Open her with `/lion`. The pane shows her stage, mood, needs and bond, and buttons to Feed, Play, Groom, Praise, Nap and Roar her. She shares her state with the status line and hooks in this repository (`.claude/lion-pet-state.json`), so the work you do feeds the same lion.

Rebuild the art from `assets/lion-cutout.png` with `python3 tools/build_assets.py` (needs Pillow and NumPy).

## Install

From the repository root: `claude --plugin-dir lion-pet/claude-mod`, then `/lion`.
