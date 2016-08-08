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

// An addnotation (explanatory note) for a certain verset. The HTML is kept
// as original (it will have external links to the Dervent Monastery website)
function Note(chapterId, versetNumber, letter, text)
{
	this.chapterId = chapterId;
	this.versetNumber = versetNumber;
	this.letter = letter;
	this.text = text;
}

// A link to one or more versets in the Scripture - usually versets have multiple,
// especially in the New Testament.
// In the DB, the start and end verset ids are kept in order to keep the DB normalized
function Link(chapterId, versetNumber, targetBookShortName, targetChapter, startVerset, endVerset)
{
	//this.versetId = versetId;
	this.chapterId = chapterId;
	this.versetNumber = versetNumber;

	this.targetBookShortName = targetBookShortName;
	this.targetChapter = targetChapter;
	this.targetStartVerset = startVerset;
	this.targetEndVerset = (endVerset === undefined) ? startVerset : endVerset;
}


function RetrieveNote(noteRelativeUrl)
{
	var retry = 5;
	do {
		try {
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
		catch (error) {
			retry--;
			console.log('Error for URL ' + url + ' : ' + error + ' will retry ' + retry);
		}
	} while (retry > 0);
}

/*
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
*/
function ProcessRows(file, $, rows, chapterId)
{
	var db = new sqlite3.cached.Database(file);
	var versetNotes = [];
	var versetLinks = [];
	var versets = [];

	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];

		// needed to insert
		var versetNumber = $(row.children[0].children[1]).text();
		var versetText;

		// needed to construct
		var content = row.children[1];
		var versetTextTokens = [];

		content.children.forEach(function(childElement) {
			if (childElement.name === undefined ||
				childElement.name === 'br' ||
				childElement.name === 'p' ||
				childElement.name === 'b' ||
				childElement.name === 'i' ||
				(childElement.name == 'div' && childElement.attribs !== undefined && childElement.attribs.align !== 'right')
				) {
				// Estera
				var text;
				if (childElement.name == 'div' && childElement.attribs !== undefined && childElement.attribs.align !== 'right') {
					text = $(childElement).html();
				}
				else {
					text = $(childElement).text().trim();
				}
				versetTextTokens.push(text);
			}
			else {
				if (childElement.name === 'sup') {
					var href = childElement.children[0].attribs.href
					var noteLetter = $(childElement).text()
					var text = RetrieveNote(href);
					var note = new Note(chapterId, versetNumber, noteLetter, text);
					versetNotes.push(note);
				}
				else if (childElement.name === 'div' && childElement.attribs !== undefined && childElement.attribs.align === 'right') {
					childElement.children.forEach(function(versetLink) {
						var linkContent = $(versetLink).text();
						if (linkContent !== undefined) {
							var pieces = linkContent.split(' ');
							if (pieces.length == 2) {
								var bookAndVersets = pieces[1].split(':');
								if (bookAndVersets.length == 2) {
									var versets = bookAndVersets[1].split('-');
									var bookShortName = pieces[0];
									var chapter = bookAndVersets[0];
									var firstVerset = versets[0];
									var lastVerset = versets[1];
									var link = new Link(chapterId, versetNumber, bookShortName, chapter, firstVerset, lastVerset);
									versetLinks.push(link);
								}
								else {
									console.log("chapter id " + chapterId + " bookAndVersets does not have 2... " + linkContent);
								}
							}
						}
					});
				}
				else {
					console.log("Unrecognized childElement name in chapter row: " + childElement.name);
				}
			}
		});

		versetText = versetTextTokens.join(' ');
		var verset = new Verset(chapterId, versetNumber, versetText);
		versets.push(verset);

	}

	var stmt = db.prepare("INSERT INTO Versets VALUES (?, ?, ?)");
	versets.forEach(function(verset) {
		stmt.run(verset.chapterId, verset.number, verset.text);
	});
	stmt.finalize();

	var noteStatement = db.prepare("INSERT INTO TemporaryNotes VALUES (?, ?, ?, ?)");
	versetNotes.forEach(function(note) {
			noteStatement.run(note.chapterId, note.versetNumber, note.letter, decodeURIComponent(note.text));
	});
	noteStatement.finalize();

	var linkStatement = db.prepare("INSERT INTO TemporaryLinks VALUES (?, ?, ?, ?, ?, ?)");
	versetLinks.forEach(function(link) {
		linkStatement.run(link.chapterId, link.versetNumber, link.targetBookShortName, link.targetChapter, link.targetStartVerset, link.targetEndVerset);
	});
	linkStatement.finalize();

	console.log("Inserted for "+chapterId);
}

var request = require('sync-request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var mkdirp = require('mkdirp');

var file = "bible.db";
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

db.serialize(function() {
	db.each("SELECT C.rowid, C.book_id, C.number, C.title, C.path, B.s_name FROM Chapters AS C INNER JOIN Books AS B ON C.book_id = B.rowid", function(err, row) {
		var currentChapter = new Chapter(row.rowid, row.book_id, row.number, row.title, row.path, row.s_name);

		/*
		var debugIds = [2];
		if (debugIds.indexOf(currentChapter.chapterId) === -1)
		{
			return;
		}*/

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

