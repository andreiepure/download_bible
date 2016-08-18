// This writes the chapters HTML files locally

var request = require('sync-request');
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

	this.number = number;
	this.title = title;
	this.relativePath = path;
	this.url =  "http://www.biblia-bartolomeu.ro/index-C.php" + this.relativePath;
}


function ProcessRows($, rows, currentBook, dirName)
{
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var link = row.children[1].children[0];

		var shortName = $(row.children[0]).text();

		var intelept = (shortName == " - " && currentBook.shortName == "Sir");
		if (intelept)
		{
			shortName = "Cap. 0";
		}

		var longName;
		var exceptions = ["Ps", "Cant", "Ir"];
		if (link.children.length == 1 ||
			exceptions.indexOf(currentBook.shortName) != -1 ||
			intelept)
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

		console.log("Will get data for " +
			currentChapter.bookId + " - " +
			currentChapter.number + " - " +
			currentChapter.title + " - " +
			currentChapter.relativePath + " - " +
			currentChapter.url);

		var chapterHtml = request('GET', currentChapter.url);
		var chapterBody;
		try {
			chapterBody = chapterHtml.getBody();
			debugger;
			var chapterFile = fs.createWriteStream(".\\descarcate\\" + dirName + "\\" + currentChapter.number + ".html");
			chapterFile.write(chapterBody);
		} catch (err) {
			console.log("Error for URL " + currentChapter.url + " : " + error);
			return;
		}
	}
}

var books = [];
//TODO 
// - create book object
// - for each book object sync-request and store in the DB the chapter objects

var db = new sqlite3.Database(file);
db.serialize(function() {
	db.each("SELECT rowid, test_id, s_name, l_name, path FROM Books", function(err, row) {
		var currentBook = new Book(row.rowid, row.s_name, row.l_name, row.path);

		books.push(currentBook);

		/*
		var debugIds = [24];
		if (debugIds.indexOf(currentBook.bookId) === -1)
		{
			return;
		}*/

		console.log("Current book " +
			currentBook.bookId + " " + 
			currentBook.testamentId +" "+
			currentBook.shortName +" "+
			currentBook.longName +" "+
			currentBook.relativePath + " " + currentBook.url);

		var dirName = currentBook.bookId + "-" + currentBook.shortName;
		var res = request('GET', currentBook.url);
		var body;
		var $;
		try {
			body = res.getBody();
			var file = fs.createWriteStream(".\\descarcate\\" + dirName + ".html");
			file.write(body);
			$ = cheerio.load(body);
		} catch (err) {
			console.log("Error for URL " + currentBook.bookId + "-" + currentBook.url + " : " + error);
			return;
		}

		mkdirp(".\\descarcate\\" + dirName + '\\', function(err) { });

		var title = $('body>div');
		var rows = $('body>table>tr');

		// fiecare rand are doua celule: prescurtarea si numele cu legatura
		ProcessRows($, rows, currentBook, dirName);
	});
});
db.close();
