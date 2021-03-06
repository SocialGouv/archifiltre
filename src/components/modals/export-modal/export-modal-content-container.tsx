import React, { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAreHashesReady } from "reducers/files-and-folders/files-and-folders-selectors";
import { getWorkspaceMetadataFromStore } from "reducers/workspace-metadata/workspace-metadata-selectors";
import { exportConfig, ExportType } from "./export-config";
import ExportModalContent from "./export-modal-content";
import { addTracker } from "logging/tracker";
import { ActionType } from "logging/tracker-types";

type ExportModalContentContainerProps = {
  closeModal: () => void;
};

const ExportModalContentContainer: FC<ExportModalContentContainerProps> = ({
  closeModal,
}) => {
  const { originalPath, sessionName } = useSelector(
    getWorkspaceMetadataFromStore
  );
  const areHashesReady = useSelector(getAreHashesReady);

  const dispatch = useDispatch();

  const startExport = (exportId: ExportType, exportPath: string) => {
    const { exportFunction, trackingTitle } = exportConfig[exportId];
    addTracker({
      title: trackingTitle,
      type: ActionType.TRACK_EVENT,
    });
    dispatch(exportFunction(exportPath));
  };

  return (
    <ExportModalContent
      areHashesReady={areHashesReady}
      originalPath={originalPath}
      sessionName={sessionName}
      startExport={startExport}
      closeModal={closeModal}
    />
  );
};

export default ExportModalContentContainer;
