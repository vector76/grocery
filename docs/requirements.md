# Grocery List — Requirements

## Context
- Web app hosted on GitHub Pages (static hosting, no backend).
- Primary use: mobile browser, portrait.

## Platform & stack
- **Single user.** No sharing, no sync.
- **Storage: localStorage.** Per-device. Each device stands alone. No backup/export.
- **Stack: plain HTML / CSS / JS.** No framework, no build step.
- **Not a PWA.** Plain web page — no manifest, no service worker.
- Portrait-only.

## Data model
- **Plain items.** Just a name — no quantity, unit, notes, or categories.
- **Two item types:**
  - *Common items* — persistent catalog of recurring things (milk, bananas). Manually added.
  - *One-off items* — added for a single trip; vanish when cleared.
- **Current shopping list** — the set of items (common + one-off) selected for this trip, each with a checked/unchecked state.

## Two screens

### Edit screen (list-building)
Manage the catalog, build the list, and clear the list after a trip.

**Layout:** unified view of all common items with an "on list / not on list" toggle per item, plus a separate section listing the one-off items currently on the list.

**Item entry:** single text input. Submitting adds a one-off to the current list. (Promoting it to common is a second step via the item's edit control. No autocomplete against common items — can revisit if duplicates become a problem.)

**Per-item edit controls:**
- *Common item:* edit name (fix spelling), delete (remove from catalog), demote.
- *One-off item:* edit name, promote.

**List-clearing buttons:**
- **"Clear checked"** — removes checked items from the shopping list.
  - Checked one-offs → vanish entirely.
  - Checked common items → removed from the list, stay in the catalog.
  - Unchecked items → remain (carried to next trip).
- **"Clear all"** — empties the shopping list entirely (checked or not). One-offs vanish; common items stay in the catalog.

Ending a trip = using one of those two buttons. No separate "done shopping" action.

### Shopping screen
- Shows the current shopping list.
- Each item has a checkbox. Tap to check / uncheck.
- Checked items stay visible.
- No clearing here — that's an edit-screen action.

### Mode switch
Explicit navigation between the two screens. Checked/unchecked state is preserved when moving between them, so switching back mid-trip doesn't lose progress.

## Promote / demote
- **Promote** (one-off → common): item is added to the common catalog; stays on the current list.
- **Demote** (common → one-off): item is removed from the common catalog; stays on the current list as a one-off.

## Item order

### Shopping screen
- Items split into two groups: **unchecked first, checked after.**
- Base order is order added to the list.
- Checking an item moves it to become the **first** checked item (just after the last unchecked).
- Unchecking an item moves it to become the **last** unchecked item (just above the first checked).

### Edit screen
- Common-items view: order added to the catalog.
- One-offs section: order added to the list.

## Styling
- Dark mode. No theme toggle.
- Clean, big tap targets.
- No specific visual reference — sensible defaults.

## Non-goals
- Quantities, units, notes, categories
- Backup / export / import
- Cross-device sync
- Multi-user / sharing
- Barcode scanning
- Price tracking / budgets
- Recipes / meal planning
- Store-specific integrations
- History of past trips
- PWA / offline / installable
- Landscape layout
- Autocomplete / duplicate prevention
- Drag-to-reorder
