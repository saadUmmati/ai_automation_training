const CONFIG_SHEET_ID = "your_sheet_id";
const ROSTER_SHEET_ID = "your_sheet_id";
const SECRET_TOKEN = "1234"; // Simple auth

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


//updated
function doPost(e) {
    try {
    const data = JSON.parse(e.postData.contents);
    
    // TEMPORARY DEBUG LOG
    console.log("Received payload:", JSON.stringify(data));
    
    if (data.secret !== SECRET_TOKEN) {
      return jsonResponse({error: "Unauthorized"});
    }
   
    switch(data.action) {
      case "getRoster": return getRoster();
      case "createForm": return createForm(data.quizJson, data.courseName);
      case "sendEmails": return sendEmails(data.emails, data.subject, data.body);
      case "checkResponses": return checkResponses(data.responseSheetId); // FIXED
      case "sendReminders": return sendReminders(data.roster, data.formUrl, data.formId);
      case "createPacket": return createPacket(data.content, data.title);
      case "sendPacket": return sendPacket(data.roster, data.docUrl, data.subject, data.body);
      case "sendSummary": return sendSummary(data.profEmail, data.summary);
      default: return jsonResponse({error: "Unknown action: " + data.action});
    }
  } catch (err) {
    return jsonResponse({error: err.toString(), stack: err.stack});
  }
}

// ========== 1. GET ROSTER (FIXED) ==========
function getRoster() {
  const ss = SpreadsheetApp.openById(ROSTER_SHEET_ID);
  
  // FIX #1: Target the exact sheet by name, not by index
  const rosterSheet = ss.getSheetByName("Class-Rooster");
  if (!rosterSheet) {
    return jsonResponse({error: 'Sheet "Class-Rooster" not found in spreadsheet'});
  }
  
  const rows = rosterSheet.getDataRange().getValues().slice(1); // skip header
  
  // FIX #2: Deduplicate by email since your sheet has multiple rows per student
  const seen = new Set();
  const roster = [];
  
  rows.forEach(r => {
    const name = r[2] ? r[2].toString().trim() : "";
    const email = r[3] ? r[3].toString().trim().toLowerCase() : "";
    
    if (email && !seen.has(email)) {
      seen.add(email);
      roster.push({ name, email });
    }
  });
  
  return jsonResponse({roster});
}



// 2. CREATE GOOGLE FORM
function createForm(quizJson, courseName) {
  const form = FormApp.create(courseName + " — Prerequisite Diagnostic");
  form.setDescription("Auto-generated diagnostic. Complete before Lecture 1.");
  form.setConfirmationMessage("Thank you. Your responses have been recorded.");
  
  quizJson.forEach(q => {
    const item = form.addMultipleChoiceItem();
    item.setTitle(q.title);
    item.setChoiceValues(q.choices);
    // Note: Apps Script cannot set "correct answers" for auto-grading in the same way as Forms API quizzes
    // Workaround: Store answer key in form description or a parallel sheet for analysis
  });
  
  // Link responses to a new sheet
  const sheet = SpreadsheetApp.create(form.getTitle() + " — Responses");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  
  return jsonResponse({
    formId: form.getId(),
    formUrl: form.getPublishedUrl(),
    responseSheetId: sheet.getId()
  });
}

// 3. SEND EMAILS (Distribution + Reminders)
function sendEmails(emails, subject, body) {
  emails.forEach(email => {
    GmailApp.sendEmail(email, subject, body);
  });
  return jsonResponse({sent: emails.length});
}

// 4. CHECK RESPONSES WITH ERROR HANDLING
function checkResponses(responseSheetId) {
  // GUARD: Validate the ID
  if (!responseSheetId || typeof responseSheetId !== 'string') {
    return jsonResponse({
      error: "Invalid or missing responseSheetId",
      received: responseSheetId
    });
  }
  
  try {
    const sheet = SpreadsheetApp.openById(responseSheetId).getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const responses = rows.slice(1);
    
    return jsonResponse({
      totalResponses: responses.length,
      headers: headers,
      data: responses
    });
  } catch (err) {
    return jsonResponse({
      error: "Failed to open response sheet",
      sheetId: responseSheetId,
      details: err.message
    });
  }
}







// 5. SEND REMINDERS TO NON-RESPONDERS
function sendReminders(roster, formUrl, formId) {
  const form = FormApp.openById(formId);
  const responseSheet = SpreadsheetApp.openById(form.getDestinationId());
  const respondedEmails = responseSheet.getSheets()[0].getDataRange().getValues()
    .slice(1).map(r => r[1].toString().trim().toLowerCase()); // Assuming email is column 2
  
  const nonResponders = roster.filter(r => !respondedEmails.includes(r.email.toLowerCase()));
  
  nonResponders.forEach(r => {
    GmailApp.sendEmail(r.email, "Reminder: Complete Your Prerequisite Diagnostic", 
      `Hi ${r.name},\n\nPlease complete the diagnostic before class: ${formUrl}`);
  });
  
  return jsonResponse({remindersSent: nonResponders.length});
}

// ========== 6. CREATE PACKET (FIXED) ==========
function createPacket(content, title) {
  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
  
  // Format content line by line
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    if (trimmed.startsWith('## ')) {
      body.appendParagraph(trimmed.replace('## ', ''))
           .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    } 
    else if (trimmed.startsWith('### ')) {
      body.appendParagraph(trimmed.replace('### ', ''))
           .setHeading(DocumentApp.ParagraphHeading.HEADING3);
    }
    else if (trimmed.startsWith('**') && trimmed.includes(':**')) {
      const p = body.appendParagraph(trimmed.replace(/\*\*/g, ''));
      p.editAsText().setBold(0, p.getText().indexOf(':'), true);
    }
    else {
      body.appendParagraph(trimmed);
    }
  });
  
  // FIX: Safely set sharing using DriveApp (more reliable than DocumentApp.Access)
  try {
    var file = DriveApp.getFileById(doc.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // If sharing fails, log it but don't crash — the doc is still created
    console.log("Sharing warning: " + e.message);
  }
  
  return jsonResponse({
    docId: doc.getId(),
    docUrl: doc.getUrl()
  });
}

// 7. SEND PACKET TO STUDENTS
function sendPacket(roster, docUrl, subject, body) {
  // Guard against bad input
  if (!Array.isArray(roster) || roster.length === 0) {
    return jsonResponse({error: "Invalid or empty roster", received: roster});
  }
  
  const fullBody = body + "\n\nAccess your refresher packet here: " + docUrl;
  roster.forEach(r => {
    if (r.email) {
      GmailApp.sendEmail(r.email, subject, fullBody);
    }
  });
  return jsonResponse({sent: roster.length});
}

// 8. SEND EXECUTIVE SUMMARY TO PROFESSOR
function sendSummary(profEmail, summary) {
  GmailApp.sendEmail(profEmail, "Diagnostic Executive Summary", summary);
  return jsonResponse({status: "Summary sent"});
}
