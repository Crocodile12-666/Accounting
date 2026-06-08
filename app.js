let members = [];      
let expenses = [];     
let currentTab = "total"; // 紀錄目前分頁狀態："total" 或 "single"

window.onload = function() {
    loadDataFromStorage();
};

function loadDataFromStorage() {
    const storedMembers = localStorage.getItem("group_billing_members");
    const storedExpenses = localStorage.getItem("group_billing_expenses");
    const storedBudget = localStorage.getItem("group_billing_budget");

    if (storedBudget) document.getElementById("total-budget").value = storedBudget;

    if (storedMembers) {
        members = JSON.parse(storedMembers);
        renderSavedMembers(members);
        document.getElementById("weight-status").style.color = "var(--success)";
        document.getElementById("weight-status").innerText = "✨ 已自動還原進度！";
        renderExpenseFormOptions();
        document.getElementById("expense-section").classList.remove("id-hidden");
        document.getElementById("result-section").classList.remove("id-hidden");
    } else {
        initDefaultMembers();
    }

    if (storedExpenses) {
        expenses = JSON.parse(storedExpenses);
        renderExpenseList();
        updateSingleExpenseSelect();
        renderSettlementUI();
    }
}

function saveDataToStorage() {
    localStorage.setItem("group_billing_members", JSON.stringify(members));
    localStorage.setItem("group_billing_expenses", JSON.stringify(expenses));
    localStorage.setItem("group_billing_budget", document.getElementById("total-budget").value);
}

function clearAllData() {
    if(confirm("確定要清空所有成員和記帳紀錄嗎？這無法復原喔！")) {
        localStorage.clear();
        members = [];
        expenses = [];
        document.getElementById("total-budget").value = "";
        initDefaultMembers();
        document.getElementById("expense-section").classList.add("id-hidden");
        document.getElementById("result-section").classList.add("id-hidden");
        document.getElementById("weight-status").innerText = "🧹 資料已全部清空。";
        renderExpenseList();
        updateSingleExpenseSelect();
        renderSettlementUI();
    }
}

function initDefaultMembers() {
    const defaultNames = ["大華", "小強", "小明"];
    const defaultWeights = [40, 40, 20];
    renderSavedMembers(defaultNames.map((name, i) => ({ name: name, weight: defaultWeights[i] })));
}

function renderSavedMembers(memberDataArray) {
    const container = document.getElementById("member-list");
    container.innerHTML = "";
    memberDataArray.forEach(m => {
        container.innerHTML += `
            <div class="member-row">
                <input type="text" class="member-name" value="${m.name}" placeholder="名字" required>
                <div class="weight-input-wrapper">
                    <input type="number" class="member-weight" value="${m.weight}" placeholder="%" min="0" max="100" oninput="liveCalculateBudget()" required>％
                </div>
                <span class="live-calc-text" id="live-calc-${m.name}">$0</span>
                <button type="button" class="btn-sm-del" onclick="this.parentElement.remove(); liveCalculateBudget();">❌</button>
            </div>
        `;
    });
    liveCalculateBudget();
}

function addMemberInput() {
    const container = document.getElementById("member-list");
    container.innerHTML += `
        <div class="member-row">
            <input type="text" class="member-name" placeholder="名字" required>
            <div class="weight-input-wrapper">
                <input type="number" class="member-weight" placeholder="%" min="0" max="100" oninput="liveCalculateBudget()" required>％
            </div>
            <span class="live-calc-text">$0</span>
            <button type="button" class="btn-sm-del" onclick="this.parentElement.remove(); liveCalculateBudget();">❌</button>
        </div>
    `;
}

function liveCalculateBudget() {
    const totalBudget = parseFloat(document.getElementById("total-budget").value) || 0;
    const nameInputs = document.querySelectorAll(".member-name");
    const weightInputs = document.querySelectorAll(".member-weight");
    const calcTexts = document.querySelectorAll(".live-calc-text");
    
    for (let i = 0; i < nameInputs.length; i++) {
        const name = nameInputs[i].value.trim() || `成員${i+1}`;
        const weight = parseFloat(weightInputs[i].value) || 0;
        const personalShare = totalBudget * (weight / 100);
        calcTexts[i].id = `live-calc-${name}`;
        calcTexts[i].innerText = `$${personalShare.toFixed(0)}`;
    }
}

function saveMembers() {
    const nameInputs = document.querySelectorAll(".member-name");
    const weightInputs = document.querySelectorAll(".member-weight");
    const statusMsg = document.getElementById("weight-status");
    
    let tempMembers = [];
    let totalWeight = 0;
    
    for (let i = 0; i < nameInputs.length; i++) {
        const name = nameInputs[i].value.trim();
        const weight = parseFloat(weightInputs[i].value) || 0;
        if (!name) {
            statusMsg.style.color = "var(--danger)";
            statusMsg.innerText = "❌ 請填寫所有成員的名字！";
            return;
        }
        tempMembers.push({ name: name, weight: weight });
        totalWeight += weight;
    }
    
    if (Math.abs(totalWeight - 100) > 0.01) {
        statusMsg.style.color = "var(--danger)";
        statusMsg.innerText = `❌ 比例總和為 ${totalWeight}%，必須等於 100%！`;
        return;
    }
    
    members = tempMembers;
    statusMsg.style.color = "var(--success)";
    statusMsg.innerText = "✅ 設定成功，已為您自動存檔！";
    
    renderExpenseFormOptions();
    saveDataToStorage();
    renderSettlementUI();
    
    document.getElementById("expense-section").classList.remove("id-hidden");
    document.getElementById("result-section").classList.remove("id-hidden");
}

function renderExpenseFormOptions() {
    const payersContainer = document.getElementById("payers-container");
    payersContainer.innerHTML = "";
    addPayerRow(); 
    
    const consumersContainer = document.getElementById("consumers-container");
    consumersContainer.innerHTML = "";
    members.forEach(m => {
        consumersContainer.innerHTML += `
            <label class="checkbox-label">
                <input type="checkbox" class="consumer-checkbox" value="${m.name}" checked>
                ${m.name} (${m.weight}%)
            </label>
        `;
    });
}

function addPayerRow() {
    const container = document.getElementById("payers-container");
    let optionsHtml = members.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
    const topBudget = document.getElementById("total-budget").value || "";
    const currentRows = container.querySelectorAll(".payer-row").length;
    const defaultAmount = (currentRows === 0) ? topBudget : "";

    const row = document.createElement("div");
    row.className = "payer-row";
    row.innerHTML = `
        <select class="payer-select">${optionsHtml}</select>
        <input type="number" class="payer-amount" value="${defaultAmount}" placeholder="金額" min="0" oninput="updateTotalPayAmount()" required>
        <button type="button" class="btn-sm-del" onclick="removePayerRow(this)">❌</button>
    `;
    container.appendChild(row);
    updateTotalPayAmount();
}

function removePayerRow(button) {
    const rows = document.querySelectorAll(".payer-row");
    if(rows.length > 1) {
        button.parentElement.remove();
        updateTotalPayAmount();
    } else {
        alert("至少需要有一位付款人！");
    }
}

function updateTotalPayAmount() {
    const amountInputs = document.querySelectorAll(".payer-amount");
    let sum = 0;
    amountInputs.forEach(input => { sum += parseFloat(input.value) || 0; });
    document.getElementById("calculated-total").innerText = sum;
}

function addExpense(e) {
    e.preventDefault();
    const item = document.getElementById("exp-item").value.trim();
    const payerRows = document.querySelectorAll(".payer-row");
    let payers = [];
    let totalAmount = 0;
    
    payerRows.forEach(row => {
        const name = row.querySelector(".payer-select").value;
        const amount = parseFloat(row.querySelector(".payer-amount").value) || 0;
        if (amount > 0) {
            payers.push({ name: name, amount: amount });
            totalAmount += amount;
        }
    });
    
    if (totalAmount <= 0) {
        alert("請輸入有效的付款金額！");
        return;
    }
    
    const checkboxInputs = document.querySelectorAll(".consumer-checkbox");
    let consumers = [];
    checkboxInputs.forEach(cb => { if (cb.checked) consumers.push(cb.value); });
    
    if (consumers.length === 0) {
        alert("請至少勾選一位分攤此筆消費的人！");
        return;
    }
    
    // 初始化這筆帳的個別還款狀態（預設皆為未還款 false）
    let paidStatus = {};
    consumers.forEach(name => { paidStatus[name] = false; });
    
    const newExpense = {
        id: Date.now(),
        item: item,
        totalAmount: totalAmount,
        payers: payers,
        consumers: consumers,
        paidStatus: paidStatus // 新增狀態記錄
    };
    
    expenses.push(newExpense);
    
    document.getElementById("expense-form").reset();
    renderExpenseFormOptions();
    document.getElementById("calculated-total").innerText = "0";
    
    renderExpenseList();
    updateSingleExpenseSelect();
    renderSettlementUI();
    saveDataToStorage();
}

// 渲染歷史明細（整合還款打勾功能）
function renderExpenseList() {
    const container = document.getElementById("expense-cards-container");
    container.innerHTML = "";
    
    if (expenses.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:10px 0;">📭 目前尚無記帳紀錄</div>`;
        return;
    }

    expenses.forEach((exp, expIdx) => {
        const payersStr = exp.payers.map(p => `${p.name} 墊 ${p.amount}元`).join("、");
        const consumersStr = exp.consumers.join(", ");
        
        // 產生成員還款狀態的膠囊晶片 HTML
        let repayChipsHtml = "";
        exp.consumers.forEach(name => {
            // 如果這個人本來就是付款人且金額足夠，可以預設或手動勾選
            const isDone = exp.paidStatus[name] ? "done" : "";
            const icon = exp.paidStatus[name] ? "✅" : "⬜";
            repayChipsHtml += `
                <div class="repay-chip ${isDone}" onclick="toggleRepayStatus(${expIdx}, '${name}')">
                    <span>${icon}</span> ${name}
                </div>
            `;
        });
        
        container.innerHTML += `
            <div class="expense-item-card">
                <div class="card-main-info">
                    <span class="card-title">${exp.item}</span>
                    <span class="card-amount">$${exp.totalAmount}</span>
                </div>
                <div class="card-sub-details">
                    <div>💳 付款：${payersStr}</div>
                    <div>🎯 分攤：${consumersStr}</div>
                </div>
                
                <div class="repay-tracker-box">
                    <div class="repay-title">🔔 還款收款狀態 (點擊可切換已付/未付)：</div>
                    <div class="repay-badges">${repayChipsHtml}</div>
                </div>

                <button type="button" class="card-delete-btn" onclick="deleteExpense(${expIdx})">刪除</button>
            </div>
        `;
    });
}

// 切換特定消費項目中某人的還款狀態
function toggleRepayStatus(expIdx, name) {
    expenses[expIdx].paidStatus[name] = !expenses[expIdx].paidStatus[name];
    renderExpenseList();
    saveDataToStorage();
}

// 更新單筆拆帳下拉選單的內容
function updateSingleExpenseSelect() {
    const select = document.getElementById("single-expense-select");
    select.innerHTML = "";
    if (expenses.length === 0) {
        select.innerHTML = `<option value="">-- 目前無消費品項 --</option>`;
        return;
    }
    expenses.forEach((exp, idx) => {
        select.innerHTML += `<option value="${idx}">${exp.item} ($${exp.totalAmount}元)</option>`;
    });
}

// 切換總結算與單筆拆帳分頁
function switchSettlementTab(tabType) {
    currentTab = tabType;
    document.getElementById("tab-total").classList.toggle("active", tabType === 'total');
    document.getElementById("tab-single").classList.toggle("active", tabType === 'single');
    
    const selectBox = document.getElementById("single-select-box");
    if (tabType === 'single') {
        selectBox.classList.remove("id-hidden");
        document.getElementById("settlement-title").innerText = "🛍️ 每人收支總覽 (本筆品項)";
    } else {
        selectBox.classList.add("id-hidden");
        document.getElementById("settlement-title").innerText = "📊 每人收支總覽 (總累積帳目)";
    }
    renderSettlementUI();
}

// 統一調度結算畫面渲染
function renderSettlementUI() {
    if (currentTab === "total") {
        calculateSettlement(expenses); // 傳入所有消費進行累積結算
    } else {
        const select = document.getElementById("single-expense-select");
        const idx = parseInt(select.value);
        if (!isNaN(idx) && expenses[idx]) {
            calculateSettlement([expenses[idx]]); // 只傳入單一筆進行獨立結算
        } else {
            document.getElementById("balance-list").innerHTML = "<li>請先新增消費項目</li>";
            document.getElementById("transfer-list").innerHTML = "<li>無轉帳指引</li>";
        }
    }
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    renderExpenseList();
    updateSingleExpenseSelect();
    renderSettlementUI();
    saveDataToStorage();
}

// 智慧拆帳核心演算法（支援傳入特定陣列，達成累積或單筆計算）
function calculateSettlement(targetExpenses) {
    let balances = {};       
    let totalPaid = {};      
    let totalShouldPay = {}; 
    
    members.forEach(m => { 
        balances[m.name] = 0; 
        totalPaid[m.name] = 0;
        totalShouldPay[m.name] = 0;
    });
    
    targetExpenses.forEach(exp => {
        exp.payers.forEach(p => {
            if (balances[p.name] !== undefined) { 
                balances[p.name] += p.amount; 
                totalPaid[p.name] += p.amount; 
            }
        });
        
        let activeWeightSum = 0;
        members.forEach(m => {
            if (exp.consumers.includes(m.name)) { activeWeightSum += m.weight; }
        });
        
        members.forEach(m => {
            if (exp.consumers.includes(m.name)) {
                let share = 0;
                if (activeWeightSum > 0) {
                    share = exp.totalAmount * (m.weight / activeWeightSum);
                } else {
                    share = exp.totalAmount / exp.consumers.length;
                }
                balances[m.name] -= share;
                totalShouldPay[m.name] += share; 
            }
        });
    });
    
    // 渲染每人收支
    const balanceUl = document.getElementById("balance-list");
    balanceUl.innerHTML = "";
    for (let name in balances) {
        let bal = balances[name];
        let paid = totalPaid[name];
        let should = totalShouldPay[name];
        
        let resultTag = bal >= 0 
            ? `<span style="color:var(--success); font-weight:700; background:var(--success-light); padding:2px 8px; border-radius:6px;">💰 應拿回 +${bal.toFixed(0)} 元</span>` 
            : `<span style="color:var(--danger); font-weight:700; background:#fee2e2; padding:2px 8px; border-radius:6px;">💸 應補出 -${Math.abs(bal).toFixed(0)} 元</span>`;
            
        balanceUl.innerHTML += `
            <li style="display: flex; flex-direction: column; gap: 4px; padding: 10px 0; border-bottom: 1px dashed var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.95rem;">👤 <b>${name}</b></span>
                    ${resultTag}
                </div>
                <div style="display: flex; gap: 12px; font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                    <span>📥 已墊: <b>${paid.toFixed(0)}</b> 元</span>
                    <span>📤 應付: <b>${should.toFixed(0)}</b> 元</span>
                </div>
            </li>
        `;
    }
    
    // 計算最優轉帳方案
    const transferUl = document.getElementById("transfer-list");
    transferUl.innerHTML = "";
    
    let creditors = []; 
    let debtors = [];   
    
    for (let name in balances) {
        let bal = Math.round(balances[name] * 10) / 10;
        if (bal > 0.1) { creditors.push({ name: name, amount: bal }); } 
        else if (bal < -0.1) { debtors.push({ name: name, amount: Math.abs(bal) }); }
    }
    
    let cIdx = 0, dIdx = 0;
    let hasTransfers = false;
    
    while (cIdx < creditors.length && dIdx < debtors.length) {
        let creditor = creditors[cIdx];
        let debtor = debtors[dIdx];
        let transferAmount = Math.min(creditor.amount, debtor.amount);
        
        if (transferAmount > 0.1) {
            transferUl.innerHTML += `<li>💸 <b>${debtor.name}</b> ➡️ 轉帳給 <b>${creditor.name}</b>： <span style="font-size:1rem; font-weight:800;">${transferAmount.toFixed(0)}</span> 元</li>`;
            hasTransfers = true;
        }
        
        creditor.amount -= transferAmount;
        debtor.amount -= transferAmount;
        if (creditor.amount <= 0.1) cIdx++;
        if (debtor.amount <= 0.1) dIdx++;
    }
    
    if (!hasTransfers) {
        transferUl.innerHTML = `<li style="background:#f3f4f6; color:var(--text-muted); border-left-color:var(--secondary);">🎉 帳目完全平衡，免轉帳！</li>`;
    }
}
