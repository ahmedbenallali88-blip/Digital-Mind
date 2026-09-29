const content=document.getElementById('content'),toast=document.getElementById('toast');
let page=localStorage.dmPage||'home';
let messages=JSON.parse(localStorage.dmMessages||'[]');
let projects=JSON.parse(localStorage.dmProjects||'[]');
let tasks=JSON.parse(localStorage.dmTasks||'[]');
const API_URL=()=>String(localStorage.dmApiUrl||'').replace(/\\/$/,'');

const save=()=>{localStorage.dmMessages=JSON.stringify(messages);localStorage.dmProjects=JSON.stringify(projects);localStorage.dmTasks=JSON.stringify(tasks)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toastMsg(s){toast.textContent=s;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
function render(){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  if(page==='home')home(); if(page==='mind')mind(); if(page==='projects')projectsPage(); if(page==='account')account();
}
function home(){
content.innerHTML=`
<section class="hero">
<p>مرحباً بك 👋</p>
<h1>ماذا تريد أن تنجز اليوم؟</h1>
<p class="sub">العقل الرقمي يحوّل فكرتك إلى خطوات قابلة للتنفيذ.</p>
<button class="execute" id="execute">⚡ نفّذها لي</button>
<div class="chatbox"><textarea id="prompt" placeholder="مثال: غداً عندي اجتماع، حضّر لي كل شيء..."></textarea><button class="send" id="send">➤</button></div>
<div class="tools"><button id="voice">🎤 صوت</button><button id="fileBtn">📎 ملف</button><button id="camera">📷 كاميرا</button></div>
<input id="file" type="file" hidden><input id="cameraFile" type="file" accept="image/*" capture="environment" hidden>
<h3>الوصول السريع</h3>
<div class="grid">
<button data-a="بحث">🌐<small>بحث</small></button><button data-a="ملفات">📄<small>ملفات</small></button>
<button data-a="تعلم">🎓<small>تعلم</small></button><button data-a="إنشاء">🎨<small>إنشاء</small></button>
<button data-a="خطط">📅<small>خطط</small></button><button data-a="عمل">💼<small>عمل</small></button>
<button data-a="سفر">✈️<small>سفر</small></button><button data-a="مالي">💰<small>مالي</small></button>
</div>
<div class="mini"><b>⚡ جرّب الآن</b><span>«نظّم لي يومي غداً»</span><span>«حضّر لي سيرة ذاتية»</span><span>«أنشئ لي خطة مشروع»</span></div>
</section>`;
document.getElementById('send').onclick=send;
document.getElementById('execute').onclick=send;
document.getElementById('prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}};
document.getElementById('voice').onclick=voice;
document.getElementById('fileBtn').onclick=()=>document.getElementById('file').click();
document.getElementById('file').onchange=e=>fileRead(e.target.files[0]);
document.getElementById('camera').onclick=()=>camera();
document.getElementById('cameraFile').onchange=e=>fileRead(e.target.files[0]);
document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>quick(b.dataset.a));
document.querySelectorAll('.mini span').forEach(s=>s.onclick=()=>{document.getElementById('prompt').value=s.textContent.replace(/[«»]/g,'');send()});
}
function send(){
let x=document.getElementById('prompt').value.trim(); if(!x){toastMsg('اكتب ما تريد وسأنفذه معك.');return}
messages.push({r:'u',t:x});
save();page='mind';render();
if(API_URL()) return askApi(x); const result=executeRequest(x); messages.push({r:'b',t:result.text}); if(result.tasks?.length){tasks.push(...result.tasks);tasks=tasks.slice(-50)} save(); render();
}
async function askApi(x){
  try{
    const history=messages.slice(-12).map(m=>({role:m.r==='u'?'user':'assistant',content:m.t}));
    const r=await fetch(API_URL()+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:x,history})});
    const data=await r.json(); if(!r.ok) throw new Error(data.error||'API error');
    messages.push({r:'b',t:data.reply||'لا توجد إجابة'}); save(); render();
  }catch(e){messages.push({r:'b',t:'تعذر الاتصال بالعقل السحابي. تحقق من رابط API أو الاتصال بالإنترنت.'});save();render()}
}
function executeRequest(x){
const low=x.toLowerCase();
if(/سلام|مرحبا|اهلا|السلام عليكم/.test(x))return{text:'مرحباً بك 👋 أنا العقل الرقمي. اكتب هدفك وسأحوّله إلى خطوات.'};
if(/نظم|نظّم|يومي|يومى|جدول يوم/.test(x)){
const ts=[{title:'تحديد أهم 3 أولويات',done:false},{title:'إنجاز المهمة الأهم أولاً',done:false},{title:'مراجعة ما تم إنجازه',done:false}];
return{text:'⚡ جهزت لك خطة يومية:\n\n1. حدد أهم 3 أولويات.\n2. ابدأ بالأهم دون تشتيت.\n3. خصص وقتاً للمهمات الصغيرة.\n4. راجع يومك في المساء.\n\nتمت إضافة 3 مهام إلى قائمة المهام.',tasks:ts};
}
if(/اجتماع|meeting/.test(low)){
return{text:'⚡ حضّرت لك الاجتماع:\n\n1. حدد الهدف والنتيجة المطلوبة.\n2. جهّز جدول الأعمال والنقاط الرئيسية.\n3. حضّر الأسئلة والوثائق اللازمة.\n4. سجّل القرارات والمهام أثناء الاجتماع.\n5. أرسل ملخصاً بعد الاجتماع.\n\nتمت إضافة الخطوات إلى قائمة المهام.',tasks:[{title:'تحديد هدف الاجتماع',done:false},{title:'إعداد جدول الأعمال',done:false},{title:'تحضير الوثائق والأسئلة',done:false},{title:'كتابة القرارات والمهام',done:false},{title:'إرسال ملخص الاجتماع',done:false}]};
}
if(/سيرة|cv|resume/.test(low))return{text:'📄 أستطيع تجهيز سيرة ذاتية. أرسل لي: الاسم، الهاتف، البريد، الدراسة، الخبرة، المهارات واللغات، وسأرتبها لك في صيغة احترافية.'};
if(/مشروع|business|مشروع جديد/.test(low))return{text:'🚀 حوّلت طلبك إلى بداية مشروع:\n\n• الهدف\n• الفئة المستهدفة\n• المزايا الأساسية\n• خطة التنفيذ\n• مصادر الدخل\n• الخطوة الأولى\n\nاكتب لي نوع المشروع وسأبني الخطة بالتفصيل.'};
if(/احسب|حساب|\d+\s*[+\-*/×÷]\s*\d+/.test(low)){
const expr=x.replace(/[^0-9+\-*/().×÷]/g,'').replaceAll('×','*').replaceAll('÷','/');
try{if(expr&&/^[0-9+\-*/(). ]+$/.test(expr)){const v=Function('return ('+expr+')')();return{text:'🧮 النتيجة: '+v}}}catch(e){}
}
if(/بحث/.test(low))return{text:'🌐 البحث الخارجي غير مربوط بعد. لكن طلب البحث محفوظ هنا. عند ربط محرك البحث الآمن سأحوّله إلى نتائج حقيقية.'};
return{text:'🧠 فهمت طلبك: «'+x+'»\n\n⚡ حوّلته إلى خطوة عمل وحفظته في المحادثة. للذكاء الاصطناعي السحابي الحقيقي سنربط Backend آمن، ولن نضع أي مفتاح سري داخل التطبيق.'};
}
function mind(){
content.innerHTML='<h2>🧠 العقل</h2><div class="taskBox"><b>⚡ المهام</b>'+(tasks.length?tasks.slice(-8).reverse().map((t,i)=>'<label class="task"><input type="checkbox" '+(t.done?'checked':'')+' data-task="'+(tasks.length-1-i)+'"><span>'+esc(t.title)+'</span></label>').join(''):'<p class="muted">لا توجد مهام بعد.</p>')+'</div><div class="chat">'+(messages.length?messages.map(m=>'<div class="msg '+(m.r==='u'?'user':'bot')+'">'+esc(m.t)+'</div>').join(''):'<div class="empty">لا توجد محادثة بعد.</div>')+'</div><button class="list" id="clear">مسح المحادثة</button>';
document.querySelectorAll('[data-task]').forEach(c=>c.onchange=()=>{tasks[+c.dataset.task].done=c.checked;save();render()});
document.getElementById('clear').onclick=()=>{messages=[];save();render()};
}
function projectsPage(){
content.innerHTML='<h2>📁 المشاريع</h2><button class="list" id="new">＋ مشروع جديد</button><div class="cards">'+(projects.map((p,i)=>'<div class="card"><b>'+esc(p)+'</b><br><span class="muted">محفوظ على الهاتف</span><br><button data-d="'+i+'">حذف</button></div>').join('')||'<div class="empty">لا توجد مشاريع.</div>')+'</div>';
document.getElementById('new').onclick=()=>{let n=prompt('اسم المشروع؟');if(n){projects.push(n.trim());save();render()}};
document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{projects.splice(+b.dataset.d,1);save();render()});
}
function account(){
content.innerHTML='<h2>♙ حسابي</h2><div class="cards"><div class="card"><b>العقل الرقمي</b><p class="muted">نسخة تعمل محلياً وتحفظ بياناتك على الهاتف.</p></div><button class="list" id="about">ℹ️ حول التطبيق</button><button class="list" id="reset">🗑️ حذف البيانات</button></div>';
document.getElementById('about').onclick=()=>toastMsg('العقل الرقمي — كل ما تحتاجه، في عقل واحد.');
document.getElementById('reset').onclick=()=>{if(confirm('حذف كل البيانات؟')){localStorage.clear();messages=[];projects=[];tasks=[];page='home';toastMsg('تم حذف البيانات');render()}};
}
function quick(a){
const examples={بحث:'ابحث لي عن معلومات حول ',ملفات:'حلّل لي هذا الملف',تعلم:'علّمني ',إنشاء:'أنشئ لي ',خطط:'نظّم لي ',عمل:'جهّز لي ',سفر:'خطط لي رحلة إلى ',مالي:'احسب لي '};
const el=document.getElementById('prompt');el.value=examples[a]||a;el.focus();toastMsg('أكمل طلبك ثم اضغط ➤');
}
function voice(){
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!SR)return toastMsg('التعرف على الصوت غير متاح هنا. يمكنك الكتابة.');
const r=new SR();r.lang='ar-MA';r.interimResults=false;
r.onstart=()=>toastMsg('تحدث الآن 🎤');r.onresult=e=>{document.getElementById('prompt').value=e.results[0][0].transcript;toastMsg('تم تحويل صوتك إلى نص')};r.onerror=()=>toastMsg('تعذر تشغيل الميكروفون');r.start();
}
async function camera(){
try{
if(!navigator.mediaDevices?.getUserMedia)throw new Error('no camera');
const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
const m=document.createElement('div');m.className='modal';
m.innerHTML='<div class="sheet"><h3>📷 الكاميرا</h3><video id="cam" autoplay playsinline style="width:100%;border-radius:15px"></video><br><button id="snap">التقاط</button> <button id="close">إغلاق</button></div>';
document.body.appendChild(m);document.getElementById('cam').srcObject=s;
document.getElementById('close').onclick=()=>{s.getTracks().forEach(t=>t.stop());m.remove()};
document.getElementById('snap').onclick=()=>{toastMsg('تم التقاط الصورة. يمكن ربط تحليلها بالذكاء الاصطناعي لاحقاً.');s.getTracks().forEach(t=>t.stop());m.remove()};
}catch(e){toastMsg('تعذر فتح الكاميرا. جرّب زر الملف لاختيار صورة.');setTimeout(()=>document.getElementById('cameraFile')?.click(),700)}
}
async function fileRead(f){
if(!f)return;
let t='📎 الملف: '+f.name+' ('+Math.max(1,Math.round(f.size/1024))+' KB)';
if(f.type.startsWith('text/')||/\.(json|csv|txt|md)$/i.test(f.name))t+='\n\n'+(await f.text()).slice(0,6000);
messages.push({r:'u',t},{r:'b',t:'تم استلام الملف وحفظ معلوماته. قراءة النصوص متاحة الآن؛ تحليل PDF/DOCX/XLSX والصور يحتاج محرك ملفات/رؤية إضافياً.'});
save();page='mind';render();
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{page=b.dataset.page;localStorage.dmPage=page;render()});
document.getElementById('notifyBtn').onclick=()=>toastMsg('لا توجد إشعارات جديدة');
document.getElementById('menuBtn').onclick=()=>toastMsg('استعمل القائمة السفلية للتنقل');
render();