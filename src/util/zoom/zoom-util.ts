import { boundNumber } from "../numbers/numbers-util";

export enum ZoomDirection {
  IN,
  OUT,
}

type ZoomState = {
  ratio: number;
  offset: number;
};

type ZoomAction = {
  mousePosition: number;
  zoomDirection: ZoomDirection;
  zoomSpeed: number;
};

const getZoomPower = (zoomDirection: ZoomDirection) =>
  zoomDirection === ZoomDirection.IN ? 1 : -1;

export const computeZoomRatio = (
  zoomRatio: number,
  zoomSpeed: number,
  zoomDirection: ZoomDirection
) => Math.max(zoomRatio * zoomSpeed ** getZoomPower(zoomDirection), 1);

export const computeOffset = (
  mousePosition: number,
  zoomRatio: number,
  newZoomRatio: number,
  zoomOffset: number
) => {
  const offset =
    mousePosition - (zoomRatio / newZoomRatio) * (mousePosition - zoomOffset);

  return boundNumber(0, 1 - 1 / newZoomRatio, offset);
};

export const zoomReducer = (
  { ratio, offset }: ZoomState,
  { mousePosition, zoomDirection, zoomSpeed }: ZoomAction
): ZoomState => {
  const nextRatio = computeZoomRatio(ratio, zoomSpeed, zoomDirection);
  const nextOffset = computeOffset(mousePosition, ratio, nextRatio, offset);
  return {
    ratio: nextRatio,
    offset: nextOffset,
  };
};
