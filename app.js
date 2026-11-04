'use strict';
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const memory = {};
  const storage = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)) ?? []; } catch { return memory[key] ?? []; } },
    set(key, value) { memory[key] = value; try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Browser-local in-memory fallback. */ } }
  };
  const saved = new Set(storage.get('puppyrainbow-favorites-v1').filter?.(x => typeof x === 'string') ?? []);
  const read = new Set(storage.get('puppyrainbow-read-v1').filter?.(x => typeof x === 'string') ?? []);
  let data, photoFilter = 'All pups', storyFilter = 'All stories', photoOrder = [], activePhoto, lightboxIds = [], toastTimer, puppyTimer, sound = false, audio;
  const viewNames = ['home', 'gallery', 'stories', 'little-joys'];
  let view = 'home';

  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 2400);
  }

  function route() {
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = 'home'; }
    const [requested, storyId] = hash.split('/');
    view = viewNames.includes(requested) ? requested : (requested === 'story' ? 'stories' : 'home');
    for (const section of $$('[data-view]')) section.hidden = section.dataset.view !== view;
    for (const link of $$('[data-nav]')) {
      if (link.dataset.nav === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    closeMenu();
    for (const dialog of $$('dialog[open]')) dialog.close();
    document.title = ({home:'Your daily dose of happy', gallery:'The good dogs', stories:'Happy tales', 'little-joys':'Little joys'})[view] + ' · PuppyRainbow';
    window.scrollTo({top:0, behavior:'instant'});
    if (data && requested === 'story' && storyId) openStory(storyId);
  }

  function closeMenu() {
    $('#navigation').classList.remove('is-open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    $('#menu-toggle').setAttribute('aria-label', 'Open navigation');
  }
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
    $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    $('#navigation').classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if ($('#navigation').classList.contains('is-open')) { closeMenu(); $('#menu-toggle').focus(); }
      else if (!$$('dialog[open]').length && !$('#puppy-panel').hidden) closePup();
    }
    if ($('#photo-dialog').open && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      if (event.key === 'ArrowLeft') stepPhoto(-1);
      if (event.key === 'ArrowRight') stepPhoto(1);
    }
  });
  window.addEventListener('hashchange', () => { route(); $('#main').focus({preventScroll:true}); });
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === location.hash) { closeMenu(); window.scrollTo({top:0, behavior:'smooth'}); }
    if (!event.target.closest('.site-header')) closeMenu();
  });

  function photoCard(photo, home = false) {
    return `<article class="photo-card"><button class="photo-open" data-photo="${photo.id}" aria-label="View ${escape(photo.title)}"><div class="photo-frame"><img src="${photo.src}" alt="${escape(photo.alt)}" width="550" height="600" loading="lazy" decoding="async"><span class="photo-category">${escape(photo.category)}</span></div><div class="photo-info"><h3>${escape(photo.title)}</h3><p>${escape(photo.caption)}</p><span class="see-photo">A closer look <span aria-hidden="true">↗</span></span></div></button><button class="save-photo icon-button" data-save="${photo.id}" aria-pressed="${saved.has(photo.id)}" aria-label="${saved.has(photo.id)?'Unsave':'Save'} ${escape(photo.title)}">${saved.has(photo.id)?'♥':'♡'}</button></article>`;
  }

  function visiblePhotos() {
    return photoOrder.map(id => data.photos.find(p => p.id === id)).filter(photo => photoFilter === 'All pups' || (photoFilter === 'Saved' ? saved.has(photo.id) : photo.category === photoFilter));
  }
  function renderGallery() {
    const photos = visiblePhotos();
    $('#gallery-photos').innerHTML = photos.map(p => photoCard(p)).join('');
    $('#gallery-empty').hidden = photos.length !== 0;
    $('#gallery-result').textContent = `${photos.length} ${photos.length === 1 ? 'very good dog' : 'very good dogs'}${photoFilter === 'Saved' ? ' saved on this device' : ' · tap a photo to say hello'}`;
    for (const button of $$('#photo-filters button')) button.setAttribute('aria-pressed', String(button.dataset.filter === photoFilter));
  }
  function syncSaves() {
    $('#saved-count').textContent = saved.size;
    $('#saved-nav').setAttribute('aria-label', `View ${saved.size} saved dogs`);
    for (const button of $$('[data-save]')) {
      const photo = data.photos.find(p => p.id === button.dataset.save);
      button.setAttribute('aria-pressed', String(saved.has(photo.id)));
      button.setAttribute('aria-label', `${saved.has(photo.id) ? 'Unsave' : 'Save'} ${photo.title}`);
      button.textContent = saved.has(photo.id) ? '♥' : '♡';
    }
    if (activePhoto) {
      $('#dialog-save').textContent = saved.has(activePhoto.id) ? '♥ Saved to your happy place' : '♡ Save this good dog';
      $('#dialog-save').setAttribute('aria-pressed', String(saved.has(activePhoto.id)));
    }
  }
  function toggleSave(id) {
    const had = saved.has(id);
    had ? saved.delete(id) : saved.add(id);
    storage.set('puppyrainbow-favorites-v1', [...saved]);
    syncSaves();
    if (photoFilter === 'Saved') renderGallery();
    toast(had ? 'A little room for another favorite.' : 'A very good dog, saved. ♡');
  }
  function chooseFilter(filter) { photoFilter = filter; if (data) renderGallery(); }
  $('#photo-filters').addEventListener('click', event => { const button = event.target.closest('button[data-filter]'); if (button) chooseFilter(button.dataset.filter); });
  $('#show-all-dogs').addEventListener('click', () => chooseFilter('All pups'));
  $('#saved-nav').addEventListener('click', () => { chooseFilter('Saved'); if(location.hash !== '#gallery') location.hash = 'gallery'; else window.scrollTo({top:0,behavior:'smooth'}); });
  $('#shuffle-photos').addEventListener('click', () => {
    for (let i = photoOrder.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [photoOrder[i], photoOrder[j]] = [photoOrder[j], photoOrder[i]]; }
    if(data) { renderGallery(); toast('Same good dogs. A fresh little shuffle.'); }
  });
  function openPhoto(id, ids) {
    activePhoto = data.photos.find(photo => photo.id === id);
    if (!activePhoto) return;
    if(ids?.length) lightboxIds = ids;
    const photo = activePhoto;
    $('#dialog-photo').src = photo.src;
    $('#dialog-photo').alt = photo.alt;
    $('#photo-dialog-title').textContent = photo.title;
    $('#photo-dialog-category').textContent = photo.category;
    $('#photo-dialog-caption').textContent = photo.caption;
    $('#dialog-credit').textContent = photo.credit.replace(/^Photo:\s*/, '');
    $('#dialog-credit').href = photo.creditUrl;
    $('#dialog-read').hidden = !photo.story;
    syncSaves();
    if (!$('#photo-dialog').open) $('#photo-dialog').showModal();
  }
  function stepPhoto(delta) {
    if (!activePhoto || !lightboxIds.length) return;
    const index = lightboxIds.indexOf(activePhoto.id);
    openPhoto(lightboxIds[(index + delta + lightboxIds.length) % lightboxIds.length]);
  }
  $('#photo-prev').addEventListener('click', () => stepPhoto(-1));
  $('#photo-next').addEventListener('click', () => stepPhoto(1));
  $('#dialog-save').addEventListener('click', () => { if(activePhoto) toggleSave(activePhoto.id); });
  $('#dialog-read').addEventListener('click', () => { if(activePhoto?.story) { $('#photo-dialog').close(); openStory(activePhoto.story); } });
  $('#surprise-home').addEventListener('click', () => { if(data) openPhoto(data.photos[Math.floor(Math.random()*data.photos.length)].id, data.photos.map(p => p.id)); });

  function renderStories() {
    const term = $('#story-search').value.trim().toLowerCase();
    const stories = [...data.stories].sort((a,b) => Number(b.new)-Number(a.new)).filter(s => (storyFilter === 'All stories' || (storyFilter === 'New tales' ? s.new : read.has(s.id))) && `${s.title} ${s.category} ${s.paragraphs.join(' ')}`.toLowerCase().includes(term));
    $('#story-grid').innerHTML = stories.map(story => {
      const photo = data.photos.find(p => p.id === story.photo);
      return `<article><button class="story-card" data-story="${story.id}" aria-label="Read ${escape(story.title)}"><div class="story-card-image"><img src="${photo.src}" alt="${escape(photo.alt)}" width="700" height="500" loading="lazy" decoding="async">${read.has(story.id)?'<span class="story-badge read-badge">✓ Already enjoyed</span>':story.new?'<span class="story-badge">Fresh from the puppy pile</span>':''}</div><p class="eyebrow">${escape(story.category)} · 1 MIN READ</p><h2>${escape(story.title)}</h2><p class="story-excerpt">${escape(story.paragraphs[0].length>120?story.paragraphs[0].slice(0,117).replace(/\s\S*$/,'')+'…':story.paragraphs[0])}</p><span class="read-link">Settle in for a little tale <span aria-hidden="true">↗</span></span></button></article>`;
    }).join('');
    $('#story-result').textContent = `${stories.length} ${stories.length===1?'happy tale':'happy tales'} · original fiction`;
    $('#story-empty').hidden = stories.length !== 0;
    for (const button of $$('#story-filters button')) button.setAttribute('aria-pressed', String(button.dataset.storyFilter === storyFilter));
  }
  let currentStory;
  function openStory(id) {
    const story = data.stories.find(s => s.id === id);
    if (!story) return;
    currentStory = id;
    const photo = data.photos.find(p => p.id === story.photo);
    $('#story-dialog-photo').src = photo.src;
    $('#story-dialog-photo').alt = photo.alt;
    $('#story-dialog-title').textContent = story.title;
    $('#story-dialog-category').textContent = story.category;
    $('#story-dialog-body').innerHTML = story.paragraphs.map(text => `<p>${escape(text)}</p>`).join('');
    read.add(id);
    storage.set('puppyrainbow-read-v1', [...read]);
    renderStories();
    if(!$('#story-dialog').open) $('#story-dialog').showModal();
    $('#story-dialog').scrollTop = 0;
  }
  $('#next-story').addEventListener('click', () => {
    const unread = data.stories.filter(s => !read.has(s.id));
    const choices = unread.length ? unread : data.stories.filter(s => s.id !== currentStory);
    openStory(choices[Math.floor(Math.random() * choices.length)].id);
  });
  $('#story-filters').addEventListener('click', event => { const button = event.target.closest('[data-story-filter]'); if(button) { storyFilter = button.dataset.storyFilter; if(data) renderStories(); } });
  $('#story-search').addEventListener('input', () => { if(data) renderStories(); });
  document.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    if(save && data) return toggleSave(save.dataset.save);
    const photo = event.target.closest('[data-photo]');
    if(photo && data) return openPhoto(photo.dataset.photo, view === 'gallery' ? visiblePhotos().map(p => p.id) : ['p19','p9','p10','p1']);
    const story = event.target.closest('[data-story]');
    if(story && data) openStory(story.dataset.story);
  });
  for(const button of $$('[data-close-dialog]')) button.addEventListener('click', () => button.closest('dialog').close());
  for(const dialog of $$('dialog')) dialog.addEventListener('click', event => {
    if(event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  $('#photo-credits').addEventListener('click', () => { if(data) $('#credits-dialog').showModal(); });

  function openPup() {
    $('#puppy-panel').hidden = false;
    $('#puppy-launcher').hidden = true;
    $('#puppy-launcher').setAttribute('aria-expanded', 'true');
    $('#pet-dog').focus({preventScroll:true});
  }
  function closePup() {
    $('#puppy-panel').hidden = true;
    $('#puppy-launcher').hidden = false;
    $('#puppy-launcher').setAttribute('aria-expanded', 'false');
    $('#puppy-launcher').focus({preventScroll:true});
  }
  $('#puppy-launcher').addEventListener('click', openPup);
  $('#puppy-close').addEventListener('click', closePup);
  for(const button of $$('[data-open-pup]')) button.addEventListener('click', openPup);
  function bark() {
    if(!sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if(!Audio) throw new Error('Audio unavailable');
      audio ??= new Audio();
      if(audio.state === 'suspended') audio.resume().catch(() => { sound = false; syncSound(); });
      for(let i = 0; i < 2; i++) {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * .17;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(410,start);
        oscillator.frequency.exponentialRampToValueAtTime(170,start+.11);
        gain.gain.setValueAtTime(0,start);
        gain.gain.linearRampToValueAtTime(.12,start+.015);
        gain.gain.exponentialRampToValueAtTime(.001,start+.13);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(start); oscillator.stop(start+.14);
      }
    } catch { sound = false; syncSound(); $('#puppy-status').textContent = 'Sound is taking a nap. My tail still works!'; }
  }
  const reactions = {
    pet:['That’s the spot! Tail wagging at maximum enthusiasm. ♡','A head pat? For me? You just made my whole day. ♡','Boop received. Sending one very happy tail wag.'],
    fetch:['You throw. I fetch. We both win. Good teamwork! ◉','Ball retrieved! Returning it is still under negotiation.','The ball has been thoroughly investigated. Again?'],
    treat:['A pretend treat! My favorite flavor is attention. ✦','Snack accepted. Friendship level: very, very good.','Crunch, crunch. That was pawsitively excellent.']
  };
  const reactionIndex = {pet:0, fetch:0, treat:0};
  function playWithPup(action) {
    clearTimeout(puppyTimer);
    const stage = $('#puppy-stage');
    stage.className = 'puppy-stage';
    void stage.offsetWidth;
    stage.classList.add(`is-${action}`);
    const messages = reactions[action];
    $('#puppy-status').textContent = messages[reactionIndex[action]++ % messages.length];
    bark();
    puppyTimer = setTimeout(() => { stage.className = 'puppy-stage'; }, 1600);
  }
  $('#pet-dog').addEventListener('click', () => playWithPup('pet'));
  for(const button of $$('[data-puppy-action]')) button.addEventListener('click', () => playWithPup(button.dataset.puppyAction));
  function syncSound() {
    $('#sound-toggle').textContent = sound ? 'Sound on' : 'Sound off';
    $('#sound-toggle').setAttribute('aria-pressed', String(sound));
    $('#sound-toggle').setAttribute('aria-label', sound ? 'Turn puppy sound off' : 'Turn puppy sound on');
  }
  $('#sound-toggle').addEventListener('click', () => { sound = !sound; syncSound(); if(sound) { $('#puppy-status').textContent = 'A little woof, just for you. Every wag works on silent, too.'; bark(); } });
  syncSound();

  const joys = [
    ['Find your patch of sunshine.','Look for one small lovely thing nearby. A warm mug, a good song, a very ambitious houseplant. Let it have your attention for a minute.'],
    ['Give someone a tiny hello.','Send a kind thought to a person who made your week a little better. A quick “thinking of you” is a perfectly good place to start.'],
    ['Take the scenic minute.','Look out a window or step outside if you can. Notice one color, one sound, and one small thing you usually walk right past.'],
    ['Put on your happy song.','You know the one. The car concert song. The kitchen dancing song. Give it the attention it deserves. Questionable choreography welcome.'],
    ['Borrow a dog’s priorities.','A good stretch. Some fresh water. Being delighted to see a friend. Rainbow thinks you are doing great already.'],
    ['Let something be good enough.','One tiny task can be done without making it perfect. Leave room in the day for something that makes you smile.'],
    ['A completely unnecessary dog joke.','Why did the dog sit in the shade? Because he didn’t want to be a hot dog. Rainbow takes full responsibility for this one.'],
    ['Remember one small good thing.','Something tasty. Something funny. Someone holding a door. A small good thing still counts, even on a complicated day.'],
    ['Give your eyes a little adventure.','Find the most interesting shape in the room. A plant leaf, a cloud, a coffee stain that looks suspiciously like a corgi.'],
    ['Call a tiny recess.','Set the to-do list down for a moment. Stretch your shoulders, uncurl your toes, and admire a very good dog. The list will still be there.']
  ];
  let joyIndex = 0, joyCount = 0;
  $('#another-joy').addEventListener('click', () => {
    const next = (joyIndex + 1 + Math.floor(Math.random()*(joys.length-1))) % joys.length;
    joyIndex = next; joyCount++;
    $('#joy-title').textContent = joys[next][0];
    $('#joy-description').textContent = joys[next][1];
    $('#joy-counter').textContent = `${joyCount} ${joyCount===1?'little invitation':'little invitations'}. Take what you need.`;
  });

  route();
  Promise.all([fetch('content.json').then(response => { if(!response.ok) throw new Error('Content unavailable'); return response.json(); }), fetch('assets/rainbow.svg').then(response => { if(!response.ok) throw new Error('Puppy unavailable'); return response.text(); })]).then(([content, svg]) => {
    data = content;
    photoOrder = data.photos.map(p => p.id);
    for(const id of [...saved]) if(!photoOrder.includes(id)) saved.delete(id);
    for(const holder of $$('.dog-svg')) holder.innerHTML = svg;
    $('#home-photos').innerHTML = ['p19','p9','p10','p1'].map(id => photoCard(data.photos.find(p => p.id === id), true)).join('');
    $('#credits-list').innerHTML = data.photos.map(p => `<li><a href="${escape(p.creditUrl)}" target="_blank" rel="noopener noreferrer">${escape(p.credit.replace(/^Photo:\s*/,''))}</a> · ${escape(p.title)}</li>`).join('');
    renderGallery(); renderStories(); syncSaves();
    if(location.hash.startsWith('#story/')) openStory(decodeURIComponent(location.hash.slice(7)));
  }).catch(error => {
    $('#loading-error').hidden = false;
    console.error('PuppyRainbow could not load its local content.', error);
  });
})();
