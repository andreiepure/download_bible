
INSERT INTO Links (`source_verset_id`,`dest_chapter_id`,`dest_start_verset_number`,`dest_end_verset_number`)
SELECT
  --TL.chap_id, TL.versetNumber, 
  V.rowid, C.rowid, TL.target_start_verset_number, TL.target_end_verset_number
  FROM TemporaryLinks AS TL
  INNER JOIN Versets AS V ON TL.chap_id = V.chap_id AND TL.versetNumber = V.number
  INNER JOIN Books AS B ON TL.target_book_s_name = B.s_name
  INNER JOIN Chapters AS C ON B.rowid = C.book_id AND TL.target_chap_number = C.number;