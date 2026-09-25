---
name: "Rehearsal"
description: "An engineering verification worksheet for migration evidence."
colors:
  blue: "#2446c8"
  green: "#216046"
  red: "#983a31"
  paper: "#f5f4ef"
  ink: "#232722"
  muted: "#676e65"
  line: "#d9dcd2"
  surface: "#fcfcf9"
  editor: "#f1f2eb"
  active-case: "#e8ebde"
  pass-wash: "#edf2e7"
  fail-wash: "#f9eee8"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-.035em"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    letterSpacing: "-.015em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  sql:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "3px"
  row: "4px"
  panel: "5px"
spacing:
  tight: "8px"
  related: "12px"
  group: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "white"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  button-text:
    textColor: "{colors.ink}"
    padding: "9px 0"
  sql-editor:
    backgroundColor: "{colors.editor}"
    typography: "{typography.sql}"
    rounded: "{rounded.control}"
  case-selected:
    backgroundColor: "{colors.active-case}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    padding: "16px 12px"
  source-label:
    backgroundColor: "#eeeee7"
    textColor: "#565d54"
    rounded: "{rounded.control}"
    padding: "4px 6px"
  experiment:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  phase-row:
    rounded: "{rounded.row}"
    padding: "12px 9px 12px 7px"
---

# Design System: Rehearsal

## Overview

**Creative North Star: "The Engineering Verification Worksheet"**

Warm paper, dark ink, and ruled rows make the interface feel like a working engineering document. Compact controls sit beside readable SQL and a fixed sequence of deployment phases; precision comes from alignment and restrained emphasis.

The surface is built directly from type, borders, and semantic color. Results earn their visual emphasis through executed checks. The recurring signature is a chronological phase list paired with inspectable query evidence, including expected and actual output.

**Key Characteristics:**
- Warm neutral surfaces with restrained cobalt actions.
- Ruled evidence rows and compact, aligned controls.
- IBM Plex Sans for interface language; IBM Plex Mono for SQL and measured data.
- Flat surfaces with visible status text and icons.

## Colors

The palette combines warm paper and green-tinted neutrals with a small set of purposeful signals. Frontmatter values are normative and are extracted from the current stylesheet.

### Primary
- **Cobalt action** (`blue`): primary execution, repair links, focus outlines, and running indicators.

### Secondary
- **Forest pass** (`green`, `pass-wash`): passed checks and completed passing reports.
- **Oxblood failure** (`red`, `fail-wash`): failed checks, errors, and blocked reports.

### Neutral
- **Warm paper** (`paper`): application ground.
- **Dark ink** (`ink`): primary interface text and identity mark.
- **Quiet ink** (`muted`): descriptions and supporting metadata.
- **Worksheet rule** (`line`): boundaries between regions and evidence rows.
- **Raised paper** (`surface`): the workbench and secondary buttons, expressed by tone rather than elevation.
- **SQL paper** (`editor`): editable code area.
- **Selected sage** (`active-case`): active scenario navigation.

**The Evidence Color Rule.** Use green and oxblood for actual pass and failure states, accompanied by text and icons. Cobalt marks actions, focus, and execution in progress.

## Typography

**Display Font:** IBM Plex Sans (sans-serif fallback).
**Body Font:** IBM Plex Sans (sans-serif fallback).
**Label/Mono Font:** IBM Plex Mono (monospace fallback).

The pairing has a practical engineering character: modest medium-weight headings, unembellished interface copy, and a distinct fixed-width voice for executable material. Locally imported font files supply Sans regular, medium, and semibold plus Mono regular.

### Hierarchy
- **Display:** the page headline; uses the display token on desktop and smaller responsive values defined under Layout.
- **Headline:** experiment titles; subordinate report headings use slightly smaller local treatments.
- **Title:** sequence headings.
- **Body:** scenario descriptions; explanatory passages generally stay within a readable measure (75ch).
- **Label:** action names and phase titles; supporting metadata has local compact treatments rather than a universal small-text scale.
- **SQL:** editor and synchronized line numbers use the SQL token. Evidence blocks use their own compact reading treatment and gain size on mobile.

**The Two Voices Rule.** Use Plex Sans for the interface and Plex Mono for SQL, query timing, and report metadata.

## Layout

The desktop shell has a fixed scenario rail (242px) beside a flexible main column, with an overall maximum width (1700px). Main content has generous horizontal margins (42px). Inside the bordered experiment, editor and sequence are paired columns; the phase column has a minimum width (330px). Evidence remains a ruled list beneath the workbench rather than a stack of independent cards.

At the compact desktop breakpoint (1150px maximum), the rail narrows (200px), main padding contracts (24px), and the headline becomes smaller (33px). At tablet width (900px maximum), the rail becomes three visible scenario buttons across the top and the masthead shortens (66px). At phone width (640px maximum), the workbench stacks, the main side margin contracts (16px), the headline uses a shorter measure (12ch) and smaller size (32px), and key controls and status copy are at least (12px). Phone phase rows are taller (77px) to accommodate readable status text. At wide desktop sizes (1500px minimum), main side margins expand (62px) and the editor gains height (230px).

Spacing follows compact related groups and larger boundaries, using the reused steps in frontmatter alongside component-specific dimensions. Code containers scroll internally; result columns have flexible widths and wrapping code. Do not assume every spacing value belongs to a strict mathematical scale.

## Elevation & Depth

There are no shadows. Borders, pale surface changes, and generous exterior margins distinguish the workbench from its background. Selected phases and active navigation use quiet fills; reports use semantic washes.

**The Ruled Surface Rule.** Separate neighboring work areas with thin borders and tonal shifts; this implementation uses no shadows.

## Shapes

The system is nearly rectangular, with restrained rounding at three levels: controls, rows, and the outer panel. The identity mark and phase symbols are circular, providing recognizable anchors in the otherwise ruled document. Borders are hairline (1px). Icons use a light stroke (1.6), with explicit check, cross, and waiting symbols rather than relying on color alone.

## Components

### Buttons

Compact and direct. The primary action uses cobalt with white text; the secondary uses paper with a rule-colored border. Their shape, typography, and padding are recorded in frontmatter. Text actions leave the background open. Buttons darken slightly on hover through a brightness filter (.93); background and color transition briefly (.18s). Visible keyboard focus uses a cobalt outline (2px) with offset (4px) on buttons and links. Disabled controls reduce opacity (.55), while unavailable phase rows preserve full legibility.

### Chips

The candidate-provenance label is a quiet, noninteractive tag beside the editor label. It carries Original proposal, Reference repair, or Custom candidate. Its neutral treatment does not imply verification.

### Cards / Containers

The experiment is the principal bordered container. Internal regions share borders and open space; there are no nested card shadows. Passing and blocked report containers reuse restrained row rounding and pale status fills.

### Inputs / Fields

The SQL editor is a native labeled textarea within a pale code region, with a synchronized line-number gutter and a lower metadata strip. It remains horizontally scrollable and cannot be resized. Focus is an explicit cobalt outline; typing changes the visible provenance to Custom candidate. The editor disables during execution.

### Navigation

Scenario choices are full-width text buttons on desktop, with a quiet active fill, numeric index, supporting description, and active chevron. They become three visible tabs at tablet and phone widths. The selected state uses `aria-current`; choices disable during a run.

### Deployment Sequence and Evidence

Five fixed positions establish chronology. Circular state marks connect along a fine vertical rule; the selected row gains a quiet fill and border. A completed phase exposes a View checks affordance. Clicking it selects evidence and moves the viewport to its ruled query list. Each query row expands SQL, expected values, actual values, and database errors when present.

The inline run summary keeps the result beside the edited SQL. Changed SQL gains a stale-results treatment rather than silently reusing the previous verdict. The running icon rotates only while execution is active (1s, linear). The reduced-motion media query removes animations and transitions. Source-triggered smooth scrolling remains an implementation detail to verify against user motion preferences before extending that behavior.

## Do's and Don'ts

### Do:
- **Do** keep candidate provenance visible next to the SQL editor.
- **Do** preserve status words and icons alongside semantic color.
- **Do** let SQL scroll inside its own container and stack the workbench on narrow screens.
- **Do** retain keyboard focus outlines and the reduced-motion override.

### Don't:
- **Don't** present a passing state before a run produces evidence.
- **Don't** attribute the included reference repair to a live Bob run.
- **Don't** turn small desktop metadata into the default reading size for new body copy.
