//import * as R from "ramda";

import {
  applyChanges,
  runVega
} from "./selection";

import vegaSpec from "./pivotTable";
const vegaEmbed = window.vegaEmbed;
const vega = window.vega;

const createObject = (x, y) => {
  return { [x]: y }
}
vega.expressionFunction('createObject', createObject)

let vegaView;

const chartStruct = {
  columnsData: {
    Bycolumns: [
      { name: "Ship Mode", count: 2, type: "CATEGORICAL" },
      { name: "Speed", count: 4, type: "CATEGORICAL" }
    ],
    Qcolumn: [
      {
        name: "sum(sales)",
        domain: [0, 339135.17],
        type: "QUANTITATIVE"
      }
    ],
    BycolumnsHORIZONTAL: [
      { name: "Gender", count: 3, type: "CATEGORICAL" },
      { name: "Size", count: 6, type: "CATEGORICAL" }
    ],
    selection: { name: "s", type: "SELECTION" },
    idx: { name: "l", type: "LINE" }
  },
  OrderInfo: {
    Length: 2,
    Count: [2, 6],
    Order: ["Ship Mode", "Speed"]
  },
  OrderInfoHOR: {
    Length: 2,
    Count: [3, 7],
    Order: ["Gender", "Size"]
  }
};

const handlePan = (_signal, signalValue) => {
  if (signalValue) {
    const {
      xcur,
      catRangeNormalized,
      catRangeNormalizedHORIZONTAL,
      deltaX,
      width,
      ycur,
      deltaY,
      height,
      tableWidth,
      tableHeight
    } = signalValue;

    const newCatRange =
      xcur[1] + deltaX[1] < tableWidth && xcur[1] + deltaX[1] > width
        ? [(xcur[0] + deltaX[0]) / width, (xcur[1] + deltaX[1]) / width]
        : catRangeNormalized;

    const newQdom =
      ycur[1] + deltaY[1] < tableHeight && ycur[1] + deltaY[1] > height
        ? [(ycur[0] + deltaY[0]) / height, (ycur[1] + deltaY[1]) / height]
        : catRangeNormalizedHORIZONTAL;

    if (
      Number.isFinite(newCatRange[0]) &&
      Number.isFinite(newCatRange[1]) &&
      Number.isFinite(newQdom[0]) &&
      Number.isFinite(newQdom[1])
    ) {
      const currentData = vegaView.data("userData")[0];
      const columnsData = currentData.columnsData;
      const datumTuplesToModify = [];

      datumTuplesToModify.push({
        datum: currentData,
        field: "columnsData",
        value: {
          ...columnsData,
          Bycolumns: [
            {
              ...columnsData.Bycolumns[0],
              rangeZoom: newCatRange,
              zoomed: true
            }
          ],
          Qcolumn: [
            { ...columnsData.Qcolumn[0], domainZoom: newQdom, zoomed: true }
          ],
          operation: "panning"
        }
      });

      applyChanges(vegaView, "userData", { datumTuplesToModify });
      runVega(vegaView, "userData");
    }
  }
};

const _createSelectDataMarkChanges = (
  vegaView,
  columnsData,
  values,
  keepSelection = false,
  removeFromSelection = false
) => {
  const datumTuplesToModify = [];
  const currentData = vegaView.data("table");
  const selectionColName = columnsData.selection.name;
  const quantitativeColName =
    "PivotedAnasenValues"; /* columnsData.Qcolumn.name */
  const quantitativeSelectionColName =
    "PivotedAnasenValues_Selection"; /* columnsData.QSelectedColumn.name */
  const datumIdxColName = columnsData.idx.name;

  console.log("values", values);

  currentData.forEach((datum) => {
    const isIntendedForSelection = values.some(
      (value) => value[datumIdxColName] === datum[datumIdxColName]
    );
    // Case 1: keep current selection and remove from selection bars in the brush
    if (
      values.length > 0 &&
      keepSelection && // shift key pressed keep current selection
      datum[selectionColName] > 0 &&
      removeFromSelection && // altKey pressed => remove
      isIntendedForSelection
    ) {
      datumTuplesToModify.push({
        datum,
        field: selectionColName,
        value: 0
      });
    }
    // Case 2: select bars
    if (!removeFromSelection && isIntendedForSelection) {
      datumTuplesToModify.push({
        datum,
        field: selectionColName,
        value: 1
      });
      // Set selected amount to amount
      datumTuplesToModify.push({
        datum,
        field: quantitativeSelectionColName,
        value: datum[quantitativeColName]
      });
    }
    // Case 3: TODO Describe.
    if (
      !keepSelection &&
      datum[selectionColName] > 0 &&
      !isIntendedForSelection
    ) {
      // -- No shift, all other datamarks are unselected
      datumTuplesToModify.push({
        datum,
        field: selectionColName,
        value: 0
      });
    }
    // Default case
  });
  return { datumTuplesToModify };
};

const handleResetSelectionClick = (_signal, signalValue) => {
  if (!signalValue.value) return;

  try {
    if (signalValue.selectionIsOn) {
      const currentData = vegaView.data("table");
      const selection = vegaView.data("chartStruct")[0].columnsData.selection
        .name;
      const datumTuplesToModify = [];
      currentData.forEach((datum) => {
        if (datum[selection] > 0) {
          datumTuplesToModify.push({
            datum,
            field: selection,
            value: 0
          });
        }
      });
      applyChanges(vegaView, "table", { datumTuplesToModify });
      runVega(vegaView, "table");
      
      // vegaView.runAsync()
      // console.log("reset signalValue", signalValue);
      // console.log('reset values', createUnselectAllDatamarksChangesNEW(
      //   vegaView,
      //   signalValue.chartStructure.columnsData,
      //   "table"
      // ))
      // applyChanges(
      //   vegaView,
      //   "table",
      //   createUnselectAllDatamarksChangesNEW(
      //     vegaView,
      //     signalValue.chartStructure.columnsData,
      //     "table"
      //   )
      // );
      // runVega(vegaView, "table");
      // Call the API.
      //getResetSelectionOpToAPI()
    }
  } catch (e) {
    console.error(e);
  }
};

const handleMarkSelectionClick = (_signal, signalValue) => {
  try {
    console.log("markSelection signalValue", signalValue);
    applyChanges(
      vegaView,
      "table",
      _createSelectDataMarkChanges(
        vegaView,
        signalValue.chartStructure.columnsData,
        [signalValue.value],
        signalValue.shiftKey,
        signalValue.altKey
      )
    );
    runVega(vegaView, "table");
    vegaView.runAsync();

    // Call the API.
    // getSimpleSelectionOpForApi({
    //   datum: signalValue.value,
    //   isResetting: !signalValue.shiftKey,
    //   isRemoving: signalValue.shiftKey && signalValue.altKey,
    //   type: 'formula',
    // })
  } catch (e) {
    console.error(e);
  }
};

const _getRectBrushSelectionOpsForApi = ({
  vegaView,
  signalValue,
  xExclusive = false,
  yExclusive = false
}) => {
  const brush = signalValue.brush;

  if (brush.state === "stop") {
    const chartStructure = signalValue.chartStructure;
    const columnsData = chartStructure.columnsData;
    const columnsOrder = chartStructure.OrderInfo.Order;
    const columnsOrderHorz = chartStructure.OrderInfoHOR.Order;
    const xSegmentInDomain = brush.segmentInDomain.x;
    const ySegmentInDomain = brush.segmentInDomain.y;

    const currentData = vegaView.data("table");
    let categoryBrushList = xSegmentInDomain;
    let categoryBrushListHorz = ySegmentInDomain;

    let categoryExclusiveFlag = xExclusive;
    let quantitativeExclusiveFlag = yExclusive;

    // Get the name and position of byColumns in domain in order to compare them with datum.
    const nameNIdxOfByColumnTuples = columnsData.Bycolumns.reduce(
      (acc, byColumn) => {
        acc.push({
          name: byColumn.name,
          orderIdx: columnsOrder.indexOf(byColumn.name)
        });
        return acc;
      },
      []
    );

    const nameNIdxOfByColumnTuplesHorz = columnsData.BycolumnsHORIZONTAL.reduce(
      (acc, byColumn) => {
        acc.push({
          name: byColumn.name,
          orderIdx: columnsOrderHorz.indexOf(byColumn.name)
        });
        return acc;
      },
      []
    );

    // Get the name and position of pivoted in domain in order to compare them with datum
    const nameNIdxOfQColumnTuples = [
      {
        name: "PivotedAnasenColumns",
        orderIdx: columnsOrder.indexOf("PivotedAnasenColumns")
      }
    ];

    const intervals = {
      x: xSegmentInDomain,
      y: ySegmentInDomain
    };
    const indexes = currentData.filter((datum) => {
      return (
        (categoryExclusiveFlag ||
          categoryBrushListHorz.some((categoryTuple) =>
            nameNIdxOfByColumnTuplesHorz.every((tuple) => {
              return datum[tuple.name] === categoryTuple[tuple.orderIdx];
            })
          )) &&
        (quantitativeExclusiveFlag ||
          categoryBrushList.some((categoryTuple) =>
            nameNIdxOfByColumnTuples.every((tuple) => {
              return datum[tuple.name] === categoryTuple[tuple.orderIdx];
            })
          ))
      );
    });

    // getRectBrushSelectionOpsForApi({
    //   quantitativeExclusiveFlag,
    //   categoryExclusiveFlag,
    //   columnsData,
    //   indexes,
    //   intervals,
    //   quantitativeBrushSegmentInDomain,
    //   categoryBrushList,
    //   nameNIdxOfByColumnTuples,
    //   brush,
    // })

    return _createSelectDataMarkChanges(
      vegaView,
      columnsData,
      indexes,
      brush.domEvent.shiftKey,
      brush.domEvent.altKey
    );
  }
};

const handleRectangleSelectionBrush = (_signal, signalValue) => {
  try {
    applyChanges(
      vegaView,
      "table",
      _getRectBrushSelectionOpsForApi({ vegaView, signalValue })
    );
    runVega(vegaView, "table");
  } catch (e) {
    console.error(e);
  }
};

const handleXSliceSelectionBrush = (_signal, signalValue) => {
  try {
    applyChanges(
      vegaView,
      "table",
      _getRectBrushSelectionOpsForApi({
        vegaView,
        signalValue,
        xExclusive: true
      })
    );
    runVega(vegaView, "table");
  } catch (e) {
    console.error(e);
  }
};

const handleYSliceSelectionBrush = (_signal, signalValue) => {
  try {
    applyChanges(
      vegaView,
      "table",
      _getRectBrushSelectionOpsForApi({
        vegaView,
        signalValue,
        yExclusive: true
      })
    );
    runVega(vegaView, "table");
  } catch (e) {
    console.error(e);
  }
};

document.getElementById("app").innerHTML = `<div id="vega-container"></div>`;

vegaEmbed("#vega-container", vegaSpec(250, 320, chartStruct), {
  mode: "vega"
})
  .then((result) => {
    // add bar selection handler
    // see: https://vega.github.io/vega/docs/api/view/

    vegaView = result.view;

    result.view.addSignalListener("panObj", handlePan);
    result.view.addSignalListener(
      "resetSelectionOnClick",
      handleResetSelectionClick
    );
    result.view.addSignalListener("OnClickDataMark", handleMarkSelectionClick);
    result.view.addSignalListener(
      "rectBrushForSelection",
      handleRectangleSelectionBrush
    );
    result.view.addSignalListener(
      "sliceXBrushForSelection",
      handleXSliceSelectionBrush
    );
    result.view.addSignalListener(
      "sliceYBrushForSelection",
      handleYSliceSelectionBrush
    );
  })
  .catch((error) => {
    console.error("vega:error", error);
  });
