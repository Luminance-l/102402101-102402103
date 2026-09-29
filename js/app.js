(() => {
  const core = window.LostFoundCore;
  const STORAGE_KEY = 'campus-light-items-v1';
  const CURRENT_OWNER = '102402101';
  const categoryEmoji = { '证件卡片':'💳','数码产品':'🎧','钥匙':'🔑','书本文具':'📚','生活用品':'🧴','其他':'📦' };
  let imageData = '';
  let items = loadItems();

  function loadItems() {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(saved) ? saved : [...window.LOST_FOUND_SEED]; }
    catch { return [...window.LOST_FOUND_SEED]; }
  }
  function saveItems() { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function escapeHtml(value) { const el=document.createElement('div'); el.textContent=String(value ?? ''); return el.innerHTML; }
  function displayTime(value) { return new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value)); }
  function isDone(status) { return ['已找到','已归还'].includes(status); }
  function visual(item, className='item-visual') { return `<div class="${className}">${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">` : categoryEmoji[item.category] || '📦'}</div>`; }
  function card(item) {
    return `<article class="item-card" data-id="${item.id}" tabindex="0" aria-label="查看${escapeHtml(item.name)}详情">${visual(item)}<div class="card-body"><div class="meta-row"><span class="tag">${item.type==='lost'?'寻物':'招领'} · ${escapeHtml(item.category)}</span><span class="status ${isDone(item.status)?'done':''}">${escapeHtml(item.status)}</span></div><h3>${escapeHtml(item.name)}</h3><p>📍 ${escapeHtml(item.location)}</p><p>🕒 ${displayTime(item.time)}</p></div></article>`;
  }
  function currentFilters() { return { keyword:document.querySelector('#keyword').value, type:document.querySelector('#filter-type').value, category:document.querySelector('#filter-category').value, status:document.querySelector('#filter-status').value }; }
  function renderHome() {
    const shown=core.searchItems(items,currentFilters()); const list=document.querySelector('#item-list');
    list.innerHTML=shown.map(card).join(''); document.querySelector('#empty-state').hidden=shown.length>0; document.querySelector('#result-count').textContent=`共 ${shown.length} 条`;
    const s=core.stats(items); document.querySelector('#stat-total').textContent=s.total; document.querySelector('#stat-active').textContent=s.active; document.querySelector('#stat-done').textContent=s.done;
    list.querySelectorAll('.item-card').forEach(el=>{ el.addEventListener('click',()=>showDetail(el.dataset.id)); el.addEventListener('keydown',e=>{if(e.key==='Enter')showDetail(el.dataset.id);}); });
  }
  function renderMine() {
    const mine=items.filter(item=>item.owner===CURRENT_OWNER).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    const list=document.querySelector('#my-list'); document.querySelector('#my-empty').hidden=mine.length>0;
    list.innerHTML=mine.map(item=>`<article class="my-row"><div class="my-icon">${categoryEmoji[item.category]||'📦'}</div><div><div class="meta-row"><h3>${escapeHtml(item.name)}</h3><span class="status ${isDone(item.status)?'done':''}">${escapeHtml(item.status)}</span></div><p>${item.type==='lost'?'寻物':'招领'} · ${escapeHtml(item.location)} · ${displayTime(item.time)}</p></div><div class="my-actions"><select aria-label="更新${escapeHtml(item.name)}状态" data-status-id="${item.id}">${(item.type==='lost'?['寻找中','已找到']:['待认领','已归还']).map(status=>`<option ${status===item.status?'selected':''}>${status}</option>`).join('')}</select><button class="btn ghost" data-detail-id="${item.id}">详情</button><button class="btn ghost" data-delete-id="${item.id}">删除</button></div></article>`).join('');
    list.querySelectorAll('[data-status-id]').forEach(el=>el.addEventListener('change',()=>{ const result=core.updateStatus(items,el.dataset.statusId,el.value); if(result.ok){items=result.items;saveItems();renderAll();toast('状态已更新');} }));
    list.querySelectorAll('[data-detail-id]').forEach(el=>el.addEventListener('click',()=>showDetail(el.dataset.detailId)));
    list.querySelectorAll('[data-delete-id]').forEach(el=>el.addEventListener('click',()=>{ if(confirm('确定删除这条发布记录吗？')){const result=core.deleteItem(items,el.dataset.deleteId);if(result.ok){items=result.items;saveItems();renderAll();toast('记录已删除');}} }));
  }
  function showDetail(id) {
    const item=core.getItem(items,id); if(!item)return;
    document.querySelector('#detail-content').innerHTML=`${visual(item,'detail-hero')}<div class="detail-body"><div class="meta-row"><span class="tag">${item.type==='lost'?'寻物启事':'招领启事'} · ${escapeHtml(item.category)}</span><span class="status ${isDone(item.status)?'done':''}">${escapeHtml(item.status)}</span></div><h2>${escapeHtml(item.name)}</h2><div class="detail-grid"><div><span>地点</span>${escapeHtml(item.location)}</div><div><span>时间</span>${displayTime(item.time)}</div><div><span>发布人</span>${escapeHtml(item.publisher)}</div><div><span>发布时间</span>${displayTime(item.createdAt)}</div></div><p class="detail-description">${escapeHtml(item.description)}</p><div class="contact-box"><div><small>联系方式</small><strong>${escapeHtml(item.contact)}</strong></div><button class="btn primary" id="copy-contact">一键复制</button></div></div>`;
    document.querySelector('#copy-contact').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(item.contact);toast('联系方式已复制');}catch{toast(`请手动复制：${item.contact}`);}});
    document.querySelector('#detail-dialog').showModal();
  }
  function switchPage(name){document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.id===`${name}-page`));document.querySelectorAll('.nav-btn').forEach(el=>el.classList.toggle('active',el.dataset.page===name));if(name==='mine')renderMine();window.scrollTo({top:0,behavior:'smooth'});}
  function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1800);}
  function renderAll(){renderHome();renderMine();}
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>switchPage(btn.dataset.page)));
  document.querySelector('#filter-form').addEventListener('submit',e=>{e.preventDefault();renderHome();});
  document.querySelector('#reset-filter').addEventListener('click',()=>{document.querySelector('#filter-form').reset();renderHome();});
  document.querySelector('#image-input').addEventListener('change',e=>{const file=e.target.files[0];if(!file){imageData='';return;}if(file.size>1024*1024){toast('图片请控制在 1MB 内');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>imageData=reader.result;reader.readAsDataURL(file);});
  document.querySelector('#publish-form').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const raw=Object.fromEntries(form.entries());raw.image=imageData;const result=core.createItem(raw,{owner:CURRENT_OWNER});const error=document.querySelector('#form-error');if(!result.valid){error.textContent=Object.values(result.errors)[0];return;}items=[result.item,...items];saveItems();e.currentTarget.reset();imageData='';error.textContent='';renderAll();switchPage('mine');toast('发布成功');});
  document.querySelector('.dialog-close').addEventListener('click',()=>document.querySelector('#detail-dialog').close());
  document.querySelector('#detail-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
  const params = new URLSearchParams(location.search);
  if (params.get('keyword')) document.querySelector('#keyword').value = params.get('keyword');
  renderAll();
  if (['home','publish','mine'].includes(params.get('page'))) switchPage(params.get('page'));
  if (params.get('detail')) showDetail(params.get('detail'));
})();
