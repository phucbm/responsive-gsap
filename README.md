# responsive-gsap
A TypeScript utility package

[![npm version](https://badgen.net/npm/v/responsive-gsap?icon=npm)](https://www.npmjs.com/package/responsive-gsap)
[![npm downloads](https://badgen.net/npm/dm/responsive-gsap?icon=npm)](https://www.npmjs.com/package/responsive-gsap)
[![npm dependents](https://badgen.net/npm/dependents/responsive-gsap?icon=npm)](https://www.npmjs.com/package/responsive-gsap)
[![github stars](https://badgen.net/github/stars/phucbm/responsive-gsap?icon=github)](https://github.com/phucbm/responsive-gsap/)
[![github license](https://badgen.net/github/license/phucbm/responsive-gsap?icon=github)](https://github.com/phucbm/responsive-gsap/blob/main/LICENSE)

## 🚀 Quick Start

### Use this template with gen-from (recommended)
```bash
# Generate from this template
npx gen-from npm-utils-template

# Or use interactive mode
npx gen-from

# Generate in current directory
npx gen-from npm-utils-template --here
```

### Or use GitHub's "Use this template" button
Click the green "Use this template" button on the [GitHub repository page](https://github.com/phucbm/responsive-gsap).

## Installation
```bash
npm i responsive-gsap
```
```bash
pnpm add responsive-gsap
```

## Usage
```typescript
import {myUtilityFunction} from 'responsive-gsap'
// or
import myUtilityFunction from 'responsive-gsap'

// Basic usage
const result = myUtilityFunction('your input');
```

## API
### `myUtilityFunction(input?: any): any`
Main utility function that processes the input.

**Parameters:**
- `input` (optional) - The input to process

**Returns:**
- The processed result

### `processElement(element: HTMLElement): HTMLElement`
Function for DOM element processing.

**Parameters:**
- `element` - HTML element to process

**Returns:**
- The processed element

## Development
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm run build

# Run tests in watch mode
pnpm run test:watch
```

## Automated Workflows
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ DEPENDABOT  │───▶│    TEST     │───▶│   RELEASE   │───▶│   PUBLISH   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

This repository uses automated dependency management and publishing:
- **📦 Dependabot** - Creates PRs for dependency updates (daily for npm, weekly for actions)
- **🧪 Test PR Action** - Auto-tests and merges passing Dependabot PRs with comment feedback  
- **🚀 Dependabot Release Action** - Creates releases with patch version bumps when dependencies merge
- **📤 Publish NPM Action** - Builds and publishes to npm registry when releases are created

## License
MIT © [phucbm](https://github.com/phucbm)
