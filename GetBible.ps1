 # Script to download the Orthodox Bible

$sep = "-";
$siteRoot = "http://www.biblia-bartolomeu.ro/";
$bibleRoot = $siteRoot + "index-D.php?id=";

$chapterName = "NT-mt";
$gospelRoot = $bibleRoot + $chapterName;
$firstChaper = 5;
$lastChapter = 5;

# Formats the number for the URL form to have 2 digits
# Format-Number(0) will throw (same for negative numbers)
# Format-Number(1) will give "01"
# Format-Number(12) will give "12"
function Format-Number($number)
{
    if ($number -le 0)
    {
        throw "Argument below zero";
    }
    if ($number -gt 0 -and $number -le 9)
    {
        return "0" + $number;
    }
    return "" + $number;
}


for ($chapter = $firstChaper; $chapter -le $lastChapter; $chapter++)
{
    $chapterRoot = $gospelRoot + $sep + (Format-Number $chapter);
    $text = (Invoke-WebRequest -Uri $chapterRoot).ParsedHtml.getElementsByTagName("td")[0].innerText;
    $description = $text.Split(":")[1];

    $verseNumber = 1;

    while (1)
    {
        $result = Invoke-WebRequest -Uri ($chapterRoot + $sep + (Format-Number $verseNumber));
        $td = $result.ParsedHtml.getElementsByTagName("td");
        
        # when error is returned, the chapter name is returned (with a Nu există text)
        if ($td.length -eq 0)
        {
            break;
        }
        if ($td.length -ne 1)
        {
            throw "Unexpected $td - the length is $td.length";
        }

        $text = $td[0].innerText;
        # skip "mt NN:NN\r\n"
        $text=$text.Substring(10);

		Write-Host $text
        
        $addnotations = $result.ParsedHtml.getElementsByTagName("SUP");
        if ($addnotation.length -gt 0)
        {
            $addnotationPath = $siteRoot + ($addnotation[0].innerHTML.Split()[2].Split('"')[1]);
            #must replace &amp; with &
            $addnotationPath = $addnotationPath.Replace("&amp;", "&");
            $addnotationResult = Invoke-WebRequest -Uri ($addnotationPath);
            $addnotationText = $addnotationResult.ParsedHtml.getElementsByTagName("div")[0].innerText;

			Write-Host "Addnotation for $verseNumber"
			Write-Host $addnotationText
        }

        $verseNumber++;
    }
}
