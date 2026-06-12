!include MUI2.nsh

!define PRODUCTNAME "Weport"
!define VERSION "1.0.1"

Name "Weport"
; 설치 파일
OutFile "..\..\bundle\nsis\${PRODUCTNAME}_${VERSION}_setup.exe"
; 기본 설치 경로 지정
InstallDir "C:\Weport"
; 실행 권한 (관리자 권한)
RequestExecutionLevel admin

; 이전 설치 경로 기억 (레지스트리)
InstallDirRegKey HKCU "Software\Monoslab\Weport" "Install_Dir"

; --- MUI2 페이지 구성 ---
!insertmacro MUI_PAGE_LICENSE "..\..\..\..\license.rtf"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; 언인스톨러 페이지
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; 설치 완료 후 실행 옵션
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Weport 실행"
!define MUI_FINISHPAGE_RUN_FUNCTION LaunchWeport
; --- MUI2 페이지 종료 ---
!insertmacro MUI_PAGE_FINISH

Function LaunchWeport
  Exec "$INSTDIR\\weport.exe"
FunctionEnd

; --- 언어 지정 (필수) ---
!insertmacro MUI_LANGUAGE "Korean"

; 설치 페이지 구성
; Page license
; Page directory ; 사용자에게 설치 경로 선택 화면 제공
; Page instfiles
; 라이선스 파일 지정 (externalBin으로 포함되므로 경로 단순화; RTF 또는 TXT 가능)
; LicenseData "..\..\..\..\license.rtf"

; --- Install Section ---
Section "Install"
  SetOutPath "$INSTDIR"
  ;File /r "nsis\*.*"

  ; 메인 앱 실행 파일 포함
  File "..\..\weport.exe"
  ; nsis 폴더 내 파일 직접 복사
  File "..\..\..\..\bin\aurora4m.cfg"
  File "..\..\..\..\bin\aurora4m.exe"
  File "..\..\..\..\bin\aurora4m_lib.dll"
  File "..\..\..\..\bin\ver.dat"
  File "..\..\..\..\bin\weport.json"

  ; 바탕화면 아이콘
  CreateShortcut "$DESKTOP\weport.lnk" "$INSTDIR\weport.exe"

  ; 시작 메뉴 아이콘
  CreateDirectory "$SMPROGRAMS\weport"
  CreateShortcut "$SMPROGRAMS\weport\weport.lnk" "$INSTDIR\weport.exe"

  ; 설치 경로에 data 폴더 생성
  CreateDirectory "$INSTDIR\data"

  ; 언인스톨러 생성
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$SMPROGRAMS\weport\uninstall weport.lnk" "$INSTDIR\Uninstall.exe"

  ; 설치 경로를 레지스트리에 저장
  WriteRegStr HKCU "Software\Monoslab\Weport" "Install_Dir" "$INSTDIR"

  ; 제어판 등록
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport" "DisplayName" "${PRODUCTNAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport" "DisplayIcon" "$INSTDIR\weport.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport" "Publisher" "Monoslab"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport" "DisplayVersion" "${VERSION}"
SectionEnd

; --- Uninstall Section ---
Section "Uninstall"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Weport"
  DeleteRegKey HKCU "Software\Monoslab\Weport"
  Delete "$INSTDIR\weport.exe"
  Delete "$INSTDIR\aurora4m.cfg"
  Delete "$INSTDIR\aurora4m.exe"
  Delete "$INSTDIR\aurora4m_lib.dll"
  Delete "$INSTDIR\ver.dat"
  Delete "$INSTDIR\weport.json"
  Delete "$DESKTOP\weport.lnk"
  RMDir /r "$SMPROGRAMS\weport"
  RMDir /r "$INSTDIR\data"
  RMDir "$INSTDIR"
SectionEnd