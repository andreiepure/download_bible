var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

var file = "bible.db";
var exists = fs.existsSync(file);

if(!exists) {
	console.log("DB File does not exist, exiting...");
	return;
}

var db = new sqlite3.Database(file);

db.serialize(function() {

	db.each("SELECT rowid AS id, shortName, longName FROM Testaments", function(err, row) {
		if (row)
			console.log(row.id + ": " + row.shortName + ": " + row.longName);
	});

	db.each("SELECT rowid AS id, testamentId, shortName, longName FROM Books WHERE testamentId = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.id + ": " + row.testamentId + ": " + row.shortName + ": " + row.longName);
	});

	db.each("SELECT rowid AS id, bookId, number, title FROM Chapters WHERE bookId = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.id + ": " + row.bookId + ": " + row.number + ": " + row.title);
	});

	db.each("SELECT rowid AS id, chapterId, number, text FROM Versets WHERE chapterId = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.id + ": " + row.chapterId + ": " + row.number + ": " + row.text);
	});

	db.each("SELECT rowid AS id, versetId, letter, text FROM Notes WHERE versetId = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.id + ": " + row.versetId + ": " + row.letter + ": " + row.text);
	});

	db.each("SELECT rowid AS id, sourceVersetId, targetChapterId, targetVersetNumberStart, targetVersetNumberEnd FROM Links LIMIT 5", function(err, row) {
		if (row)
		console.log(row.id + ": " + row.sourceVersetId + ": " + row.targetChapterId + ": " + row.targetVersetNumberStart  + ": " + row.targetVersetNumberEnd);
	});

	db.each("SELECT  rowid AS id, chapterId, number, text FROM Versets WHERE chapterId = 2 AND number >= 5 AND number <=8 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.id + ": " + row.chapterId + ": " + row.number + ": " + row.text);
	});


});

db.close();
