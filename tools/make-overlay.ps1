param(
  [Parameter(Mandatory = $true)][string]$MinePath,
  [Parameter(Mandatory = $true)][string]$RefPath,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$RefX = 50, [int]$RefY = 0, [int]$RefW = 310, [int]$RefH = 820,
  [int]$Height = 900,
  [int]$TintA = 235, [int]$TintG = 40, [int]$TintB = 40
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# 1) 读我的模型，裁出不透明包围盒，同时生成一张纯色剪影
$src = New-Object System.Drawing.Bitmap $MinePath
$rect = [System.Drawing.Rectangle]::new(0, 0, $src.Width, $src.Height)
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bytes = New-Object byte[] ($data.Stride * $data.Height)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$stride = $data.Stride      # 解锁后 BitmapData 的属性会失效，必须先取出来
$src.UnlockBits($data)

$minX = $src.Width; $maxX = 0; $minY = $src.Height; $maxY = 0
for ($y = 0; $y -lt $src.Height; $y += 2) {
  for ($x = 0; $x -lt $src.Width; $x += 2) {
    $i = $y * $data.Stride + $x * 4
    if ($bytes[$i + 3] -gt 24) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$bw = $maxX - $minX
$bh = $maxY - $minY
Write-Output ("我的模型包围盒 {0}x{1}" -f $bw, $bh)

$sil = New-Object System.Drawing.Bitmap $bw, $bh
$srect = [System.Drawing.Rectangle]::new(0, 0, $bw, $bh)
$sdata = $sil.LockBits($srect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sbytes = New-Object byte[] ($sdata.Stride * $sdata.Height)
for ($y = 0; $y -lt $bh; $y++) {
  for ($x = 0; $x -lt $bw; $x++) {
    $si = ($y + $minY) * $stride + ($x + $minX) * 4
    $a = $bytes[$si + 3]
    $di = $y * $sdata.Stride + $x * 4
    $sbytes[$di] = $TintB
    $sbytes[$di + 1] = $TintG
    $sbytes[$di + 2] = $TintA
    $sbytes[$di + 3] = [int]($a * 0.62)
  }
}
[System.Runtime.InteropServices.Marshal]::Copy($sbytes, 0, $sdata.Scan0, $sbytes.Length)
$sil.UnlockBits($sdata)
$src.Dispose()

# 2) 画底图 + 剪影
# 关键：两边各自缩放到同一高度才能对比 —— 参考图按自身裁剪框缩放，
# 不能用「我的包围盒」推出来的 scale，否则两个figure根本不在一个尺度上
$mineScale = $Height / $bh
$refScale = $Height / $RefH
$refW = [int]($RefW * $refScale)
$refH = $Height
$mineW = [int]($bw * $mineScale)
$canvasW = [Math]::Max($refW, $mineW) + 60
$canvasH = [Math]::Max($Height, $refH) + 70

$bmp = New-Object System.Drawing.Bitmap $canvasW, $canvasH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(238, 240, 244))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$refImg = [System.Drawing.Image]::FromFile($RefPath)
$g.DrawImage($refImg, [System.Drawing.Rectangle]::new(30, 40, $refW, $refH),
  [System.Drawing.Rectangle]::new($RefX, $RefY, $RefW, $RefH), [System.Drawing.GraphicsUnit]::Pixel)
$refImg.Dispose()

$dest = [System.Drawing.Rectangle]::new(30 + [int](($refW - $mineW) / 2), 40, $mineW, $Height)
$g.DrawImage($sil, $dest, [System.Drawing.Rectangle]::new(0, 0, $bw, $bh), [System.Drawing.GraphicsUnit]::Pixel)
$sil.Dispose()

$font = New-Object System.Drawing.Font 'Consolas', 18, ([System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 44, 52))
$g.DrawString('RED = mine  /  photo = official', $font, $brush, [System.Drawing.PointF]::new(30, 8))
$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("saved {0}  ({1}x{2})" -f $Out, $canvasW, $canvasH)
