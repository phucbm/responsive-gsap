import { useGSAPConfig, useGSAPReturn } from '@gsap/react';

type ContextSafeFunc = <T extends Function>(func: T) => T;
type Setup = (root: HTMLElement, contextSafe: ContextSafeFunc) => {
    timeline?: gsap.core.Timeline;
    cleanup?: () => void;
} | void;
interface PageLoadingHandlers {
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
declare function useGSAPResponsive(setupOrQueries: Setup | Array<{
    query: string;
    setup: Setup;
}>, config?: useGSAPResponsiveConfig): useGSAPReturn;

export { useGSAPResponsive };
