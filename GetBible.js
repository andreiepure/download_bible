 // Script to download the Orthodox Bible

var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

var sep = "-";
var siteRoot = "http://www.biblia-bartolomeu.ro/";
var bibleRoot = siteRoot + "index-D.php?id=";

var chapterName = "NT-mt";
var gospelRoot = bibleRoot + chapterName;
var firstChaper = 5;
var lastChapter = 5;

// Formats the number for the URL form to have 2 digits
function formatNumber(number)
{
    if (number <= 0)
    {
        throw "Argument below zero";
    }
    if (number > 0 && number <= 9)
    {
        return "0" + number;
    }
    return "" + number;
}

// 1. Get the table of contents (books) in a structure
// VT http://www.biblia-bartolomeu.ro/index-C.php?id=VT
// NT http://www.biblia-bartolomeu.ro/index-C.php?id=NT
// 2. For each book, get the chapters
// e.g. http://www.biblia-bartolomeu.ro/index-C.php?id=VT-Fc
// 3. For each chapter, get the title, versets, addnotations and links
// e.g. http://www.biblia-bartolomeu.ro/index-C.php?id=VT-Fc-01
// The VT/NT will be an array of book objects {VT:[Book1, Book2], NT:[Book3, Book4]}
// Each book will be an object {Parent:VT, Name:Facerea, Chapters:[C1, C2]}
// Each chapter will be an object {ParentBook: Facerea, ChapterNumber:1, Description:"", Versets: [V1, V2]}
// Each Verset will be an object {ParentBook: Facerea, ParentChapter: 1, VersetNumber:1, Text: "", Addnotations: [A1, A2], Trimiteri: [T1,T2]}
// Each addnotation will be an object {ParentBook: Facerea, ParentChapter:1, Letter: a, Text: ""} // for V1 skips links inside the text
// Each trimitere will be an object { ParentBook: Facerea, ParentChapter:1, ParentVerset:1, ToBook: Isaia, ToChapter: 57, ToVerset:15}

function requestText(url)
{
	request(url, function(error, response, body) {
		if (error) {
			console.log("Error: " + error);
			return;
		}

		if (response.statusCode == 200) {
			var $ = cheerio.load(body);
			var chapter = $('body>table>tr>td>center').text();
			description = $('body>table>tr>td').text().split(chapter)[1];
			console.log(description);
		}
	});
}

for (var chapter = firstChaper; chapter <= lastChapter; chapter++)
{
    var chapterRoot = gospelRoot + sep + formatNumber(chapter);
	requestText(chapterRoot);

	var verseNumber = 3;
	var versetRoot = chapterRoot + sep + formatNumber(verseNumber);
	requestText(versetRoot);
}
