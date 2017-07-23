SELECT
  TL.rowid, TL.chap_id, TL.versetNumber,
  TL.target_book_s_name, TL.target_chap_number, TL.target_start_verset_number, TL.target_end_verset_number,
  V.rowid AS 'SOURCE_VERSET_ID', V.text AS 'VERSET_TEXT',
  B.rowid AS 'DEST_BOOK_ID',
  C.rowid AS 'DEST_CHAPTER_ID', C.title AS 'DEST_CHAPTER_TITLE'
  FROM TemporaryLinks AS TL
  INNER JOIN Versets AS V ON TL.chap_id = V.chap_id AND TL.versetNumber = V.number
  INNER JOIN Books AS B ON TL.target_book_s_name = B.s_name
  INNER JOIN Chapters AS C ON B.rowid = C.book_id AND TL.target_chap_number = C.number
  WHERE TL.chap_id = 2
  ORDER BY TL.rowid;
  