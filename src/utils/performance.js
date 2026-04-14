/**
 * Performance optimization and data compression utilities
 */

export const optimizeAssetLoad = (isLowData) => {
  return isLowData ? 'low-res' : 'high-res';
};

export const throttleInteraction = (callback, delay = 300) => {
  let lastCall = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return callback(...args);
  };
};

export const calculateDataSavings = (count) => {
  return (count * 0.45).toFixed(2); // Simulated MB saved
};
