var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var mkdirp = require('mkdirp');

var file = "bible.db";
var exists = fs.existsSync(file);


function Chapter(bookId, number, title, path)
{
	this.bookId = bookId;
	this.number = number;
	this.title = title;
	this.relativePath = path;
	this.url =  "http://www.biblia-bartolomeu.ro/index-C.php" + this.relativePath;
}

var db = new sqlite3.Database(file);

// !!! TODO !!! IMPORTANT
// The rowid is not in proper order, the number should be used for the chaper number
// i.e. the rowid does not provide order inside a book
// the number of the chapter provides order in the book

db.serialize(function() {
	db.each("SELECT rowid, book_id, number, title, path FROM Chapters", function(err, row) {
		console.log(row.rowid + ' ' + row.book_id + ' ' + row.number  + ' ' + row.title);
	})});
	
