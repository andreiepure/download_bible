var request = require('sync-request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var mkdirp = require('mkdirp');

var file = "bible.db";
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

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

var total = 1350;
var inserted = 0;

function ChapterContent(file, $, rows, chapterId)
{
	this.file = file;
	this.$ = $;
	this.rows = rows;
	this.chapterId = chapterId;
}

function Insert(contents)
{
	var c = contents.slice(0);
	(function insertContents() {

		debugger;
		var content = c.splice(0, 1)[0];
		if (content) {
			try {
				var startTime = new Date();
				require('./InsertVersetsForChapter.js')(content.file, content.$, content.rows, content.chapterId, db, insertContents);

				var endTime = new Date();
				var elapsed = endTime.getTime() - startTime.getTime();

				// wait for the chapter versets to be inserted

				console.log("[ "+ endTime.toLocaleTimeString() + "] " +  content.chapterId + " Finished starting the insert, time " + elapsed);

				inserted = inserted + 1;

				console.log("[ " + endTime.toLocaleTimeString() + "] STATUS " + inserted + " / 1350");

			} catch (exception) {
				console.log('exception was caught ' + exception);
			}
		}
	})();
}

var contents = [];

db.serialize(function() {
	db.each("SELECT C.rowid, C.book_id, C.number, C.title, C.path, B.s_name FROM Chapters AS C INNER JOIN Books AS B ON C.book_id = B.rowid ORDER BY C.rowid ASC", function(err, row) {
		var currentChapter = new Chapter(row.rowid, row.book_id, row.number, row.title, row.path, row.s_name);


		var debugIds = [];

		/*
		debugIds.push(1350);
		if (debugIds.indexOf(currentChapter.chapterId) === -1)
		{
			return;
		}*/

		var dirName = currentChapter.bookId + "-" + currentChapter.bookShortName;
		var fileName = currentChapter.number + ".html";


		var $;
		$ = cheerio.load(fs.readFileSync('.\\descarcate\\' + dirName + "\\ " + fileName));

		var rows = $('body>table>tr');


		var content = new ChapterContent(file, $, rows, currentChapter.chapterId);
		contents.push(content);

		if (content.length == 1350 || contents.length == debugIds.length) {
			Insert(contents);
		}
	})
});


