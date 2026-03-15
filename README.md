# Primordial

Primordial is an interactive 3D scientific encyclopedia focused on Earth's prehistoric eras. The current workspace is set up for a Babylon.js globe prototype with React, TypeScript, Vite, and Tailwind CSS.

## Stack

- React 19 + TypeScript
- Vite 8
- Babylon.js for rendering and scene management
- Tailwind CSS for UI composition
- Static JSON data at the repository root in `/data`

## Current Workspace Scope

- Babylon scene bootstrap for a rotating globe
- Era switching between Cambrian, Carboniferous, and Permian
- Atmospheric overlay scaffold
- Species list and species detail panel scaffold
- Placeholder globe textures and placeholder period data markers

The placeholder textures and unsourced metrics are explicitly marked as such. Atmospheric values and species records still need to be sourced before they should be treated as scientific content.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Project Layout

```text
public/
  models/
  textures/
src/
  babylon/
  components/
  data/
  hooks/
data/
```

## Next Recommended Steps

1. Replace placeholder globe textures with sourced PALEOMAP exports.
2. Populate `/data/*.json` with sourced atmospheric values.
3. Add vetted species records and GLB assets for each period.
4. Connect the species panel to the Babylon creature viewer once models are available.
