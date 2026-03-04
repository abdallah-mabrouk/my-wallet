/* 💰 محفظتي v5 - ملف عرض الصفحات - كامل */

// ======================
// Dashboard (الصفحة الرئيسية)
// ======================

function renderDashboard() {
  const month = thisMonth();
  const monthTxs = APP.txs.filter(t => t.date.startsWith(month));
  
  // حساب الدخل والمصروفات الشهرية (للإحصائيات)
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  // ✅ حساب الرصيد التراكمي من جميع المعاملات
  const totalIncome = APP.txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = APP.txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  
  const savings = APP.goals.filter(g => g.status === 'active').reduce((s, g) => s + g.saved, 0);
  const investment = APP.assets.filter(a => !a.sold).reduce((s, a) => s + a.currentValue, 0);
  
  // حساب الحسابات الخارجية (الرصيد الصافي)
  const netExternal = APP.people.reduce((sum, p) => {
    const myDebt = p.myDebtsToHim || 0;
    const hisDebt = p.hisDebtsToMe || 0;
    return sum + (hisDebt - myDebt);
  }, 0);
  
  document.getElementById('stat-balance').textContent = formatMoney(balance);
  document.getElementById('stat-income').textContent = formatMoney(monthIncome);
  document.getElementById('stat-expense').textContent = formatMoney(monthExpense);
  document.getElementById('stat-savings').textContent = formatMoney(savings);
  document.getElementById('stat-investment').textContent = formatMoney(investment);
  document.getElementById('stat-external').textContent = formatMoney(Math.abs(netExternal));
  document.getElementById('stat-external').style.color = netExternal >= 0 ? 'var(--green)' : 'var(--orange)';
  
  // توزيع الميزانية (يستخدم الدخل الشهري)
  const categories = ['essential', 'savings', 'entertainment', 'investment'];
  const categoryNames = {
    essential: 'أساسي',
    savings: 'ادخار',
    entertainment: 'ترفيه',
    investment: 'استثمار'
  };
  const categoryColors = {
    essential: 'red',
    savings: 'green',
    entertainment: 'purple',
    investment: 'gold'
  };
  
  let budgetHtml = categories.map(cat => {
    const spent = monthTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
    const budgetPct = APP.settings.budget[cat];
    const budgetAmount = (monthIncome * budgetPct) / 100;
    const pct = budgetAmount > 0 ? (spent / budgetAmount * 100) : 0;
    
    return `
      <div class="progress-item">
        <div class="progress-header">
          <span>${categoryNames[cat]}</span>
          <span>${formatMoney(spent)} / ${formatMoney(budgetAmount)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${categoryColors[cat]}" style="width:${Math.min(pct, 100)}%"></div>
        </div>
      </div>
    `;
  }).join('');
  
  document.getElementById('budget-progress').innerHTML = budgetHtml;
  
  // آخر المعاملات
  const recentTxs = APP.txs.slice(-5).reverse();
  let txsHtml = '';
  if (recentTxs.length === 0) {
    txsHtml = '<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-text">لا توجد معاملات</div></div>';
  } else {
    txsHtml = recentTxs.map(tx => `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon">${tx.type === 'income' ? '💵' : '💸'}</div>
          <div class="tx-details">
            <h4>${tx.description}</h4>
            <div class="tx-meta">${tx.date}</div>
          </div>
        </div>
        <div class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}</div>
      </div>
    `).join('');
  }
  
  document.getElementById('recent-txs').innerHTML = txsHtml;
  
  // الأهداف المالية
  const activeGoals = APP.goals.filter(g => g.status === 'active').slice(0, 3);
  let goalsHtml = '';
  if (activeGoals.length === 0) {
    goalsHtml = '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">لا توجد أهداف نشطة</div></div>';
  } else {
    goalsHtml = activeGoals.map(g => {
      const pct = (g.saved / g.target * 100).toFixed(0);
      const badgeClass = `badge-${g.category}`;
      
      return `
        <div class="goal-card">
          <div class="goal-header">
            <div class="goal-title">${g.icon} ${g.name}</div>
            <span class="goal-badge ${badgeClass}">${g.category === 'savings' ? 'ادخار' : g.category === 'entertainment' ? 'ترفيه' : 'أساسي'}</span>
          </div>
          <div class="goal-progress">
            <div class="goal-stats">
              <span>مدخر: ${formatMoney(g.saved)}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${g.category === 'savings' ? 'green' : g.category === 'entertainment' ? 'purple' : 'gold'}" style="width:${Math.min(pct, 100)}%"></div>
            </div>
            <div style="margin-top:5px;font-size:14px;color:var(--text2)">🎯 الهدف: ${formatMoney(g.target)}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  document.getElementById('dashboard-goals').innerHTML = goalsHtml;
  
  // التنبيهات
  let alerts = [];
  
  // تنبيه النسخة الاحتياطية
  const lastBackup = localStorage.getItem('mahfazaty_last_backup');
  if (lastBackup) {
    const daysSinceBackup = Math.floor((new Date() - new Date(lastBackup)) / (1000 * 60 * 60 * 24));
    if (daysSinceBackup >= 3) {
      alerts.push({
        type: 'danger',
        message: `🔴 تحذير: آخر نسخة احتياطية كانت منذ ${daysSinceBackup} يوم!`,
        action: 'exportData()',
        actionText: '📥 نسخ احتياطي الآن'
      });
    }
  } else {
    // لم يتم عمل نسخة احتياطية أبداً
    alerts.push({
      type: 'warning',
      message: '⚠️ لم تقم بعمل نسخة احتياطية حتى الآن!',
      action: 'exportData()',
      actionText: '📥 نسخ احتياطي'
    });
  }
  
  categories.forEach(cat => {
    const spent = monthTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
    const budgetAmount = (monthIncome * APP.settings.budget[cat]) / 100;
    if (spent > budgetAmount) {
      alerts.push({
        type: 'warning',
        message: `⚠️ تجاوزت ميزانية ${categoryNames[cat]} بمبلغ ${formatMoney(spent - budgetAmount)}`
      });
    }
  });
  
  let alertsHtml = '';
  if (alerts.length > 0) {
    alertsHtml = alerts.map(a => {
      const alertClass = a.type === 'danger' ? 'alert-danger' : 'alert-warning';
      const actionBtn = a.action ? `<button class="btn btn-primary btn-small" onclick="${a.action}" style="margin-right:15px">${a.actionText}</button>` : '';
      return `<div class="alert ${alertClass}" style="display:flex;justify-content:space-between;align-items:center">
        <span>${a.message}</span>
        ${actionBtn}
      </div>`;
    }).join('');
  }
  
  document.getElementById('alerts-container').innerHTML = alertsHtml;
}

// ======================
// Transactions (المعاملات)
// ======================

function renderTransactions() {
  // ملء قائمة الأشهر
  const monthSelect = document.getElementById('filter-month');
  if (monthSelect) {
    const months = [...new Set(APP.txs.map(t => t.date.slice(0, 7)))].sort().reverse();
    monthSelect.innerHTML = '<option value="">كل الأشهر</option>' +
                           months.map(m => `<option value="${m}">${m}</option>`).join('');
  }
  
  filterTxs();
}

function filterTxs() {
  const category = document.getElementById('filter-category').value;
  const month = document.getElementById('filter-month').value;
  const search = document.getElementById('filter-search').value.toLowerCase();
  
  let filtered = APP.txs;
  
  if (category) {
    if (category === 'income') {
      filtered = filtered.filter(t => t.type === 'income');
    } else {
      filtered = filtered.filter(t => t.type === 'expense' && t.category === category);
    }
  }
  
  if (month) {
    filtered = filtered.filter(t => t.date.startsWith(month));
  }
  
  if (search) {
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(search) ||
      (t.source && t.source.toLowerCase().includes(search))
    );
  }
  
  filtered = filtered.reverse();
  
  let html = '';
  if (filtered.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-text">لا توجد معاملات</div></div>';
  } else {
    html = filtered.map(tx => `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon">${tx.type === 'income' ? '💵' : '💸'}</div>
          <div class="tx-details">
            <h4>${tx.description}</h4>
            <div class="tx-meta">${tx.date} • ${tx.category || tx.source || ''}</div>
          </div>
        </div>
        <div class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}</div>
        <div class="tx-actions">
          <button class="tx-action-btn" onclick="editTransaction(${tx.id})">✏️</button>
          <button class="tx-action-btn delete" onclick="deleteTransaction(${tx.id})">🗑</button>
        </div>
      </div>
    `).join('');
  }
  
  document.getElementById('txs-list').innerHTML = html;
}

// ======================
// Goals (الأهداف)
// ======================

function renderGoals() {
  filterGoals(APP.currentGoalFilter);
}

function filterGoals(status) {
  APP.currentGoalFilter = status;
  
  document.querySelectorAll('#page-goals .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const filtered = APP.goals.filter(g => g.status === status);
  
  let html = '';
  if (filtered.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">لا توجد أهداف</div></div>';
  } else {
    html = filtered.map(g => {
      const pct = (g.saved / g.target * 100).toFixed(0);
      const badgeClass = `badge-${g.category}`;
      
      return `
        <div class="goal-card">
          <div class="goal-header">
            <div class="goal-title">${g.icon} ${g.name}</div>
            <span class="goal-badge ${badgeClass}">${g.category === 'savings' ? 'ادخار' : g.category === 'entertainment' ? 'ترفيه' : g.category === 'essential' ? 'أساسي' : 'استثمار'}</span>
          </div>
          <div class="goal-progress">
            <div class="goal-stats">
              <span>مدخر: ${formatMoney(g.saved)}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${g.category === 'savings' ? 'green' : g.category === 'entertainment' ? 'purple' : g.category === 'essential' ? 'red' : 'gold'}" style="width:${Math.min(pct, 100)}%"></div>
            </div>
            <div style="margin-top:5px;font-size:14px;color:var(--text2)">🎯 الهدف: ${formatMoney(g.target)}</div>
          </div>
          <div class="goal-actions">
            ${g.status === 'active' ? `
              <button class="btn btn-primary btn-small" onclick="addToGoal(${g.id})">➕ إضافة</button>
              <button class="btn btn-secondary btn-small" onclick="withdrawFromGoal(${g.id})">➖ سحب</button>
              <button class="btn btn-secondary btn-small" onclick="completeGoal(${g.id})">✅ إنجاز</button>
              <button class="btn btn-secondary btn-small" onclick="pauseGoal(${g.id})">⏸ إيقاف</button>
              <button class="btn btn-secondary btn-small" onclick="cancelGoal(${g.id})">❌ إلغاء</button>
            ` : g.status === 'paused' ? `
              <button class="btn btn-primary btn-small" onclick="pauseGoal(${g.id})">▶️ تفعيل</button>
              <button class="btn btn-secondary btn-small" onclick="cancelGoal(${g.id})">❌ إلغاء</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  document.getElementById('goals-list').innerHTML = html;
}

// ======================
// People (حسابات الأشخاص)
// ======================

function renderPeople() {
  let html = '';
  if (APP.people.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">لا توجد حسابات أشخاص</div></div>';
  } else {
    html = APP.people.map(p => {
      const lastTx = p.transactions.length > 0 ? p.transactions[p.transactions.length - 1] : null;
      const avatar = p.name.charAt(0).toUpperCase();
      
      const myDebt = p.myDebtsToHim || 0;
      const hisDebt = p.hisDebtsToMe || 0;
      const net = hisDebt - myDebt;
      
      const balanceClass = net > 0 ? 'positive' : net < 0 ? 'negative' : '';
      const cardClass = net > 0 ? 'positive-balance' : net < 0 ? 'negative-balance' : '';
      
      return `
        <div class="person-card ${cardClass}" onclick="showPersonModal(${p.id})">
          <div class="person-header">
            <div style="display:flex;align-items:center;gap:15px">
              <div class="person-avatar">${avatar}</div>
              <div class="person-info">
                <h3>${p.name}</h3>
                <div class="person-meta">${p.transactions.length} معاملات${lastTx ? ' • ' + lastTx.date : ''}</div>
              </div>
            </div>
            <div style="text-align:left">
              <div class="person-balances">
                <div>
                  <span style="color:var(--green)">لي عنده:</span>
                  <span style="color:var(--green)">${formatMoney(hisDebt)}</span>
                </div>
                <div>
                  <span style="color:var(--orange)">علي له:</span>
                  <span style="color:var(--orange)">${formatMoney(myDebt)}</span>
                </div>
              </div>
              <div class="person-net ${balanceClass}">
                ${net >= 0 ? '+' : ''}${formatMoney(net)}
              </div>
              <div style="font-size:11px;color:var(--text2);margin-top:5px">
                ${net > 0 ? 'لي عنده' : net < 0 ? 'علي له' : 'متعادل'}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  document.getElementById('people-list').innerHTML = html;
}

// ======================
// Investment (الاستثمار)
// ======================

function renderInvestment() {
  const activeAssets = APP.assets.filter(a => !a.sold);
  const total = activeAssets.reduce((s, a) => s + a.currentValue, 0);
  const capital = activeAssets.reduce((s, a) => s + a.cost, 0);
  const profit = total - capital;
  const profitPct = capital > 0 ? ((profit / capital) * 100).toFixed(1) : 0;
  const fund = APP.goals.filter(g => g.category === 'investment' && g.status === 'active').reduce((s, g) => s + g.saved, 0);
  
  document.getElementById('invest-total').textContent = formatMoney(total);
  document.getElementById('invest-capital').textContent = formatMoney(capital);
  document.getElementById('invest-profit').textContent = `${profit >= 0 ? '+' : ''}${formatMoney(profit)}`;
  document.getElementById('invest-profit').style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('invest-fund').textContent = formatMoney(fund);
  
  // ✅ إضافة كارت نسبة النمو
  const profitCard = document.getElementById('invest-profit-pct');
  if (profitCard) {
    profitCard.textContent = `${profit >= 0 ? '+' : ''}${profitPct}%`;
    profitCard.style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
  }
  
  let html = '';
  if (APP.assets.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">📈</div><div class="empty-text">لا توجد أصول</div></div>';
  } else {
    html = APP.assets.map(a => {
      const typeIcons = {
        gold: '🥇',
        stock: '📊',
        crypto: '₿',
        realestate: '🏠',
        other: '📦'
      };
      const icon = typeIcons[a.assetType] || '📦';
      const profit = a.currentValue - a.cost;
      const profitPct = ((profit / a.cost) * 100).toFixed(1);
      
      if (a.sold) {
        return `
          <div class="asset-card" style="opacity:0.6">
            <div class="asset-header">
              <div class="asset-title">
                <div class="asset-icon">${icon}</div>
                <div class="asset-info">
                  <h3>${a.name} ✅</h3>
                  <div class="asset-details">مباع • ${a.soldDate}</div>
                </div>
              </div>
              <div class="asset-value">
                <div class="asset-amount">${formatMoney(a.soldPrice)}</div>
                <div class="asset-profit ${a.soldProfit >= 0 ? 'positive' : 'negative'}">${a.soldProfit >= 0 ? '+' : ''}${formatMoney(a.soldProfit)}</div>
              </div>
            </div>
          </div>
        `;
      }
      
      return `
        <div class="asset-card">
          <div class="asset-header">
            <div class="asset-title">
              <div class="asset-icon">${icon}</div>
              <div class="asset-info">
                <h3>${a.name}</h3>
                <div class="asset-details">${a.quantity} • متوسط: ${formatMoney(a.cost / a.quantity)}</div>
              </div>
            </div>
            <div class="asset-value">
              <div class="asset-amount">${formatMoney(a.currentValue)}</div>
              <div class="asset-profit ${profit >= 0 ? 'positive' : 'negative'}">${profit >= 0 ? '+' : ''}${formatMoney(profit)} (${profitPct}%)</div>
            </div>
          </div>
          <div class="asset-actions">
            <button class="btn btn-primary btn-small" onclick="buyMoreAsset(${a.id})">🛒 شراء المزيد</button>
            <button class="btn btn-primary btn-small" onclick="recordDividend(${a.id})">💰 تسجيل عائد</button>
            <button class="btn btn-primary btn-small" onclick="updateAssetValue(${a.id})">📊 تحديث</button>
            <button class="btn btn-secondary btn-small" onclick="sellAsset(${a.id})">💰 بيع</button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  document.getElementById('assets-list').innerHTML = html;
}

// ======================
// Report (التقرير الشهري)
// ======================

function renderReport() {
  const month = thisMonth();
  const monthTxs = APP.txs.filter(t => t.date.startsWith(month));
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  
  const categories = ['essential', 'savings', 'entertainment', 'investment'];
  const categoryNames = {
    essential: 'أساسي',
    savings: 'ادخار',
    entertainment: 'ترفيه',
    investment: 'استثمار'
  };
  
  let categoryBreakdown = categories.map(cat => {
    const spent = monthTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
    const pct = expense > 0 ? ((spent / expense) * 100).toFixed(1) : 0;
    
    return `
      <div class="calc-row">
        <span class="label">${categoryNames[cat]}</span>
        <span class="value">${formatMoney(spent)} (${pct}%)</span>
      </div>
    `;
  }).join('');
  
  const html = `
    <div style="background:var(--bg2);padding:20px;border-radius:15px;margin-bottom:20px">
      <h3 style="margin-bottom:15px">📅 ${month}</h3>
      <div class="calc-row">
        <span class="label">إجمالي الدخل:</span>
        <span class="value positive">${formatMoney(income)}</span>
      </div>
      <div class="calc-row">
        <span class="label">إجمالي المصروفات:</span>
        <span class="value negative">${formatMoney(expense)}</span>
      </div>
      <div class="calc-row total">
        <span class="label">الرصيد:</span>
        <span class="value ${balance >= 0 ? 'positive' : 'negative'}">${formatMoney(balance)}</span>
      </div>
    </div>
    
    <div style="background:var(--bg2);padding:20px;border-radius:15px">
      <h3 style="margin-bottom:15px">📊 توزيع المصروفات</h3>
      ${categoryBreakdown}
    </div>
  `;
  
  document.getElementById('report-content').innerHTML = html;
}

// ======================
// Budget (الميزانية)
// ======================

function renderBudgetPage() {
  document.getElementById('budget-essential').value = APP.settings.budget.essential;
  document.getElementById('budget-savings').value = APP.settings.budget.savings;
  document.getElementById('budget-entertainment').value = APP.settings.budget.entertainment;
  document.getElementById('budget-investment').value = APP.settings.budget.investment;
  
  const month = thisMonth();
  const monthTxs = APP.txs.filter(t => t.date.startsWith(month));
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  
  const categories = ['essential', 'savings', 'entertainment', 'investment'];
  const categoryNames = {
    essential: 'أساسي',
    savings: 'ادخار',
    entertainment: 'ترفيه',
    investment: 'استثمار'
  };
  
  let html = categories.map(cat => {
    const spent = monthTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
    const budgetPct = APP.settings.budget[cat];
    const budgetAmount = (income * budgetPct) / 100;
    const pct = budgetAmount > 0 ? (spent / budgetAmount * 100).toFixed(0) : 0;
    
    return `
      <div class="calc-row">
        <span class="label">${categoryNames[cat]} (${budgetPct}%):</span>
        <span class="value">${formatMoney(spent)} / ${formatMoney(budgetAmount)} (${pct}%)</span>
      </div>
    `;
  }).join('');
  
  document.getElementById('current-budget').innerHTML = html;
}

// ======================
// Categories (الأقسام الفرعية)
// ======================

function renderCategories() {
  if (!APP.settings.subCategories) {
    APP.settings.subCategories = {
      essential: ['طعام', 'مواصلات', 'فواتير', 'صحة', 'تعليم', 'ملابس', 'أخرى'],
      entertainment: ['ترفيه', 'هدايا', 'سفر', 'مطاعم', 'أخرى']
    };
  }
  
  const cat = APP.currentCategoryFilter;
  const catNames = {
    essential: 'أساسي',
    entertainment: 'ترفيه'
  };
  
  document.getElementById('current-category-name').textContent = 'الأقسام الفرعية لـ ' + catNames[cat];
  
  const subs = APP.settings.subCategories[cat] || [];
  
  let html = '';
  if (subs.length === 0) {
    html = '<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-text">لا توجد أقسام فرعية</div></div>';
  } else {
    html = '<div style="display:grid;gap:10px">' +
           subs.map((s, i) => `
             <div style="display:flex;justify-content:space-between;align-items:center;padding:15px;background:var(--bg2);border-radius:10px">
               <span style="font-size:16px">${s}</span>
               <button class="btn btn-secondary btn-small" onclick="deleteCategory('${cat}',${i})" style="background:var(--red);color:#fff;border:none">🗑 حذف</button>
             </div>
           `).join('') +
           '</div>';
  }
  
  document.getElementById('categories-list').innerHTML = html;
}

console.log('✅ pages.js loaded (complete)');
