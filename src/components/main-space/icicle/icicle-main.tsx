import Paper from "@material-ui/core/Paper";
import { sum } from "lodash";
import React, {
  FC,
  memo,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { FilesAndFoldersMetadata } from "reducers/files-and-folders-metadata/files-and-folders-metadata-types";
import {
  AliasMap,
  CommentsMap,
  FilesAndFolders,
} from "reducers/files-and-folders/files-and-folders-types";
import { TagMap } from "reducers/tags/tags-types";
import * as ArrayUtil from "util/array/array-util";
import { empty } from "util/function/function-util";
import MinimapBracket from "../minimap-bracket";
import Ruler from "../ruler";
import AnimatedIcicle from "./animated-icicle";
import Icicle from "./icicle";
import { Dims, DimsAndId } from "./icicle-rect";
import { FillColor } from "./icicle-types";
import { MoveElement, useMovableElements } from "hooks/use-movable-elements";
import BreadcrumbsNew from "../breadcrumb/breadcrumbs";
import { ElementWeightMethod } from "reducers/icicle-sort-method/icicle-sort-method-types";
import { useFileMoveActiveState } from "../workspace/file-move-provider";
import { useZoomContext } from "../workspace/zoom-provider";

export type IcicleMouseHandler = (
  dimsAndId: DimsAndId,
  event: MouseEvent
) => void;

const Viewport = styled(Paper)`
  display: flex;
  height: 97.5%;
  justify-content: space-between;
  padding: 5px;
`;

const IcicleViewport = styled.div`
  height: 100%;
  width: 74%;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
`;

const IcicleWrapper = styled.div`
  height: 74%;
`;

const RulerWrapper = styled.div`
  height: 24%;
`;

const BreadcrumbsViewport = styled.div`
  height: 100%;
  width: 24%;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
`;

const BreadcrumbsWrapper = styled.div`
  height: 74%;
`;

const MinimapWrapper = styled.div`
  height: 24%;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.4);
`;

/**
 * Returns the array of widths divided by the sum of the widths.
 * @param widths - the widths to normalize
 */
const normalizeWidth = (widths: number[]) => {
  const totalWidth = sum(widths);
  return widths.map((a) => a / totalWidth);
};

/**
 * Determines if a minimap child element should render based on its width. Width < 2.5 are not rendered.
 * @param x - Mock parameter to keep the same API as shouldRenderChild
 * @param elementWidth - The width of the element
 */
const shouldRenderChildMinimap = (x: number, elementWidth: number): boolean => {
  const minimumMinimapElementWidth = 2.5;

  return elementWidth > minimumMinimapElementWidth;
};

export const ZOOM_SPEED = 1.1;
const viewBoxWidth = 1000;
const viewBoxHeight = 300;

type IcicleMainProps = {
  aliases: AliasMap;
  comments: CommentsMap;
  tags: TagMap;
  originalPath: string;
  rootId: string;
  fillColor: FillColor;
  hoveredElementId: string;
  lockedElementId: string;
  hoverSequence: string[];
  lockedSequence: string[];
  elementsToDelete: string[];
  getChildrenIdFromId: (id: string) => string[];
  getFfByFfId: (id: string) => FilesAndFolders & FilesAndFoldersMetadata;
  elementWeightMethod: ElementWeightMethod;
  maxDepth: number;
  lock: (id: string) => void;
  unlock: () => void;
  moveElement: (movedElementId: string, targetFolderId: string) => void;
  setFocus: (id: string) => void;
  setNoFocus: () => void;
  setNoHover: () => void;
};

const IcicleMain: FC<IcicleMainProps> = ({
  aliases,
  comments,
  tags,
  originalPath,
  rootId,
  fillColor,
  hoveredElementId,
  lockedElementId,
  hoverSequence,
  lockedSequence,
  elementsToDelete,
  getChildrenIdFromId,
  getFfByFfId,
  elementWeightMethod,
  maxDepth,
  lock,
  unlock,
  moveElement,
  setFocus,
  setNoFocus,
  setNoHover,
}) => {
  const [hoveredDims, setHoveredDims] = useState<Dims | null>(null);
  const [lockedDims, setLockedDims] = useState<Dims | null>(null);
  const [movedElementId, setMovedElementId] = useState("");
  const [movedElementTime, setMovedElementTime] = useState(0);
  const {
    zoomIn,
    zoomOut,
    setZoom,
    setDefaultMousePosition,
    moveWindow,
    offset: zoomOffset,
    ratio: zoomRatio,
  } = useZoomContext();

  const icicleHeight = viewBoxHeight;
  const icicleWidth = viewBoxWidth;

  const svgRef = useRef<SVGSVGElement>(null);

  /**
   * Returns the total size of the child elements based on its id
   */
  const getElementTotalSize = useCallback(
    (id) => getFfByFfId(id).childrenTotalSize,
    [getFfByFfId]
  );

  /**
   * Returns the total number of children files of an element based on its id
   */
  const getElementChildrenFilesCount = useCallback(
    (id) => getFfByFfId(id).nbChildrenFiles,
    [getFfByFfId]
  );

  /**
   * The function used to compute the width of an element. It will use the suitable computing method based on the
   * widthBySize boolean
   */
  const computeWidth = useMemo(
    () =>
      elementWeightMethod === ElementWeightMethod.BY_VOLUME
        ? getElementTotalSize
        : getElementChildrenFilesCount,
    [elementWeightMethod, getElementTotalSize, getElementChildrenFilesCount]
  );

  /**
   * Pretty obscure behaviour for now.
   */
  const computeWidthRec = useCallback(
    (ids, x, dx) => {
      const ans = [[x, dx]];
      if (ids.length < 2) {
        return ans;
      } else {
        const [parentId, childId] = ids;
        const childrenIds = getChildrenIdFromId(parentId);
        const widths = normalizeWidth(childrenIds.map(computeWidth)).map(
          (a) => a * dx
        );
        const cumulatedWidths = ArrayUtil.computeCumulative(widths);
        const childIndex = childrenIds.indexOf(childId);
        const childX = cumulatedWidths[childIndex] + x;
        const childDx = widths[childIndex];

        return ans.concat(computeWidthRec(ids.slice(1), childX, childDx));
      }
    },
    [getChildrenIdFromId, computeWidth]
  );

  /**
   * Normalizes the height based on the maxDepth of the file tree
   */
  const normalizeHeight = useCallback(() => icicleHeight / maxDepth, [
    icicleHeight,
    maxDepth,
  ]);

  /**
   * Determines if an icicle is in the viewport. It allows icicles not to be rendered if they are too far left
   * or too far right.
   */
  const isIcicleInViewport = useCallback(
    (x, elementWidth) => {
      const minimumDisplayedWidth = 1;
      const elementIsTooFarLeft = x + elementWidth < 0;
      const elementIsTooFarRight = x > viewBoxWidth;
      if (elementIsTooFarRight || elementIsTooFarLeft) {
        return false;
      }
      return elementWidth > minimumDisplayedWidth;
    },
    [icicleWidth]
  );

  /**
   * Handles viewport click action
   */
  const onClickHandler = useCallback(() => {
    unlock();
    setDefaultMousePosition(null);
  }, [unlock, setNoFocus, setDefaultMousePosition]);

  /**
   * Handle viewport mouse leave.
   */
  const onMouseLeaveHandler = useCallback(() => {
    setNoFocus();
  }, [setNoFocus]);

  /**
   * Handles click on icicle rectangle
   */
  const onIcicleRectClickHandler = useCallback(
    ({ id, dims }, event) => {
      event.stopPropagation();
      lock(id);
      const newDims = dims();
      setLockedDims(newDims);
      setDefaultMousePosition((newDims.x + newDims.dx / 2) / viewBoxWidth);
    },
    [lock, setLockedDims, setDefaultMousePosition]
  );

  /**
   * Handles double click on icicle rectangle
   */
  const onIcicleRectDoubleClickHandler = useCallback(
    ({ dims }) => {
      const { x, dx } = dims();
      const newZoomOffset = zoomOffset + x / (viewBoxWidth * zoomRatio);
      const newZoomRatio = (zoomRatio * viewBoxWidth) / dx;
      setZoom(newZoomOffset, newZoomRatio);
    },
    [setZoom, zoomRatio, zoomOffset]
  );

  /**
   * Handles mouse over icicle rectangle
   */
  const onIcicleRectMouseOverHandler = useCallback(
    ({ id, dims }) => {
      setHoveredDims(dims());
      setFocus(id);
    },
    [setFocus, setHoveredDims]
  );

  /**
   * Handles mouse leaving an icicle rectangle
   */
  const onIcicleMouseLeave = useCallback(() => {
    setNoHover();
  }, []);

  const { isFileMoveActive } = useFileMoveActiveState();

  const moveElementHandler = useCallback<MoveElement>(
    (newMovedElementId, targetFolderId) => {
      setMovedElementId(newMovedElementId);
      setMovedElementTime(Date.now());
      moveElement(newMovedElementId, targetFolderId);
    },
    [moveElement, setMovedElementId]
  );

  const { onIcicleMouseUp, onIcicleMouseDown } = useMovableElements(
    moveElementHandler
  );

  const onIcicleMouseWheel = useCallback(
    ({ verticalWheelDirection, horizontalWheelDirection, mousePosition }) => {
      const zoomMethod = verticalWheelDirection > 0 ? zoomIn : zoomOut;
      if (verticalWheelDirection !== 0) {
        zoomMethod(mousePosition, ZOOM_SPEED);
      } else {
        moveWindow(horizontalWheelDirection);
      }
    },
    [zoomIn, zoomOut, moveWindow]
  );

  return (
    <Viewport>
      <IcicleViewport>
        <IcicleWrapper>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            ref={svgRef}
            onClick={onClickHandler}
            onMouseLeave={onMouseLeaveHandler}
            onMouseUp={isFileMoveActive ? onIcicleMouseUp : empty}
            onMouseDown={isFileMoveActive ? onIcicleMouseDown : empty}
          >
            <AnimatedIcicle
              aliases={aliases}
              comments={comments}
              x={0}
              y={0}
              dx={icicleWidth}
              dy={icicleHeight}
              tags={tags}
              elementsToDelete={elementsToDelete}
              rootId={rootId}
              getWidthFromId={computeWidth}
              normalizeWidth={normalizeWidth}
              trueFHeight={normalizeHeight}
              getChildrenIdFromId={getChildrenIdFromId}
              fillColor={fillColor}
              hoverSequence={hoverSequence}
              lockedSequence={lockedSequence}
              shouldRenderChild={isIcicleInViewport}
              onIcicleRectClickHandler={onIcicleRectClickHandler}
              onIcicleRectDoubleClickHandler={onIcicleRectDoubleClickHandler}
              onIcicleRectMouseOverHandler={onIcicleRectMouseOverHandler}
              onIcicleMouseLeave={onIcicleMouseLeave}
              movedElementId={movedElementId}
              movedElementTime={movedElementTime}
              zoomOffset={zoomOffset * viewBoxWidth}
              zoomRatio={zoomRatio}
              onIcicleMouseWheel={onIcicleMouseWheel}
            />
          </svg>
        </IcicleWrapper>
        <RulerWrapper>
          <Ruler
            getFfByFfId={getFfByFfId}
            widthUnit={viewBoxWidth}
            hoveredDims={hoveredDims}
            hoveredElementId={hoveredElementId}
            lockedDims={lockedDims}
            lockedElementId={lockedElementId}
            totalSize={viewBoxWidth}
            fillColor={fillColor}
          />
        </RulerWrapper>
      </IcicleViewport>
      <BreadcrumbsViewport>
        <BreadcrumbsWrapper>
          <BreadcrumbsNew
            aliases={aliases}
            originalPath={originalPath}
            fillColor={fillColor}
            depth={maxDepth}
            lockedSequence={lockedSequence}
            hoveredSequence={hoverSequence}
            getFfByFfId={getFfByFfId}
            onBreadcrumbClick={onIcicleRectClickHandler}
          />
        </BreadcrumbsWrapper>
        <MinimapWrapper>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <Icicle
              aliases={aliases}
              comments={comments}
              x={0}
              y={0}
              dx={icicleWidth}
              dy={icicleHeight}
              rootId={rootId}
              getWidthFromId={computeWidth}
              elementsToDelete={elementsToDelete}
              normalizeWidth={normalizeWidth}
              trueFHeight={normalizeHeight}
              getChildrenIdFromId={getChildrenIdFromId}
              fillColor={fillColor}
              hoverSequence={hoverSequence}
              lockedSequence={lockedSequence}
              shouldRenderChild={shouldRenderChildMinimap}
              onIcicleRectClickHandler={empty}
              onIcicleRectDoubleClickHandler={empty}
              onIcicleRectMouseOverHandler={empty}
              tags={tags}
              zoomOffset={0}
              zoomRatio={1}
            />
            <MinimapBracket
              zoomOffset={zoomOffset}
              zoomRatio={zoomRatio}
              viewportWidth={viewBoxWidth}
              viewportHeight={viewBoxHeight}
            />
          </svg>
        </MinimapWrapper>
      </BreadcrumbsViewport>
    </Viewport>
  );
};

export default memo(IcicleMain);
