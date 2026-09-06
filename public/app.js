/* ESCAPE — frontend-only deployment build
   No backend/API required. Data, filtering and favorites run in-browser.
*/
const MOODS = [
  {id:'chill',label:'Chill & Slow',desc:'Misty viewpoints, long breakfasts, nowhere to be.',
   icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15h13a3 3 0 100-6 4 4 0 00-7.5-1.5A3.5 3.5 0 004 15z"/><path d="M2 19h20"/></svg>`},
  {id:'wild',label:'Wild & Outdoors',desc:'Trails, treks and something to be slightly out of breath about.',
   icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 20L10 6l4 8 2-3 5 8H3z"/></svg>`},
  {id:'romantic',label:'Romantic Escape',desc:'Two chairs, one view, a slow sunset.',
   icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 16c6 0 4-6 8-6s2 6 8 6"/><circle cx="18" cy="7" r="2.4"/></svg>`},
  {id:'culture',label:'Culture & Food',desc:'Old stones, long tables, stories worth the detour.',
   icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V10M9 21V10M15 21V10M20 21V10M3 10l9-6 9 6M2 21h20"/></svg>`}
];
const DISTANCES = [
  {id:'near',label:'Under 3 hrs'},
  {id:'mid',label:'3–6 hrs'},
  {id:'far',label:'Flight worth it'}
];

const DESTINATIONS = [
 {id:'matheran',mood:'chill',distance:'near',name:'Matheran',tagline:'No cars, no noise — just red mud trails.',stamp:'≈2 hrs from Pune',
  days:[['Sat','Horseback to Panorama Point, sunset at Louisa Point.'],['Sun','Toy train down the hill, market-lane snacking.']],
  season:'Best October to February.',palette:['#8a5a3b','#c8935f','#6b8f5a']},
 {id:'lonavala',mood:'chill',distance:'near',name:'Lonavala & Khandala',tagline:'Misty ghats and waterfall chai stops.',stamp:'≈2 hrs from Pune',
  days:[['Sat','Bhushi Dam splash, Tiger’s Leap viewpoint.'],['Sun','Karla Caves at sunrise, chikki on the drive home.']],
  season:'Best June to September, for the monsoon green.',palette:['#3f6b64','#7fa39a','#c69a2e']},
 {id:'mahabaleshwar',mood:'chill',distance:'mid',name:'Mahabaleshwar & Panchgani',tagline:'Strawberry fields and valley viewpoints.',stamp:'≈5 hrs from Pune',
  days:[['Sat','Venna Lake boating, a strawberry-farm stop.'],['Sun','Sunrise at Arthur’s Seat, Panchgani Table Land.']],
  season:'Best Mar–May and Sep–Nov.',palette:['#4a7a5f','#a7c98f','#c69a2e']},
 {id:'bhandardara',mood:'wild',distance:'near',name:'Bhandardara',tagline:'Star trails over a quiet reservoir.',stamp:'≈3 hrs from Pune',
  days:[['Sat','Trek to Ratangad’s base, evening by Arthur Lake.'],['Sun','Sunrise at Umbrella Falls.']],
  season:'Best August to October.',palette:['#2d4a52','#5c8a83','#c69a2e']},
 {id:'coorg',mood:'wild',distance:'far',name:'Coorg',tagline:'Coffee estates wrapped in morning fog.',stamp:'Flight + ~3 hr drive',
  days:[['Sat','Abbey Falls, a walk through the plantations.'],['Sun','Dubare elephant camp, a foggy dawn viewpoint.']],
  season:'Best October to March.',palette:['#3a5a3f','#6f8f5a','#b5502a']},
 {id:'alibaug',mood:'romantic',distance:'near',name:'Alibaug',tagline:'Beach bungalows a ferry ride away.',stamp:'≈3 hrs from Pune',
  days:[['Sat','Walk to Kolaba Fort at low tide, seafood at sunset.'],['Sun','A slow morning on the sand, home by noon.']],
  season:'Best November to February.',palette:['#c9673f','#e3b873','#3f6b64']},
 {id:'goa',mood:'romantic',distance:'far',name:'Goa, North',tagline:'Warm sand, later sunsets, no itinerary.',stamp:'≈8 hrs road / 1 hr flight',
  days:[['Sat','Anjuna market, sunset at Vagator cliffs.'],['Sun','A slow breakfast, beach lunch before heading home.']],
  season:'Best November to February.',palette:['#b5502a','#e3b873','#2d4a52']},
 {id:'nashik',mood:'culture',distance:'mid',name:'Nashik',tagline:'Vineyard rows and unhurried lunches.',stamp:'≈4.5 hrs from Pune',
  days:[['Sat','Vineyard tour, Godavari ghat walk.'],['Sun','Pandavleni caves, misal for breakfast.']],
  season:'Best October to February.',palette:['#6b3f2d','#c69a2e','#7fa39a']},
 {id:'hampi',mood:'culture',distance:'far',name:'Hampi',tagline:'Boulder-strewn ruins of a lost empire.',stamp:'Flight + ~1.5 hr drive',
  days:[['Sat','Virupaksha Temple, sunset atop Matanga Hill.'],['Sun','Coracle ride, stone chariot at Vittala Temple.']],
  season:'Best October to February.',palette:['#8a5a3b','#c9673f','#3f6b64']}
];

const ROTATIONS=[-6,4,-3,7,-8,3,-4,6,-5];
const STORAGE='escapeFrontendStateV2';
const state={mood:null,distance:null,favoriteIds:new Set(),planIds:new Set(),search:'',filterMood:'',filterDistance:'',sort:'recommended'};

function loadLocal(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
    state.favoriteIds=new Set(Array.isArray(saved.favorites)?saved.favorites:[]);
    state.planIds=new Set(Array.isArray(saved.plan)?saved.plan:[]);
  }catch{ state.favoriteIds=new Set(); state.planIds=new Set(); }
}
function persist(){
  localStorage.setItem(STORAGE,JSON.stringify({
    favorites:[...state.favoriteIds],plan:[...state.planIds]
  }));
}
loadLocal();

const moodGrid=document.getElementById('moodGrid');
MOODS.forEach(m=>{
  const btn=document.createElement('button');
  btn.className='mood-tile';
  btn.type='button';
  btn.innerHTML=`${m.icon}<h3>${m.label}</h3><p>${m.desc}</p>`;
  btn.addEventListener('click',()=>{state.mood=m.id;goToStep(1);});
  moodGrid.appendChild(btn);
});

const chipRow=document.getElementById('distanceChips');
DISTANCES.forEach(d=>{
  const btn=document.createElement('button');
  btn.className='chip'; btn.type='button'; btn.textContent=d.label; btn.dataset.id=d.id;
  btn.addEventListener('click',()=>{
    state.distance=d.id;
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('selected',c.dataset.id===d.id));
    buildResults(); goToStep(2);
  });
  chipRow.appendChild(btn);
});

document.getElementById('surpriseBtn').addEventListener('click',()=>{
  state.mood=MOODS[Math.floor(Math.random()*MOODS.length)].id;
  state.distance=DISTANCES[Math.floor(Math.random()*DISTANCES.length)].id;
  buildResults(); goToStep(2);
});
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>goToStep(Number(b.dataset.back))));
document.getElementById('startOverBtn').addEventListener('click',()=>{
  state.mood=null;state.distance=null;state.search='';state.filterMood='';state.filterDistance='';state.sort='recommended';
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
  goToStep(0);
});
document.getElementById('shuffleBtn').addEventListener('click',()=>{state.sort='shuffle';buildResults();});
document.getElementById('savedNavBtn').addEventListener('click',()=>{buildSavedView();goToStep(3);});

const suggestForm=document.getElementById('suggestForm');
document.getElementById('suggestToggleBtn').addEventListener('click',()=>suggestForm.classList.toggle('hidden'));
suggestForm.addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(suggestForm).entries());
  const submissions=JSON.parse(localStorage.getItem('escapeSuggestions')||'[]');
  submissions.push({...data,submittedAt:new Date().toISOString()});
  localStorage.setItem('escapeSuggestions',JSON.stringify(submissions));
  const status=document.getElementById('suggestStatus');
  status.textContent='Thanks — saved for the demo review queue!';
  suggestForm.reset();
  setTimeout(()=>{suggestForm.classList.add('hidden');status.textContent='';},2200);
});

function goToStep(n){
  document.querySelectorAll('.step').forEach(s=>s.classList.toggle('active',s.dataset.step==n));
  document.querySelectorAll('.progress i').forEach(i=>i.classList.toggle('on',i.dataset.step==n));
  window.scrollTo({top:0,behavior:'smooth'});
}

function injectDiscoveryTools(){
  if(document.getElementById('discoveryTools'))return;
  const desk=document.getElementById('desk');
  const tools=document.createElement('div');
  tools.id='discoveryTools';
  tools.setAttribute('role','search');
  tools.innerHTML=`
    <div class="escape-tools">
      <label class="escape-field"><span>Search destinations</span><input id="destinationSearch" type="search" placeholder="Search by place or vibe…" autocomplete="off"></label>
      <label class="escape-field"><span>Mood</span><select id="moodFilter"><option value="">All moods</option>${MOODS.map(m=>`<option value="${m.id}">${m.label}</option>`).join('')}</select></label>
      <label class="escape-field"><span>Travel range</span><select id="distanceFilter"><option value="">All ranges</option>${DISTANCES.map(d=>`<option value="${d.id}">${d.label}</option>`).join('')}</select></label>
      <label class="escape-field"><span>Sort</span><select id="sortSelect"><option value="recommended">Recommended</option><option value="name">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="shortest">Shortest travel</option></select></label>
    </div>
    <div id="planSummary" class="escape-plan-summary" aria-live="polite"></div>`;
  desk.parentNode.insertBefore(tools,desk);
  const search=document.getElementById('destinationSearch');
  const mood=document.getElementById('moodFilter');
  const distance=document.getElementById('distanceFilter');
  const sort=document.getElementById('sortSelect');
  search.addEventListener('input',()=>{state.search=search.value.trim().toLowerCase();renderResults();});
  mood.addEventListener('change',()=>{state.filterMood=mood.value;renderResults();});
  distance.addEventListener('change',()=>{state.filterDistance=distance.value;renderResults();});
  sort.addEventListener('change',()=>{state.sort=sort.value;renderResults();});
}

function sceneSvg(palette){
  const [a,b,c]=palette;
  return `<svg viewBox="0 0 250 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="250" height="150" fill="${a}"/><path d="M0 100 Q60 60 130 95 T250 85 V150 H0Z" fill="${b}" opacity=".85"/>
  <path d="M0 120 Q80 95 150 118 T250 112 V150 H0Z" fill="${c}" opacity=".9"/><circle cx="205" cy="38" r="16" fill="${c}" opacity=".55"/></svg>`;
}
const heartIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 6 5c2 0 3.4 1 6 3.8C14.6 6 16 5 18 5c3.7 0 5.5 3.4 4 6.7C19.5 16.4 12 21 12 21z"/></svg>`;
function escapeHtml(v){
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function moodLabel(id){return MOODS.find(m=>m.id===id)?.label||'weekend';}

function toggleFavorite(id){
  if(state.favoriteIds.has(id))state.favoriteIds.delete(id);else state.favoriteIds.add(id);
  persist();updateSavedCount();
}
function togglePlan(id){
  if(state.planIds.has(id))state.planIds.delete(id);else state.planIds.add(id);
  persist();updatePlanSummary();
}
function updateSavedCount(){
  const el=document.getElementById('savedCount');
  if(el)el.textContent=state.favoriteIds.size?`(${state.favoriteIds.size})`:'';
}
function updatePlanSummary(){
  const el=document.getElementById('planSummary'); if(!el)return;
  el.innerHTML=state.planIds.size
    ? `<strong>${state.planIds.size} weekend plan item${state.planIds.size===1?'':'s'}</strong> saved in this browser · <button type="button" class="link-btn" id="clearPlanBtn">Clear plan</button>`
    : `<span>Tip: add a destination to your weekend plan from any postcard.</span>`;
  document.getElementById('clearPlanBtn')?.addEventListener('click',()=>{state.planIds.clear();persist();renderResults();});
}

function buildPostcard(dest,{allowUnsave=false}={}){
  const rot=ROTATIONS[Math.floor(Math.random()*ROTATIONS.length)];
  const card=document.createElement('article');
  card.className='postcard';
  card.style.transform=`rotate(${window.innerWidth<640?0:rot}deg)`;
  card.tabIndex=0;
  card.setAttribute('role','button');
  card.setAttribute('aria-label',`${dest.name} postcard. Press Enter or Space to view details.`);
  const saved=state.favoriteIds.has(dest.id), planned=state.planIds.has(dest.id);
  card.innerHTML=`<div class="postcard-inner">
    <div class="face front">
      <div class="scene">${sceneSvg(dest.palette)}<div class="postmark">WKND<br>MAIL</div><div class="stamp">${escapeHtml(dest.stamp)}</div></div>
      <div class="front-body"><div><h3>${escapeHtml(dest.name)}</h3><p class="tagline">${escapeHtml(dest.tagline)}</p></div>
      <div class="flip-hint">tap to read the back</div></div>
    </div>
    <div class="face back">
      <button class="heart-btn ${saved?'active':''}" type="button" aria-label="${saved?'Remove from saved':'Save this destination'}">${heartIcon}</button>
      <p class="greet">Dear traveler,</p><p class="fit-line">A good fit for a ${escapeHtml(moodLabel(dest.mood).toLowerCase())} weekend.</p>
      ${dest.days.map(([d,t])=>`<p class="day"><b>${escapeHtml(d)}:</b> ${escapeHtml(t)}</p>`).join('')}
      <p class="season">${escapeHtml(dest.season)}</p>
      <div class="card-actions">
        <button class="chip plan-btn" type="button" aria-pressed="${planned}">${planned?'✓ In weekend plan':'＋ Add to weekend plan'}</button>
        <button class="link-btn detail-btn" type="button">View details</button>
      </div>
    </div></div>`;
  const flip=e=>{if(e?.target.closest('button'))return;card.classList.toggle('flipped');};
  card.addEventListener('click',flip);
  card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('button')){e.preventDefault();card.classList.toggle('flipped');}});
  const heart=card.querySelector('.heart-btn');
  heart.addEventListener('click',e=>{
    e.stopPropagation();toggleFavorite(dest.id);
    heart.classList.toggle('active',state.favoriteIds.has(dest.id));
    heart.setAttribute('aria-label',state.favoriteIds.has(dest.id)?'Remove from saved':'Save this destination');
    if(allowUnsave&&!state.favoriteIds.has(dest.id)){card.remove();updateSavedViewCount();}
  });
  const plan=card.querySelector('.plan-btn');
  plan.addEventListener('click',e=>{
    e.stopPropagation();togglePlan(dest.id);
    const active=state.planIds.has(dest.id);plan.textContent=active?'✓ In weekend plan':'＋ Add to weekend plan';plan.setAttribute('aria-pressed',String(active));updatePlanSummary();
  });
  card.querySelector('.detail-btn').addEventListener('click',e=>{e.stopPropagation();card.classList.add('flipped');});
  return card;
}

function filteredDestinations(){
  let matches=DESTINATIONS.filter(d=>{
    const text=`${d.name} ${d.tagline} ${d.season} ${moodLabel(d.mood)}`.toLowerCase();
    return (!state.mood||d.mood===state.mood) &&
      (!state.distance||d.distance===state.distance) &&
      (!state.filterMood||d.mood===state.filterMood) &&
      (!state.filterDistance||d.distance===state.filterDistance) &&
      (!state.search||text.includes(state.search));
  });
  if(state.sort==='name')matches.sort((a,b)=>a.name.localeCompare(b.name));
  else if(state.sort==='name-desc')matches.sort((a,b)=>b.name.localeCompare(a.name));
  else if(state.sort==='shortest')matches.sort((a,b)=>['near','mid','far'].indexOf(a.distance)-['near','mid','far'].indexOf(b.distance));
  else if(state.sort==='shuffle'||state.sort==='recommended')matches.sort(()=>Math.random()-.5);
  return matches;
}

function renderResults(){
  const desk=document.getElementById('desk');
  const matches=filteredDestinations();
  const selectedMood=MOODS.find(m=>m.id===state.mood);
  document.getElementById('resultsHeadline').textContent=selectedMood?`Your ${selectedMood.label.toLowerCase()} weekends`:'Postcards worth chasing';
  document.getElementById('resultsCount').textContent=`${matches.length} destination${matches.length===1?'':'s'} found`;
  desk.innerHTML='';
  if(!matches.length){
    desk.innerHTML=`<div class="empty-state"><p>No destinations match those filters.</p><button type="button" class="link-btn" id="clearFiltersBtn">Clear filters</button></div>`;
    document.getElementById('clearFiltersBtn').addEventListener('click',()=>{
      state.search='';state.filterMood='';state.filterDistance='';state.sort='recommended';
      document.getElementById('destinationSearch').value='';
      document.getElementById('moodFilter').value='';
      document.getElementById('distanceFilter').value='';
      document.getElementById('sortSelect').value='recommended';
      renderResults();
    });
  }else matches.forEach(d=>desk.appendChild(buildPostcard(d)));
  updatePlanSummary();
}

function buildResults(){
  injectDiscoveryTools();
  if(!state.filterMood&&state.mood)state.filterMood=state.mood;
  if(!state.filterDistance&&state.distance)state.filterDistance=state.distance;
  document.getElementById('moodFilter').value=state.filterMood;
  document.getElementById('distanceFilter').value=state.filterDistance;
  renderResults();
}

function updateSavedViewCount(){
  const n=state.favoriteIds.size;
  document.getElementById('savedResultsCount').textContent=n?`${n} saved`:'';
}
function buildSavedView(){
  const desk=document.getElementById('savedDesk');
  const saved=DESTINATIONS.filter(d=>state.favoriteIds.has(d.id));
  desk.innerHTML='';
  updateSavedViewCount();
  if(!saved.length){
    desk.innerHTML=`<div class="empty-state"><p>Nothing saved yet — flip a postcard and tap the heart to keep it here.</p></div>`;
    return;
  }
  saved.forEach(d=>desk.appendChild(buildPostcard(d,{allowUnsave:true})));
  updateSavedCount();
}

const style=document.createElement('style');
style.textContent=`
.escape-tools{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;margin:18px 0 22px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.035)}
.escape-field{display:grid;gap:6px;font-size:.78rem;color:#9bb3ad}.escape-field input,.escape-field select{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:#182d33;color:#f2ead9;padding:10px 12px;font:inherit;outline:none}.escape-field input:focus,.escape-field select:focus{border-color:#c69a2e;box-shadow:0 0 0 2px rgba(198,154,46,.18)}
.escape-plan-summary{margin:-8px 0 14px;color:#9bb3ad;font-size:.9rem}.escape-plan-summary .link-btn{margin-left:8px}.card-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}.card-actions .chip{font-size:.75rem;padding:7px 10px}
@media(max-width:800px){.escape-tools{grid-template-columns:1fr 1fr}}@media(max-width:520px){.escape-tools{grid-template-columns:1fr}}
`;
document.head.appendChild(style);

updateSavedCount();
