# User-level Open With registration for Markdown Viewer (no admin).
# Windows may still require Settings -> Default apps for locked UserChoice.

$ErrorActionPreference = 'Stop'
$exe = Join-Path $env:LOCALAPPDATA 'Programs\Markdown Viewer\Markdown Viewer.exe'
if (-not (Test-Path -LiteralPath $exe)) {
  throw "Markdown Viewer.exe not found at $exe"
}

$progId = 'MarkdownViewer.md'
$cmd = '"{0}" "%1"' -f $exe
$defaultName = '(default)'

New-Item -Path "HKCU:\Software\Classes\$progId" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$progId" -Name $defaultName -Value 'Markdown Document (Markdown Viewer)'
New-Item -Path "HKCU:\Software\Classes\$progId\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$progId\DefaultIcon" -Name $defaultName -Value ('{0},0' -f $exe)
New-Item -Path "HKCU:\Software\Classes\$progId\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$progId\shell\open\command" -Name $defaultName -Value $cmd

foreach ($ext in @('.md', '.markdown', '.mdown', '.mkd', '.mkdn', '.mdx')) {
  $base = "HKCU:\Software\Classes\$ext"
  New-Item -Path $base -Force | Out-Null
  New-Item -Path "$base\OpenWithProgids" -Force | Out-Null
  New-ItemProperty -Path "$base\OpenWithProgids" -Name $progId -PropertyType String -Value '' -Force | Out-Null

  $uc = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$ext\UserChoice"
  if (-not (Test-Path $uc)) {
    Set-ItemProperty -Path $base -Name $defaultName -Value $progId -Force
  } else {
    Write-Host "UserChoice exists for $ext - use Settings Default apps or Open with Always to switch default."
  }

  $ow = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\$ext\OpenWithProgids"
  New-Item -Path $ow -Force | Out-Null
  try {
    New-ItemProperty -Path $ow -Name $progId -PropertyType String -Value '' -Force | Out-Null
  } catch {
    # ignore
  }
}

Add-Type -Namespace Win32 -Name NativeMethod -MemberDefinition @'
[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
'@
[Win32.NativeMethod]::SHChangeNotify(0x8000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)

$openCmd = (Get-ItemProperty "HKCU:\Software\Classes\$progId\shell\open\command").$defaultName
$mdDef = (Get-ItemProperty 'HKCU:\Software\Classes\.md').$defaultName
Write-Host "Registered ProgId: $progId"
Write-Host "Command: $openCmd"
Write-Host ".md default: $mdDef"
if (Test-Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\UserChoice') {
  Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\UserChoice' | Format-List
} else {
  Write-Host 'No UserChoice lock for .md'
}
