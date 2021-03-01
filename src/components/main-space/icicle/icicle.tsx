import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dims } from "./icicle-rect";
import IcicleRecursive from "./icicle-recursive";
import IcicleEnrichments from "./icicle-enrichments";
import { FillColor, IcicleMouseActionHandler } from "./icicle-types";
import IciclesOverlay from "./icicles-overlay";
import {
  AliasMap,
  CommentsMap,
} from "reducers/files-and-folders/files-and-folders-types";
import { TagMap } from "reducers/tags/tags-types";
import IcicleHightlightElement from "./icicle-highlight-element";
import { empty } from "util/function/function-util";
import { normalize } from "util/numbers/numbers-util";
import { useThrottledCallback } from "../../../hooks/use-throttled-callback";

export type DimsMap = {
  [id: string]: Dims;
};

export type WheelParams = {
  mousePosition: number;
  verticalWheelDirection: number;
  horizontalWheelDirection: number;
};

export type IcicleProps = {
  trueFHeight: () => number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  hoverSequence: string[];
  lockedSequence: string[];
  rootId: string;
  getWidthFromId: (id: string) => number;
  getChildrenIdFromId: (id: string) => string[];
  normalizeWidth: (width: number[]) => number[];
  shouldRenderChild: (xPosition: number, elementWidth: number) => boolean;
  fillColor: FillColor;
  onIcicleRectClickHandler: IcicleMouseActionHandler;
  onIcicleRectDoubleClickHandler: IcicleMouseActionHandler;
  onIcicleRectMouseOverHandler: IcicleMouseActionHandler;
  aliases: AliasMap;
  comments: CommentsMap;
  tags: TagMap;
  elementsToDelete: string[];
  movedElementId?: string;
  movedElementTime?: number;
  zoomOffset: number;
  zoomRatio: number;
  onIcicleMouseWheel?: (wheelParams: WheelParams) => void;
};

const Icicle: FC<IcicleProps> = ({
  getWidthFromId,
  x,
  y,
  dx,
  dy,
  rootId,
  hoverSequence,
  lockedSequence,
  getChildrenIdFromId,
  normalizeWidth,
  trueFHeight,
  shouldRenderChild,
  fillColor,
  onIcicleRectClickHandler,
  onIcicleRectMouseOverHandler,
  onIcicleRectDoubleClickHandler,
  aliases,
  comments,
  tags,
  elementsToDelete,
  movedElementId = "",
  movedElementTime = 0,
  zoomOffset,
  zoomRatio,
  onIcicleMouseWheel = empty,
}) => {
  const [dims, setDims] = useState<DimsMap>({});
  const dimsRef = useRef<DimsMap>({});
  const dimsUpdated = useRef<boolean>(false);
  const icicleRef = useRef<SVGGElement>(null);

  dimsUpdated.current = false;

  /**
   * Register the icicle dimensions to a reference
   */
  const registerDims = useCallback(
    (dimX: number, dimDx: number, dimY: number, dimDy: number, id: string) => {
      if (!dimsUpdated.current) {
        dimsRef.current = {};
      }

      dimsUpdated.current = true;

      dimsRef.current[id] = {
        x: dimX,
        dx: dimDx,
        y: dimY,
        dy: dimDy,
      };
    },
    [dimsRef, dimsUpdated]
  );

  // If the dims reference was updated during the render cycle, we update the
  // state accordingly to rerender the overlays
  useEffect(() => {
    if (dimsUpdated.current) {
      setDims(dimsRef.current);
    }
  });

  const onMouseWheel = ({ clientX, deltaY, deltaX }: any) => {
    const { x, width } = icicleRef?.current?.getBoundingClientRect() || clientX;
    const mousePosition = (clientX - x) / width;
    const verticalWheelDirection = normalize(deltaY);
    const horizontalWheelDirection = normalize(deltaX);
    onIcicleMouseWheel({
      mousePosition,
      verticalWheelDirection,
      horizontalWheelDirection,
    });
  };

  const throttledOnMouseWheel = useThrottledCallback(onMouseWheel, 300);

  const xc = zoomOffset;
  const dxc = dx / zoomRatio;

  const xPrime = (x + (x - xc)) * (dx / dxc);
  const dxPrime = dx * (dx / dxc);

  const sanitizedXPrime = Number.isNaN(xPrime) ? 0 : xPrime;
  const sanitizedDxPrime = Number.isNaN(dxPrime) ? 0 : dxPrime;
  const style =
    hoverSequence.length > 0 || lockedSequence.length > 0
      ? {
          opacity: 0.3,
        }
      : {};

  const lockedHovered =
    hoverSequence.length > 0
      ? lockedSequence.filter((id) => hoverSequence.includes(id))
      : lockedSequence;

  const lockedNotHovered = lockedSequence.filter(
    (id) => !hoverSequence.includes(id)
  );

  const unlockedHovered = hoverSequence.filter(
    (id) => !lockedSequence.includes(id)
  );

  const tagIdToHighlight = "";

  return (
    <g onWheel={throttledOnMouseWheel} ref={icicleRef}>
      <g style={style}>
        <IcicleRecursive
          x={sanitizedXPrime}
          y={y}
          width={sanitizedDxPrime}
          height={dy}
          id={rootId}
          getWidthFromId={getWidthFromId}
          getChildrenIdFromId={getChildrenIdFromId}
          normalizeWidth={normalizeWidth}
          trueFHeight={trueFHeight}
          shouldRenderChild={shouldRenderChild}
          fillColor={fillColor}
          onClickHandler={onIcicleRectClickHandler}
          onDoubleClickHandler={onIcicleRectDoubleClickHandler}
          onMouseOverHandler={onIcicleRectMouseOverHandler}
          registerDims={registerDims}
        />
      </g>
      <IciclesOverlay
        dimsMap={dims}
        opacity={1}
        ids={lockedHovered}
        fillColor={fillColor}
        onIcicleRectClickHandler={onIcicleRectClickHandler}
        onIcicleRectDoubleClickHandler={onIcicleRectDoubleClickHandler}
        onIcicleRectMouseOverHandler={onIcicleRectMouseOverHandler}
      />
      <IciclesOverlay
        dimsMap={dims}
        opacity={0.6}
        ids={lockedNotHovered}
        fillColor={fillColor}
        onIcicleRectClickHandler={onIcicleRectClickHandler}
        onIcicleRectDoubleClickHandler={onIcicleRectDoubleClickHandler}
        onIcicleRectMouseOverHandler={onIcicleRectMouseOverHandler}
      />
      <IciclesOverlay
        dimsMap={dims}
        opacity={0.3}
        ids={unlockedHovered}
        fillColor={fillColor}
        onIcicleRectClickHandler={onIcicleRectClickHandler}
        onIcicleRectDoubleClickHandler={onIcicleRectDoubleClickHandler}
        onIcicleRectMouseOverHandler={onIcicleRectMouseOverHandler}
      />
      <IcicleEnrichments
        aliases={aliases}
        comments={comments}
        tags={tags}
        elementsToDelete={elementsToDelete}
        highlightedTagId={tagIdToHighlight}
        dims={dims}
        onClick={onIcicleRectClickHandler}
        onDoubleClick={onIcicleRectDoubleClickHandler}
        onMouseOver={onIcicleRectMouseOverHandler}
      />
      <IcicleHightlightElement
        dimsMap={dims}
        highlightedElementId={movedElementId}
        highlightedElementTime={movedElementTime}
        onClickHandler={onIcicleRectClickHandler}
        onDoubleClickHandler={onIcicleRectDoubleClickHandler}
        onMouseOverHandler={onIcicleRectMouseOverHandler}
      />
    </g>
  );
};

const MemoIcicle = memo(Icicle);

export default MemoIcicle;
