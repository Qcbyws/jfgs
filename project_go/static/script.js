// 全局变量
const state = {
    pendingPage: 1,
    businessPage: 1,
    engineerPage: 1,
    allPage: 1,
    pageSize: 10,
    currentTab: 'pending',
    loading: false,
    dbConnected: false
};

// DOM 元素引用
const elements = {
    pendingTab: document.getElementById('pending-tab'),
    businessTab: document.getElementById('business-tab'),
    engineerTab: document.getElementById('engineer-tab'),
    allTab: document.getElementById('all-tab'),
    
    tabContent: document.querySelectorAll('.tab-content'),
    
    eqpno: document.getElementById('eqpno'),
    model: document.getElementById('model'), // 模块号
    materno: document.getElementById('materno'), // 设变文件
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    
    searchBtn: document.getElementById('search-btn'),
    resetBtn: document.getElementById('reset-btn'),
    
    tables: {
        pending: document.getElementById('pending-table'),
        business: document.getElementById('business-table'),
        engineer: document.getElementById('engineer-table'),
        all: document.getElementById('all-table')
    },
    
    pendingPagination: document.getElementById('pending-pagination'),
    businessPagination: document.getElementById('business-pagination'),
    engineerPagination: document.getElementById('engineer-pagination'),
    allPagination: document.getElementById('all-pagination'),
    
    dbStatus: document.getElementById('db-status'),
    dbStatusText: document.getElementById('db-status-text'),
    currentTime: document.getElementById('current-time'),
    loadingOverlay: document.getElementById('loading-overlay'),
    toast: document.getElementById('toast')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// 初始化应用程序
function initializeApp() {
    console.log('初始化应用程序...');
    
    // 设置实时时钟
    updateClock();
    setInterval(updateClock, 1000);
    
    // 初始化日期选择器
    initializeDatePickers();
    
    // 添加事件监听器
    setupEventListeners();
    
    // 检查数据库连接状态
    checkDatabaseConnection();
    // 定期检查数据库连接状态
    setInterval(checkDatabaseConnection, 60000); // 每分钟检查一次
    
    // 加载初始数据
    loadData('pending', state.pendingPage);
}

// 初始化日期选择器
function initializeDatePickers() {
    // 清空日期选择器的值
    elements.startDate.value = '';
    elements.endDate.value = '';
    
    console.log('日期选择器初始化完成：值已清空');
}

// 格式化日期为datetime-local输入格式
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换 - 使用单独的标签按钮而不是tabs容器
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            switchTab(tabType);
        });
    });
    
    // 搜索按钮
    elements.searchBtn.addEventListener('click', () => {
        const tabType = state.currentTab;
        resetPage(tabType);
        loadData(tabType, getPageForTab(tabType));
    });
    
    // 重置按钮
    elements.resetBtn.addEventListener('click', () => {
        resetFilters();
        const tabType = state.currentTab;
        resetPage(tabType);
        loadData(tabType, getPageForTab(tabType));
    });
    
    // 日期选择器图标点击
    const dateIcons = document.querySelectorAll('.date-picker-icon');
    console.log('找到日期图标数量:', dateIcons.length);
    dateIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            console.log('日期图标被点击');
            // 找到对应的input元素
            const input = this.previousElementSibling;
            // 提示用户操作
            showDateTimeSelector(input);
        });
    });
    
    // 日期输入框点击
    const dateInputs = document.querySelectorAll('.datetime-input');
    console.log('找到日期输入框数量:', dateInputs.length);
    dateInputs.forEach(input => {
        input.addEventListener('click', function() {
            console.log('日期输入框被点击');
            showDateTimeSelector(this);
        });
    });
}

// 显示日期时间选择器
function showDateTimeSelector(inputElement) {
    console.log('打开日期选择器，输入框:', inputElement.id);
    
    // 创建日期选择面板，这里使用简单的交互方式
    // 创建一个浮动选择面板
    const existingPanel = document.querySelector('.datetime-selector-panel');
    if (existingPanel) {
        existingPanel.remove(); // 移除已有面板
        console.log('移除已有面板');
    }
    
    const panel = document.createElement('div');
    panel.className = 'datetime-selector-panel';
    
    // 添加年月日选择
    const dateSection = document.createElement('div');
    dateSection.className = 'datetime-section';
    dateSection.innerHTML = `
        <div class="datetime-selector-header">选择日期</div>
        <div class="date-fields">
            <input type="date" class="date-field">
        </div>
    `;
    
    // 添加时分秒选择
    const timeSection = document.createElement('div');
    timeSection.className = 'datetime-section';
    timeSection.innerHTML = `
        <div class="datetime-selector-header">选择时间</div>
        <div class="time-fields">
            <input type="time" class="time-field" step="1">
        </div>
    `;
    
    // 添加按钮
    const buttonSection = document.createElement('div');
    buttonSection.className = 'datetime-buttons';
    buttonSection.innerHTML = `
        <button class="now-btn">当前时间</button>
        <button class="clear-btn">清空</button>
        <button class="confirm-btn">确认</button>
    `;
    
    panel.appendChild(dateSection);
    panel.appendChild(timeSection);
    panel.appendChild(buttonSection);
    
    // 放置在输入框下方
    const rect = inputElement.getBoundingClientRect();
    console.log('输入框位置:', rect);
    panel.style.position = 'absolute';
    panel.style.top = `${rect.bottom + window.scrollY}px`;
    panel.style.left = `${rect.left + window.scrollX}px`;
    panel.style.width = `${Math.max(280, rect.width)}px`;
    panel.style.zIndex = '1000';
    
    document.body.appendChild(panel);
    console.log('日期选择面板已添加到DOM');
    
    // 设置日期时间值（如果已有）
    const dateField = panel.querySelector('.date-field');
    const timeField = panel.querySelector('.time-field');
    
    if (inputElement.value) {
        try {
            const dt = parseInputDateTime(inputElement.value);
            if (dt) {
                dateField.value = formatDatePart(dt);
                timeField.value = formatTimePart(dt);
                console.log('设置已有日期时间值:', dateField.value, timeField.value);
            }
        } catch (e) {
            console.error('解析日期时间失败', e);
        }
    }
    
    // 添加事件监听
    panel.querySelector('.now-btn').addEventListener('click', () => {
        console.log('点击当前时间按钮');
        const now = new Date();
        dateField.value = formatDatePart(now);
        timeField.value = formatTimePart(now);
    });
    
    panel.querySelector('.clear-btn').addEventListener('click', () => {
        console.log('点击清空按钮');
        inputElement.value = '';
        panel.remove();
    });
    
    panel.querySelector('.confirm-btn').addEventListener('click', () => {
        console.log('点击确认按钮', dateField.value, timeField.value);
        if (dateField.value) {
            let dateStr = dateField.value;
            let timeStr = timeField.value || '00:00:00';
            
            inputElement.value = `${dateStr} ${timeStr}`;
            console.log('设置日期时间值:', inputElement.value);
        }
        panel.remove();
    });
    
    // 点击外部关闭面板
    document.addEventListener('click', function closePanel(e) {
        if (!panel.contains(e.target) && e.target !== inputElement && !e.target.classList.contains('date-picker-icon')) {
            console.log('点击外部，关闭面板');
            panel.remove();
            document.removeEventListener('click', closePanel);
        }
    });
}

// 格式化日期部分 (YYYY-MM-DD)
function formatDatePart(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 格式化时间部分 (HH:MM:SS)
function formatTimePart(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// 解析输入的日期时间字符串
function parseInputDateTime(dateTimeStr) {
    // 尝试解析 YYYY-MM-DD HH:MM:SS 格式
    const parts = dateTimeStr.split(' ');
    if (parts.length === 2) {
        const datePart = parts[0];
        const timePart = parts[1];
        
        // 创建日期对象
        const dt = new Date(`${datePart}T${timePart}`);
        if (!isNaN(dt.getTime())) {
            return dt;
        }
    }
    return null;
}

// 获取当前日期时间格式化字符串
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 验证日期时间格式
function isValidDateTime(dateTimeStr) {
    // 匹配 YYYY-MM-DD HH:MM:SS 格式
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(dateTimeStr)) {
        return false;
    }
    
    // 验证是否是有效日期
    const date = new Date(dateTimeStr.replace(' ', 'T'));
    return !isNaN(date.getTime());
}

// 检查数据库连接状态
async function checkDatabaseConnection() {
    try {
        // 更新UI为检查中状态
        updateDatabaseStatus('checking', '数据库状态: 检查中...');
        
        const response = await fetch('/api/test');
        const data = await response.json();
        
        if (data.status === 'success') {
            state.dbConnected = true;
            updateDatabaseStatus('connected', '数据库状态: 已连接');
            return true;
        } else {
            state.dbConnected = false;
            updateDatabaseStatus('disconnected', `数据库状态: 未连接 (${data.message})`);
            return false;
        }
    } catch (error) {
        console.error('检查数据库连接错误:', error);
        state.dbConnected = false;
        updateDatabaseStatus('disconnected', '数据库状态: 未连接');
        return false;
    }
}

// 更新数据库状态UI
function updateDatabaseStatus(status, message) {
    elements.dbStatus.className = 'status-dot ' + status;
    elements.dbStatusText.textContent = message;
}

// 切换标签
function switchTab(tabType) {
    if (tabType === state.currentTab) return;
    
    console.log(`切换到标签: ${tabType}`);
    
    // 更新按钮状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`${tabType}-content`).classList.add('active');
    
    // 重置搜索框内容
    resetFilters();
    
    // 更新当前标签
    state.currentTab = tabType;
    
    // 加载数据
    loadData(tabType, getPageForTab(tabType));
}

// 加载数据
async function loadData(tabType, page) {
    showLoading();
    
    try {
        // 先检查数据库连接
        if (!state.dbConnected && !(await checkDatabaseConnection())) {
            throw new Error('数据库未连接，无法加载数据');
        }
        
        console.log(`加载${tabType}数据，页码: ${page}`);
        
        const params = getSearchParams(tabType, page);
        if (!params) {
            hideLoading();
            return; // 如果参数验证失败，停止加载
        }
        
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/issues?${queryString}`;
        
        console.log(`API请求URL: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误! 状态: ${response.status}, 错误: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('加载数据成功:', data);
        
        renderTable(tabType, data.records || []);
        renderPagination(tabType, data.currentPage, data.totalPages);
    } catch (error) {
        console.error('加载数据错误:', error);
        showToast('加载数据失败，请稍后重试：' + error.message);
        
        // 在表格中显示错误信息
        const tableBody = document.querySelector(`#${tabType}-table tbody`);
        const colSpan = tabType === 'all' ? 12 : 11;
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" style="text-align: center; padding: 2rem; color: var(--danger-color);">
                    <span class="material-icons" style="font-size: 3rem; margin-bottom: 1rem;">error_outline</span>
                    <div>加载数据失败: ${error.message}</div>
                    <button id="retry-btn-${tabType}" class="btn search-btn" style="margin: 1rem auto; display: inline-flex;">
                        <span class="material-icons">refresh</span>重试
                    </button>
                </td>
            </tr>
        `;
        
        // 添加重试按钮事件监听
        document.getElementById(`retry-btn-${tabType}`).addEventListener('click', () => {
            loadData(tabType, page);
        });
        
        // 清空分页
        const paginationElement = document.getElementById(`${tabType}-pagination`);
        paginationElement.innerHTML = '';
    } finally {
        hideLoading();
    }
}

// 获取搜索参数
function getSearchParams(tabType, page) {
    // 获取输入的日期值
    const startDateStr = elements.startDate.value.trim();
    const endDateStr = elements.endDate.value.trim();
    
    // 验证日期格式和日期范围
    if (startDateStr && !isValidDateTime(startDateStr)) {
        showToast('起始日期格式无效，请使用 YYYY-MM-DD HH:MM:SS 格式');
        return null;
    }
    
    if (endDateStr && !isValidDateTime(endDateStr)) {
        showToast('结束日期格式无效，请使用 YYYY-MM-DD HH:MM:SS 格式');
        return null;
    }
    
    let startDate = startDateStr;
    let endDate = endDateStr;
    
    // 如果输入了起始日期但没有结束日期，可以默认使用当前时间作为结束日期
    if (startDate && !endDate) {
        endDate = getCurrentDateTime();
        elements.endDate.value = endDate;
    }
    
    console.log(`搜索参数 - 开始日期: ${startDate}, 结束日期: ${endDate}`);
    
    return {
        tabType: tabType,
        page: page,
        pageSize: 10,
        eqpno: elements.eqpno.value.trim(),
        name: elements.model.value.trim(),
        model: elements.materno.value.trim(),
        startDate: startDate,
        endDate: endDate
    };
}

// 渲染表格
function renderTable(tabType, records) {
    console.log(`渲染${tabType}表格，共${records.length}条记录`);
    
    const tableBody = document.querySelector(`#${tabType}-table tbody`);
    tableBody.innerHTML = '';
    
    if (records.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${tabType === 'all' ? 12 : 11}" class="loading-message">没有找到记录</td></tr>`;
        return;
    }
    
    records.forEach(record => {
        const row = document.createElement('tr');
        
        // 确保所有字段都有值（防止undefined）
        record.id = record.id || '';
        record.eqpno = record.eqpno || '';
        record.model = record.model || '';
        record.materno = record.materno || '';
        record.raid = record.raid || '';
        record.question = record.question || '';
        record.advice = record.advice || '';
        record.createdate = record.createdate || new Date().toISOString();
        record.questionarea = record.questionarea || '';
        record.questiontype = record.questiontype || '';
        
        // 基本列
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.eqpno || '-'}</td>
            <td>${record.model || '-'}</td>
            <td>${record.materno || '-'}</td>
            <td>${record.raid || '-'}</td>
            <td>${record.question || '-'}</td>
            <td>${record.advice || '-'}</td>
            <td>${formatDate(record.createdate)}</td>
            <td>${record.questionarea || '-'}</td>
            <td>${record.questiontype || '-'}</td>
        `;
        
        // 不同标签页的特殊列
        if (tabType === 'pending') {
            row.innerHTML += `
                <td>
                    <button class="action-btn" data-id="${record.id}" onclick="confirmBusiness(${record.id})">
                        确认处理
                    </button>
                </td>
            `;
        } else if (tabType === 'business') {
            row.innerHTML += `
                <td>
                    <button class="action-btn" data-id="${record.id}" onclick="confirmEngineer(${record.id})">
                        工程师确认
                    </button>
                </td>
            `;
        } else if (tabType === 'all') {
            row.innerHTML += `
                <td>${record.businesstype ? '<span class="material-icons status-icon">check_circle</span>' : '-'}</td>
                <td>${record.engineertype ? '<span class="material-icons status-icon">check_circle</span>' : '-'}</td>
            `;
        }
        
        tableBody.appendChild(row);
    });
}

// 渲染分页
function renderPagination(tabType, currentPage, totalPages) {
    console.log(`渲染${tabType}分页，当前页: ${currentPage}, 总页数: ${totalPages}`);
    
    const paginationElement = document.getElementById(`${tabType}-pagination`);
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('page-btn');
    prevBtn.innerHTML = '上一页';
    prevBtn.disabled = currentPage === 1;
    if (currentPage > 1) {
        prevBtn.addEventListener('click', () => {
            decrementPage(tabType);
            loadData(tabType, getPageForTab(tabType));
        });
    }
    paginationElement.appendChild(prevBtn);
    
    // 页码按钮
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page-btn');
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            setPage(tabType, i);
            loadData(tabType, i);
        });
        paginationElement.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('page-btn');
    nextBtn.innerHTML = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    if (currentPage < totalPages) {
        nextBtn.addEventListener('click', () => {
            incrementPage(tabType);
            loadData(tabType, getPageForTab(tabType));
        });
    }
    paginationElement.appendChild(nextBtn);
}

// 确认业务处理
async function confirmBusiness(id) {
    showLoading();
    
    try {
        console.log(`确认业务处理，ID: ${id}`);
        
        const response = await fetch(`/api/issues/${id}/business`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误! 状态: ${response.status}, 错误: ${errorText}`);
        }
        
        showToast('业务处理确认成功');
        loadData('pending', state.pendingPage);
    } catch (error) {
        console.error('确认业务处理错误:', error);
        showToast('处理失败，请稍后重试: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 确认工程师处理
async function confirmEngineer(id) {
    showLoading();
    
    try {
        console.log(`确认工程师处理，ID: ${id}`);
        
        const response = await fetch(`/api/issues/${id}/engineer`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误! 状态: ${response.status}, 错误: ${errorText}`);
        }
        
        showToast('工程师处理确认成功');
        loadData('business', state.businessPage);
    } catch (error) {
        console.error('确认工程师处理错误:', error);
        showToast('处理失败，请稍后重试: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 更新时钟
function updateClock() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    elements.currentTime.textContent = now.toLocaleDateString('zh-CN', options);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('日期格式化错误:', error);
        return dateString;
    }
}

// 显示加载动画
function showLoading() {
    state.loading = true;
    elements.loadingOverlay.style.display = 'flex';
}

// 隐藏加载动画
function hideLoading() {
    state.loading = false;
    elements.loadingOverlay.style.display = 'none';
}

// 显示提示消息
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// 重置筛选条件
function resetFilters() {
    elements.eqpno.value = '';
    elements.model.value = '';
    elements.materno.value = '';
    elements.startDate.value = '';
    elements.endDate.value = '';
}

// 设置页码
function setPage(tabType, page) {
    switch (tabType) {
        case 'pending':
            state.pendingPage = page;
            break;
        case 'business':
            state.businessPage = page;
            break;
        case 'engineer':
            state.engineerPage = page;
            break;
        case 'all':
            state.allPage = page;
            break;
    }
}

// 获取当前标签的页码
function getPageForTab(tabType) {
    switch (tabType) {
        case 'pending':
            return state.pendingPage;
        case 'business':
            return state.businessPage;
        case 'engineer':
            return state.engineerPage;
        case 'all':
            return state.allPage;
        default:
            return 1;
    }
}

// 增加页码
function incrementPage(tabType) {
    setPage(tabType, getPageForTab(tabType) + 1);
}

// 减少页码
function decrementPage(tabType) {
    setPage(tabType, Math.max(1, getPageForTab(tabType) - 1));
}

// 重置页码
function resetPage(tabType) {
    setPage(tabType, 1);
}

// 为了使 confirmBusiness 和 confirmEngineer 函数可以通过 onclick 调用
window.confirmBusiness = confirmBusiness;
window.confirmEngineer = confirmEngineer; 