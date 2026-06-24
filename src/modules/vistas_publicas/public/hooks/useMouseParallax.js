// src/modules/vistas_publicas/public/hooks/useMouseParallax.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook for mouse parallax effect
 * @param {number} intensity - Movement intensity (default: 20)
 * @param {boolean} enabled - Whether parallax is enabled (default: true)
 * @returns {Object} ref - React ref to attach to the element
 */
export function useMouseParallax(intensity = 20, enabled = true) {
    const ref = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const element = ref.current;
        if (!element) return;

        let animationFrameId = null;

        const handleMouseMove = (e) => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const mouseX = e.clientX;
                const mouseY = e.clientY;

                const deltaX = (mouseX - centerX) / rect.width;
                const deltaY = (mouseY - centerY) / rect.height;

                const moveX = deltaX * intensity;
                const moveY = deltaY * intensity;

                element.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        };

        const handleMouseLeave = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            element.style.transform = 'translate(0px, 0px)';
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [intensity, enabled]);

    return ref;
}

/**
 * Custom hook for 3D tilt effect on mouse move
 * @param {number} maxTilt - Maximum tilt angle in degrees (default: 10)
 * @param {boolean} enabled - Whether tilt is enabled (default: true)
 * @returns {Object} ref - React ref to attach to the element
 */
export function useMouseTilt(maxTilt = 10, enabled = true) {
    const ref = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const element = ref.current;
        if (!element) return;

        let animationFrameId = null;

        const handleMouseMove = (e) => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const mouseX = e.clientX;
                const mouseY = e.clientY;

                const deltaX = (mouseX - centerX) / (rect.width / 2);
                const deltaY = (mouseY - centerY) / (rect.height / 2);

                const rotateY = deltaX * maxTilt;
                const rotateX = -deltaY * maxTilt;

                element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        };

        const handleMouseLeave = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [maxTilt, enabled]);

    return ref;
}
