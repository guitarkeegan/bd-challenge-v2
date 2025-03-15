// Self-executing function that returns the actual debug function
export const dbg = (() => {
  // If DEBUG env var isn't set, return a no-op function
  if (process.env.DEBUG !== '1' && process.env.DEBUG !== 'true') {
    return () => { }; // No-op function
  }

  // Return the actual debug function that logs to console
  return (...args: any[]) => {
    // Simply log all arguments to the console with a [DEBUG] prefix
    console.log('[DEBUG]', ...args);
  };
})();
