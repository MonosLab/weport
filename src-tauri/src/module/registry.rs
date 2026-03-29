
//! # Registry Management Module
//!
//! `registry` is a module that manages the Windows platform registry.
//! It provides functions to read, write, create, and delete registry keys and values.
//! It uses the `winreg` crate for registry operations and ensures thread safety with `Mutex`.

#![allow(dead_code)]

use std::io::{self, ErrorKind};
use std::sync::Mutex;
use winreg::{RegKey, HKEY, enums::*};
use once_cell::sync::Lazy;

pub const HKEY_CLASSES_ROOT: HKEY = -2147483648i32 as _;
pub const HKEY_CURRENT_CONFIG: HKEY = -2147483643i32 as _;
pub const HKEY_CURRENT_USER: HKEY = -2147483647i32 as _;
pub const HKEY_CURRENT_USER_LOCAL_SETTINGS: HKEY = -2147483641i32 as _;
pub const HKEY_DYN_DATA: HKEY = -2147483642i32 as _;
pub const HKEY_LOCAL_MACHINE: HKEY = -2147483646i32 as _;
pub const HKEY_PERFORMANCE_DATA: HKEY = -2147483644i32 as _;
pub const HKEY_PERFORMANCE_NLSTEXT: HKEY = -2147483552i32 as _;
pub const HKEY_PERFORMANCE_TEXT: HKEY = -2147483568i32 as _;
pub const HKEY_USERS: HKEY = -2147483645i32 as _;

struct OpenInfo<'a> {
    key: HKEY,
    subkey: &'a str,
}

// Implement Send and Sync traits for OpenInfo
unsafe impl<'a> Send for OpenInfo<'a> {}
unsafe impl<'a> Sync for OpenInfo<'a> {}

#[allow(unused_parens)]
impl<'a> OpenInfo<'a> {
    fn get_root_hkey(&self) -> RegKey {
        RegKey::predef(self.key)
    }

    fn get_hkey(&self) -> io::Result<RegKey> {
        let hregkey = RegKey::predef(self.key);
        hregkey.open_subkey_with_flags(self.subkey, KEY_ALL_ACCESS)
    }
}

static REG_INFO: Lazy<Mutex<OpenInfo<'static>>> = Lazy::new(|| {
    Mutex::new(OpenInfo { key: HKEY_CURRENT_USER, subkey: "" })
});

/// Creates and opens a subkey in the registry if it does not exist.
#[allow(dead_code)]
pub fn check_or_create_key(hive: HKEY, subkey: &'static str) -> io::Result<()> {
    let hive_clone = hive.clone();
    let reg_key = RegKey::predef(hive);

    match reg_key.open_subkey(subkey) {
        Ok(_) => {
            open(hive_clone, subkey);
            Ok(())
        }
        Err(e) => {
            if e.kind() == ErrorKind::NotFound {
                // Creates the registry key if it does not exist.
                let _ = reg_key.create_subkey(subkey)?;
                open(hive_clone, subkey);
                Ok(())
            } else {
                // Other errors
                Err(e)
            }
        }
    }
}

/// Opens the registry.
#[allow(dead_code)]
pub fn open(key: HKEY, subkey: &'static str) {
    let mut reg_info = REG_INFO.lock().unwrap();
    reg_info.key = key;
    reg_info.subkey = subkey;
}

/// Reads a string value from the registry key.
#[allow(dead_code)]
pub fn read_string(key: &str) -> Result<String, io::Error> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_key = reg_info.get_hkey()?;
    reg_key.get_value(key)
}

/// Reads a DWORD value from the registry key.
#[allow(dead_code)]
pub fn read_dword(key: &str) -> Result<u32, io::Error> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_key = reg_info.get_hkey()?;
    reg_key.get_value(key)
}

/// Writes a string value to the registry key.
#[allow(dead_code)]
pub fn write_string(key: &str, value: &str) -> Result<(), io::Error> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_key = reg_info.get_hkey()?;
    let osstr_value = std::ffi::OsStr::new(value);
    reg_key.set_value(key, &osstr_value)
}

/// Writes a DWORD value to the registry key.
#[allow(dead_code)]
pub fn write_dword(key: &str, value: u32) -> Result<(), io::Error> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_key = reg_info.get_hkey()?;
    reg_key.set_value(key, &value)
}

/// Creates a registry key at the specified path.
#[allow(dead_code)]
pub fn create_key(path: &str) -> io::Result<(RegKey, RegDisposition)> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_key = reg_info.get_hkey()?;
    reg_key.create_subkey(path)
}

/// Deletes a registry key at the specified path.
#[allow(dead_code)]
pub fn delete_key(path: &str) -> io::Result<()> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_root = reg_info.get_root_hkey();
    reg_root.delete_subkey(path)
}

/// Deletes a value for the given key.
#[allow(dead_code)]
pub fn delete_subkey(key: &str) -> io::Result<()> {
    let reg_info = REG_INFO.lock().unwrap();
    let reg_key = reg_info.get_hkey()?;
    reg_key.delete_value(key)
}
