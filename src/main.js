// import { invoke } from "@tauri-apps/api/tauri";
const { invoke } = window.__TAURI__.core;

// Progress Status Constants
const COMPLETED = 'completed';
const IN_PROGRESS = 'in_progress';
const CANCELLED = 'cancelled';
const PENDING = 'pending';

// Progress Status
const ProgressStatus = [
  [COMPLETED, "완료"],
  [IN_PROGRESS, "진행"],
  [CANCELLED, "취소"],
  [PENDING, "보류"]
].reduce((acc, [key, label]) => { 
  acc[key] = label;
  return acc;
}, {});

// Application config
const AppConfig = {
    title: "Weport",
    useUpdate: false,
    autoUpdate: false
};

// Application State
const AppState = {
    name: "",
    sections: [],
    categories: [],
    lastSelectedSection: null,
    lastSelectedCategory: null
};

// DOM Elements
const DOM = {
    title: null,
    selectSection: null,
    selectCategory: null,
    selectTitle: null,
    selectStatus: null,
    dataListTitles: null,
    writeItemList: null,
    writeReportArea: null,
    saveButton: null,
    dialogCategory: null,
    dialogSection: null,
    
    init() {
        this.title = document.getElementById('title');
        this.selectSection = document.getElementById('section');
        this.selectCategory = document.getElementById('category');
        this.selectTitle = document.getElementById('select-title');
        this.selectStatus = document.getElementById('status');
        this.dataListTitles = document.getElementById('report-titles');
        this.writeItemList = document.getElementById('item-list');
        this.writeReportArea = document.getElementById('write-report');
        this.saveButton = document.getElementById('save-button');
    }
};

// Dialog Templates
const DialogTemplates = {
    category: (labelText) => `
        <form method="dialog">
            <div class="form-row">
                <label for="itemId">ID: </label>
                <input type="text" id="itemId" autocomplete="off">
            </div>
            <div class="form-row">
                <label for="itemTitle">${labelText}: </label>
                <input type="text" id="itemTitle" autocomplete="off">
            </div>
            <div class="form-row">
                <label for="itemDuration">기간: </label>
                <input type="text" id="itemDuration" placeholder="예: 25/01/02~25/05/30" autocomplete="off">
            </div>
            <div class="form-row checkbox-container">
                <input type="checkbox" id="showName">이름 보이기</input>
                <input type="checkbox" id="showId" checked>아이디 보이기</input>
                <input type="checkbox" id="showDuration" checked>기간 보이기</input>
            </div>
            <menu>
                <button type="button" value="cancel">취소</button>
                <button type="submit" id="saveCategoryBtn" value="default">저장</button>
            </menu>
        </form>
    `,
    
    section: (labelText) => `
        <form method="dialog">
            <div class="form-row">
                <label for="itemSectionTitle">${labelText}: </label>
                <input type="text" id="itemSectionTitle" autocomplete="off">
            </div>
            <menu>
                <button type="button" value="cancel">취소</button>
                <button type="submit" id="saveSectionBtn" value="default">저장</button>
            </menu>
        </form>
    `,
    
    alert: (message) => `
        <form method="dialog">
            <div class="form-row">
                <p class="alert-message">${message}</p>
            </div>
            <menu>
                <button type="submit" value="default">확인</button>
            </menu>
        </form>
    `,
    
    confirm: (message) => `
        <form method="dialog">
            <div class="form-row">
                <p class="confirm-message">${message}</p>
            </div>
            <menu>
                <button type="button" value="cancel">취소</button>
                <button type="submit" value="default">확인</button>
            </menu>
        </form>
    `
};

// Event Handler Manager
class EventHandlerManager {
    static removeAndAddEventListener(element, selector, eventType, handler) {
        const targetElement = element.querySelector(selector);
        const newElement = targetElement.cloneNode(true);
        targetElement.parentNode.replaceChild(newElement, targetElement);
        newElement.addEventListener(eventType, handler);
        return newElement;
    }
}

// show toast message
function showToast(msg) {
    // Remove any existing toast messages
    let oldToast = document.getElementById("toastMessage");
    if (oldToast) oldToast.remove();
    // create toast container
    let toast = document.createElement("div");
    toast.id = "toastMessage";
    toast.textContent = msg;
    document.body.appendChild(toast);
    // Show the toast
    setTimeout(() => toast.classList.add("show"), 10);
    // Hide the toast after 2 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Dialog Factory
class DialogFactory {
    static createDialog(id, labelText) {
        const dialog = document.createElement('dialog');
        dialog.id = id;
        
        if (id === "dialog_category") {
            dialog.className = "dialog-category";
            dialog.innerHTML = DialogTemplates.category(labelText);
        } else if (id === "dialog_section") {
            dialog.className = "dialog-section";
            dialog.innerHTML = DialogTemplates.section(labelText);
        }
        
        document.body.appendChild(dialog);
        
        // Add cancel button event handler
        const cancelButton = dialog.querySelector('button[value="cancel"]');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                dialog.close();
            });
        }
        
        return dialog;
    }
    
    static createAlertDialog(message) {
        const dialog = document.createElement('dialog');
        dialog.className = "dialog-alert";
        dialog.innerHTML = DialogTemplates.alert(message);
        document.body.appendChild(dialog);
        
        return new Promise((resolve) => {
            const form = dialog.querySelector('form');
            form.addEventListener('submit', () => {
                dialog.close();
                document.body.removeChild(dialog);
                resolve();
            });
            
            dialog.showModal();
        });
    }
    
    static createConfirmDialog(message) {
        const dialog = document.createElement('dialog');
        dialog.className = "dialog-confirm";
        dialog.innerHTML = DialogTemplates.confirm(message);
        document.body.appendChild(dialog);
        
        return new Promise((resolve) => {
            const form = dialog.querySelector('form');
            const cancelButton = dialog.querySelector('button[value="cancel"]');
            
            form.addEventListener('submit', () => {
                dialog.close();
                document.body.removeChild(dialog);
                resolve(true);
            });
            
            cancelButton.addEventListener('click', () => {
                dialog.close();
                document.body.removeChild(dialog);
                resolve(false);
            });
            
            dialog.showModal();
        });
    }
}

// Data Management
class DataManager {
    static async loadConfig() {
        try {
            const configData = await invoke('read_config');
            //console.log("Config data loaded:", configData);
            const config = JSON.parse(configData);
            AppConfig.title = config.title || AppConfig.title;
            AppConfig.useUpdate = config.useUpdate || AppConfig.useUpdate;
            AppConfig.autoUpdate = config.autoUpdate || AppConfig.autoUpdate;
        } catch (error) {
            console.error("Error loading config:", error);
            AppConfig = { "weport": { "title": "Weport", "useUpdate": false, "autoUpdate": false } };
        }
    }
    
    static async saveConfig(configData) {
        try {
            await invoke('save_config', { data: configData });
            console.log("Config saved successfully");
        } catch (error) {
            console.error("Error saving config:", error);
        }
    }

    static async loadData() {
        const data = await invoke('read_data');
        const { name, section: sections, category: categories } = JSON.parse(data);
        AppState.name = name || "";
        AppState.sections = sections || [];
        AppState.categories = categories || [];
    }
    
    static async changeName(newName) {
        AppState.name = newName;
        let data = {
            name: AppState.name,
            section: AppState.sections,
            category: AppState.categories
        };
        this.saveData(data);
    }

    static saveData(data) {
        invoke('save_data', { data: JSON.stringify(data) })
            .then(() => console.log("Data Saved Successfully"))
            .catch((error) => console.error("Error saving data:", error));
    }
    
    static parseManageMode() {
        const result = {
            name: AppState.name,
            section: [],
            category: []
        };

        // Extract sections
        document.querySelectorAll('#manage-mode-content .manage-section-container .manage-section-title').forEach(span => {
            const id = parseInt(span.dataset.id, 10);
            const name = span.dataset.name;
            result.section.push({ id, name });
        });

        // Extract categories
        document.querySelectorAll('#manage-mode-content .manage-category-container .manage-category-title').forEach(span => {
            const sid = parseInt(span.dataset.sid, 10);
            const uid = span.dataset.uid || "";
            const cid = span.dataset.cid || "";
            const order = parseInt(span.dataset.order, 10);
            const duration = span.dataset.duration || "";
            const item = span.dataset.item;
            const status = span.dataset.status || "";
            const showId = span.dataset.showId === "true";
            const showName = span.dataset.showName === "true";
            const showDuration = span.dataset.showDuration === "true";
            if (!item) return; // Skip if item is empty

            result.category.push({
                sid, uid, cid, order, item, duration, status,
                show: {
                    id: showId,
                    name: showName,
                    duration: showDuration
                }
            });
        });

        return result;
    }

    static async updateCategoryStatus(uid, status) {
        // Implement the logic to update the category status in AppState or wherever necessary
        const category = AppState.categories.find(c => c.uid === uid);
        if (category) {
            category.status = status;
            // Optionally save the updated data
            await DataManager.saveData({
                name: AppState.name,
                section: AppState.sections,
                category: AppState.categories
            });
        }
    }
}

class DetailDataManager {
    static async loadData(file) {
        try {
            const detail = await invoke('read_detail_data', { file });
            return JSON.parse(detail);
        } catch (error) {
            console.error("Error loading detail data:", error);
            return null;
        }
    }
    
    static async saveData(file, data, successMessage = '저장되었습니다!') {
        try {
            await invoke('save_detail_data', { file, data: JSON.stringify(data) });
            await customAlert(successMessage);
            return true;
        } catch (error) {
            console.error('저장 실패:', error);
            return false;
        }
    }
    
    static async saveOrUpdateItem(file, selectedTitle, content) {
        const data = await this.loadData(file);
        if (!data || !data.data) return false;
        
        const matchedItem = data.data.find(item => item.title === selectedTitle);
        
        if (matchedItem) {
            matchedItem.content = content;
            return await this.saveData(file, data, '저장되었습니다!');
        } else {
            const newItem = {
                title: selectedTitle,
                content: content,
                datetime: Date.now() * 1e6 // Convert to nanoseconds
            };
            data.data.push(newItem);
            return await this.saveData(file, data, '새 항목이 저장되었습니다!');
        }
    }

    static async deleteItem(file, selectedTitle) {
        const data = await this.loadData(file);
        if (!data || !data.data) return false;
        const initialLength = data.data.length;
        data.data = data.data.filter(item => item.title !== selectedTitle);
        if (data.data.length === initialLength) {
            console.warn('삭제할 항목을 찾을 수 없습니다.');
            return false;
        }
        return await this.saveData(file, data, '항목이 삭제되었습니다!');
    }
}

// DOM Utility Functions
class DOMUtils {
    static createElement(tag, className = null, textContent = null) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }
    
    static clearDialogInputs() {
        document.getElementById("itemId").value = '';
        document.getElementById("itemTitle").value = '';
        document.getElementById("itemDuration").value = '';
        document.getElementById("showName").checked = false;
        document.getElementById("showId").checked = false;
        document.getElementById("showDuration").checked = false;
    }
    
    static setDialogInputs(data) {
        if (data.id !== undefined) document.getElementById("itemId").value = data.id;
        if (data.title !== undefined) document.getElementById("itemTitle").value = data.title;
        if (data.duration !== undefined) document.getElementById("itemDuration").value = data.duration;
        if (data.showName !== undefined) document.getElementById("showName").checked = data.showName;
        if (data.showId !== undefined) document.getElementById("showId").checked = data.showId;
        if (data.showDuration !== undefined) document.getElementById("showDuration").checked = data.showDuration;
        if (data.sectionTitle !== undefined) document.getElementById("itemSectionTitle").value = data.sectionTitle;
    }
    
    static formatCategoryStatus(status) {
        const statusLabel = ProgressStatus[status] || ProgressStatus[IN_PROGRESS];
        switch(status) {
            case COMPLETED:
                return `✅ `;
            case IN_PROGRESS:
                return `⌛ `;
            case CANCELLED:
                return `✖️ `;
            case PENDING:
                return `💤 `;
            default:
                break;
        }
        return `⌛ `;
    }

    static formatCategoryText(showId, showDuration, id, duration, title) {
        let text = (showId && id) ? `[${id}] ${title}` : title;
        if (showDuration && duration) {
            // Below regex handles the following formats:
            //   2026-01-01~2026-12-31 -> 26/01/01~26/12/31
            //   2025/1/1~2025/12/31   -> 25/01/01~25/12/31
            //   25/01/01-25/12/31     -> 25/01/01~25/12/31
            // Regex Explanation: Year can be 2 or 4 digits, followed by either '-' or '/',
            // then month and day (1 or 2 digits), followed by '~' or '-',
            // then another year (2 or 4 digits),
            // followed by the same separator and month/day.
            const regex = /(\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2})[~-](\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2})/;
    
            duration = duration.replace(regex, (match, y1, m1, d1, y2, m2, d2) => {
                // y1 and y2 can be either 2 or 4 digits, if 4 digits, take the last 2 digits
                const yy1 = y1.length === 4 ? y1.slice(2) : y1;
                const yy2 = y2.length === 4 ? y2.slice(2) : y2;
                // m1, d1, m2, d2 should be always 2 digits
                const mm1 = m1.padStart(2, '0');
                const dd1 = d1.padStart(2, '0');
                const mm2 = m2.padStart(2, '0');
                const dd2 = d2.padStart(2, '0');
                return `${yy1}/${mm1}/${dd1}~${yy2}/${mm2}/${dd2}`;
            });

            text += ` (${duration})`;
        }
        return text;
    }

    static formatViewModeCategoryText(showId, showName, showDuration, id, title, duration, process) {
        let text = '';
        if (showDuration && duration) {
            /// Below regex handles the following formats:
            //   2026-01-01~2026-12-31 -> 26/01/01~26/12/31
            //   2025/1/1~2025/12/31   -> 25/01/01~25/12/31
            //   25/01/01-25/12/31     -> 25/01/01~25/12/31
            // Regex Explanation: Year can be 2 or 4 digits, followed by either '-' or '/',
            // then month and day (1 or 2 digits), followed by '~' or '-',
            // then another year (2 or 4 digits),
            // followed by the same separator and month/day.
            const regex = /(\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2})[~-](\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2})/;
            duration = duration.replace(regex, (match, y1, m1, d1, y2, m2, d2) => {
                // y1 and y2 can be either 2 or 4 digits, if 4 digits, take the last 2 digits
                const yy1 = y1.length === 4 ? y1.slice(2) : y1;
                const yy2 = y2.length === 4 ? y2.slice(2) : y2;
                // m1, d1, m2, d2 should be always 2 digits
                const mm1 = m1.padStart(2, '0');
                const dd1 = d1.padStart(2, '0');
                const mm2 = m2.padStart(2, '0');
                const dd2 = d2.padStart(2, '0');
                return `${yy1}/${mm1}/${dd1}~${yy2}/${mm2}/${dd2}`;
            });
            text += `[${duration}] `;
        } 
        if (showName) {
            text += `${AppState.name}/${process}, `;
        }
        if (showId && id) text += `${id} `;
        if (title) text += title;           // Alwasys show title, regardless of showName
        return text;
    }
    
    static formatTimestamp(timestamp) {
        try {
            if (!timestamp) {
                return '날짜 없음';
            }
            
            let milliseconds;
            if (timestamp.length > 13) {
                // If the timestamp is in nanoseconds (more than 13 digits), convert it to milliseconds
                milliseconds = Math.floor(parseInt(timestamp, 10) / 1e6);
            } else {
                milliseconds = parseInt(timestamp, 10);
            }
            
            const date = new Date(milliseconds);
            
            if (isNaN(milliseconds) || isNaN(date.getTime())) {
                return '잘못된 타임스탬프';
            }
            // Change date format from timestamp to MM/dd HH:mm
            // Date format example: 2025-12-02T11:10:00.000Z → 12/02 11:10
            const datePart = date.toISOString().split('T')[0]; // 2025-12-02
            const timePart = date.toTimeString().split(':').slice(0, 2).join(':'); // 11:10
            const monthDay = datePart.substring(5).replace('-', '/'); // 12/02
            const formattedDate = monthDay + ' ' + timePart; // 12/02 11:10
            
            return formattedDate;
        } catch (error) {
            console.error('날짜 처리 오류:', error, 'timestamp:', timestamp);
            return '날짜 오류';
        }
    }
}

// Category Management
class CategoryManager {
    static create(targetElement) {
        DOMUtils.clearDialogInputs();
        DOM.dialogCategory.showModal();
        
        EventHandlerManager.removeAndAddEventListener(
            DOM.dialogCategory,
            "#saveCategoryBtn",
            "click",
            async () => {
                const uid = await invoke('get_uuid');
                const id = DOM.dialogCategory.querySelector("#itemId").value.trim();
                const title = DOM.dialogCategory.querySelector("#itemTitle").value.trim();
                const duration = DOM.dialogCategory.querySelector("#itemDuration").value.trim();
                const showId = DOM.dialogCategory.querySelector("#showId").checked;
                const showName = DOM.dialogCategory.querySelector("#showName").checked;
                const showDuration = DOM.dialogCategory.querySelector("#showDuration").checked;
                
                if (!title) return;
                
                console.log("ID:", id, "Title:", title);
                
                const categoryContainer = DOMUtils.createElement('div', 'manage-category-container');
                const categoryHeader = DOMUtils.createElement('div', 'manage-category-header');
                const categoryTitle = DOMUtils.createElement('span', 'manage-category-title', 
                    // Add status icon based on default IN_PROGRESS status for new category
                    DOMUtils.formatCategoryStatus(IN_PROGRESS) +
                    DOMUtils.formatCategoryText(showId, showDuration, id, duration, title)
                );
                
                Object.assign(categoryTitle.dataset, {
                    type: 'category',
                    sid: targetElement.dataset.id,
                    uid: uid,
                    cid: id,
                    showId: showId,
                    showName: showName,
                    showDuration: showDuration,
                    item: title,
                    order: targetElement.nextElementSibling ? targetElement.nextElementSibling.children.length + 1 : 1,
                    duration: duration,
                    status: IN_PROGRESS
                });
                
                const actionButtons = ActionButtonFactory.create(categoryTitle);
                categoryHeader.appendChild(categoryTitle);
                categoryHeader.appendChild(actionButtons);
                categoryContainer.appendChild(categoryHeader);
                
                const categoryList = targetElement.parentElement.parentElement.querySelector('.manage-category-list') || 
                    (() => {
                        const list = DOMUtils.createElement('div', 'manage-category-list');
                        targetElement.parentElement.parentElement.appendChild(list);
                        return list;
                    })();
                categoryList.appendChild(categoryContainer);
                
                const result = DataManager.parseManageMode();
                DataManager.saveData(result);
                DOM.dialogCategory.close();
            }
        );
    }
    
    static edit(targetElement) {
        DOMUtils.setDialogInputs({
            id: targetElement.dataset.cid,
            title: targetElement.dataset.item || "",
            duration: targetElement.dataset.duration || "",
            showName: targetElement.dataset.showName === "true",
            showId: targetElement.dataset.showId === "true",
            showDuration: targetElement.dataset.showDuration === "true"
        });
        
        DOM.dialogCategory.showModal();
        
        EventHandlerManager.removeAndAddEventListener(
            DOM.dialogCategory,
            "#saveCategoryBtn",
            "click",
            () => {
                const id = DOM.dialogCategory.querySelector("#itemId").value.trim();
                const title = DOM.dialogCategory.querySelector("#itemTitle").value.trim();
                const duration = DOM.dialogCategory.querySelector("#itemDuration").value.trim();
                const showName = DOM.dialogCategory.querySelector("#showName").checked;
                const showId = DOM.dialogCategory.querySelector("#showId").checked;
                const showDuration = DOM.dialogCategory.querySelector("#showDuration").checked;
                
                if (title !== "") {
                    targetElement.textContent = DOMUtils.formatCategoryStatus(targetElement.dataset.status);
                    targetElement.textContent += DOMUtils.formatCategoryText(showId, showDuration, id, duration, title);
                }
                
                console.log(`ID: ${id}\nTitle: ${title}`);
                
                Object.assign(targetElement.dataset, {
                    cid: id,
                    item: title,
                    duration: duration,
                    showName: showName,
                    showId: showId,
                    showDuration: showDuration
                });
                
                const result = DataManager.parseManageMode();
                DataManager.saveData(result);
                DOM.dialogCategory.close();
            }
        );
    }
}

// Section Management
class SectionManager {
    static createNew() {
        DOM.dialogSection.showModal();
        
        EventHandlerManager.removeAndAddEventListener(
            DOM.dialogSection, 
            "#saveSectionBtn", 
            "click", 
            () => {
                const title = DOM.dialogSection.querySelector("#itemSectionTitle").value.trim();
                if (!title) return;
                
                console.log("Title:", title);
                const container = document.getElementById('manage-mode-content');
                const sections = container.querySelectorAll('.manage-section-container');
                const newId = sections.length > 0 ? 
                    parseInt(sections[sections.length - 1].querySelector('.manage-section-title').dataset.id, 10) + 1 : 1;
                
                const sectionContainer = DOMUtils.createElement('div', 'manage-section-container');
                const sectionHeader = DOMUtils.createElement('div', 'manage-section-header');
                const sectionTitle = DOMUtils.createElement('span', 'manage-section-title', title);
                
                Object.assign(sectionTitle.dataset, {
                    type: 'section',
                    id: newId,
                    name: title
                });
                
                const actionButtons = ActionButtonFactory.create(sectionTitle);
                sectionHeader.appendChild(sectionTitle);
                sectionHeader.appendChild(actionButtons);
                sectionContainer.appendChild(sectionHeader);
                container.appendChild(document.createElement('hr'));
                container.appendChild(sectionContainer);

                const result = DataManager.parseManageMode();
                DataManager.saveData(result);
                DOM.dialogSection.close();
            }
        );
    }
    
    static edit(targetElement) {
        DOMUtils.setDialogInputs({ sectionTitle: targetElement.dataset.name || "" });
        DOM.dialogSection.showModal();
       
        EventHandlerManager.removeAndAddEventListener(
            DOM.dialogSection,
            "#saveSectionBtn",
            "click",
            () => {
                const title = DOM.dialogSection.querySelector("#itemSectionTitle").value.trim();
                if (title !== "") {
                    targetElement.textContent = title;
                }
                
                console.log(`ID: ${targetElement.dataset.id}\nTitle: ${title}`);
                targetElement.dataset.name = title;
                
                const result = DataManager.parseManageMode();
                DataManager.saveData(result);
                DOM.dialogSection.close();
            }
        );
    }
}

// Action Button Factory
class ActionButtonFactory {
    static create(targetElement) {
        const spanButtons = DOMUtils.createElement('span', 'actions');

        if (targetElement.dataset.type === 'section') {
            const btnCreate = DOMUtils.createElement('button', null, '일감 추가');
            btnCreate.onclick = () => CategoryManager.create(targetElement);
            spanButtons.appendChild(btnCreate);
        }

        const btnModify = DOMUtils.createElement('button', null, '수정');
        btnModify.onclick = () => {
            if (targetElement.dataset.type === 'section') {
                SectionManager.edit(targetElement);
            } else if (targetElement.dataset.type === 'category') {
                CategoryManager.edit(targetElement);
            }
        };

        const btnDelete = DOMUtils.createElement('button', null, '삭제');
        btnDelete.onclick = async () => await this.delete(targetElement);

        spanButtons.appendChild(btnModify);
        spanButtons.appendChild(btnDelete);

        return spanButtons;
    }
    
    static async delete(targetElement) {
        const confirmed = await customConfirm("정말 삭제하시겠습니까?");
        if (!confirmed) return;
        // Delete the associated file when deleting a category,
        // and delete all associated categories and files when deleting a section.
        if (targetElement.dataset.type === 'section') {
            // Get all categories under the section
            const sectionId = targetElement.dataset.id;
            const categoriesToDelete = document.querySelectorAll(`.manage-category-title[data-sid="${sectionId}"]`);
            // Delete each category's associated file
            for (const category of categoriesToDelete) {
                const categoryId = category.dataset.cid;
                const file = `${categoryId}.dat`;
                await DetailDataManager.deleteItem(file, category.dataset.item);
            }
        } else if (targetElement.dataset.type === 'category') {
            const categoryId = targetElement.dataset.cid;
            const file = `${categoryId}.dat`;
            await DetailDataManager.deleteItem(file, targetElement.dataset.item);
        }

        // Then delete the category or section from the UI
        const isSection = targetElement.classList.contains('manage-section-title');
        const manageContent = document.getElementById('manage-mode-content');
        
        if (isSection) {
            // When deleting a section, delete the entire section container
            const sectionContainer = targetElement.closest('.manage-section-container');
            
            // Find and delete the related hr element
            const nextSibling = sectionContainer.nextElementSibling;
            const prevSibling = sectionContainer.previousElementSibling;
            
            // If next sibling is hr, delete it
            if (nextSibling && nextSibling.tagName.toLowerCase() === 'hr') {
                nextSibling.remove();
            }
            // Otherwise, if previous sibling is hr, delete it
            else if (prevSibling && prevSibling.tagName.toLowerCase() === 'hr') {
                prevSibling.remove();
            }
            
            sectionContainer.remove();
        } else {
            // When deleting a category, delete the category container
            const categoryContainer = targetElement.closest('.manage-category-container');
            categoryContainer.remove();
        }
        
        const result = DataManager.parseManageMode();
        DataManager.saveData(result);
    }
}

class WriteActionButtonFactory {
    static create(targetElement) {
        const spanButtons = DOMUtils.createElement('span', 'actions');
        const btnDelete = DOMUtils.createElement('button', null, '삭제');
        btnDelete.onclick = async () => await this.delete(targetElement);
        spanButtons.appendChild(btnDelete);
        return spanButtons;
    }

    static async delete(targetElement) {
        const confirmed = await customConfirm("정말 삭제하시겠습니까?");
        if (!confirmed) return;
        
        let title = targetElement.dataset.content;
        // Find the item container (parent of the header)
        let itemContainer = targetElement.closest('.item-container');
        if (itemContainer) {
            itemContainer.remove();
        } else {
            targetElement.remove();
        }
        
        let file = DOM.selectCategory.value + ".dat";
        let result = await DetailDataManager.deleteItem(file, title);
        if (result) {
            await customAlert('항목이 삭제되었습니다!');
        }

        // If the item list is empty after deletion, hide it
        let itemList = DOM.writeItemList;
        if (itemList && itemList.children.length === 0) {
            itemList.style.display = 'none';
        }
    }
}

// Screen Management
class ScreenManager {
    static async showScreen(id, button) {
        document.querySelectorAll('.tab-content').forEach(div => div.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(id).style.display = 'block';
        button.classList.add('active');

        await DataManager.loadData();

        const screenHandlers = {
            'manage-mode': () => ManageMode.render(),
            'write-mode': () => WriteMode.render(),
            'view-mode': () => {
                ViewMode.render();
                ViewMode.setupEventHandlers();
            },
            'settings-mode': () => SettingsMode.render()
        };

        const handler = screenHandlers[id];
        if (handler) handler();
    }
}

// Manage Mode
class ManageMode {
    static render() {
        const manageContent = document.getElementById('manage-mode-content');
        manageContent.innerHTML = '';

        if (AppState.sections.length > 0) {
            AppState.sections.forEach(section => {
                manageContent.appendChild(this.createSection(section));
                // Removed horizontal rule between sections for cleaner UI
                //if (section !== AppState.sections[AppState.sections.length - 1]) {
                //    manageContent.appendChild(document.createElement('hr'));
                //}
            });
        }
    }

    static createSection(section) {
        // Section container
        const sectionContainer = DOMUtils.createElement('div', 'manage-section-container');
        
        // Section header
        const sectionHeader = DOMUtils.createElement('div', 'manage-section-header');
        const sectionTitle = DOMUtils.createElement('span', 'manage-section-title', section.name);

        Object.assign(sectionTitle.dataset, {
            type: 'section',
            id: section.id,
            name: section.name
        });
        
        const actionButtons = ActionButtonFactory.create(sectionTitle);
        sectionHeader.appendChild(sectionTitle);
        sectionHeader.appendChild(actionButtons);
        
        sectionContainer.appendChild(sectionHeader);

        // Category list
        if (AppState.categories.length > 0) {
            const categoryList = DOMUtils.createElement('div', 'manage-category-list');
            AppState.categories
                .filter(category => category.sid === section.id)
                .forEach(category => categoryList.appendChild(this.createCategoryItem(category)));
            sectionContainer.appendChild(categoryList);
        }
        
        return sectionContainer;
    }

    static createCategoryItem(category) {
        // Category container
        const categoryContainer = DOMUtils.createElement('div', 'manage-category-container');
        
        // Category header
        const categoryHeader = DOMUtils.createElement('div', 'manage-category-header');
        const categoryTitle = DOMUtils.createElement('span', 'manage-category-title', 
            DOMUtils.formatCategoryStatus(category.status) +
            DOMUtils.formatCategoryText(category.show.id, category.show.duration, category.cid, category.duration, category.item)
        );
        
        Object.assign(categoryTitle.dataset, {
            type: 'category',
            sid: category.sid,
            uid: category.uid,
            cid: category.cid,
            showId: category.show.id,
            showName: category.show.name,
            showDuration: category.show.duration,
            item: category.item,
            order: category.order,
            duration: category.duration,
            status: category.status
        });
        
        const actionButtons = ActionButtonFactory.create(categoryTitle);
        categoryHeader.appendChild(categoryTitle);
        categoryHeader.appendChild(actionButtons);
        
        categoryContainer.appendChild(categoryHeader);
        return categoryContainer;
    }
}

// Write Mode
class WriteMode {
    static render() {
        this.populateSectionSelect();
        this.populateCategorySelect();
    }
    
    static populateSectionSelect() {
        DOM.selectSection.innerHTML = '';
        if (AppState.sections.length === 0) return;

        AppState.sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            if (AppState.lastSelectedSection === section.name) {
                option.selected = true;
            }
            DOM.selectSection.appendChild(option);
        });
    }

    static populateCategorySelect() {
        DOM.selectCategory.innerHTML = '';
        if (AppState.categories.length === 0) return;
        // Filtering categories based on the selected section in the dropdown
        const selectedSectionId = parseInt(DOM.selectSection.value, 10);
        console.log("Selected Section ID:", selectedSectionId);
        const filteredCategories = AppState.categories.filter(category => {
          console.log("Category SID:", category.sid);
          return category.sid === selectedSectionId;
        });
        console.log("Filtered Categories:", filteredCategories);
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.dataset.status = category.status || IN_PROGRESS;
            option.value = category.uid;
            option.textContent = category.item;
            if (AppState.lastSelectedCategory === category.item) {
                option.selected = true;
            }
            DOM.selectCategory.appendChild(option);
        });
        // If there are categories after filtering, trigger the change event to load the corresponding items
        if (filteredCategories.length > 0) {
            DOM.selectCategory.dispatchEvent(new Event('change'));
        }
    }
}

// View Mode
class ViewMode {
    static setupEventHandlers() {
        EventHandlerManager.removeAndAddEventListener(
            document,
            "#showDateTime",
            "click",
            () => {
                const viewContent = document.getElementById('view-mode-content');
                const showDateButton = document.getElementById('showDateTime');
                const isShowingDate = showDateButton.textContent.includes("숨기기");
                if (isShowingDate) {
                    // Hide date
                    viewContent.querySelectorAll('li').forEach(li => {
                        // If no dataset.content, skip (category li)
                        if (!li.dataset.content) {
                            return;
                        }
                        li.textContent = '▲ ' + li.dataset.content;
                        if (li.dataset.subcontent && li.dataset.subcontent.includes('\n')) {
                            const lines = li.dataset.subcontent.split('\n');
                            const subdetailItem = DOMUtils.createElement('li', 'li-content');
                            lines.forEach(line => {
                                if (line.startsWith('-')) {
                                    const lineItem = DOMUtils.createElement('div', 'subcontent-line2', line);
                                    subdetailItem.appendChild(lineItem);
                                } else {
                                    const lineItem = DOMUtils.createElement('div', 'subcontent-line', '● ' + line);
                                    subdetailItem.appendChild(lineItem);
                                }
                            });
                            li.appendChild(subdetailItem);
                        } else {
                            if (li.dataset.subcontent) {
                                const subdetailItem = DOMUtils.createElement('li', 'li-content');
                                const lineItem = DOMUtils.createElement('div', 'subcontent-line', '● ' + li.dataset.subcontent);
                                subdetailItem.appendChild(lineItem);
                                li.appendChild(subdetailItem);
                            }                            
                        }
                    });
                    showDateButton.textContent = "일시 보이기";
                    showDateButton.dataset.state = "hidden";
                } else {
                    // Show date
                    viewContent.querySelectorAll('li').forEach(li => {
                        // If no dataset.content or dataset.timestamp, skip (category li)
                        if (!li.dataset.content || !li.dataset.timestamp) {
                            return;
                        }
                        
                        li.textContent = '▲ ' + li.dataset.content + ' (' + DOMUtils.formatTimestamp(li.dataset.timestamp) + ')';
                        if (li.dataset.subcontent && li.dataset.subcontent.includes('\n')) {
                            const lines = li.dataset.subcontent.split('\n');
                            const subdetailItem = DOMUtils.createElement('li', 'li-content');
                            lines.forEach(line => {
                                if (line.startsWith('-')) {
                                    const lineItem = DOMUtils.createElement('div', 'subcontent-line2', line);
                                    subdetailItem.appendChild(lineItem);
                                } else {
                                    const lineItem = DOMUtils.createElement('div', 'subcontent-line', '● ' + line);
                                    subdetailItem.appendChild(lineItem);
                                }
                            });
                            li.appendChild(subdetailItem);
                        } else {
                            if (li.dataset.subcontent) {
                                const subdetailItem = DOMUtils.createElement('li', 'li-content');
                                const lineItem = DOMUtils.createElement('div', 'subcontent-line', '● ' + li.dataset.subcontent);
                                subdetailItem.appendChild(lineItem);
                                li.appendChild(subdetailItem);
                            }                            
                        }
                    });
                    showDateButton.textContent = "일시 숨기기";
                    showDateButton.dataset.state = "shown";
                }
            }
        );
        EventHandlerManager.removeAndAddEventListener(
            document,
            "#copyToClipboard",
            "click",
            () => {
                const viewContent = document.getElementById('view-mode-content');
                const showDateButton = document.getElementById('showDateTime');
                let textToCopy = '';
                viewContent.querySelectorAll('.manage-section').forEach(section => {
                    const sectionTitle = section.querySelector('h4').textContent;
                    textToCopy += sectionTitle + '\n';

                    // Select only direct child li elements at category level
                    const categoryList = section.querySelector('ul.ul-content');
                    if (categoryList) {
                        Array.from(categoryList.children).forEach(categoryLi => {
                            // Get only direct text of category (excluding text from sub ul)
                            let categoryText = '';
                            categoryLi.childNodes.forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    categoryText += node.textContent.trim();
                                }
                            });
                            textToCopy += '  ' + categoryText + '\n';
                            
                            // Select sublist under the category (If exists, it should be ▲ items)
                            const subList = categoryLi.querySelector('ul.ul-content');
                            if (subList) {
                                Array.from(subList.children).forEach(detailLi => {
                                    // If the detailLi has subcontent with multiple lines, handle accordingly
                                    if (detailLi.dataset.subcontent) {
                                        if (detailLi.dataset.subcontent.includes('\n')) {
                                            const lines = detailLi.dataset.subcontent.split('\n');
                                            // If the state is "shown" and timestamp exists, include timestamp in copied text
                                            // If the state is "hidden" or timestamp doesn't exist, copy without timestamp
                                            if (showDateButton.dataset.state === "shown" && detailLi.dataset.timestamp) {
                                                textToCopy += '    ▲ ' + detailLi.dataset.content + ' (' + 
                                                    DOMUtils.formatTimestamp(detailLi.dataset.timestamp) + ')\n';
                                            } else {
                                                textToCopy += '    ▲ ' + detailLi.dataset.content + '\n';
                                            }

                                            lines.forEach(line => {
                                                if (line.startsWith('-')) {
                                                    textToCopy += '        ' + line + '\n';
                                                } else {
                                                    textToCopy += '      ● ' + line + '\n';
                                                }
                                            });
                                            return;
                                        } else if (detailLi.dataset.subcontent.trim() !== '') {
                                            if (showDateButton.dataset.state === "shown" && detailLi.dataset.timestamp) {
                                                textToCopy += '    ▲ ' + detailLi.dataset.content + ' (' + 
                                                    DOMUtils.formatTimestamp(detailLi.dataset.timestamp) + ')\n';
                                            } else {
                                                textToCopy += '    ▲ ' + detailLi.dataset.content + '\n';
                                            }
                                            textToCopy += '      ● ' + detailLi.dataset.subcontent + '\n';
                                            return;
                                        }
                                    }
                                    // If no subcontent, just use content
                                    textToCopy += '    ▲ ' + detailLi.dataset.content + '\n';
                                });
                            }
                        });
                    }
                });
                navigator.clipboard.writeText(textToCopy)
                    .then(async () => await customAlert('클립보드에 복사되었습니다!'))
                    .catch(err => console.error('클립보드 복사 실패:', err));
            }
        );
        EventHandlerManager.removeAndAddEventListener(
            document,
            "#removeData",
            "click",
            async () => {
                const confirmed = await customConfirm("구분/카테고리를 제외한 모든 데이터를 삭제하시겠습니까?");
                if (!confirmed) return;
                // All category detailed data deletion
                for (const category of AppState.categories) {
                    let file = category.uid + ".dat";
                    await invoke('delete_detail_data', { file });
                }
                await customAlert('모든 작업 내용이 삭제되었습니다!');
                await ViewMode.render();
            }
        );
    }
    
    static async render() {
        const viewContent = document.getElementById('view-mode-content');
        viewContent.innerHTML = '';

        if (AppState.sections.length > 0) {
            for (const section of AppState.sections) {
                const sectionElement = await this.createViewSection(section);
                viewContent.appendChild(sectionElement);
                if (section !== AppState.sections[AppState.sections.length - 1]) {
                    viewContent.appendChild(document.createElement('hr'));
                }
            }
        }
    }

    static async createViewSection(section) {
        const sectionDiv = DOMUtils.createElement('div', 'manage-section');

        // Section title
        const sectionTitle = DOMUtils.createElement('h4', 'h4-content', '■ ' + section.name);
        Object.assign(sectionTitle.dataset, {
            type: 'section',
            id: section.id,
            name: section.name
        });
        
        sectionDiv.appendChild(sectionTitle);

        // Category list
        if (AppState.categories.length > 0) {
            const categoryList = DOMUtils.createElement('ul', 'ul-content');
            const categoryPromises = AppState.categories
                .filter(category => category.sid === section.id)
                .map(category => this.createViewCategoryItem(category));
            const categoryItems = await Promise.all(categoryPromises);
            categoryItems.forEach(item => {
              const groupList = DOMUtils.createElement('li', 'li-content');
              groupList.textContent = '○ ' + item.textContent;
              categoryList.appendChild(groupList);

              let file = item.dataset.uid + ".dat";
              DetailDataManager.loadData(file).then(data => {
                if (!data || !data.data) return;
                // Sample data structure:
                //{
                //    "data": [
                //        {
                //          "title": "내용4",
                //          "content": "",
                //          "datetime": 1764641432600780300
                //        }
                //    ]
                //}

                // Create sublist for details
                const subList = DOMUtils.createElement('ul', 'ul-content');
                
                data.data.forEach(item => {
                  const detailItem = DOMUtils.createElement('li', 'li-content');
                  detailItem.textContent = '▲ ' + item.title;
                  Object.assign(detailItem.dataset, {
                    content: item.title,
                    subcontent: item.content,
                    timestamp: item.datetime.toString()
                  });
                  const subdetailItem = DOMUtils.createElement('li', 'li-content');
                  let subcontentText = item.content || '';
                  // If content includes new lines, split and indent
                  if (subcontentText.includes('\n')) {
                    const lines = subcontentText.split('\n');
                    lines.forEach(line => {
                        if (line.startsWith('-')) {
                            const lineItem = DOMUtils.createElement('div', 'subcontent-line2', line);
                            subdetailItem.appendChild(lineItem);
                        } else {
                            const lineItem = DOMUtils.createElement('div', 'subcontent-line', '● ' + line);
                            subdetailItem.appendChild(lineItem);
                        }
                    });
                  } else if (subcontentText) {
                    const lineItem = DOMUtils.createElement('div', 'subcontent-line', '● ' + subcontentText);
                    subdetailItem.appendChild(lineItem);
                  }
                  detailItem.appendChild(subdetailItem);
                  subList.appendChild(detailItem);
                });
                
                groupList.appendChild(subList);
              });
            });
            sectionDiv.appendChild(categoryList);
        }
        
        return sectionDiv;
    }

    static async createViewCategoryItem(category) {
        const categoryItem = DOMUtils.createElement('li', 'li-content');
        categoryItem.textContent = DOMUtils.formatViewModeCategoryText(
            category.show.id,
            category.show.name,
            category.show.duration,
            category.cid,
            category.item,
            category.duration,
            ProgressStatus[category.status] || ProgressStatus[IN_PROGRESS]
        );
        
        Object.assign(categoryItem.dataset, {
            type: 'category',
            sid: category.sid,
            uid: category.uid,
            cid: category.cid,
            showId: category.show.id,
            showName: category.show.name,
            showDuration: category.show.duration,
            item: category.item,
            order: category.order,
            duration: category.duration
        });
        
        try {
            const file = category.uid + ".dat";
            const detail = await invoke('read_detail_data', { file });
            const data = JSON.parse(detail);
            console.log("Detail Data Loaded for", category.item, ":", data);
            // Process detail data here if needed
        } catch (error) {
            console.error("Error loading detail data:", error);
        }
        
        return categoryItem;
    }
}

// Settings Mode
class SettingsMode {
    static async render() {
        const settingsContent = document.getElementById('settings-mode-content');
        settingsContent.innerHTML = '';
        
        const { container, saveButton } = await SettingsMode.createSettingsView();
        settingsContent.appendChild(container);
        settingsContent.appendChild(saveButton);
    }

    static async createSettingsView() {
        const settingsContainer = DOMUtils.createElement('div', 'settings-container');
        // Set the title of the settings page
        const title = DOMUtils.createElement('h4', null, '환경설정');
        settingsContainer.appendChild(title);
        // Input field for name with label
        const nameFormRow = DOMUtils.createElement('div', 'settings-form-row');
        const nameLabel = DOMUtils.createElement('label', null, '이름:');
        nameLabel.htmlFor = 'userNameInput';
        const nameInput = DOMUtils.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'userNameInput';
        nameInput.value = AppState.name || '';
        nameInput.placeholder = '사용자 이름을 입력하세요';
        nameInput.autocomplete= 'off';
        nameFormRow.appendChild(nameLabel);
        nameFormRow.appendChild(nameInput);
        settingsContainer.appendChild(nameFormRow);
        // hr 요소 생성
        const hr = DOMUtils.createElement('hr');
        // 스타일 지정
        hr.style.border = 'none';          // 기본 border 제거
        hr.style.borderTop = '1px solid #ccc'; // 연한 그레이(#ccc) 선 추가
        hr.style.margin = '10px 0';        // 위아래 여백
        settingsContainer.appendChild(hr);
        // Checkbox for Auto update with label
        const autoUpdateRow = DOMUtils.createElement('div', 'settings-form-row2');
        const useStartupRow = DOMUtils.createElement('div', 'settings-form-row2');
        const useUpdateLabel = DOMUtils.createElement('label', null, '업데이트 사용');
        const useUpdateCheckbox = DOMUtils.createElement('input');
        useUpdateCheckbox.type = 'checkbox';
        useUpdateCheckbox.id = 'useUpdateCheckbox';
        useUpdateCheckbox.checked = AppConfig.useUpdate || false;
        autoUpdateRow.appendChild(useUpdateCheckbox);
        useUpdateLabel.htmlFor = 'useUpdateCheckbox';
        autoUpdateRow.appendChild(useUpdateLabel);
        // If useUpdate is checked, enable the auto update option, otherwise disable it
        useUpdateCheckbox.addEventListener('change', () => {
            autoUpdateCheckbox.disabled = !useUpdateCheckbox.checked;
        });
        const autoUpdateCheckbox = DOMUtils.createElement('input');
        autoUpdateCheckbox.type = 'checkbox';
        autoUpdateCheckbox.id = 'autoUpdateCheckbox';
        autoUpdateCheckbox.checked = AppConfig.autoUpdate || false;
        // If useUpdate is unchecked, disable the auto update option
        autoUpdateCheckbox.disabled = !useUpdateCheckbox.checked;
        autoUpdateRow.appendChild(autoUpdateCheckbox);
        const autoUpdateLabel = DOMUtils.createElement('label', null, '자동 업데이트 사용');
        autoUpdateLabel.htmlFor = 'autoUpdateCheckbox';
        autoUpdateRow.appendChild(autoUpdateLabel);
        settingsContainer.appendChild(autoUpdateRow);
        // Check if a program runs automatically at Windows startup 
        const isStartup = await invoke('is_startup');
        const useStartupCheckbox = DOMUtils.createElement('input');
        useStartupCheckbox.type = 'checkbox';
        useStartupCheckbox.id = 'useStartupCheckbox';
        useStartupCheckbox.checked = isStartup;
        useStartupRow.appendChild(useStartupCheckbox);
        // When the useStartup option is enabled, weport launches automatically at Windows startup.
        const useStartupLabel = DOMUtils.createElement('label', null, '윈도우 시작시 자동 실행');
        useStartupLabel.htmlFor = 'useStartupCheckbox';
        useStartupRow.appendChild(useStartupLabel);
        settingsContainer.appendChild(useStartupRow);
        // Save button (placed separately outside the container for better layout)
        const buttonRow = DOMUtils.createElement('div', 'settings-button-row');
        const saveButton = DOMUtils.createElement('button', 'settings-save-btn', '저장');
        saveButton.onclick = async () => {
            const newName = nameInput.value.trim();
            if (newName) {
                await DataManager.changeName(newName);
            } else {
                await customAlert('이름을 입력해주세요.');
                return;
            }
            const useStartup = useStartupCheckbox.checked;
            try {
                await invoke('update_startup', { isStartup: useStartup });
                console.log("Config saved successfully");
            } catch (error) {
                console.error("Error saving config:", error);
            }
            const useUpdate = useUpdateCheckbox.checked;
            AppConfig.useUpdate = useUpdate;
            const autoUpdate = autoUpdateCheckbox.checked;
            AppConfig.autoUpdate = autoUpdate;
            await DataManager.saveConfig(JSON.stringify(AppConfig));
            await customAlert('설정이 저장되었습니다.');
        };
        
        buttonRow.appendChild(saveButton);
        
        return { container: settingsContainer, saveButton: buttonRow };
    }
}

// Custom Alert and Confirm Functions
async function customAlert(message) {
    return await showToast(message);
}

async function customConfirm(message) {
    return await DialogFactory.createConfirmDialog(message);
}

async function customConfirmAlert(message) {
    return await DialogFactory.createAlertDialog(message);
}

// Global Functions
function newManageItem() {
    SectionManager.createNew();
}

// Save Button Height Manager
class SaveButtonManager {
    static adjustButtonHeight() {
        if (!DOM.selectTitle || !DOM.writeReportArea || !DOM.saveButton) return;
        
        const titleTop = DOM.selectTitle.offsetTop;
        const textareaRect = DOM.writeReportArea.getBoundingClientRect();
        const containerRect = DOM.selectTitle.parentElement.getBoundingClientRect();
        const textareaBottom = textareaRect.bottom - containerRect.top;
        
        const buttonHeight = textareaBottom - titleTop;
        DOM.saveButton.style.height = buttonHeight + 'px';
    }
    
    static setupResizeObserver() {
        if (!DOM.writeReportArea || !DOM.saveButton) return;
        
        const resizeObserver = new ResizeObserver(() => {
            this.adjustButtonHeight();
        });
        
        resizeObserver.observe(DOM.writeReportArea);
        
        // Initial adjustment
        setTimeout(() => this.adjustButtonHeight(), 100);
    }
}

// Initialize application
function initializeApp() {
    DOM.init();
    DOM.dialogCategory = DialogFactory.createDialog("dialog_category", "카테고리");
    DOM.dialogSection = DialogFactory.createDialog("dialog_section", "제목");
    
    DataManager.loadConfig().then(() => {
        //console.log("AppConfig loaded:", AppConfig);
        DOM.title.textContent = AppConfig.title;
    });

    function setReportData() {
        DOM.dataListTitles.innerHTML = '';
        DOM.selectTitle.value = '';         // Initialize select box
        DOM.writeReportArea.value = '';     // Initialize content input field
        let dataList = DOM.dataListTitles;
        let itemList = DOM.writeItemList;
        itemList.innerHTML = '';
        let file = DOM.selectCategory.value + ".dat";
        
        console.log("Loading detail data from file:", file);
        DetailDataManager.loadData(file).then(d => {
            if (!d || !d.data || d.data.length === 0) {
                itemList.style.display = 'none';  // If no data, hide the item list
                return;
            }
            itemList.style.display = 'block';     // If data exists, show the item list
            console.log("Detail Data Loaded for selected category:", d.data);
            d.data.forEach(item => {
                console.log("  Item:", item.title, item.content, item.datetime);
                let option = DOMUtils.createElement('option', null, item.title);
                option.value = item.title;
                dataList.appendChild(option);
                
                // Create container for the item
                let listItemContainer = DOMUtils.createElement('div', 'item-container');
                listItemContainer.dataset.status = item.status || IN_PROGRESS;
                // Create header with title and button
                let listItemHeader = DOMUtils.createElement('div', 'item-header');
                let listItemTitle = DOMUtils.createElement('span', 'item-title', item.title);
                let actionButtons = WriteActionButtonFactory.create(listItemContainer);
                
                listItemHeader.appendChild(listItemTitle);
                listItemHeader.appendChild(actionButtons);
                
                // Create sublist for content items
                let listItem = DOMUtils.createElement('ul', 'item-content');
                
                Object.assign(listItemContainer.dataset, {
                    content: item.title,
                    timestamp: item.datetime.toString()
                });
                
                item.content.split('\n').forEach((line) => {
                    if (line.trim()) { // Only add non-empty lines
                        let subItem = DOMUtils.createElement('li', 'li-content', line);
                        listItem.appendChild(subItem);
                    }
                });

                listItemContainer.appendChild(listItemHeader);
                listItemContainer.appendChild(listItem);
                itemList.appendChild(listItemContainer);
            });
        });
    }

    // Setup save button
    if (DOM.saveButton) {
        DOM.saveButton.addEventListener('click', async () => {
            const selectedTitle = DOM.selectTitle.value;
            const file = DOM.selectCategory.value + ".dat";
            // Save the content after removing empty lines
            const content = DOM.writeReportArea.value
                .split('\n')
                .filter(line => line.trim() !== '')
                .join('\n');
            // Update textarea value
            DOM.writeReportArea.value = content;
            const success = await DetailDataManager.saveOrUpdateItem(file, selectedTitle, content);
            // Update item list
            if (success) setReportData();
        });
        
        SaveButtonManager.setupResizeObserver();
    }
    
    // Setup select box change handlers
    DOM.selectSection.addEventListener('change', () => {
        DOM.selectSection.title = DOM.selectSection.options[DOM.selectSection.selectedIndex].text;
        AppState.lastSelectedSection = DOM.selectSection.title;
        // If the selected section has changed, we need to update the category select box accordingly
        WriteMode.populateCategorySelect();
    });

    DOM.selectCategory.addEventListener('change', () => {
        let option = DOM.selectCategory.options[DOM.selectCategory.selectedIndex];
        DOM.selectCategory.title = option.text;
        const statusValue = option.dataset.status || IN_PROGRESS;
        DOM.selectStatus.value = statusValue;                   // Set the actual selected value
        DOM.selectStatus.title = ProgressStatus[statusValue];   // Set the tooltip
        AppState.lastSelectedCategory = DOM.selectCategory.title;
        // report-titles
        setReportData();
    });

    DOM.selectStatus.addEventListener('change', async () => {
        let option = DOM.selectCategory.options[DOM.selectCategory.selectedIndex];
        if (!option) return;
        // Check if status is unchanged.
        if (option.dataset.status === DOM.selectStatus.value) {
            console.log("Status unchanged, no update needed.");   
            return; // No change
        }
        const statusKey = DOM.selectStatus.value;
        option.dataset.status = statusKey;
        // Save the updated status to DataManager
        console.log("Updating category status to:", statusKey);
        // uid : option.value
        await DataManager.updateCategoryStatus(option.value, statusKey);
    });

    DOM.selectTitle.addEventListener('change', () => {
        const selectedTitle = DOM.selectTitle.value;
        console.log("Selected title from datalist:", selectedTitle);
        let writeArea = DOM.writeReportArea;
        let file = DOM.selectCategory.value + ".dat";
        console.log("Loading detail data from file for title selection:", file);
        DetailDataManager.loadData(file).then(d => {
            if (!d || !d.data) return;
            const matchedItem = d.data.find(item => item.title === selectedTitle);
            if (matchedItem) {
                writeArea.value = matchedItem.content;
            }
        });
    });
}

// Event Listeners
window.addEventListener("DOMContentLoaded", () => {
    initializeApp();
    ScreenManager.showScreen('write-mode', document.getElementById('writeReport'));
    
    const container = document.getElementById('manage-mode-content');
    new Sortable(container, {
        animation: 150,
        handle: '.manage-section-title',
        draggable: '.manage-section-container',
        filter: 'hr, .actions button',
        forceFallback: true,
        fallbackTolerance: 5,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        
        onMove: (evt) => {
            return evt.related && evt.related.classList.contains('manage-section-container');
        },
        
        onEnd: (evt) => {
            // Remove all hr elements
            container.querySelectorAll('hr').forEach(hr => hr.remove());
            
            // Add hr after each section (except the last one)
            const sections = container.querySelectorAll('.manage-section-container');
            sections.forEach((section, idx) => {
                if (idx < sections.length - 1) {
                    const hr = document.createElement('hr');
                    section.insertAdjacentElement('afterend', hr);
                    const span = section.querySelector('.manage-section-title');
                    if (span) {
                        span.dataset.id = idx + 1; // Update section order
                    }
                }
            });

            const result = DataManager.parseManageMode();
            DataManager.saveData(result);
        }
    });
});

// Expose global functions
window.showScreen = ScreenManager.showScreen;
window.newManageItem = newManageItem;
window.customAlert = customAlert;
window.customConfirm = customConfirm;