/* 💰 محفظتي v5 - نظام المزامنة التلقائية */

// ======================
// إعدادات المزامنة - يدوية فقط
// ======================

const SYNC_CONFIG = {
  autoSyncEnabled: false,          // ❌ تعطيل المزامنة التلقائية نهائياً
  syncOnChange: false,             // ❌ لا مزامنة تلقائية عند التعديل
  syncOnLoad: false,               // ❌ لا مزامنة تلقائية عند الفتح
  showSyncStatus: true,            // ✅ إظهار حالة المزامنة
  manualOnly: true                 // ✅ يدوية فقط عبر الأزرار
};

let isSyncing = false;
let lastSyncTime = null;

// ======================
// المزامنة - معطلة تلقائياً
// ======================

function smartSync() {
  // ❌ معطلة - لا مزامنة تلقائية
  return;
}

// ======================
// رفع يدوي للسحابة
// ======================

async function manualUpload() {
  if (!APP.gasUrl || APP.gasUrl.trim() === '') {
    toast('الرجاء ربط Google Sheets أولاً', 'error');
    return;
  }
  
  if (isSyncing) {
    toast('عملية جارية...', 'info');
    return;
  }
  
  isSyncing = true;
  updateSyncStatus('syncing');
  
  try {
    await uploadToGoogleSheets();
    
    lastSyncTime = new Date();
    localStorage.setItem('mahfazaty_last_sync', lastSyncTime.toISOString());
    
    updateSyncStatus('success');
    toast('✅ تم رفع البيانات بنجاح', 'success');
    console.log(`✅ تم الرفع في ${lastSyncTime.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ فشل الرفع:', error);
    updateSyncStatus('error');
    toast('❌ فشل الرفع - تحقق من الاتصال', 'error');
  } finally {
    isSyncing = false;
  }
}

// ======================
// مزامنة كاملة يدوية (رفع + تحميل)
// ======================

async function performSync(source = 'manual') {
  if (!APP.gasUrl || APP.gasUrl.trim() === '') {
    toast('الرجاء ربط Google Sheets أولاً', 'error');
    return;
  }
  
  if (isSyncing) {
    toast('عملية جارية...', 'info');
    return;
  }
  
  const confirmMsg = source === 'manual' ? 
    'هل تريد المزامنة الكاملة؟\n\n⚠️ سيتم:\n• رفع بياناتك المحلية\n• تحميل البيانات من السحابة\n• دمج البيانات' :
    null;
  
  if (source === 'manual' && !confirm(confirmMsg)) {
    return;
  }
  
  isSyncing = true;
  updateSyncStatus('syncing');
  
  try {
    // 1️⃣ رفع البيانات المحلية أولاً
    toast('📤 جاري رفع البيانات...', 'info');
    await uploadToGoogleSheets();
    
    // انتظار قصير لضمان الحفظ
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2️⃣ تحميل أحدث البيانات
    toast('📥 جاري تحميل البيانات...', 'info');
    await downloadFromGoogleSheets();
    
    lastSyncTime = new Date();
    localStorage.setItem('mahfazaty_last_sync', lastSyncTime.toISOString());
    
    updateSyncStatus('success');
    renderAll();
    toast('✅ تمت المزامنة بنجاح!', 'success');
    console.log(`✅ مزامنة كاملة في ${lastSyncTime.toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ فشلت المزامنة:', error);
    updateSyncStatus('error');
    toast('❌ فشلت المزامنة - تحقق من الاتصال', 'error');
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
// تحميل من السحابة (استبدال كامل)
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
      // ✅ استبدال كامل بدون دمج (تجنب التعارضات)
      APP.txs = cloudData.txs || [];
      APP.goals = cloudData.goals || [];
      APP.assets = cloudData.assets || [];
      APP.people = cloudData.people || [];
      
      if (cloudData.settings) {
        APP.settings = Object.assign(APP.settings, cloudData.settings);
      }
      
      // حفظ محلياً
      localStorage.setItem('mahfazaty_data', JSON.stringify(APP));
      
      console.log('📥 تم تحميل البيانات (استبدال كامل)');
    } else {
      console.log('⚠️ لا توجد بيانات في Google Sheets');
    }
  } catch (error) {
    console.error('❌ تعذر تحميل البيانات:', error);
    throw error;
  }
}

// ======================
// بدء/إيقاف المزامنة (معطلة)
// ======================

function startAutoSync() {
  // ❌ المزامنة التلقائية معطلة
  console.log('ℹ️ المزامنة اليدوية فقط - استخدم الأزرار في الإعدادات');
}

function stopAutoSync() {
  // لا شيء - معطلة أصلاً
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
// بدء المزامنة التلقائية
// ======================

function startAutoSync() {
  if (!SYNC_CONFIG.autoSyncEnabled) return;
  
  console.log('🚀 بدء المزامنة الذكية...');
  
  // مزامنة كاملة عند التحميل (مرة واحدة فقط)
  if (SYNC_CONFIG.syncOnLoad) {
    setTimeout(() => {
      performSync('initial');
    }, 2000);
  }
  
  // ✅ بدء التحقق الذكي
  startSmartChecking();
  
  console.log('✅ المزامنة التلقائية تعمل:');
  console.log('   - رفع فوري عند التغيير');
  console.log('   - تحميل عند الفتح');
  console.log('   - تحقق كل 30 ثانية (نشط) / 5 دقائق (خامل)');
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
  
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
  
  console.log('⏸️ تم إيقاف المزامنة التلقائية');
}

// ======================
// التحقق الذكي حسب حالة التبويب
// ======================

function startSmartChecking() {
  // إيقاف أي timer موجود
  if (checkTimer) {
    clearInterval(checkTimer);
  }
  
  // بدء التحقق حسب الحالة
  const interval = isTabActive ? SYNC_CONFIG.checkIntervalActive : SYNC_CONFIG.checkIntervalIdle;
  
  checkTimer = setInterval(() => {
    checkForUpdates();
  }, interval);
  
  console.log(`🔄 التحقق كل ${interval / 1000} ثانية (${isTabActive ? 'نشط' : 'خامل'})`);
}

// ======================
// Visibility API - مراقبة حالة التبويب
// ======================

document.addEventListener('visibilitychange', () => {
  const wasActive = isTabActive;
  isTabActive = !document.hidden;
  
  if (isTabActive && !wasActive) {
    // ✅ عودة للتبويب - مزامنة فورية!
    console.log('👁️ عدت للتبويب - مزامنة فورية...');
    performSync('tab-visible');
    
    // تغيير التحقق لـ 30 ثانية
    startSmartChecking();
  } else if (!isTabActive && wasActive) {
    // التبويب أصبح خامل - تبطيء التحقق
    console.log('😴 التبويب خامل - تبطيء المزامنة...');
    startSmartChecking();
  }
});

// عند التركيز على النافذة
window.addEventListener('focus', () => {
  if (isTabActive) {
    console.log('🎯 تركيز على النافذة - تحقق من التحديثات...');
    checkForUpdates();
  }
});

// ======================
// التحقق الخفيف من التحديثات
// ======================

async function checkForUpdates() {
  // تحقق خفيف جداً - فقط مقارنة timestamp
  if (!APP.gasUrl || APP.gasUrl.trim() === '' || isSyncing) {
    return;
  }
  
  try {
    // طلب خفيف جداً - فقط timestamp
    const response = await fetch(APP.gasUrl + '?action=check', {
      method: 'GET',
      mode: 'cors'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.timestamp) {
        const cloudTime = new Date(data.timestamp);
        const localTime = lastLocalChange || lastSyncTime || new Date(0);
        
        // إذا كانت السحابة أحدث، حمّل التحديثات
        if (cloudTime > localTime) {
          console.log('📥 وُجدت تحديثات من جهاز آخر');
          await downloadFromGoogleSheets();
          renderAll();
        }
      }
    }
  } catch (error) {
    // فشل صامت - لا مشكلة
    console.debug('تعذر التحقق من التحديثات:', error);
  }
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

// ======================
// حالة المزامنة في الواجهة
// ======================

function updateSyncStatus(status) {
  const statusDiv = document.getElementById('sync-status');
  if (!statusDiv) return;
  
  const icons = {
    syncing: '🔄',
    success: '✅',
    error: '❌',
    idle: '💾'
  };
  
  const messages = {
    syncing: 'جاري المزامنة...',
    success: 'تمت المزامنة',
    error: 'فشلت المزامنة',
    idle: 'يدوي'
  };
  
  statusDiv.innerHTML = `${icons[status]} ${messages[status]}`;
  
  if (status === 'success' || status === 'error') {
    setTimeout(() => {
      statusDiv.innerHTML = `${icons.idle} ${messages.idle}`;
    }, 3000);
  }
}

console.log('✅ نظام المزامنة اليدوية جاهز');
