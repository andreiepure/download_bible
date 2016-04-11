
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

var file = "bible.db";
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

//TODO 
// - create book object
// - for each book object sync-request and store in the DB the chapter objects

db.serialize(function() {
	//db.run("CREATE TABLE Testaments (s_name CHAR(15) NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
	db.each("SELECT rowid, s_name, l_name, path FROM Testaments", function(err, row) {
		console.log(row.rowid + " - " + row.s_name + " - " + row.l_name + " - " + row.path);
	});

	// db.run("CREATE TABLE Books (test_id INTEGER NOT NULL, s_name TEXT NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
	db.each("SELECT rowid, test_id, s_name, l_name, path FROM Books", function(err, row) {
		console.log(row.rowid + " - " + row.test_id + " - " + row.s_name + " - " + row.l_name + " - " + row.path);
	});
});
db.close();

