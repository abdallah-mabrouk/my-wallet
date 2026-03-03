/* 💰 محفظتي v5 - ملف الميزات الإضافية - كامل */

// ======================
// تحديث قيمة الأصل
// ======================

function updateAssetValue(assetId) {
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset || asset.sold) return;
  
  const modal = document.createElement('div');
  modal.className = 'mo show';
  modal.innerHTML = `
    <div class="mo-content">
      <div class="mo-header">
        <div class="mo-title">📊 تحديث القيمة</div>
        <button class="mo-close" onclick="this.closest('.mo').remove()">&times;</button>
      </div>
      
      <div style="background:var(--bg2);padding:15px;border-radius:10px;margin-bottom:20px">
        <h3>📦 ${asset.name}</h3>
        <p style="color:var(--text2);margin-top:5px">
          التكلفة: ${formatMoney(asset.cost)}<br>
          القيمة الحالية: ${formatMoney(asset.currentValue)}<br>
          ${asset.currentValue >= asset.cost ? 'ربح' : 'خسارة'}: ${formatMoney(Math.abs(asset.currentValue - asset.cost))} (${((asset.currentValue - asset.cost) / asset.cost * 100).toFixed(1)}%)
        </p>
      </div>
      
      <div class="form-group">
        <label class="form-label">القيمة الجديدة *</label>
        <input type="number" class="form-input" id="new-value" value="${asset.currentValue}" required>
      </div>
      
      <div id="update-calc"></div>
      
      <button class="btn btn-primary" onclick="confirmUpdateValue(${assetId})">💾 تحديث</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const input = modal.querySelector('#new-value');
  const calcDiv = modal.querySelector('#update-calc');
  
  input.addEventListener('input', () => {
    const newVal = parseFloat(input.value) || 0;
    const change = newVal - asset.currentValue;
    const changePct = ((change / asset.currentValue) * 100).toFixed(1);
    const totalProfit = newVal - asset.cost;
    const totalProfitPct = ((totalProfit / asset.cost) * 100).toFixed(1);
    
    calcDiv.innerHTML = `
      <div class="calc-card">
        <div class="calc-row">
          <span class="label">القيمة القديمة:</span>
          <span class="value">${formatMoney(asset.currentValue)}</span>
        </div>
        <div class="calc-row">
          <span class="label">القيمة الجديدة:</span>
          <span class="value">${formatMoney(newVal)}</span>
        </div>
        <div style="border-top:2px solid var(--card);margin:10px 0"></div>
        <div class="calc-row">
          <span class="label">التغيير:</span>
          <span class="value ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${formatMoney(change)} (${changePct}%)</span>
        </div>
        <div style="border-top:2px solid var(--card);margin:10px 0"></div>
        <div class="calc-row total">
          <span class="label">الربح الإجمالي:</span>
          <span class="value ${totalProfit >= 0 ? 'positive' : 'negative'}">${totalProfit >= 0 ? '+' : ''}${formatMoney(totalProfit)} (${totalProfitPct}%)</span>
        </div>
      </div>
    `;
  });
  
  input.dispatchEvent(new Event('input'));
}

function confirmUpdateValue(assetId) {
  const newVal = parseFloat(document.getElementById('new-value').value);
  
  if (!newVal || newVal < 0) {
    toast('الرجاء إدخال قيمة صحيحة', 'error');
    return;
  }
  
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  const oldValue = asset.currentValue;
  asset.currentValue = newVal;
  
  if (!asset.valueHistory) asset.valueHistory = [];
  
  asset.valueHistory.push({
    date: today(),
    oldValue: oldValue,
    newValue: newVal,
    change: newVal - oldValue
  });
  
  save();
  document.querySelector('.mo.show').remove();
  renderAll();
  toast('تم تحديث القيمة بنجاح', 'success');
}

// ======================
// عرض سجل قيمة الأصل
// ======================

function showAssetHistory(assetId) {
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  const modal = document.createElement('div');
  modal.className = 'mo show';
  
  let historyHtml = '';
  if (!asset.valueHistory || asset.valueHistory.length === 0) {
    historyHtml = '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">لا يوجد سجل</div></div>';
  } else {
    historyHtml = asset.valueHistory.slice().reverse().map(h => {
      const change = h.change || (h.newValue - h.oldValue);
      return `
        <div class="tx-item">
          <div class="tx-left">
            <div class="tx-icon">📊</div>
            <div class="tx-details">
              <h4>${formatMoney(h.oldValue)} → ${formatMoney(h.newValue)}</h4>
              <div class="tx-meta">${h.date}</div>
            </div>
          </div>
          <div class="tx-amount ${change >= 0 ? 'income' : 'expense'}">${change >= 0 ? '+' : ''}${formatMoney(change)}</div>
        </div>
      `;
    }).join('');
  }
  
  modal.innerHTML = `
    <div class="mo-content">
      <div class="mo-header">
        <div class="mo-title">📜 سجل القيمة</div>
        <button class="mo-close" onclick="this.closest('.mo').remove()">&times;</button>
      </div>
      
      <div style="background:var(--bg2);padding:15px;border-radius:10px;margin-bottom:20px">
        <h3>📦 ${asset.name}</h3>
        <p style="color:var(--text2);margin-top:5px">
          التكلفة: ${formatMoney(asset.cost)}<br>
          القيمة الحالية: ${formatMoney(asset.currentValue)}
        </p>
      </div>
      
      <h3 style="margin:20px 0">📋 التغييرات</h3>
      ${historyHtml}
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ======================
// بيع الأصل
// ======================

function sellAsset(assetId) {
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset || asset.sold) return;
  
  const modal = document.createElement('div');
  modal.className = 'mo show';
  modal.innerHTML = `
    <div class="mo-content">
      <div class="mo-header">
        <div class="mo-title">💰 بيع الأصل</div>
        <button class="mo-close" onclick="this.closest('.mo').remove()">&times;</button>
      </div>
      
      <div style="background:var(--bg2);padding:15px;border-radius:10px;margin-bottom:20px">
        <h3>📦 ${asset.name}</h3>
        <p style="color:var(--text2);margin-top:5px">
          الكمية المتاحة: ${asset.quantity}<br>
          متوسط التكلفة: ${formatMoney(asset.cost / asset.quantity)} / وحدة<br>
          التكلفة الإجمالية: ${formatMoney(asset.cost)}<br>
          القيمة الحالية: ${formatMoney(asset.currentValue)}
        </p>
      </div>
      
      <div class="form-group">
        <label class="form-label">الكمية المباعة *</label>
        <input type="number" class="form-input" id="sell-quantity" value="${asset.quantity}" max="${asset.quantity}" step="0.01" required>
        <div style="font-size:12px;color:var(--text2);margin-top:5px">الحد الأقصى: ${asset.quantity}</div>
      </div>
      
      <div class="form-group">
        <label class="form-label">سعر البيع الإجمالي *</label>
        <input type="number" class="form-input" id="sell-price" value="${asset.currentValue}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">تاريخ البيع</label>
        <input type="date" class="form-input" id="sell-date" value="${today()}">
      </div>
      
      <div id="sell-calc"></div>
      
      <button class="btn btn-primary" onclick="confirmSellAsset(${assetId})">💰 تأكيد البيع</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const quantityInput = modal.querySelector('#sell-quantity');
  const priceInput = modal.querySelector('#sell-price');
  const calcDiv = modal.querySelector('#sell-calc');
  
  function updateCalc() {
    const sellQuantity = parseFloat(quantityInput.value) || 0;
    const sellPrice = parseFloat(priceInput.value) || 0;
    
    if (sellQuantity > asset.quantity) {
      quantityInput.value = asset.quantity;
      return;
    }
    
    const costPerUnit = asset.cost / asset.quantity;
    const sellCost = costPerUnit * sellQuantity;
    const profit = sellPrice - sellCost;
    const profitPct = ((profit / sellCost) * 100).toFixed(1);
    const pricePerUnit = sellPrice / sellQuantity;
    
    const isPartial = sellQuantity < asset.quantity;
    
    calcDiv.innerHTML = `
      <div class="calc-card">
        <div class="calc-row">
          <span class="label">سعر الوحدة:</span>
          <span class="value">${formatMoney(pricePerUnit)}</span>
        </div>
        <div class="calc-row">
          <span class="label">تكلفة الكمية المباعة:</span>
          <span class="value">${formatMoney(sellCost)}</span>
        </div>
        <div class="calc-row">
          <span class="label">سعر البيع:</span>
          <span class="value">${formatMoney(sellPrice)}</span>
        </div>
        <div class="calc-row total">
          <span class="label">${profit >= 0 ? 'الربح' : 'الخسارة'}:</span>
          <span class="value ${profit >= 0 ? 'positive' : 'negative'}">${profit >= 0 ? '+' : ''}${formatMoney(profit)} (${profitPct}%)</span>
        </div>
        ${isPartial ? `
          <div style="border-top:2px solid var(--card);margin-top:10px;padding-top:10px">
            <div style="font-size:13px;color:var(--gold)">⚠️ بيع جزئي</div>
            <div style="font-size:12px;color:var(--text2);margin-top:5px">
              سيتبقى: ${asset.quantity - sellQuantity} بتكلفة ${formatMoney(asset.cost - sellCost)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  quantityInput.addEventListener('input', updateCalc);
  priceInput.addEventListener('input', updateCalc);
  updateCalc();
}

function confirmSellAsset(assetId) {
  const sellQuantity = parseFloat(document.getElementById('sell-quantity').value);
  const sellPrice = parseFloat(document.getElementById('sell-price').value);
  const sellDate = document.getElementById('sell-date').value;
  
  if (!sellQuantity || sellQuantity <= 0) {
    toast('الرجاء إدخال كمية صحيحة', 'error');
    return;
  }
  
  if (!sellPrice || sellPrice < 0) {
    toast('الرجاء إدخال سعر صحيح', 'error');
    return;
  }
  
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  if (sellQuantity > asset.quantity) {
    toast('الكمية المباعة أكبر من المتاح!', 'error');
    return;
  }
  
  const costPerUnit = asset.cost / asset.quantity;
  const sellCost = costPerUnit * sellQuantity;
  const profit = sellPrice - sellCost;
  
  const isFullSale = sellQuantity >= asset.quantity;
  
  if (isFullSale) {
    // بيع كامل
    asset.sold = true;
    asset.soldPrice = sellPrice;
    asset.soldDate = sellDate;
    asset.soldProfit = profit;
  } else {
    // بيع جزئي
    asset.quantity -= sellQuantity;
    asset.cost -= sellCost;
    
    // تسجيل البيع في التاريخ
    if (!asset.salesHistory) asset.salesHistory = [];
    asset.salesHistory.push({
      date: sellDate,
      quantity: sellQuantity,
      price: sellPrice,
      cost: sellCost,
      profit: profit
    });
    
    // تحديث القيمة الحالية بنسبة
    const remainingRatio = asset.quantity / (asset.quantity + sellQuantity);
    asset.currentValue = asset.currentValue * remainingRatio;
  }
  
  // تسجيل دخل من البيع
  APP.txs.push({
    id: Date.now(),
    type: 'income',
    amount: sellPrice,
    source: 'بيع أصل',
    description: `بيع ${isFullSale ? '' : 'جزء من '}${asset.name} (${sellQuantity})`,
    date: sellDate,
    category: 'income'
  });
  
  save();
  document.querySelector('.mo.show').remove();
  renderAll();
  
  const profitMsg = profit >= 0 ? 
    `🎉 ربح ${formatMoney(profit)}` : 
    `خسارة ${formatMoney(Math.abs(profit))}`;
  
  toast(`تم البيع بنجاح - ${profitMsg}`, 'success');
}

// ======================
// تصدير/استيراد البيانات
// ======================

function exportData() {
  const data = JSON.stringify(APP, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mahfazaty-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  // حفظ تاريخ آخر نسخة احتياطية
  localStorage.setItem('mahfazaty_last_backup', new Date().toISOString());
  
  toast('تم تصدير البيانات بنجاح', 'success');
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
        
        // التحقق من صحة البيانات
        if (!data.txs || !data.goals || !data.assets || !data.people) {
          toast('ملف غير صحيح', 'error');
          return;
        }
        
        Object.assign(APP, data);
        save();
        renderAll();
        toast('تم استيراد البيانات بنجاح! ✅', 'success');
      } catch (err) {
        toast('خطأ في قراءة الملف', 'error');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function resetData() {
  if (confirm('⚠️ هل أنت متأكد من مسح كل البيانات؟\n\nلا يمكن التراجع عن هذا الإجراء!')) {
    if (confirm('🚨 تأكيد نهائي: سيتم مسح كل شيء!\n\nهل أنت متأكد 100%؟')) {
      localStorage.removeItem('mahfazaty_data');
      toast('تم مسح البيانات', 'info');
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  }
}

// ======================
// حفظ الإعدادات
// ======================

function saveSettings() {
  APP.gasUrl = document.getElementById('settings-gas').value;
  save();
  toast('تم حفظ الإعدادات', 'success');
}

// ======================
// إدارة الميزانية
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
  
  APP.settings.budget = {
    essential,
    savings,
    entertainment,
    investment
  };
  
  save();
  renderBudgetPage();
  renderDashboard();
  toast('تم حفظ الميزانية بنجاح ✅', 'success');
}

// ======================
// فلترة الأقسام الفرعية
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
  toast('تم إضافة القسم الفرعي بنجاح ✅', 'success');
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
// Google Sheets Sync
// ======================

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

// ======================
// تهيئة عند التحميل
// ======================

window.addEventListener('load', () => {
  const hasData = localStorage.getItem('mahfazaty_data');
  if (hasData) {
    // التحميل التلقائي إذا كان هناك بيانات محفوظة
    console.log('✅ تم العثور على بيانات محفوظة');
  } else {
    console.log('ℹ️ لا توجد بيانات محفوظة - انتظار بدء التطبيق');
  }
});

console.log('✅ features.js loaded (complete)');

// ======================
// تسجيل عوائد/أرباح من الأصل
// ======================

function recordDividend(assetId) {
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset || asset.sold) return;
  
  const modal = document.createElement('div');
  modal.className = 'mo show';
  modal.innerHTML = `
    <div class="mo-content">
      <div class="mo-header">
        <div class="mo-title">💰 تسجيل عائد</div>
        <button class="mo-close" onclick="this.closest('.mo').remove()">&times;</button>
      </div>
      
      <div style="background:var(--bg2);padding:15px;border-radius:10px;margin-bottom:20px">
        <h3>📦 ${asset.name}</h3>
        <p style="color:var(--text2);margin-top:5px">
          الكمية الحالية: ${asset.quantity}
        </p>
      </div>
      
      <div class="form-group">
        <label class="form-label">نوع العائد</label>
        <select class="form-select" id="dividend-type" onchange="toggleDividendFields()">
          <option value="cash">💵 عائد نقدي</option>
          <option value="stock">📈 أسهم مجانية</option>
        </select>
      </div>
      
      <div id="dividend-cash-fields">
        <div class="form-group">
          <label class="form-label">المبلغ النقدي *</label>
          <input type="number" class="form-input" id="dividend-amount" required>
        </div>
      </div>
      
      <div id="dividend-stock-fields" style="display:none">
        <div class="form-group">
          <label class="form-label">عدد الأسهم المجانية *</label>
          <input type="number" class="form-input" id="dividend-quantity" step="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">القيمة السوقية للسهم (اختياري)</label>
          <input type="number" class="form-input" id="dividend-market-value">
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">التاريخ</label>
        <input type="date" class="form-input" id="dividend-date" value="${today()}">
      </div>
      
      <div class="form-group">
        <label class="form-label">ملاحظات</label>
        <textarea class="form-textarea" id="dividend-notes"></textarea>
      </div>
      
      <button class="btn btn-primary" onclick="confirmRecordDividend(${assetId})">💾 تسجيل</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function toggleDividendFields() {
  const type = document.getElementById('dividend-type').value;
  const cashFields = document.getElementById('dividend-cash-fields');
  const stockFields = document.getElementById('dividend-stock-fields');
  
  if (type === 'cash') {
    cashFields.style.display = 'block';
    stockFields.style.display = 'none';
  } else {
    cashFields.style.display = 'none';
    stockFields.style.display = 'block';
  }
}

function confirmRecordDividend(assetId) {
  const asset = APP.assets.find(a => a.id === assetId);
  if (!asset) return;
  
  const type = document.getElementById('dividend-type').value;
  const date = document.getElementById('dividend-date').value;
  const notes = document.getElementById('dividend-notes').value;
  
  if (!asset.dividends) asset.dividends = [];
  
  if (type === 'cash') {
    const amount = parseFloat(document.getElementById('dividend-amount').value);
    
    if (!amount || amount <= 0) {
      toast('الرجاء إدخال مبلغ صحيح', 'error');
      return;
    }
    
    asset.dividends.push({
      id: Date.now(),
      type: 'cash',
      amount: amount,
      date: date,
      notes: notes
    });
    
    APP.txs.push({
      id: Date.now(),
      type: 'income',
      amount: amount,
      source: 'عائد استثماري',
      description: `عائد نقدي من ${asset.name}${notes ? ' - ' + notes : ''}`,
      date: date,
      category: 'income'
    });
    
    toast(`تم تسجيل عائد نقدي: ${formatMoney(amount)}`, 'success');
    
  } else {
    const quantity = parseFloat(document.getElementById('dividend-quantity').value);
    const marketValue = parseFloat(document.getElementById('dividend-market-value').value) || 0;
    
    if (!quantity || quantity <= 0) {
      toast('الرجاء إدخال عدد الأسهم', 'error');
      return;
    }
    
    asset.dividends.push({
      id: Date.now(),
      type: 'stock',
      quantity: quantity,
      marketValue: marketValue,
      date: date,
      notes: notes
    });
    
    asset.quantity += quantity;
    
    if (marketValue > 0) {
      asset.currentValue += (quantity * marketValue);
    }
    
    toast(`تم تسجيل ${quantity} أسهم مجانية`, 'success');
  }
  
  save();
  document.querySelector('.mo.show').remove();
  renderAll();
}

console.log('✅ features.js - dividend functions loaded');
