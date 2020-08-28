const buildTooltip = chartStruct => {
  const cold = chartStruct.columnsData

  const selectionName = chartStruct.columnsData.selection.name

  let res = `datum['${selectionName}'] > 0
    ?  merge(createObject(datum.PivotedAnasenColumns , format(datum['PivotedAnasenValues'],'')),
             createObject(datum.PivotedAnasenColumns+' Selection' , format(datum['PivotedAnasenValues_Selection'],''))     )
    : createObject(datum.PivotedAnasenColumns , format(datum['PivotedAnasenValues'],'') ) `

  res = cold.Bycolumns.reduce((acc, cur) => {
    return `merge({ '${cur.name}' : datum['${cur.name}']} ,` + acc + ')'
  }, res)

  res = cold.BycolumnsHORIZONTAL.reduce((acc, cur) => {
    return `merge({ '${cur.name}' : datum['${cur.name}']} ,` + acc + ')'
  }, res)
  return res
}

export default buildTooltip