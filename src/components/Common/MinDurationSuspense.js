// MinDurationSuspense.js
import React, { useState, useEffect, Suspense } from "react";

/**
 * This component ensures the fallback spinner stays visible
 * for at least `minDuration` milliseconds before showing children.
 */
function MinDurationSuspense({ children, fallback, minDuration = 2000 }) {
  const [timePassed, setTimePassed] = useState(false);

  useEffect(() => {
    // Start a timer that will flip `timePassed` after minDuration
    const timer = setTimeout(() => {
      setTimePassed(true);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  return (
    <Suspense fallback={fallback}>
      {/* If children are ready but time hasn’t passed, still show fallback */}
      {timePassed ? children : fallback}
    </Suspense>
  );
}

export default MinDurationSuspense;
