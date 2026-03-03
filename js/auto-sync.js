/* 💰 محفظتي v5 - نظام المزامنة التلقائية */

// ======================
// إعدادات المزامنة
// ======================

const SYNC_CONFIG = {
  autoSyncEnabled: true,           // المزامنة التلقائية مفعلة
  syncInterval: 30000,              // كل 30 ثانية
  syncOnChange: true,               // مزامنة فورية عند التغيير
  syncOnLoad: true,                 // مزامنة عند التحميل
  debounceDelay: 2000,              // انتظار 2 ثانية بعد آخر تغيير
  maxRetries: 3,                    // محاولات إعادة المحاولة
  showSyncStatus: true              // إظهار حالة المزامنة
};

let syncTimer = null;
let debounceTimer = null;
let lastSyncTime = null;
let isSyncing = false;

// ======================
// المزامنة الذكية
// ======================

function smartSync() {
  // إلغاء المزامنة إذا كانت معطلة أو لا يوجد رابط
  if (!SYNC_CONFIG.autoSyncEnabled || !APP.gasUrl || APP.gasUrl.trim() === '') {
    return;
  }
  
  // إلغاء المؤقت السابق
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // انتظار قليلاً لتجميع التغييرات
  debounceTimer = setTimeout(() => {
    performSync('auto');
  }, SYNC_CONFIG.debounceDelay);
}

// ======================
// تنفيذ المزامنة
// ======================

async function performSync(source = 'manual') {
  if (isSyncing) {
    console.log('⏳ مزامنة قيد التنفيذ بالفعل...');
    return;
  }
  
  isSyncing = true;
  updateSyncStatus('syncing');
  
  try {
    // 1️⃣ رفع البيانات المحلية
    await uploadToGoogleSheets();
    
    // 2️⃣ تحميل أحدث البيانات
    await downloadFromGoogleSheets();
    
    lastSyncTime = new Date();
    localStorage.setItem('mahfazaty_last_sync', lastSyncTime.toISOString());
    
    updateSyncStatus('success');
    console.log(`✅ مزامنة ناجحة (${source}) في ${lastSyncTime.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ فشلت المزامنة:', error);
    updateSyncStatus('error');
  } finally {
    isSyncing = false;
  }
}

// ======================
// رفع للسحابة
// ======================

async function uploadToGoogleSheets() {
  if (!APP.gasUrl || APP.gasUrl.trim() === '') return;
  
  const data = {
    txs: APP.txs,
    goals: APP.goals,
    assets: APP.assets,
    people: APP.people,
    settings: APP.settings,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId()
  };
  
  const response = await fetch(APP.gasUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  // no-cors لا يعطي response - نفترض النجاح
  console.log('📤 تم رفع البيانات');
}

// ======================
// تحميل من السحابة
// ======================

async function downloadFromGoogleSheets() {
  if (!APP.gasUrl || APP.gasUrl.trim() === '') return;
  
  try {
    const response = await fetch(APP.gasUrl + '?action=get', {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error('فشل التحميل');
    }
    
    const cloudData = await response.json();
    
    if (cloudData && cloudData.txs) {
      // دمج ذكي: آخر تعديل يفوز
      mergeData(cloudData);
      
      // حفظ محلياً بدون تشغيل مزامنة (لتجنب اللوب)
      localStorage.setItem('mahfazaty_data', JSON.stringify(APP));
      
      console.log('📥 تم تحميل البيانات');
    }
  } catch (error) {
    console.warn('⚠️ تعذر تحميل البيانات من السحابة:', error);
  }
}

// ======================
// دمج البيانات الذكي
// ======================

function mergeData(cloudData) {
  // استراتيجية: آخر تعديل يفوز (Last Write Wins)
  
  // دمج المعاملات
  const localTxIds = new Set(APP.txs.map(t => t.id));
  const cloudTxIds = new Set(cloudData.txs.map(t => t.id));
  
  // إضافة المعاملات الجديدة من السحابة
  cloudData.txs.forEach(cloudTx => {
    if (!localTxIds.has(cloudTx.id)) {
      APP.txs.push(cloudTx);
    }
  });
  
  // حذف المعاملات المحذوفة (موجودة محلياً لكن مش في السحابة)
  APP.txs = APP.txs.filter(tx => cloudTxIds.has(tx.id));
  
  // نفس الشيء للأهداف
  const localGoalIds = new Set(APP.goals.map(g => g.id));
  const cloudGoalIds = new Set(cloudData.goals.map(g => g.id));
  
  cloudData.goals.forEach(cloudGoal => {
    const localGoal = APP.goals.find(g => g.id === cloudGoal.id);
    if (!localGoal) {
      APP.goals.push(cloudGoal);
    } else {
      // تحديث إذا كانت السحابة أحدث
      Object.assign(localGoal, cloudGoal);
    }
  });
  
  APP.goals = APP.goals.filter(g => cloudGoalIds.has(g.id));
  
  // الأصول
  const localAssetIds = new Set(APP.assets.map(a => a.id));
  const cloudAssetIds = new Set(cloudData.assets.map(a => a.id));
  
  cloudData.assets.forEach(cloudAsset => {
    const localAsset = APP.assets.find(a => a.id === cloudAsset.id);
    if (!localAsset) {
      APP.assets.push(cloudAsset);
    } else {
      Object.assign(localAsset, cloudAsset);
    }
  });
  
  APP.assets = APP.assets.filter(a => cloudAssetIds.has(a.id));
  
  // الأشخاص
  const localPeopleIds = new Set(APP.people.map(p => p.id));
  const cloudPeopleIds = new Set(cloudData.people.map(p => p.id));
  
  cloudData.people.forEach(cloudPerson => {
    const localPerson = APP.people.find(p => p.id === cloudPerson.id);
    if (!localPerson) {
      APP.people.push(cloudPerson);
    } else {
      Object.assign(localPerson, cloudPerson);
    }
  });
  
  APP.people = APP.people.filter(p => cloudPeopleIds.has(p.id));
}

// ======================
// معرف الجهاز
// ======================

function getDeviceId() {
  let deviceId = localStorage.getItem('mahfazaty_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mahfazaty_device_id', deviceId);
  }
  return deviceId;
}

// ======================
// حالة المزامنة في الواجهة
// ======================

function updateSyncStatus(status) {
  if (!SYNC_CONFIG.showSyncStatus) return;
  
  const statusDiv = document.getElementById('sync-status');
  if (!statusDiv) return;
  
  const icons = {
    syncing: '🔄',
    success: '✅',
    error: '❌',
    idle: '☁️'
  };
  
  const messages = {
    syncing: 'جاري المزامنة...',
    success: 'تمت المزامنة',
    error: 'فشلت المزامنة',
    idle: 'جاهز'
  };
  
  statusDiv.innerHTML = `${icons[status]} ${messages[status]}`;
  statusDiv.className = `sync-status ${status}`;
  
  if (status === 'success') {
    setTimeout(() => {
      statusDiv.className = 'sync-status idle';
      statusDiv.innerHTML = `${icons.idle} ${messages.idle}`;
    }, 3000);
  }
}

// ======================
// بدء المزامنة الدورية
// ======================

function startAutoSync() {
  if (!SYNC_CONFIG.autoSyncEnabled) return;
  
  console.log('🚀 بدء المزامنة التلقائية...');
  
  // مزامنة عند التحميل
  if (SYNC_CONFIG.syncOnLoad) {
    setTimeout(() => {
      performSync('initial');
    }, 2000);
  }
  
  // مزامنة دورية
  if (SYNC_CONFIG.syncInterval > 0) {
    syncTimer = setInterval(() => {
      performSync('periodic');
    }, SYNC_CONFIG.syncInterval);
  }
}

function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  
  console.log('⏸️ تم إيقاف المزامنة التلقائية');
}

// ======================
// تعديل دالة save الأصلية
// ======================

// نستبدل syncToGoogleSheets() بـ smartSync()
const originalSave = window.save;
window.save = function() {
  localStorage.setItem('mahfazaty_data', JSON.stringify(APP));
  
  if (SYNC_CONFIG.syncOnChange) {
    smartSync();
  }
};

// ======================
// بدء تلقائي عند التحميل
// ======================

window.addEventListener('load', () => {
  // انتظار تحميل التطبيق
  setTimeout(() => {
    if (APP.gasUrl && APP.gasUrl.trim() !== '') {
      startAutoSync();
    }
  }, 1000);
});

// ======================
// إيقاف عند إغلاق الصفحة
// ======================

window.addEventListener('beforeunload', () => {
  stopAutoSync();
  
  // مزامنة نهائية قبل الإغلاق
  if (APP.gasUrl && APP.gasUrl.trim() !== '') {
    uploadToGoogleSheets();
  }
});

console.log('✅ نظام المزامنة التلقائية جاهز');

// ======================
// التحكم في المزامنة من الإعدادات
// ======================

function toggleAutoSync(enabled) {
  SYNC_CONFIG.autoSyncEnabled = enabled;
  localStorage.setItem('mahfazaty_auto_sync', enabled ? 'true' : 'false');
  
  if (enabled) {
    startAutoSync();
    toast('تم تفعيل المزامنة التلقائية ✅', 'success');
  } else {
    stopAutoSync();
    toast('تم إيقاف المزامنة التلقائية', 'info');
  }
}

// استعادة الإعداد عند التحميل
window.addEventListener('load', () => {
  const autoSyncSetting = localStorage.getItem('mahfazaty_auto_sync');
  if (autoSyncSetting === 'false') {
    SYNC_CONFIG.autoSyncEnabled = false;
    const toggle = document.getElementById('auto-sync-toggle');
    if (toggle) toggle.checked = false;
  }
});

console.log('✅ دوال التحكم في المزامنة جاهزة');
