//! # Module Debug
//!
//! `debug` is a module that provides functionality to view debugging information through DebugView on Windows platform.

/// Makes macros to print debugging information.
#[macro_export]
//macro_rules! print_out {
//    ($($args:tt), *) => { crate::debug::make_print_out(&format!("{}", format_args!($($args), *))) };
//}
macro_rules! print_out {
    ($($args:tt)*) => { crate::module::debug::make_print_out(&format!("{}", format_args!($($args)*))) };
}

#[macro_export]
macro_rules! eprint_out {
    ($($args:tt)*) => { crate::module::debug::make_eprint_out(file!(), line!(), /*column!(),*/ &format!("{}", format_args!($($args)*))) };
}

// Modified from 'extern "stdcall"' to 'extern "system"'.
#[cfg(windows)]
unsafe extern "system" {
    unsafe fn OutputDebugStringW(chars: *const u16);
    unsafe fn IsDebuggerPresent() -> i32;
}

/// Using the `OutputDebugString` API.
/// This function is not available on non-Windows platforms.
/// Reference [`OutputDebugStringW`](https://docs.microsoft.com/en-us/windows/win32/api/debugapi/nf-debugapi-outputdebugstringw).
#[allow(dead_code)]
pub fn make_print_out(s: &str) {
    #[cfg(windows)]
    {
        let len = s.encode_utf16().count() + 1;
        let mut s_utf16: Vec<u16> = Vec::with_capacity(len);
        s_utf16.extend(s.encode_utf16());
        s_utf16.push(0);
        unsafe {
            if s_utf16.len() > 0 {
                OutputDebugStringW(&s_utf16[0]);
            }
            //OutputDebugStringW(&s_utf16[0]);
        }
    }
    #[cfg(not(windows))]
    {
        //let _ = s;
        println!(s);
    }
}

/// Using the `OutputDebugString` API.
/// This function is not available on non-Windows platforms.
/// Reference [`OutputDebugStringW`](https://docs.microsoft.com/en-us/windows/win32/api/debugapi/nf-debugapi-outputdebugstringw).
#[allow(dead_code)]
pub fn make_eprint_out(file: &str, line: u32, /*column: u32,*/ s: &str) {
    #[cfg(windows)]
    {
        let strip_s = s.strip_prefix(">>").unwrap_or(s).trim();
        //let es = format!("[{}({}:{})] {}", file, line, column, strip_s);
        let es = format!("[{}({})] {}", file, line, strip_s);
        let len = es.encode_utf16().count() + 1;
        let mut s_utf16: Vec<u16> = Vec::with_capacity(len);
        s_utf16.extend(es.encode_utf16());
        s_utf16.push(0);
        unsafe {
            OutputDebugStringW(&s_utf16[0]);
        }
    }
    #[cfg(not(windows))]
    {
        //let _ = s;
        eprintln!(s);
    }
}

/// Checks if the current process is being debugged.
/// Returns `false` on non-Windows platforms.
/// Reference [`IsDebuggerPresent`](https://docs.microsoft.com/en-us/windows/win32/api/debugapi/nf-debugapi-isdebuggerpresent).
#[allow(dead_code)]
pub fn is_debugger() -> bool {
    #[cfg(windows)]
    {
        unsafe { IsDebuggerPresent() != 0 }
    }
    #[cfg(not(windows))]
    {
        false
    }
}

