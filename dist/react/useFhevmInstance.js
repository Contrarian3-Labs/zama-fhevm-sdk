/**
 * useFhevmInstance Hook - Create FHEVM Instance
 *
 * React hook that wraps the createInstance action
 * Manages instance creation with React state and lifecycle
 *
 * This is a thin wrapper (~20 lines) that calls the core createInstance action
 */
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createInstance, FhevmAbortError } from '../actions/createInstance.js';
import { useConfig } from './useConfig.js';
/**
 * Hook for creating and managing FHEVM instances
 *
 * @param parameters - Instance creation parameters
 * @returns Object with instance, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * import { useFhevmInstance } from '@fhevm-sdk/react'
 *
 * function Component() {
 *   const { instance, isLoading, error } = useFhevmInstance({
 *     provider: window.ethereum,
 *     chainId: 31337,
 *   })
 *
 *   if (isLoading) return <div>Loading FHEVM...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *   if (!instance) return null
 *
 *   return <div>FHEVM Ready!</div>
 * }
 * ```
 */
export function useFhevmInstance(parameters) {
    const { provider, chainId, enabled = true } = parameters;
    const config = useConfig(parameters);
    const [instance, setInstance] = useState(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(undefined);
    const abortControllerRef = useRef(null);
    const providerRef = useRef(provider);
    const chainIdRef = useRef(chainId);
    const refresh = useCallback(() => {
        // Abort any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        providerRef.current = provider;
        chainIdRef.current = chainId;
        setInstance(undefined);
        setError(undefined);
        setIsError(false);
        setIsLoading(false);
    }, [provider, chainId]);
    useEffect(() => {
        // Reset on provider/chainId change
        if (providerRef.current !== provider || chainIdRef.current !== chainId) {
            refresh();
        }
    }, [provider, chainId, refresh]);
    useEffect(() => {
        // Return early if not enabled or no provider
        if (!enabled || !provider) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            setInstance(undefined);
            setIsLoading(false);
            return;
        }
        // Check if instance already exists in cache
        const cachedInstance = config.getInstance({ chainId });
        if (cachedInstance && providerRef.current === provider && chainIdRef.current === chainId) {
            setInstance(cachedInstance);
            setIsLoading(false);
            setIsError(false);
            setError(undefined);
            return;
        }
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        setIsLoading(true);
        setIsError(false);
        setError(undefined);
        // Call core createInstance action
        createInstance(config, {
            provider,
            chainId,
            signal,
        })
            .then((newInstance) => {
            // Ignore if aborted or provider changed
            if (signal.aborted)
                return;
            if (providerRef.current !== provider || chainIdRef.current !== chainId)
                return;
            setInstance(newInstance);
            setIsLoading(false);
            setIsError(false);
            setError(undefined);
        })
            .catch((err) => {
            // Ignore abort errors
            if (err instanceof FhevmAbortError || signal.aborted)
                return;
            // Ignore if provider changed
            if (providerRef.current !== provider || chainIdRef.current !== chainId)
                return;
            setInstance(undefined);
            setIsLoading(false);
            setIsError(true);
            setError(err);
        });
        return () => {
            // Cleanup: abort request on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [enabled, provider, chainId, config]);
    return {
        instance,
        isLoading,
        isError,
        error,
        refresh,
    };
}
