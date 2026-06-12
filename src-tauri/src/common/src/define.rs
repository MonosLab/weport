// The name 'weport' is an abbreviation of "Weekly" and "Report",
// indicating the main purpose of the application:
//      To provide a weekly report on the user's work activities.
/*=======================================================================*/
// 1.0.0.1   : The initial version of Weport, which includes the following features:
//             ├ Show/Hide Window when the icon is clicked.
//             ├ Read/Write data management files
//             ├ Registry management module
//             └ Window settings management module

#![allow(dead_code)]

// application info
pub const APP_NAME: &str = "Weport";
pub const APP_VERSION: &str = "Ver 1.0.0";
pub const APP_VERSION_NUMBER: &str = "1.0.0";
pub const APP_INSTANCE: &str = "Weport_Instance";
pub const WEPORT_CLASS_NAME: &str = "Weport@1";

// file
pub const DATA_DIR_NAME: &str = "data";
pub const APP_EXE_FILE_NAME: &str = "Weport.exe";
pub const UPDATE_EXE_FILE_NAME: &str = "aurora4m.exe";
pub const NEWUPDATE_EXE_FILE_NAME: &str = "newaurora4m.exe";
pub const UPDATE_CFG_FILE_NAME: &str = "aurora4m.cfg";
pub const UPDATE_LIB_FILE_NAME: &str = "aurora4m_lib.dll";
pub const CONFIG_FILE_NAME: &str = "weport.json";
pub const MANAGE_FILE_NAME: &str = "wp_manager.json";

// registry
pub const REG_KEY_RUN: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
pub const REG_WIN_PATHS: &str = r"Software\Microsoft\Windows\CurrentVersion\App Paths";
pub const REG_PRODUCT_NAME: &str = r"Software\Microsoft\Windows NT\CurrentVersion";
pub const REG_SUBKEY_CRATES: &str = r"Software\Monoslab\Weport";
pub const REG_SUBKEY_POS: &str = r"Software\Monoslab\Weport\Pos";
pub const REG_SUBKEY_SETTINGS: &str = r"Software\Monoslab\Weport\Settings";

// icon size and margin
pub const OUTTER_MARGIN: i32 = 16;
pub const ICON_SIZE_W: i32 = 32;
pub const ICON_SIZE_H: i32 = 96;
pub const ICON_SIZE_WF: f64 = 32.0;
pub const ICON_SIZE_HF: f64 = 96.0;

// minimum window size
pub const MIN_WIDTH: i32 = 600;
pub const MIN_HEIGHT: i32 = 200;