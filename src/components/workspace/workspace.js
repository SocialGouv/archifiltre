import React from "react";

import Icicle from "components/main-space/icicle/icicle-container";
import Report from "components/report/report-container";
import AllTags from "components/tags/all-tags-container";
import NavigationBar from "components/workspace/navigation-bar/navigation-bar-container";
import { ROOT_FF_ID } from "../../reducers/files-and-folders/files-and-folders-selectors";

const Workspace = ({ api }) => (
  <div className="grid-y grid-frame">
    <div className="cell">
      <div className="grid-x">
        <div className="cell small-10" style={{ paddingRight: ".9375em" }}>
          <Report api={api} />
        </div>
        <div className="cell small-2">
          <AllTags api={api} />
        </div>
      </div>
    </div>

    <div className="cell">
      <div className="grid-x align-center">
        <div className="cell">
          <NavigationBar api={api} />
        </div>
      </div>
    </div>

    <div className="cell auto">
      <Icicle api={api} />
    </div>
  </div>
);

const WorkspaceApiToProps = props => {
  const api = props.api;
  const icicle_state = api.icicle_state;

  const childProps = {
    ...props,
    getFfByFfId: props.getFfByFfId,
    display_root: icicle_state.display_root(),
    root_id: ROOT_FF_ID,
    change_skin: icicle_state.changeSkin(),
    width_by_size: icicle_state.widthBySize()
  };

  return <Workspace {...childProps} />;
};

export default WorkspaceApiToProps;
