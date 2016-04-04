function Book(shortName, longName, relativePath) {
	this.bookId = relativePath.indexOf("VT") != -1 ? 1 : 2
	this.shortName = shortName;
	this.longName = longName;
	this.relativePath = relativePath;
}

// TODO Trebuie sa STERG tabela Books
// TODO Trebuie sa folosesc sync-request ca sa nu fie probleme la inserare

// Trebuie sa ii dau ca parametru si o functie callback, fiindca apelul este asincron
// db.run("CREATE TABLE Books (test_id INTEGER NOT NULL, s_name TEXT NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
function requestText(db, url)
{
	var res = request('GET', url);
	var body;
	try {
		body = res.getBody();
	} catch (err) {
		console.log("Error: " + error);
		return;
	}

	var $ = cheerio.load(body);

	var title = $('body>div');

	// fiecare rand are doua celule: prescurtarea si numele cu legatura
	var rows = $('body>table>tr');
	var db = new sqlite3.Database(file);
	db.serialize(function() {
		//var stmt = db.prepare("INSERT INTO Books VALUES (?, ?, ?, ?)");
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var link = row.children[1].children[0];

			var shortName = row.children[0].children[0].data;
			var longName = link.children[0].data;
			var relativePath = link.attribs.href;

			var currentBook = new Book(shortName, longName, relativePath);
			//stmt.run(currentBook.bookId, currentBook.shortName, currentBook.longName, currentBook.relativePath);
			console.log(currentBook.bookId +" "+ currentBook.shortName +" "+ currentBook.longName +" "+ currentBook.relativePath);

		}
		//stmt.finalize();
	});
	db.close();
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


