/*
 * Script to download the Orthodox Bible
 */

$sep = "-";
$pathRoot = ".\text\";
$siteRoot = "http://www.biblia-bartolomeu.ro/";
$bibleRoot = $siteRoot + "index-D.php?id=";

$chapterName = "NT-mt";
$gospelRoot = $bibleRoot + $chapterName;
$firstChaper = 5;
$lastChapter = 7;

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

# Returns a string for the addnotation modal
function Format-Addnotation-Modal($chapterNumber, $verseNumber, $text)
{
    return @"
        <div class="modal fade" id="modal-$chapterNumber-$verseNumber" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title text-center" id="myModalLabel">Părintele Bartolomeu explică</h4>
                    </div>
                    <div class="modal-body">$text</div>
                    <div class="modal-footer row"><button type="button" class="col-xs-12" data-dismiss="modal">Închide</button></div>
                </div>
            </div>
        </div>
"@;
}

for ($chapter = $firstChaper; $chapter -le $lastChapter; $chapter++)
{
    $path = $pathRoot + $chapter + ".txt";
    Write-Host "" > $path;
    Write-Host "Will write to $path";

    $chapterRoot = $gospelRoot + $sep + (Format-Number $chapter);
    $text = (Invoke-WebRequest -Uri $chapterRoot).ParsedHtml.getElementsByTagName("td")[0].innerText;
    $description = $text.Split(":")[1];

    $verseNumber = 1;

    Add-Content $path "<h5 class=""text-center"">$description</h5>";
    Add-Content $path "<ol>";
    Write-Host "<h5 class=""text-center"">$description</h5>";
    Write-Host "<ol>";

    $chapterVerses = @();
    $chapterAddnotations = @();
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
        
        $addnotation = $result.ParsedHtml.getElementsByTagName("SUP");
        if ($addnotation.length -gt 0)
        {
            $addnotationPath = $siteRoot + ($addnotation[0].innerHTML.Split()[2].Split('"')[1]);
            #must replace &amp; with &
            $addnotationPath = $addnotationPath.Replace("&amp;", "&");
            $addnotationResult = Invoke-WebRequest -Uri ($addnotationPath);
            $addnotationText = $addnotationResult.ParsedHtml.getElementsByTagName("div")[0].innerText;
            $chapterAddnotations += ("" + $verseNumber + "_" + $addnotationText);

            # Write the button that will open the modal
            Add-Content $path "<li><button id=""btn-$chapter-$verseNumber"">$text</button></li>";
             Write-Host "<li><button id=""btn-$chapter-$verseNumber"">$text</button></li>";
        }
        else
        {
            Add-Content $path "<li>$text</li>";
             Write-Host "<li>$text</li>";
        }

        $verseNumber++;
    }
    Add-Content $path "</ol>";
    Write-Host  "<li>$text</li>";

    # write the annotation modal
    foreach($addnotation in $chapterAddnotations)
    {
        $components = $addnotation.Split("_");
        Add-Content $path (Format-Addnotation-Modal $chapter $components[0] $components[1]);
        Write-Host  (Format-Addnotation-Modal $chapter $components[0] $components[1]);
    }
}
