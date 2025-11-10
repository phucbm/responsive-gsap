// useGSAPResponsive.ts
import {useGSAP, useGSAPConfig, useGSAPReturn} from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type ContextSafeFunc = <T extends Function>(func: T) => T;

type Setup = (root: HTMLElement, contextSafe: ContextSafeFunc) => {
    timeline?: gsap.core.Timeline;
    cleanup?: () => void;
} | void;

export interface PageLoadingHandlers {
    isLoadComplete: () => boolean;
    isLoadingEnabled: () => boolean;
    onLoadComplete: (fn: () => void) => void;
    offLoadComplete: (fn: () => void) => void;
}

interface useGSAPResponsiveConfig extends useGSAPConfig {
    observeResize?: string;
    playAfterLoad?: boolean | PageLoadingHandlers;
    debug?: boolean;
}

export function useGSAPResponsive(
    setupOrQueries: Setup | Array<{ query: string; setup: Setup }>,
    config?: useGSAPResponsiveConfig
): useGSAPReturn {
    const {
        scope,
        dependencies,
        revertOnUpdate,
        observeResize,
        playAfterLoad = false,
        debug = false,
    } = config || {};
    return useGSAP(
        (context, contextSafe) => {
            const root = getRoot(scope);

            if (!root) {
                console.warn("[useGSAPResponsive] No root element found");
                return;
            }

            if (debug) console.log("[useGSAPResponsive] Initializing");

            // Ensure contextSafe is defined (should always be provided by useGSAP)
            if (!contextSafe) {
                console.error("[useGSAPResponsive] contextSafe not provided by useGSAP");
                return;
            }

            // Capture contextSafe as non-nullable for closure
            const safeContextSafe: ContextSafeFunc = contextSafe;

            // Determine if we have media queries or a single setup
            const isMediaQueryMode = Array.isArray(setupOrQueries);
            const mediaQueries = isMediaQueryMode ? setupOrQueries : null;
            const singleSetup = !isMediaQueryMode ? setupOrQueries : null;

            // Resolve handlers if playAfterLoad is provided as an object
            let handlers: PageLoadingHandlers | undefined;
            if (playAfterLoad) {
                if (typeof playAfterLoad === "object") {
                    handlers = playAfterLoad as PageLoadingHandlers;
                } else {
                    // boolean true used without handlers -> fail fast
                    throw new Error(
                        "[useGSAPResponsive] playAfterLoad is true but no handlers provided. " +
                        "Use playAfterLoad: { isLoadComplete, isLoadingEnabled, onLoadComplete, offLoadComplete }"
                    );
                }
            }

            const mm = gsap.matchMedia();

            // Type assertion after null check - root is guaranteed to be HTMLElement here
            const safeRoot = root as HTMLElement;

            // Track the current timeline reference across setup calls
            let currentTimelineRef: { tl: gsap.core.Timeline | null } = {tl: null};
            let userCleanup: (() => void) | undefined;

            // Wrapper that captures timeline and handles playAfterLoad logic
            function wrapSetup(userSetup: Setup) {
                return () => {
                    if (debug) console.log("[useGSAPResponsive] Running setup");

                    // Clean up previous user cleanup
                    if (userCleanup) {
                        if (debug) console.log("[useGSAPResponsive] Running user cleanup");
                        userCleanup();
                    }

                    // Run user's setup and capture return value, passing contextSafe
                    const result = userSetup(safeRoot, safeContextSafe);

                    // Extract timeline and cleanup from result (if result is not void)
                    if (result) {
                        currentTimelineRef.tl = result.timeline || null;
                        userCleanup = result.cleanup;
                    } else {
                        currentTimelineRef.tl = null;
                        userCleanup = undefined;
                    }

                    if (debug) {
                        console.log("[useGSAPResponsive] Timeline captured:", currentTimelineRef.tl);
                        if (handlers) {
                            console.log("[useGSAPResponsive] isLoadComplete:", handlers.isLoadComplete());
                        }
                    }

                    // If playAfterLoad is enabled, ensure timeline starts paused
                    if (playAfterLoad && currentTimelineRef.tl) {
                        // handlers exists because we threw earlier if playAfterLoad was boolean true
                        if (handlers!.isLoadingEnabled()) {
                            // Loading is enabled, pause and wait for load complete
                            if (!currentTimelineRef.tl.paused()) {
                                if (debug) console.log("[useGSAPResponsive] Pausing timeline (playAfterLoad enabled)");
                                currentTimelineRef.tl.pause();
                            }

                            // If page is already loaded, play the timeline
                            if (handlers!.isLoadComplete()) {
                                if (debug) console.log("[useGSAPResponsive] Playing timeline (load already complete)");
                                currentTimelineRef.tl.play();
                            }
                        } else {
                            // If loading animation is disabled, just play immediately
                            if (debug) console.log("[useGSAPResponsive] Loading disabled, playing timeline immediately");
                            // Don't pause, let it play naturally
                            currentTimelineRef.tl.play();
                        }
                    }
                };
            }

            // Helper to setup load complete handler
            const setupLoadCompleteHandler = () => {
                if (!playAfterLoad || !handlers) return undefined;

                const handleLoadingComplete = () => {
                    if (debug) console.log("[useGSAPResponsive] Load complete event fired");
                    if (currentTimelineRef.tl) {
                        if (debug) console.log("[useGSAPResponsive] Playing timeline on load complete");
                        currentTimelineRef.tl.play();
                    }
                };

                handlers.onLoadComplete(handleLoadingComplete);

                return () => {
                    if (debug) console.log("[useGSAPResponsive] Cleaning up load complete listener");
                    handlers!.offLoadComplete(handleLoadingComplete);
                };
            };

            // Setup mediaQueries or single setup
            if (mediaQueries && mediaQueries.length > 0) {
                if (debug) console.log("[useGSAPResponsive] Setting up media queries:", mediaQueries.length);

                mediaQueries.forEach(({query, setup: mqSetup}) => {
                    mm.add(query, () => {
                        const wrappedSetup = wrapSetup(mqSetup);
                        wrappedSetup();
                        return setupLoadCompleteHandler();
                    });
                });
            } else if (singleSetup) {
                if (debug) console.log("[useGSAPResponsive] Setting up with default media query");

                mm.add("(min-width: 0px)", () => {
                    const wrappedSetup = wrapSetup(singleSetup);
                    wrappedSetup();
                    return setupLoadCompleteHandler();
                });
            }

            // Setup ResizeObserver
            let ro: ResizeObserver | null = null;

            if (observeResize) {
                if (debug) console.log("[useGSAPResponsive] Setting up ResizeObserver for:", observeResize);

                const elements = safeRoot.querySelectorAll(observeResize);

                if (elements.length > 0) {
                    // Get the wrapped setup from the appropriate source
                    const setupToRun = mediaQueries && mediaQueries.length > 0
                        ? wrapSetup(mediaQueries[0].setup) // Use first media query's setup
                        : singleSetup
                            ? wrapSetup(singleSetup)
                            : null;

                    if (setupToRun) {
                        let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

                        ro = new ResizeObserver(() => {
                            // Clear previous timeout to debounce
                            if (resizeTimeout) {
                                clearTimeout(resizeTimeout);
                            }

                            // Wait for resize to settle before re-running setup
                            resizeTimeout = setTimeout(() => {
                                if (debug) console.log("[useGSAPResponsive] Resize detected, re-running setup");
                                setupToRun();
                            }, 150); // 150ms debounce
                        });

                        elements.forEach((el) => ro!.observe(el));

                        if (debug) console.log("[useGSAPResponsive] Observing", elements.length, "elements");
                    }
                } else {
                    if (debug) console.log("[useGSAPResponsive] No elements found for selector:", observeResize);
                }
            }

            // Cleanup
            return () => {
                if (debug) console.log("[useGSAPResponsive] Cleaning up");

                mm.revert();

                if (ro) {
                    ro.disconnect();
                }

                if (userCleanup) {
                    userCleanup();
                }
            };
        },
        {scope, dependencies, revertOnUpdate}
    );
}

function getRoot(scope: useGSAPConfig['scope']) {
    // resolve `scope` (which may be ReactRef | Element | string) to an HTMLElement | null
    let root: HTMLElement | null = null;

    if (!scope) {
        console.warn("[useGSAPResponsive] No scope provided");
        return;
    }

    if (typeof scope === "object" && "current" in scope) {
        // React ref
        root = (scope as any).current as HTMLElement | null;
    } else if (typeof scope === "string") {
        // selector string -> resolve in DOM (guard for SSR)
        root = typeof document !== "undefined" ? (document.querySelector(scope) as HTMLElement | null) : null;
    } else if (scope instanceof Element) {
        // direct Element
        root = scope as HTMLElement;
    }

    return root;
}