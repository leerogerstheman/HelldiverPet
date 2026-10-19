param(
  [Parameter(Mandatory = $true)][string]$MinePath,
  [Parameter(Mandatory = $true)][string]$RefPath,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$RefX = 55, [int]$RefY = 0, [int]$RefW = 300, [int]$RefH = 820,
  [int]$Height = 900
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Get-AlphaBox([string]$path) {
  $b = New-Object System.Drawing.Bitmap $path
  $rect = [System.Drawing.Rectangle]::new(0, 0, $b.Width, $b.Height)
  $data = $b.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = New-Object byte[] ($data.Stride * $data.Height)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
  $b.UnlockBits($data)
  $minX = $b.Width; $maxX = 0; $minY = $b.Height; $maxY = 0
  for ($y = 0; $y -lt $b.Height; $y += 2) {
    for ($x = 0; $x -lt $b.Width; $x += 2) {
      $i = $y * $data.Stride + $x * 4
      if ($bytes[$i + 3] -gt 24) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  $b.Dispose()
  return @{ X = $minX; Y = $minY; W = ($maxX - $minX); H = ($maxY - $minY) }
}

$box = Get-AlphaBox $MinePath
Write-Output ("桌宠包围盒 x {0}..{1}  y {2}..{3}  ({4}x{5})" -f $box.X, ($box.X + $box.W), $box.Y, ($box.Y + $box.H), $box.W, $box.H)

$scale = $Height / $box.H
$mineW = [int]($box.W * $scale)
$refW = [int]($RefW * $scale)
$refH = [int]($RefH * $scale)
$canvasW = 30 + $mineW + 30 + $refW + 30
$canvasH = [Math]::Max($Height, $refH) + 70

$bmp = New-Object System.Drawing.Bitmap $canvasW, $canvasH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(238, 240, 244))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = New-Object System.Drawing.Font 'Consolas', 20, ([System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 44, 52))

$src = [System.Drawing.Image]::FromFile($MinePath)
$dest = [System.Drawing.Rectangle]::new(30, 40, $mineW, $Height)
$crop = [System.Drawing.Rectangle]::new($box.X, $box.Y, $box.W, $box.H)
$g.DrawImage($src, $dest, $crop, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('MINE', $font, $brush, [System.Drawing.PointF]::new(30, 8))
$src.Dispose()

$src2 = [System.Drawing.Image]::FromFile($RefPath)
$dest2 = [System.Drawing.Rectangle]::new(30 + $mineW + 30, 40, $refW, $refH)
$crop2 = [System.Drawing.Rectangle]::new($RefX, $RefY, $RefW, $RefH)
$g.DrawImage($src2, $dest2, $crop2, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('REFERENCE', $font, $brush, [System.Drawing.PointF]::new(30 + $mineW + 30, 8))
$src2.Dispose()

$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("saved {0}  ({1}x{2})" -f $Out, $canvasW, $canvasH)
