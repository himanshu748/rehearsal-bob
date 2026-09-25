---
name: "Rehearsal"
description: "An engineering verification worksheet for migration evidence."
colors:
  blue: "#2446c8"
  green: "#216046"
  red: "#983a31"
  paper: "#f5f4ef"
  ink: "#232722"
  muted: "#626a63"
  line: "#d9dcd2"
  surface: "#fcfcf9"
  editor: "#242c29"
  editor-text: "#edf3e9"
  active-case: "#e7eadf"
  pass-wash: "#edf2e7"
  fail-wash: "#f9eee8"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "42px"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-.035em"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    letterSpacing: "-.02em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 500
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  sql:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  tag: "3px"
  control: "4px"
  field: "5px"
  panel: "8px"
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
    padding: "13px 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "13px 20px"
  button-text:
    textColor: "{colors.ink}"
    padding: "10px 0"
  sql-editor:
    backgroundColor: "{colors.editor}"
    textColor: "{colors.editor-text}"
    typography: "{typography.sql}"
    rounded: "{rounded.field}"
  case-selected:
    backgroundColor: "{colors.active-case}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
  source-label:
    textColor: "#c9d2cb"
    rounded: "{rounded.tag}"
    padding: "3px 7px"
  experiment:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  phase-row:
    rounded: "{rounded.control}"
    padding: "12px 10px 12px 8px"
  evidence-stage-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
---

# Design System: Rehearsal

## Overview

**Creative North Star: "The Engineering Verification Worksheet"**

Warm paper, dark ink, and ruled rows make the interface feel like a working engineering document. A horizontal scenario strip preserves room for the paired workbench. The dark SQL surface distinguishes editable code from query evidence, with the primary action placed above it at every size.

The surface is built directly from type, borders, and semantic color. Results earn their visual emphasis through executed checks. The recurring signature is a chronological phase list paired with inspectable query evidence, including expected and actual output. A compact verdict appears inside the workbench, while the lower evidence area provides stage selection and export.

**Key Characteristics:**

- Warm neutral surfaces with restrained cobalt actions.
- Dark ink SQL editor beside a ruled deployment sequence.
- IBM Plex Sans for interface language; IBM Plex Mono for SQL and measured data.
- Horizontal scenario selection and directly selectable evidence stages.
- Flat surfaces with visible status text and icons.

## Colors

The palette combines warm paper and green-tinted neutrals with purposeful status signals. Frontmatter values are normative; the dark code surface is a user-requested extension of the established paper-and-ink world.

### Primary

- **Cobalt action** (`blue`): execution, repair links, keyboard focus, and running indicators.

### Secondary

- **Forest pass** (`green`, `pass-wash`): passed checks and passing verdicts. Forest also marks the active scenario chevron and the fresh-database note; those contextual marks do not imply a successful rehearsal.
- **Oxblood failure** (`red`, `fail-wash`): failed checks, errors, and blocked verdicts.

### Neutral

- **Warm paper** (`paper`): application ground and selected evidence-stage text.
- **Dark ink** (`ink`): primary text, identity mark, and selected evidence-stage fill.
- **Quiet ink** (`muted`): descriptions and supporting metadata.
- **Worksheet rule** (`line`): region boundaries and evidence rows.
- **Raised paper** (`surface`): workbench and secondary buttons, expressed by tone rather than elevation.
- **SQL ink** (`editor`, `editor-text`): dark editable code surface and pale SQL text.
- **Selected sage** (`active-case`): active scenario navigation.

**The Evidence Color Rule.** Use green and oxblood for actual pass and failure states, accompanied by text and icons. Cobalt marks actions, focus, and execution in progress.

## Typography

**Display Font:** IBM Plex Sans (sans-serif fallback).
**Body Font:** IBM Plex Sans (sans-serif fallback).
**Label/Mono Font:** IBM Plex Mono (monospace fallback).

The pairing has a practical engineering character: medium-weight headings, unembellished interface language, and a distinct fixed-width voice for executable material. Locally imported font files supply Sans regular, medium, and semibold plus Mono regular. SQL and measured data use tabular numerals.

### Hierarchy

- **Display:** the two-part page headline; its second phrase uses Quiet ink. It flows as a single line on desktop and breaks at the authored boundary on narrow screens.
- **Headline:** experiment titles; evidence headings use a slightly smaller local size (20px).
- **Title:** deployment-sequence heading.
- **Body:** scenario descriptions, report explanations, and query rows. Phase titles share the body size with medium emphasis. Scenario copy stays within a reading measure (85ch); report paragraphs use (75ch).
- **Label:** action names; metadata and stage controls use local compact treatments.
- **SQL:** editor and synchronized line numbers use the SQL token. Evidence code is also readable fixed-width text, with its own line-height (1.65).

**The Two Voices Rule.** Use Plex Sans for the interface and Plex Mono for SQL, query timing, and report metadata.

## Layout

The centered shell has a maximum width (1364px) and horizontal padding (32px). A horizontal project-and-scenario strip replaces the earlier left rail. The three scenario choices share available width. The masthead is compact (68px), and the main region begins below the strip with modest top padding (28px).

The workbench uses paired columns: the editor receives slightly more proportional width (1.1fr) and the phase column has a minimum width (360px). Both regions have comfortable internal padding (24px 28px). The run action precedes the dark editor toolbar in source order. A verdict banner sits above both columns after execution. Below, the exportable report introduces a ruled query area with wrap-capable stage buttons.

At the compact breakpoint (1050px maximum), outer padding contracts (24px), the phase minimum narrows (330px), and the fresh-database note hides. At the stacking breakpoint (760px maximum), project context sits above the three scenario choices, the workbench becomes one column, the headline becomes smaller (40px), and phase rows retain room for status copy (72px minimum). At phone width (480px maximum), outer padding contracts (16px), the headline becomes smaller again (36px), workbench padding contracts (18px), and expected/actual results stack. Phone phase rows have a larger minimum height (78px); the editor is shorter (180px), with internal scrolling retained.

Spacing uses compact related groups and larger boundaries. Reused steps appear in frontmatter; component-specific measurements remain local rather than pretending every dimension belongs to a strict mathematical scale.

## Elevation & Depth

There are no shadows. Borders, pale surface changes, and exterior margins establish hierarchy. The dark editor is a functional code region rather than a floating panel. Selection is shown by a quiet sage fill in scenario navigation, a pale fill in the phase sequence, and an ink fill in evidence-stage controls. Only the inline verdict uses a broad pass or failure wash; the lower report remains an open ruled section.

**The Ruled Surface Rule.** Separate neighboring work areas with thin borders and tonal shifts; this implementation uses no shadows.

## Shapes

The system is nearly rectangular with restrained rounding: compact tags, action buttons, editor corners and scenario choices, then the more gently rounded experiment container. Tokens define these levels. Circular identity and phase marks anchor the ruled document. Borders remain hairline (1px); icons use a light stroke (1.7) and explicit check, cross, and waiting symbols.

## Components

### Buttons

Direct and legible. The primary action uses cobalt with white text; secondary actions use paper with a rule-colored border. Their shape, type, and padding are recorded in frontmatter. Text actions leave the background open. Buttons darken slightly on hover through a brightness filter (.94); background and color transition briefly (.18s). Keyboard focus uses a cobalt outline (2px) with offset (4px) on buttons and links. Disabled controls reduce opacity (.55); unavailable phase rows retain full legibility.

### Chips

The noninteractive provenance tag is outlined within the dark SQL toolbar, using pale text and a muted dark-surface border. It distinguishes Original proposal, Reference repair, Custom candidate, and Bob IDE repair. Source identification does not imply passing verification.

### Cards / Containers

The experiment is the principal bordered container, with shared internal rules. The inline result banner carries pass, failure, or stale-result emphasis. The lower Rehearsal evidence section remains open against the page and ends with a rule; it is not a second colored verdict card.

### Inputs / Fields

The SQL editor is a native labeled textarea in a dark ink region. A file-name toolbar precedes it; synchronized line numbers and a lower metadata strip frame the field. The run/reset actions sit above the toolbar. SQL remains horizontally scrollable and cannot be resized. Its keyboard outline is a lighter blue (2px) drawn inward (offset -3px), preserving visibility against the dark background. Typing changes provenance to Custom candidate; execution disables editing. The rename scenario separately offers Load Bob's repair and Load reference repair.

### Navigation

Three scenario buttons remain visible in a horizontal strip at every size. The active choice has a sage fill, border, and desktop chevron. The project descriptor shifts above them at narrower widths. Selection uses `aria-current`; choices disable during a run.

### Deployment Sequence and Evidence

Five fixed positions establish chronology. Circular state marks connect along a fine vertical rule; the selected row gains a quiet fill and border. A completed phase exposes View checks. Selecting it scrolls to the query area, where a second set of stage buttons supports direct switching with `aria-pressed`. The selected evidence stage uses dark ink with warm-paper text; other stage buttons retain semantic status icons.

Each query row expands SQL, expected output, actual output, and database errors. Expanded rows gain a quiet fill and rotated disclosure chevron. Query rows and report explanations use the body scale on desktop, with modest phone adjustments. The result columns stack on phones to preserve reading width.

The inline summary keeps the verdict beside the candidate. Editing SQL marks results stale instead of silently applying the previous verdict to new input. The running icon rotates only during execution (1s, linear). Reduced-motion CSS removes animations and transitions, and all source-triggered scrolling checks the same preference before choosing automatic or smooth behavior.

## Do's and Don'ts

### Do:

- **Do** keep candidate provenance visible in the SQL toolbar, including Bob IDE repair when that candidate is loaded.
- **Do** preserve status words and icons alongside semantic color.
- **Do** place the run action above the editor at every viewport size.
- **Do** let SQL scroll internally, stack the workbench on narrow screens, and stack expected and actual output on phones.
- **Do** retain keyboard focus outlines and respect reduced motion in both CSS and programmatic scrolling.

### Don't:

- **Don't** present a passing state before a run produces evidence.
- **Don't** attribute the included reference repair to a live Bob run.
- **Don't** use the compact provenance and timing sizes for new explanatory body copy.
