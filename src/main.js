import * as THREE from 'three';
import './style.css';

const photoModules = import.meta.glob('../photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const photos = Object.entries(photoModules).sort(([a],[b]) => a.localeCompare(b, undefined, { numeric:true })).map(([path, src], i) => ({src, alt:`Toshita birthday photograph ${i+1}`, caption:['Always glowing ✨','Pure joy 💛','Sweet memories 💫','Lovely energy 💖','Bright smiles ☀️','Dreamy moments 🌟'][i%6]}));
const grid = document.querySelector('#gallery-grid');
if (!photos.length) {
  grid.innerHTML = '<div class="empty-gallery"><span>✧</span><h3>Your memories will shine here</h3><p>Add JPG, JPEG, PNG, or WebP photos to the <code>photos/</code> folder, then restart the dev server or rebuild the site.</p></div>';
} else {
  photos.forEach((photo, i) => {
    const card = document.createElement('button'); card.className = `photo-card reveal${i===0?' photo-tall':''}`; card.setAttribute('aria-label',`Open ${photo.alt}`);
    const img = document.createElement('img'); img.src=photo.src; img.alt=photo.alt; img.loading=i<4?'eager':'lazy'; img.decoding='async';
    const caption=document.createElement('span'); caption.className='photo-caption'; caption.textContent=photo.caption;
    card.append(img,caption); card.addEventListener('click',()=>openLightbox(i)); grid.append(card);
  });
}

const lightbox=document.querySelector('#lightbox'), lightImg=lightbox.querySelector('img'), lightCaption=lightbox.querySelector('figcaption'); let current=0, returnFocus=null;
function showPhoto(index){current=(index+photos.length)%photos.length;lightImg.src=photos[current].src;lightImg.alt=photos[current].alt;lightCaption.textContent=photos[current].caption;lightbox.querySelector('.lightbox-count').textContent=`${String(current+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;}
function openLightbox(i){if(!photos.length)return;returnFocus=document.activeElement;showPhoto(i);lightbox.classList.add('is-open');lightbox.setAttribute('aria-hidden','false');document.body.classList.add('locked');lightbox.querySelector('.lightbox-close').focus();}
function closeLightbox(){lightbox.classList.remove('is-open');lightbox.setAttribute('aria-hidden','true');document.body.classList.remove('locked');returnFocus?.focus();}
lightbox.querySelector('.lightbox-close').addEventListener('click',closeLightbox);
lightbox.querySelector('.prev').addEventListener('click',()=>showPhoto(current-1));lightbox.querySelector('.next').addEventListener('click',()=>showPhoto(current+1));
lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});
window.addEventListener('keydown',e=>{if(!lightbox.classList.contains('is-open'))return;if(e.key==='Escape')closeLightbox();if(e.key==='ArrowLeft')showPhoto(current-1);if(e.key==='ArrowRight')showPhoto(current+1);if(e.key==='Tab'){const controls=[...lightbox.querySelectorAll('button')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
let touchX=0;lightbox.addEventListener('touchstart',e=>touchX=e.changedTouches[0].screenX,{passive:true});lightbox.addEventListener('touchend',e=>{const d=e.changedTouches[0].screenX-touchX;if(Math.abs(d)>50)showPhoto(current+(d<0?1:-1));},{passive:true});

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Toshita's birthday is October 14, 2026 at midnight India time (IST, UTC+5:30).
const birthdayAt=Date.UTC(2026,9,13,18,30,0), countdown=document.querySelector('#birthday-countdown');
const countdownParts={days:document.querySelector('#count-days'),hours:document.querySelector('#count-hours'),minutes:document.querySelector('#count-minutes'),seconds:document.querySelector('#count-seconds')};
function updateBirthdayCountdown(){const remaining=birthdayAt-Date.now();if(remaining<=0){countdown.classList.add('birthday-arrived');countdown.querySelector('.countdown-units').hidden=true;return;}const total=Math.floor(remaining/1000);const values={days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60};for(const [unit,node] of Object.entries(countdownParts))node.textContent=String(values[unit]).padStart(2,'0');}
updateBirthdayCountdown();setInterval(updateBirthdayCountdown,1000);
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Chapter markers and a fine progress line make the long page feel guided.
const chapterLinks=[...document.querySelectorAll('.nav-links a')], chapterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){chapterLinks.forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));}}),{rootMargin:'-42% 0px -48% 0px',threshold:0});
['heart','gallery','memories','final'].forEach(id=>{const section=document.getElementById(id);if(section)chapterObserver.observe(section);});
const progressFill=document.querySelector('#progress-fill');let scrollQueued=false;
function updateReadingProgress(){const range=document.documentElement.scrollHeight-innerHeight;progressFill.style.transform=`scaleX(${range>0?scrollY/range:0})`;scrollQueued=false;}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateReadingProgress);}},{passive:true});updateReadingProgress();
const note=document.querySelector('.keepsake'),noteAction=note.querySelector('.keepsake-action');note.addEventListener('toggle',()=>{noteAction.innerHTML=note.open?'Close your note <b>−</b>':'Open your note <b>＋</b>';});

// One WebGL renderer and one animation loop for all ambient 3D elements.
const canvas=document.querySelector('#universe'); let renderer, scene, camera, stars, orbGroup, rings=[], crystal, pointLights=[], raf=0;
const pointer={x:0,y:0,tx:0,ty:0};
function initUniverse(){
  if(!window.WebGLRenderingContext)return;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'}); renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x1a0030,.0045);camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,600);camera.position.z=72;
    scene.add(new THREE.AmbientLight(0x9d5cff,.65));
    const starCount=innerWidth<600?1250:2500, positions=new Float32Array(starCount*3), colors=new Float32Array(starCount*3);const palette=[new THREE.Color('#fff3d1'),new THREE.Color('#ff91bd'),new THREE.Color('#b48cff')];
    for(let i=0;i<starCount;i++){positions[i*3]=(Math.random()-.5)*180;positions[i*3+1]=(Math.random()-.5)*110;positions[i*3+2]=(Math.random()-.5)*140;const c=palette[Math.floor(Math.random()*palette.length)];colors.set([c.r,c.g,c.b],i*3);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.13,vertexColors:true,transparent:true,opacity:.8,sizeAttenuation:true}));scene.add(stars);
    orbGroup=new THREE.Group();scene.add(orbGroup);
    const orbColors=[0xf5c842,0xff6b9d,0xffd6e7,0x7c3aed];for(let i=0;i<12;i++){const c=orbColors[i%4], radius=.45+Math.random()*.85;const m=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.33}));m.position.set((Math.random()-.5)*90,(Math.random()-.5)*55,(Math.random()-.5)*65);m.userData={y:m.position.y,phase:Math.random()*6.28,speed:.2+Math.random()*.35};orbGroup.add(m);}
    const ringMat=new THREE.MeshStandardMaterial({color:0xf5c842,metalness:.8,roughness:.3,transparent:true,opacity:.22});for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(3.2+i*.15,.035,8,80),ringMat);m.position.set((Math.random()-.5)*70,(Math.random()-.5)*40,-12-Math.random()*30);m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);m.userData={phase:Math.random()*6.28};scene.add(m);rings.push(m);}
    crystal=new THREE.Mesh(new THREE.IcosahedronGeometry(5,1),new THREE.MeshPhysicalMaterial({color:0xc8a7ff,metalness:.28,roughness:.12,transmission:.72,thickness:1.5,transparent:true,opacity:.16,wireframe:false}));crystal.position.set(0,2,-24);scene.add(crystal);scene.add(new THREE.Mesh(new THREE.IcosahedronGeometry(5.1,1),new THREE.MeshBasicMaterial({color:0xd6adff,wireframe:true,transparent:true,opacity:.13})).copy(crystal));
    [[0xff6b9d,-16,12,14],[0xf5c842,18,-10,10]].forEach(([color,x,y,intensity])=>{const l=new THREE.PointLight(color,intensity,100);l.position.set(x,y,5);scene.add(l);pointLights.push(l);});
    const tick=()=>{raf=requestAnimationFrame(tick);if(document.hidden)return;const t=performance.now()*.001;pointer.x+=(pointer.tx-pointer.x)*.025;pointer.y+=(pointer.ty-pointer.y)*.025;camera.position.x=pointer.x*4;camera.position.y=-pointer.y*3;camera.lookAt(0,0,0);stars.rotation.y=t*.006;stars.rotation.x=Math.sin(t*.04)*.025;orbGroup.children.forEach(o=>{o.position.y=o.userData.y+Math.sin(t*o.userData.speed+o.userData.phase)*1.4;o.position.x+=Math.sin(t*.08+o.userData.phase)*.002;});rings.forEach((r,i)=>{r.rotation.x+=.0008*(i+1);r.rotation.y+=.0012;r.position.y+=Math.sin(t*.3+r.userData.phase)*.002;});crystal.rotation.y=t*.1;crystal.rotation.x=t*.065;pointLights.forEach((l,i)=>{l.intensity=(i?8:13)+Math.sin(t*1.4+i*2)*2;});renderer.render(scene,camera);};tick();
  }catch(err){canvas.style.display='none';console.warn('WebGL background unavailable; CSS atmosphere remains active.',err);}
}
initUniverse();
addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);});
addEventListener('pointermove',e=>{pointer.tx=(e.clientX/innerWidth-.5)*2;pointer.ty=(e.clientY/innerHeight-.5)*2;},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&renderer&&!raf){const resume=()=>{raf=requestAnimationFrame(resume);if(!document.hidden)renderer.render(scene,camera);else raf=0;};resume();}});

// Confetti is dormant except for a small welcome flourish and button activations.
const confettiCanvas=document.querySelector('#confetti'), ctx=confettiCanvas.getContext('2d'), pieces=[], confettiColors=['#f5c842','#ff6b9d','#ffd6e7','#fff8f0','#9c6bff'];let confettiRaf=0;
function resizeConfetti(){const d=Math.min(devicePixelRatio||1,1.5);confettiCanvas.width=innerWidth*d;confettiCanvas.height=innerHeight*d;confettiCanvas.style.width=innerWidth+'px';confettiCanvas.style.height=innerHeight+'px';ctx.setTransform(d,0,0,d,0,0);}resizeConfetti();addEventListener('resize',resizeConfetti);
function burst(count=100){for(let i=0;i<count;i++)pieces.push({x:innerWidth/2+(Math.random()-.5)*60,y:innerHeight*.42+(Math.random()-.5)*40,vx:(Math.random()-.5)*8,vy:-2-Math.random()*8,g:.12+Math.random()*.1,size:3+Math.random()*5,rot:Math.random()*6,spin:(Math.random()-.5)*.2,color:confettiColors[i%confettiColors.length],life:100+Math.random()*70});if(!confettiRaf)drawConfetti();}
function drawConfetti(){confettiRaf=requestAnimationFrame(drawConfetti);ctx.clearRect(0,0,innerWidth,innerHeight);for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.rot+=p.spin;p.life--;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(1,p.life/25);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.65);ctx.restore();if(p.life<=0||p.y>innerHeight+20)pieces.splice(i,1);}if(!pieces.length){cancelAnimationFrame(confettiRaf);confettiRaf=0;ctx.clearRect(0,0,innerWidth,innerHeight);}}
if(!reduced)setTimeout(()=>burst(65),350);
const button=document.querySelector('#celebrate');button.addEventListener('click',()=>{burst(150);button.classList.remove('celebrating');void button.offsetWidth;button.classList.add('celebrating');document.querySelector('.decorations').classList.remove('pop');void document.querySelector('.decorations').offsetWidth;document.querySelector('.decorations').classList.add('pop');document.documentElement.classList.add('gold-flash');setTimeout(()=>document.documentElement.classList.remove('gold-flash'),1100);document.querySelector('#top').scrollIntoView({behavior:reduced?'auto':'smooth'});});

// Desktop-only custom cursor. A standard cursor remains for touch and keyboard users.
if(matchMedia('(pointer:fine)').matches&&!reduced){const core=document.querySelector('.cursor-core'),halo=document.querySelector('.cursor-halo');let cx=0,cy=0,hx=0,hy=0;document.body.classList.add('custom-cursor');addEventListener('pointermove',e=>{cx=e.clientX;cy=e.clientY;core.style.transform=`translate(${cx}px,${cy}px)`;},{passive:true});const follow=()=>{hx+=(cx-hx)*.18;hy+=(cy-hy)*.18;halo.style.transform=`translate(${hx}px,${hy}px)`;requestAnimationFrame(follow);};follow();document.addEventListener('pointerover',e=>{if(e.target.closest('a,button'))document.body.classList.add('cursor-hover');});document.addEventListener('pointerout',e=>{if(e.target.closest('a,button'))document.body.classList.remove('cursor-hover');});}

