; NSIS installer script for Sora Enterprise
; Additional configuration for enterprise installations

!macro customInit
  ; Check for previous installation
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{12345678-1234-1234-1234-123456789012}" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO|MB_ICONQUESTION "A previous version of Sora Enterprise is installed. Would you like to uninstall it first?" IDNO +3
    ExecWait '$0 /S _?=$INSTDIR'
    Delete '$0'
  ${EndIf}
!macroend

!macro customInstall
  ; Create registry entries for enterprise features
  WriteRegStr HKLM "SOFTWARE\Sora\Enterprise" "Version" "${VERSION}"
  WriteRegStr HKLM "SOFTWARE\Sora\Enterprise" "InstallPath" "$INSTDIR"
  WriteRegDWORD HKLM "SOFTWARE\Sora\Enterprise" "EnterpriseMode" 1
  
  ; Set file associations
  WriteRegStr HKCR ".toml" "" "SoraEnterprise.TOML"
  WriteRegStr HKCR "SoraEnterprise.TOML" "" "TOML Configuration File"
  WriteRegStr HKCR "SoraEnterprise.TOML\DefaultIcon" "" "$INSTDIR\resources\icons\toml.ico"
  WriteRegStr HKCR "SoraEnterprise.TOML\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}" "%1"'
  
  WriteRegStr HKCR ".rs" "" "SoraEnterprise.Rust"
  WriteRegStr HKCR "SoraEnterprise.Rust" "" "Rust Source File"
  WriteRegStr HKCR "SoraEnterprise.Rust\DefaultIcon" "" "$INSTDIR\resources\icons\rust.ico"
  WriteRegStr HKCR "SoraEnterprise.Rust\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}" "%1"'
  
  ; Protocol handlers
  WriteRegStr HKCR "sora" "" "URL:Sora Protocol"
  WriteRegStr HKCR "sora" "URL Protocol" ""
  WriteRegStr HKCR "sora\DefaultIcon" "" "$INSTDIR\${PRODUCT_FILENAME}"
  WriteRegStr HKCR "sora\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}" "%1"'
  
  WriteRegStr HKCR "stellar" "" "URL:Stellar Protocol"
  WriteRegStr HKCR "stellar" "URL Protocol" ""
  WriteRegStr HKCR "stellar\DefaultIcon" "" "$INSTDIR\${PRODUCT_FILENAME}"
  WriteRegStr HKCR "stellar\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}" "%1"'
  
  WriteRegStr HKCR "soroban" "" "URL:Soroban Protocol"
  WriteRegStr HKCR "soroban" "URL Protocol" ""
  WriteRegStr HKCR "soroban\DefaultIcon" "" "$INSTDIR\${PRODUCT_FILENAME}"
  WriteRegStr HKCR "soroban\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey HKLM "SOFTWARE\Sora\Enterprise"
  
  ; Remove file associations
  DeleteRegKey HKCR ".toml"
  DeleteRegKey HKCR "SoraEnterprise.TOML"
  DeleteRegKey HKCR ".rs"
  DeleteRegKey HKCR "SoraEnterprise.Rust"
  
  ; Remove protocol handlers
  DeleteRegKey HKCR "sora"
  DeleteRegKey HKCR "stellar"
  DeleteRegKey HKCR "soroban"
!macroend

!macro customHeader
  ; Custom header for enterprise installer
  !define MUI_ICON "resources\icon.ico"
  !define MUI_UNICON "resources\icon.ico"
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "resources\installer-header.bmp"
  !define MUI_WELCOMEFINISHPAGE_BITMAP "resources\installer-sidebar.bmp"
!macroend
