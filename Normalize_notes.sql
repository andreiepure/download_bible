INSERT INTO Notes (`verset_id`, `letter`,`text`)
SELECT
  Versets.rowid, TemporaryNotes.letter, TemporaryNotes.text
  FROM TemporaryNotes
  INNER JOIN Versets ON TemporaryNotes.chap_id = Versets.chap_id AND TemporaryNotes.vers_number = Versets.number;
  