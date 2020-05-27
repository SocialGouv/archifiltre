import React, { FC, useMemo } from "react";
import { FileType } from "../../../util/file-types/file-types-util";
import { Box } from "@material-ui/core";
import styled from "styled-components";
import Typography from "@material-ui/core/Typography";
import { useTranslation } from "react-i18next";
import InfoBoxPaper from "../common/info-box-paper";
import { FileTypeMap } from "../../../exporters/audit/audit-report-values-computer";
import HorizontalStackedBar, {
  HorizontalStackedBarOption,
  RenderTooltipContent,
} from "../../common/horizontal-stacked-bar";
import { colors } from "../../../util/color/color-util";
import { octet2HumanReadableFormat } from "../../../util/file-system/file-sys-util";
import { TFunction } from "i18next";

const TitleWrapper = styled(Box)`
  padding-top: 10px;
  padding-bottom: 10px;
`;

interface FileTypesDetailsProps {
  elementsCountsByType: FileTypeMap<number>;
  elementsSizesByType: FileTypeMap<number>;
}

const makeBarConfig = (type: FileType): HorizontalStackedBarOption => ({
  key: type,
  color: colors[type],
});

const makeRenderTooltipContent = (
  elementCountsByType: FileTypeMap<number>,
  elementSizesByType: FileTypeMap<number>,
  t: TFunction
): RenderTooltipContent => (key) => (
  <Box>
    <Box>
      <Typography variant="body1">{t(`common.fileTypes.${key}`)}</Typography>
    </Box>
    <Box>
      <Typography variant="body1">
        {elementCountsByType[key]}{" "}
        {t(`common.file`, { count: elementCountsByType[key] })}
      </Typography>
    </Box>
    <Box>
      <Typography variant="body1">
        {octet2HumanReadableFormat(elementSizesByType[key])}
      </Typography>
    </Box>
  </Box>
);

const bars = [
  makeBarConfig(FileType.PUBLICATION),
  makeBarConfig(FileType.PRESENTATION),
  makeBarConfig(FileType.SPREADSHEET),
  makeBarConfig(FileType.EMAIL),
  makeBarConfig(FileType.DOCUMENT),
  makeBarConfig(FileType.IMAGE),
  makeBarConfig(FileType.VIDEO),
  makeBarConfig(FileType.AUDIO),
  makeBarConfig(FileType.OTHER),
];

const FileTypesDetails: FC<FileTypesDetailsProps> = ({
  elementsCountsByType,
  elementsSizesByType,
}) => {
  const { t } = useTranslation();

  const renderTooltipContent = useMemo(
    () =>
      makeRenderTooltipContent(elementsCountsByType, elementsSizesByType, t),
    [elementsCountsByType, elementsSizesByType, t]
  );

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <TitleWrapper>
        <Typography variant="h4">
          {t("audit.fileTypeRepartitionTitle")}
        </Typography>
      </TitleWrapper>
      <Box flexGrow={1}>
        <InfoBoxPaper>
          <Box
            display="flex"
            flexDirection="column"
            height="100%"
            justifyContent="center"
          >
            <Box>
              <HorizontalStackedBar
                data={elementsCountsByType}
                bars={bars}
                renderTooltipContent={renderTooltipContent}
              />
            </Box>
          </Box>
        </InfoBoxPaper>
      </Box>
    </Box>
  );
};

export default FileTypesDetails;