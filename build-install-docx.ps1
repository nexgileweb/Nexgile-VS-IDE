param(
    [string]$OutputPath = "Nexgile-IDE_Installation.docx"
)

$ErrorActionPreference = "Stop"

# Helpers ---------------------------------------------------------------------

function XmlEscape([string]$s) {
    if ($null -eq $s) { return "" }
    return $s.Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;').Replace('"','&quot;')
}

$body = New-Object System.Text.StringBuilder

function Add-Heading([string]$text, [int]$level = 1) {
    $style = "Heading$level"
    $esc = XmlEscape $text
    [void]$body.AppendLine("<w:p><w:pPr><w:pStyle w:val=""$style""/></w:pPr><w:r><w:t xml:space=""preserve"">$esc</w:t></w:r></w:p>")
}

function Add-Para([string]$text, [switch]$Bold) {
    $rPr = if ($Bold) { "<w:rPr><w:b/></w:rPr>" } else { "" }
    $esc = XmlEscape $text
    [void]$body.AppendLine("<w:p><w:r>$rPr<w:t xml:space=""preserve"">$esc</w:t></w:r></w:p>")
}

function Add-MixedPara([object[]]$runs) {
    # runs: array of @{text=...; bold=$true/$false; code=$true/$false}
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append("<w:p>")
    foreach ($r in $runs) {
        $rProps = ""
        if ($r.bold -or $r.code) {
            $rProps = "<w:rPr>"
            if ($r.bold) { $rProps += "<w:b/>" }
            if ($r.code) { $rProps += "<w:rFonts w:ascii=""Consolas"" w:hAnsi=""Consolas"" w:cs=""Consolas""/>" }
            $rProps += "</w:rPr>"
        }
        $txt = XmlEscape $r.text
        [void]$sb.Append("<w:r>$rProps<w:t xml:space=""preserve"">$txt</w:t></w:r>")
    }
    [void]$sb.Append("</w:p>")
    [void]$body.AppendLine($sb.ToString())
}

function Add-Bullet([string]$text, [int]$level = 0) {
    $esc = XmlEscape $text
    [void]$body.AppendLine("<w:p><w:pPr><w:pStyle w:val=""ListBullet""/><w:numPr><w:ilvl w:val=""$level""/><w:numId w:val=""1""/></w:numPr></w:pPr><w:r><w:t xml:space=""preserve"">$esc</w:t></w:r></w:p>")
}

function Add-Numbered([string]$text) {
    $esc = XmlEscape $text
    [void]$body.AppendLine("<w:p><w:pPr><w:pStyle w:val=""ListNumber""/><w:numPr><w:ilvl w:val=""0""/><w:numId w:val=""2""/></w:numPr></w:pPr><w:r><w:t xml:space=""preserve"">$esc</w:t></w:r></w:p>")
}

function Add-Code([string]$text) {
    foreach ($line in ($text -split "`r?`n")) {
        $esc = XmlEscape $line
        [void]$body.AppendLine("<w:p><w:pPr><w:pStyle w:val=""CodeBlock""/></w:pPr><w:r><w:rPr><w:rFonts w:ascii=""Consolas"" w:hAnsi=""Consolas"" w:cs=""Consolas""/><w:sz w:val=""20""/></w:rPr><w:t xml:space=""preserve"">$esc</w:t></w:r></w:p>")
    }
}

function Add-Spacer() {
    [void]$body.AppendLine("<w:p/>")
}

# ---------------------------------------------------------------------------
# Document content
# ---------------------------------------------------------------------------

Add-Heading "Nexgile Code IDE - Installation Guide (Windows EC2)" 1
Add-Para "Audience: System administrators deploying Nexgile Code on a Windows EC2 instance."
Add-MixedPara @(
    @{text="Installer: "; bold=$true},
    @{text=".build\win32-x64\user-setup\NexgileCodeSetup.exe"; code=$true}
)
Add-MixedPara @(
    @{text="Architecture: "; bold=$true},
    @{text="x64 (Windows 64-bit)"}
)
Add-MixedPara @(
    @{text="Installer type: "; bold=$true},
    @{text="Inno Setup user installer (per-user, no admin rights required)"}
)
Add-Spacer

# 1. Prerequisites
Add-Heading "1. Prerequisites" 1
Add-Bullet "A running Amazon EC2 Windows instance (Windows Server 2019 / 2022 / 2025 or Windows 10/11 AMI), x86_64."
Add-Bullet "Minimum 2 vCPU, 4 GB RAM, 4 GB free disk space (8 GB+ recommended for workspaces and extensions)."
Add-Bullet "Administrator or standard user account on the instance with permission to write to the user profile."
Add-Bullet "Network access from the EC2 instance to the internet (only needed if extensions or AI features will fetch resources)."
Add-Bullet "An RDP client on your local machine, plus the EC2 key pair / Administrator password to retrieve."
Add-Bullet "Inbound RDP (TCP 3389) allowed from your IP in the EC2 security group attached to the instance."
Add-Spacer

# 2. Connect to the EC2 instance
Add-Heading "2. Connect to the EC2 Instance" 1
Add-Numbered "In the AWS Console, open EC2 > Instances and select the target instance."
Add-Numbered "Click Connect > RDP client. Click Get password and decrypt it with your private key (.pem) to retrieve the Administrator password."
Add-Numbered "Click Download remote desktop file to obtain the .rdp file."
Add-Numbered "Open the .rdp file, sign in as Administrator (or the IAM-mapped Windows user) using the decrypted password."
Add-Numbered "Once connected, open File Explorer and confirm you have a writable user profile (e.g. C:\Users\Administrator)."
Add-Spacer

# 3. Transfer the installer
Add-Heading "3. Transfer the Installer to the EC2 Instance" 1
Add-Para "Pick one of the following methods to copy NexgileCodeSetup.exe onto the EC2 machine."
Add-Spacer

Add-Heading "Option A - Copy through the RDP session (simplest)" 2
Add-Numbered "Before connecting, open the RDP client > Local Resources > More > check Drives, and select the local drive that contains the installer."
Add-Numbered "Connect via RDP. Inside the EC2 session, open File Explorer; your local drive appears under This PC as a redirected drive."
Add-Numbered "Copy NexgileCodeSetup.exe from the redirected drive into a folder on the EC2 machine, for example:"
Add-Code "C:\Users\Administrator\Downloads\NexgileCodeSetup.exe"
Add-Spacer

Add-Heading "Option B - Transfer via Amazon S3 (recommended for repeatable deployments)" 2
Add-Numbered "On the build machine, upload the installer to an S3 bucket your EC2 instance can read:"
Add-Code "aws s3 cp `".build\win32-x64\user-setup\NexgileCodeSetup.exe`" s3://your-bucket/nexgile/NexgileCodeSetup.exe"
Add-Numbered "On the EC2 instance (PowerShell), download it. The instance must have an IAM role with s3:GetObject on the bucket, or you must run aws configure first."
Add-Code "aws s3 cp s3://your-bucket/nexgile/NexgileCodeSetup.exe `"$env:USERPROFILE\Downloads\NexgileCodeSetup.exe`""
Add-Spacer

Add-Heading "Option C - Direct HTTPS / pre-signed URL" 2
Add-Numbered "Generate a pre-signed URL (expires in 1 hour) on the build machine:"
Add-Code "aws s3 presign s3://your-bucket/nexgile/NexgileCodeSetup.exe --expires-in 3600"
Add-Numbered "On the EC2 instance, download with PowerShell:"
Add-Code "Invoke-WebRequest -Uri `"<presigned-url>`" -OutFile `"$env:USERPROFILE\Downloads\NexgileCodeSetup.exe`""
Add-Spacer

# 4. Verify the installer
Add-Heading "4. Verify the Installer (Optional but Recommended)" 1
Add-Para "From an elevated PowerShell prompt on the EC2 instance, confirm size and Authenticode signature:"
Add-Code @"
Get-Item "$env:USERPROFILE\Downloads\NexgileCodeSetup.exe" | Select-Object Name,Length,LastWriteTime
Get-AuthenticodeSignature "$env:USERPROFILE\Downloads\NexgileCodeSetup.exe" | Format-List Status,SignerCertificate,StatusMessage
"@
Add-Para "Expected size is approximately 180 MB. Status NotSigned is expected for unsigned internal builds; for signed builds the Status should be Valid."
Add-Spacer

Add-MixedPara @(
    @{text="Note: "; bold=$true},
    @{text="If Windows SmartScreen blocks the file, right-click the EXE > Properties > General, tick Unblock, then click OK."}
)
Add-Spacer

# 5. Install (interactive)
Add-Heading "5. Install Nexgile Code (Interactive)" 1
Add-Numbered "Double-click NexgileCodeSetup.exe in File Explorer."
Add-Numbered "If User Account Control prompts, click Yes (only required if Windows blocks the unsigned binary)."
Add-Numbered "Accept the End User License Agreement when prompted."
Add-Numbered "Confirm the install location. The default for the user installer is:"
Add-Code "%LOCALAPPDATA%\Programs\Nexgile Code"
Add-Numbered "On the Select Additional Tasks screen, recommended selections:"
Add-Bullet "Create a desktop shortcut" 1
Add-Bullet "Add Open with Nexgile Code action to Windows Explorer file context menu" 1
Add-Bullet "Add Open with Nexgile Code action to Windows Explorer directory context menu" 1
Add-Bullet "Register Nexgile Code as an editor for supported file types" 1
Add-Bullet "Add to PATH (so 'nexgile' or 'code' command is available from the terminal)" 1
Add-Numbered "Click Install. Wait until the progress bar completes (typically 1-3 minutes)."
Add-Numbered "Leave Launch Nexgile Code checked and click Finish."
Add-Spacer

# 6. Install (silent / unattended)
Add-Heading "6. Install Silently (Unattended Deployment)" 1
Add-Para "For automated EC2 provisioning (User Data scripts, SSM Run Command, Ansible, etc.), use Inno Setup silent switches. Run from PowerShell:"
Add-Code @"
Start-Process -FilePath "$env:USERPROFILE\Downloads\NexgileCodeSetup.exe" `
    -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART','/MERGETASKS=!runcode,addcontextmenufiles,addcontextmenufolders,associatewithfiles,addtopath','/LOG=C:\Windows\Temp\NexgileCodeSetup.log' `
    -Wait -PassThru | Select-Object ExitCode
"@
Add-Para "Common Inno Setup switches:"
Add-MixedPara @( @{text="/VERYSILENT"; code=$true}, @{text=" - hide installer UI and progress bar."} )
Add-MixedPara @( @{text="/SILENT"; code=$true}, @{text=" - hide UI but show the progress bar."} )
Add-MixedPara @( @{text="/SUPPRESSMSGBOXES"; code=$true}, @{text=" - suppress dialog boxes (use with /SILENT or /VERYSILENT)."} )
Add-MixedPara @( @{text="/NORESTART"; code=$true}, @{text=" - never restart even if the installer requests it."} )
Add-MixedPara @( @{text="/DIR=`"<path>`""; code=$true}, @{text=" - override the install directory."} )
Add-MixedPara @( @{text="/LOG=`"<file>`""; code=$true}, @{text=" - write a verbose installation log."} )
Add-MixedPara @( @{text="/MERGETASKS=`"<list>`""; code=$true}, @{text=" - select optional tasks. Prefix a task name with ! to disable it (e.g. !runcode skips auto-launch after install)."} )
Add-Spacer

Add-MixedPara @(
    @{text="Available task names: "; bold=$true},
    @{text="desktopicon, quicklaunchicon, addcontextmenufiles, addcontextmenufolders, associatewithfiles, addtopath, runcode."}
)
Add-Spacer

Add-Heading "Sample EC2 User Data snippet (PowerShell)" 2
Add-Code @"
<powershell>
`$ErrorActionPreference = 'Stop'
`$installer = "`$env:TEMP\NexgileCodeSetup.exe"
aws s3 cp s3://your-bucket/nexgile/NexgileCodeSetup.exe `$installer
Start-Process -FilePath `$installer ``
    -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART','/MERGETASKS=!runcode,addtopath' ``
    -Wait
Remove-Item `$installer -Force
</powershell>
"@
Add-Spacer

# 7. Post-install verification
Add-Heading "7. Post-Install Verification" 1
Add-Numbered "Confirm the install directory exists:"
Add-Code "Test-Path `"$env:LOCALAPPDATA\Programs\Nexgile Code\Nexgile Code.exe`""
Add-Numbered "Confirm the registry uninstall entry was created:"
Add-Code "Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object DisplayName -like 'Nexgile Code*' | Select-Object DisplayName,DisplayVersion,InstallLocation"
Add-Numbered "Open a NEW PowerShell window (so PATH refreshes) and check the CLI is wired up:"
Add-Code "code --version"
Add-Numbered "Launch the IDE from Start Menu > Nexgile Code, or:"
Add-Code "& `"$env:LOCALAPPDATA\Programs\Nexgile Code\Nexgile Code.exe`""
Add-Spacer

# 8. First-run setup
Add-Heading "8. First-Run Configuration" 1
Add-Bullet "Sign in / activate the Nexgile Code AI extension when prompted (if your build ships the bundled Nexgile AI extension)."
Add-Bullet "Open File > Preferences > Settings to confirm telemetry, update channel, and proxy settings match your environment."
Add-Bullet "If the EC2 instance sits behind a corporate proxy, configure it under Settings > Application > Proxy, or set HTTPS_PROXY in the system environment."
Add-Bullet "Install or pin any required workspace extensions through the Extensions view (Ctrl+Shift+X)."
Add-Spacer

# 9. Troubleshooting
Add-Heading "9. Troubleshooting" 1

Add-Heading "Installer is blocked by SmartScreen / Defender" 2
Add-Para "Right-click the EXE > Properties > Unblock, then re-run. For unattended installs, pre-stage the file or sign the binary."
Add-Spacer

Add-Heading "Exit code is non-zero" 2
Add-Para "Inno Setup exit codes: 0 = success, 1 = setup failed to initialize, 2 = user cancelled, 3 = a fatal error occurred during preparation, 4 = a fatal error occurred during installation, 5 = user cancelled during installation, 6 = setup terminated by another process, 7 = preparing-to-install step failed, 8 = needs restart. Inspect the /LOG file for the actual error."
Add-Spacer

Add-Heading "code command is not recognized" 2
Add-Para "The PATH update only applies to NEW shells. Close and reopen PowerShell, or run:"
Add-Code "`$env:Path = [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + [System.Environment]::GetEnvironmentVariable('Path','Machine')"
Add-Spacer

Add-Heading "App fails to launch on a headless EC2 instance" 2
Add-Para "Nexgile Code is a desktop GUI application; it must be started inside an interactive Windows session (RDP or console). It will not run as a Windows service."
Add-Spacer

Add-Heading "Antivirus quarantines the binary" 2
Add-Para "Add an exclusion for the install directory in Windows Defender:"
Add-Code "Add-MpPreference -ExclusionPath `"$env:LOCALAPPDATA\Programs\Nexgile Code`""
Add-Spacer

# 10. Upgrade
Add-Heading "10. Upgrading to a New Build" 1
Add-Para "Run the new NexgileCodeSetup.exe with the same install mode (interactive or silent). Inno Setup detects the existing per-user install via AppId and performs an in-place upgrade. User settings under %APPDATA%\Nexgile Code and %USERPROFILE%\.nexgile are preserved."
Add-Spacer

# 11. Uninstall
Add-Heading "11. Uninstall" 1
Add-Para "Interactive: Settings > Apps > Installed apps > Nexgile Code > Uninstall."
Add-Para "Silent:"
Add-Code @"
`$uninst = (Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* |
           Where-Object DisplayName -like 'Nexgile Code*').UninstallString
Start-Process -FilePath `$uninst -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART' -Wait
"@
Add-Para "User-level data and settings are NOT removed by the uninstaller. To purge them as well:"
Add-Code @"
Remove-Item -Recurse -Force "$env:APPDATA\Nexgile Code"
Remove-Item -Recurse -Force "$env:USERPROFILE\.nexgile"
"@
Add-Spacer

# 12. Reference
Add-Heading "12. Reference" 1
Add-MixedPara @( @{text="Installer artifact: "; bold=$true}, @{text=".build\win32-x64\user-setup\NexgileCodeSetup.exe"; code=$true} )
Add-MixedPara @( @{text="Default install path: "; bold=$true}, @{text="%LOCALAPPDATA%\Programs\Nexgile Code"; code=$true} )
Add-MixedPara @( @{text="User config path: "; bold=$true}, @{text="%APPDATA%\Nexgile Code"; code=$true} )
Add-MixedPara @( @{text="Per-user (no admin): "; bold=$true}, @{text="Yes - uses Inno Setup user-mode installer (no UAC required for fresh install)."} )
Add-MixedPara @( @{text="Publisher: "; bold=$true}, @{text="Nexgile (https://nexgile.com/)"} )
Add-Spacer

# ---------------------------------------------------------------------------
# Build the DOCX (a ZIP of OpenXML parts)
# ---------------------------------------------------------------------------

$tmp = Join-Path $env:TEMP ("docx_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null
New-Item -ItemType Directory -Path "$tmp\_rels" | Out-Null
New-Item -ItemType Directory -Path "$tmp\word" | Out-Null
New-Item -ItemType Directory -Path "$tmp\word\_rels" | Out-Null
New-Item -ItemType Directory -Path "$tmp\docProps" | Out-Null

# UTF-8 without BOM keeps DOCX consumers happy
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Write-Xml([string]$path, [string]$content) {
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}

# [Content_Types].xml
$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
'@
Write-Xml "$tmp\[Content_Types].xml" $contentTypes

# _rels/.rels
$rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
'@
Write-Xml "$tmp\_rels\.rels" $rootRels

# word/_rels/document.xml.rels
$docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>
'@
Write-Xml "$tmp\word\_rels\document.xml.rels" $docRels

# docProps/core.xml
$nowIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$coreXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Nexgile IDE - Installation Guide</dc:title>
  <dc:creator>Nexgile</dc:creator>
  <cp:lastModifiedBy>Nexgile</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$nowIso</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$nowIso</dcterms:modified>
</cp:coreProperties>
"@
Write-Xml "$tmp\docProps\core.xml" $coreXml

# docProps/app.xml
$appXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Nexgile</Application>
</Properties>
'@
Write-Xml "$tmp\docProps\app.xml" $appXml

# word/styles.xml
$stylesXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="360" w:after="160"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:color w:val="1F3864"/>
      <w:sz w:val="36"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="240" w:after="120"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:color w:val="2E74B5"/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:spacing w:before="200" w:after="80"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:color w:val="1F4E79"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="60"/>
      <w:ind w:left="720" w:hanging="360"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListNumber">
    <w:name w:val="List Number"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="60"/>
      <w:ind w:left="720" w:hanging="360"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock">
    <w:name w:val="Code Block"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
      <w:shd w:val="clear" w:color="auto" w:fill="F4F4F4"/>
      <w:ind w:left="240"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
      <w:sz w:val="20"/>
    </w:rPr>
  </w:style>
</w:styles>
'@
Write-Xml "$tmp\word\styles.xml" $stylesXml

# word/numbering.xml
$numberingXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x2022;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>
    </w:lvl>
    <w:lvl w:ilvl="1">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="&#x25E6;"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>
'@
Write-Xml "$tmp\word\numbering.xml" $numberingXml

# word/document.xml
$docPrefix = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
'@
$docSuffix = @'
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
'@
$documentXml = $docPrefix + $body.ToString() + $docSuffix
Write-Xml "$tmp\word\document.xml" $documentXml

# Zip everything into the .docx
$resolvedOut = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path (Get-Location) $OutputPath }
if (Test-Path $resolvedOut) { Remove-Item $resolvedOut -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Manually pack with forward-slash entry names (OpenXML spec requirement)
$entries = @(
    @{ src = "$tmp\[Content_Types].xml";        zip = "[Content_Types].xml" },
    @{ src = "$tmp\_rels\.rels";                zip = "_rels/.rels" },
    @{ src = "$tmp\docProps\app.xml";           zip = "docProps/app.xml" },
    @{ src = "$tmp\docProps\core.xml";          zip = "docProps/core.xml" },
    @{ src = "$tmp\word\_rels\document.xml.rels"; zip = "word/_rels/document.xml.rels" },
    @{ src = "$tmp\word\document.xml";          zip = "word/document.xml" },
    @{ src = "$tmp\word\numbering.xml";         zip = "word/numbering.xml" },
    @{ src = "$tmp\word\styles.xml";            zip = "word/styles.xml" }
)

$fs = [System.IO.File]::Open($resolvedOut, [System.IO.FileMode]::Create)
try {
    $zip = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($e in $entries) {
            $zipEntry = $zip.CreateEntry($e.zip, [System.IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $zipEntry.Open()
            try {
                $bytes = [System.IO.File]::ReadAllBytes($e.src)
                $entryStream.Write($bytes, 0, $bytes.Length)
            } finally { $entryStream.Dispose() }
        }
    } finally { $zip.Dispose() }
} finally { $fs.Dispose() }

Remove-Item $tmp -Recurse -Force

Write-Output "Wrote: $resolvedOut"
Get-Item $resolvedOut | Select-Object FullName, Length, LastWriteTime | Format-List
