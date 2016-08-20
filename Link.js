// A link to one or more versets in the Scripture - usually versets have multiple,
// especially in the New Testament.
// In the DB, the start and end verset ids are kept in order to keep the DB normalized
function Link(chapterId, versetNumber, targetBookShortName, targetChapter, startVerset, endVerset)
{
	//this.versetId = versetId;
	this.chapterId = chapterId;
	this.versetNumber = versetNumber;

	this.targetBookShortName = targetBookShortName;
	this.targetChapter = targetChapter;
	this.targetStartVerset = startVerset;
	this.targetEndVerset = (endVerset === undefined) ? startVerset : endVerset;
}

module.exports = Link;
