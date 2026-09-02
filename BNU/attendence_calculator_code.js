// Get all student rows from Google Sheets
const rows = $input.all();

const results = [];

for (const item of rows) {
  const data = item.json;

  // Basic student information
  const studentId = data["Student ID"];
  const studentName = data["Student Name"];
  const studentEmail = data["Student Email"];
  const program = data["Program"];

  // Find ALL attendance columns
  // Everything except the 4 student-information columns
  // is treated as an attendance record.
  const attendanceColumns = Object.keys(data).filter(key => {
    return ![
      "Student ID",
      "Student Name",
      "Student Email",
      "Program"
    ].includes(key);
  });

  let totalClasses = 0;
  let presentClasses = 0;

  // Count EVERY attendance record available in the sheet
  for (const column of attendanceColumns) {

    const attendance = String(data[column] ?? "")
      .trim()
      .toLowerCase();

    // Only count cells containing Present or Absent
    if (attendance === "present" || attendance === "absent") {
      totalClasses++;

      if (attendance === "present") {
        presentClasses++;
      }
    }
  }

  // Calculate attendance percentage
  const attendancePercentage =
    totalClasses > 0
      ? (presentClasses / totalClasses) * 100
      : 0;

  // Round to 2 decimal places
  const roundedPercentage =
    Math.round(attendancePercentage * 100) / 100;

  results.push({
    json: {
      studentId,
      studentName,
      studentEmail,
      program,

      totalClasses,
      presentClasses,

      attendancePercentage: roundedPercentage,

      // TRUE if attendance is below 50%
      below50: roundedPercentage < 50
    }
  });
}

return results;
