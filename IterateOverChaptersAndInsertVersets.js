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

db.serialize(function() {
	db.each("SELECT C.rowid, C.book_id, C.number, C.title, C.path, B.s_name FROM Chapters AS C INNER JOIN Books AS B ON C.book_id = B.rowid", function(err, row) {
		var currentChapter = new Chapter(row.rowid, row.book_id, row.number, row.title, row.path, row.s_name);

		/*
		var debugIds = [50];
		if (debugIds.indexOf(currentChapter.chapterId) === -1)
		{
			return;
		}*/

		var dirName = currentChapter.bookId + "-" + currentChapter.bookShortName;
		var fileName = currentChapter.number + ".html";

		var startTime = new Date();

		var $;
		$ = cheerio.load(fs.readFileSync('.\\descarcate\\' + dirName + "\\ " + fileName));

		var rows = $('body>table>tr');
		require('./InsertVersetsForChapter.js')(file, $, rows, currentChapter.chapterId);

		var endTime = new Date();
		var elapsed = endTime.getTime() - startTime.getTime();

		console.log("[ "+ endTime.toLocaleTimeString() + "] Inserted in " + elapsed + " ChapterId=" + currentChapter.chapterId +
			" DirName="+ dirName +
			" ChapterNumber=" + currentChapter.number);


})
});
	
db.close();

