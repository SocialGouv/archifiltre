import { useCallback, useRef } from "react";
import { Parameters } from "../types/types";

/**
 * Returns a throttled callback that will change throttleDelay ms after value changes
 * @param callback
 * @param throttleDelay
 */
export const useThrottledCallback = <T extends (...args: any[]) => void>(
  callback: (...args: Parameters<T>) => void,
  throttleDelay: number
): ((...args: Parameters<T>) => void) => {
  const isActiveRef = useRef<boolean>(true);

  return useCallback(
    (...args) => {
      if (!isActiveRef?.current) {
        return;
      }
      callback(...args);
      isActiveRef.current = false;
      setTimeout(() => (isActiveRef.current = true), throttleDelay);
    },
    [callback, isActiveRef]
  );
};
