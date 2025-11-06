// useResponsiveGSAP.ts
import {useGSAP, useGSAPConfig, useGSAPReturn} from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

type Setup = (root: HTMLElement) => {
    timeline?: gsap.core.Timeline;
    cleanup?: () => void;
};

export interface PageLoadingHandlers {
    isLoadComplete: () => boolean;
    isLoadingEnabled: () => boolean;
    onLoadComplete: (fn: () => void) => void;
    offLoadComplete: (fn: () => void) => void;
}

interface useResponsiveGSAPConfig extends useGSAPConfig {
    setup?: Setup;
    mediaQueries?: { query: string; setup: Setup; }[];
    observeResize?: string;
    playAfterLoad?: boolean | PageLoadingHandlers;
    debug?: boolean;
}

export function useResponsiveGSAP({
                                      scope,
                                      dependencies,
                                      revertOnUpdate,
                                      setup,
                                      mediaQueries,
                                      observeResize,
                                      playAfterLoad = false,
                                      debug = false,
                                  }: useResponsiveGSAPConfig): useGSAPReturn {
    return useGSAP(
        () => {
            const root = getRoot(scope);

            if (!root) {
                console.warn("[useResponsiveGSAP] No root element found");
                return;
            }

            if (debug) console.log("[useResponsiveGSAP] Initializing");

            // Resolve handlers if playAfterLoad is provided as an object
            let handlers: PageLoadingHandlers | undefined;
            if (playAfterLoad) {
                if (typeof playAfterLoad === "object") {
                    handlers = playAfterLoad as PageLoadingHandlers;
                } else {
                    // boolean true used without handlers -> fail fast
                    throw new Error(
                        "[useResponsiveGSAP] playAfterLoad is true but no handlers provided. " +
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
                    if (debug) console.log("[useResponsiveGSAP] Running setup");

                    // Clean up previous user cleanup
                    if (userCleanup) {
                        if (debug) console.log("[useResponsiveGSAP] Running user cleanup");
                        userCleanup();
                    }

                    // Run user's setup and capture return value
                    const result = userSetup(safeRoot);

                    // Extract timeline and cleanup from result
                    currentTimelineRef.tl = result.timeline || null;
                    userCleanup = result.cleanup;

                    if (debug) {
                        console.log("[useResponsiveGSAP] Timeline captured:", currentTimelineRef.tl);
                        if (handlers) {
                            console.log("[useResponsiveGSAP] isLoadComplete:", handlers.isLoadComplete());
                        }
                    }

                    // If playAfterLoad is enabled, ensure timeline starts paused
                    if (playAfterLoad && currentTimelineRef.tl) {
                        // handlers exists because we threw earlier if playAfterLoad was boolean true
                        if (handlers!.isLoadingEnabled()) {
                            // Loading is enabled, pause and wait for load complete
                            if (!currentTimelineRef.tl.paused()) {
                                if (debug) console.log("[useResponsiveGSAP] Pausing timeline (playAfterLoad enabled)");
                                currentTimelineRef.tl.pause();
                            }

                            // If page is already loaded, play the timeline
                            if (handlers!.isLoadComplete()) {
                                if (debug) console.log("[useResponsiveGSAP] Playing timeline (load already complete)");
                                currentTimelineRef.tl.play();
                            }
                        } else {
                            // If loading animation is disabled, just play immediately
                            if (debug) console.log("[useResponsiveGSAP] Loading disabled, playing timeline immediately");
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
                    if (debug) console.log("[useResponsiveGSAP] Load complete event fired");
                    if (currentTimelineRef.tl) {
                        if (debug) console.log("[useResponsiveGSAP] Playing timeline on load complete");
                        currentTimelineRef.tl.play();
                    }
                };

                handlers.onLoadComplete(handleLoadingComplete);

                return () => {
                    if (debug) console.log("[useResponsiveGSAP] Cleaning up load complete listener");
                    handlers!.offLoadComplete(handleLoadingComplete);
                };
            };

            // Setup mediaQueries or single setup
            if (mediaQueries && mediaQueries.length > 0) {
                if (debug) console.log("[useResponsiveGSAP] Setting up media queries:", mediaQueries.length);

                mediaQueries.forEach(({query, setup: mqSetup}) => {
                    mm.add(query, () => {
                        const wrappedSetup = wrapSetup(mqSetup);
                        wrappedSetup();
                        return setupLoadCompleteHandler();
                    });
                });
            } else if (setup) {
                if (debug) console.log("[useResponsiveGSAP] Setting up with default media query");

                mm.add("(min-width: 0px)", () => {
                    const wrappedSetup = wrapSetup(setup);
                    wrappedSetup();
                    return setupLoadCompleteHandler();
                });
            }

            // Setup ResizeObserver
            let ro: ResizeObserver | null = null;

            if (observeResize) {
                if (debug) console.log("[useResponsiveGSAP] Setting up ResizeObserver for:", observeResize);

                const elements = safeRoot.querySelectorAll(observeResize);

                if (elements.length > 0) {
                    // Get the wrapped setup from the appropriate source
                    const setupToRun = mediaQueries && mediaQueries.length > 0
                        ? wrapSetup(mediaQueries[0].setup) // Use first media query's setup
                        : setup
                            ? wrapSetup(setup)
                            : null;

                    if (setupToRun) {
                        ro = new ResizeObserver(() => {
                            if (debug) console.log("[useResponsiveGSAP] Resize detected, re-running setup");
                            setupToRun();
                        });

                        elements.forEach((el) => ro!.observe(el));

                        if (debug) console.log("[useResponsiveGSAP] Observing", elements.length, "elements");
                    }
                } else {
                    if (debug) console.log("[useResponsiveGSAP] No elements found for selector:", observeResize);
                }
            }

            // Cleanup
            return () => {
                if (debug) console.log("[useResponsiveGSAP] Cleaning up");

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
        console.warn("[useResponsiveGSAP] No scope provided");
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