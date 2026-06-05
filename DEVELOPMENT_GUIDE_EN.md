<a href="DEVELOPMENT_GUIDE_KO.md" style="text-decoration:none; border:1px solid #ccc; padding:4px 8px; border-radius:4px;">한국어</a>

# WEPORT Development Guide

## Overview

WEPORT (Weekly Report) is a Tauri-based desktop application for creating and managing weekly reports. It is a cross-platform application that combines a Rust backend with an HTML/CSS/JavaScript frontend, optimized for Windows environments.

## Architecture

### Tech Stack

- **Backend**: Rust 1.94.0 (Edition 2024)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Framework**: Tauri v2.10.3
- **Build Tool**: Tauri CLI v2.10.1
- **Dependency Management**: pnpm

### Project Structure

```text
📦weport
├──📂src                         # Frontend source
│   ├──📄main.js                 # Main application logic
│   ├──📄index.html              # Main UI
│   ├──📄styles.css              # Main stylesheet
│   ├──📄icon.html               # Icon UI
│   ├──📄icon.css                # Icon stylesheet
│   ├──📄icon.js                 # Icon-related logic
│   └──📂assets                  # Static resources
│
├──📂src-tauri                   # Rust backend
│   ├──📂src
│   │   ├──📄main.rs             # Application entry point
│   │   ├──📄lib.rs              # Main library
│   │   ├──📂commands            # Tauri commands
│   │   │   ├──📄win_manager.rs  # Window management
│   │   │   └──📄data_manager.rs # Data management
│   │   ├──📂module              # Utility modules
│   │   │   ├──📄registry.rs     # Windows registry
│   │   │   └──📄debug.rs        # Debugging utilities
│   │   └──📂common              # Shared definitions and constants
│   ├──📄Cargo.toml              # Rust dependencies
│   └──📄tauri.conf.json         # Tauri configuration
│
└──📂dist-files                  # Distribution files
    └──📂data                    # Sample data
```

## Development Environment Setup

### Prerequisites

- **Rust**: v1.94.0 or later
- **Node.js**: v16 or later
- **pnpm**: Package manager
- **Tauri CLI**: v2.10.1

### Installation and Setup

```bash
# 1. Install Rust (using rustup)
rustup install 1.94.0
rustup default 1.94.0

# 2. Install Tauri CLI
cargo install tauri-cli@2.10.1

# 3. Install project dependencies
pnpm install

# 4. Run development server
cargo tauri dev
```

### Build and Deployment

```bash
# Debug build
cargo tauri build --debug

# Production build
cargo tauri build

# Full rebuild to apply executable icon changes
cargo tauri build --force
```

## Core Components

### 1. Dual Window System

WEPORT consists of two windows:

#### Main Window (`src/index.html`)

- **Purpose**: Main user interface
- **Size**: 800x600 (minimum 600x200)
- **Features**: Resizable, frameless
- **Modes**: Management, Write, View, Settings tabs

#### Icon Window (`src/icon.html`)

- **Purpose**: Desktop tray icon-like window
- **Size**: 32x96 pixels
- **Features**: Transparent background, draggable
- **Function**: Toggle the main window on double-click

### 2. Rust Backend Modules

#### Commands (`src-tauri/src/commands/`)

Handles communication between the Tauri backend and frontend:

**`win_manager.rs`**
Manages WEPORT windows.

```rust
#[command]
pub fn show_main(app: AppHandle, show: bool) -> Result<(), String>
#[command]
pub fn exit_app(app: AppHandle)
#[command]
pub fn move_main_window(app: AppHandle, x: i32, y: i32) -> Result<(), String>
```

**`data_manager.rs`**
Manages WEPORT settings and data.

```rust
#[command]
pub fn read_config() -> Result<String, String>
#[command]
pub fn save_data(data: String) -> Result<(), String>
#[command]
pub fn get_uuid() -> String
```

#### Modules (`src-tauri/src/module/`)

Core utility functionality:

**`registry.rs`**

- Windows registry management
- Load/save settings

**`debug.rs`**

- Windows OutputDebugString API wrapper
- Macro-based logging

### 3. Data Management System

#### Configuration Files

- **`weport.json`**: Application configuration
- **`wp_manager.json`**: Main data management
- **`{uuid}.dat`**: Individual report data

#### Data Structure

```javascript
// wp_manager.json structure
{
  "name": "User Name",
  "section": [
    { "id": 1, "name": "R&D" },
    { "id": 2, "name": "Business Support/Project" },
    { "id": 3, "name": "Other" }
  ],
  "category": [
    {
      "id": 1,
      "name": "Category Name",
      "section_id": 1,
      "items": [
        {
          "id": "uuid",
          "title": "Item Name",
          "status": "in_progress|completed|cancelled|pending"
        }
      ]
    }
  ]
}
```

## Implementation Guide for Key Features

### 1. Add a New Tauri Command

```rust
// src-tauri/src/commands/your_module.rs
use tauri::command;

#[command]
pub fn your_new_command(param: String) -> Result<String, String> {
    // Implementation logic
    Ok("success".to_string())
}

// Add to src-tauri/src/lib.rs
use commands::your_module::your_new_command;

// Register in Builder
.invoke_handler(tauri::generate_handler![
    your_new_command,
    // ... other commands
])
```

### 2. Call Rust Functions from the Frontend

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

### 3. Add a New UI Mode

```html
<!-- src/index.html -->
<button class="tab-btn" onclick="showScreen('new-mode', this)">New Mode</button>

<div id="new-mode" class="tab-content">
    <!-- New UI content -->
</div>
```

```javascript
// src/main.js
function showScreen(screenId, buttonElement) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(screenId).classList.add('active');
    
    // Update button state
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    buttonElement.classList.add('active');
}
```

## Debugging and Troubleshooting

### Common Issues

#### 1. `window.__TAURI__` is undefined

**Cause**: Tauri context was not injected during build
**Solution**:

```bash
cargo tauri build --force
```

#### 2. Executable icon is not applied

**Cause**: Icon resources were not properly bundled
**Solution**: Build directly from the project root

```bash
cd /path/to/weport
cargo tauri build
```

#### 3. Registry access error

**Cause**: Insufficient permissions or incorrect key path
**Solution**: Run as administrator or verify key path

### Debugging Tools

#### 1. Rust debug output

```rust
use crate::print_out;

print_out!("Debug message: {}", value);
```

#### 2. JavaScript debugging

```javascript
// Use browser developer tools
console.log('Debug info:', data);

// Open devtools in Tauri debug mode
```

#### 3. Check build logs

```bash
# Detailed build logs
cargo tauri build --verbose

# Detailed logs in development mode
RUST_LOG=debug cargo tauri dev
```

## Performance Optimization

### 1. Rust optimization

```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
```

### 2. Bundle size optimization

- Remove unnecessary dependencies
- Compress and optimize assets
- Apply tree shaking

## Security Considerations

### 1. CSP (Content Security Policy)

```json
// tauri.conf.json
"security": {
    "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'"
}
```

### 2. File system access

- Allow only required paths
- Validate user input
- Prevent path traversal attacks

### 3. Registry access

- Follow the principle of least privilege
- Use safe key paths
- Strengthen error handling

## Deployment Guide

### 1. Distribution file structure

```text
weport-release/
├── weport.exe          # Main executable
├── weport.json         # Configuration file
├── data/               # Data directory
│   └── wp_manager.json # Initial data
├── update.exe          # Updater
└── ver.msl             # Version information
```

### 2. Create installer

```bash
# Windows MSI installer
cargo tauri build --target x86_64-pc-windows-msvc

# NSIS installer
cargo tauri build --bundles nsis
```

### 3. Automatic updates

Automatic updates can be implemented using Tauri 2.x update system.

## Coding Conventions

### Rust coding style

- Use `rustfmt`
- Follow `clippy` lint rules
- Add doc comments for all public functions
- Use `Result` type for error handling

### JavaScript coding style

- Use ES6+ syntax
- Use camelCase for function names
- Use UPPER_CASE for constants
- Prefer async/await

### File structure rules

- Separate files by module
- Organize directories by feature
- Use clear naming conventions

## Test Strategy

### 1. Unit tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_name() {
        // Implement test
    }
}
```

### 2. Manual test checklist

- [ ] Window show/hide functionality
- [ ] Data save/load
- [ ] Registry read/write

---

*This document is based on WEPORT v1.0.0. Content may change as the project is updated.*
