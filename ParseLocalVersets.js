var request = require('sync-request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var mkdirp = require('mkdirp');

var file = "bible.db";
var exists = fs.existsSync(file);


function Chapter(chapterId, bookId, number, title, path, bookShortName)
{
	this.chapterId = chapterId;
	this.bookId = bookId;
	this.bookShortName = bookShortName;
	this.number = number;
	this.title = title;
	this.relativePath = path;
	this.url =  "http://www.biblia-bartolomeu.ro/index-C.php" + this.relativePath;
}

function Verset(chapterId, number, text)
{
	this.chapterId = chapterId;
	this.number = number;
	this.text = text;
}

function Note(chapterId, versetNumber, letter, text)
{
	this.chapterId = chapterId;
	this.versetNumber = versetNumber;
	this.letter = letter;
	this.text = text;
}

var db = new sqlite3.Database(file);

function RetrieveAndInsertNoteInDb(verset, letter, noteRelativeUrl)
{
	var url = "http://www.biblia-bartolomeu.ro/" + noteRelativeUrl;
	var res = request('GET', url);
	var body;
	try {
		body = res.getBody();
	} catch (err) {
		console.log("Error for URL " + url + " : " + error);
		return;
	}

	var $ = cheerio.load(body);

	var text = $('body>div').html();

	var note = Note(verset.chapterId, verset.number, letter, text);

	// insert the note in the db
	//var db = new sqlite3.cached.Database(file);
	//var stmt = db.prepare("INSERT INTO Notes VALUES (?, ?, ?, ?)");
	//stmt.run(note.chapterId, note.versetNumber, note.letter, note.text);
	//stmt.finalize();
}

function ProcessRows(file, $, rows, currentChapter)
{
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];

		var number;
		var text = '';
		//TODO iterate over the components and check if they are:
		// - text OR
		// - note (a link)
		// BUILD THE TEXT

			// inside the loop 
			// TODO retrieve and insert the notes (if any) for each verset
			var currentVerset = new Verset(currentChapter.chapterId, number, text);
			var letter;
			var noteRelativeUrl;
			RetrieveAndInsertNoteInDb(currentVerset, letter, noteRelativeUrl);

		// after the loop
		// TODO retrieve and insert the links (if any) for each verset

		//var db = new sqlite3.cached.Database(file);
		//var stmt = db.prepare("INSERT INTO Versets VALUES (?, ?, ?)");
		//stmt.run(currentVerset.chapterId, currentVerset.number, currentVerset.text);
		//stmt.finalize();
	}
}


db.serialize(function() {
	db.each("SELECT C.rowid, C.book_id, C.number, C.title, C.path, B.s_name FROM Chapters AS C INNER JOIN Books AS B ON C.book_id = B.rowid", function(err, row) {
		var currentChapter = new Chapter(row.rowid, row.book_id, row.number, row.title, row.path, row.s_name);

		var debugIds = [1];
		if (debugIds.indexOf(currentChapter.bookId) === -1)
		{
			return;
		}

		var dirName = currentChapter.bookId + "-" + currentChapter.bookShortName;
		var fileName = currentChapter.number + ".html";

		console.log(dirName + " " + 
			currentChapter.number + " " + 
			fileName + " " + 
			currentChapter.relativePath + " " + 
			currentChapter.url);

		var $;
		$ = cheerio.load(fs.readFileSync('.\\descarcate\\' + dirName + "\\ " + fileName));

		//var title = $('body>div');

		var rows = $('body>table>tr');
		ProcessRows(file, $, rows, currentChapter);
	})
});
	
db.close();
