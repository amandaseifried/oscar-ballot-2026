// ===== OSCAR BALLOT 2026 - GOOGLE APPS SCRIPT =====
// 1. Go to Google Sheets and create a new spreadsheet
// 2. Name it "Oscar Ballot 2026"
// 3. Click Extensions > Apps Script
// 4. Delete any code and paste THIS ENTIRE FILE
// 5. Click Deploy > New deployment
// 6. Select type: "Web app"
// 7. Set "Execute as": Me
// 8. Set "Who has access": Anyone
// 9. Click Deploy and authorize when prompted
// 10. Copy the Web App URL and paste it into index.html and results.html
// ================================

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function doGet(e) {
  try {
    var action = e.parameter.action || 'getAll';

    if (action === 'submit') {
      var submitData = JSON.parse(e.parameter.data);
      return submitBallot(submitData);
    } else if (action === 'setWinners') {
      var winnersInput = JSON.parse(e.parameter.data);
      return setWinners(winnersInput);
    } else if (action === 'deleteParticipant') {
      var deleteData = JSON.parse(e.parameter.data);
      return deleteParticipant(deleteData);
    }

    // Default: return all participants and winners
    var sheet = getOrCreateSheet('Ballots', ['Name', 'FilmsSeen', 'Picks', 'Timestamp']);
    var data = sheet.getDataRange().getValues();

    var participants = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        participants.push({
          name: data[i][0],
          filmsSeen: JSON.parse(data[i][1] || '[]'),
          picks: JSON.parse(data[i][2] || '{}'),
          timestamp: data[i][3]
        });
      }
    }

    var winnersSheet = getOrCreateSheet('Winners', ['Category', 'Winner']);
    var winnersData = winnersSheet.getDataRange().getValues();
    var winners = {};
    for (var j = 1; j < winnersData.length; j++) {
      if (winnersData[j][0] !== '' && winnersData[j][1] !== '') {
        winners[winnersData[j][0]] = winnersData[j][1];
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ participants: participants, winners: winners }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitBallot(data) {
  var sheet = getOrCreateSheet('Ballots', ['Name', 'FilmsSeen', 'Picks', 'Timestamp']);
  var name = data.name;
  var filmsSeen = data.filmsSeen || [];
  var picks = data.picks || {};

  var allData = sheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0] === name) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[
        name,
        JSON.stringify(filmsSeen),
        JSON.stringify(picks),
        new Date().toISOString()
      ]]);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([
      name,
      JSON.stringify(filmsSeen),
      JSON.stringify(picks),
      new Date().toISOString()
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setWinners(data) {
  var sheet = getOrCreateSheet('Winners', ['Category', 'Winner']);
  sheet.clear();
  sheet.appendRow(['Category', 'Winner']);

  var entries = Object.entries(data.winners);
  for (var i = 0; i < entries.length; i++) {
    sheet.appendRow([entries[i][0], entries[i][1]]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteParticipant(data) {
  var sheet = getOrCreateSheet('Ballots', ['Name', 'FilmsSeen', 'Picks', 'Timestamp']);
  var allData = sheet.getDataRange().getValues();

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.name) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
