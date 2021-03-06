import { MessageTypes } from "util/batch-process/batch-process-util-types";
import { AsyncWorker } from "util/async-worker/async-worker-util";
import { computeTreeStructureArray } from "util/tree-representation/tree-representation";
import { tap, toArray } from "rxjs/operators";
import { CsvExporterData } from "exporters/csv/csv-exporter.impl";
import { exportToCsv } from "util/array-export/array-export";
import translations from "translations/translations";
import { utils, write } from "xlsx";
import { TFunction } from "i18next";
import { flatten } from "lodash";

const TREE_CSV_PROGRESS_WEIGHT = 1;
const CSV_EXPORT_PROGRESS_WEIGHT = 10;

export const getExcelExportProgressGoal = (filesAndFoldersCount: number) =>
  (TREE_CSV_PROGRESS_WEIGHT + CSV_EXPORT_PROGRESS_WEIGHT) *
  filesAndFoldersCount;

export type CreateExcelWorkbookParams = {
  treeCsv: string[][];
  csvArray: string[][];
};
const createExcelWorkbook = ({ treeCsv, csvArray }, translator: TFunction) => {
  const workbook = utils.book_new();
  const csvWorkSheet = utils.aoa_to_sheet(csvArray);
  const treeCsvWorkSheet = utils.aoa_to_sheet(treeCsv);
  utils.book_append_sheet(
    workbook,
    csvWorkSheet,
    translator("export.treeStats")
  );
  utils.book_append_sheet(
    workbook,
    treeCsvWorkSheet,
    translator("export.treeVisualizing")
  );
  return workbook;
};
export type ExportToExcelParams = CsvExporterData;

export const exportToExcel = async (
  worker: AsyncWorker,
  params: ExportToExcelParams
) => {
  const translator = translations.t.bind(translations);
  const treeCsv = await computeTreeStructureArray(params.filesAndFolders)
    .pipe(
      tap((lines) => {
        worker.postMessage({
          type: MessageTypes.RESULT,
          result: TREE_CSV_PROGRESS_WEIGHT * lines.length,
        });
      }),
      toArray()
    )
    .toPromise()
    .then(flatten);

  const csvArray = await exportToCsv({
    ...params,
    translator,
  })
    .pipe(
      tap((lines) => {
        worker.postMessage({
          type: MessageTypes.RESULT,
          result: CSV_EXPORT_PROGRESS_WEIGHT * lines.length,
        });
      }),
      toArray()
    )
    .toPromise()
    .then(flatten);

  const xlsxWorkbook = createExcelWorkbook({ treeCsv, csvArray }, translator);

  const binaryXlsx = write(xlsxWorkbook, {
    type: "binary",
  });

  worker.postMessage({
    type: MessageTypes.RESULT,
    result: binaryXlsx,
  });
  worker.postMessage({
    type: MessageTypes.COMPLETE,
  });
};
