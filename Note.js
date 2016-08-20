// An addnotation (explanatory note) for a certain verset. The HTML is kept
// as original (it will have external links to the Dervent Monastery website)
function Note(chapterId, versetNumber, letter, text)
{
	this.chapterId = chapterId;
	this.versetNumber = versetNumber;
	this.letter = letter;
	this.text = text;
}

module.exports = Note;
