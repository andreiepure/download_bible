var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var mkdirp = require('mkdirp');

var file = "bible.db";
var exists = fs.existsSync(file);

function Book(bookId, shortName, longName, relativePath) {
	this.bookId = bookId;
	this.testamentId = relativePath.indexOf("VT") != -1 ? 1 : 2;
	this.shortName = shortName;
	this.longName = longName;
	this.relativePath = relativePath;
	this.url = "http://www.biblia-bartolomeu.ro/index-C.php" + relativePath;
}

function Chapter(bookId, shortName, title, path)
{
	this.bookId = bookId;

	var shortNameArray = shortName.split('.');
	var number = -1;
	if (shortNameArray.length == 2)
	{
		number = shortNameArray[1];
	}

	if (title == null)
	{
		console.log(bookId + ' ' + shortName + ' null title ' + title);
	}

	this.number = number;
	this.title = title;
	this.relativePath = path;
	this.url =  "http://www.biblia-bartolomeu.ro/index-C.php" + this.relativePath;
}


function ProcessRows(file, $, rows, currentBook)
{
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var link = row.children[1].children[0];

		var shortName = $(row.children[0]).text();

		// exceptions with Chapter 0 - Sir and Est
		var firstChapterExceptions = ["Sir", "Est"];
		var isFirstChapterException = (shortName == " - " && firstChapterExceptions.indexOf(currentBook.shortName) !== -1);
		if (isFirstChapterException)
		{
			debugger;
			shortName = "Cap. 0";
		}

		var longName;
		var exceptions = ["Ps", "Cant", "Ir"];
		if (link.children.length == 1 ||
			exceptions.indexOf(currentBook.shortName) != -1 ||
			isFirstChapterException)
		{
			longName = link.children[0].data;
		}
		else if (link.children.length == 3)
		{
			longName = link.children[2].data;
		}
		else if (link.children.length == 5)
		{
			// la psalmi
			longName = link.children[2].data + link.children[4].data;
		}

		var relativePath = link.attribs.href;

		var currentChapter = new Chapter(currentBook.bookId, shortName, longName, relativePath);

		var db = new sqlite3.cached.Database(file);
		var stmt = db.prepare("INSERT INTO Chapters VALUES (?, ?, ?, ?)");
		stmt.run(currentChapter.bookId, currentChapter.number, currentChapter.title, currentChapter.relativePath);
		stmt.finalize();
	}
}

var files = fs.readdirSync('./descarcate/').filter((value)=>value.indexOf('html')!==-1);

var db = new sqlite3.Database(file);

db.serialize(function() {
	db.each("SELECT rowid, test_id, s_name, l_name, path FROM Books", function(err, row) {
		var currentBook = new Book(row.rowid, row.s_name, row.l_name, row.path);

		var debugIds = [17];
		if (debugIds.indexOf(currentBook.bookId) !== -1)
		{
			return;
		}


		console.log("Current book " +
			currentBook.bookId + " " + 
			currentBook.testamentId +" "+
			currentBook.shortName +" "+
			currentBook.longName +" "+
			currentBook.relativePath + " " + currentBook.url);

		var fileName = currentBook.bookId + "-" + currentBook.shortName + ".html";
		var $;
		// res
		$ = cheerio.load(fs.readFileSync('.\\descarcate\\' + fileName));
		var title = $('body>div');
		var rows = $('body>table>tr');

		ProcessRows(file, $, rows, currentBook);
	});
});
db.close();
