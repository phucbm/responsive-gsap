import { useGSAPConfig, useGSAPReturn } from '@gsap/react';

type Setup = (root: HTMLElement) => {
    timeline?: gsap.core.Timeline;
    cleanup?: () => void;
};
interface PageLoadingHandlers {
    isLoadComplete: () => boolean;
    isLoadingEnabled: () => boolean;
    onLoadComplete: (fn: () => void) => void;
    offLoadComplete: (fn: () => void) => void;
}
interface useResponsiveGSAPConfig extends useGSAPConfig {
    setup?: Setup;
    mediaQueries?: {
        query: string;
        setup: Setup;
    }[];
    observeResize?: string;
    playAfterLoad?: boolean | PageLoadingHandlers;
    debug?: boolean;
}
declare function useResponsiveGSAP({ scope, dependencies, revertOnUpdate, setup, mediaQueries, observeResize, playAfterLoad, debug, }: useResponsiveGSAPConfig): useGSAPReturn;

export { useResponsiveGSAP };
