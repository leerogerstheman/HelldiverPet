# 生成 build/icon.png 与 build/tray.png
# 用 GDI+ 直接绘制，不引入任何图形依赖。
# 图案：深蓝圆底 + 红白蓝条纹头盔 + 面罩 + 胸口盾牌白星 —— 绝地潜兵的识别特征。

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$build = Join-Path $root '..\build'
$build = [System.IO.Path]::GetFullPath($build)
if (-not (Test-Path $build)) { New-Item -ItemType Directory -Path $build | Out-Null }

function B([string]$hex) { New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function P([double]$x, [double]$y) { [System.Drawing.PointF]::new([float]$x, [float]$y) }

# $S = 图标边长；坐标一律写 0~1 的归一化值
function Draw-Helmet($g, [double]$S) {
    function X([double]$v) { $v * $S }
    function Y([double]$v) { $v * $S }

    $g.SmoothingMode = 'AntiAlias'
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.PixelOffsetMode = 'HighQuality'

    # --- 圆底 + 琥珀色外圈 ---
    $g.FillEllipse((B '#141f47'), (X 0.02), (Y 0.02), (X 0.96), (Y 0.96))
    $ring = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#f2a63b')), ([Math]::Max(1.0, $S * 0.020))
    $g.DrawEllipse($ring, (X 0.03), (Y 0.03), (X 0.94), (Y 0.94))

    # --- 披风（垫在头盔后面） ---
    $g.FillPolygon((B '#0f1a3d'), @(
        (P (X 0.24) (Y 0.28)), (P (X 0.07) (Y 0.90)),
        (P (X 0.93) (Y 0.90)), (P (X 0.76) (Y 0.28))
    ))

    # --- 头盔轮廓（同时用作三色条纹的裁剪区） ---
    $dome = New-Object System.Drawing.Drawing2D.GraphicsPath
    $dome.AddBezier((P (X 0.25) (Y 0.52)), (P (X 0.25) (Y 0.19)), (P (X 0.75) (Y 0.19)), (P (X 0.75) (Y 0.52)))
    $dome.AddLine((P (X 0.72) (Y 0.585)), (P (X 0.28) (Y 0.585)))
    $dome.CloseFigure()
    $g.FillPath((B '#e8edf3'), $dome)

    $saved = $g.Clip
    $g.SetClip($dome)
    $g.FillRectangle((B '#b4272b'), (X 0.20), (Y 0.20), (X 0.60), (Y 0.095))
    $g.FillRectangle((B '#ffffff'), (X 0.20), (Y 0.295), (X 0.60), (Y 0.095))
    $g.FillRectangle((B '#2b4a9e'), (X 0.20), (Y 0.39), (X 0.60), (Y 0.095))
    $g.Clip = $saved

    # --- 面罩 ---
    $visor = New-Object System.Drawing.Drawing2D.GraphicsPath
    $visor.AddBezier((P (X 0.27) (Y 0.512)), (P (X 0.40) (Y 0.552)), (P (X 0.60) (Y 0.552)), (P (X 0.73) (Y 0.512)))
    $visor.AddLine((P (X 0.71) (Y 0.585)), (P (X 0.29) (Y 0.585)))
    $visor.CloseFigure()
    $g.FillPath((B '#0b1018'), $visor)

    $glow = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#67e8f9')), ([Math]::Max(1.0, $S * 0.022))
    $g.DrawBezier($glow, (P (X 0.34) (Y 0.540)), (P (X 0.45) (Y 0.564)), (P (X 0.55) (Y 0.564)), (P (X 0.66) (Y 0.540)))

    # --- 天线 ---
    $ant = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#39424f')), ([Math]::Max(1.0, $S * 0.020))
    $g.DrawLine($ant, (P (X 0.30) (Y 0.33)), (P (X 0.17) (Y 0.13)))
    $g.FillEllipse((B '#e2483f'), (X 0.10), (Y 0.065), (X 0.125), (Y 0.125))

    # --- 胸口盾牌 ---
    $shield = @(
        (P (X 0.50) (Y 0.635)), (P (X 0.70) (Y 0.69)), (P (X 0.70) (Y 0.815)),
        (P (X 0.50) (Y 0.895)), (P (X 0.30) (Y 0.815)), (P (X 0.30) (Y 0.69))
    )
    $g.FillPolygon((B '#e8ecf2'), $shield)
    $sp = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#aab4c2')), ([Math]::Max(1.0, $S * 0.012))
    $g.DrawPolygon($sp, $shield)

    # --- 盾牌上的五角星 ---
    $cx = 0.50; $cy = 0.755; $R = 0.082
    $pts = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    for ($i = 0; $i -lt 10; $i++) {
        $ang = -[Math]::PI / 2 + $i * [Math]::PI / 5
        # 注意：PowerShell 变量不区分大小写，$rad 必须和 $R 不同名
        $rad = if ($i % 2 -eq 0) { $R } else { $R * 0.42 }
        # $cx/$cy 是归一化坐标，必须经过 X/Y 换算成像素
        $pts.Add((P (X ($cx + $rad * [Math]::Cos($ang))) (Y ($cy + $rad * [Math]::Sin($ang)))))
    }
    $g.FillPolygon((B '#b4272b'), $pts.ToArray())

    $g.Dispose()
}

function Save-Icon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    Draw-Helmet $g $size
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "saved $path ($size x $size)"
}

Save-Icon 512 (Join-Path $build 'icon.png')
Save-Icon 256 (Join-Path $build 'icon-256.png')
Save-Icon 64  (Join-Path $build 'tray.png')
