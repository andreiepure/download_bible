function Book(shortName, longName, relativePath) {
	this.bookId = relativePath.indexOf("VT") != -1 ? 1 : 2
	this.shortName = shortName;
	this.longName = longName;
	this.relativePath = relativePath;
}

// Trebuie sa ii dau ca parametru si o functie callback, fiindca apelul este asincron
// db.run("CREATE TABLE Books (test_id INTEGER NOT NULL, s_name TEXT NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
function requestText(db, url)
{
	var res = request('GET', url);
	var body;
	try {
		body = res.getBody();
	} catch (err) {
		console.log("Error for URL " + url + " : " + error);
		return;
	}

	var $ = cheerio.load(body);

	var title = $('body>div');

	// fiecare rand are doua celule: prescurtarea si numele cu legatura
	var rows = $('body>table>tr');

	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var link = row.children[1].children[0];

		var shortName = row.children[0].children[0].data;
		var longName = link.children[0].data;
		var relativePath = link.attribs.href;

		var currentBook = new Book(shortName, longName, relativePath);
		var repeat = false;
		do {
			try {

				var db = new sqlite3.cached.Database(file);
				db.serialize(function() {

					var stmt = db.prepare("INSERT INTO Books VALUES (?, ?, ?, ?)");
					stmt.run(currentBook.bookId, currentBook.shortName, currentBook.longName, currentBook.relativePath);
					stmt.finalize();

					console.log("Inserted data for " +
						currentBook.bookId +" "+
						currentBook.shortName +" "+
						currentBook.longName +" "+
						currentBook.relativePath);
				});
			} catch (er) {
				console.log("Caught error " + er + " for " +
					currentBook.bookId +" "+
					currentBook.shortName +" "+
					currentBook.longName +" "+
					currentBook.relativePath);
				repeat = true;
			}
		} while (repeat);
	}
}

var request = require('sync-request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

var file = "bible.db";
var exists = fs.existsSync(file);

if(!exists) {
	console.log("DB File does not exist, exiting...");
	return;
}

var sections = [ "VT", "NT" ]
var siteRoot = "http://www.biblia-bartolomeu.ro/";
var sectionRoot = siteRoot + "index-C.php?id=";

for (var i = 0; i < sections.length; i++) {
    var chapterRoot = sectionRoot + sections[i];
	requestText(file, chapterRoot);
}
