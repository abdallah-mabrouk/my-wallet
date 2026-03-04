/* 💰 محفظتي v5 - ملف البيانات والدوال الأساسية */

// هيكل البيانات الرئيسي
const APP = {
  txs: [],           // المعاملات
  goals: [],         // الأهداف
  assets: [],        // الأصول
  people: [],        // الأشخاص (الديون مدموجة هنا)
  gasUrl: '',        // رابط Google Sheets
  eType: 'expense',  // نوع المصروف الحالي
  incType: 'income', // نوع الدخل الحالي
  currentGoalFilter: 'active',
  currentCategoryFilter: 'essential',
  settings: {
    budget: {
      essential: 50,
      savings: 20,
      entertainment: 20,
      investment: 10
    },
    subCategories: {
      essential: ['طعام', 'مواصلات', 'فواتير', 'صحة', 'تعليم', 'ملابس', 'منزل', 'أخرى'],
      entertainment: ['ترفيه', 'هدايا', 'سفر', 'مطاعم', 'رياضة', 'أخرى']
    }
  }
};

// ======================
// الدوال المساعدة
// ======================

function today() {
  return new Date().toISOString().split('T')[0];
}

function thisMonth() {
  return new Date().toISOString().split('T')[0].slice(0, 7);
}

function formatMoney(amount) {
  return new Intl.NumberFormat('ar-EG').format(amount) + ' ج.م';
}

function save() {
  localStorage.setItem('mahfazaty_data', JSON.stringify(APP));
  // ❌ لا مزامنة تلقائية - يدوية فقط
}

function load() {
  const data = localStorage.getItem('mahfazaty_data');
  if (data) {
    const parsed = JSON.parse(data);
    Object.assign(APP, parsed);
    
    // التأكد من وجود الحقول الجديدة في People
    if (!APP.settings.subCategories) {
      APP.settings.subCategories = {
        essential: ['طعام', 'مواصلات', 'فواتير', 'صحة', 'تعليم', 'ملابس', 'أخرى'],
        entertainment: ['ترفيه', 'هدايا', 'سفر', 'مطاعم', 'أخرى']
      };
    }
    
    // تهيئة الحقول الجديدة للأشخاص
    APP.people.forEach(person => {
      if (person.myDebtsToHim === undefined) person.myDebtsToHim = 0;
      if (person.hisDebtsToMe === undefined) person.hisDebtsToMe = 0;
      if (person.netBalance === undefined) {
        person.netBalance = (person.hisDebtsToMe || 0) - (person.myDebtsToHim || 0);
      }
      // تحويل totalDebt القديم إلى hisDebtsToMe
      if (person.totalDebt && !person.hisDebtsToMe) {
        person.hisDebtsToMe = person.totalDebt;
        person.netBalance = person.hisDebtsToMe - (person.myDebtsToHim || 0);
        delete person.totalDebt;
      }
    });
    
    // ✅ Migration: تحويل person_debt القديمة إلى essential
    APP.txs.forEach(tx => {
      if (tx.category === 'person_debt') {
        tx.category = 'essential';
        tx.subcategory = 'دين شخصي';
        if (!tx.isPersonDebt) tx.isPersonDebt = true;
      }
    });
    
    // حفظ التعديلات
    if (APP.txs.some(tx => tx.category === 'person_debt')) {
      save();
    }
  }
}

function syncToGoogleSheets() {
  if (!APP.gasUrl || APP.gasUrl.trim() === '') return;
  
  const data = {
    txs: APP.txs,
    goals: APP.goals,
    assets: APP.assets,
    people: APP.people,
    settings: APP.settings,
    timestamp: new Date().toISOString()
  };
  
  fetch(APP.gasUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(() => {
    console.log('✅ تمت المزامنة مع Google Sheets');
  }).catch(err => {
    console.error('❌ فشلت المزامنة:', err);
  });
}

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ======================
// إدارة الأشخاص
// ======================

function getPerson(name) {
  let person = APP.people.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (!person) {
    person = {
      id: Date.now(),
      name: name,
      myDebtsToHim: 0,    // أنا مدين له
      hisDebtsToMe: 0,    // هو مدين لي
      netBalance: 0,      // الرصيد الصافي
      transactions: [],
      createdDate: today()
    };
    APP.people.push(person);
  }
  return person;
}

// ======================
// التنقل والعرض
// ======================

function nav(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.target.classList.add('active');
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  
  const titles = {
    dashboard: '📊 لوحة التحكم',
    transactions: '💳 المعاملات',
    goals: '🎯 الأهداف المالية',
    budget: '📊 الميزانية',
    people: '👥 حسابات الأشخاص',
    investment: '📈 الاستثمار',
    report: '📑 التقرير الشهري',
    categories: '🏷️ الأقسام الفرعية',
    settings: '⚙️ الإعدادات'
  };
  
  document.getElementById('page-title').textContent = titles[page];
  
  // تحديث المحتوى حسب الصفحة
  if (page === 'transactions') renderTransactions();
  if (page === 'goals') renderGoals();
  if (page === 'people') renderPeople();
  if (page === 'investment') renderInvestment();
  if (page === 'report') renderReport();
  if (page === 'budget') renderBudgetPage();
  if (page === 'categories') renderCategories();
}

function renderAll() {
  renderDashboard();
  
  // تحديث الصفحة النشطة
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const pageId = activePage.id.replace('page-', '');
    if (pageId === 'transactions') renderTransactions();
    if (pageId === 'goals') renderGoals();
    if (pageId === 'people') renderPeople();
    if (pageId === 'investment') renderInvestment();
  }
}

// ======================
// إدارة المعاملات
// ======================

function deleteTransaction(txId) {
  if (confirm('هل تريد حذف هذه المعاملة؟')) {
    const txIndex = APP.txs.findIndex(t => t.id === txId);
    if (txIndex > -1) {
      const tx = APP.txs[txIndex];
      
      // ✅ إذا كانت المعاملة متعلقة بشخص، حدّث حسابه
      if (tx.personId) {
        const person = APP.people.find(p => p.id === tx.personId);
        if (person) {
          // حذف المعاملة من سجل الشخص
          const personTxIndex = person.transactions.findIndex(t => t.id === tx.id || Math.abs(t.date === tx.date && t.amount === tx.amount));
          if (personTxIndex > -1) {
            const personTx = person.transactions[personTxIndex];
            
            // عكس المعاملة من رصيد الشخص
            if (personTx.type === 'debt') {
              // كان دين عليه → نخصمه
              person.hisDebtsToMe -= personTx.amount;
            } else if (personTx.type === 'borrow') {
              // كان استدانة منه → نخصمها
              person.myDebtsToHim -= personTx.amount;
            } else if (personTx.type === 'payment') {
              // كان سداد → نعكسه
              if (tx.type === 'income') {
                // كان سداد منه → نرجع الدين
                person.hisDebtsToMe += Math.abs(personTx.amount);
              } else {
                // كان سداد له → نرجع الدين
                person.myDebtsToHim += Math.abs(personTx.amount);
              }
            }
            
            // تحديث الرصيد الصافي
            person.netBalance = (person.hisDebtsToMe || 0) - (person.myDebtsToHim || 0);
            
            // حذف المعاملة من سجل الشخص
            person.transactions.splice(personTxIndex, 1);
          }
        }
      }
      
      // حذف المعاملة من القائمة الرئيسية
      APP.txs.splice(txIndex, 1);
      save();
      renderAll();
      toast('تم حذف المعاملة', 'success');
    }
  }
}

function editTransaction(txId) {
  const tx = APP.txs.find(t => t.id === txId);
  if (!tx) return;
  
  const newAmount = parseFloat(prompt('المبلغ الجديد:', tx.amount));
  if (newAmount && newAmount > 0) {
    tx.amount = newAmount;
  }
  
  const newDesc = prompt('الوصف الجديد:', tx.description);
  if (newDesc) {
    tx.description = newDesc;
  }
  
  save();
  renderAll();
  toast('تم تعديل المعاملة', 'success');
}

// ======================
// إدارة الأهداف
// ======================

function addToGoal(goalId) {
  const amount = parseFloat(prompt('المبلغ المراد إضافته:'));
  if (!amount || amount <= 0) return;
  
  const goal = APP.goals.find(g => g.id === goalId);
  if (!goal) return;
  
  goal.saved += amount;
  
  if (goal.saved >= goal.target && !goal.isPermanent) {
    goal.status = 'completed';
    goal.completedDate = today();
    toast(`🎉 تهانينا! تم إنجاز الهدف: ${goal.name}`, 'success');
  }
  
  APP.txs.push({
    id: Date.now(),
    type: 'expense',
    amount: amount,
    category: goal.category,
    description: `إضافة للهدف: ${goal.name}`,
    date: today(),
    goalId: goalId
  });
  
  save();
  renderAll();
}

function withdrawFromGoal(goalId) {
  const goal = APP.goals.find(g => g.id === goalId);
  if (!goal) return;
  
  const amount = parseFloat(prompt(`المبلغ المراد سحبه (المتاح: ${formatMoney(goal.saved)}):`));
  if (!amount || amount <= 0 || amount > goal.saved) {
    toast('مبلغ غير صحيح', 'error');
    return;
  }
  
  goal.saved -= amount;
  
  APP.txs.push({
    id: Date.now(),
    type: 'income',
    amount: amount,
    source: 'سحب من هدف',
    description: `سحب من الهدف: ${goal.name}`,
    date: today(),
    category: 'income'
  });
  
  save();
  renderAll();
  toast('تم السحب بنجاح', 'success');
}

function completeGoal(goalId) {
  const goal = APP.goals.find(g => g.id === goalId);
  if (!goal) return;
  
  if (confirm(`هل تريد إنجاز الهدف: ${goal.name}؟`)) {
    goal.status = 'completed';
    goal.completedDate = today();
    save();
    renderAll();
    toast('تم إنجاز الهدف بنجاح', 'success');
  }
}

function pauseGoal(goalId) {
  const goal = APP.goals.find(g => g.id === goalId);
  if (!goal) return;
  
  if (goal.status === 'paused') {
    goal.status = 'active';
    toast('تم تفعيل الهدف', 'success');
  } else {
    goal.status = 'paused';
    toast('تم إيقاف الهدف', 'info');
  }
  
  save();
  renderAll();
}

function cancelGoal(goalId) {
  const goal = APP.goals.find(g => g.id === goalId);
  if (!goal) return;
  
  const returnMoney = confirm(`إلغاء الهدف: ${goal.name}\n\nهل تريد إرجاع المبلغ المدخر (${formatMoney(goal.saved)}) كدخل؟`);
  
  goal.status = 'cancelled';
  goal.cancelledDate = today();
  
  if (returnMoney && goal.saved > 0) {
    APP.txs.push({
      id: Date.now(),
      type: 'income',
      amount: goal.saved,
      source: 'إلغاء هدف',
      description: `إرجاع مبلغ من الهدف الملغي: ${goal.name}`,
      date: today(),
      category: 'income'
    });
  }
  
  save();
  renderAll();
  toast('تم إلغاء الهدف', 'info');
}

// ======================
// إدارة الأصول
// ======================

function buyMoreAsset(assetId) {
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset || asset.sold) return;
  
  const modal = document.createElement('div');
  modal.className = 'mo show';
  modal.innerHTML = `
    <div class="mo-content">
      <div class="mo-header">
        <div class="mo-title">🛒 شراء المزيد</div>
        <button class="mo-close" onclick="this.closest('.mo').remove()">&times;</button>
      </div>
      
      <div style="background:var(--bg2);padding:15px;border-radius:10px;margin-bottom:20px">
        <h3>📦 ${asset.name}</h3>
        <p style="color:var(--text2);margin-top:10px">
          الكمية الحالية: ${asset.quantity}<br>
          التكلفة الإجمالية: ${formatMoney(asset.cost)}<br>
          متوسط السعر: ${formatMoney(asset.cost / asset.quantity)} / وحدة
        </p>
      </div>
      
      <div class="form-group">
        <label class="form-label">الكمية الجديدة *</label>
        <input type="number" class="form-input" id="buy-quantity" step="0.01" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">التكلفة الإجمالية *</label>
        <input type="number" class="form-input" id="buy-cost" required>
      </div>
      
      <div id="buy-calc"></div>
      
      <button class="btn btn-primary" onclick="confirmBuyMore(${assetId})">💰 تأكيد الشراء</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const qtyInput = modal.querySelector('#buy-quantity');
  const costInput = modal.querySelector('#buy-cost');
  const calcDiv = modal.querySelector('#buy-calc');
  
  function calculate() {
    const newQty = parseFloat(qtyInput.value) || 0;
    const newCost = parseFloat(costInput.value) || 0;
    
    if (newQty <= 0 || newCost <= 0) {
      calcDiv.innerHTML = '';
      return;
    }
    
    const pricePerUnit = newCost / newQty;
    const totalQty = asset.quantity + newQty;
    const totalCost = asset.cost + newCost;
    const newAvgCost = totalCost / totalQty;
    const oldAvgCost = asset.cost / asset.quantity;
    
    calcDiv.innerHTML = `
      <div class="calc-card">
        <div class="calc-row">
          <span class="label">سعر الوحدة الجديد:</span>
          <span class="value">${formatMoney(pricePerUnit)}</span>
        </div>
        <div style="border-top:2px solid var(--card);margin:10px 0"></div>
        <div class="calc-row">
          <span class="label">الكمية الإجمالية:</span>
          <span class="value">${totalQty}</span>
        </div>
        <div class="calc-row">
          <span class="label">التكلفة الإجمالية:</span>
          <span class="value">${formatMoney(totalCost)}</span>
        </div>
        <div class="calc-row total">
          <span class="label">متوسط السعر الجديد:</span>
          <span class="value">${formatMoney(newAvgCost)}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:10px">
          التغيير: من ${formatMoney(oldAvgCost)} إلى ${formatMoney(newAvgCost)} / وحدة
        </div>
      </div>
    `;
  }
  
  qtyInput.addEventListener('input', calculate);
  costInput.addEventListener('input', calculate);
}

function confirmBuyMore(assetId) {
  const newQty = parseFloat(document.getElementById('buy-quantity').value);
  const newCost = parseFloat(document.getElementById('buy-cost').value);
  
  if (!newQty || newQty <= 0 || !newCost || newCost <= 0) {
    toast('بيانات غير صحيحة', 'error');
    return;
  }
  
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  // تحديث الأصل
  if (!asset.purchases) asset.purchases = [];
  
  asset.purchases.push({
    date: today(),
    quantity: newQty,
    cost: newCost,
    pricePerUnit: newCost / newQty
  });
  
  asset.quantity += newQty;
  asset.cost += newCost;
  asset.currentValue += newCost; // افتراضياً - يمكن تحديثه لاحقاً
  
  // تسجيل معاملة
  APP.txs.push({
    id: Date.now(),
    type: 'expense',
    amount: newCost,
    category: 'investment',
    description: `شراء إضافي: ${asset.name} (${newQty})`,
    date: today()
  });
  
  save();
  document.querySelector('.mo.show').remove();
  renderAll();
  toast(`تم شراء ${newQty} إضافية بنجاح`, 'success');
}

// ======================
// الإعدادات
// ======================

function saveBudget() {
  const essential = parseInt(document.getElementById('budget-essential').value) || 0;
  const savings = parseInt(document.getElementById('budget-savings').value) || 0;
  const entertainment = parseInt(document.getElementById('budget-entertainment').value) || 0;
  const investment = parseInt(document.getElementById('budget-investment').value) || 0;
  
  const total = essential + savings + entertainment + investment;
  if (total !== 100) {
    toast('يجب أن يكون المجموع 100%', 'error');
    return;
  }
  
  APP.settings.budget = { essential, savings, entertainment, investment };
  save();
  renderBudgetPage();
  renderDashboard();
  toast('تم حفظ الميزانية بنجاح', 'success');
}

function saveSettings() {
  APP.gasUrl = document.getElementById('settings-gas').value;
  save();
  toast('تم حفظ الإعدادات', 'success');
}

function exportData() {
  const data = JSON.stringify(APP, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mahfazaty-backup-${today()}.json`;
  a.click();
  toast('تم تصدير البيانات', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.assign(APP, data);
        save();
        renderAll();
        toast('تم استيراد البيانات بنجاح', 'success');
      } catch (err) {
        toast('خطأ في قراءة الملف', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetData() {
  if (confirm('هل أنت متأكد من مسح كل البيانات؟ لا يمكن التراجع عن هذا الإجراء!')) {
    if (confirm('تأكيد نهائي: سيتم مسح كل شيء!')) {
      localStorage.removeItem('mahfazaty_data');
      location.reload();
    }
  }
}

// ======================
// الأقسام الفرعية
// ======================

function filterCategories(cat) {
  APP.currentCategoryFilter = cat;
  document.querySelectorAll('#page-categories .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  renderCategories();
}

function addNewCategory() {
  const input = document.getElementById('new-category-input');
  const name = input.value.trim();
  
  if (!name) {
    toast('الرجاء إدخال اسم القسم', 'error');
    return;
  }
  
  if (!APP.settings.subCategories) {
    APP.settings.subCategories = {
      essential: ['طعام', 'مواصلات', 'فواتير', 'صحة', 'تعليم', 'ملابس', 'أخرى'],
      entertainment: ['ترفيه', 'هدايا', 'سفر', 'مطاعم', 'أخرى']
    };
  }
  
  const cat = APP.currentCategoryFilter;
  
  if (!APP.settings.subCategories[cat]) {
    APP.settings.subCategories[cat] = [];
  }
  
  if (APP.settings.subCategories[cat].includes(name)) {
    toast('هذا القسم موجود بالفعل', 'error');
    return;
  }
  
  APP.settings.subCategories[cat].push(name);
  save();
  renderCategories();
  input.value = '';
  toast('تم إضافة القسم الفرعي بنجاح', 'success');
}

function deleteCategory(cat, index) {
  if (confirm('هل تريد حذف هذا القسم الفرعي؟')) {
    APP.settings.subCategories[cat].splice(index, 1);
    save();
    renderCategories();
    toast('تم الحذف', 'success');
  }
}

// ======================
// بدء التطبيق
// ======================

function startApp() {
  const gasUrl = document.getElementById('gas-url').value;
  APP.gasUrl = gasUrl;
  
  load();
  
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  
  renderAll();
  
  if (APP.gasUrl) {
    document.getElementById('settings-gas').value = APP.gasUrl;
    toast('تم الاتصال - المزامنة مفعّلة ✅', 'success');
  } else {
    toast('مرحباً بك في محفظتي v5! 💰', 'info');
  }
}

function startDemo() {
  const m = thisMonth();
  
  APP.txs = [
    { id: 1, type: 'income', amount: 15000, source: 'راتب', date: m + '-01', description: 'راتب شهر ' + m, category: 'income' },
    { id: 2, type: 'expense', amount: 3000, category: 'essential', subcategory: 'طعام', description: 'مشتريات البقالة', date: m + '-03' },
    { id: 3, type: 'expense', amount: 500, category: 'entertainment', subcategory: 'ترفيه', description: 'سينما', date: m + '-05' },
    { id: 4, type: 'expense', amount: 2000, category: 'savings', description: 'ادخار', date: m + '-07' },
    { id: 5, type: 'income', amount: 500, source: 'عمل حر', date: m + '-10', description: 'مشروع تصميم', category: 'income' }
  ];
  
  APP.goals = [
    {
      id: 1,
      name: 'صندوق الطوارئ',
      icon: '🛡️',
      category: 'savings',
      target: 50000,
      saved: 15000,
      status: 'active',
      isPermanent: false,
      createdDate: m + '-01'
    },
    {
      id: 2,
      name: 'شراء لابتوب',
      icon: '💻',
      category: 'entertainment',
      target: 20000,
      saved: 5000,
      status: 'active',
      isPermanent: false,
      createdDate: m + '-01'
    }
  ];
  
  APP.people = [
    {
      id: 1001,
      name: 'محمد',
      myDebtsToHim: 500,      // أنا مدين له
      hisDebtsToMe: 1000,     // هو مدين لي
      netBalance: 500,        // الصافي (لي)
      transactions: [
        { id: 10001, date: m + '-05', amount: 1000, type: 'debt', description: 'دين' },
        { id: 10002, date: m + '-10', amount: 500, type: 'borrow', description: 'استدانة' }
      ],
      createdDate: m + '-05'
    }
  ];
  
  APP.assets = [
    {
      id: 3001,
      assetType: 'gold',
      name: 'ذهب 21',
      quantity: 10,
      cost: 8000,
      currentValue: 8500,
      sold: false,
      purchases: [
        { date: m + '-01', quantity: 10, cost: 8000, pricePerUnit: 800 }
      ],
      valueHistory: [
        { date: m + '-15', oldValue: 8000, newValue: 8500, change: 500 }
      ],
      createdDate: m + '-01'
    }
  ];
  
  APP.settings.subCategories = {
    essential: ['طعام', 'مواصلات', 'فواتير', 'صحة', 'تعليم', 'ملابس', 'منزل', 'أخرى'],
    entertainment: ['ترفيه', 'هدايا', 'سفر', 'مطاعم', 'رياضة', 'أخرى']
  };
  
  save();
  
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('app').classList.add('active');
  
  renderAll();
  
  toast('وضع التجربة - تم تحميل بيانات تجريبية', 'info');
}

// التهيئة عند تحميل الصفحة
window.addEventListener('load', () => {
  const hasData = localStorage.getItem('mahfazaty_data');
  if (hasData) {
    startApp();
  }
});

// ======================
// استيراد من Google Sheets
// ======================

async function importFromGoogleSheets() {
  if (!APP.gasUrl || APP.gasUrl.trim() === '') {
    toast('الرجاء ربط Google Sheets أولاً من الإعدادات', 'error');
    return;
  }
  
  try {
    toast('جاري الاستيراد من Google Sheets...', 'info');
    
    // استدعاء GET لجلب البيانات
    const response = await fetch(APP.gasUrl + '?action=get', {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error('فشل الاتصال بـ Google Sheets');
    }
    
    const data = await response.json();
    
    if (data && data.txs) {
      // دمج البيانات المستوردة مع المحلية
      if (confirm('هل تريد استبدال البيانات المحلية بالبيانات من Google Sheets؟')) {
        // استبدال كامل
        APP.txs = data.txs || [];
        APP.goals = data.goals || [];
        APP.assets = data.assets || [];
        APP.people = data.people || [];
        if (data.settings) {
          APP.settings = Object.assign(APP.settings, data.settings);
        }
      } else {
        // دمج ذكي (تجنب التكرار)
        const existingTxIds = new Set(APP.txs.map(t => t.id));
        const newTxs = data.txs.filter(t => !existingTxIds.has(t.id));
        APP.txs.push(...newTxs);
        
        // نفس الشيء للأهداف والأصول والأشخاص
        const existingGoalIds = new Set(APP.goals.map(g => g.id));
        const newGoals = data.goals.filter(g => !existingGoalIds.has(g.id));
        APP.goals.push(...newGoals);
        
        const existingAssetIds = new Set(APP.assets.map(a => a.id));
        const newAssets = data.assets.filter(a => !existingAssetIds.has(a.id));
        APP.assets.push(...newAssets);
        
        const existingPeopleIds = new Set(APP.people.map(p => p.id));
        const newPeople = data.people.filter(p => !existingPeopleIds.has(p.id));
        APP.people.push(...newPeople);
      }
      
      save();
      renderAll();
      toast('تم الاستيراد من Google Sheets بنجاح! ✅', 'success');
    } else {
      toast('لا توجد بيانات في Google Sheets', 'warning');
    }
  } catch (err) {
    console.error('خطأ في الاستيراد:', err);
    toast('فشل الاستيراد من Google Sheets - تحقق من الرابط', 'error');
  }
}

console.log('✅ Google Sheets import function loaded');

// ======================
// تتبع التغييرات غير المحفوظة
// ======================

let hasUnsavedChanges = false;

// تعليم وجود تغييرات عند الحفظ المحلي
const _originalSave = save;
window.save = function() {
  _originalSave();
  hasUnsavedChanges = true;
};

// إعادة تعيين عند الرفع للسحابة
if (typeof manualUpload !== 'undefined') {
  const _originalUpload = manualUpload;
  window.manualUpload = async function() {
    await _originalUpload();
    hasUnsavedChanges = false;
  };
}

// تنبيه عند الإغلاق بدون حفظ
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges && APP.gasUrl && APP.gasUrl.trim() !== '') {
    const message = '⚠️ لديك تغييرات غير محفوظة!\n\nاضغط [📤 حفظ] قبل المغادرة.';
    e.preventDefault();
    e.returnValue = message;
    return message;
  }
});

console.log('✅ نظام التنبيه قبل الإغلاق جاهز');
