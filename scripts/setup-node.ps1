$ErrorActionPreference = 'Stop'
$nodeZip = "C:\Users\sayali\AppData\Local\Temp\node-v20.zip"
$targetDir = "C:\Users\sayali\AppData\Local\Programs\nodejs"
$tempExtract = "C:\Users\sayali\AppData\Local\Programs\temp_node"

if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

Write-Host "Downloading Node.js v20.18.0..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip" -OutFile $nodeZip

Write-Host "Extracting Node.js archive..."
Expand-Archive -Path $nodeZip -DestinationPath $tempExtract -Force

Write-Host "Configuring Node.js directory..."
Copy-Item -Path "$tempExtract\node-v20.18.0-win-x64\*" -Destination $targetDir -Recurse -Force

# Clean up temporary folders
Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $nodeZip -Force -ErrorAction SilentlyContinue

# Verify node and npm
$nodeExe = "$targetDir\node.exe"
$npmCmd = "$targetDir\npm.cmd"

Write-Host "Node version:"
& $nodeExe -v
Write-Host "NPM version:"
& $npmCmd -v

Write-Host "Node.js successfully configured at $targetDir"
