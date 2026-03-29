use std::{ env, fs, path::PathBuf };

const COPY_FILE_SETTINGS: &str = "weport.json";
const COPY_FILE_MANAGER: &str = "wp_manager.json";

fn main() {
    let out = env::var("PROFILE").unwrap();
    let out_path = PathBuf::from(format!("./target/{}", out));
    let out_data_path = out_path.clone().join("data");
    // conf file
    move_file(COPY_FILE_SETTINGS, &out_path);
    move_file(COPY_FILE_MANAGER, &out_data_path);

    tauri_build::build()
}

fn move_file(src: &str, dest: &PathBuf) {
    let src_file = format!("../dist-files/{}", src);
    let out_file = dest.clone().join(src);

    // if the folder does not exist, create it
    if let Some(parent) = out_file.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).unwrap();
        }
    }
    if out_file.exists() {
        fs::remove_file(&out_file).unwrap();
    }

    fs::copy(src_file.to_string(), out_file).unwrap();
}
