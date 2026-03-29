use crate::print_out;

use std::fs;
use std::env;
use uuid::Uuid;
use common::define;

#[tauri::command]
pub fn get_uuid() -> String {
  let my_uuid = Uuid::new_v4();
  my_uuid.to_string()
}

#[tauri::command]
pub fn read_config() -> Result<String, String> {
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let config_file_path = format!("{}\\{}", root_path, define::CONFIG_FILE_NAME);
  //print_out!(">> Config file path: {}", config_file_path);
  if fs::metadata(&config_file_path).is_ok() {
    let data = fs::read_to_string(config_file_path).map_err(|e| e.to_string())?;
    //print_out!(">> Read config data from file: {}", data);
    return Ok(data);
  } else {
    print_out!(">> Cannot find Config file, returning empty data");
    let empty_data = r##"{
      "title": "Weport",
      "auto_update": false
    }"##.to_string();

    Ok(empty_data)
  }
}

#[tauri::command]
pub fn save_config(data: String) -> Result<(), String> {
  //print_out!(">> Save config data: {}", data);
  // file : define::CONFIG_FILE_NAME
  // save file logic here
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let config_path = format!("{}\\{}", root_path, define::CONFIG_FILE_NAME);
  fs::write(config_path, data).map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
pub fn read_data() -> Result<String, String> {
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let manage_file_path = format!("{}\\{}\\{}", root_path, define::DATA_DIR_NAME, define::MANAGE_FILE_NAME);
  //print_out!(">> Manage file path: {}", manage_file_path);
  if fs::metadata(&manage_file_path).is_ok() {
    let data = fs::read_to_string(manage_file_path).map_err(|e| e.to_string())?;
    //print_out!(">> Read manage data from file: {}", data);
    return Ok(data);
  } else {
    print_out!(">> Cannot find Manage file, returning sample data");
/*
    let sample_data = r##"{
      "name": "서광수",
      "section": [
          { "id": 1, "name": "연구개발" },
          { "id": 2, "name": "업무지원/프로젝트" },
          { "id": 3, "name": "기타" }
      ],
      "category": [
          { "sid": 1, "uid": "a2885017-6164-4f22-b3cd-13b136dad17c", "cid": "#174413", "show": { "id": true, "name": true }, "order": 1, "item": "제목A", "duration": "25/01/02~25/05/30" },
          { "sid": 1, "uid": "5a38ffe1-5f88-4d04-ad61-208a1d2dba90", "cid": "#174415", "show": { "id": true, "name": true }, "order": 2, "item": "제목B", "duration": "25/01/02~25/05/30" },
          { "sid": 2, "uid": "600425aa-56b5-4f1d-a07b-80248aca9c2c", "cid": "", "show": { "id": false, "name": true }, "order": 1, "item": "제목C", "duration": "25/01/02~25/05/30" }
      ]
    }"##.to_string();
    Ok(sample_data)
*/
    Ok((r##"{"name": "", "section": [], "category": []}"##).to_string())
  }
}

#[tauri::command]
pub fn save_data(data: String) -> Result<(), String> {
  //print_out!(">> Save manage data: {}", data);
  // file : define::MANAGE_FILE_NAME
  // save file logic here
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let plugin_path = format!("{}\\{}\\{}", root_path, define::DATA_DIR_NAME, define::MANAGE_FILE_NAME);
  fs::write(plugin_path, data).map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
pub fn read_detail_data(file: String) -> Result<String, String> {
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let detail_file_path = format!("{}\\{}\\{}", root_path, define::DATA_DIR_NAME, file);
  //print_out!(">> Detailed file path: {}", detail_file_path);
  if fs::metadata(&detail_file_path).is_ok() {
    let data = fs::read_to_string(detail_file_path).map_err(|e| e.to_string())?;
    //print_out!(">> Read detailed data from file: {}", data);
    return Ok(data);
  } else {
    print_out!(">> Cannot find detailed data file, returning empty data");
    let empty_data = r##"{
      "data": []
    }"##.to_string();

    Ok(empty_data)
  }
}

#[tauri::command]
pub fn save_detail_data(file: String,data: String) -> Result<(), String> {
  //print_out!(">> Save detailed data: [{}] {}", file, data);
  // file : define::MANAGE_FILE_NAME
  // save file logic here
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let plugin_path = format!("{}\\{}\\{}", root_path, define::DATA_DIR_NAME, file);
  fs::write(plugin_path, data).map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
pub fn delete_detail_data(file: String) -> Result<(), String> {
  //print_out!(">> Deleting detailed data file: {}", file);
  let root_path = format!("{}", env::current_exe().unwrap().parent().unwrap().display());
  let detail_file_path = format!("{}\\{}\\{}", root_path, define::DATA_DIR_NAME, file);
  if fs::metadata(&detail_file_path).is_ok() {
    fs::remove_file(detail_file_path).map_err(|e| e.to_string())?;
    //print_out!(">> Deleted detailed data file: {}", file);

  } else {
    print_out!(">> Cannot find detailed data file, nothing to delete: {}", file);
  }
  Ok(())
}
