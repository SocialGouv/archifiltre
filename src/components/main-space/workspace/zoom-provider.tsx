import React, { FC, useCallback, useContext, useState } from "react";
import { empty } from "util/function/function-util";
import {
  moveZoomWindow,
  ZoomDirection,
  zoomReducer,
} from "util/zoom/zoom-util";

type ZoomState = {
  zoomIn: (mousePosition: number | null, zoomSpeed: number) => void;
  zoomOut: (mousePosition: number | null, zoomSpeed: number) => void;
  setZoom: (offset: number, ratio: number) => void;
  setDefaultMousePosition: (mousePosition: number | null) => void;
  moveWindow: (moveDirection: number) => void;
  resetZoom: () => void;
  ratio: number;
  offset: number;
};

const zoomState: ZoomState = {
  zoomIn: empty,
  zoomOut: empty,
  setZoom: empty,
  setDefaultMousePosition: empty,
  moveWindow: empty,
  resetZoom: empty,
  ratio: 1,
  offset: 0,
};

const ZoomContext = React.createContext(zoomState);

export const useZoomContext = () => useContext(ZoomContext);

const ZoomProvider: FC = ({ children }) => {
  const [ratio, setRatio] = useState(1);
  const [offset, setOffset] = useState(0);
  const [defaultMousePosition, setDefaultMousePosition] = useState<
    number | null
  >(null);

  const viewPortCenter = offset + 1 / (2 * ratio);

  const applyZoom = useCallback(
    (zoomDirection, mousePosition, zoomSpeed) => {
      const zoomState = {
        offset,
        ratio,
      };
      const zoomAction = {
        mousePosition,
        zoomDirection,
        zoomSpeed,
      };
      const { offset: nextOffset, ratio: nextRatio } = zoomReducer(
        zoomState,
        zoomAction
      );
      setOffset(nextOffset);
      setRatio(nextRatio);
    },
    [ratio, offset, setRatio, setOffset]
  );

  const setZoom = useCallback(
    (offset, ratio) => {
      setOffset(offset);
      setRatio(ratio);
    },
    [setOffset, setRatio]
  );

  const moveWindow = useCallback(
    (moveDirection: number) => {
      setOffset(moveZoomWindow({ ratio, offset }, moveDirection));
    },
    [offset, ratio, setOffset]
  );

  const zoomIn = useCallback(
    (mousePosition, zoomSpeed) => {
      applyZoom(
        ZoomDirection.IN,
        mousePosition || defaultMousePosition || viewPortCenter,
        zoomSpeed
      );
    },
    [applyZoom, defaultMousePosition, viewPortCenter]
  );

  const zoomOut = useCallback(
    (mousePosition, zoomSpeed) => {
      applyZoom(
        ZoomDirection.OUT,
        mousePosition || defaultMousePosition || viewPortCenter,
        zoomSpeed
      );
    },
    [applyZoom, defaultMousePosition, viewPortCenter]
  );

  const resetZoom = useCallback(() => {
    setZoom(0, 1);
  }, [setZoom]);

  return (
    <ZoomContext.Provider
      value={{
        zoomIn,
        zoomOut,
        resetZoom,
        setDefaultMousePosition,
        moveWindow,
        setZoom,
        ratio,
        offset,
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
};

export default ZoomProvider;
