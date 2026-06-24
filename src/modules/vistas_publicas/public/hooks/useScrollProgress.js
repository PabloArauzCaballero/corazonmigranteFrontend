// src/modules/vistas_publicas/public/hooks/useScrollProgress.js
import { useState, useEffect } from 'react';

/**
 * Custom hook to track scroll progress
 * @returns {number} progress - Scroll progress from 0 to 100
 */
export function useScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let ticking = false;

        const updateProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;

            const scrollableHeight = documentHeight - windowHeight;
            const scrolled = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

            setProgress(Math.min(100, Math.max(0, scrolled)));
            ticking = false;
        };

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateProgress);
                ticking = true;
            }
        };

        // Initial calculation
        updateProgress();

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', updateProgress, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', updateProgress);
        };
    }, []);

    return progress;
}

/**
 * Custom hook to detect if user has scrolled past a certain threshold
 * @param {number} threshold - Scroll threshold in pixels (default: 100)
 * @returns {boolean} isScrolled - Whether scrolled past threshold
 */
export function useScrollThreshold(threshold = 100) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    setIsScrolled(scrollTop > threshold);
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [threshold]);

    return isScrolled;
}
