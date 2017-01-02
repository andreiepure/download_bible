var request = require('sync-request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var mkdirp = require('mkdirp');
var Note = require('./Note');
var Link = require('./Link');
var Verset = require('./Verset');

// IMPORTANT
// for Note and Link, the versetId is not present at parse time.

function RetrieveNote(noteRelativeUrl)
{
	var retry = 5;
	do {
		try {
			var url = "http://www.biblia-bartolomeu.ro/" + noteRelativeUrl;
			var res = request('GET', url);
			var body;
			try {
				body = res.getBody();
			} catch (err) {
				console.log("Error for URL " + url + " : " + error);
				return;
			}

			// I don't know how { decodeEntities : true } works for cheerio!
			var $ = cheerio.load(body);

			var text = $('body>div').html();

			return text;
		}
		catch (error) {
			retry--;
			console.log('Error for URL ' + url + ' : ' + error + ' will retry ' + retry);
		}
	} while (retry > 0);
}

// Process rows
module.exports = function(file, $, rows, chapterId, db, nextInsert)
{
	var versetNotes = [];
	var versetLinks = [];
	var versets = [];

	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];

		// needed to insert
		var versetNumber = $(row.children[0].children[1]).text();
		var versetText;

		// needed to construct
		var content = row.children[1];
		var versetTextTokens = [];

		content.children.forEach(function(childElement) {
			if (childElement.name === undefined ||
				childElement.name === 'br' ||
				childElement.name === 'p' ||
				childElement.name === 'b' ||
				childElement.name === 'i' ||
				(childElement.name == 'div' && childElement.attribs !== undefined && childElement.attribs.align !== 'right')
				) {

				// Estera
				var text;
				if (childElement.name == 'div' && childElement.attribs !== undefined && childElement.attribs.align !== 'right') {
					text = $(childElement).html();
				}
				else {
					text = $(childElement).text().trim();
				}

				versetTextTokens.push(text);
			}
			else {
				if (childElement.name === 'sup') {
					var href = childElement.children[0].attribs.href
					var noteLetter = $(childElement).text()
					var text = RetrieveNote(href);
					var note = new Note(chapterId, versetNumber, noteLetter, text);
					versetNotes.push(note);
				}
				else if (childElement.name === 'div' && childElement.attribs !== undefined && childElement.attribs.align === 'right') {
					childElement.children.forEach(function(versetLink) {
						var linkContent = $(versetLink).text();
						if (linkContent !== undefined) {
							var pieces = linkContent.split(' ');
							if (pieces.length == 2) {
								var bookAndVersets = pieces[1].split(':');
								if (bookAndVersets.length == 2) {
									var versets = bookAndVersets[1].split('-');
									var bookShortName = pieces[0];
									var chapter = bookAndVersets[0];
									var firstVerset = versets[0];
									var lastVerset = versets[1];
									var link = new Link(chapterId, versetNumber, bookShortName, chapter, firstVerset, lastVerset);
									versetLinks.push(link);
								}
								else {
									console.log("chapter id " + chapterId + " bookAndVersets does not have 2... " + linkContent);
								}
							}
						}
					});
				}
				else {
					console.log("Unrecognized childElement name in chapter row: " + childElement.name);
				}
			}
		});

		versetText = versetTextTokens.join(' ');
		var verset = new Verset(chapterId, versetNumber, versetText);
		versets.push(verset);
	}

	debugger;

	var startDb = Date.now();

	db.serialize(function() {
		db.run("begin transaction");

		var stmt = db.prepare("INSERT INTO Versets VALUES (?, ?, ?)");
		versets.forEach(function(verset) {
			stmt.run(verset.chapterId, verset.number, verset.text);
		});

		stmt.finalize();

		var noteStatement = db.prepare("INSERT INTO TemporaryNotes VALUES (?, ?, ?, ?)");
		versetNotes.forEach(function(note) {
				noteStatement.run(note.chapterId, note.versetNumber, note.letter, decodeURIComponent(note.text));
		});
		noteStatement.finalize();

		var linkStatement = db.prepare("INSERT INTO TemporaryLinks VALUES (?, ?, ?, ?, ?, ?)");
		versetLinks.forEach(function(link) {
			linkStatement.run(link.chapterId, link.versetNumber, link.targetBookShortName, link.targetChapter, link.targetStartVerset, link.targetEndVerset);
		});
		linkStatement.finalize();

		db.run("commit", [], function(){
			var endTime = new Date();
			console.log("[ "+ endTime.toLocaleTimeString() + "] Changes have been committed for chapter " + chapterId + " in " + (endTime.getTime() - startDb) + " ms");
			nextInsert();
		});
	});


}
