
var request = require('sync-request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

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

var books = [];
//TODO 
// - create book object
// - for each book object sync-request and store in the DB the chapter objects

var db = new sqlite3.Database(file);
db.serialize(function() {
	// db.run("CREATE TABLE Books (test_id INTEGER NOT NULL, s_name TEXT NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
	db.each("SELECT rowid, test_id, s_name, l_name, path FROM Books", function(err, row) {
		var currentBook = new Book(row.rowid, row.s_name, row.l_name, row.path);
		books.push(currentBook);

		/*
		var debugIds = [24];
		if (debugIds.indexOf(currentBook.bookId) == -1)
		{
			return;
		}
		*/

		console.log("Current book " + currentBook.bookId + " " + 
			currentBook.testamentId +" "+
			currentBook.shortName +" "+
			currentBook.longName +" "+
			currentBook.relativePath + " " + currentBook.url);

		var res = request('GET', currentBook.url);
		var body;
		var $;
		try {
			body = res.getBody();
			$ = cheerio.load(body);
		} catch (err) {
			console.log("Error for URL " + url + " : " + error);
			return;
		}

		var title = $('body>div');

		// fiecare rand are doua celule: prescurtarea si numele cu legatura
		var rows = $('body>table>tr');

		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			var link = row.children[1].children[0];

			debugger;
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

			console.log(shortName + " - " + longName + " - " + relativePath);

			var repeat = false;
			/*
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

*/
		}
	});
});
db.close();
