# Design Notes — ATM Simulator Platform

Tokens extracted from `base24-eps-simulator` (vanilla CSS → adapted to Tailwind).

## Color Palette

| Token              | Hex       | Usage                        |
|--------------------|-----------|------------------------------|
| eclipse-bg         | #F0F0F0   | Main window background       |
| eclipse-sidebar    | #F5F5F5   | Sidebar background           |
| eclipse-titlebar   | #2B2D3A   | Title bar, menu bar          |
| eclipse-dark       | #1E1E1E   | Console/dark panel bg        |
| eclipse-border     | #C8C8C8   | Standard borders             |
| eclipse-border-lt  | #E4E4E4   | Light borders, grid cells    |
| eclipse-blue       | #0451A5   | Links, focus, legend text    |
| eclipse-blue-act   | #0070C8   | Primary buttons, focus ring  |
| eclipse-hover      | #CCE4F7   | Hover background             |
| eclipse-hover-bd   | #82BDDB   | Hover border                 |
| eclipse-active     | #3B78C4   | Active tree item bg          |
| eclipse-row-hover  | #EAF3FD   | Table row hover              |
| text-primary       | #1A1A1A   | Main text                    |
| text-secondary     | #333333   | Secondary text               |
| text-muted         | #777777   | Muted/disabled text          |
| badge-ok           | #167516   | Success badge                |
| badge-err          | #C01515   | Error badge                  |
| badge-warn         | #A06000   | Warning badge                |

## Typography

- **UI font**: "Segoe UI", Arial, sans-serif
- **Code font**: Consolas, "Courier New", monospace
- **Base size**: 12px (body)
- **UI elements**: 11px (labels, tabs, tree items, table headers)
- **Mini text**: 10px (badges, hints)

## Layout Dimensions (px)

- Title bar: 28px height
- Menu bar: 24px height
- Toolbar: 30px height
- Sidebar: 220px width
- Status bar: 20px height
- Bottom console: 150px height
- Editor tab strip: 28px height
- Form label width: 130px
- Input height: 22px

## CSS Conventions Adapted to Tailwind

- No CSS variables — direct values via Tailwind config
- Consistent hover: bg-[#CCE4F7] border-[#82BDDB]
- Active tree items: bg-[#3B78C4] text-white
- All borders: border-[#C8C8C8] or border-[#E4E4E4]
- No media queries (desktop-only app)
- Flexbox-heavy layout with min-h-0 overflow management

## ATM Visual Design

- Dark metallic chassis: gradient from #4a4a4a to #2a2a2a
- Screen bezel: black border, dark gray inner, green/white text
- Keypad: dark gray buttons with silver highlight
- Function keys: dark side buttons aligned to screen edges
- Card slot: dark horizontal slot with LED indicator
