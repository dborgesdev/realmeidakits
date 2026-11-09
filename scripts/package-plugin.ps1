$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pluginRoot = Join-Path $repoRoot 'wordpress/plugins/re-almeida-kits'
$releaseRoot = Join-Path $repoRoot 'wordpress/releases'
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression
$zipPath = Join-Path $releaseRoot 're-almeida-kits.zip'
$stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = @('re-almeida-kits.php', 'readme.txt')
    $files += Get-ChildItem -LiteralPath (Join-Path $pluginRoot 'includes') -Filter '*.php' -File | ForEach-Object { 'includes/' + $_.Name }
    $files += Get-ChildItem -LiteralPath (Join-Path $pluginRoot 'assets') -File | Where-Object { $_.Extension -in '.css', '.js' } | ForEach-Object { 'assets/' + $_.Name }
    foreach ($relative in ($files | Sort-Object)) {
        $entry = $archive.CreateEntry('re-almeida-kits/' + $relative, [System.IO.Compression.CompressionLevel]::Optimal)
        $entry.LastWriteTime = [DateTimeOffset]::new(2026, 10, 27, 0, 0, 0, [TimeSpan]::Zero)
        $target = $entry.Open()
        try {
            $bytes = [System.IO.File]::ReadAllBytes((Join-Path $pluginRoot $relative))
            $target.Write($bytes, 0, $bytes.Length)
        } finally { $target.Dispose() }
    }
} finally { $archive.Dispose(); $stream.Dispose() }
$sha = [System.Security.Cryptography.SHA256]::Create()
try { $hash = [System.BitConverter]::ToString($sha.ComputeHash([System.IO.File]::ReadAllBytes($zipPath))).Replace('-', '').ToLowerInvariant() }
finally { $sha.Dispose() }
[System.IO.File]::WriteAllText((Join-Path $releaseRoot 're-almeida-kits.zip.sha256'), "$hash  re-almeida-kits.zip`n")
Write-Output "Plugin gerado: $zipPath"
Write-Output "SHA256: $hash"
