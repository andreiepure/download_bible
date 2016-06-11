var fs = require("fs");
var file = "bible.db";
var exists = fs.existsSync(file);

if(!exists) {
	console.log("Creating DB file.");
	fs.openSync(file, "w");
}

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

db.serialize(function() {
//	db.run("DROP TABLE Versets");
//	db.run("CREATE TABLE Versets (chap_id INTEGER NOT NULL, number INT NOT NULL, text TEXT NOT NULL)");
});

db.close();
