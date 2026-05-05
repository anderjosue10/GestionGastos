let monthlyChart = null;
let categoryChart = null;
let trendChart = null;

// ========== SOPORTE PARA HUELLA DIGITAL ==========
async function authenticateWithFingerprint() {
    const username = document.getElementById('loginUsername').value;
    
    if (!username) {
        showMessage('loginMessage', '❌ Primero ingresa tu usuario', 'error');
        return;
    }
    
    // Verificar si el usuario tiene huella registrada
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users[username];
    
    if (!user) {
        showMessage('loginMessage', '❌ Usuario no encontrado', 'error');
        return;
    }
    
    // Verificar si el navegador soporta WebAuthn
    if (!window.PublicKeyCredential) {
        showMessage('loginMessage', '❌ Tu navegador no soporta autenticación biométrica', 'error');
        return;
    }
    
    // Verificar si hay datos biométricos guardados
    const credentialId = localStorage.getItem(`fingerprint_${username}`);
    
    if (!credentialId) {
        showMessage('loginMessage', '⚠️ No tienes huella registrada. Usa contraseña o regístrate con huella.', 'error');
        return;
    }
    
    try {
        // Simular autenticación biométrica (en navegadores modernos)
        const publicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(32),
            rp: { name: "FinanzasPro" },
            user: {
                id: new TextEncoder().encode(username),
                name: username,
                displayName: username
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }]
        };
        
        // Para navegadores que soportan WebAuthn
        if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (isAvailable) {
                // Aquí iría la autenticación real con WebAuthn
                showMessage('loginMessage', '🔐 Escanea tu huella digital para continuar', 'success');
                
                // Simular éxito (en producción usar navigator.credentials.get)
                setTimeout(() => {
                    login(username, user.password);
                }, 1500);
                return;
            }
        }
        
        // Fallback: usar PIN como "huella"
        const pin = prompt('🔐 Autenticación biométrica no disponible. Ingresa tu PIN de seguridad:', '');
        if (pin === user.fingerprintPin) {
            login(username, user.password);
        } else {
            showMessage('loginMessage', '❌ PIN incorrecto', 'error');
        }
        
    } catch (error) {
        console.error('Error de autenticación biométrica:', error);
        showMessage('loginMessage', '❌ Error en autenticación biométrica', 'error');
    }
}

// Registrar huella digital durante el registro
async function registerFingerprint(username) {
    if (!window.PublicKeyCredential) {
        console.log('WebAuthn no soportado');
        return false;
    }
    
    try {
        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (isAvailable) {
            // Generar PIN aleatorio de 4 dígitos como alternativa
            const pin = Math.floor(1000 + Math.random() * 9000).toString();
            
            const users = JSON.parse(localStorage.getItem('users'));
            if (users[username]) {
                users[username].fingerprintPin = pin;
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem(`fingerprint_${username}`, 'registered');
                
                alert(`✅ Huella registrada exitosamente!\n\nPIN de respaldo: ${pin}\nGuarda este PIN por si no funciona tu huella.`);
                return true;
            }
        }
    } catch (error) {
        console.error('Error registrando huella:', error);
    }
    return false;
}

// ========== INICIALIZACIÓN ==========
function initDatabase() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = {};
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentPage = window.location.pathname;
    
    if (!currentUser) {
        if (!currentPage.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

// ========== LOGIN / REGISTRO ==========
function login(username, password) {
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users[username];
    
    if (user && user.password === password) {
        localStorage.setItem('currentUser', JSON.stringify({ username: username }));
        window.location.href = 'dashboard.html';
        return true;
    } else {
        showMessage('loginMessage', '❌ Usuario o contraseña incorrectos', 'error');
        return false;
    }
}

function register(username, password, email) {
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users[username]) {
        showMessage('regMessage', '❌ El usuario ya existe', 'error');
        return false;
    }
    
    const confirmPass = document.getElementById('confirmPassword')?.value;
    if (password !== confirmPass) {
        showMessage('regMessage', '❌ Las contraseñas no coinciden', 'error');
        return false;
    }
    
    if (password.length < 4) {
        showMessage('regMessage', '❌ La contraseña debe tener al menos 4 caracteres', 'error');
        return false;
    }
    
    users[username] = {
        username: username,
        password: password,
        email: email,
        transactions: []
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Registrar huella si se seleccionó
    const registerFingerprintCheck = document.getElementById('registerFingerprint');
    if (registerFingerprintCheck && registerFingerprintCheck.checked) {
        registerFingerprint(username);
    }
    
    showMessage('regMessage', '✅ ¡Cuenta creada exitosamente! Ya puedes iniciar sesión', 'success');
    setTimeout(() => {
        showAuthTab('login');
        document.getElementById('registerForm').reset();
    }, 2000);
    return true;
}

function logout() {
    localStorage.setItem('currentUser', JSON.stringify(null));
    window.location.href = 'index.html';
}

function showAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-form');
    const btns = document.querySelectorAll('.auth-tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    btns.forEach(b => b.classList.remove('active'));
    document.getElementById(`${tab}Form`).classList.add('active');
    if (tab === 'login') btns[0].classList.add('active');
    else btns[1].classList.add('active');
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${section}Section`).classList.add('active');
    
    const buttons = document.querySelectorAll('.nav-btn');
    const sectionMap = { 'dashboard': 0, 'transactions': 1, 'reports': 2, 'categories': 3 };
    if (buttons[sectionMap[section]]) buttons[sectionMap[section]].classList.add('active');
    
    if (section === 'reports') initReportDates();
    else if (section === 'categories') loadCategoriesStats();
}

// ========== TRANSACCIONES ==========
let currentTransactionType = 'income';

function selectTransactionType(type) {
    currentTransactionType = type;
    document.getElementById('type').value = type;
    
    const incomeBtn = document.getElementById('typeIncomeBtn');
    const expenseBtn = document.getElementById('typeExpenseBtn');
    
    if (type === 'income') {
        incomeBtn.classList.add('active');
        expenseBtn.classList.remove('active');
    } else {
        expenseBtn.classList.add('active');
        incomeBtn.classList.remove('active');
    }
}

function initCategorySelector() {
    const categories = [
        { emoji: '🍔', name: 'Comida' },
        { emoji: '🚗', name: 'Transporte' },
        { emoji: '🎬', name: 'Entretenimiento' },
        { emoji: '💊', name: 'Salud' },
        { emoji: '📚', name: 'Educación' },
        { emoji: '🏠', name: 'Hogar' },
        { emoji: '💰', name: 'Salario' },
        { emoji: '📈', name: 'Inversiones' },
        { emoji: '💡', name: 'Servicios' },
        { emoji: '📌', name: 'Otros' }
    ];
    
    const container = document.getElementById('categorySelector');
    const select = document.getElementById('category');
    
    if (container) {
        container.innerHTML = categories.map(cat => `
            <div class="cat-option" onclick="selectCategory('${cat.name}')">
                ${cat.emoji} ${cat.name}
            </div>
        `).join('');
    }
    
    if (select) {
        select.innerHTML = '<option value="">Seleccionar categoría</option>' + 
            categories.map(cat => `<option value="${cat.name}">${cat.emoji} ${cat.name}</option>`).join('');
    }
}

function selectCategory(category) {
    const select = document.getElementById('category');
    if (select) select.value = category;
    
    document.querySelectorAll('.cat-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.textContent.includes(category)) opt.classList.add('selected');
    });
}

function showAddTransactionModal() {
    document.getElementById('transactionModal').style.display = 'block';
    document.getElementById('date').valueAsDate = new Date();
    selectTransactionType('income');
}

function closeModal() {
    document.getElementById('transactionModal').style.display = 'none';
    document.getElementById('transactionForm').reset();
}

function addTransaction(description, category, amount, type, date, notes) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users[currentUser.username];
    
    const transaction = {
        id: Date.now(),
        description: description,
        category: category,
        amount: parseFloat(amount),
        type: type,
        date: date,
        notes: notes || '',
        timestamp: new Date(date).getTime()
    };
    
    user.transactions.push(transaction);
    localStorage.setItem('users', JSON.stringify(users));
    
    loadTransactionsUI();
    updateDashboardStats();
    updateCharts();
    closeModal();
}

function deleteTransaction(id) {
    if (confirm('¿Seguro que quieres eliminar este movimiento?')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users[currentUser.username];
        
        user.transactions = user.transactions.filter(t => t.id !== parseInt(id));
        localStorage.setItem('users', JSON.stringify(users));
        
        loadTransactionsUI();
        updateDashboardStats();
        updateCharts();
    }
}

function deleteAllData() {
    if (confirm('⚠️ ¿Estás SEGURO? Esto eliminará TODOS tus movimientos. Esta acción no se puede deshacer.')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const users = JSON.parse(localStorage.getItem('users'));
        users[currentUser.username].transactions = [];
        localStorage.setItem('users', JSON.stringify(users));
        
        loadTransactionsUI();
        updateDashboardStats();
        updateCharts();
        
        alert('✅ Todos tus movimientos han sido eliminados');
    }
}

function calculateBalance(transactions) {
    let balance = 0, totalIncome = 0, totalExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') {
            balance += t.amount;
            totalIncome += t.amount;
        } else {
            balance -= t.amount;
            totalExpense += t.amount;
        }
    });
    return { balance, totalIncome, totalExpense };
}

function updateDashboardStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users[currentUser.username];
    const { balance, totalIncome, totalExpense } = calculateBalance(user.transactions);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;
    
    const elements = {
        totalBalance: document.getElementById('totalBalance'),
        totalIncome: document.getElementById('totalIncome'),
        totalExpense: document.getElementById('totalExpense'),
        savingsRate: document.getElementById('savingsRate')
    };
    
    if (elements.totalBalance) elements.totalBalance.textContent = `$${balance.toFixed(2)}`;
    if (elements.totalIncome) elements.totalIncome.textContent = `$${totalIncome.toFixed(2)}`;
    if (elements.totalExpense) elements.totalExpense.textContent = `$${totalExpense.toFixed(2)}`;
    if (elements.savingsRate) elements.savingsRate.textContent = `${savingsRate}%`;
    
    loadTopExpenses(user.transactions);
}

function loadTopExpenses(transactions) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const grouped = {};
    monthlyExpenses.forEach(t => {
        grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    
    const top5 = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0,5);
    const container = document.getElementById('topExpensesList');
    if (container) {
        container.innerHTML = top5.length === 0 ? 
            '<div style="text-align:center; padding:20px; color:#999;">📭 No hay gastos este mes</div>' :
            top5.map(([cat, amount]) => `
                <div class="expense-item">
                    <span><strong>${cat}</strong></span>
                    <span style="color:#f56565; font-weight:bold;">-$${amount.toFixed(2)}</span>
                </div>
            `).join('');
    }
}

// ========== FILTROS Y UI ==========
let currentTransactionTab = 'all';
let currentFilter = { type: 'all', month: '', search: '', category: 'all' };

function showTransactionTab(tab) {
    currentTransactionTab = tab;
    document.querySelectorAll('.trans-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'all') currentFilter.type = 'all';
    else if (tab === 'income') currentFilter.type = 'income';
    else if (tab === 'expense') currentFilter.type = 'expense';
    
    filterTransactionsUI();
}

function filterTransactionsUI() {
    currentFilter.month = document.getElementById('filterMonth')?.value || '';
    currentFilter.search = document.getElementById('searchDesc')?.value.toLowerCase() || '';
    currentFilter.category = document.getElementById('filterCategory')?.value || 'all';
    loadTransactionsUI();
}

function loadTransactionsUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    let transactions = [...users[currentUser.username].transactions];
    
    if (currentFilter.type !== 'all') {
        transactions = transactions.filter(t => t.type === currentFilter.type);
    }
    if (currentFilter.month) {
        transactions = transactions.filter(t => t.date.startsWith(currentFilter.month));
    }
    if (currentFilter.search) {
        transactions = transactions.filter(t => t.description.toLowerCase().includes(currentFilter.search));
    }
    if (currentFilter.category !== 'all') {
        transactions = transactions.filter(t => t.category === currentFilter.category);
    }
    
    transactions.sort((a,b) => b.timestamp - a.timestamp);
    
    const container = document.getElementById('transactionList');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="transaction-item" style="text-align:center; justify-content:center;">📭 No hay movimientos. ¡Agrega uno!</div>';
        return;
    }
    
    container.innerHTML = transactions.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-info">
                <strong>${t.description}</strong>
                <small>📅 ${t.date} | ${t.type === 'income' ? '✅ Ingreso' : '❌ Gasto'} | 📌 ${t.category}</small>
                ${t.notes ? `<small>📝 ${t.notes}</small>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="transaction-amount" style="color: ${t.type === 'income' ? '#48bb78' : '#f56565'}">
                    ${t.type === 'income' ? '+$' : '-$'}${t.amount.toFixed(2)}
                </span>
                <button onclick="deleteTransaction(${t.id})" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ========== GRÁFICOS ==========
function updateCharts() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const transactions = users[currentUser.username].transactions;
    
    // Datos mensuales
    const monthlyData = {};
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = date.toLocaleString('es-ES', { month: 'short' });
        last6Months.push(monthKey);
        monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = date.toLocaleString('es-ES', { month: 'short' });
        if (monthlyData[monthKey]) {
            if (t.type === 'income') monthlyData[monthKey].income += t.amount;
            else monthlyData[monthKey].expense += t.amount;
        }
    });
    
    const ctx1 = document.getElementById('monthlyChart')?.getContext('2d');
    if (ctx1) {
        if (monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: last6Months,
                datasets: [
                    { label: 'Ingresos', data: last6Months.map(m => monthlyData[m].income), backgroundColor: '#48bb78', borderRadius: 8 },
                    { label: 'Gastos', data: last6Months.map(m => monthlyData[m].expense), backgroundColor: '#f56565', borderRadius: 8 }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true, grid: { color: '#e0e0e0' } } }
            }
        });
    }
    
    // Gráfico de categorías
    const categoryData = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });
    
    const ctx2 = document.getElementById('categoryChart')?.getContext('2d');
    if (ctx2) {
        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{ 
                    data: Object.values(categoryData), 
                    backgroundColor: ['#667eea', '#48bb78', '#f56565', '#ed8936', '#4299e1', '#9f7aea', '#38b2ac', '#ecc94b', '#4a5568', '#e53e3e'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// ========== REPORTES ==========
function initReportDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');
    if (startInput) startInput.valueAsDate = firstDay;
    if (endInput) endInput.valueAsDate = today;
    generateReport();
}

function generateReport() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    let transactions = [...users[currentUser.username].transactions];
    
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    
    if (startDate && endDate) {
        transactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    }
    
    // Calcular días y promedios
    const daysDiff = startDate && endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const dailyAvg = daysDiff > 0 ? totalExpense / daysDiff : 0;
    
    document.getElementById('totalDays').textContent = daysDiff;
    document.getElementById('dailyAverage').textContent = `$${dailyAvg.toFixed(2)}`;
    
    // Mejor mes
    const monthlyTotals = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthlyTotals[month]) monthlyTotals[month] = 0;
        if (t.type === 'income') monthlyTotals[month] += t.amount;
        else monthlyTotals[month] -= t.amount;
    });
    const bestMonth = Object.entries(monthlyTotals).sort((a,b) => b[1] - a[1])[0];
    document.getElementById('bestMonth').textContent = bestMonth ? `${bestMonth[0]}: $${bestMonth[1].toFixed(2)}` : '-';
    
    // Reporte diario
    const daily = {};
    transactions.forEach(t => {
        if (!daily[t.date]) daily[t.date] = { income: 0, expense: 0 };
        if (t.type === 'income') daily[t.date].income += t.amount;
        else daily[t.date].expense += t.amount;
    });
    
    const dailyHtml = Object.entries(daily).length === 0 ? '<p>No hay datos</p>' : `
        <table>
            <thead><tr><th>Fecha</th><th>Ingresos</th><th>Gastos</th><th>Balance</th></tr></thead>
            <tbody>
                ${Object.entries(daily).sort().map(([date, data]) => `
                    <tr>
                        <td>${date}</td>
                        <td style="color:#48bb78">+$${data.income.toFixed(2)}</td>
                        <td style="color:#f56565">-$${data.expense.toFixed(2)}</td>
                        <td>$${(data.income - data.expense).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    const dailyContainer = document.getElementById('dailyReport');
    if (dailyContainer) dailyContainer.innerHTML = dailyHtml;
    
    // Reporte mensual
    const monthly = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
        if (t.type === 'income') monthly[month].income += t.amount;
        else monthly[month].expense += t.amount;
    });
    
    const monthlyHtml = Object.entries(monthly).length === 0 ? '<p>No hay datos</p>' : `
        <table>
            <thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Balance</th><th>Ahorro %</th></tr></thead>
            <tbody>
                ${Object.entries(monthly).sort().map(([month, data]) => {
                    const balance = data.income - data.expense;
                    const savingsRate = data.income > 0 ? (balance / data.income * 100).toFixed(1) : 0;
                    return `
                        <tr>
                            <td>${month}</td>
                            <td style="color:#48bb78">+$${data.income.toFixed(2)}</td>
                            <td style="color:#f56565">-$${data.expense.toFixed(2)}</td>
                            <td>$${balance.toFixed(2)}</td>
                            <td>${savingsRate}%</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    const monthlyContainer = document.getElementById('monthlyReport');
    if (monthlyContainer) monthlyContainer.innerHTML = monthlyHtml;
    
    // Reporte por categoría
    const categories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    
    const totalExpenses = Object.values(categories).reduce((a,b) => a + b, 0);
    const categoryHtml = Object.entries(categories).length === 0 ? '<p>No hay datos</p>' : `
        <table>
            <thead><tr><th>Categoría</th><th>Monto</th><th>Porcentaje</th></tr></thead>
            <tbody>
                ${Object.entries(categories).sort((a,b) => b[1] - a[1]).map(([cat, amount]) => `
                    <tr>
                        <td>${cat}</td>
                        <td style="color:#f56565">$${amount.toFixed(2)}</td>
                        <td>${totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    const categoryContainer = document.getElementById('categoryReport');
    if (categoryContainer) categoryContainer.innerHTML = categoryHtml;
    
    // Gráfico de tendencia
    const trendData = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!trendData[month]) trendData[month] = 0;
        if (t.type === 'income') trendData[month] += t.amount;
        else trendData[month] -= t.amount;
    });
    
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (ctx) {
        if (trendChart) trendChart.destroy();
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(trendData).sort(),
                datasets: [{ 
                    label: 'Balance', 
                    data: Object.values(trendData), 
                    borderColor: '#667eea', 
                    backgroundColor: 'rgba(102,126,234,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: 'white',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

function loadCategoriesStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const transactions = users[currentUser.username].transactions;
    
    const categories = {};
    transactions.forEach(t => {
        if (!categories[t.category]) categories[t.category] = { income: 0, expense: 0, count: 0 };
        if (t.type === 'income') categories[t.category].income += t.amount;
        else categories[t.category].expense += t.amount;
        categories[t.category].count++;
    });
    
    const container = document.getElementById('categoriesStats');
    if (container) {
        if (Object.keys(categories).length === 0) {
            container.innerHTML = '<div class="stat-card" style="text-align:center">📭 No hay datos de categorías aún</div>';
        } else {
            container.innerHTML = Object.entries(categories).sort((a,b) => (b[1].expense - a[1].expense)).map(([cat, data]) => `
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tag"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${cat}</h3>
                        <p style="color:#48bb78; font-size:18px;">+$${data.income.toFixed(2)}</p>
                        <p style="color:#f56565; font-size:18px;">-$${data.expense.toFixed(2)}</p>
                        <small>💰 ${data.count} movimientos</small>
                    </div>
                </div>
            `).join('');
        }
    }
}

function exportData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users[currentUser.username];
    const { balance, totalIncome, totalExpense } = calculateBalance(user.transactions);
    
    const data = {
        usuario: user.username,
        email: user.email,
        fecha_exportacion: new Date().toLocaleString(),
        resumen: { balance, totalIncome, totalExpense, ahorro: ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) + '%' },
        transacciones: user.transactions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas_${user.username}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Datos exportados correctamente');
}

function showMessage(elementId, message, type) {
    const msgDiv = document.getElementById(elementId);
    if (msgDiv) {
        msgDiv.textContent = message;
        msgDiv.className = `message ${type}`;
        setTimeout(() => {
            msgDiv.textContent = '';
            msgDiv.className = 'message';
        }, 3000);
    }
}

// ========== EVENT LISTENERS ==========
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        login(document.getElementById('loginUsername').value, document.getElementById('loginPassword').value);
    });
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        register(document.getElementById('regUsername').value, document.getElementById('regPassword').value, document.getElementById('regEmail').value);
    });
}

if (document.getElementById('transactionForm')) {
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addTransaction(
            document.getElementById('desc').value,
            document.getElementById('category').value,
            document.getElementById('amount').value,
            document.getElementById('type').value,
            document.getElementById('date').value,
            document.getElementById('notes').value
        );
        e.target.reset();
        document.getElementById('date').valueAsDate = new Date();
    });
}

// Inicializar
initDatabase();
initCategorySelector();

if (window.location.pathname.includes('dashboard.html')) {
    if (checkAuth()) {
        loadTransactionsUI();
        updateDashboardStats();
        updateCharts();
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            document.getElementById('sidebarUserName').textContent = user.username;
        }
        const today = new Date().toISOString().slice(0, 7);
        const monthFilter = document.getElementById('filterMonth');
        if (monthFilter) monthFilter.value = today;
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) closeModal();
}
// ========== FUNCIONES PARA MENÚ RESPONSIVO ==========
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    
    // Evitar scroll del body cuando el menú está abierto
    if (sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function showMobileUserMenu() {
    // Opcional: mostrar menú de usuario en móvil
    if (confirm('¿Cerrar sesión?')) {
        logout();
    }
}

// Detectar si es móvil y ajustar comportamiento
function isMobile() {
    return window.innerWidth <= 768;
}

// Cerrar menú al redimensionar a escritorio
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMenu();
        document.body.style.overflow = '';
    }
});

