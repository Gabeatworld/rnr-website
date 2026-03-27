# RNR Studio — Webflow Design Variables
> Auto-synced from Webflow MCP · 2026-03-16

## Colors (Swatches)

| Token | Value |
|---|---|
| `--swatch--Light` | `white` |
| `--swatch--Light-Faded` | `rgba(255, 255, 255, 0)` |
| `--swatch--Dark` | `#1a1a1a` |
| `--swatch--Dark-Faded` | `rgba(26, 26, 26, 0)` |
| `--swatch--Light-Cream` | `#f5f0ec` |
| `--swatch--Medium-Cream` | `#ebe5e0` |
| `--swatch--Gray-1` | `hsla(0, 0%, 80%, 1)` |
| `--swatch--Gray-2` | `#919191` |
| `--swatch--Gray-3` | `#797979` |
| `--swatch--Gray-4` | `#4d4d4d` |
| `--swatch--Active` | `#d1721a` |
| `--swatch--Transparent` | `hsla(0, 0%, 87%, 0)` |
| `--swatch--green` | `hsla(80, 18%, 90%, 1)` |
| `--swatch--red` | `hsla(0, 17%, 90%, 1)` |
| `--swatch--blue` | `#e2e6eb` |
| `--swatch--aqua` | `hsla(159, 17%, 90%, 1)` |
| `--swatch--blue-mid` | `hsla(214, 100%, 90%, 1)` |
| `--Gold` | `#c4a47c` |

## Theme Modes

| Token | Default (Light) | Dark Mode | Brand Mode |
|---|---|---|---|
| `--theme--background` | Light Cream `#f5f0ec` | Dark `#1a1a1a` | Light Cream `#f5f0ec` |
| `--theme--background-2` | Medium Cream `#ebe5e0` | Gray 4 `#4d4d4d` | Medium Cream `#ebe5e0` |
| `--theme--text` | Dark `#1a1a1a` | Light `white` | Dark `#1a1a1a` |
| `--theme--text-light` | Dark Faded | Light Faded | Dark Faded |
| `--theme--border` | Gray 1 | Gray 2 `#919191` | Gray 1 |

## Button Tokens

### Primary
| Token | Default | Dark | Brand |
|---|---|---|---|
| background | Dark `#1a1a1a` | Light `white` | Dark |
| border | Dark | Light | Dark |
| text | Light Cream | Dark | Light Cream |
| background-hover | Active `#d1721a` | Active | Active |
| border-hover | Active | Active | Active |
| text-hover | `white` | `white` | `white` |

### Secondary
| Token | Default | Dark | Brand |
|---|---|---|---|
| background | Transparent | Transparent | Transparent |
| border | theme border | theme border | theme border |
| text | theme text | theme text | theme text |
| background-hover | Active | Active | Active |
| border-hover | Active | Active | Active |
| text-hover | theme text | theme text | theme text |

## Typography

| Token | Value |
|---|---|
| `--font--primary-family` | `PP Mori` |
| `--font--primary-regular` | `400` |
| `--font--primary-medium` | `500` |
| `--font--primary-bold` | `700` |
| `--font--primary-trim-top` | `0.38em` |
| `--font--primary-trim-bottom` | `0.38em` |
| `--letter-spacing--expanded` | `0.03em` |
| `--letter-spacing--normal` | `0em` |
| `--line-height--small` | `1` |
| `--line-height--medium` | `1.1` |
| `--line-height--large` | `1.3` |
| `--line-height--huge` | `1.5` |

## Font Sizes (clamp)

| Token | Min | Max |
|---|---|---|
| text-small | `0.875rem` | `1rem` |
| text-main | `1rem` | `1rem` |
| text-large | `1.125rem` | `1.25rem` |
| h6 | `1rem` | `1.5rem` |
| h5 | `1.375rem` | `2rem` |
| h4 | `1.75rem` | `3rem` |
| h3 | `2.25rem` | `4rem` |
| h2 | `2.5rem` | `5rem` |
| h1 | `3rem` | `7rem` |
| display | `4rem` | `9rem` |

## Layout

| Token | Value |
|---|---|
| `--site--viewport-max` | `120` |
| `--site--viewport-min` | `20` |
| `--site--gutter` | `1rem` |
| `--site--column-count` | `12` |
| `--max-width--small` | `50rem` |
| `--max-width--main` | `calc(120 * 1rem)` |
| `--max-width--full` | `100%` |
| `--radius--small` | `0.5rem` |
| `--radius--main` | `1rem` |
| `--radius--round` | `100vw` |

## Spacing

| Token | Min | Max |
|---|---|---|
| space/1 | `0.375rem` | `0.5rem` |
| space/2 | `0.625rem` | `0.75rem` |
| space/3 | `0.875rem` | `1rem` |
| space/4 | `1.25rem` | `1.5rem` |
| space/6 | `2rem` | `2.5rem` |
| space/8 | `2.5rem` | `4rem` |
| section-space/main | `4rem` | `7rem` |
