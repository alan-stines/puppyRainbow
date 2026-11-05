'use strict';
(() => {
  // Small, dependency-free extras. All results are playful fiction.
  const quiz = document.querySelector('#pup-quiz');
  const fortune = document.querySelector('#pup-fortune');
  if (!quiz || !fortune) return;

  const results = [
    {name:'The Professional Napper', emoji:'💤', photo:'assets/p18.jpg', description:'You bring calm, cozy energy. Your superpower is knowing when a blanket is actually a life plan.', motto:'Rest is a valid adventure.'},
    {name:'The Certified Goofball', emoji:'🎾', photo:'assets/p9.jpg', description:'You make ordinary moments ridiculous in the best way. The world could use your particular flavor of silliness.', motto:'Be the reason someone snort-laughs.'},
    {name:'The Brave Little Explorer', emoji:'🐾', photo:'assets/p11.jpg', description:'Curious nose, adventurous heart. Every sidewalk crack might be the beginning of something wonderful.', motto:'Tiny steps count as big adventures.'},
    {name:'The Sunshine Ambassador', emoji:'☀️', photo:'assets/p19.jpg', description:'Your welcome-home energy is contagious. You are very good at making people feel like they belong.', motto:'A warm hello changes a day.'}
  ];
  const choices = [...quiz.querySelectorAll('[data-vibe]')];
  const output = document.querySelector('#quiz-result');
  function showResult(index) {
    const pup = results[index];
    choices.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.vibe) === index)));
    output.hidden = false;
    output.innerHTML = '';
    const picture = document.createElement('img');
    picture.src = pup.photo;
    picture.alt = '';
    picture.width = 180;
    picture.height = 160;
    picture.loading = 'lazy';
    const copy = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = pup.emoji + ' ' + pup.name;
    const paragraph = document.createElement('p');
    paragraph.textContent = pup.description;
    const motto = document.createElement('strong');
    motto.textContent = pup.motto;
    copy.append(heading,paragraph,motto);
    output.append(picture,copy);
  }
  choices.forEach(button => button.addEventListener('click', () => showResult(Number(button.dataset.vibe))));

  const fortunes = [
    'A snack you forgot about will taste better than expected.',
    'A very important meeting with a sunbeam is on your calendar.',
    'Someone thinks you are a very good human. They are right.',
    'Your next tiny victory deserves a dramatic tail wag.',
    'A surprise smile is headed your way. No tracking number required.',
    'Today is an excellent day to sniff out something new.',
    'A cozy corner will soon reveal itself to be premium real estate.',
    'You are allowed to have fun before the to-do list is finished.',
    'Expect a breakthrough in the important field of blanket science.',
    'Your inner puppy requests five minutes of completely unnecessary joy.',
    'One ordinary moment today will become a favorite little memory.',
    'A walk, a stretch, or a window view might change the whole mood.'
  ];
  let lastFortune = -1;
  const fortuneText = document.querySelector('#fortune-text');
  const fortuneCount = document.querySelector('#fortune-count');
  let count = 0;
  document.querySelector('#fortune-button').addEventListener('click', () => {
    let index = Math.floor(Math.random() * fortunes.length);
    if (fortunes.length > 1 && index === lastFortune) index = (index + 1) % fortunes.length;
    lastFortune = index;
    fortuneText.textContent = fortunes[index];
    count += 1;
    fortuneCount.textContent = count === 1 ? 'One tail-wagging prediction delivered.' : count + ' tail-wagging predictions delivered.';
  });
})();
