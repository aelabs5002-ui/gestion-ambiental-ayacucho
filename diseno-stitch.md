---
name: Municipal Waste Management System
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#424752'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#727783'
  outline-variant: '#c2c6d4'
  surface-tint: '#005db7'
  primary: '#004d99'
  on-primary: '#ffffff'
  primary-container: '#1565c0'
  on-primary-container: '#dae5ff'
  inverse-primary: '#a9c7ff'
  secondary: '#b51a1e'
  on-secondary: '#ffffff'
  secondary-container: '#d93633'
  on-secondary-container: '#fffbff'
  tertiary: '#005c15'
  on-tertiary: '#ffffff'
  tertiary-container: '#25752b'
  on-tertiary-container: '#a5f99e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#93000e'
  tertiary-fixed: '#a3f69c'
  tertiary-fixed-dim: '#88d982'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005312'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets municipal administrators, fiscal auditors, waste collection operators, and citizens interacting with local government waste and tax management services. The UI projects authority, absolute legal and fiscal clarity, transactional security, and institutional efficiency, borrowing visual cues from modern enterprise fintech and public administration portals.

The visual style is **Corporate / Modern**: structured, clean, highly functional, and uncompromising on WCAG AAA accessibility. Visual ornamentation is strictly subordinated to legible data tables, status badges, balance summaries, and operational workflows.

## Colors

The color palette enforces a strict functional hierarchy designed for high-density administrative workflows and immediate status triage.

### Core Palette
- **Primary (`#1565C0`)**: Institutional deep blue used for structural framing (header, active sidebar navigation), primary transactional actions, focused active states, and persistent links.
- **Secondary / Alert (`#C62828`)**: Critical red reserved strictly for irreversible actions, deletion prompts, system-wide alerts, and past-due notifications.
- **Text on Primary & Secondary (`#FFFFFF`)**: Pure white text guarantees WCAG AAA compliant contrast ratios on both `#1565C0` (5.3:1) and `#C62828` (5.8:1).
- **Background (`#F5F7FA`)**: Institutional soft cool gray providing clean separation for surface containers.
- **Surface & Containers (`#FFFFFF`)**: Pure white base for cards, tables, modal dialogs, and drawer sheets.
- **Text Primary (`#1A1A1A`)**: High-contrast near-black for headings, operational data points, and body copy.
- **Text Secondary (`#616161`)**: Mid-tone neutral for secondary labels, table headers, metadata, and helper text.

### Status Tones
- **Success (Pagado / Operativo)**: Container `#E8F5E9` with foreground text `#2E7D32`.
- **Warning (Pendiente / En Proceso)**: Container `#FFF8E1` with foreground text `#F9A825`.
- **Danger (Vencido / Anulado)**: Container `#FFEBEE` with foreground text `#C62828`.

### Contrast Rules
- Elements using `#1565C0` or `#C62828` as background fills must only use `#FFFFFF` typography and icons.
- Never mix `#1565C0` and `#C62828` against each other (e.g., no red text on blue buttons or blue badges on red panels).
- Status containers must maintain their designated pairing to prevent visual degradation.

## Typography

The typography system relies entirely on **Inter** to ensure maximum legibility across dense tabular views, billing summaries, and mobile field collection workflows.

- **Screen Titles (`headline-lg`)**: 24px Bold (700) with a 32px line height. Anchors top-level views and primary module transitions.
- **Section Titles (`headline-md`)**: 18px SemiBold (600) with a 24px line height. Defines card clusters, tab groups, and data subdivisions.
- **Card Subheadings (`title-sm`)**: 16px SemiBold (600) for internal component grouping and summary card values.
- **Body Copy (`body-md`)**: 14px Regular (400) with a 20px line height. Primary reading size for fiscal records, citizen profiles, and guidelines.
- **Compact Body (`body-sm`)**: 13px Regular (400) for dense table cells and historical audit logs.
- **Interactive Labels & Badges (`label-md`)**: 12px Medium (500) for button labels, badge indicators, and form field tags.
- **Metadata & Helpers (`label-sm`)**: 12px Regular (400) for timestamp entries, validation footnotes, and auxiliary field hints.

## Layout & Spacing

The layout follows a mobile-first responsive grid system designed to scale seamlessly from 375px handheld viewports to high-resolution desktop control consoles.

### Grid Architecture
- **Mobile (< 768px)**: 4-column layout with a 16px (`1rem`) margin and 16px gutter. Navigation collapses into a bottom sheet or top navigation drawer. Action bars pin to bottom viewports for single-thumb execution.
- **Tablet (768px – 1024px)**: 8-column layout with 24px (`1.5rem`) margin and gutters. Dual-pane view for master-detail inspection (e.g., account list next to debt breakdown).
- **Desktop (> 1024px)**: 12-column layout with persistent 240px or 280px left sidebar, 24px gutters, and 24px canvas margins. Maximum readable container width caps at 1440px for centered institutional portals.

### Spacing Rhythm
- Section-to-section vertical separation is fixed at `24px` (`space-lg` / `1.5rem`).
- Internal container and card padding is uniformly set to `16px` (`space-md` / `1rem`).
- Stacked controls, field groups, and badge elements within cards use `8px` (`space-sm` / `0.5rem`).

## Elevation & Depth

Visual hierarchy uses subdued tonal contrast paired with an ultra-light ambient shadow layer to avoid visual clutter and maintain high scanning speed:

- **Base Canvas (Level 0)**: `#F5F7FA` flat canvas background.
- **Surface Panels & Cards (Level 1)**: Pure `#FFFFFF` surfaces paired with an ambient shadow: `box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)`. A 1px border (`#E0E4E8`) may be applied to tables and segmented cards where explicit boundary containment is required.
- **Dropdowns & Popovers (Level 2)**: Elevated `#FFFFFF` surfaces with `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`.
- **Modals & Dialogs (Level 3)**: Fixed-position containers raised over a `#000000` backdrop with 40% opacity (`rgba(0, 0, 0, 0.40)`), featuring `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12)`.

## Shapes

The geometric structure balances precision and approachability:

- **Cards, Panels & Primary Buttons**: Set to `rounded-lg` (8px border-radius) for an orderly, modern, and sturdy appearance.
- **Input Fields & Select Boxes**: Set to `rounded-lg` (8px border-radius) to align flush with trigger buttons.
- **Modals, Dialogs & Flyouts**: Set to `rounded-xl` (12px border-radius) to clearly frame overlay contexts.
- **Status Badges & Pill Indicators**: Fully rounded pill shapes (`border-radius: 9999px`) or `rounded-sm` (4px) with subtle internal vertical padding to maintain distinction from clickable rectangular buttons.

## Components

### Buttons
- **Primary Action**: Solid `#1565C0` background, `#FFFFFF` text, 8px border-radius, 40px height on mobile and 44px on desktop. Horizontal padding is 16px. Hover state: `#0D47A1`. Active state: `#0A3880`.
- **Destructive Action**: Solid `#C62828` background, `#FFFFFF` text, 8px border-radius. Reserved for debt write-offs, user suspension, or fee cancellation. Hover state: `#B71C1C`.
- **Secondary / Outline**: 1px solid border (`#1565C0`), transparent background, `#1565C0` text. Hover fills with 4% primary tint (`#1565C0` at 0.04 opacity).
- **Subtle / Ghost**: Transparent background, `#616161` text, elevating to `#1A1A1A` on hover with a `#E0E0E0` soft background wash.

### Status Badges
Badges are non-interactive indicators used for payment and collection status:
- **Pagado (Paid)**: Background `#E8F5E9`, text `#2E7D32`, font-size 12px (Medium), padding 4px 10px, fully rounded (9999px) or 4px radius.
- **Pendiente (Pending)**: Background `#FFF8E1`, text `#F9A825`, font-size 12px (Medium), padding 4px 10px.
- **Vencido (Overdue)**: Background `#FFEBEE`, text `#C62828`, font-size 12px (Medium), padding 4px 10px.

### Cards & Panels
- **Structure**: `#FFFFFF` background, 8px border-radius, `box-shadow: 0 2px 4px rgba(0,0,0,0.05)`, 16px internal padding.
- **Card Header**: 18px SemiBold `#1A1A1A` title with an optional trailing status badge or auxiliary metadata in 12px Regular `#616161`.
- **Separators**: Optional 1px border dividers using `#EEEEEE`.

### Input Fields & Controls
- **Text Inputs & Dropdowns**: Background `#FFFFFF`, border 1px solid `#BDBDBD`, border-radius 8px, height 40px, padding 8px 12px. Text color `#1A1A1A` with placeholder in `#9E9E9E`.
- **Focus State**: Border color `#1565C0` with an institutional outline ring (`box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.2)`).
- **Error State**: Border color `#C62828` accompanied by 12px red helper text below the field.
- **Checkboxes & Radios**: Checked fill `#1565C0` with white checkmark/dot. Unchecked border `#757575`. 20px hit-area on desktop, min 44px touch-target bounding box on mobile.

### Tables & Fiscal Data Lists
- **Header**: Background `#F5F7FA`, 12px uppercase or title case SemiBold `#616161`, 12px vertical padding, 16px horizontal padding.
- **Rows**: `#FFFFFF` background, bottom border 1px solid `#EEEEEE`, 14px regular `#1A1A1A`, 14px vertical padding. Alternating rows may use `#FAFAFA` for data-heavy inspection views.
- **Mobile Card Reflow**: Tables reflow into stacked cards below 768px, exposing key attributes (Cadastral Code, Balance, Due Date, Status Badge) with full-width primary action links.