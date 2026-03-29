use crate::print_out;
use common::define;
use crate::module::registry::{
    self,
    HKEY_CURRENT_USER
};

use tauri::{
    Manager,
    AppHandle,
    command
};

#[command]
pub fn exit_app(app: AppHandle) {
  app.exit(0);
}

#[command]
pub fn show_main(app: AppHandle, show: bool) -> Result<(), String> {
  let main = app.get_webview_window("main").ok_or("Cannot find the main window")?;
  if show == false {
    main.hide().map_err(|e| e.to_string())?;
    return Ok(());
  }

  let icon = app.get_webview_window("icon").ok_or("Cannot find the icon window")?;
  let mut is_top = false;
  let mut is_left = false;
  if let Some(monitor) = icon.current_monitor().map_err(|e| e.to_string())? {
    let width = monitor.size().width;
    let height = monitor.size().height;
    if let Some(icon_pos) = icon.outer_position().ok() {
      if icon_pos.x >= (width / 2) as i32 {
        is_left = false;
      } else {
        is_left = true;
      }
      if icon_pos.y >= (height / 2) as i32 {
        is_top = false;
      } else {
        is_top = true;
      }
    }
  } else {
    print_out!(">> Cannot find the icon monitor");
  }
  
  icon.inner_position().map_err(|e| e.to_string()).and_then(|pos| {
    let (width, height) = get_window_size();
    let win_x = if is_left {
        pos.x + define::ICON_SIZE_W
    } else {
        pos.x - width - define::OUTTER_MARGIN
    };
    let win_y = if is_top {
        pos.y
    } else {
        pos.y - height + define::ICON_SIZE_H
    };

    main.set_position(tauri::PhysicalPosition { x: win_x, y: win_y }).map_err(|e| e.to_string())?;
    main.set_size(tauri::Size::Logical(tauri::LogicalSize { width: width as f64, height: height as f64 })).map_err(|e| e.to_string())?;
    Ok(())
  })?;

  main.show().map_err(|e| e.to_string())?;
  main.set_focus().map_err(|e| e.to_string())?;
  Ok(())
}

/*
#[command]
fn show_icon(app: AppHandle) -> Result<(), String> {
  let main = app.get_webview_window("main").ok_or("Cannot find the main window")?;
  let icon = app.get_webview_window("icon").ok_or("Cannot find the icon window")?;

  main.outer_position().map_err(|e| e.to_string()).and_then(|pos| {
    icon.set_position(pos).map_err(|e| e.to_string())
  })?;

  main.hide().map_err(|e| e.to_string())?;
  icon.show().map_err(|e| e.to_string())?;
  Ok(())
}
*/


/// Get window position from registry
#[allow(unused_assignments)]
pub fn get_window_menu_pos() -> (i32, i32) {
    // Declare variables without initial values
    let mut left = 0;
    let mut top = 0;

    let _ = registry::check_or_create_key(HKEY_CURRENT_USER, define::REG_SUBKEY_POS);

    let reg_left = registry::read_dword("x");
    match reg_left {
        Ok(value) => {
            left = value as i32;
        },
        Err(_) => {
            left = 0;
            print_out!(">> [Icon Position] Cannot find Left, using default 0");
        },
    }

    let reg_top = registry::read_dword("y");
    match reg_top {
        Ok(value) => {
            top = value as i32;
        },
        Err(_) => {
            top = 0;
            print_out!(">> [Icon Position] Cannot find Top, using default 0");
        },
    }

    (left, top)
}

/// Set window position to registry
#[allow(unused_assignments)]
pub fn set_window_menu_pos(x: i32, y: i32) {
    let _ = registry::check_or_create_key(HKEY_CURRENT_USER, define::REG_SUBKEY_POS);

    let _ = registry::write_dword("x", x as u32);
    let _ = registry::write_dword("y", y as u32);
    //print_out!(">> [Window Position] Saved: x={}, y={}", x, y);
}

/// Get window size from registry
#[allow(unused_assignments)]
pub fn get_window_size() -> (i32, i32) {
    // Declare variables without initial values
    let mut width = 0;
    let mut height = 0;

    let _ = registry::check_or_create_key(HKEY_CURRENT_USER, define::REG_SUBKEY_POS);

    let reg_width = registry::read_dword("w");
    match reg_width {
        Ok(value) => {
            width = value as i32;
        },
        Err(_) => {
            width = define::MIN_WIDTH;
            print_out!(">> [Window Position] Cannot find Width, using default {}", define::MIN_WIDTH);
        },
    }

    let reg_height = registry::read_dword("h");
    match reg_height {
        Ok(value) => {
            height = value as i32;
        },
        Err(_) => {
            height = define::MIN_HEIGHT;
            print_out!(">> [Window Position] Cannot find Height, using default {}", define::MIN_HEIGHT);
        },
    }

    (width, height)
}

/// Set window size to registry
#[allow(unused_assignments)]
pub fn set_window_size(width: i32, height: i32) {
    let _ = registry::check_or_create_key(HKEY_CURRENT_USER, define::REG_SUBKEY_POS);

    let _ = registry::write_dword("w", width as u32);
    let _ = registry::write_dword("h", height as u32);
    //print_out!(">> [Window Position] Saved: w={}, h={}", width, height);
}

pub fn move_main_window(icon_x: i32, icon_y: i32) {
  if let Some(app) = crate::APP_HANDLE.get() {
    // If "main" window is shown, move it accordingly
    if let Some(_main) = app.get_webview_window("main"){
      //print_out!(">> Moving main window due to icon move");
    } else {
      return;
    }

    if let Some(icon) = app.get_webview_window("icon") {
      let mut is_top = false;
      let mut is_left = false;

      if let Some(monitor) = icon.current_monitor().map_err(|e| e.to_string()).unwrap() {
        let width = monitor.size().width;
        let height = monitor.size().height;
        if let Some(icon_pos) = icon.outer_position().ok() {
          if icon_pos.x >= (width / 2) as i32 {
            is_left = false;
          } else {
            is_left = true;
          }
          if icon_pos.y >= (height / 2) as i32 {
            is_top = false;
          } else {
            is_top = true;
          }
        }
      } else {
        print_out!(">> Cannot find the icon monitor");
      }
      if let Some(main) = app.get_webview_window("main") {
        let (width, height) = get_window_size();
        let win_x = if is_left {
            icon_x + define::ICON_SIZE_W
        } else {
            icon_x - width - define::OUTTER_MARGIN
        };
        let win_y = if is_top {
            icon_y
        } else {
            icon_y - height + define::ICON_SIZE_H
        };

        let _ = main.set_position(tauri::PhysicalPosition { x: win_x, y: win_y });
      }
    }
  }
}

#[tauri::command]
pub fn refresh_window(app: AppHandle)  -> Result<(), String>{
    let icon = app.get_webview_window("icon").ok_or("Cannot find the icon window")?;
    // This forces a redraw by performing a very slight resize asynchronously
    tauri::async_runtime::spawn(async move {
        // Get current size (use current size instead of hardcoded values)
        if let Ok(factor) = icon.scale_factor() {
             if let Ok(size) = icon.inner_size() {
                let width = size.width as f64 / factor;
                let height = size.height as f64 / factor;
                // Slightly change size (0.1px)
                let _ = icon.set_size(tauri::Size::Logical(tauri::LogicalSize { 
                    width: width + 0.1, 
                    height: height 
                }));
                // Very short wait
                std::thread::sleep(std::time::Duration::from_millis(10));
                
                // Restore original size
                let _ = icon.set_size(tauri::Size::Logical(tauri::LogicalSize { 
                    width: width, 
                    height: height 
                }));
             }
        }
    });
    Ok(())
  }