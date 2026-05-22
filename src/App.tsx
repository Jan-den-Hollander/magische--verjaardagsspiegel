/**
 * Magische Spiegel — Verjaardagsspiegel
 * Efteling / Anton Piek stijl  ·  v2.0-nl
 * v2.0: muziek afgestemd op geboortejaar/decennium, Gemini API
 <!--
================================================================================
  Magische Spiegel — Verjaardagsspiegel
  Versie 2.0-nl — 2025
================================================================================
  Copyright (c) 2025 Jan den Hollander
  Alle rechten voorbehouden.
  Contact: jandenhollander@duck.com
================================================================================
-->
 */
import { useState, useRef, useEffect } from 'react';
import { Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ENV_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_KEY) || '';

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]);
    } catch (err) {
      const isLast = attempt === maxAttempts;
      const isRetryable = err?.message?.includes('timeout') ||
                          err?.message?.includes('503') ||
                          err?.message?.includes('overloaded') ||
                          err?.message?.includes('network');
      if (isLast || !isRetryable) throw err;
      await sleep(attempt * 1500);
    }
  }
}

// ── TTS Nederlands ────────────────────────────────────────────────────────
const getVoices = () => new Promise(resolve => {
  const v = window.speechSynthesis.getVoices();
  if (v.length) { resolve(v); return; }
  window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
  setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
});

async function speakWithFallback(text, onEnd = () => {}) {
  if (!text) { onEnd(); return; }
  window.speechSynthesis.cancel();
  const voices = await getVoices();
  const pick = voices.find(v => v.lang.startsWith('nl') && /female|woman|vrouw/i.test(v.name))
    || voices.find(v => v.lang.startsWith('nl'))
    || voices[0];
  const utt = new SpeechSynthesisUtterance(text);
  if (pick) utt.voice = pick;
  utt.lang = 'nl-NL';
  utt.rate = 0.88; utt.pitch = 1.1;
  utt.onend = onEnd; utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
  setTimeout(() => { try { window.speechSynthesis.cancel(); } catch {} }, text.length * 70 + 3000);
}

async function speakAll(boodschap, feitjes, onEnd = () => {}) {
  if (!boodschap) { onEnd(); return; }
  const feitjesTekst = feitjes.length > 0
    ? 'En wist je dat er op jouw verjaardag ook bijzondere dingen zijn gebeurd? '
      + feitjes.map(f => `In het jaar ${f.jaar}: ${f.nl}`).join('. ') + '.'
    : '';
  const volledigeTekst = feitjesTekst ? `${boodschap} ${feitjesTekst}` : boodschap;
  speakWithFallback(volledigeTekst, onEnd);
}

const STAP = { NAAM: 'naam', DATUM: 'datum', KLAAR: 'klaar' };

const GESPROKEN_V = {
  naam: 'Ik ben de Magische Spiegel. Vertel mij eens, hoe heet jij?',
  datum: (naam) => `Fijn om je te ontmoeten, ${naam}! Wanneer ben jij geboren? Zeg of typ je verjaardag.`,
};

// ── Muziek per decennium — internationale hits zoals Toppop & Top 2000 ────
function getMuziekInfo(geboortejaar) {
  if (!geboortejaar || geboortejaar < 1920) return null;

  if (geboortejaar >= 2010) {
    return {
      query: 'kinderliedjes tekenfilm thema nummers Peppa Pig Paw Patrol Bluey kids songs',
      label: 'De liedjes van jouw favoriete tekenfilms!',
      songs: 'Peppa Pig · Paw Patrol · Bluey · Baby Shark',
      emoji: '🎠',
    };
  }
  if (geboortejaar >= 2000) {
    return {
      query: 'top hits 2010s international playlist pop Adele Ed Sheeran Bruno Mars',
      label: "De hits van de jaren 2010 — jouw jeugd",
      songs: 'Adele · Ed Sheeran · Bruno Mars · Coldplay',
      emoji: '🎧',
    };
  }
  if (geboortejaar >= 1990) {
    return {
      query: 'top hits 2000s international playlist pop rock Britney Spears Eminem Beyonce',
      label: "De hits van de jaren 2000 — jouw gouden jaren",
      songs: 'Britney Spears · Eminem · Beyonce · Linkin Park',
      emoji: '💿',
    };
  }
  if (geboortejaar >= 1980) {
    return {
      query: 'top hits 90s international playlist pop rock Nirvana Madonna R.E.M. U2',
      label: "De hits van de jaren '90 — de muziek van jouw hart",
      songs: 'Nirvana · Madonna · U2 · R.E.M. · Alanis Morissette',
      emoji: '🎸',
    };
  }
  if (geboortejaar >= 1970) {
    return {
      query: 'top hits 80s international playlist pop rock Michael Jackson Prince Madonna',
      label: "De hits van de jaren '80 — de muziek van jouw jeugd",
      songs: 'Michael Jackson · Prince · Madonna · Dire Straits · The Police',
      emoji: '📻',
    };
  }
  if (geboortejaar >= 1960) {
    return {
      query: 'top hits 70s international playlist rock pop ABBA Eagles Fleetwood Mac Led Zeppelin',
      label: "De hits van de jaren '70 — jouw gouden jeugd",
      songs: 'ABBA · Eagles · Fleetwood Mac · Led Zeppelin · David Bowie',
      emoji: '🎤',
    };
  }
  if (geboortejaar >= 1950) {
    return {
      query: 'top hits 60s international playlist Beatles Rolling Stones Beach Boys Toppop',
      label: "De hits van de jaren '60 — Toppop-klassieken",
      songs: 'The Beatles · The Rolling Stones · Beach Boys · Simon & Garfunkel',
      emoji: '🎵',
    };
  }
  if (geboortejaar >= 1940) {
    return {
      query: 'top hits 50s international playlist Elvis Presley Doris Day Buddy Holly Che Sera Sera',
      label: "De liedjes van de jaren '50 — de muziek van jouw jeugd",
      songs: 'Elvis Presley · Doris Day · Buddy Holly · Chuck Berry',
      emoji: '🎶',
    };
  }
  return {
    query: 'classic hits 1940s international playlist big band swing Frank Sinatra',
    label: 'De grote klassiekers van jouw jeugd',
    songs: 'Frank Sinatra · Bing Crosby · Glenn Miller · Vera Lynn',
    emoji: '🎼',
  };
}

// ── Prompt Nederlands ─────────────────────────────────────────────────────
const buildPrompt = (naam, dag, maand, dagenTot, leeftijd, geboortejaar) => {
  const maandNaam = ['januari','februari','maart','april','mei','juni',
    'juli','augustus','september','oktober','november','december'][maand - 1];
  let timing = '';
  if (dagenTot === 0)               timing = 'VANDAAG is de verjaardag!';
  else if (dagenTot > 0 && dagenTot <= 7)  timing = `Over ${dagenTot} dag${dagenTot===1?'':'en'} is de verjaardag.`;
  else if (dagenTot < 0 && dagenTot >= -7) timing = `De verjaardag was ${Math.abs(dagenTot)} dag${Math.abs(dagenTot)===1?'':'en'} geleden.`;

  let toon = '';
  let feitjes_hint = '';

  if (leeftijd !== null && leeftijd <= 10) {
    toon = 'Spreek heel vrolijk, magisch en kindvriendelijk.';
    feitjes_hint = 'Kies leuke feitjes voor kinderen: dieren, speelgoed, tekenfilms, pretparken, uitvindingen.';
  } else if (leeftijd !== null && leeftijd <= 17) {
    toon = 'Spreek fris, energiek en passend voor jongeren.';
    feitjes_hint = 'Kies interessante feitjes voor jongeren: sport, muziek, film, technologie.';
  } else if (leeftijd !== null && leeftijd >= 80) {
    toon = 'Spreek met grote warmte, respect en bewondering voor een lang en rijk leven. Noem kort een muzikale herinnering uit de jaren van haar of zijn jeugd.';
    feitjes_hint = `Kies historische feitjes van ${dag} ${maandNaam} die passen bij de jeugdjaren van deze persoon (jaren ${geboortejaar ? Math.floor((geboortejaar+15)/10)*10 : '...'}-${geboortejaar ? Math.floor((geboortejaar+25)/10)*10 : '...'}).`;
  } else if (leeftijd !== null && leeftijd >= 60) {
    toon = 'Spreek warm en met vriendelijke nostalgie.';
    feitjes_hint = `Kies historische feitjes van ${dag} ${maandNaam} die interessant zijn voor volwassenen, bij voorkeur uit hun jeugdjaren.`;
  } else {
    toon = 'Spreek warm, vrolijk en respectvol.';
    feitjes_hint = `Kies echte historische feitjes van ${dag} ${maandNaam} die interessant zijn.`;
  }

  const leeftijdStr = leeftijd !== null ? `Leeftijd: ${leeftijd} jaar.` : '';
  const jaarStr = geboortejaar ? `Geboortejaar: ${geboortejaar}.` : '';

  return `Je bent de Magische Spiegel uit een betoverd sprookjesbos. ${toon} Spreek alleen Nederlands.

Persoon: ${naam} | Verjaardag: ${dag} ${maandNaam} | ${timing} ${leeftijdStr} ${jaarStr}

${feitjes_hint}

Geef een persoonlijke verjaardagsboodschap (max 3 zinnen) en precies 2 of 3 echte historische feitjes van ${dag} ${maandNaam}.

Antwoord ALLEEN als JSON zonder markdown:
{"nl":"...","feitjes":[{"jaar":1984,"nl":"..."}]}`;
};

// ── SVG lijst ─────────────────────────────────────────────────────────────
function ptOnEllipse(cx, cy, rx, ry, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
}

function OrnateFrame({ W = 270, H = 330 }) {
  const cx = W / 2, cy = H / 2;
  const rx = cx - 10, ry = cy - 10;
  const kransPunten = [
    { a:  0, emoji:'🌹', fs:22, off: 14, rot:  0 },
    { a: 14, emoji:'🍀', fs:15, off:  4, rot: 20 },
    { a: 25, emoji:'🌱', fs:13, off: -2, rot: 35 },
    { a: 37, emoji:'🥀', fs:17, off:  8, rot: 50 },
    { a: 50, emoji:'🍀', fs:14, off:  2, rot: 65 },
    { a: 63, emoji:'🌸', fs:20, off: 12, rot: 80 },
    { a: 76, emoji:'🌱', fs:12, off: -4, rot: 95 },
    { a: 87, emoji:'🍀', fs:15, off:  5, rot:110 },
    { a: 99, emoji:'🌹', fs:19, off: 11, rot:125 },
    { a:111, emoji:'🌱', fs:12, off: -3, rot:140 },
    { a:122, emoji:'🍀', fs:16, off:  6, rot:155 },
    { a:134, emoji:'🥀', fs:18, off: 13, rot:170 },
    { a:146, emoji:'🌱', fs:13, off: -2, rot:185 },
    { a:157, emoji:'🌸', fs:20, off: 14, rot:200 },
    { a:169, emoji:'🍀', fs:14, off:  3, rot:215 },
    { a:180, emoji:'🌹', fs:21, off: 14, rot:180 },
    { a:192, emoji:'🌱', fs:12, off: -4, rot:245 },
    { a:204, emoji:'🍀', fs:15, off:  5, rot:260 },
    { a:216, emoji:'🥀', fs:18, off: 12, rot:200 },
    { a:228, emoji:'🌱', fs:12, off: -3, rot:290 },
    { a:239, emoji:'🌸', fs:21, off: 15, rot:185 },
    { a:251, emoji:'🍀', fs:14, off:  4, rot:320 },
    { a:263, emoji:'🌹', fs:19, off: 12, rot:195 },
    { a:274, emoji:'🌱', fs:12, off: -4, rot:350 },
    { a:286, emoji:'🍀', fs:15, off:  5, rot: 10 },
    { a:298, emoji:'🌸', fs:20, off: 13, rot: 25 },
    { a:309, emoji:'🌱', fs:12, off: -2, rot: 40 },
    { a:320, emoji:'🥀', fs:17, off:  9, rot: 55 },
    { a:332, emoji:'🍀', fs:14, off:  3, rot: 70 },
    { a:344, emoji:'🌹', fs:20, off: 13, rot: -5 },
    { a:356, emoji:'🌱', fs:12, off: -3, rot: 10 },
  ];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2 }}>
      <defs>
        <linearGradient id="gG1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fff0a0"/>
          <stop offset="25%"  stopColor="#d4a017"/>
          <stop offset="55%"  stopColor="#b8860b"/>
          <stop offset="80%"  stopColor="#f0c040"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <linearGradient id="gG2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffe566"/>
          <stop offset="50%"  stopColor="#c49a0c"/>
          <stop offset="100%" stopColor="#f5e642"/>
        </linearGradient>
        <filter id="gGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="emojiShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0a1a04" floodOpacity="0.55"/>
        </filter>
        <filter id="roseShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#200010" floodOpacity="0.5"/>
        </filter>
      </defs>
      {(() => {
        const pts = Array.from({ length: 73 }, (_, i) => {
          const angle = i * 5;
          const wave = Math.sin(i * 0.9) * 6;
          const [x, y] = ptOnEllipse(cx, cy, rx + wave, ry + wave, angle);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        });
        return (
          <>
            <path d={pts.join(' ') + 'Z'} fill="none" stroke="#18420a" strokeWidth="5" opacity="0.6"/>
            <path d={pts.join(' ') + 'Z'} fill="none" stroke="#3d8e1e" strokeWidth="3" opacity="0.85"/>
            <path d={pts.join(' ') + 'Z'} fill="none" stroke="#7acc40" strokeWidth="1.2" opacity="0.28" strokeDasharray="3 9"/>
          </>
        );
      })()}
      <ellipse cx={cx} cy={cy} rx={rx}    ry={ry}    fill="none" stroke="url(#gG1)" strokeWidth="5.5"/>
      <ellipse cx={cx} cy={cy} rx={rx-8}  ry={ry-8}  fill="none" stroke="url(#gG2)" strokeWidth="1.6" opacity="0.6"/>
      <ellipse cx={cx} cy={cy} rx={rx-13} ry={ry-13} fill="none" stroke="#f5e642"   strokeWidth="0.5" opacity="0.18"/>
      {kransPunten.filter(p => ['🌱','🍀'].includes(p.emoji)).map((p, i) => {
        const [px, py] = ptOnEllipse(cx, cy, rx + p.off, ry + p.off, p.a);
        return <text key={`g${i}`} x={px} y={py} fontSize={p.fs} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(${p.rot},${px},${py})`} filter="url(#emojiShadow)" style={{ userSelect:'none' }}>{p.emoji}</text>;
      })}
      {kransPunten.filter(p => ['🌹','🥀','🌸'].includes(p.emoji)).map((p, i) => {
        const [px, py] = ptOnEllipse(cx, cy, rx + p.off, ry + p.off, p.a);
        return <text key={`f${i}`} x={px} y={py} fontSize={p.fs} textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(${p.rot},${px},${py})`} filter="url(#roseShadow)" style={{ userSelect:'none' }}>{p.emoji}</text>;
      })}
      <circle cx={cx} cy={13} r={23} fill="url(#gG1)" filter="url(#gGlow)"/>
      <circle cx={cx} cy={13} r={19} fill="#100802"/>
      <circle cx={cx} cy={13} r={17} fill="url(#gG1)" opacity="0.08"/>
      <text x={cx} y={20} textAnchor="middle" fontSize="18" style={{ userSelect:'none' }}>🪞</text>
      <line x1={cx} y1={36} x2={cx} y2={cy-ry} stroke="url(#gG1)" strokeWidth="2.5" opacity="0.75"/>
      <circle cx={cx} cy={37} r={3.5} fill="url(#gG1)"/>
      <path d={`M${cx-42} ${H-18} Q${cx} ${H-4} ${cx+42} ${H-18}`} fill="none" stroke="url(#gG1)" strokeWidth="2.5"/>
      <circle cx={cx} cy={H-4} r={5} fill="url(#gG1)"/>
      {[-24,24].map((dx, i) => <circle key={i} cx={cx+dx} cy={H-14} r={3} fill="#d4a017" opacity="0.72"/>)}
      {[[cx,cy-ry-18],[cx,cy+ry+12],[cx-rx-12,cy],[cx+rx+12,cy]].map(([ex,ey],i) => (
        <text key={`sp${i}`} x={ex} y={ey} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" opacity="0.55" style={{ userSelect:'none' }}>✨</text>
      ))}
    </svg>
  );
}

// ── Vuurvliegjes & deeltjes ───────────────────────────────────────────────
const FIREFLIES = Array.from({ length: 16 }, (_, i) => ({
  id: i, x: Math.random()*100, y: Math.random()*100,
  delay: Math.random()*4, dur: 3 + Math.random()*3,
  dx: (Math.random()-0.5)*60, dy: (Math.random()-0.5)*40,
}));
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i, x: 10+Math.random()*80, y: 10+Math.random()*80,
  size: 4+Math.random()*7, delay: Math.random()*3, dur: 2+Math.random()*2,
  color: ['#f5e642','#fff8c0','#ffb347','#ff9de2','#a8edea'][i%5],
}));

// ── Setup overlay ─────────────────────────────────────────────────────────
function SetupOverlay({ stap, naam, setNaam, datumInput, setDatumInput,
  geboortejaar, setGeboortejaar, onLuister, isListening, luisterDoel, onBevestig }) {
  const isNaam = stap === STAP.NAAM;
  return (
    <motion.div key={stap}
      initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
      exit={{ opacity:0, scale:0.92 }}
      style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'16px 18px',
        background:'rgba(14,7,28,0.94)', borderRadius:'50% 50% 47% 47%', zIndex:10, gap:10 }}>
      <div style={{ fontSize:26 }}>{isNaam ? '🪄🥁🎁' : '🎂'}</div>
      <p style={{ color:'#f5e642', fontSize:12, textAlign:'center', margin:0,
        lineHeight:1.55, fontFamily:"'IM Fell English', serif",
        textShadow:'0 0 10px rgba(245,230,66,0.48)' }}>
        {isNaam ? 'Ik ben de Magische Verjaardagsspiegel. Hoe heet jij?'
                : `Wanneer ben jij geboren, ${naam}?`}
      </p>
      <input
        value={isNaam ? naam : datumInput}
        onChange={e => isNaam ? setNaam(e.target.value) : setDatumInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onBevestig()}
        placeholder={isNaam ? 'Typ je naam...' : '4 april of 15-04'}
        inputMode={isNaam ? 'text' : 'numeric'}
        autoFocus
        style={{ background:'rgba(245,230,66,0.07)', border:'1px solid rgba(245,230,66,0.38)',
          borderRadius:12, padding:'8px 12px', color:'#f5e642', fontSize:15,
          textAlign:'center', outline:'none', fontFamily:"'IM Fell English', serif", width:'85%' }}
      />
      {!isNaam && (
        <input
          value={geboortejaar}
          onChange={e => setGeboortejaar(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onBevestig()}
          placeholder="Geboortejaar (bijv. 1965)"
          inputMode="numeric"
          style={{ background:'rgba(245,230,66,0.05)', border:'1px solid rgba(245,230,66,0.20)',
            borderRadius:12, padding:'6px 12px', color:'rgba(245,230,66,0.7)', fontSize:13,
            textAlign:'center', outline:'none', fontFamily:"'IM Fell English', serif", width:'85%' }}
        />
      )}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={() => onLuister(stap)} style={{
          width:40, height:40, borderRadius:'50%',
          background: isListening && luisterDoel===stap ? 'rgba(200,50,50,0.85)' : 'rgba(245,230,66,0.11)',
          border:'1.5px solid rgba(245,230,66,0.42)', cursor:'pointer', fontSize:17,
          display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
          title="Spreek je antwoord in">
          {isListening && luisterDoel===stap ? '🔴' : '🎤'}
        </button>
        <button onClick={onBevestig} style={{
          padding:'9px 20px', borderRadius:22,
          background:'linear-gradient(135deg,#d4a017,#f5e642)',
          border:'none', color:'#180c00', fontWeight:700, fontSize:13, cursor:'pointer',
          fontFamily:"'IM Fell English', serif",
          boxShadow:'0 2px 14px rgba(212,160,23,0.52)', letterSpacing:'0.04em' }}>
          {isNaam ? 'Verder ✨' : 'Toon mijn boodschap 🪄'}
        </button>
      </div>
      {!isNaam && (
        <p style={{ fontSize:9, color:'rgba(245,230,66,0.32)', margin:0, textAlign:'center' }}>
          Bijv: 4 april · april 4 · 15-04
        </p>
      )}
    </motion.div>
  );
}

// ── Tekstballon ───────────────────────────────────────────────────────────
function TekstBallon({ bericht, onSpreek }) {
  if (!bericht) return null;
  const tekst = bericht.nl || '';
  const feitjes = bericht.feitjes || [];
  return (
    <motion.div
      initial={{ opacity:0, y:18, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8 }}
      style={{ width:'100%', background:'linear-gradient(160deg,rgba(36,20,6,0.98),rgba(20,11,3,0.99))',
        border:'2px solid rgba(212,160,23,0.52)', borderRadius:18, padding:'13px 16px',
        boxShadow:'0 8px 28px rgba(0,0,0,0.65),0 0 18px rgba(212,160,23,0.07)', position:'relative' }}>
      <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
        width:0, height:0, borderLeft:'9px solid transparent',
        borderRight:'9px solid transparent', borderBottom:'12px solid rgba(212,160,23,0.52)' }}/>
      <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)',
        width:0, height:0, borderLeft:'7px solid transparent',
        borderRight:'7px solid transparent', borderBottom:'10px solid rgba(36,20,6,0.98)' }}/>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <button onClick={onSpreek} style={{ background:'none', border:'none',
          cursor:'pointer', fontSize:18, opacity:0.6, padding:'0 2px' }}>🔊</button>
      </div>
      <p style={{ margin:'0 0 10px', color:'#f5e642', lineHeight:1.7, fontSize:14,
        fontFamily:"'IM Fell English', serif",
        textShadow:'0 0 8px rgba(245,230,66,0.22)' }}>✨ {tekst}</p>
      {feitjes.length > 0 && (
        <div style={{ borderTop:'1px solid rgba(212,160,23,0.16)', paddingTop:8,
          display:'flex', flexDirection:'column', gap:5 }}>
          <p style={{ margin:0, fontSize:9, color:'rgba(212,160,23,0.46)',
            letterSpacing:'0.14em', textTransform:'uppercase' }}>
            ✦ Op jouw verjaardag in het verleden ✦
          </p>
          {feitjes.map((f,i) => (
            <div key={i} style={{ background:'rgba(245,230,66,0.04)',
              border:'1px solid rgba(212,160,12,0.12)', borderRadius:9, padding:'5px 10px' }}>
              <span style={{ color:'#d4a017', fontSize:10, fontWeight:700 }}>{f.jaar} · </span>
              <span style={{ color:'rgba(245,230,66,0.7)', fontSize:11, fontStyle:'italic' }}>{f.nl}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Muziekknop ────────────────────────────────────────────────────────────
function MuziekKnop({ geboortejaar }) {
  const [geklikt, setGeklikt] = useState(false);
  const info = getMuziekInfo(geboortejaar);
  if (!info) return null;

  const openPlaylist = () => {
    setGeklikt(true);
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(info.query)}`,
      '_blank'
    );
    setTimeout(() => setGeklikt(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:2.2 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6,
        position:'relative', zIndex:5, marginTop:6 }}>
      <button onClick={openPlaylist} style={{
        padding:'10px 22px',
        background: geklikt
          ? 'linear-gradient(135deg,#1a6b1a,#2ecc2e)'
          : 'linear-gradient(135deg,#7b0d0d,#c0392b,#e74c3c)',
        border:'none', borderRadius:28, color:'#fff', fontWeight:700, fontSize:13,
        cursor:'pointer', fontFamily:"'IM Fell English', serif", letterSpacing:'0.06em',
        boxShadow: geklikt
          ? '0 4px 18px rgba(46,204,46,0.5)'
          : '0 4px 18px rgba(192,57,43,0.55),0 0 28px rgba(231,76,60,0.18)',
        transition:'all 0.4s ease', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:18 }}>{geklikt ? '✅' : info.emoji}</span>
        {geklikt ? 'Veel luisterplezier!' : info.label}
      </button>
      <p style={{ margin:0, fontSize:9, color:'rgba(245,230,66,0.28)',
        fontStyle:'italic', textAlign:'center', maxWidth:300 }}>
        {info.songs}
      </p>
    </motion.div>
  );
}

// ── Hoofd component ───────────────────────────────────────────────────────
export default function MagischeSpiegel() {
  const [stap, setStap]                   = useState(STAP.NAAM);
  const [naam, setNaam]                   = useState('');
  const [datumInput, setDatumInput]       = useState('');
  const [geboortejaar, setGeboortejaar]   = useState('');
  const [leeftijd, setLeeftijd]           = useState(null);
  const [opgelostJaar, setOpgelostJaar]   = useState(null);
  const [bericht, setBericht]             = useState(null);
  const [status, setStatus]               = useState('');
  const [isListening, setIsListening]     = useState(false);
  const [luisterDoel, setLuisterDoel]     = useState(null);
  const [isDenkend, setIsDenkend]         = useState(false);
  const [isSpreekend, setIsSpreekend]     = useState(false);
  const [dagenInfo, setDagenInfo]         = useState(null);
  const [toonSleutelModal, setToonSleutelModal] = useState(false);
  const [apiSleutel, setApiSleutel] = useState(() => {
    if (ENV_KEY) return ENV_KEY;
    try { return localStorage.getItem('magische_spiegel_gemini_key') || ''; } catch { return ''; }
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const parsedDateRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {}
    })();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const delay = setTimeout(() => {
      if (cancelled) return;
      if (stap === STAP.NAAM) {
        setIsSpreekend(true);
        speakWithFallback(GESPROKEN_V.naam, () => { if (!cancelled) setIsSpreekend(false); });
      } else if (stap === STAP.DATUM && naam) {
        setIsSpreekend(true);
        speakWithFallback(GESPROKEN_V.datum(naam), () => { if (!cancelled) setIsSpreekend(false); });
      }
    }, stap === STAP.NAAM ? 900 : 400);
    return () => { cancelled = true; clearTimeout(delay); };
  }, [stap]);

  const parseerDatum = (input) => {
    const raw = input.trim().toLowerCase();
    const MAANDEN = {
      januari:1,jan:1,january:1,
      februari:2,feb:2,february:2,
      maart:3,mrt:3,mar:3,march:3,
      april:4,apr:4,
      mei:5,may:5,
      juni:6,jun:6,june:6,
      juli:7,jul:7,july:7,
      augustus:8,aug:8,
      september:9,sep:9,sept:9,
      oktober:10,okt:10,oct:10,october:10,
      november:11,nov:11,
      december:12,dec:12,
    };
    const maandPat = Object.keys(MAANDEN).join('|');
    const maandMatch = raw.match(new RegExp(`\\b(${maandPat})\\b`));
    if (maandMatch) {
      const maand = MAANDEN[maandMatch[1]];
      const nums = raw.match(/\d+/g)?.map(Number) || [];
      const dag = nums.find(n => n >= 1 && n <= 31);
      if (dag && maand) return { dag, maand };
    }
    const clean = raw.replace(/[\/\.\s]/g, '-');
    const parts = clean.split('-').map(p => parseInt(p, 10));
    if (parts.length >= 2) {
      const [a, b] = parts;
      if (a >= 1 && a <= 31 && b >= 1 && b <= 12) return { dag:a, maand:b };
      if (b >= 1 && b <= 31 && a >= 1 && a <= 12) return { dag:b, maand:a };
    }
    return null;
  };

  const berekenDagen = (dag, maand) => {
    const nu = new Date(), j = nu.getFullYear();
    let vj = new Date(j, maand-1, dag);
    const diff = Math.round((vj - nu) / 86400000);
    if (diff > 180)  { vj = new Date(j-1, maand-1, dag); return Math.round((vj-nu)/86400000); }
    if (diff < -180) { vj = new Date(j+1, maand-1, dag); return Math.round((vj-nu)/86400000); }
    return diff;
  };

  const bevestigNaam = () => {
    if (!naam.trim()) { setStatus('Vertel mij eerst hoe je heet! 🌟'); return; }
    setStatus(''); setStap(STAP.DATUM);
  };

  const bevestigDatum = () => {
    const parsed = parseerDatum(datumInput);
    if (!parsed) { setStatus('Ik begrijp de datum niet. Zeg bijv. 4 april of 15-04 ✨'); return; }
    const dagen = berekenDagen(parsed.dag, parsed.maand);
    parsedDateRef.current = { ...parsed, dagen };
    setDagenInfo(dagen);

    let berekendeLeeftijd = null;
    const jaarGetal = parseInt(geboortejaar, 10);
    if (jaarGetal >= 1900 && jaarGetal <= new Date().getFullYear()) {
      berekendeLeeftijd = new Date().getFullYear() - jaarGetal;
      if (dagen > 0) berekendeLeeftijd -= 1;
      setLeeftijd(berekendeLeeftijd);
      setOpgelostJaar(jaarGetal);
    }

    setStatus(''); setStap(STAP.KLAAR);
    haalBericht(naam, parsed.dag, parsed.maand, dagen, berekendeLeeftijd, jaarGetal || null);
  };

  const startLuisteren = (doel) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('Microfoon werkt niet in deze browser 🎤'); return; }
    try { recRef.current?.stop(); } catch {}
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'nl-NL'; rec.continuous = false; rec.interimResults = false;
    rec.onstart  = () => { setIsListening(true);  setLuisterDoel(doel); setStatus('Ik luister... 👂'); };
    rec.onend    = () => { setIsListening(false); setLuisterDoel(null); setStatus(''); };
    rec.onerror  = () => { setIsListening(false); setLuisterDoel(null); setStatus('Niet goed gehoord 🌟'); };
    rec.onresult = (e) => {
      const gehoord = e.results[0][0].transcript;
      if (doel === STAP.NAAM) setNaam(gehoord.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '').trim());
      else setDatumInput(gehoord);
    };
    rec.start();
  };

  const bouwFallback = (n, dag, maand, dagenTot) => {
    const maanden = ['januari','februari','maart','april','mei','juni',
      'juli','augustus','september','oktober','november','december'];
    const maandNaam = maanden[maand - 1];
    let begroeting = '';
    if (dagenTot === 0)
      begroeting = `Vandaag is jouw grote dag, ${n}! De hele wereld is blij dat jij er bent!`;
    else if (dagenTot > 0 && dagenTot <= 7)
      begroeting = `Nog maar ${dagenTot} dag${dagenTot===1?'':'en'} te gaan, ${n}! Jouw verjaardag komt er heel snel aan!`;
    else if (dagenTot < 0 && dagenTot >= -7)
      begroeting = `Gefeliciteerd, ${n}! ${Math.abs(dagenTot)} dag${Math.abs(dagenTot)===1?'':'en'} geleden was jouw bijzondere dag.`;
    else
      begroeting = `Wat bijzonder dat jij op ${dag} ${maandNaam} geboren bent, ${n}! Dat is een heel magische dag!`;

    const boodschap = `${begroeting} De Magische Spiegel weet zeker dat jij een heel speciaal iemand bent, want op jouw verjaardag schijnt er altijd een beetje extra magie in de lucht. Sluit je ogen en maak een wens — soms komen die echt uit! ✨`;

    const seizoenFeitjes = {
      winter: [
        { jaar: 1812, nl: 'Schreven de gebroeders Grimm hun eerste sprookjesboek vol magische verhalen.' },
        { jaar: 1956, nl: 'Zong Doris Day "Que Sera Sera" — een liedje dat de hele wereld betoverde.' },
        { jaar: 1955, nl: 'Opende het eerste Disneyland zijn poorten, een echt sprookjespark.' },
      ],
      lente: [
        { jaar: 1967, nl: 'Brachten The Beatles "Sgt. Peppers Lonely Hearts Club Band" uit — een mijlpaal in de muziek.' },
        { jaar: 1937, nl: 'Was Sneeuwwitje de eerste lange animatiefilm ooit.' },
        { jaar: 1977, nl: 'Vloog Luke Skywalker voor het eerst door de sterren in Star Wars.' },
      ],
      zomer: [
        { jaar: 1969, nl: 'Zette Neil Armstrong als eerste mens voet op de maan.' },
        { jaar: 1958, nl: 'Bracht Elvis Presley "Hound Dog" uit en veroverde de hele wereld.' },
        { jaar: 1997, nl: 'Besteeg Harry Potter voor het eerst zijn bezem en vloog naar Zweinstein.' },
      ],
      herfst: [
        { jaar: 1962, nl: 'Brachten The Beatles hun allereerste single "Love Me Do" uit.' },
        { jaar: 1928, nl: 'Piepte Mickey Mouse voor het eerst, het begin van een magische wereld.' },
        { jaar: 1889, nl: 'Opende de Eiffeltoren zijn deuren — zo hoog als een tovenaarshoed!' },
      ],
    };
    const seizoen = [12,1,2].includes(maand) ? 'winter'
      : [3,4,5].includes(maand) ? 'lente'
      : [6,7,8].includes(maand) ? 'zomer' : 'herfst';

    return { nl: boodschap, feitjes: seizoenFeitjes[seizoen], _isFallback: true };
  };

  const haalBericht = async (n, dag, maand, dagen, berekendeLeeftijd = null, jaarGetal = null) => {
    if (!apiSleutel) { setStatus('Geen API sleutel ingesteld 🔑'); return; }
    setIsDenkend(true); setBericht(null);
    setStatus('De spiegel denkt na... ✨');
    try {
      const resp = await fetchWithRetry(() =>
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiSleutel}`,
          {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              contents:[{ parts:[{ text: buildPrompt(n, dag, maand, dagen, berekendeLeeftijd, jaarGetal) }] }],
              generationConfig:{ temperature:0.9, maxOutputTokens:1000 },
            }),
          }
        ).then(r => r.json())
      );
      if (resp.error) throw new Error(resp.error.message || 'API fout');
      const raw = resp.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const data = JSON.parse(raw.replace(/```json|```/g,'').trim());
      setBericht(data); setStatus('');
      if (data.nl) {
        setIsSpreekend(true);
        speakAll(data.nl, data.feitjes || [], () => setIsSpreekend(false));
      }
    } catch (err) {
      const fallback = bouwFallback(n, dag, maand, dagen);
      setBericht(fallback);
      setStatus('✨ De spiegel spreekt vanuit haar hart...');
      setTimeout(() => setStatus(''), 3500);
      setIsSpreekend(true);
      speakAll(fallback.nl, fallback.feitjes || [], () => setIsSpreekend(false));
    }
    setIsDenkend(false);
  };

  const herstart = () => {
    window.speechSynthesis.cancel();
    setStap(STAP.NAAM); setNaam(''); setDatumInput(''); setGeboortejaar('');
    setBericht(null); setDagenInfo(null); setLeeftijd(null); setOpgelostJaar(null);
    setStatus(''); setIsSpreekend(false);
    parsedDateRef.current = null;
  };

  const slaSleutelOp = (k) => {
    setApiSleutel(k);
    try { localStorage.setItem('magische_spiegel_gemini_key', k); } catch {}
    setToonSleutelModal(false);
  };

  const banner = (() => {
    if (dagenInfo === null) return null;
    if (dagenInfo === 0)              return { tekst:'🎂 Vandaag is jouw grote dag!', kleur:'#f5e642' };
    if (dagenInfo>0 && dagenInfo<=7)  return { tekst:`⏳ Nog ${dagenInfo} dag${dagenInfo===1?'':'en'} tot jouw verjaardag!`, kleur:'#ffb347' };
    if (dagenInfo<0 && dagenInfo>=-7) return { tekst:`🎉 Gefeliciteerd! ${Math.abs(dagenInfo)} dag${Math.abs(dagenInfo)===1?'':'en'} geleden!`, kleur:'#a8edea' };
    return null;
  })();

  const isKlaar = stap === STAP.KLAAR;

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <div style={S.bg}/><div style={S.bgForest}/>

      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {FIREFLIES.map(f => (
          <div key={f.id} style={{ position:'absolute', left:`${f.x}%`, top:`${f.y}%`,
            width:5, height:5, borderRadius:'50%', background:'#f5e642',
            boxShadow:'0 0 7px #f5e642, 0 0 14px rgba(245,230,66,0.38)',
            animation:`ffloat ${f.dur}s ease-in-out ${f.delay}s infinite`,
            '--dx':`${f.dx}px`, '--dy':`${f.dy}px` }}/>
        ))}
      </div>

      <header style={S.header}>
        <h1 style={S.title}>✦ Magische Spiegel ✦</h1>
        <p style={S.subtitle}>Vertel mij wie jij bent...</p>
      </header>

      <AnimatePresence>
        {bericht && (
          <div style={{ width:'100%', maxWidth:430, padding:'0 12px', marginBottom:4, position:'relative', zIndex:5 }}>
            <TekstBallon bericht={bericht}
              onSpreek={() => { setIsSpreekend(true); speakAll(bericht.nl, bericht.feitjes || [], () => setIsSpreekend(false)); }}/>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {banner && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ ...S.banner, borderColor:banner.kleur, color:banner.kleur }}>
            {banner.tekst}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ ...S.mirrorWrap, marginTop:10 }}>
        <OrnateFrame W={270} H={330}/>
        <div style={S.mirrorGlass}>
          <video ref={videoRef} autoPlay playsInline muted style={S.video}/>
          {isKlaar && bericht && (
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden',
              borderRadius:'50% 50% 47% 47%', zIndex:3 }}>
              {PARTICLES.map(p => (
                <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
                  width:p.size, height:p.size, borderRadius:'50%', background:p.color, opacity:0,
                  animation:`sparkle ${p.dur}s ease-in-out ${p.delay}s infinite`,
                  boxShadow:`0 0 ${p.size}px ${p.color}` }}/>
              ))}
            </div>
          )}
          <AnimatePresence>
            {stap !== STAP.KLAAR && (
              <SetupOverlay stap={stap}
                naam={naam} setNaam={setNaam}
                datumInput={datumInput} setDatumInput={setDatumInput}
                geboortejaar={geboortejaar} setGeboortejaar={setGeboortejaar}
                onLuister={startLuisteren}
                isListening={isListening} luisterDoel={luisterDoel}
                onBevestig={stap===STAP.NAAM ? bevestigNaam : bevestigDatum}/>
            )}
          </AnimatePresence>
          {isDenkend && (
            <div style={{ position:'absolute', bottom:14, left:'50%',
              transform:'translateX(-50%)', display:'flex', gap:6, zIndex:15 }}>
              {[0,200,400].map((d,i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#f5e642',
                  animation:`bounce 1s ease-in-out ${d}ms infinite`, boxShadow:'0 0 6px #f5e642' }}/>
              ))}
            </div>
          )}
          {isSpreekend && (
            <div style={{ position:'absolute', inset:-4, borderRadius:'50% 50% 47% 47%',
              border:'3px solid #f5e642', animation:'speakRing 1s ease-in-out infinite',
              pointerEvents:'none', zIndex:4 }}/>
          )}
        </div>
        {isKlaar && naam && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={S.nameBadge}>
            ✦ {naam} ✦
          </motion.div>
        )}
      </div>

      {status ? <p style={S.status}>{status}</p> : null}

      <AnimatePresence>
        {bericht?._isFallback && !isDenkend && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ margin:'2px 0 0', fontSize:10, color:'rgba(245,230,66,0.32)',
              fontStyle:'italic', textAlign:'center', position:'relative', zIndex:5 }}>
            ✦ De spiegel spreekt vanuit haar eigen magische geheugen ✦
          </motion.p>
        )}
      </AnimatePresence>

      {isKlaar && !isDenkend && bericht && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:1.8 }}
          style={{ marginTop:14, display:'flex', flexDirection:'column',
            alignItems:'center', gap:5, position:'relative', zIndex:5 }}>
          <button onClick={herstart} style={S.btnNext}>
            ✨ Tot Volgend Jaar ✨
          </button>
          <p style={{ margin:0, fontSize:10, color:'rgba(245,230,66,0.26)', fontStyle:'italic' }}>
            Tik hier om opnieuw te beginnen
          </p>
        </motion.div>
      )}

      {isKlaar && !isDenkend && bericht && opgelostJaar && (
        <MuziekKnop geboortejaar={opgelostJaar} />
      )}

      {!ENV_KEY && (
        <button onClick={() => setToonSleutelModal(true)} style={S.btnKey}>
          <Key size={10} style={{ marginRight:4 }}/>
          {apiSleutel ? 'API sleutel ✓' : 'API sleutel instellen'}
        </button>
      )}

      <AnimatePresence>
        {toonSleutelModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={S.modal} onClick={e => e.target===e.currentTarget && setToonSleutelModal(false)}>
            <div style={S.modalBox}>
              <h2 style={S.modalTitle}>🔑 API Sleutel</h2>
              <p style={S.modalHint}>
                Voer de Gemini API sleutel in (Google AI Studio).<br/>
                Wordt alleen op dit apparaat opgeslagen.
              </p>
              <input type="password" id="keyInp" defaultValue={apiSleutel}
                placeholder="AIza..." style={S.modalInput}/>
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={() => setToonSleutelModal(false)} style={S.modalCancel}>Annuleer</button>
                <button onClick={() => slaSleutelOp(document.getElementById('keyInp').value)}
                  style={S.modalSave}>Opslaan</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
  * { box-sizing:border-box; }
  input::placeholder { color:rgba(245,230,66,0.26); }
  @keyframes ffloat {
    0%   { opacity:0; transform:translate(0,0); }
    25%  { opacity:0.82; }
    50%  { opacity:0.28; transform:translate(var(--dx,20px),var(--dy,-15px)); }
    75%  { opacity:0.68; }
    100% { opacity:0; transform:translate(0,0); }
  }
  @keyframes sparkle {
    0%,100% { opacity:0; transform:scale(0.5); }
    50%     { opacity:0.88; transform:scale(1.2); }
  }
  @keyframes bounce {
    0%,100% { transform:translateY(0); opacity:0.38; }
    50%     { transform:translateY(-6px); opacity:1; }
  }
  @keyframes speakRing {
    0%,100% { opacity:0.32; transform:scale(1); }
    50%     { opacity:1; transform:scale(1.05); }
  }
  @keyframes mirrorPulse {
    0%,100% { box-shadow:0 0 32px rgba(212,160,23,0.22),0 0 65px rgba(212,160,23,0.07),inset 0 0 26px rgba(0,0,0,0.55); }
    50%     { box-shadow:0 0 52px rgba(212,160,23,0.42),0 0 105px rgba(212,160,23,0.14),inset 0 0 26px rgba(0,0,0,0.55); }
  }
  @keyframes titleShimmer {
    0%,100% { text-shadow:0 0 10px rgba(245,230,66,0.42),0 2px 4px rgba(0,0,0,0.8); }
    50%     { text-shadow:0 0 22px rgba(245,230,66,0.88),0 0 42px rgba(245,230,66,0.32),0 2px 4px rgba(0,0,0,0.8); }
  }
  @keyframes bannerGlow {
    0%,100% { box-shadow:0 0 9px rgba(245,230,66,0.2); }
    50%     { box-shadow:0 0 20px rgba(245,230,66,0.56); }
  }
`;

const S = {
  app: { minHeight:'100vh', background:'#0b0802', color:'#f0e8d0',
    fontFamily:"'IM Fell English', serif", display:'flex', flexDirection:'column',
    alignItems:'center', padding:'0 0 44px', position:'relative', overflow:'hidden' },
  bg: { position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
    background:'radial-gradient(ellipse at 50% 0%,rgba(52,30,4,0.78) 0%,rgba(7,4,2,0.95) 60%,#030200 100%)' },
  bgForest: { position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
    background:`radial-gradient(ellipse at 12% 90%,rgba(16,42,7,0.3) 0%,transparent 50%),
      radial-gradient(ellipse at 88% 90%,rgba(16,42,7,0.3) 0%,transparent 50%),
      radial-gradient(ellipse at 50% 100%,rgba(26,52,7,0.38) 0%,transparent 38%)` },
  header: { width:'100%', maxWidth:480, padding:'6px 16px 3px',
    display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:5 },
  title: { margin:'0 0 2px', fontSize:22, fontWeight:700, color:'#f5e642',
    animation:'titleShimmer 3s ease-in-out infinite', letterSpacing:'0.05em' },
  subtitle: { margin:'3px 0 0', fontSize:11, color:'rgba(245,230,66,0.38)',
    letterSpacing:'0.14em', fontStyle:'italic' },
  banner: { width:'100%', maxWidth:420, margin:'0 12px 6px', padding:'7px 16px',
    background:'rgba(16,9,0,0.86)', border:'1px solid', borderRadius:20, fontSize:13,
    textAlign:'center', fontStyle:'italic', letterSpacing:'0.04em', zIndex:5, position:'relative',
    animation:'bannerGlow 2.5s ease-in-out infinite' },
  mirrorWrap: { position:'relative', width:270, height:330, display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:5, marginBottom:6 },
  mirrorGlass: { position:'absolute', top:18, left:22, width:226, height:290,
    borderRadius:'50% 50% 47% 47%', overflow:'hidden',
    background:'linear-gradient(160deg,#0b1606 0%,#030702 100%)',
    animation:'mirrorPulse 4s ease-in-out infinite', zIndex:1 },
  video: { width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)',
    filter:'brightness(0.82) contrast(1.06) saturate(0.76)' },
  nameBadge: { position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)',
    background:'linear-gradient(135deg,rgba(26,14,2,0.96),rgba(16,9,0,0.96))',
    border:'1px solid rgba(212,160,23,0.46)', borderRadius:20, padding:'4px 18px',
    fontSize:12, color:'#f5e642', whiteSpace:'nowrap', zIndex:10,
    letterSpacing:'0.08em', boxShadow:'0 2px 10px rgba(0,0,0,0.5)' },
  status: { fontSize:12, color:'rgba(245,230,66,0.55)', fontStyle:'italic', margin:'4px 12px',
    zIndex:5, textAlign:'center', position:'relative', maxWidth:380, lineHeight:1.6 },
  btnNext: { padding:'11px 28px',
    background:'linear-gradient(135deg,#8B6914,#d4a017,#f5e642,#d4a017,#8B6914)',
    backgroundSize:'200% auto', border:'none', borderRadius:30, color:'#160b00',
    fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:"'IM Fell English', serif",
    letterSpacing:'0.08em', boxShadow:'0 4px 18px rgba(212,160,23,0.46),0 0 34px rgba(212,160,23,0.16)' },
  btnKey: { marginTop:14, padding:'5px 14px', background:'transparent',
    border:'1px solid rgba(212,160,23,0.13)', borderRadius:20, fontSize:10,
    color:'rgba(212,160,12,0.36)', letterSpacing:'0.1em', cursor:'pointer',
    display:'flex', alignItems:'center', position:'relative', zIndex:5,
    fontFamily:"'IM Fell English', serif" },
  modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.88)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modalBox: { background:'linear-gradient(160deg,#160c05,#0a0502)',
    border:'2px solid rgba(212,160,23,0.46)', borderRadius:20, padding:24,
    maxWidth:300, width:'90%', boxShadow:'0 8px 40px rgba(0,0,0,0.8)' },
  modalTitle: { margin:'0 0 4px', fontWeight:400, fontSize:18, color:'#f5e642',
    textAlign:'center', fontFamily:"'IM Fell English', serif" },
  modalHint: { margin:'0 0 14px', fontSize:11, lineHeight:1.6,
    color:'rgba(245,230,66,0.4)', textAlign:'center' },
  modalInput: { width:'100%', background:'rgba(0,0,0,0.4)',
    border:'1px solid rgba(212,160,23,0.26)', borderRadius:10, padding:'10px 14px',
    fontSize:13, color:'#f0e8d0', outline:'none', textAlign:'center' },
  modalCancel: { flex:1, padding:'9px', background:'transparent',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
    color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:12,
    fontFamily:"'IM Fell English', serif" },
  modalSave: { flex:1, padding:'9px',
    background:'linear-gradient(135deg,#d4a017,#f5e642)',
    border:'none', borderRadius:10, color:'#160900', fontWeight:700, cursor:'pointer',
    fontSize:12, fontFamily:"'IM Fell English', serif", letterSpacing:'0.05em' },
};
