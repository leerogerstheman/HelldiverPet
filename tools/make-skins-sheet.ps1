$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$skins = @('b01','b22','sc34','fs23','a35','tr117','ce74','cw22','cw4','cw9')
$dir = 'D:\HelldiverPet\.preview\skins'
$outFile = 'D:\HelldiverPet\docs\skins-sheet.png'

$cellW = 300; $cellH = 400; $cols = 5; $rows = 2; $labelH = 30

$bmp = New-Object System.Drawing.Bitmap ($cellW * $cols), (($cellH + $labelH) * $rows)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(232, 236, 242))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = New-Object System.Drawing.Font 'Consolas', 16, ([System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28, 32, 40))
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(170, 176, 188)), 2

for ($i = 0; $i -lt $skins.Count; $i++) {
    $p = Join-Path $dir ("{0}.png" -f $skins[$i])
    $dx = ($i % $cols) * $cellW
    $dy = ([math]::Floor($i / $cols)) * ($cellH + $labelH)
    if (Test-Path $p) {
        $src = [System.Drawing.Image]::FromFile($p)
        $g.DrawImage($src, [System.Drawing.Rectangle]::new($dx, $dy, $cellW, $cellH))
        $src.Dispose()
    } else {
        Write-Output "missing: $p"
    }
    $g.DrawRectangle($pen, $dx, $dy, $cellW, $cellH)
    $g.DrawString($skins[$i].ToUpper(), $font, $brush, [System.Drawing.PointF]::new(($dx + 10), ($dy + $cellH + 4)))
}

$g.Dispose()
$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "saved $outFile"
