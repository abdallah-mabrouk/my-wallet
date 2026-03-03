/* 💰 محفظتي v5 - ملف النوافذ المنبثقة (Modals) - كامل */

// ======================
// فتح وإغلاق Modals
// ======================

function om(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    createModal(id);
    return;
  }
  
  if (id === 'mExp') {
    APP.eType = 'expense';
    setET('expense', document.querySelector('.expense-tab'));
    updatePeopleDropdown();
    updateGoalsDropdown();
    updateSubcategoriesDropdown();
  }
  
  if (id === 'mInc') {
    document.getElementById('inc-date').value = today();
    APP.incType = 'income';
    setIncType('income', document.querySelector('#mInc .expense-tab'));
    updateBorrowPeopleDropdown();
  }
  
  if (id === 'mExp') {
    document.getElementById('exp-date').value = today();
  }
  
  modal.classList.add('show');
}

function cm(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('show');
}

// ======================
// إنشاء Modals ديناميكياً
// ======================

function createModal(id) {
  const container = document.getElementById('modals-container');
  
  if (id === 'mInc') {
    container.innerHTML += `
      <div id="mInc" class="mo">
        <div class="mo-content">
          <div class="mo-header">
            <div class="mo-title">💵 إضافة دخل</div>
            <button class="mo-close" onclick="cm('mInc')">&times;</button>
          </div>
          
          <div class="expense-tabs">
            <button class="expense-tab active" onclick="setIncType('income',this)">💵 دخل</button>
            <button class="expense-tab" onclick="setIncType('borrow',this)">💰 استدانة</button>
          </div>
          
          <div id="inc-normal-fields">
            <div class="form-group">
              <label class="form-label">المبلغ *</label>
              <input type="number" class="form-input" id="inc-amount" required>
            </div>
            <div class="form-group">
              <label class="form-label">المصدر</label>
              <select class="form-select" id="inc-source">
                <option value="راتب">راتب</option>
                <option value="عمل حر">عمل حر</option>
                <option value="استثمار">استثمار</option>
                <option value="هدايا">هدايا</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">الوصف</label>
              <input type="text" class="form-input" id="inc-desc">
            </div>
          </div>
          
          <div id="inc-borrow-fields" style="display:none">
            <div class="form-group">
              <label class="form-label">المبلغ *</label>
              <input type="number" class="form-input" id="inc-borrow-amount" required>
            </div>
            <div class="form-group">
              <label class="form-label">من الشخص *</label>
              <select class="form-select" id="inc-borrow-person" onchange="handleIncBorrowPerson(this)"></select>
            </div>
            <div class="form-group">
              <label class="form-label">السبب</label>
              <input type="text" class="form-input" id="inc-borrow-reason">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">التاريخ</label>
            <input type="date" class="form-input" id="inc-date">
          </div>
          
          <div class="form-group" id="inc-notes-group">
            <label class="form-label">ملاحظات</label>
            <textarea class="form-textarea" id="inc-notes"></textarea>
          </div>
          
          <button class="btn btn-primary" onclick="addIncome()">💾 حفظ</button>
        </div>
      </div>
    `;
  }
  
  if (id === 'mExp') {
    container.innerHTML += `
      <div id="mExp" class="mo">
        <div class="mo-content">
          <div class="mo-header">
            <div class="mo-title">💸 إضافة مصروف</div>
            <button class="mo-close" onclick="cm('mExp')">&times;</button>
          </div>
          
          <div class="expense-tabs">
            <button class="expense-tab active" onclick="setET('expense',this)">💸 مصروف</button>
            <button class="expense-tab" onclick="setET('savings',this)">🏦 ادخار</button>
            <button class="expense-tab" onclick="setET('person_debt',this)">👤 دين شخصي</button>
          </div>
          
          <div id="exp-normal-fields">
            <div class="form-group">
              <label class="form-label">المبلغ *</label>
              <input type="number" class="form-input" id="exp-amount" required>
            </div>
            <div class="form-group">
              <label class="form-label">القسم الرئيسي</label>
              <select class="form-select" id="exp-category" onchange="updateSubcategoriesDropdown()">
                <option value="essential">أساسي</option>
                <option value="entertainment">ترفيه</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">القسم الفرعي</label>
              <select class="form-select" id="exp-subcategory"></select>
            </div>
            <div class="form-group">
              <label class="form-label">الوصف</label>
              <input type="text" class="form-input" id="exp-desc">
            </div>
          </div>
          
          <div id="exp-debt-fields" style="display:none">
            <div class="form-group">
              <label class="form-label">المبلغ *</label>
              <input type="number" class="form-input" id="exp-debt-amount" required>
            </div>
            <div class="form-group">
              <label class="form-label">اختر الشخص *</label>
              <select class="form-select" id="e-person" onchange="handlePersonSelect(this)"></select>
            </div>
            <div class="form-group">
              <label class="form-label">سبب الدين</label>
              <input type="text" class="form-input" id="exp-debt-reason">
            </div>
          </div>
          
          <div id="exp-goal-fields" style="display:none">
            <div class="form-group">
              <label class="form-label">المبلغ *</label>
              <input type="number" class="form-input" id="exp-goal-amount" required>
            </div>
            <div class="form-group">
              <label class="form-label">اختر الهدف</label>
              <select class="form-select" id="exp-goal-select"></select>
            </div>
            <div class="form-group">
              <label class="form-label">الوصف</label>
              <input type="text" class="form-input" id="exp-goal-desc">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">التاريخ</label>
            <input type="date" class="form-input" id="exp-date">
          </div>
          
          <button class="btn btn-primary" onclick="addExpense()">💾 حفظ</button>
        </div>
      </div>
    `;
  }
  
  if (id === 'mGoal') {
    container.innerHTML += `
      <div id="mGoal" class="mo">
        <div class="mo-content">
          <div class="mo-header">
            <div class="mo-title">🎯 هدف جديد</div>
            <button class="mo-close" onclick="cm('mGoal')">&times;</button>
          </div>
          
          <div class="form-group">
            <label class="form-label">القسم</label>
            <select class="form-select" id="goal-category">
              <option value="savings">ادخار</option>
              <option value="entertainment">ترفيه</option>
              <option value="essential">أساسي</option>
              <option value="investment">استثمار</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">اسم الهدف *</label>
            <input type="text" class="form-input" id="goal-name" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">الأيقونة</label>
            <input type="text" class="form-input" id="goal-icon" placeholder="🎯">
          </div>
          
          <div class="form-group">
            <label class="form-label">المبلغ المطلوب *</label>
            <input type="number" class="form-input" id="goal-target" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">المبلغ المدخر</label>
            <input type="number" class="form-input" id="goal-saved" value="0">
          </div>
          
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="goal-permanent">
              <span>🔄 هدف دائم</span>
            </label>
          </div>
          
          <button class="btn btn-primary" onclick="addGoal()">💾 حفظ</button>
        </div>
      </div>
    `;
  }
  
  if (id === 'mAsset') {
    container.innerHTML += `
      <div id="mAsset" class="mo">
        <div class="mo-content">
          <div class="mo-header">
            <div class="mo-title">📈 أصل جديد</div>
            <button class="mo-close" onclick="cm('mAsset')">&times;</button>
          </div>
          
          <div class="form-group">
            <label class="form-label">نوع الأصل</label>
            <select class="form-select" id="asset-type">
              <option value="gold">🥇 ذهب</option>
              <option value="stock">📊 أسهم</option>
              <option value="crypto">₿ عملات رقمية</option>
              <option value="realestate">🏠 عقارات</option>
              <option value="other">📦 أخرى</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">الاسم *</label>
            <input type="text" class="form-input" id="asset-name" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">الكمية</label>
            <input type="number" class="form-input" id="asset-quantity" value="1" step="0.01">
          </div>
          
          <div class="form-group">
            <label class="form-label">التكلفة *</label>
            <input type="number" class="form-input" id="asset-cost" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">القيمة الحالية</label>
            <input type="number" class="form-input" id="asset-value">
          </div>
          
          <button class="btn btn-primary" onclick="addAsset()">💾 حفظ</button>
        </div>
      </div>
    `;
  }
  
  setTimeout(() => om(id), 100);
}

// ======================
// إدارة تبويبات الدخل
// ======================

function setIncType(type, el) {
  APP.incType = type;
  document.querySelectorAll('#mInc .expense-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  
  const normalFields = document.getElementById('inc-normal-fields');
  const borrowFields = document.getElementById('inc-borrow-fields');
  const notesGroup = document.getElementById('inc-notes-group');
  
  if (type === 'borrow') {
    borrowFields.style.display = 'block';
    normalFields.style.display = 'none';
    notesGroup.style.display = 'none';
    updateBorrowPeopleDropdown();
  } else {
    borrowFields.style.display = 'none';
    normalFields.style.display = 'block';
    notesGroup.style.display = 'block';
  }
}

function updateBorrowPeopleDropdown() {
  const sel = document.getElementById('inc-borrow-person');
  if (!sel) return;
  
  const names = APP.people.map(p => p.name).sort();
  sel.innerHTML = '<option value="">-- اختر --</option>' +
                  '<option value="__new__">➕ إضافة جديد</option>' +
                  names.map(n => `<option value="${n}">${n}</option>`).join('');
}

function handleIncBorrowPerson(sel) {
  if (sel.value === '__new__') {
    const name = prompt('اسم الشخص:');
    if (name && name.trim()) {
      getPerson(name.trim());
      updateBorrowPeopleDropdown();
      sel.value = name.trim();
    } else {
      sel.value = '';
    }
  }
}

// ======================
// إدارة تبويبات المصروف
// ======================

function setET(type, el) {
  APP.eType = type;
  document.querySelectorAll('.expense-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  
  const normalFields = document.getElementById('exp-normal-fields');
  const debtFields = document.getElementById('exp-debt-fields');
  const goalFields = document.getElementById('exp-goal-fields');
  
  normalFields.style.display = 'none';
  debtFields.style.display = 'none';
  goalFields.style.display = 'none';
  
  if (type === 'person_debt') {
    debtFields.style.display = 'block';
    updatePeopleDropdown();
  } else if (type === 'savings') {
    goalFields.style.display = 'block';
    updateGoalsDropdown();
  } else {
    normalFields.style.display = 'block';
  }
}

function updatePeopleDropdown() {
  const sel = document.getElementById('e-person');
  if (!sel) return;
  
  const names = APP.people.map(p => p.name).sort();
  sel.innerHTML = '<option value="">-- اختر --</option>' +
                  '<option value="__new__">➕ إضافة جديد</option>' +
                  names.map(n => `<option value="${n}">${n}</option>`).join('');
}

function handlePersonSelect(sel) {
  if (sel.value === '__new__') {
    const name = prompt('اسم الشخص:');
    if (name && name.trim()) {
      getPerson(name.trim());
      updatePeopleDropdown();
      sel.value = name.trim();
    } else {
      sel.value = '';
    }
  }
}

function updateGoalsDropdown() {
  const sel = document.getElementById('exp-goal-select');
  if (!sel) return;
  
  const category = 'savings';
  const goals = APP.goals.filter(g => g.category === category && g.status === 'active');
  
  sel.innerHTML = '<option value="">-- اختر --</option>' +
                  goals.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

function updateSubcategoriesDropdown() {
  if (!APP.settings.subCategories) {
    APP.settings.subCategories = {
      essential: ['طعام', 'مواصلات', 'فواتير', 'صحة', 'تعليم', 'ملابس', 'أخرى'],
      entertainment: ['ترفيه', 'هدايا', 'سفر', 'مطاعم', 'أخرى']
    };
  }
  
  const category = document.getElementById('exp-category').value;
  const sel = document.getElementById('exp-subcategory');
  if (!sel) return;
  
  const subs = APP.settings.subCategories[category] || [];
  sel.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
}

// ======================
// إضافة البيانات
// ======================

function addIncome() {
  if (APP.incType === 'borrow') {
    const amount = parseFloat(document.getElementById('inc-borrow-amount').value);
    const personName = document.getElementById('inc-borrow-person').value;
    const reason = document.getElementById('inc-borrow-reason').value;
    const date = document.getElementById('inc-date').value || today();
    
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    
    if (!personName || personName === '__new__') {
      toast('الرجاء اختيار الشخص', 'error');
      return;
    }
    
    const person = getPerson(personName);
    
    person.myDebtsToHim = (person.myDebtsToHim || 0) + amount;
    person.hisDebtsToMe = person.hisDebtsToMe || 0;
    person.netBalance = person.hisDebtsToMe - person.myDebtsToHim;
    
    person.transactions.push({
      id: Date.now(),
      date: date,
      amount: amount,
      type: 'borrow',
      description: reason || 'استدانة'
    });
    
    APP.txs.push({
      id: Date.now() + 1,
      type: 'income',
      amount: amount,
      source: 'استدانة',
      description: `استدانة من ${personName}${reason ? ' - ' + reason : ''}`,
      date: date,
      category: 'income',
      personId: person.id
    });
    
    document.getElementById('inc-borrow-amount').value = '';
    document.getElementById('inc-borrow-person').value = '';
    document.getElementById('inc-borrow-reason').value = '';
    
  } else {
    const amount = parseFloat(document.getElementById('inc-amount').value);
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    
    const tx = {
      id: Date.now(),
      type: 'income',
      amount: amount,
      source: document.getElementById('inc-source').value,
      description: document.getElementById('inc-desc').value,
      date: document.getElementById('inc-date').value || today(),
      notes: document.getElementById('inc-notes').value,
      category: 'income'
    };
    
    APP.txs.push(tx);
    
    document.getElementById('inc-amount').value = '';
    document.getElementById('inc-desc').value = '';
    document.getElementById('inc-notes').value = '';
  }
  
  save();
  cm('mInc');
  renderAll();
  toast('تم إضافة الدخل بنجاح', 'success');
}

function addExpense() {
  let amount, description, date;
  date = document.getElementById('exp-date').value || today();
  
  if (APP.eType === 'person_debt') {
    amount = parseFloat(document.getElementById('exp-debt-amount').value);
    const personName = document.getElementById('e-person').value;
    const reason = document.getElementById('exp-debt-reason').value;
    
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    
    if (!personName || personName === '__new__') {
      toast('الرجاء اختيار الشخص', 'error');
      return;
    }
    
    const person = getPerson(personName);
    
    person.hisDebtsToMe = (person.hisDebtsToMe || 0) + amount;
    person.myDebtsToHim = person.myDebtsToHim || 0;
    person.netBalance = person.hisDebtsToMe - person.myDebtsToHim;
    
    person.transactions.push({
      id: Date.now(),
      date: date,
      amount: amount,
      type: 'debt',
      description: reason || 'دين'
    });
    
    // ✅ التعديل: تغيير category من 'person_debt' إلى 'essential'
    // حتى يتم خصمه من الرصيد
    APP.txs.push({
      id: Date.now() + 1,
      type: 'expense',
      amount: amount,
      category: 'essential',  // ← كان 'person_debt'
      subcategory: 'دين شخصي',
      description: `دين على ${personName}${reason ? ' - ' + reason : ''}`,
      date: date,
      personId: person.id,
      isPersonDebt: true  // ← علامة للتمييز فقط
    });
    
    document.getElementById('exp-debt-amount').value = '';
    document.getElementById('e-person').value = '';
    document.getElementById('exp-debt-reason').value = '';
    
  } else if (APP.eType === 'savings') {
    amount = parseFloat(document.getElementById('exp-goal-amount').value);
    const goalId = document.getElementById('exp-goal-select').value;
    description = document.getElementById('exp-goal-desc').value;
    
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    
    if (goalId) {
      const goal = APP.goals.find(g => g.id == goalId);
      if (goal) {
        goal.saved += amount;
        if (goal.saved >= goal.target && !goal.isPermanent) {
          goal.status = 'completed';
          goal.completedDate = today();
          toast(`🎉 تهانينا! تم إنجاز الهدف: ${goal.name}`, 'success');
        }
      }
    }
    
    APP.txs.push({
      id: Date.now(),
      type: 'expense',
      amount: amount,
      category: 'savings',
      description: description || 'ادخار',
      date: date,
      goalId: goalId || null
    });
    
    document.getElementById('exp-goal-amount').value = '';
    document.getElementById('exp-goal-select').value = '';
    document.getElementById('exp-goal-desc').value = '';
    
  } else {
    amount = parseFloat(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const subcategory = document.getElementById('exp-subcategory').value;
    description = document.getElementById('exp-desc').value;
    
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    
    APP.txs.push({
      id: Date.now(),
      type: 'expense',
      amount: amount,
      category: category,
      subcategory: subcategory,
      description: description || subcategory,
      date: date
    });
    
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value = '';
  }
  
  save();
  cm('mExp');
  renderAll();
  toast('تم إضافة المصروف بنجاح', 'success');
}

function addGoal() {
  const name = document.getElementById('goal-name').value;
  const target = parseFloat(document.getElementById('goal-target').value);
  
  if (!name || !target || target <= 0) {
    toast('الرجاء إدخال البيانات المطلوبة', 'error');
    return;
  }
  
  const goal = {
    id: Date.now(),
    name: name,
    icon: document.getElementById('goal-icon').value || '🎯',
    category: document.getElementById('goal-category').value,
    target: target,
    saved: parseFloat(document.getElementById('goal-saved').value) || 0,
    isPermanent: document.getElementById('goal-permanent').checked,
    status: 'active',
    createdDate: today()
  };
  
  APP.goals.push(goal);
  save();
  cm('mGoal');
  renderAll();
  toast('تم إضافة الهدف بنجاح', 'success');
  
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-target').value = '';
  document.getElementById('goal-saved').value = '0';
  document.getElementById('goal-icon').value = '';
  document.getElementById('goal-permanent').checked = false;
}

function addAsset() {
  const name = document.getElementById('asset-name').value;
  const cost = parseFloat(document.getElementById('asset-cost').value);
  
  if (!name || !cost || cost <= 0) {
    toast('الرجاء إدخال البيانات المطلوبة', 'error');
    return;
  }
  
  const quantity = parseFloat(document.getElementById('asset-quantity').value) || 1;
  const currentValue = parseFloat(document.getElementById('asset-value').value) || cost;
  
  const asset = {
    id: Date.now(),
    assetType: document.getElementById('asset-type').value,
    name: name,
    quantity: quantity,
    cost: cost,
    currentValue: currentValue,
    sold: false,
    purchases: [
      {
        date: today(),
        quantity: quantity,
        cost: cost,
        pricePerUnit: cost / quantity
      }
    ],
    valueHistory: [],
    createdDate: today()
  };
  
  APP.assets.push(asset);
  
  APP.txs.push({
    id: Date.now(),
    type: 'expense',
    amount: cost,
    category: 'investment',
    description: `شراء: ${name}`,
    date: today()
  });
  
  save();
  cm('mAsset');
  renderAll();
  toast('تم إضافة الأصل بنجاح', 'success');
  
  document.getElementById('asset-name').value = '';
  document.getElementById('asset-cost').value = '';
  document.getElementById('asset-quantity').value = '1';
  document.getElementById('asset-value').value = '';
}

// ======================
// Modal الشخص المحسّن
// ======================

function showPersonModal(personId) {
  const person = APP.people.find(p => p.id === personId);
  if (!person) return;
  
  const myDebt = person.myDebtsToHim || 0;
  const hisDebt = person.hisDebtsToMe || 0;
  const net = hisDebt - myDebt;
  
  const modal = document.createElement('div');
  modal.className = 'mo show';
  
  let txsHtml = '';
  if (person.transactions.length === 0) {
    txsHtml = '<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">لا توجد معاملات</div></div>';
  } else {
    txsHtml = person.transactions.slice().reverse().map(tx => {
      let icon = '💰';
      let typeText = '';
      let amountSign = '';
      let amountClass = '';
      
      if (tx.type === 'borrow') {
        icon = '💰';
        typeText = 'استدانة مني';
        amountSign = '+';
        amountClass = 'income';
      } else if (tx.type === 'debt') {
        icon = '💸';
        typeText = 'دين عليه';
        amountSign = '+';
        amountClass = 'expense';
      } else if (tx.type === 'payment') {
        icon = '✅';
        typeText = 'سداد';
        amountSign = '-';
        amountClass = 'income';
      }
      
      return `
        <div class="tx-item">
          <div class="tx-left">
            <div class="tx-icon">${icon}</div>
            <div class="tx-details">
              <h4>${tx.description || typeText}</h4>
              <div class="tx-meta">${tx.date} • ${typeText}</div>
            </div>
          </div>
          <div class="tx-amount ${amountClass}">${amountSign}${formatMoney(Math.abs(tx.amount))}</div>
        </div>
      `;
    }).join('');
  }
  
  modal.innerHTML = `
    <div class="mo-content">
      <div class="mo-header">
        <div class="mo-title">👤 ${person.name}</div>
        <button class="mo-close" onclick="this.closest('.mo').remove()">&times;</button>
      </div>
      
      <div style="background:var(--card);padding:20px;border-radius:15px;margin-bottom:20px;border:2px solid ${net >= 0 ? 'var(--green)' : 'var(--orange)'}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">
          <div>
            <div style="font-size:12px;color:var(--text2)">لي عنده</div>
            <div style="font-size:24px;font-weight:700;color:var(--green)">${formatMoney(hisDebt)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text2)">علي له</div>
            <div style="font-size:24px;font-weight:700;color:var(--orange)">${formatMoney(myDebt)}</div>
          </div>
        </div>
        <div style="border-top:2px solid var(--bg2);padding-top:15px">
          <div style="font-size:14px;color:var(--text2);margin-bottom:5px">الرصيد الصافي</div>
          <div style="font-size:36px;font-weight:700;color:${net >= 0 ? 'var(--green)' : 'var(--orange)'}">
            ${net >= 0 ? '+' : ''}${formatMoney(net)}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-top:5px">
            ${net > 0 ? '✅ يدين لي' : net < 0 ? '⚠️ أنا مدين له' : '⚖️ متعادل'}
          </div>
        </div>
      </div>
      
      ${hisDebt > 0 ? `<button class="btn btn-primary" style="width:100%;margin-bottom:10px" onclick="recordPaymentFrom(${personId});this.closest('.mo').remove()">💰 تسجيل سداد منه</button>` : ''}
      ${myDebt > 0 ? `<button class="btn btn-secondary" style="width:100%;margin-bottom:10px" onclick="recordPaymentTo(${personId});this.closest('.mo').remove()">💸 تسجيل سداد له</button>` : ''}
      
      <h3 style="margin:20px 0">📋 سجل المعاملات</h3>
      ${txsHtml}
    </div>
  `;
  
  document.body.appendChild(modal);
}

function recordPaymentFrom(personId) {
  const person = APP.people.find(p => p.id === personId);
  if (!person) return;
  
  const maxAmount = person.hisDebtsToMe || 0;
  if (maxAmount <= 0) {
    toast('لا يوجد دين على هذا الشخص', 'error');
    return;
  }
  
  const amount = parseFloat(prompt(`المبلغ المسدد (الحد الأقصى: ${formatMoney(maxAmount)}):`));
  if (!amount || amount <= 0 || amount > maxAmount) {
    toast('مبلغ غير صحيح', 'error');
    return;
  }
  
  person.hisDebtsToMe -= amount;
  person.netBalance = (person.hisDebtsToMe || 0) - (person.myDebtsToHim || 0);
  
  person.transactions.push({
    id: Date.now(),
    date: today(),
    amount: -amount,
    type: 'payment',
    description: 'سداد'
  });
  
  APP.txs.push({
    id: Date.now(),
    type: 'income',
    amount: amount,
    source: 'سداد دين',
    description: `سداد من ${person.name}`,
    date: today(),
    category: 'income',
    personId: personId
  });
  
  save();
  renderAll();
  toast('تم تسجيل السداد بنجاح', 'success');
}

function recordPaymentTo(personId) {
  const person = APP.people.find(p => p.id === personId);
  if (!person) return;
  
  const maxAmount = person.myDebtsToHim || 0;
  if (maxAmount <= 0) {
    toast('لا يوجد دين عليك لهذا الشخص', 'error');
    return;
  }
  
  const amount = parseFloat(prompt(`المبلغ المسدد (الحد الأقصى: ${formatMoney(maxAmount)}):`));
  if (!amount || amount <= 0 || amount > maxAmount) {
    toast('مبلغ غير صحيح', 'error');
    return;
  }
  
  person.myDebtsToHim -= amount;
  person.netBalance = (person.hisDebtsToMe || 0) - (person.myDebtsToHim || 0);
  
  person.transactions.push({
    id: Date.now(),
    date: today(),
    amount: -amount,
    type: 'payment',
    description: 'سداد'
  });
  
  APP.txs.push({
    id: Date.now(),
    type: 'expense',
    amount: amount,
    category: 'essential',
    description: `سداد لـ ${person.name}`,
    date: today(),
    personId: personId
  });
  
  save();
  renderAll();
  toast('تم تسجيل السداد بنجاح', 'success');
}

console.log('✅ modals.js loaded (complete)');
