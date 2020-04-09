import React, { FC, useCallback, useState } from "react";

import TagListItem from "components/tags/all-tags-item";
import TextAlignCenter from "components/common/text-align-center";

import * as Color from "util/color-util";
import { FilesAndFoldersMetadataMap } from "../../reducers/files-and-folders-metadata/files-and-folders-metadata-types";
import { FilesAndFoldersMap } from "../../reducers/files-and-folders/files-and-folders-types";

import {
  getTagSize,
  sortTags,
  tagHasFfId,
  tagMapHasTags,
  tagMapToArray,
} from "../../reducers/tags/tags-selectors";
import { useSelector } from "react-redux";
import { getFilesAndFoldersFromStore } from "../../reducers/files-and-folders/files-and-folders-selectors";
import { getFilesAndFoldersMetadataFromStore } from "../../reducers/files-and-folders-metadata/files-and-folders-metadata-selectors";
import { useTranslation } from "react-i18next";
import { FaTags } from "react-icons/fa";
import styled from "styled-components";
import { TagMap } from "../../reducers/tags/tags-types";

const TagsContent = styled.div`
  font-size: 0.8em;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
`;

const Wrapper = styled.div`
  opacity: ${({ tags }) => (Object.keys(tags).length > 0 ? 1 : 0.5)};
  background: white;
  height: 100%;
  border-radius: 5px;
  padding: 0.5em 0 1em 0;
`;

interface AllTagsProps {
  tags: TagMap;
  filesAndFolders: FilesAndFoldersMap;
  filesAndFoldersMetadata: FilesAndFoldersMetadataMap;
  tag_id_to_highlight: string;
  total_volume: number;
  focused_node_id: string;
  highlightTag: (tagId: string) => void;
  stopHighlightingTag: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;
  onRenameTag: (tagId: string) => void;
  onAddTagged: (nodeId: string, tagId: string) => void;
  onDeleteTagged: (nodeId: string, tagId: string) => void;
}

const AllTags: FC<AllTagsProps> = ({
  tags,
  filesAndFolders,
  filesAndFoldersMetadata,
  tag_id_to_highlight,
  total_volume,
  focused_node_id,
  highlightTag,
  stopHighlightingTag,
  onDeleteTag,
  onRenameTag,
  onAddTagged,
  onDeleteTagged,
}) => {
  const { t } = useTranslation();
  const [editingTagId, setEditingTagId] = useState("");
  const startEditingTagFactory = useCallback(
    (newEditingTagId) => () => setEditingTagId(newEditingTagId),
    [setEditingTagId]
  );
  const stopEditingTag = useCallback(() => setEditingTagId(""), [
    setEditingTagId,
  ]);
  const computeOpacity = useCallback(
    (tagId) => {
      if (editingTagId.length > 0) {
        return editingTagId === tagId ? 1 : 0.2;
      } else if (tag_id_to_highlight.length > 0) {
        return tag_id_to_highlight === tagId ? 1 : 0.2;
      } else {
        return 1;
      }
    },
    [editingTagId, tag_id_to_highlight]
  );

  const tagsList = sortTags(tagMapToArray(tags))
    .map((tag) => {
      const size = getTagSize(tag, filesAndFolders, filesAndFoldersMetadata);
      const opacity = computeOpacity(tag.id);
      const percentage = Math.floor((size / total_volume) * 100);
      const editing = editingTagId === tag.id;
      const shouldDisplayCount = focused_node_id === undefined;
      const nodeHasTag = tagHasFfId(tag, focused_node_id);

      return (
        <TagListItem
          key={tag.id}
          tag={tag.name}
          opacity={opacity}
          editing={editing}
          percentage={percentage}
          shoud_display_count={shouldDisplayCount}
          node_has_tag={nodeHasTag}
          tag_number={tag.ffIds.length}
          highlightTag={highlightTag(tag.id)}
          startEditingTag={startEditingTagFactory(tag.id)}
          stopEditingTag={stopEditingTag}
          deleteTag={onDeleteTag(tag.id)}
          renameTag={onRenameTag(tag.id)}
          addTagToNode={onAddTagged(focused_node_id, tag.id)}
          removeTagFromNode={onDeleteTagged(focused_node_id, tag.id)}
        />
      );
    })
    .reduce((acc, val) => [...acc, val], []);

  return (
    <Wrapper tags={tags}>
      <div className="grid-y" style={{ height: "100%" }}>
        <div className="cell shrink">
          <TextAlignCenter>
            <b>{t("workspace.allTags")}</b>
          </TextAlignCenter>
        </div>
        <div className="cell auto">
          {!tagMapHasTags(tags) && (
            <div
              className="grid-y grid-frame align-center"
              style={{ height: "75%" }}
            >
              <div className="cell">
                <TextAlignCenter>
                  <FaTags
                    style={{
                      color: Color.placeholder(),
                      fontSize: "3em",
                      lineHeight: 0,
                    }}
                  />
                </TextAlignCenter>
              </div>
              <div className="cell">
                <TextAlignCenter>
                  <em>{t("workspace.noTags")}</em>
                </TextAlignCenter>
              </div>
            </div>
          )}
          {tagMapHasTags(tags) && (
            <TagsContent onMouseLeave={stopHighlightingTag}>
              {tagsList}
            </TagsContent>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

interface AllTagsApiToPropsPros {
  api: any;
  tags: TagMap;
  focusedNodeId: string;
  renameTag: (tagId: string, name: string) => void;
  deleteTag: (tagId: string) => void;
  deleteTagged: (nodeId: string, tagId: string) => void;
  addTagged: (nodeId: string, tagId: string) => void;
}

const AllTagsApiToProps: FC<AllTagsApiToPropsPros> = ({
  api,
  tags,
  focusedNodeId,
  renameTag,
  deleteTag,
  deleteTagged,
  addTagged,
}) => {
  const { icicle_state } = api;
  const filesAndFolders = useSelector(getFilesAndFoldersFromStore);
  const filesAndFoldersMetadata = useSelector(
    getFilesAndFoldersMetadataFromStore
  );

  const rootElementId = "";
  const totalVolume = filesAndFoldersMetadata[rootElementId].childrenTotalSize;

  const tagIdToHighlight = icicle_state.tagIdToHighlight();

  const highlightTag = (tagId) => () => {
    icicle_state.setTagIdToHighlight(tagId);
  };

  const stopHighlightingTag = () => {
    icicle_state.setNoTagIdToHighlight();
  };

  const onRenameTag = (tagId) => (name) => {
    renameTag(tagId, name);
    api.undo.commit();
  };

  const onDeleteTag = (tagId) => () => {
    deleteTag(tagId);
    icicle_state.setNoTagIdToHighlight();
    api.undo.commit();
  };

  const onAddTagged = (ffId, tagId) => () => {
    if (ffId !== undefined) {
      addTagged(tagId, ffId);
      api.undo.commit();
    }
  };

  const onDeleteTagged = (ffId, tagId) => () => {
    if (ffId !== undefined) {
      deleteTagged(tagId, ffId);
      api.undo.commit();
    }
  };

  return (
    <AllTags
      tag_id_to_highlight={tagIdToHighlight}
      focused_node_id={focusedNodeId}
      total_volume={totalVolume}
      highlightTag={highlightTag}
      stopHighlightingTag={stopHighlightingTag}
      onRenameTag={onRenameTag}
      onDeleteTag={onDeleteTag}
      onAddTagged={onAddTagged}
      onDeleteTagged={onDeleteTagged}
      tags={tags}
      filesAndFolders={filesAndFolders}
      filesAndFoldersMetadata={filesAndFoldersMetadata}
    />
  );
};

export default AllTagsApiToProps;