
/**
 * Google Analytics 4 (GA4) Utility
 * Handles initialization and event tracking.
 * Only active in production.
 */

export const initGA = (measurementId) => {
    // Check if we are in production mode
    // Vite sets import.meta.env.PROD to true during build (when using 'vite build')
    // or checks NODE_ENV depending on setup.
    const isProduction = import.meta.env.PROD;

    if (!isProduction) {
        console.log('[GA4] Development mode: Tracking disabled (events will be logged to console)');
        return;
    }

    if (!measurementId) {
        console.warn('[GA4] Warning: No Measurement ID provided. Tracking disabled.');
        return;
    }

    // Prevent duplicate initialization
    if (window.gtag) return;

    // Inject the GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize the dataLayer
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        window.dataLayer.push(arguments);
    }

    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId);

    console.log('[GA4] Initialized');
};

/**
 * Track a custom event
 * @param {string} eventName - The name of the event (snake_case recommended)
 * @param {object} params - Optional parameters for the event
 */
export const trackEvent = (eventName, params = {}) => {
    const isProduction = import.meta.env.PROD;

    if (!isProduction) {
        console.log(`[GA4] Mock Event: ${eventName}`, params);
        return;
    }

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
    } else {
        // If not initialized yet (async loading), we can try pushing to dataLayer manually or ignore
        if (window.dataLayer) {
            window.dataLayer.push({
                'event': eventName,
                ...params
            });
        }
    }
};
