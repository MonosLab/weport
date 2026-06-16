/// Main library file for the Tauri application
/// This file initializes and runs the Tauri app,
/// sets up commands, and manages application state.
mod module {
  pub(crate) mod debug;
  pub(crate) mod registry;
}
mod commands {
  pub(crate) mod win_manager;
  pub(crate) mod data_manager;  
}
use commands::win_manager::{
  exit_app,
  show_main,
//show_icon,
  get_window_menu_pos,
  set_window_menu_pos,
  set_window_size,
  move_main_window,
  refresh_window,
  is_startup,
  update_startup
};
use commands::data_manager::{
  get_uuid,
  read_config,
  save_config,
  read_data,
  save_data,
  read_detail_data,
  save_detail_data,
  delete_detail_data
};
use common::{
  self,
  define
};
use std::fs;
use std::{
  //env::current_dir,
  env::current_exe,
  path::Path,
  //process::Command,
  ffi::{
    CString,
    CStr,
    c_char
  }
};
use tauri::{
    AppHandle,
    WindowEvent,
    WebviewUrl,
    WebviewWindowBuilder,
    window::Color
};
use windows::core::{
  HSTRING,
  w
};
use windows::Win32::{
  UI::{
    Shell::ShellExecuteW,
    WindowsAndMessaging::SW_SHOWNORMAL
  },
  Foundation::HWND
};
use libloading::Library;
use serde_json::Value;
use once_cell::sync::OnceCell;

// C 호환 구조체 정의
#[repr(C)]
pub struct CConfig {
    pub titlebar: *mut c_char,
    pub title: *mut c_char,
    pub subtitle: *mut c_char,
    pub protocol: *mut c_char,
    pub port: u16,
    pub attached: u8, // bool을 u8로 변환
    pub host: *mut c_char,
    pub path: *mut c_char,
    pub file: *mut c_char,
}

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();

/// Initialize and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let _ = replace_update_file();
  let (update, autoupdate) = check_update();
  if update {
    // 윈도우 시작 시 자동 실행(Registry Run key, 작업 스케줄러, 시작프로그램 폴더 등)으로 프로그램이 구동되면,
    // 윈도우 시스템이 지정한 기본 작업 디렉터리가 현재 디렉터리(current_dir)로 설정됩니다.
    // 보통은 C:\Windows\System32 또는 사용자의 홈 디렉터리(C:\Users\사용자명)가 기본값으로 잡히게 됩니다.
    //let update_path = format!("{}\\{}", current_dir().unwrap().display(), define::UPDATE_EXE_FILE_NAME);
    let update_path = format!("{}\\{}", current_exe().unwrap().parent().unwrap().display(), define::UPDATE_EXE_FILE_NAME);
    print_out!(">> Update path : {}", update_path);

/*
권한 상승이 필요하다...
use std::ffi::CString;
use windows_sys::Win32::UI::Shell::ShellExecuteA;

unsafe {
    let operation = CString::new("runas").unwrap();
    let file = CString::new("C:\\path\\to\\your_app.exe").unwrap();
    ShellExecuteA(0, operation.as_ptr(), file.as_ptr(), std::ptr::null(), std::ptr::null(), 1);
}

*/
/*
    if autoupdate {
      print_out!(">> Auto-update enabled, starting update process...");
      // Implement auto-update logic here (e.g., download and install update, restart app, etc.) --- IGNORE ---
      // aurora4m.exe --auto weport.exe
      let exec_path = format!("{} --auto {}", update_path, define::APP_EXE_FILE_NAME);
      match Command::new(&exec_path).spawn() {
        Ok(_) => {
            println!(">> Process started successfully.");
            std::process::exit(0);
        }
        Err(e) => {
            println!(">> Failed to start process: {}", e);
        }
      }
    } else {
      print_out!(">> Update available but auto-update is disabled. Please update manually.");
      // Optionally, you can implement logic to show an update notification or prompt the user to update.
      // aurora4m.exe
      match Command::new(&update_path).spawn() {
        Ok(_) => {
            println!(">> Process started successfully.");
            std::process::exit(0);
        }
        Err(e) => {
            println!(">> Failed to start process: {}", e);
        }
      }
    }
*/

    if autoupdate {
      let params = format!("--auto {}", define::APP_EXE_FILE_NAME);
      unsafe {
        let result = ShellExecuteW(
          Some(HWND::default()),
          w!("runas"),
          &HSTRING::from(update_path),
          &HSTRING::from(params),
          w!(""),
          SW_SHOWNORMAL);
          if (result.0 as usize) <= 32 {
            eprint_out!(">> Failed to start process: {:?}", result);
          }
      }
    } else {
      unsafe {
        let result = ShellExecuteW(
          Some(HWND::default()),
          w!("runas"),
          &HSTRING::from(update_path),
          w!(""),
          w!(""),
          SW_SHOWNORMAL);
          if (result.0 as usize) <= 32 {
            eprint_out!(">> Failed to start process (No params): {:?}", result);
          }
      }
    }
  } else {
    print_out!(">> No updates available.");
  }

  // Ensure necessary directories exist
  check_directory();
  let (x, y) = get_window_menu_pos();
  let clone_x = x.clone() as f64;
  let clone_y = y.clone() as f64;

  tauri::Builder::default()
    .setup(move |app| {
      APP_HANDLE.set(app.handle().clone()).unwrap();

      let menu = WebviewWindowBuilder::new(
        app,
        "icon",
        WebviewUrl::App("icon.html".into()),
      )
      // Set empty menu
      .always_on_top(true)
      .resizable(false)
      .decorations(false)
      .focusable(false)
      .shadow(false)
      .transparent(true)
      .skip_taskbar(true)
      .fullscreen(false)
      .position(clone_x, clone_y)
      .background_color(Color(0, 0, 0, 0))
      .min_inner_size(define::ICON_SIZE_WF, define::ICON_SIZE_HF)
      .inner_size(define::ICON_SIZE_WF, define::ICON_SIZE_HF)
      .build()?;

      //# Important: [Absolutely necessary] Set size again to ensure correct dimensions
      menu.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: define::ICON_SIZE_WF,
        height: define::ICON_SIZE_HF,
      })).unwrap();

      menu.on_window_event(move |event| {
        match event {
          #[allow(unused_variables)]
          WindowEvent::Moved(position) => {
            //print_out!(">> Icon moved: x={}, y={}", position.x, position.y);
            set_window_menu_pos(position.x as i32, position.y as i32);
            move_main_window(position.x as i32, position.y as i32);
          }
          WindowEvent::Focused(_) => {
            refresh_window(APP_HANDLE.get().unwrap().clone()).unwrap();
          }
          _ => {}
        }
      });
     
      Ok(())
    })
    .on_window_event(|_window, event| {
      match event {
        #[allow(unused_variables)]
        WindowEvent::Resized(size) => {
          //print_out!(">> Window resized: width={}, height={}", size.width, size.height);
          set_window_size(size.width as i32, size.height as i32);
        }
        #[allow(unused_variables)]
        WindowEvent::CloseRequested { api, .. } => {
          // Remove the comment below to prevent window from closing.
//        api.prevent_close();
        }
        _ => {}
      }
    })
    .invoke_handler(tauri::generate_handler![
      exit_app,
      show_main,
//    show_icon,
      refresh_window,
      get_uuid,
      read_config,
      save_config,
      read_data,
      save_data,
      read_detail_data,
      save_detail_data,
      delete_detail_data,
      is_startup,
      update_startup
      ])
    .plugin(tauri_plugin_positioner::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// If nessesary directories not exist, create them
fn check_directory() {
  //let root_path = format!("{}", current_dir().unwrap().display());
  let root_path = format!("{}", current_exe().unwrap().parent().unwrap().display());
  // Check data directory
  let data_dir_path = format!("{}\\{}", root_path, common::define::DATA_DIR_NAME);
  if std::fs::metadata(&data_dir_path).is_err() {
    print_out!(">> Data directory not found, creating: {}", data_dir_path);
    std::fs::create_dir(&data_dir_path).unwrap();
  }
}

fn replace_update_file() -> bool {
  if let Ok(exe_path) = current_exe() {
    if let Some(root_path) = exe_path.parent() {
      let new_update_file = root_path.join(common::define::NEWUPDATE_EXE_FILE_NAME);
      let old_update_file = root_path.join(common::define::UPDATE_EXE_FILE_NAME);

      if new_update_file.exists() {
        // Try removing the old update file.
        if let Err(e) = fs::remove_file(&old_update_file) {
            eprint_out!("Failed to remove old update file: {e}");
            return false;
        }
        // Try to rename the new update file as the old update file.
        if let Err(e) = fs::rename(&new_update_file, &old_update_file) {
            eprint_out!("Failed to rename new update file: {e}");
            return false;
        }
        print_out!("Update file replaced successfully.");
      }
    }
  }
  true
}

/// Check for updates and return whether updates are available and whether auto-update is enabled
/// (bool, bool) : (useUpdate, autoUpdate)
fn check_update() -> (bool, bool) {
  let config = read_config().unwrap();
  let v: Value = serde_json::from_str(&config).unwrap();
  // Get useUpdate setting from config and print it
  let use_update = v.get("useUpdate").and_then(|v2| v2.as_bool()).unwrap_or(false);
  // Get autoUpdate setting from config and print it
  let auto_update = v.get("autoUpdate").and_then(|v2| v2.as_bool()).unwrap_or(false);

  if use_update {
    print_out!(">> Checking for updates...");
    unsafe {
      // Use absolute path for DLL
      //let dll_path = format!("{}\\{}", current_dir().unwrap().display(), define::UPDATE_LIB_FILE_NAME);
      let dll_path = format!("{}\\{}", current_exe().unwrap().parent().unwrap().display(), define::UPDATE_LIB_FILE_NAME);
      print_out!(">> DLL path: {}", dll_path);
      
      let lib = match Library::new(&dll_path) {
        Ok(lib) => lib,
        Err(e) => {
          print_out!(">> Failed to load DLL: {}", e);
          return (false, false);
        }
      };
      
      // Try different possible function names
      let aurora4m_load_config = match lib.get::<unsafe extern "C" fn(*const c_char) -> *mut CConfig>(b"aurora4m_load_config") {
        Ok(func) => func,
        Err(_) => {
          // Try fallback to old function name
          match lib.get::<unsafe extern "C" fn(*const c_char) -> *mut CConfig>(b"load_config") {
            Ok(func) => func,
            Err(e) => {
              print_out!(">> Failed to get function: {:?}", e);
              return (false, false);
            }
          }
        }
      };
      //let file_path = format!("{}\\{}", current_dir().unwrap().display(), define::UPDATE_CFG_FILE_NAME);
      let file_path = format!("{}\\{}", current_exe().unwrap().parent().unwrap().display(), define::UPDATE_CFG_FILE_NAME);
      print_out!(">> Config file path: {}", file_path);
      if Path::new(&file_path).exists() {
        let c_file_path = CString::new(file_path).unwrap();
        let config_ptr = aurora4m_load_config(c_file_path.as_ptr());
        if config_ptr.is_null() {
          print_out!(">> Failed to load config");
          return (false, false);
        }

        // 구조체에서 데이터 추출 및 URL 생성
        let config = &*config_ptr;
        
        // C 문자열 변환 헬퍼 함수
        let c_str_to_string = |ptr: *mut c_char, default: &str| -> String {
          if ptr.is_null() {
            default.to_string()
          } else {
            CStr::from_ptr(ptr).to_string_lossy().to_string()
          }
        };
        
        let protocol = c_str_to_string(config.protocol, "https");
        let host = c_str_to_string(config.host, "");
        let path = c_str_to_string(config.path, "");
        let file = c_str_to_string(config.file, "");

        // If path is empty, keep it as is.
        // If path is not empty and does not start with '/',
        // add '/' and if it does not end with '/', add '/' as well.
        // (e.g., "update" -> "/update/")
        let path = if !path.is_empty() && !path.starts_with('/') {
          format!("/{}", path)
        } else if !path.is_empty() && !path.ends_with('/') {
          format!("{}/", path)
        } else {
          path
        };
        let update_url = if config.attached != 0 {
          format!("{}://{}:{}{}{}", protocol, host, config.port, path, file)
        } else {
          format!("{}://{}{}{}", protocol, host, path, file)
        };
        
        //let data_path = format!("{}\\ver.dat", current_dir().unwrap().display());
        let data_path = format!("{}\\ver.dat", current_exe().unwrap().parent().unwrap().display());
        print_out!(">> Update URL: {}", update_url);
        print_out!(">> Data path: {}", data_path);
        
        let check_updates = match lib.get::<unsafe extern "C" fn(*const c_char, *const c_char) -> i32>(b"aurora4m_check_updates") {
          Ok(func) => func,
          Err(_) => {
            // Try fallback to old function name
            match lib.get::<unsafe extern "C" fn(*const c_char, *const c_char) -> i32>(b"check_updates") {
              Ok(func) => func,
              Err(e) => {
                print_out!(">> Failed to get check_updates function: {:?}", e);
                return (false, false);
              }
            }
          }
        };
        let c_update_url = CString::new(update_url).unwrap();
        let updates_available = check_updates(CString::new(data_path).unwrap().as_ptr(), c_update_url.as_ptr());
        if updates_available > 0 {
          if auto_update {
            return (true, true);
          } else {
            return (true, false);
          }
        } else {
          print_out!(">> Config file not found, skipping update check ({})", updates_available);
        }
      }
    }
  }

  (false, false)
}
