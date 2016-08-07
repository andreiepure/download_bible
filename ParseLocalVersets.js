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

// IMPORTANT
// for Note and Link, the versetId is not present at parse time.
// we insert the notes and links once with each verset, thus it is
// not necessary to keep the verset note in the Note and Link object
// at this level. It will be in the consumer application, because
// we do insert the versetId in the database Notes and Versets tables

// An addnotation (explanatory note) for a certain verset. The HTML is kept
// as original (it will have external links to the Dervent Monastery website)
function Note(letter, text)
{
	//this.versetId = versetId;
	this.letter = letter;
	this.text = text;
}

// A link to one or more versets in the Scripture - usually versets have multiple,
// especially in the New Testament.
// In the DB, the start and end verset ids are kept in order to keep the DB normalized
function Link(targetBook, targetChapter, startVerset, endVerset)
{
	//this.versetId = versetId;
	this.targetBook = targetBook;
	this.targetChapter = targetChapter;
	this.targetStartVerset = startVerset;
	this.targetEndVerset = (endVerset === undefined) ? startVerset : endVerset;
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

function GetVersetId(bookShortName, chapterNumber, versetNumber)
{
	var statement =
		"SELECT rowid AS id FROM Books INNER JOIN Chapters ON Books.rowid = Chapters.book_id " +
		"INNER JOIN Versets ON Chapters.rowid = Versets.chap_id " +
		"WHERE Books.s_name = \"" + link.targetBook + "\" AND Chapters.number = "+ link.targetChapter +
		"AND Versets.number = " + versetNumber;

	var versetId;
	var db = new sqlite3.cached.Database(file);
	db.each(selectStatement, function(err, row) {
		versetId = row.id;
	});

	return versetId;
}

function ProcessRows(file, $, rows, chapterId)
{
	var db = new sqlite3.cached.Database(file);
	db.serialize(function() {
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];

			// needed to insert
			var versetNumber = $(row.children[0].children[1]).text();
			var versetText;
			var versetNotes = [];
			var versetLinks = [];

			// needed to construct
			var content = row.children[1];
			var versetTextTokens = [];

			content.children.forEach(function(childElement) {
				if (childElement.name === undefined) {
					versetTextTokens.push($(childElement).text().trim());
				}
				else {
					if (childElement.name === 'sup') {
						var href = childElement.children[0].attribs.href
						var noteLetter = $(childElement).text()
						var text = RetrieveNote(href);
						var note = new Note(noteLetter, text);
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
								var link = new Link(bookShortName, chapter, firstVerset, lastVerset);
								versetLinks.push(link);
							}
						});
					}
					else {
						console.log("Unrecognized childElement name in chapter row: " + childElement.name);
					}
				}
			});

			versetText = versetTextTokens.join(' ');

			// insert the verset

			console.log("Will insert "+chapterId + " " +versetNumber+" "+versetText);

			var stmt = db.prepare("INSERT INTO Versets VALUES (?, ?, ?)");
			stmt.run(chapterId, versetNumber, versetText);
			stmt.finalize();

			debugger;

			// retrieve the verset unique id
		//	var versetId;
	//		var selectStatement = "SELECT rowid AS id FROM Versets WHERE chap_id = " + chapterId + " AND number = " + versetNumber;

			var noteStatement = db.prepare("INSERT INTO TemporaryNotes VALUES (?, ?, ?, ?)");
			debugger;
			versetNotes.forEach(function(note) {
					noteStatement.run(chapterId, versetNumber, note.letter, note.text);
			});
			noteStatement.finalize();

			var linkStatement = db.prepare("INSERT INTO TemporaryLinks VALUES (?, ?, ?, ?, ?, ?)");
			debugger;
			versetLinks.forEach(function(link) {
				// get the start verset id
				//var startVersetId = GetVersetId(link.targetBook, link.targetChapter, link.targetStartVerset);
				//var endVersetId = GetVersetId(link.targetBook, link.targetChapter, link.targetEndVerset);
				linkStatement.run(chapterId, versetNumber, targetBookShortName, targetChapterNumber, startVersetNumber, endVersetNumber);
			});

			linkStatement.finalize();
		}
	});
}


db.serialize(function() {
	db.each("SELECT C.rowid, C.book_id, C.number, C.title, C.path, B.s_name FROM Chapters AS C INNER JOIN Books AS B ON C.book_id = B.rowid", function(err, row) {
		var currentChapter = new Chapter(row.rowid, row.book_id, row.number, row.title, row.path, row.s_name);

		var debugIds = [75];
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
		ProcessRows(file, $, rows, currentChapter.chapterId);
	})
});
	
db.close();
