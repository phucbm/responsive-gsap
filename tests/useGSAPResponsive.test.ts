import {renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useGSAPResponsive} from '../src';
import gsap from 'gsap';

describe('useGSAPResponsive', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = '<div class="target">Test</div>';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('Basic functionality', () => {
        it('should return context and contextSafe like useGSAP', () => {
            const {result} = renderHook(() =>
                useGSAPResponsive(
                    (root) => {
                        // Empty setup
                    },
                    {scope: container}
                )
            );

            expect(result.current.context).toBeDefined();
            expect(result.current.contextSafe).toBeDefined();
        });

        it('should pass root element to setup function', async () => {
            const setupSpy = vi.fn();

            renderHook(() =>
                useGSAPResponsive(setupSpy, {scope: container})
            );

            await waitFor(() => {
                expect(setupSpy).toHaveBeenCalledWith(
                    container,
                    expect.any(Function) // contextSafe
                );
            });
        });

        it('should work without returning anything from setup', () => {
            expect(() => {
                renderHook(() =>
                    useGSAPResponsive(
                        (root) => {
                            // No return value
                        },
                        {scope: container}
                    )
                );
            }).not.toThrow();
        });

        it('should handle timeline return from setup', async () => {
            const timeline = gsap.timeline();
            const setupFn = vi.fn(() => ({timeline}));

            renderHook(() =>
                useGSAPResponsive(setupFn, {scope: container})
            );

            await waitFor(() => {
                expect(setupFn).toHaveBeenCalled();
            });
        });

        it('should handle cleanup function return', async () => {
            const cleanupSpy = vi.fn();

            const {unmount} = renderHook(() =>
                useGSAPResponsive(
                    () => ({cleanup: cleanupSpy}),
                    {scope: container}
                )
            );

            // Wait a bit for setup to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            unmount();

            await waitFor(() => {
                expect(cleanupSpy).toHaveBeenCalled();
            });
        });
    });

    describe('Media queries', () => {
        it('should handle array of media queries', async () => {
            const desktopSetup = vi.fn();
            const mobileSetup = vi.fn();

            renderHook(() =>
                useGSAPResponsive(
                    [
                        {query: '(min-width: 768px)', setup: desktopSetup},
                        {query: '(max-width: 767px)', setup: mobileSetup},
                    ],
                    {scope: container}
                )
            );

            // At least one setup should be called based on matchMedia
            await waitFor(() => {
                expect(desktopSetup.mock.calls.length + mobileSetup.mock.calls.length).toBeGreaterThan(0);
            });
        });

        it('should pass contextSafe to media query setups', async () => {
            const setupSpy = vi.fn();

            renderHook(() =>
                useGSAPResponsive(
                    [{query: '(min-width: 0px)', setup: setupSpy}],
                    {scope: container}
                )
            );

            await waitFor(() => {
                expect(setupSpy).toHaveBeenCalledWith(
                    container,
                    expect.any(Function)
                );
            });
        });
    });

    describe('Dependencies', () => {
        it('should re-run setup when dependencies change', async () => {
            const setupSpy = vi.fn();
            let dep = 0;

            const {rerender} = renderHook(
                ({dependency}) =>
                    useGSAPResponsive(setupSpy, {
                        scope: container,
                        dependencies: [dependency],
                    }),
                {initialProps: {dependency: dep}}
            );

            await waitFor(() => {
                expect(setupSpy).toHaveBeenCalledTimes(1);
            });

            // Change dependency
            dep = 1;
            rerender({dependency: dep});

            await waitFor(() => {
                expect(setupSpy).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Debug mode', () => {
        it('should log debug messages when debug is true', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
            });

            renderHook(() =>
                useGSAPResponsive(
                    () => {
                    },
                    {scope: container, debug: true}
                )
            );

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('[useGSAPResponsive]')
                );
            });

            consoleSpy.mockRestore();
        });

        it('should not log when debug is false', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
            });

            renderHook(() =>
                useGSAPResponsive(
                    () => {
                    },
                    {scope: container, debug: false}
                )
            );

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('Error handling', () => {
        it('should warn when no root element found', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
            });

            renderHook(() =>
                useGSAPResponsive(() => {
                }, {scope: '#non-existent'})
            );

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('No root element found')
            );

            warnSpy.mockRestore();
        });

        it('should throw error when playAfterLoad is true without handlers', () => {
            expect(() => {
                renderHook(() =>
                    useGSAPResponsive(
                        () => {
                        },
                        {scope: container, playAfterLoad: true}
                    )
                );
            }).toThrow(/playAfterLoad is true but no handlers provided/);
        });
    });

    describe('playAfterLoad feature', () => {
        it('should accept PageLoadingHandlers object', () => {
            const handlers = {
                isLoadComplete: () => true,
                isLoadingEnabled: () => false,
                onLoadComplete: vi.fn(),
                offLoadComplete: vi.fn(),
            };

            expect(() => {
                renderHook(() =>
                    useGSAPResponsive(
                        () => ({timeline: gsap.timeline()}),
                        {scope: container, playAfterLoad: handlers}
                    )
                );
            }).not.toThrow();
        });

        it('should call onLoadComplete handler', async () => {
            const onLoadCompleteSpy = vi.fn();
            const handlers = {
                isLoadComplete: () => false,
                isLoadingEnabled: () => true,
                onLoadComplete: onLoadCompleteSpy,
                offLoadComplete: vi.fn(),
            };

            renderHook(() =>
                useGSAPResponsive(
                    () => ({timeline: gsap.timeline()}),
                    {scope: container, playAfterLoad: handlers}
                )
            );

            await waitFor(() => {
                expect(onLoadCompleteSpy).toHaveBeenCalled();
            });
        });
    });

    describe('observeResize feature', () => {
        it('should setup ResizeObserver when observeResize is provided', () => {
            const observeSpy = vi.spyOn(ResizeObserver.prototype, 'observe');

            container.innerHTML = '<div class="resize-target">Content</div>';

            renderHook(() =>
                useGSAPResponsive(
                    () => {
                    },
                    {scope: container, observeResize: '.resize-target'}
                )
            );

            expect(observeSpy).toHaveBeenCalled();

            observeSpy.mockRestore();
        });

        it('should disconnect ResizeObserver on cleanup', () => {
            const disconnectSpy = vi.spyOn(ResizeObserver.prototype, 'disconnect');

            container.innerHTML = '<div class="resize-target">Content</div>';

            const {unmount} = renderHook(() =>
                useGSAPResponsive(
                    () => {
                    },
                    {scope: container, observeResize: '.resize-target'}
                )
            );

            unmount();

            expect(disconnectSpy).toHaveBeenCalled();

            disconnectSpy.mockRestore();
        });
    });
});