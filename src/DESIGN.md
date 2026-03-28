# Design System Document

## 1. Overview & Creative North Star: "The Digital Pavilion"

This design system is built to transform the chaotic, data-heavy environment of cricket scoring into a high-end, editorial experience. We are moving away from the "utility-first" spreadsheets of the past toward a "Digital Pavilion" aesthetic—one that balances the prestige of the MCC with the high-velocity energy of T20 cricket.

### The Creative North Star: Kinetic Elegance
The system breaks the "template" look through **intentional asymmetry** and **tonal depth**. Rather than rigid grids, we use overlapping score overlays and high-contrast typography scales. The goal is to make every match feel like a broadcast-quality production. We achieve this by prioritizing breathing room (whitespace) over lines, and using depth to guide the scorer’s eye through the heat of the game.

---

## 2. Color & Surface Philosophy

Our palette is rooted in the heritage of the game—deep pitch greens and gold highlights—but executed with modern digital sophistication.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. 
- Use `surface-container-low` (#f3f3f6) for general layout sections.
- Use `surface-container-highest` (#e2e2e5) to define high-priority interactive zones.
- This creates a seamless, "molded" look rather than a boxy, fragmented one.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
- **Base Layer:** `surface` (#f9f9fc) for the overall background.
- **Content Blocks:** Use `surface-container` (#eeeef0) for the main scoring dashboard.
- **Interactive Elements:** Nested cards (e.g., individual player stats) should use `surface-container-lowest` (#ffffff) to "lift" off the page naturally.

### The "Glass & Gradient" Rule
To elevate the professional polish:
- **Floating Overlays:** Use `surface_variant` at 80% opacity with a `20px` backdrop-blur for mid-match pop-ups (e.g., Toss results or DRs).
- **Signature CTAs:** Main action buttons (e.g., "Start Match") should utilize a subtle linear gradient from `primary` (#004a23) to `primary_container` (#006432) at a 135-degree angle.

---

## 3. Typography Scale

The typography is a dialogue between the technical (Inter) and the impactful (Plus Jakarta Sans/Roboto). 

| Category | Token | Font Family | Size | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | Large-scale match scores. |
| **Headline**| `headline-md` | Plus Jakarta Sans | 1.75rem | Section headers (e.g., "First Innings"). |
| **Title**   | `title-lg` | Inter | 1.375rem | Player names in the main feed. |
| **Body**    | `body-md` | Inter | 0.875rem | General statistics and metadata. |
| **Label**   | `label-sm` | Inter | 0.6875rem | Over counters and ball-by-ball labels. |

**Editorial Note:** Use `display` tokens for numbers to give them a "scoreboard" weight. Inter should remain clean and utilitarian for readability in player names and secondary stats.

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f3f3f6) background. This creates a soft, natural lift without the "dirty" look of heavy shadows.
- **Ambient Shadows:** When a floating effect is required (e.g., a "New Over" modal), use an extra-diffused shadow: `0px 12px 32px rgba(26, 28, 30, 0.06)`. Note the low opacity; it mimics natural stadium lighting.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline_variant` at **15% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Component Signature Styles

### Buttons (The Core Action)
- **Primary:** `primary` (#004a23) background, `on_primary` (#ffffff) text. Radius: `8px`. Use for "Record Ball."
- **Action-Soft (Secondary):** `on_primary_container` (#8ade9f) background. Use for "Undo" or "Swap Ends." This provides a lower-stress visual path for corrective actions.
- **Danger:** `tertiary_container` (#a52423) for "Wicket." It must be high-contrast and immediate.

### The "Ball-by-Ball" Chips
- **Geometry:** Perfect circles (Radius: `full`).
- **Styling:** Use `secondary_container` (#fcd400) for boundaries (4s/6s) and `tertiary` (#83060f) for wickets.
- **Spacing:** Use spacing scale `1.5` (0.3rem) between balls to create a "ribbon" effect rather than a grid.

### Cards & Lists (The Scorecard)
- **Rule:** Forbid divider lines. Use spacing scale `4` (0.9rem) between player rows.
- **Asymmetry:** For player stats, left-align the name (`title-md`) and right-align the strike rate and runs in a `surface-container-high` (#e8e8ea) pill for visual "anchoring."

### Inputs
- **Text Fields:** Use `surface_container_lowest` for the field with a `1.5` stroke of `outline_variant` at 20% opacity. Label must be `label-md` in `on_surface_variant`.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `secondary` (#705d00) sparingly to highlight key milestones (e.g., 50s, 100s, or the Toss).
- **Do** utilize the `1.5rem` (`xl`) radius for match-summary cards to soften the data-heavy layout.
- **Do** lean into `surface-dim` (#dadadc) for disabled or inactive innings to maintain focus on the live game.

### Don’t
- **Don't** use black (#000000). Use `on_background` (#1a1c1e) for all "black" text to maintain a premium, ink-like feel.
- **Don't** use standard "Success Green." Only use the specified `primary` and `action-soft-green` to keep the palette grounded in cricket's brand identity.
- **Don't** use shadows on buttons. Let the color weight and background contrast define the clickability.

---

## 7. Context-Specific Components

### The "Over Progress" Ribbon
A horizontal container using `surface-container-low` with nested ball-icons. Instead of a box, use a `1.5rem` (`xl`) rounded top-edge to make it feel integrated into the bottom of the screen.

### The "Wicket Alert" Overlay
A full-screen `tertiary` (#83060f) wash with 40% opacity, utilizing `display-lg` typography to announce the wicket. This brings the "high-contrast, sports-focused" requirement to life during peak emotional moments.