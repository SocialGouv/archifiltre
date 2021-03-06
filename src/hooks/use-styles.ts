import createStyles from "@material-ui/core/styles/createStyles";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { Theme } from "@material-ui/core/styles/createMuiTheme";

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    body2Box: {
      fontSize: "0.625rem",
    },
    searchInput: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      borderRadius: 5,
      border: `1px solid ${theme.palette.secondary.main}`,
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(2),
      top: theme.spacing(1.5),
      color: theme.palette.grey[500],
    },
    dialogContent: {
      padding: theme.spacing(2),
    },
    allTagsDialogContent: {
      padding: 0,
    },
    headerButton: {
      height: "45px",
      width: "45px",
      minWidth: 0,
    },
    largeIndicatorText: {
      fontSize: "3rem",
      fontFamily: "QuicksandBold",
    },
    editableField: {
      fontSize: "0.625rem",
      fontFamily: "Quicksand",
    },
  })
);
