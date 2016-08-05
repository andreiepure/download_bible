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

function Note(versetId, letter, text)
{
	this.versetId = versetId;
	this.letter = letter;
	this.text = text;
}

function Link(versetId, targetBook, targetChapter, startVerset, endVerset)
{
	this.versetId = versetId;
	this.targetBook = targetBook;
	this.targetChapter = targetChapter;
	this.targetStartVerset = startVerset;
	this.targetEndVerset = (endVerset === undefined) ? '-1' : endVerset;
}

var db = new sqlite3.Database(file);

function RetrieveNote(noteRelativeUrl)
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

	return text;
}

function ProcessRows(file, $, rows, currentChapter)
{

	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];

		var versetNumber;
		var versetText;
		var versetNotes = [];
		var versetLinks = [];
		var versetTextTokens = [];

		var versetNumber = $(row.children[0].children[1]).text();
		var content = row.children[1];

		content.children.forEach(function(childElement) {
			if (childElement.name === undefined) {
				versetTextTokens.push($(childElement).text().trim());
			}
			else {
				if (childElement.name === 'sup') {
					var href = childElement.children[0].attribs.href
					var noteLetter = $(childElement).text()
					var text = RetrieveNote(href);
					var note = new Note('-', noteLetter, text);
					versetNotes.push(note);
				}
				else if (childElement.name === 'div') {
					childElement.children.forEach(function(versetLink) {
						var linkContent = $(versetLink).text();
						var pieces = linkContent.split(' ');
						if (pieces.length == 2) {
							var bookAndVersets = pieces[1].split(':');
							var versets = bookAndVersets[1].split('-');
							var bookShortName = pieces[0];
							var chapter = bookAndVersets[0];
							var firstVerset = versets[0];
							var lastVerset = versets[1];
							var link = new Link('-', bookShortName, chapter, firstVerset, lastVerset);
							versetLinks.push(link);
						}
					});
				}
				else {
					console.log("Unrecognized childElement name in chapter row: " + childElement.name);
				}
			}
		});

		var versetText = versetTextTokens.join(' ');
		// TODO insert the verset
		// TODO retrieve the verset unique id
		// TODO add the verset unique id to all versetLinks and to all versetNotes
		// TODO insert the notes
		// TODO insert the links
		// TODO praise God :)

		//var currentVerset = new Verset(currentChapter.chapterId, number, text);

		//var db = new sqlite3.cached.Database(file);
		//var stmt = db.prepare("INSERT INTO Versets VALUES (?, ?, ?)");
		//stmt.run(currentVerset.chapterId, currentVerset.number, currentVerset.text);
		//stmt.finalize();
		/*var db = new sqlite3.cached.Database(file);
		var stmt = db.prepare("INSERT INTO Notes VALUES (?, ?, ?, ?)");
		stmt.run(note.chapterId, note.versetNumber, note.letter, note.text);
		stmt.finalize();*/

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
