$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# 把 6 张武器渲染图裁出枪身区域，拼成 3x2 对比图，用来肉眼确认 6 把枪剪影真的不同
$weps = @('rifle', 'mg43', 'gr8', 'flam40', 'gl21', 'apw1')
$dir = 'D:\HelldiverPet\.preview'
$outFile = Join-Path $dir 'weapons-compare.png'

# 裁剪框（zoom=2 的 855x1000 图上，枪大致在这块）
$cx = 470; $cy = 440; $cw = 260; $ch = 260
$scale = 2
$cellW = $cw * $scale
$cellH = $ch * $scale
$cols = 3; $rows = 2

$bmp = New-Object System.Drawing.Bitmap ($cellW * $cols), ($cellH * $rows)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(235, 238, 243))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$font = New-Object System.Drawing.Font 'Consolas', 22, ([System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 34, 42))
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(160, 166, 178)), 2

for ($i = 0; $i -lt $weps.Count; $i++) {
    $p = Join-Path $dir ("w6-{0}.png" -f $weps[$i])
    if (-not (Test-Path $p)) { Write-Output "missing: $p"; continue }
    $src = [System.Drawing.Image]::FromFile($p)
    $col = $i % $cols
    $row = [math]::Floor($i / $cols)
    $dx = $col * $cellW
    $dy = $row * $cellH
    $dest = [System.Drawing.Rectangle]::new($dx, $dy, $cellW, $cellH)
    $crop = [System.Drawing.Rectangle]::new($cx, $cy, $cw, $ch)
    $g.DrawImage($src, $dest, $crop, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawRectangle($pen, $dest)
    $g.DrawString($weps[$i].ToUpper(), $font, $brush, [System.Drawing.PointF]::new($dx + 10, $dy + 8))
    $src.Dispose()
}

$g.Dispose()
$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "saved $outFile"
