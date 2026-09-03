function onFormSubmit(e) {
  var row = e.range.getRow();
  var values = e.values; // order matches your form's question order

  // Adjust these indexes to match your actual form columns
  var payload = {
    row: row,
    timestamp: values[0],
    studentEmail: values[1],
    studentName: values[2],
    assignmentTitle: values[3],
    assignmentFile: values[4]
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch("https://saad3.app.n8n.cloud/webhook-test/grade-assignment", options);
}
