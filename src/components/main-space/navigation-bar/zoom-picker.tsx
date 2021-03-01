import React, { FC, useState } from "react";
import { FaSearchMinus, FaSearchPlus, FaSearch } from "react-icons/fa";
import { useZoomContext } from "../workspace/zoom-provider";
import { useTranslation } from "react-i18next";
import { MenuItem } from "@material-ui/core";
import Box from "@material-ui/core/Box";
import { ZOOM_SPEED } from "../icicle/icicle-main";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import ZoomPickerOptionItem from "./zoom-picker-option-item";
import { round } from "lodash";

const ZoomPicker: FC = () => {
  const { zoomIn, zoomOut, resetZoom, ratio } = useZoomContext();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const withHandleClose = (callback) => (...args) => {
    handleClose();
    callback(...args);
  };

  const onZoomIn = () => zoomIn(null, ZOOM_SPEED);
  const onZoomOut = () => zoomOut(null, ZOOM_SPEED);

  const options = [
    {
      icon: <FaSearchPlus />,
      label: t("workspace.zoomIn"),
      onClick: withHandleClose(onZoomIn),
    },
    {
      icon: <FaSearchMinus />,
      label: t("workspace.zoomOut"),
      onClick: withHandleClose(onZoomOut),
    },
    {
      icon: <FaSearch />,
      label: t("workspace.resetZoom"),
      onClick: withHandleClose(resetZoom),
    },
  ];

  const title = `${t("workspace.currentZoom")} : x${round(ratio, 2)}`;

  return (
    <Box>
      <Button
        variant="outlined"
        disableElevation={true}
        color="secondary"
        size="small"
        onClick={handleClick}
        startIcon={<FaSearchPlus />}
      >
        {title}
      </Button>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map(({ icon, label, onClick }) => (
          <MenuItem key={`displayed-${label}`} onClick={onClick}>
            <ZoomPickerOptionItem icon={icon} label={label} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ZoomPicker;
