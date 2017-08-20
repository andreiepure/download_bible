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

	db.each("SELECT rowid, s_name, l_name, path FROM Testaments", function(err, row) {
		if (row)
			console.log(row.rowid + ": " + row.s_name + ": " + row.l_name + ": " + row.path);
	});

	db.each("SELECT  rowid, test_id, s_name, l_name, path FROM Books WHERE test_id = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.rowid + ": " + row.test_id + ": " + row.s_name + ": " + row.l_name + ": " + row.path);
	});

	db.each("SELECT  rowid, book_id, number, title, path FROM Chapters WHERE book_id = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.rowid + ": " + row.book_id + ": " + row.number + ": " + row.title + ": " + row.path);
	});

	db.each("SELECT  rowid, chap_id, number, text FROM Versets WHERE chap_id = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.rowid + ": " + row.chap_id + ": " + row.number + ": " + row.text);
	});

	db.each("SELECT  rowid, verset_id, letter, text FROM Notes WHERE verset_id = 1 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.rowid + ": " + row.verset_id + ": " + row.letter + ": " + row.text);
	});

	db.each("SELECT  rowid, source_verset_id, dest_chapter_id, dest_start_verset_number, dest_end_verset_number FROM Links LIMIT 5", function(err, row) {
		if (row)
		console.log(row.rowid + ": " + row.source_verset_id + ": " + row.dest_chapter_id + ": " + row.dest_start_verset_number  + ": " + row.dest_end_verset_number);
	});

	db.each("SELECT  rowid, chap_id, number, text FROM Versets WHERE chap_id = 2 AND number >= 5 AND number <=8 LIMIT 5", function(err, row) {
		if (row)
		console.log(row.rowid + ": " + row.chap_id + ": " + row.number + ": " + row.text);
	});


});

db.close();
