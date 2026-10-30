import React, { useEffect, useState } from 'react';

export const CountUp = ({ end = 0, duration = 800, prefix = '₹', decimals = 0 }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = 0;
    const endVal = Number(end) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const val = startVal + (endVal - startVal) * easeOutQuad;
      setCurrent(val);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(endVal);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {current.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
    </span>
  );
};
