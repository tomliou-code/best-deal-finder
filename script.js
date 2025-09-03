// 預設方案資料
const defaultPlans = [
    { id: 1, name: "甜心卡 (雞塊*4+小飲)", items: ["雞塊", "飲料"], price: 49 },
    { id: 2, name: "甜心卡 (雞塊*4+小薯)", items: ["雞塊", "薯條"], price: 49 },
    { id: 3, name: "甜心卡 (冰炫風+小飲)", items: ["冰炫風", "飲料"], price: 60 },
    { id: 4, name: "甜心卡 (冰炫風+小薯)", items: ["冰炫風", "薯條"], price: 60 },
    { id: 5, name: "1+1 (麥克雙牛堡+小飲)", items: ["麥克雙牛堡", "飲料"], price: 69 },
    { id: 6, name: "1+1 (吉事漢堡+小飲)", items: ["吉事漢堡", "飲料"], price: 50 },
    { id: 7, name: "單點 (勁辣雞腿堡)", items: ["勁辣雞腿堡"], price: 81 },
    { id: 8, name: "單點 (麥脆雞*2)", items: ["麥脆雞 (原/辣)"], price: 129 }
];

const defaultItems = ['雞塊', '薯條', '飲料', '勁辣雞腿堡', '麥克雙牛堡', '吉事漢堡', '冰炫風', '麥脆雞 (原/辣)'];

// 全局變數
let plans = [...defaultPlans]; // 初始化為預設方案
let requirements = [];
let availableItems = [...defaultItems]; // 預設項目
let itemLevels = []; // 項目等級關係
let editingPlanId = null; // 正在編輯的方案ID

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded');
    loadDataFromStorage();
    updatePlansList();
    updateItemsList();
    updateItemCheckboxes();
    updateLevelSelects();
    updateLevelList();
    initializeDragAndDrop();
    console.log('DOMContentLoaded end');
    document.getElementById('addPlanBtn').addEventListener('click', function() { //為了不在html顯示onclick方法
        console.log('addPlanBtn clicked');
        addPlan();
    });
    document.getElementById('addItemBtn').addEventListener('click', function() {
        console.log('addItemBtn clicked');
        addNewItem();
    });
    document.getElementById('resetToDefaultBtn').addEventListener('click', function() { 
        console.log('resetToDefaultBtn clicked');
        resetToDefault();
    });
    document.getElementById('clearAllDataBtn').addEventListener('click', function() { 
        console.log('clearAllDataBtn clicked');
        clearAllData();
    });
});

// 添加方案
function addPlan() {

    const nameInput = document.getElementById('planName');
    const priceInput = document.getElementById('planPrice');
    const customItemsInput = document.getElementById('customItems');
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    console.log('addPlan', "方案名稱:"+name, "價格:"+price, "自定義項目:"+customItemsInput.value);
    if (!name || !price || price <= 0) {
        alert('請填寫完整的方案名稱和價格！');
        return;
    }
    
    // 獲取選中的項目
    const checkedItems = Array.from(document.querySelectorAll('#planItemCheckboxes input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    // 獲取自定義項目
    const customItems = customItemsInput.value.trim()
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    
    const allItems = [...checkedItems, ...customItems];
    
    if (allItems.length === 0) {
        alert('請選擇至少一個項目！');
        return;
    }
    
    // 如果是編輯模式，檢查名稱是否與其他方案重複
    if (editingPlanId) {
        if (plans.some(plan => plan.name === name && plan.id !== editingPlanId)) {
            alert('方案名稱已存在，請使用不同的名稱！');
            return;
        }
    } else {
        // 新增模式，檢查是否已存在相同名稱的方案
        if (plans.some(plan => plan.name === name)) {
            alert('方案名稱已存在，請使用不同的名稱！');
            return;
        }
    }
    
    if (editingPlanId) {
        // 編輯現有方案
        const planIndex = plans.findIndex(plan => plan.id === editingPlanId);
        if (planIndex !== -1) {
            plans[planIndex] = {
                id: editingPlanId,
                name: name,
                items: allItems,
                price: price
            };
        }
        editingPlanId = null;
        document.getElementById('addPlanBtn').textContent = '添加方案';
        showNotification(`方案「${name}」已更新！`, 'success');
    } else {
        // 添加新方案
        const newPlan = {
            id: Date.now(),
            name: name,
            items: allItems,
            price: price
        };
        
        plans.push(newPlan);
        showNotification(`方案「${name}」已成功添加！`, 'success');
    }
    
    // 清空輸入欄位
    nameInput.value = '';
    priceInput.value = '';
    customItemsInput.value = '';
    document.querySelectorAll('#planItemCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // 更新顯示和儲存
    updatePlansList();
    saveDataToStorage();
    
    // 成功訊息已在上面處理
}

// 刪除方案
function deletePlan(planId) {
    if (confirm('確定要刪除這個方案嗎？')) {
        plans = plans.filter(plan => plan.id !== planId);
        updatePlansList();
        saveDataToStorage();
        showNotification('方案已刪除！', 'info');
    }
}

// 更新方案列表顯示
function updatePlansList() {
    const plansList = document.getElementById('plansList');
    
    if (plans.length === 0) {
        plansList.innerHTML = '<p class="no-result">尚未添加任何方案</p>';
        return;
    }
    
    // 使用 Promise 方式處理 DOM 更新和事件綁定
    Promise.resolve().then(() => {
        plansList.innerHTML = plans.map(plan => `
            <div class="plan-item" data-plan-id="${plan.id}">
                <div class="plan-header">
                    <span class="plan-name">${plan.name}</span>
                    <div>
                        <span class="plan-price">$${plan.price}</span>
                        <button class="edit-btn edit-plan-btn" data-plan-id="${plan.id}">修改</button>
                        <button class="delete-btn delete-plan-btn" data-plan-id="${plan.id}">刪除</button>
                    </div>
                </div>
                <div class="plan-items">包含：${plan.items.join('、')}</div>
            </div>
        `).join('');
    }).then(() => {
        // DOM 更新完成後綁定事件
        // 為所有編輯按鈕添加事件監聽器
        document.querySelectorAll('.edit-plan-btn').forEach(button => {
            button.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-plan-id'));
                console.log('edit-plan-btn clicked for plan ID:', planId);
                editPlan(planId);
            });
        });
        
        // 為所有刪除按鈕添加事件監聽器
        document.querySelectorAll('.delete-plan-btn').forEach(button => {
            button.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-plan-id'));
                console.log('delete-plan-btn clicked for plan ID:', planId);
                deletePlan(planId);
            });
        });
    });
}

// 編輯方案
function editPlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    // 填入表單
    document.getElementById('planName').value = plan.name;
    document.getElementById('planPrice').value = plan.price;
    
    // 清空自定義項目輸入
    document.getElementById('customItems').value = '';
    
    // 設置勾選狀態
    document.querySelectorAll('#planItemCheckboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = plan.items.includes(cb.value);
    });
    
    // 設置編輯模式
    editingPlanId = planId;
    document.getElementById('addPlanBtn').textContent = '更新方案';
    
    // 滾動到表單
    document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth' });
    
    showNotification(`正在編輯方案「${plan.name}」`, 'info');
}

// 項目管理功能
function addNewItem() {
    const newItemInput = document.getElementById('newItemName');
    const itemName = newItemInput.value.trim();
    
    if (!itemName) {
        alert('請輸入項目名稱！');
        return;
    }
    
    if (availableItems.includes(itemName)) {
        alert('項目已存在！');
        return;
    }
    
    availableItems.push(itemName);
    newItemInput.value = '';
    
    updateItemsList();
    updateItemCheckboxes();
    saveDataToStorage();
    showNotification(`項目「${itemName}」已新增！`, 'success');
}

function editItem(oldName) {
    const newName = prompt('請輸入新的項目名稱：', oldName);
    if (!newName || newName.trim() === '') return;
    
    const trimmedNewName = newName.trim();
    if (trimmedNewName === oldName) return;
    
    if (availableItems.includes(trimmedNewName)) {
        alert('項目名稱已存在！');
        return;
    }
    
    // 更新項目名稱
    const index = availableItems.indexOf(oldName);
    if (index !== -1) {
        availableItems[index] = trimmedNewName;
        
        // 更新現有方案中的項目名稱
        plans.forEach(plan => {
            const itemIndex = plan.items.indexOf(oldName);
            if (itemIndex !== -1) {
                plan.items[itemIndex] = trimmedNewName;
            }
        });
        
        updateItemsList();
        updateItemCheckboxes();
        updateLevelSelects();
        updatePlansList();
        saveDataToStorage();
        showNotification(`項目已更名為「${trimmedNewName}」！`, 'success');
    }
}

function deleteItem(itemName) {
    if (confirm(`確定要刪除項目「${itemName}」嗎？\n注意：這會影響包含此項目的現有方案。`)) {
        // 從可用項目中移除
        availableItems = availableItems.filter(item => item !== itemName);
        
        // 從現有方案中移除此項目
        plans.forEach(plan => {
            plan.items = plan.items.filter(item => item !== itemName);
        });
        
        // 移除空方案
        plans = plans.filter(plan => plan.items.length > 0);
        
        updateItemsList();
        updateItemCheckboxes();
        updateLevelSelects();
        saveDataToStorage();
        showNotification(`項目「${itemName}」已刪除！`, 'info');
    }
}

function updateItemsList() {
    const itemsList = document.getElementById('itemsList');
    
    if (availableItems.length === 0) {
        itemsList.innerHTML = '<p class="no-result">尚未添加任何項目</p>';
        return;
    }
    
    // 使用 Promise 方式處理 DOM 更新和事件綁定
    Promise.resolve().then(() => {
        itemsList.innerHTML = availableItems.map(item => `
            <div class="item-management-item" draggable="true">
                <span class="item-name">${item}</span>
                <div class="item-actions">
                    <button class="edit-btn edit-item-btn" data-item="${item}">修改</button>
                    <button class="delete-btn delete-item-btn" data-item="${item}">刪除</button>
                </div>
            </div>
        `).join('');
    }).then(() => {
        // DOM 更新完成後綁定事件
        // 為所有編輯按鈕添加事件監聽器
        document.querySelectorAll('.edit-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemName = this.getAttribute('data-item');
                console.log('edit-item-btn clicked for:', itemName);
                editItem(itemName);
            });
        });
        
        // 為所有刪除按鈕添加事件監聽器
        document.querySelectorAll('.delete-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const itemName = this.getAttribute('data-item');
                console.log('delete-item-btn clicked for:', itemName);
                deleteItem(itemName);
            });
        });
    });
}

function updateItemCheckboxes() {
    // 更新方案輸入區域的選項
    const planCheckboxes = document.getElementById('planItemCheckboxes');
    planCheckboxes.innerHTML = availableItems.map(item => `
        <label><input type="checkbox" value="${item}"> ${item}</label>
    `).join('');
    
    // 更新需求輸入區域的選項
    const requirementCheckboxes = document.getElementById('requirementItemCheckboxes');
    requirementCheckboxes.innerHTML = availableItems.map(item => `
        <label><input type="checkbox" value="${item}" onchange="updateRequirement()"> ${item}</label>
    `).join('');
}

// 項目等級管理功能
function addItemLevel() {
    const baseItem = document.getElementById('baseItem').value;
    const upgradeItem = document.getElementById('upgradeItem').value;
    
    if (!baseItem || !upgradeItem) {
        alert('請選擇基礎項目和上級項目！');
        return;
    }
    
    if (baseItem === upgradeItem) {
        alert('基礎項目和上級項目不能相同！');
        return;
    }
    
    // 檢查是否已存在相同的等級關係
    if (itemLevels.some(level => level.base === baseItem && level.upgrade === upgradeItem)) {
        alert('此等級關係已存在！');
        return;
    }
    
    itemLevels.push({ base: baseItem, upgrade: upgradeItem });
    
    document.getElementById('baseItem').value = '';
    document.getElementById('upgradeItem').value = '';
    
    updateLevelList();
    saveDataToStorage();
    showNotification(`已設定「${upgradeItem}」可替代「${baseItem}」`, 'success');
}

function deleteItemLevel(base, upgrade) {
    if (confirm(`確定要刪除「${upgrade}」替代「${base}」的關係嗎？`)) {
        itemLevels = itemLevels.filter(level => !(level.base === base && level.upgrade === upgrade));
        updateLevelList();
        saveDataToStorage();
        showNotification('等級關係已刪除！', 'info');
    }
}

function updateLevelSelects() {
    const baseSelect = document.getElementById('baseItem');
    const upgradeSelect = document.getElementById('upgradeItem');
    
    if (!baseSelect || !upgradeSelect) return;
    
    const baseOptions = availableItems.map(item => `<option value="${item}">${item}</option>`).join('');
    const upgradeOptions = availableItems.map(item => `<option value="${item}">${item}</option>`).join('');
    
    baseSelect.innerHTML = '<option value="">選擇基礎項目</option>' + baseOptions;
    upgradeSelect.innerHTML = '<option value="">選擇上級項目</option>' + upgradeOptions;
}

function updateLevelList() {
    const levelList = document.getElementById('levelList');
    
    if (!levelList) return;
    
    if (itemLevels.length === 0) {
        levelList.innerHTML = '<p class="no-result">尚未設定任何等級關係</p>';
        return;
    }
    
    levelList.innerHTML = itemLevels.map(level => `
        <div class="level-item">
            <span class="level-text">「${level.upgrade}」可替代「${level.base}」</span>
            <button class="delete-btn" onclick="deleteItemLevel('${level.base}', '${level.upgrade}')">刪除</button>
        </div>
    `).join('');
}

// 獲取項目的所有可替代項目（包括自身和上級項目）
function getItemAlternatives(targetItem) {
    const alternatives = [targetItem]; // 包含自身
    
    // 找出所有可以替代目標項目的上級項目
    function findUpgrades(item) {
        itemLevels.forEach(level => {
            if (level.base === item && !alternatives.includes(level.upgrade)) {
                alternatives.push(level.upgrade);
                findUpgrades(level.upgrade); // 遞歸查找更高級的項目
            }
        });
    }
    
    findUpgrades(targetItem);
    return alternatives;
}

// 拖曳排序功能
function initializeDragAndDrop() {
    const itemsList = document.getElementById('itemsList');
    if (!itemsList) return;
    
    // 使用簡單的拖曳實現
    let draggedElement = null;
    
    itemsList.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('item-management-item')) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }
    });
    
    itemsList.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('item-management-item')) {
            e.target.style.opacity = '1';
            draggedElement = null;
        }
    });
    
    itemsList.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    itemsList.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedElement && e.target.classList.contains('item-management-item') && e.target !== draggedElement) {
            const draggedItemName = draggedElement.querySelector('.item-name').textContent;
            const targetItemName = e.target.querySelector('.item-name').textContent;
            
            const draggedIndex = availableItems.indexOf(draggedItemName);
            const targetIndex = availableItems.indexOf(targetItemName);
            
            if (draggedIndex !== -1 && targetIndex !== -1) {
                // 重新排序
                availableItems.splice(draggedIndex, 1);
                availableItems.splice(targetIndex, 0, draggedItemName);
                
                updateItemsList();
                updateItemCheckboxes();
                updateLevelSelects();
                saveDataToStorage();
                showNotification('項目順序已更新！', 'success');
            }
        }
    });
}

// 更新需求
function updateRequirement() {
    // 獲取選中的項目
    const checkedItems = Array.from(document.querySelectorAll('#requirementItemCheckboxes input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    // 獲取自定義需求
    const customRequirement = document.getElementById('customRequirement').value.trim();
    const customItems = customRequirement
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    
    requirements = [...checkedItems, ...customItems];
    
    // 更新相關方案顯示
    updateRelatedPlans();
}

// 顯示包含所需項目的相關方案
function updateRelatedPlans() {
    const relatedPlansContainer = document.getElementById('relatedPlansContainer');
    
    if (requirements.length === 0) {
        relatedPlansContainer.innerHTML = '<p class="no-result">請選擇需要的項目以查看相關方案</p>';
        return;
    }
    
    if (plans.length === 0) {
        relatedPlansContainer.innerHTML = '<p class="no-result">尚未添加任何方案</p>';
        return;
    }
    
    // 找出包含任何所需項目的方案
    const relatedPlans = plans.filter(plan => {
        return requirements.some(reqItem => {
            // 檢查方案是否包含所需項目或其替代項目
            const alternatives = getItemAlternatives(reqItem);
            return plan.items.some(planItem => alternatives.includes(planItem));
        });
    }).map(plan => {
        // 計算每個方案滿足的需求項目
        const satisfiedRequirements = requirements.filter(reqItem => {
            const alternatives = getItemAlternatives(reqItem);
            return plan.items.some(planItem => alternatives.includes(planItem));
        });
        
        // 計算覆蓋率
        const coverageRate = (satisfiedRequirements.length / requirements.length * 100).toFixed(0);
        
        return {
            ...plan,
            satisfiedRequirements,
            coverageRate: parseInt(coverageRate),
            pricePerItem: (plan.price / plan.items.length).toFixed(1)
        };
    });
    
    if (relatedPlans.length === 0) {
        relatedPlansContainer.innerHTML = `
            <div class="no-result">
                <p>😔 找不到包含所需項目的方案</p>
                <p>需求項目：${requirements.join('、')}</p>
                <p>建議：檢查方案內容或設定項目等級關係</p>
            </div>
        `;
        return;
    }
    
    // 按價格由小到大排序
    relatedPlans.sort((a, b) => a.price - b.price);
    
    const relatedPlansHtml = relatedPlans.map((plan, index) => `
        <div class="related-plan-item ${plan.coverageRate === 100 ? 'full-coverage' : ''}" data-plan-id="${plan.id}">
            <div class="plan-rank">#${index + 1}</div>
            <div class="plan-info">
                <div class="plan-header">
                    <span class="plan-name">${plan.name}</span>
                    <div class="plan-metrics">
                        <span class="plan-price">$${plan.price}</span>
                        <span class="coverage-badge ${plan.coverageRate === 100 ? 'complete' : 'partial'}">
                            ${plan.coverageRate}% 覆蓋
                        </span>
                    </div>
                </div>
                <div class="plan-details">
                    <div class="plan-items">包含：${plan.items.join('、')}</div>
                    <div class="satisfied-items">滿足需求：${plan.satisfiedRequirements.join('、')}</div>
                    <div class="plan-stats">
                        <span class="price-per-item">平均每項：$${plan.pricePerItem}</span>
                        <span class="total-items">${plan.items.length} 項目</span>
                    </div>
                </div>
            </div>
            <div class="plan-selection">
                <label class="selection-checkbox">
                    <input type="checkbox" class="plan-checkbox" data-plan-id="${plan.id}" data-price="${plan.price}" onchange="updateTotalCalculation()">
                    <span class="checkbox-label">選擇</span>
                </label>
                <div class="quantity-input">
                    <label for="quantity-${plan.id}">數量：</label>
                    <input type="number" id="quantity-${plan.id}" class="quantity-field" min="1" value="1" data-plan-id="${plan.id}" onchange="updateTotalCalculation()" disabled>
                </div>
            </div>
        </div>
    `).join('');
    
    relatedPlansContainer.innerHTML = `
        <div class="related-plans-header">
            <p class="plans-summary">找到 ${relatedPlans.length} 個相關方案，按價格排序：</p>
            <div class="filter-options">
                <label class="filter-checkbox">
                    <input type="checkbox" id="showFullCoverageOnly" onchange="toggleFullCoverageFilter()">
                    只顯示完全符合的方案
                </label>
            </div>
        </div>
        <div class="total-calculation-section">
            <div class="calculation-summary">
                <h4>已選方案總計</h4>
                <div id="selectedPlansList" class="selected-plans-list">
                    <p class="no-selection">尚未選擇任何方案</p>
                </div>
                <div class="total-amount">
                    <span class="total-label">總金額：</span>
                    <span id="totalAmount" class="total-value">$0</span>
                </div>
                <div class="calculation-actions">
                    <button onclick="clearAllSelections()" class="clear-selection-btn">清除選擇</button>
                    <button onclick="showSelectedPlansContent()" class="show-content-btn">方案內容物</button>
                </div>
            </div>
        </div>
        <div class="related-plans-list">
            ${relatedPlansHtml}
        </div>
    `;
}

// 切換完全覆蓋篩選
function toggleFullCoverageFilter() {
    const showFullOnly = document.getElementById('showFullCoverageOnly').checked;
    const planItems = document.querySelectorAll('.related-plan-item');
    
    planItems.forEach(item => {
        if (showFullOnly) {
            if (item.classList.contains('full-coverage')) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } else {
            item.style.display = 'flex';
        }
    });
    
    // 更新排名
    const visibleItems = Array.from(planItems).filter(item => item.style.display !== 'none');
    visibleItems.forEach((item, index) => {
        const rankElement = item.querySelector('.plan-rank');
        if (rankElement) {
            rankElement.textContent = `#${index + 1}`;
        }
    });
}

// 更新總金額計算
function updateTotalCalculation() {
    const checkboxes = document.querySelectorAll('.plan-checkbox');
    const selectedPlansList = document.getElementById('selectedPlansList');
    const totalAmountElement = document.getElementById('totalAmount');
    
    let selectedPlans = [];
    let totalAmount = 0;
    
    checkboxes.forEach(checkbox => {
        const planId = parseInt(checkbox.dataset.planId);
        const price = parseFloat(checkbox.dataset.price);
        const quantityField = document.getElementById(`quantity-${planId}`);
        
        if (checkbox.checked) {
            // 啟用數量欄位
            quantityField.disabled = false;
            const quantity = parseInt(quantityField.value) || 1;
            const subtotal = price * quantity;
            totalAmount += subtotal;
            
            // 找到對應的方案資訊
            const plan = plans.find(p => p.id === planId);
            if (plan) {
                selectedPlans.push({
                    ...plan,
                    quantity: quantity,
                    subtotal: subtotal
                });
            }
        } else {
            // 禁用數量欄位
            quantityField.disabled = true;
            quantityField.value = 1;
        }
    });
    
    // 更新已選方案列表
    if (selectedPlansList) {
        if (selectedPlans.length === 0) {
            selectedPlansList.innerHTML = '<p class="no-selection">尚未選擇任何方案</p>';
        } else {
            const selectedPlansHtml = selectedPlans.map(plan => `
                <div class="selected-plan-item">
                    <span class="selected-plan-name">${plan.name}</span>
                    <span class="selected-plan-quantity">× ${plan.quantity}</span>
                    <span class="selected-plan-subtotal">$${plan.subtotal}</span>
                </div>
            `).join('');
            selectedPlansList.innerHTML = selectedPlansHtml;
        }
    }
    
    // 更新總金額
    if (totalAmountElement) {
        totalAmountElement.textContent = `$${totalAmount}`;
        
        // 添加動畫效果
        totalAmountElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            totalAmountElement.style.transform = 'scale(1)';
        }, 200);
    }
}

// 清除所有選擇
function clearAllSelections() {
    const checkboxes = document.querySelectorAll('.plan-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        const planId = checkbox.dataset.planId;
        const quantityField = document.getElementById(`quantity-${planId}`);
        if (quantityField) {
            quantityField.disabled = true;
            quantityField.value = 1;
        }
    });
    updateTotalCalculation();
}

// 顯示所選方案內容物
function showSelectedPlansContent() {
    const checkboxes = document.querySelectorAll('.plan-checkbox');
    let selectedPlans = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const planId = parseInt(checkbox.dataset.planId);
            const quantityField = document.getElementById(`quantity-${planId}`);
            const quantity = parseInt(quantityField.value) || 1;
            
            // 找到對應的方案資訊
            const plan = plans.find(p => p.id === planId);
            if (plan) {
                selectedPlans.push({
                    ...plan,
                    quantity: quantity
                });
            }
        }
    });
    
    if (selectedPlans.length === 0) {
        alert('請先選擇方案！');
        return;
    }
    
    // 統計所有內容物
    const allItems = {};
    selectedPlans.forEach(plan => {
        plan.items.forEach(item => {
            allItems[item] = (allItems[item] || 0) + plan.quantity;
        });
    });
    
    // 生成內容物顯示
    const itemsList = Object.entries(allItems)
        .map(([item, count]) => `${item} × ${count}`)
        .join('、');
    
    const plansDetails = selectedPlans.map(plan => 
        `${plan.name} × ${plan.quantity} ($${plan.price * plan.quantity})`
    ).join('\n');
    
    const message = `已選方案：\n${plansDetails}\n\n總內容物：\n${itemsList}`;
    
    alert(message);
}

// 找出最優方案
function findBestDeal() {
    updateRequirement();
    
    if (requirements.length === 0) {
        alert('請選擇您需要的項目！');
        return;
    }
    
    if (plans.length === 0) {
        alert('請先添加一些方案！');
        return;
    }
    
    const result = calculateBestDeal(requirements, plans);
    displayResult(result);
}

// 計算最優方案的核心算法
function calculateBestDeal(requiredItems, availablePlans) {
    // 擴展需求項目，包括可替代的上級項目
    const expandedRequirements = [];
    requiredItems.forEach(item => {
        const alternatives = getItemAlternatives(item);
        expandedRequirements.push({
            original: item,
            alternatives: alternatives
        });
    });
    
    // 使用動態規劃找出最優組合，支持重複方案
    let bestCombinations = [];
    let minCost = Infinity;
    
    // 遞歸搜尋所有可能的組合
    function searchCombinations(reqIndex, currentCost, currentPlans, satisfiedItems) {
        // 如果所有需求都已滿足
        if (reqIndex >= expandedRequirements.length) {
            if (currentCost < minCost) {
                minCost = currentCost;
                bestCombinations = [currentPlans.slice()];
            } else if (currentCost === minCost) {
                bestCombinations.push(currentPlans.slice());
            }
            return;
        }
        
        // 剪枝：如果當前成本已經超過最優解，跳過
        if (currentCost >= minCost) return;
        
        const currentRequirement = expandedRequirements[reqIndex];
        let satisfied = false;
        
        // 檢查當前需求是否已被滿足（通過之前的方案）
        for (const alt of currentRequirement.alternatives) {
            if (satisfiedItems.has(alt)) {
                satisfied = true;
                break;
            }
        }
        
        if (satisfied) {
            // 當前需求已滿足，繼續下一個需求
            searchCombinations(reqIndex + 1, currentCost, currentPlans, satisfiedItems);
        } else {
            // 嘗試每個方案來滿足當前需求
            for (const plan of availablePlans) {
                // 檢查這個方案是否能滿足當前需求（包括替代項目）
                const canSatisfy = currentRequirement.alternatives.some(alt => 
                    plan.items.includes(alt)
                );
                
                if (canSatisfy) {
                    // 計算這個方案滿足的項目
                    const newSatisfiedItems = new Set(satisfiedItems);
                    const planSatisfiedItems = [];
                    
                    plan.items.forEach(item => {
                        newSatisfiedItems.add(item);
                        // 檢查這個項目是否滿足某個需求
                        expandedRequirements.forEach(req => {
                            if (req.alternatives.includes(item)) {
                                planSatisfiedItems.push(req.original);
                            }
                        });
                    });
                    
                    currentPlans.push({
                        ...plan,
                        satisfiedItems: [...new Set(planSatisfiedItems)]
                    });
                    
                    searchCombinations(reqIndex + 1, currentCost + plan.price, currentPlans, newSatisfiedItems);
                    
                    currentPlans.pop();
                }
            }
        }
    }
    
    searchCombinations(0, 0, [], new Set());
    
    return {
        found: bestCombinations.length > 0,
        combinations: bestCombinations,
        totalCost: minCost,
        requiredItems: requiredItems
    };
}

// 顯示結果
function displayResult(result) {
    const resultContainer = document.getElementById('resultContainer');
    
    if (!result.found) {
        resultContainer.innerHTML = `
            <div class="no-result">
                <p>😔 找不到能滿足所有需求的方案組合</p>
                <p>需求項目：${result.requiredItems.join('、')}</p>
                <p>建議：請檢查是否有包含這些項目的方案，或設定項目等級關係</p>
            </div>
        `;
        return;
    }
    
    // 顯示所有最優組合（如果有多個相同價格的組合）
    const combinationsHtml = result.combinations.map((combination, index) => {
        const detailsHtml = combination.map(plan => `
            <div class="deal-item">
                <span>${plan.name} (滿足：${plan.satisfiedItems.join('、')})</span>
                <span>$${plan.price}</span>
            </div>
        `).join('');
        
        return `
            <div class="best-deal">
                <h3>🎉 最優方案 ${result.combinations.length > 1 ? `#${index + 1}` : ''}</h3>
                <p>需求項目：${result.requiredItems.join('、')}</p>
                <div class="deal-details">
                    ${detailsHtml}
                    <div class="deal-item">
                        <span><strong>總計</strong></span>
                        <span><strong>$${result.totalCost}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    resultContainer.innerHTML = combinationsHtml;
    
    const message = result.combinations.length > 1 
        ? `找到${result.combinations.length}個最優方案！總價：$${result.totalCost}`
        : `找到最優方案！總價：$${result.totalCost}`;
    showNotification(message, 'success');
}

// 載入範例數據
/*function loadExampleData() {
    plans = [
        {
            id: 1,
            name: '方案A',
            items: ['雞塊', '薯條', '飲料'],
            price: 120
        },
        {
            id: 2,
            name: '方案B',
            items: ['雞塊', '飲料'],
            price: 59
        },
        {
            id: 3,
            name: '方案C',
            items: ['薯條'],
            price: 50
        },
        {
            id: 4,
            name: '方案D',
            items: ['漢堡', '薯條', '飲料'],
            price: 99
        },
        {
            id: 5,
            name: '方案E',
            items: ['漢堡'],
            price: 45
        },
        {
            id: 6,
            name: '方案F',
            items: ['沙拉', '飲料'],
            price: 65
        }
    ];
    
    updatePlansList();
    saveDataToStorage();
    showNotification('範例數據已載入！', 'success');
}*/

// 重置為預設資料
function resetToDefault() {

    if (confirm('確定要載入預設資料嗎？您新增的方案和項目將會被清除。')) {
        plans = [...defaultPlans];
        availableItems = [...defaultItems];
        itemLevels = [];
        requirements = [];

        // 清除本地存儲，讓系統使用預設值
        localStorage.removeItem('bestDealFinder_plans');
        localStorage.removeItem('bestDealFinder_items');
        localStorage.removeItem('bestDealFinder_levels');
        
        // 清空所有輸入欄位
        document.getElementById('planName').value = '';
        document.getElementById('planPrice').value = '';
        document.getElementById('customItems').value = '';
        document.getElementById('customRequirement').value = '';
        document.getElementById('newItemName').value = '';
        
        // 取消所有勾選
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // 更新顯示
        updatePlansList();
        updateItemsList();
        updateItemCheckboxes();
        updateLevelSelects();
        updateRelatedPlans();

        alert('已重置為預設資料！');
    }
}

// 清除所有數據
function clearAllData() {
    if (confirm('確定要清除所有數據嗎？此操作無法復原。')) {
        plans = [];
        availableItems = [...defaultItems]; // 保留預設項目
        itemLevels = [];
        requirements = [];
        
        // 清除本地存儲
        localStorage.removeItem('bestDealFinder_plans');
        localStorage.removeItem('bestDealFinder_items');
        localStorage.removeItem('bestDealFinder_levels');
        
        // 清空所有輸入欄位
        document.getElementById('planName').value = '';
        document.getElementById('planPrice').value = '';
        document.getElementById('customItems').value = '';
        document.getElementById('customRequirement').value = '';
        document.getElementById('newItemName').value = '';
        
        // 取消所有勾選
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // 更新顯示
        updatePlansList();
        updateItemsList();
        updateItemCheckboxes();
        updateLevelSelects();
        updateRelatedPlans();
        
        saveDataToStorage();
        showNotification('所有數據已清除！', 'info');
    }
}

// 儲存數據到本地存儲
function saveDataToStorage() {
    localStorage.setItem('bestDealFinder_plans', JSON.stringify(plans));
    localStorage.setItem('bestDealFinder_items', JSON.stringify(availableItems));
    localStorage.setItem('bestDealFinder_levels', JSON.stringify(itemLevels));
}

// 從本地存儲載入數據
function loadDataFromStorage() {
    const savedPlans = localStorage.getItem('bestDealFinder_plans');
    if (savedPlans) {
        plans = JSON.parse(savedPlans);
    } else {
        // 如果沒有儲存的方案，使用預設方案
        plans = [...defaultPlans];
    }
    
    const savedItems = localStorage.getItem('bestDealFinder_items');
    if (savedItems) {
        availableItems = JSON.parse(savedItems);
    } else {
        // 如果沒有儲存的項目，使用預設項目
        availableItems = [...defaultItems];
    }
    
    const savedLevels = localStorage.getItem('bestDealFinder_levels');
    if (savedLevels) {
        itemLevels = JSON.parse(savedLevels);
    }
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 根據類型設置顏色
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
            break;
        case 'info':
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            break;
    }
    
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動消失
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 鍵盤快捷鍵
document.addEventListener('keydown', function(e) {
    // Enter 鍵在方案輸入區域時添加方案
    if (e.key === 'Enter' && (
        document.activeElement.id === 'planName' ||
        document.activeElement.id === 'planPrice' ||
        document.activeElement.id === 'customItems'
    )) {
        addPlan();
    }
    
    // Ctrl + Enter 查找最優方案
    if (e.ctrlKey && e.key === 'Enter') {
        findBestDeal();
    }
});
