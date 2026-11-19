/* عامل الخدمة — إيقاع */
/* إصدار الكاش: غيّر الرقم عند نشر نسخة جديدة ليتحدّث لدى الجميع */
const VERSION='iqa3-v1.2.0';
const CORE=[
  './',
  './index.html',
  './widget.html',
  './manifest.webmanifest',
  './manifest-widget.webmanifest'
];

/* التثبيت: تخزين هيكل التطبيق والويدجت ثم التفعيل الفوري */
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())
  );
});

/* التفعيل: حذف إصدارات الكاش القديمة والاستلام الفوري للصفحات المفتوحة */
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

/* الجلب:
   - فتح الصفحات: الشبكة أولاً (لآخر تحديث) مع الكاش كاحتياطي دون اتصال —
     وكل صفحة تُخزَّن تحت رابطها الحقيقي كي تبقى التطبيق والويدجت منفصلين
   - باقي الموارد (الخطوط وغيرها): الكاش أولاً للسرعة، وتُخزَّن تلقائياً عند أول نجاح */
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;

  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(r=>{
        const cp=r.clone();
        caches.open(VERSION).then(c=>c.put(e.request,cp)).catch(()=>{});
        return r;
      }).catch(()=>caches.match(e.request).then(h=>h||caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit=>{
      if(hit)return hit;
      return fetch(e.request).then(r=>{
        /* نخزّن الناجح فقط (بما فيه ملفات الخطوط ذات الردود المعتمة) */
        if(r&&(r.status===200||r.type==='opaque')){
          const cp=r.clone();
          caches.open(VERSION).then(c=>c.put(e.request,cp)).catch(()=>{});
        }
        return r;
      }).catch(()=>caches.match('./'));
    })
  );
});
