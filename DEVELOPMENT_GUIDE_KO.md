<a href="DEVELOPMENT_GUIDE_EN.md" style="text-decoration:none; border:1px solid #ccc; padding:4px 8px; border-radius:4px;">English</a>
# WEPORT 개발 가이드

## 📋 개요

WEPORT(Weekly Report)는 주간 보고서 작성 및 관리를 위한 Tauri 기반 데스크톱 애플리케이션입니다. Rust 백엔드와 HTML/CSS/JavaScript 프론트엔드를 결합한 크로스 플랫폼 애플리케이션으로, Windows 환경에 최적화되어 있습니다.

## 🏗️ 아키텍처

### 기술 스택
- **백엔드**: Rust 1.94.0 (Edition 2024)
- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **Framework**: Tauri v2.10.3
- **빌드 도구**: Tauri CLI v2.10.1
- **의존성 관리**: pnpm

### 프로젝트 구조
```
📦weport
├──📂src                         # 프론트엔드 소스
│   ├──📄main.js                 # 메인 애플리케이션 로직
│   ├──📄index.html              # 메인 UI
│   ├──📄styles.css              # 메인 스타일시트
│   ├──📄icon.html               # 아이콘 UI
│   ├──📄icon.css                # 아이콘 스타일시트
│   ├──📄icon.js                 # 아이콘 관련 로직
│   └──📂assets                  # 정적 리소스
│
├──📂src-tauri                   # Rust 백엔드
│   ├──📂src
│   │   ├──📄main.rs             # 애플리케이션 엔트리포인트
│   │   ├──📄lib.rs              # 메인 라이브러리
│   │   ├──📂commands            # Tauri 명령어
│   │   │   ├──📄win_manager.rs  # 창 관리
│   │   │   └──📄data_manager.rs # 데이터 관리
│   │   ├──📂module              # 유틸리티 모듈
│   │   │   ├──📄registry.rs     # Windows 레지스트리
│   │   │   └──📄debug.rs        # 디버깅 유틸리티
│   │   └──📂common              # 공통 정의 및 상수
│   ├──📄Cargo.toml              # Rust 의존성
│   └──📄tauri.conf.json         # Tauri 설정
│
└──📂dist-files                  # 배포 파일
    └──📂data                    # 애플리케이션 샘플 데이터
```

## 🔧 개발 환경 설정

### 필수 요구사항
- **Rust**: v1.94.0 이상
- **Node.js**: v16 이상
- **pnpm**: 패키지 관리자
- **Tauri CLI**: v2.10.1

### 설치 및 설정
```bash
# 1. Rust 설치 (rustup 사용)
rustup install 1.94.0
rustup default 1.94.0

# 2. Tauri CLI 설치
cargo install tauri-cli@2.10.1

# 3. 프로젝트 의존성 설치
pnpm install

# 4. 개발 서버 실행
cargo tauri dev
```

### 빌드 및 배포
```bash
# 개발용 빌드
cargo tauri build --debug

# 프로덕션 빌드
cargo tauri build

# 실행 파일 아이콘 적용을 위한 완전한 빌드
cargo tauri build --force
```

## 🏛️ 핵심 컴포넌트

### 1. 이중 창 시스템

WEPORT는 두 개의 창으로 구성됩니다:

#### 메인 창 (`src/index.html`)
- **용도**: 주요 사용자 인터페이스
- **크기**: 800×600 (최소 600×200)
- **특징**: 리사이징 가능, 프레임 없음
- **모드**: 관리, 작성, 보기, 설정 탭

#### 아이콘 창 (`src/icon.html`)
- **용도**: 바탕화면 트레이 아이콘 역할
- **크기**: 32×96 픽셀
- **특징**: 투명 배경, 드래그 가능
- **기능**: 더블클릭으로 메인 창 토글

### 2. Rust 백엔드 모듈

#### Commands (`src-tauri/src/commands/`)
Tauri 백엔드와 프론트엔드 간 통신을 담당:

**`win_manager.rs`**
WEPORT의 윈도우를 관리 합니다.
```rust
#[command]
pub fn show_main(app: AppHandle, show: bool) -> Result<(), String>
#[command]
pub fn exit_app(app: AppHandle)
#[command]
pub fn move_main_window(app: AppHandle, x: i32, y: i32) -> Result<(), String>
```

**`data_manager.rs`**
WEPORT의 설정 및 데이터를 관리합니다.
```rust
#[command]
pub fn read_config() -> Result<String, String>
#[command]
pub fn save_data(data: String) -> Result<(), String>
#[command]
pub fn get_uuid() -> String
```

#### Modules (`src-tauri/src/module/`)
핵심 유틸리티 기능:

**`registry.rs`**
- Windows 레지스트리 관리
- 설정 불러오기/저장

**`debug.rs`**
- Windows OutputDebugString API 래핑
- 매크로 기반 로깅

### 3. 데이터 관리 시스템

#### 설정 파일
- **`weport.json`**: 애플리케이션 설정
- **`wp_manager.json`**: 주 데이터 관리
- **`{uuid}.dat`**: 개별 보고서 데이터

#### 데이터 구조
```javascript
// wp_manager.json 구조
{
  "name": "사용자명",
  "section": [
    { "id": 1, "name": "연구개발" },
    { "id": 2, "name": "업무지원/프로젝트" },
    { "id": 3, "name": "기타" }
  ],
  "category": [
    {
      "id": 1,
      "name": "카테고리명",
      "section_id": 1,
      "items": [
        {
          "id": "uuid",
          "title": "항목명",
          "status": "in_progress|completed|cancelled|pending"
        }
      ]
    }
  ]
}
```

## 🎯 주요 기능 구현 가이드

### 1. 새로운 Tauri Command 추가

```rust
// src-tauri/src/commands/your_module.rs
use tauri::command;

#[command]
pub fn your_new_command(param: String) -> Result<String, String> {
    // 구현 로직
    Ok("success".to_string())
}

// src-tauri/src/lib.rs에 추가
use commands::your_module::your_new_command;

// Builder에 등록
.invoke_handler(tauri::generate_handler![
    your_new_command,
    // ... 기타 명령어들
])
```

### 2. 프론트엔드에서 Rust 함수 호출

```javascript
// src/main.js
const { invoke } = window.__TAURI__.core;

async function callRustFunction() {
    try {
        const result = await invoke('your_new_command', { param: 'value' });
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### 3. 새로운 UI 모드 추가

```html
<!-- src/index.html -->
<button class="tab-btn" onclick="showScreen('new-mode', this)">새 모드</button>

<div id="new-mode" class="tab-content">
    <!-- 새로운 UI 컨텐츠 -->
</div>
```

```javascript
// src/main.js
function showScreen(screenId, buttonElement) {
    // 모든 탭 숨기기
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 선택된 탭 표시
    document.getElementById(screenId).classList.add('active');
    
    // 버튼 상태 업데이트
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    buttonElement.classList.add('active');
}
```

## 🐛 디버깅 및 문제 해결

### 일반적인 문제들

#### 1. `window.__TAURI__` 정의되지 않음
**원인**: 빌드 과정에서 Tauri 컨텍스트가 주입되지 않음
**해결**: 
```bash
cargo tauri build --force
```

#### 2. 실행 파일 아이콘 미적용
**원인**: 아이콘 리소스가 제대로 빌드되지 않음
**해결**: 프로젝트 루트에서 직접 빌드
```bash
cd /path/to/weport
cargo tauri build
```

#### 3. 레지스트리 접근 오류
**원인**: 권한 부족 또는 키 경로 오류
**해결**: 관리자 권한으로 실행 또는 키 경로 확인

### 디버깅 도구

#### 1. Rust 디버그 출력
```rust
use crate::print_out;

print_out!("Debug message: {}", value);
```

#### 2. JavaScript 디버깅
```javascript
// 브라우저 개발자 도구 사용
console.log('Debug info:', data);

// Tauri 디버그 모드에서 devtools 열기
```

#### 3. 빌드 로그 확인
```bash
# 상세 빌드 로그
cargo tauri build --verbose

# 개발 모드에서 상세 로그
RUST_LOG=debug cargo tauri dev
```

## 📊 성능 최적화

### 1. Rust 최적화
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
```

### 2. 번들 크기 최적화
- 불필요한 의존성 제거
- 에셋 압축 및 최적화
- Tree shaking 적용

## 🔒 보안 고려사항

### 1. CSP (Content Security Policy)
```json
// tauri.conf.json
"security": {
    "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'"
}
```

### 2. 파일 시스템 접근
- 필요한 경로만 허용
- 사용자 입력 검증
- 경로 탐색 공격 방지

### 3. 레지스트리 접근
- 최소 권한 원칙
- 안전한 키 경로 사용
- 에러 처리 강화

## 🚀 배포 가이드

### 1. 배포 파일 구조
```
weport-release/
├── weport.exe          # 메인 실행파일
├── weport.json         # 설정 파일
├── data/               # 데이터 디렉토리
│   └── wp_manager.json # 초기 데이터
├── update.exe          # 업데이트
└── ver.msl             # 버전 정보
```

### 2. 인스톨러 생성
```bash
# Windows MSI 인스톨러
cargo tauri build --target x86_64-pc-windows-msvc

# NSIS 인스톨러
cargo tauri build --bundles nsis
```

### 3. 자동 업데이트
Tauri 2.x의 업데이트 시스템을 활용하여 자동 업데이트 구현 가능

## 📝 코딩 컨벤션

### Rust 코딩 스타일
- `rustfmt` 사용
- `clippy` 린터 준수
- 모든 공개 함수에 문서 주석
- 에러 처리에 `Result` 타입 사용

### JavaScript 코딩 스타일
- ES6+ 문법 사용
- 함수명은 camelCase
- 상수는 UPPER_CASE
- async/await 선호

### 파일 구조 규칙
- 모듈별 파일 분리
- 기능별 디렉토리 구성
- 명확한 네이밍 컨벤션

## 🧪 테스트 전략

### 1. 단위 테스트
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_name() {
        // 테스트 구현
    }
}
```

### 2. 수동 테스트 체크리스트
- [ ] 창 표시/숨김 기능
- [ ] 데이터 저장/로드
- [ ] 레지스트리 읽기/쓰기

---

*이 문서는 WEPORT v1.0.0 기준으로 작성되었습니다. 프로젝트 업데이트에 따라 내용이 변경될 수 있습니다.*