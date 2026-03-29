<a href="README.md" style="text-decoration:none; border:1px solid #ccc; padding:4px 8px; border-radius:4px;">English</a>
# Weport   
WEPORT(Weekly Report)는 주간 보고서 작성 및 관리를 위한 Tauri 기반 데스크톱 애플리케이션입니다. Rust 백엔드와 HTML/CSS/JavaScript 프론트엔드를 결합한 하이브리드앱으로, Windows 환경에 최적화되어 있습니다.   

## 기능   
* 보고용 섹션 및 카테고리 관리.   
* 보고 내용 뷰어.   
* 클립보드 복사.   

### 설치   
프로젝트의 루트 디렉토리에서 'pnpm install'을 이용하여 최초 한번은 필요한 모듈을 설치해야 합니다.   

### 배포 폴더 구성   
📂root   
 ├─📂data   
 |  ├─📄wp_manager.json   
 |  ├─📄5497d3bd-c006-4ff2-948a-ad4e40aaa7d9.dat   
 |  └─...   
 ├─📄weport.exe   
 ├─📄update.exe   
 ├─📄ver.msl   
 └─📄weport.json   

 ## 개발 도구 버전   
* RUST 버전 : v.1.94.0 (4a4ef493e 2026-03-02)   
* RUST edition : 2024   
* TAURI 버전 : v.2.10.3   
* TAURI-CLI 버전 : v.2.10.1   

## 버전정보   

### v.1.0.0   
* 최초 버전    

# 화면
*  아이콘 메뉴   
<img src="doc/icon_menu.png" width="48" height="109">    
*  보고 관리 화면   
<img src="doc/report_manager.png" width="639" height="436">    

# 개발 주요 사항   

## tauri.conf.json   
* tauri.conf.json : 스키마 파일을 로컬에 저장하여 참조함. (config/v2.json)   
* 로컬 참조시 타우리 버전 업데이트 후 문제가 발생되면, https://[schema.tauri.app/config/2](https://schema.tauri.app/config/2) 의 파일을 다운받아 사용 해야함.   

## Uncaught TypeError: Cannot read properties of undefined (reading 'core')   
* 발생 위치 : const { invoke } = window.__TAURI__.core;   
* devtools에 위의 위치에 해당 오류가 발생될 경우 build.rs의 주석문의 내용에 따라 다시 한번 빌드를 해주어야 함.   

## 실행 파일의 icon이 변경되지 않음   
* 콘솔창에서 프로젝트의 root 폴더 이동후 cargo tauri build 명령으로 실행 파일을 생성하면 실행파일의 아이콘이 변경됨.   

## 라이선스

Copyright (C) 2025 Monoslab. All rights reserved.   
This work is licensed under <a rel="license" href="https://github.com/MonosLab/weport?tab=License-1-ov-file">the Business Source License 1.1 - Monoslab (BUSL-1.1-Monoslab)</a>.   