/* ---------------------------------------------------------
   CONSTANTS + CLIENT IDENTITY
   No login system — a random id is generated once per browser
   and stored in localStorage so favorites persist for that
   visitor without requiring an account.
--------------------------------------------------------- */
const MOODS = [
  { id:'chill', label:'Chill & Slow', desc:'Misty viewpoints, long breakfasts, nowhere to be.',
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15h13a3 3 0 100-6 4 4 0 00-7.5-1.5A3.5 3.5 0 004 15z"/><path d="M2 19h20"/></svg>` },
  { id:'wild', label:'Wild & Outdoors', desc:'Trails, treks and something to be slightly out of breath about.',
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 20L10 6l4 8 2-3 5 8H3z"/></svg>` },
  { id:'romantic', label:'Romantic Escape', desc:'Two chairs, one view, a slow sunset.',
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 16c6 0 4-6 8-6s2 6 8 6"/><circle cx="18" cy="7" r="2.4"/></svg>` },
  { id:'culture', label:'Culture & Food', desc:'Old stones, long tables, stories worth the detour.',
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V10M9 21V10M15 21V10M20 21V10M3 10l9-6 9 6M2 21h20"/></svg>` },
];

const DISTANCES = [
  { id:'near', label:'Under 3 hrs' },
  { id:'mid',  label:'3–6 hrs' },
  { id:'far',  label:'Flight worth it' },
];

const ROTATIONS = [-6,4,-3,7,-8,3,-4,6,-5];

function getUserId(){
  let id = localStorage.getItem('escapeUserId');
  if (!id){
    id = crypto.randomUUID();
    localStorage.setItem('escapeUserId', id);
  }
  return id;
}
const userId = getUserId();

/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */
const state = { mood:null, distance:null, favoriteIds:new Set() };

/* ---------------------------------------------------------
   API HELPERS
--------------------------------------------------------- */
async function fetchDestinations({ mood, distance } = {}){
  const params = new URLSearchParams();
  if (mood) params.set('mood', mood);
  if (distance) params.set('distance', distance);
  const res = await fetch(`/api/destinations?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load destinations');
  return res.json();
}

async function fetchFavorites(){
  const res = await fetch(`/api/favorites/${userId}`);
  if (!res.ok) throw new Error('Failed to load favorites');
  return res.json();
}

async function saveFavorite(destinationId){
  await fetch('/api/favorites', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ userId, destinationId }),
  });
}

async function removeFavorite(destinationId){
  await fetch(`/api/favorites/${userId}/${destinationId}`, { method:'DELETE' });
}

async function submitSuggestion(payload){
  const res = await fetch('/api/submissions', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok){
    const body = await res.json().catch(()=>({}));
    throw new Error(body.error || 'Could not send suggestion');
  }
  return res.json();
}

/* ---------------------------------------------------------
   RENDER: mood tiles + distance chips (static, built once)
--------------------------------------------------------- */
const moodGrid = document.getElementById('moodGrid');
MOODS.forEach(m=>{
  const btn = document.createElement('button');
  btn.className = 'mood-tile';
  btn.innerHTML = `${m.icon}<h3>${m.label}</h3><p>${m.desc}</p>`;
  btn.addEventListener('click', ()=>{
    state.mood = m.id;
    goToStep(1);
  });
  moodGrid.appendChild(btn);
});

const chipRow = document.getElementById('distanceChips');
DISTANCES.forEach(d=>{
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.textContent = d.label;
  btn.dataset.id = d.id;
  btn.addEventListener('click', async ()=>{
    state.distance = d.id;
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('selected', c.dataset.id===d.id));
    await buildResults();
    goToStep(2);
  });
  chipRow.appendChild(btn);
});

document.getElementById('surpriseBtn').addEventListener('click', async ()=>{
  state.mood = MOODS[Math.floor(Math.random()*MOODS.length)].id;
  state.distance = DISTANCES[Math.floor(Math.random()*DISTANCES.length)].id;
  await buildResults();
  goToStep(2);
});

document.querySelectorAll('[data-back]').forEach(b=>{
  b.addEventListener('click', ()=> goToStep(parseInt(b.dataset.back)) );
});
document.getElementById('startOverBtn').addEventListener('click', ()=>{
  state.mood = null; state.distance = null;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
  goToStep(0);
});
document.getElementById('shuffleBtn').addEventListener('click', buildResults);

document.getElementById('savedNavBtn').addEventListener('click', async ()=>{
  await buildSavedView();
  goToStep(3);
});

/* ---------------------------------------------------------
   SUGGESTION FORM
--------------------------------------------------------- */
const suggestForm = document.getElementById('suggestForm');
document.getElementById('suggestToggleBtn').addEventListener('click', ()=>{
  suggestForm.classList.toggle('hidden');
});
suggestForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const statusEl = document.getElementById('suggestStatus');
  const data = Object.fromEntries(new FormData(suggestForm).entries());
  statusEl.textContent = 'Sending…';
  try{
    await submitSuggestion({ ...data, submittedBy: userId });
    statusEl.textContent = 'Thanks — sent for review!';
    suggestForm.reset();
    setTimeout(()=>{ suggestForm.classList.add('hidden'); statusEl.textContent=''; }, 2200);
  }catch(err){
    statusEl.textContent = err.message;
  }
});

/* ---------------------------------------------------------
   STEP NAVIGATION
--------------------------------------------------------- */
function goToStep(n){
  document.querySelectorAll('.step').forEach(s=>{
    s.classList.toggle('active', s.dataset.step == n);
  });
  document.querySelectorAll('.progress i').forEach(i=>{
    i.classList.toggle('on', i.dataset.step == n);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ---------------------------------------------------------
   POSTCARD RENDERING (shared by results + saved views)
--------------------------------------------------------- */
function sceneSvg(palette){
  const [a,b,c] = palette;
  return `<svg viewBox="0 0 250 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="250" height="150" fill="${a}"/>
    <path d="M0 100 Q 60 60 130 95 T 250 85 V150 H0 Z" fill="${b}" opacity="0.85"/>
    <path d="M0 120 Q 80 95 150 118 T 250 112 V150 H0 Z" fill="${c}" opacity="0.9"/>
    <circle cx="205" cy="38" r="16" fill="${c}" opacity="0.55"/>
  </svg>`;
}

const heartIcon = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 6 5c2 0 3.4 1 6 3.8C14.6 6 16 5 18 5c3.7 0 5.5 3.4 4 6.7C19.5 16.4 12 21 12 21z"/></svg>`;

function buildPostcard(dest, moodLabel, { allowUnsave=false } = {}){
  const rot = ROTATIONS[Math.floor(Math.random()*ROTATIONS.length)];
  const card = document.createElement('div');
  card.className = 'postcard';
  card.style.transform = `rotate(${window.innerWidth < 640 ? 0 : rot}deg)`;
  card.tabIndex = 0;
  card.setAttribute('role','button');
  card.setAttribute('aria-label', `${dest.name} postcard, press to flip for details`);

  const isSaved = state.favoriteIds.has(dest.id);

  card.innerHTML = `
    <div class="postcard-inner">
      <div class="face front">
        <div class="scene">
          ${sceneSvg(dest.palette)}
          <div class="postmark">WKND<br/>MAIL</div>
          <div class="stamp">${dest.stamp}</div>
        </div>
        <div class="front-body">
          <div>
            <h3>${dest.name}</h3>
            <p class="tagline">${dest.tagline}</p>
          </div>
          <div class="flip-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 0114-5M20 4v6h-6M20 12a8 8 0 01-14 5M4 20v-6h6"/></svg>
            tap to read the back
          </div>
        </div>
      </div>
      <div class="face back">
        <button class="heart-btn ${isSaved ? 'active' : ''}" type="button" aria-label="Save this destination">${heartIcon}</button>
        <p class="greet">Dear traveler,</p>
        <p class="fit-line">A good fit for a ${moodLabel.toLowerCase()} weekend, ${dest.stamp.toLowerCase()}.</p>
        ${dest.days.map(([d,t])=>`<p class="day"><b>${d}:</b> ${t}</p>`).join('')}
        <p class="season">${dest.season}</p>
      </div>
    </div>
  `;

  const flip = (e)=>{
    if (e && e.target.closest('.heart-btn')) return;
    card.classList.toggle('flipped');
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', e=>{
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); }
  });

  const heartBtn = card.querySelector('.heart-btn');
  heartBtn.addEventListener('click', async ()=>{
    const nowSaved = !heartBtn.classList.contains('active');
    heartBtn.classList.toggle('active', nowSaved);
    if (nowSaved){
      state.favoriteIds.add(dest.id);
      await saveFavorite(dest.id);
    } else {
      state.favoriteIds.delete(dest.id);
      await removeFavorite(dest.id);
      if (allowUnsave){
        // In the Saved view, unsaving should remove the card from view.
        card.style.transition = 'opacity .3s ease';
        card.style.opacity = '0';
        setTimeout(()=> card.remove(), 300);
      }
    }
    updateSavedCount();
  });

  return card;
}

function updateSavedCount(){
  const el = document.getElementById('savedCount');
  el.textContent = state.favoriteIds.size ? `(${state.favoriteIds.size})` : '';
}

/* ---------------------------------------------------------
   RESULTS VIEW
--------------------------------------------------------- */
async function buildResults(){
  const mood = MOODS.find(m=>m.id===state.mood);
  const distLabel = state.distance ? DISTANCES.find(d=>d.id===state.distance).label : null;

  document.getElementById('resultsHeadline').textContent =
    mood ? `Your ${mood.label.toLowerCase()} weekends` : 'Postcards worth chasing';

  const desk = document.getElementById('desk');
  desk.innerHTML = '<p class="results-count">Loading…</p>';

  let matches;
  try{
    matches = await fetchDestinations({ mood: state.mood, distance: state.distance });
  }catch(err){
    desk.innerHTML = `<div class="empty-state"><p>Couldn't reach the server. Is it running?</p></div>`;
    return;
  }

  matches = [...matches].sort(()=>Math.random()-0.5);

  document.getElementById('resultsCount').textContent = matches.length
    ? `${matches.length} match${matches.length===1?'':'es'}${distLabel ? ' · ' + distLabel.toLowerCase() : ''}`
    : '';

  desk.innerHTML = '';

  if (!matches.length){
    desk.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/></svg>
        <p>Nothing quite fits that range yet for a ${mood ? mood.label.toLowerCase() : ''} weekend.</p>
        <button class="link-btn" id="widenBtn">Widen the range</button>
      </div>`;
    document.getElementById('widenBtn').addEventListener('click', async ()=>{
      state.distance = null;
      document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
      await buildResults();
    });
    return;
  }

  matches.forEach(dest=>{
    desk.appendChild(buildPostcard(dest, mood.label));
  });
}

/* ---------------------------------------------------------
   SAVED VIEW
--------------------------------------------------------- */
async function buildSavedView(){
  const desk = document.getElementById('savedDesk');
  desk.innerHTML = '<p class="results-count">Loading…</p>';

  let saved;
  try{
    saved = await fetchFavorites();
  }catch(err){
    desk.innerHTML = `<div class="empty-state"><p>Couldn't reach the server.</p></div>`;
    return;
  }

  state.favoriteIds = new Set(saved.map(d=>d.id));
  updateSavedCount();

  document.getElementById('savedResultsCount').textContent =
    saved.length ? `${saved.length} saved` : '';

  desk.innerHTML = '';
  if (!saved.length){
    desk.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 6 5c2 0 3.4 1 6 3.8C14.6 6 16 5 18 5c3.7 0 5.5 3.4 4 6.7C19.5 16.4 12 21 12 21z"/></svg>
        <p>Nothing saved yet — flip a postcard and tap the heart to keep it here.</p>
      </div>`;
    return;
  }

  const moodLookup = Object.fromEntries(MOODS.map(m=>[m.id, m.label]));
  saved.forEach(dest=>{
    desk.appendChild(buildPostcard(dest, moodLookup[dest.mood] || 'weekend', { allowUnsave:true }));
  });
}

/* ---------------------------------------------------------
   INIT — load the visitor's existing favorites on page load
   so the heart state is correct as soon as they reach results.
--------------------------------------------------------- */
(async function init(){
  try{
    const saved = await fetchFavorites();
    state.favoriteIds = new Set(saved.map(d=>d.id));
    updateSavedCount();
  }catch(err){
    console.warn('Could not preload favorites', err);
  }
})();
