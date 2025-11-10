# useGSAPResponsive

[![npm version](https://badgen.net/npm/v/responsive-gsap?icon=npm)](https://www.npmjs.com/package/responsive-gsap)
[![npm downloads](https://badgen.net/npm/dm/responsive-gsap?icon=npm)](https://www.npmjs.com/package/responsive-gsap)
[![npm dependents](https://badgen.net/npm/dependents/responsive-gsap?icon=npm)](https://www.npmjs.com/package/responsive-gsap)
[![github stars](https://badgen.net/github/stars/phucbm/responsive-gsap?icon=github)](https://github.com/phucbm/responsive-gsap/)
[![github license](https://badgen.net/github/license/phucbm/responsive-gsap?icon=github)](https://github.com/phucbm/responsive-gsap/blob/main/LICENSE)

A thin, powerful wrapper around [`useGSAP`](https://gsap.com/resources/React/#usegsap-hook-) that adds **responsive setup**, **automatic re-initialization**, and **optional “play after load” control** — all while maintaining full compatibility with `useGSAP` best practices and return values.

## ✨ Features

* **Drop-in replacement for `useGSAP`** — returns the same value and integrates seamlessly.
* **Responsive animation setups** via media queries (`gsap.matchMedia`).
* **Auto re-setup on resize** — re-runs your animation setup when specific elements change size.
* **Play-after-load control** — delay animation playback until page loading is complete.
* **Safe cleanup** — guarantees proper `useGSAP` cleanup for timelines, matchMedia, and observers.
* **Debug mode** — optional console logs for setup, cleanup, and media triggers.

## Installation
```bash
npm i responsive-gsap
```
```bash
pnpm add responsive-gsap
```

## 🚀 Usage

### 1. Single setup

For simple, non-responsive animations:

```tsx
import {useGSAPResponsive} from "responsive-gsap";
import gsap from "gsap";
import {useRef} from "react";

export function Example() {
    const scope = useRef<HTMLDivElement>(null);

    useGSAPResponsive((root) => {
        const tl = gsap.timeline().from(root.querySelector(".box"), {x: -100, opacity: 0});
        return {timeline: tl};
    }, {scope});

    return (
        <div ref={scope}>
            <div className="box"/>
        </div>
    );
}
```

---

### 2. Responsive setups (media queries)

Run different animations per breakpoint with `mediaQueries`:

```tsx
import {useGSAPResponsive} from "responsive-gsap";
import gsap from "gsap";
import {useRef} from "react";

export function Example() {
    const scope = useRef<HTMLDivElement>(null);

    useGSAPResponsive([
        {
            query: "(max-width: 768px)",
            setup: (root) => ({
                timeline: gsap.from(root.querySelector(".box"), {x: -50}),
            }),
        },
        {
            query: "(min-width: 769px)",
            setup: (root) => ({
                timeline: gsap.from(root.querySelector(".box"), {x: 100}),
            }),
        },
    ], {scope});

    return (
        <div ref={scope}>
            <div className="box"/>
        </div>
    );
}
```

Each setup cleans up automatically when the media condition changes.

---

### 3. Observe element resize

Re-run animation setup when a target element’s size changes:

```tsx
import {useGSAPResponsive} from "responsive-gsap";
import gsap from "gsap";
import {useRef} from "react";

export function Example() {
    const scope = useRef<HTMLDivElement>(null);

    useGSAPResponsive(
        (root) => ({
            timeline: gsap.from(root.querySelector(".box"), {scale: 0.5}),
        }),
        {
            scope,
            observeResize: ".box",
        }
    );

    return (
        <div ref={scope}>
            <div className="box"/>
        </div>
    );
}
```

Useful for dynamic layouts or fluid containers.

---

### 4. Play-after-load (deferred animation)

Pause animation until a loading process completes:

```tsx
import {useGSAPResponsive} from "responsive-gsap";
import gsap from "gsap";
import {useRef} from "react";

export function Example() {
    const scope = useRef<HTMLDivElement>(null);

    const loadingHandlers = {
        isLoadComplete: () => loadState === "done",
        isLoadingEnabled: () => true,
        onLoadComplete: (cb: () => void) => window.addEventListener("load", cb),
        offLoadComplete: (cb: () => void) => window.removeEventListener("load", cb),
    };

    useGSAPResponsive(
        (root) => ({
            timeline: gsap.timeline().from(root.querySelector(".box"), {y: 50, opacity: 0}),
        }),
        {
            scope,
            playAfterLoad: loadingHandlers,
        }
    );

    return (
        <div ref={scope}>
            <div className="box"/>
        </div>
    );
}
```

---

## 🧩 Notes

* `useGSAPResponsive` **inherits all behavior from** `useGSAP`, including lifecycle and scope handling.
* Always return `{ timeline, cleanup }` from your setup for best control.
* Media query and resize-based setups clean up correctly without manual handling.

---

## 🧠 Example integration

A responsive hero animation that waits for page load:

```tsx
import {useGSAPResponsive} from "responsive-gsap";
import gsap from "gsap";
import {useRef} from "react";

export function Example() {
    const scope = useRef<HTMLDivElement>(null);

    const loadingHandlers = {
        isLoadComplete: () => document.readyState === "complete",
        isLoadingEnabled: () => true,
        onLoadComplete: (cb: () => void) => window.addEventListener("load", cb),
        offLoadComplete: (cb: () => void) => window.removeEventListener("load", cb),
    };

    useGSAPResponsive(
        [
            {
                query: "(max-width: 768px)",
                setup: (root) => ({
                    timeline: gsap.from(root.querySelector(".hero-title"), {y: 40, opacity: 0}),
                }),
            },
            {
                query: "(min-width: 769px)",
                setup: (root) => ({
                    timeline: gsap.from(root.querySelector(".hero-title"), {x: -100, opacity: 0}),
                }),
            },
        ],
        {
            scope,
            playAfterLoad: loadingHandlers,
            observeResize: ".hero-title",
            debug: true,
        }
    );

    return (
        <div ref={scope}>
            <h1 className="hero-title">Responsive GSAP</h1>
        </div>
    );
}
```

## License
MIT © [phucbm](https://github.com/phucbm)
