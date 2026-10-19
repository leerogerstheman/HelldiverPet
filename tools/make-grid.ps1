param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Step = 20,
  [int]$Zoom = 2,
  [int]$CropX = 0,
  [int]$CropY = 0,
  [int]$CropW = 0,
  [int]$CropH = 0
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($ImagePath)
if ($CropW -le 0) { $CropW = $img.Width }
if ($CropH -le 0) { $CropH = $img.Height }

$w = $CropW * $Zoom
$h = $CropH * $Zoom
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
# 裁剪 + 放大。矩形用 ::new() 强类型构造，PowerShell 5.1 的重载解析才认得
$destRect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
$srcRect = [System.Drawing.Rectangle]::new($CropX, $CropY, $CropW, $CropH)
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$font = New-Object System.Drawing.Font 'Consolas', 9, ([System.Drawing.FontStyle]::Bold)
$label = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 80, 80))
$major = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 255, 40, 40)), 1
$minor = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(90, 255, 160, 160)), 1

for ($x = 0; $x -le $CropW; $x += $Step) {
  $px = $x * $Zoom
  $isMajor = ($x % ($Step * 5)) -eq 0
  if ($isMajor) { $g.DrawLine($major, $px, 0, $px, $h) } else { $g.DrawLine($minor, $px, 0, $px, $h) }
  if ($isMajor -and $x -gt 0) {
    $g.DrawString(($CropX + $x).ToString(), $font, $label, [System.Drawing.PointF]::new(($px + 2), 2))
  }
}
for ($y = 0; $y -le $CropH; $y += $Step) {
  $py = $y * $Zoom
  $isMajor = ($y % ($Step * 5)) -eq 0
  if ($isMajor) { $g.DrawLine($major, 0, $py, $w, $py) } else { $g.DrawLine($minor, 0, $py, $w, $py) }
  if ($isMajor -and $y -gt 0) {
    $g.DrawString(($CropY + $y).ToString(), $font, $label, [System.Drawing.PointF]::new(2, ($py + 2)))
  }
}

$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
Write-Output ("saved {0}  ({1}x{2}, step {3}, origin {4},{5})" -f $Out, $w, $h, $Step, $CropX, $CropY)
