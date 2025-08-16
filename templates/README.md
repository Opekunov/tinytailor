# TinyTailor Configuration Templates

This directory contains configuration file templates for TinyTailor in different formats.

## Files

- **`tinytailor.config.ts`** - TypeScript template (source of truth)
- **`tinytailor.config.js`** - JavaScript/CommonJS template (auto-generated)
- **`tinytailor.config.mjs`** - ES Modules template (auto-generated)

## Development Workflow

### 🔧 Making Changes

**IMPORTANT:** Only edit `tinytailor.config.ts`. The `.js` and `.mjs` files are automatically generated.

1. Edit `tinytailor.config.ts` with your changes
2. Run `npm run generate-templates` to update JS/MJS files
3. Or run `npm run build` (which includes template generation)

### 🤖 Automatic Generation

The generation script (`scripts/generate-templates.js`) automatically:

- Converts TypeScript syntax to JavaScript/ES Modules
- Updates import/export statements appropriately
- Adjusts documentation comments for each format
- Ensures all three formats stay in sync

### 📁 Git Tracking

- `tinytailor.config.ts` - **tracked** (source of truth)
- `tinytailor.config.js` - **not tracked** (auto-generated)
- `tinytailor.config.mjs` - **not tracked** (auto-generated)

The `.js` and `.mjs` files are generated during the build process and included in the npm package.

## Format Differences

| Format | Use Case | Module System | Type Safety |
|--------|----------|---------------|-------------|
| `.ts` | TypeScript projects | ES Modules | Full TypeScript |
| `.js` | Traditional Node.js | CommonJS | JSDoc comments |
| `.mjs` | Modern Node.js | ES Modules | JSDoc comments |

## Commands

```bash
# Generate templates from TypeScript source
npm run generate-templates

# Build project (includes template generation)
npm run build

# Development with watching
npm run dev
```