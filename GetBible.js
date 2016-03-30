// Script pentru a descarca Sfanta Scriptura de pe www.biblia-bartolomeu.ro

// Formateaza numarul ca string si daca e cifra pune 0 inainte
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

// Trebuie sa ii dau ca parametru si o functie callback, fiindca apelul este asincron
function requestText(url)
{
	request(url, function(error, response, body) {
		if (error) {
			console.log("Error: " + error);
			return;
		}

		if (response.statusCode == 200) {
			var $ = cheerio.load(body);

			var title = $('body>div');
			console.log(title.html());
			console.log(title.text());

			// fiecare rand are doua celule: prescurtarea si numele cu legatura
			var rows = $('body>table>tr');
			// rows[0].children[0].children[0].data - Fc
			// rows[0].children[1].children[0].attribs.href - "?id=VT-Fc"
			// rows[0].children[1].children[0].attribs.onclick - "javascript:parent.frames['D'].location='index-D.php?id=VT-Fc&a=obs';"
			// rows[0].children[1].children[0].attribs.onclick.split('location=')[1].split('&')[0] - "'index-D.php?id=VT-Fc"
			// rows[0].children[1].children[0].children[0].data - Facerea
		}
	});
}

// Asta poate fi folosit cu URL catre un verset sau descrierea unui capitol
// Momentan logheaza textul versetului
// Exemplu descriere: http://www.biblia-bartolomeu.ro/index-D.php?id=NT-Mt-05
// Exemplu verset: http://www.biblia-bartolomeu.ro/index-D.php?id=NT-Mt-05-03
// TODO: folosit capitol intreg
// Exemplu capitol intreg: http://www.biblia-bartolomeu.ro/index-C.php?id=NT-Mt-05
// - TODO extras descrierea capitolului
// - TODO pentru fiecare verset
// ---> extras textul, marcat adnotarea cumva, cu coif ^
// ---> extras legaturile pentru adnotare, { 'a':url }
// ---> extras legaturile pentru referinte
function requestTableTrTdText(url)
{
	request(url, function(error, response, body) {
		if (error) {
			console.log("Error: " + error);
			return;
		}

		if (response.statusCode == 200) {
			var $ = cheerio.load(body);
			var chapter = $('body>table>tr>td>center').text();
			var text = $('body>table>tr>td').text().split(chapter)[1];
			console.log(text);
		}
	});
}

var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

/*
var sep = "-";
var siteRoot = "http://www.biblia-bartolomeu.ro/";
var bibleRoot = siteRoot + "index-D.php?id=";

var chapterName = "NT-mt";
var gospelRoot = bibleRoot + chapterName;
var firstChaper = 5;
var lastChapter = 5;

for (var chapter = firstChaper; chapter <= lastChapter; chapter++)
{
    var chapterRoot = gospelRoot + sep + formatNumber(chapter);
	requestText(chapterRoot);

	var verseNumber = 3;
	var versetRoot = chapterRoot + sep + formatNumber(verseNumber);
	requestText(versetRoot);
}

*/

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

//var sections = [ "VT", "NT" ]
var sections = [ "VT"]
var siteRoot = "http://www.biblia-bartolomeu.ro/";
var sectionRoot = siteRoot + "index-C.php?id=";

for (var i = 0; i < sections.length; i++) {
    var chapterRoot = sectionRoot + sections[i];
	console.log(chapterRoot);
	requestText(chapterRoot);
}
