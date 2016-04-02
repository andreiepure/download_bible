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
  if(!exists) {
    db.run("CREATE TABLE Testaments (s_name CHAR(15) NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
    db.run("CREATE TABLE Books (test_id INTEGER NOT NULL, s_name TEXT NOT NULL, l_name TEXT NOT NULL, path TEXT NOT NULL)");
    db.run("CREATE TABLE Chapters (book_id INTEGER NOT NULL, number INT NOT NULL, desc TEXT NOT NULL, path TEXT NOT NULL)");
    db.run("CREATE TABLE Versets (chap_id INTEGER NOT NULL, number INT NOT NULL, text TEXT NOT NULL, path TEXT NOT NULL)");
    db.run("CREATE TABLE Notes (vers_id INTEGER NOT NULL, letter CHAR(1) NOT NULL, text TEXT NOT NULL, path TEXT NOT NULL)");
    db.run("CREATE TABLE Links (vers_id INTEGER NOT NULL, text TEXT NOT NULL, path TEXT NOT NULL)");
  }
  
  var stmt = db.prepare("INSERT INTO Testaments VALUES (?, ?, ?)");
  stmt.run("VT", "Vechiul Testament", "index-C.php?id=VT");
  stmt.run("NT", "Noul Testament", "index-C.php?id=NT");
  stmt.finalize();

  db.each("SELECT rowid, s_name, l_name, path FROM Testaments", function(err, row) {
    console.log(row.rowid + ": " + row.s_name + ": " + row.l_name + ": " + row.path);
  });
});

db.close();
