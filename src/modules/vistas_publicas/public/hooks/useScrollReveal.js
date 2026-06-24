// src/modules/vistas_publicas/public/hooks/useScrollReveal.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook to reveal elements on scroll using Intersection Observer
 * @param {Object} options - Intersection Observer options
 * @param {boolean} once - Whether to trigger only once (default: true)
 * @returns {Object} ref - React ref to attach to the element
 */
export function useScrollReveal(options = {}, once = true) {
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (!once || !hasAnimated.current) {
                        entry.target.classList.add('is-visible');
                        hasAnimated.current = true;
                    }
                } else if (!once) {
                    entry.target.classList.remove('is-visible');
                }
            });
        }, defaultOptions);

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [options.threshold, options.rootMargin, once]);

    return ref;
}

/**
 * Hook to get multiple refs for staggered scroll reveal
 * @param {number} count - Number of elements
 * @param {Object} options - Intersection Observer options
 * @returns {Array} Array of refs
 */
export function useScrollRevealMultiple(count, options = {}) {
    const refs = useRef([]);

    useEffect(() => {
        // Initialize refs array
        refs.current = refs.current.slice(0, count);
    }, [count]);

    useEffect(() => {
        const elements = refs.current.filter(Boolean);
        if (elements.length === 0) return;

        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, defaultOptions);

        elements.forEach((element) => {
            if (element) observer.observe(element);
        });

        return () => {
            elements.forEach((element) => {
                if (element) observer.unobserve(element);
            });
        };
    }, [options.threshold, options.rootMargin]);

    return (index) => {
        return (el) => {
            refs.current[index] = el;
        };
    };
}
