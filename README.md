# Lighthouse Lane

Shopify Horizon 4.1.4, rebuilt to the Lighthouse Lane design bundle
(`Assets/Design/*.dc.html`, brand guide first). Source of truth for the build
order is `Conversion Plan - Design to Horizon.md`.

## How the brand layer is put together

Anything a Horizon setting can express is set in `config/settings_data.json` or
the section JSON, so Howard can see and change it in the theme editor. Only what
settings cannot reach lives in code:

- `assets/ll-custom.css` — the brand faces, the desktop/mobile type splits, and
  the hand-made decorative layer (stitch seams, tape, rotations, wavy links).
  Loaded once from `snippets/ll-stylesheets.liquid`.
- `assets/ll-*.woff2` — Bevan, Caveat and Karla, self-hosted latin subsets.
  Typography is set in `ll-custom.css`, not in the theme's font pickers.
- `blocks/ll-*.liquid`, `sections/ll-*.liquid`, `snippets/ll-*.liquid` — new
  files, all `ll-` prefixed, all public blocks unless a block is genuinely
  section-specific.

## Stock files edited

Horizon updates arrive through git, so keep this list short and current.

| File | Edit |
|---|---|
| `layout/theme.liquid` | one line: `{%- render 'll-stylesheets' -%}` after `color-palette` |
| `sections/footer-utilities.liquid` | schema: added `payment-icons` to the block list |
| `locales/en.default.json` | copy pass: "cart" → "basket" throughout (UK shop) |
| `config/settings_data.json`, `sections/header-group.json`, `sections/footer-group.json` | settings, authored in git rather than the editor |

## Environments

`shopify theme push -e dev` ships everything, including settings and section
JSON. Once the store is live and Howard is editing content, use
`-e dev-code-only`, which leaves templates, the header/footer groups and
`settings_data.json` alone. Neither environment sets `allow-live`.

Confirm `188538552700` is the development theme, not the live one, before any
push.
