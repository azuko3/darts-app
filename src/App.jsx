import { useState, useContext, createContext, useRef, useEffect } from "react";

// ─── i18n ────────────────────────────────────────────────────────────────────
const translations = {
  he: {
    title: "מנהל משחק", num_players: "מספר שחקנים", starting_score: "ניקוד התחלתי",
    player_names: "שמות שחקנים", player_default: (n) => `שחקן ${n}`, start_game: "התחל משחק",
    your_turn: "תורך", remaining: "נשאר", enter_score: "הזן ניקוד...", confirm: "✓ אישור",
    stats: "סטטיסטיקות", col_player: "שחקן", col_remaining: "נשאר", col_avg: "ממוצע",
    col_high: "שיא", col_busts: "חריגות", col_rounds: "סבבים", col_darts: "דארטים",
    col_wins: "ניצחונות", col_total_avg: "ממוצע כולל",
    hl_best: "🔥 הזריקה הטובה ביותר", hl_leading: "🥇 מוביל", hl_active: "🎯 הכי פעיל",
    invalid_score: "ניקוד לא תקין (0-180)",
    bust: (name, score) => `💥 BUST! ${name} חזר ל-${score}`,
    checkout_label: "CHECKOUT! — משחק", won: "ניצח את המשחק! 🎯",
    game_summary: (n) => `📋 סיכום משחק ${n}`,
    championship: (n) => `🏅 טבלת אליפות — ${n} משחקים`,
    overall_winner: (name, wins) => `מנצח כולל: ${name} עם ${wins} ניצחונות`,
    next_round: "סיבוב נוסף", new_game: "משחק חדש", end: "סיים", game: "משחק", round: "סבב",
    mode_classic: "קלאסי", mode_visual: "ויזואלי",
    dart: (n) => `דארט ${n}/3`, undo_dart: "↩ בטל",
    edit_last: "✎ ערוך סבב אחרון", edit_title: "עריכת סבב אחרון",
    edit_hint: "הזן ניקוד מתוקן:", save: "שמור", cancel: "ביטול",
    darts_this_turn: "דארטים בתור זה",
  },
  en: {
    title: "Game Manager", num_players: "Number of Players", starting_score: "Starting Score",
    player_names: "Player Names", player_default: (n) => `Player ${n}`, start_game: "Start Game",
    your_turn: "Your Turn", remaining: "Remaining", enter_score: "Enter score...", confirm: "✓ Confirm",
    stats: "Statistics", col_player: "Player", col_remaining: "Left", col_avg: "Avg",
    col_high: "Best", col_busts: "Busts", col_rounds: "Rounds", col_darts: "Darts",
    col_wins: "Wins", col_total_avg: "Overall Avg",
    hl_best: "🔥 Best Throw", hl_leading: "🥇 Leading", hl_active: "🎯 Most Active",
    invalid_score: "Invalid score (0-180)",
    bust: (name, score) => `💥 BUST! ${name} back to ${score}`,
    checkout_label: "CHECKOUT! — Game", won: "Won the game! 🎯",
    game_summary: (n) => `📋 Game ${n} Summary`,
    championship: (n) => `🏅 Championship — ${n} games`,
    overall_winner: (name, wins) => `Overall winner: ${name} with ${wins} wins`,
    next_round: "Next Round", new_game: "New Game", end: "End", game: "Game", round: "Round",
    mode_classic: "Classic", mode_visual: "Visual",
    dart: (n) => `Dart ${n}/3`, undo_dart: "↩ Undo",
    edit_last: "✎ Edit last round", edit_title: "Edit last round",
    edit_hint: "Enter corrected score:", save: "Save", cancel: "Cancel",
    darts_this_turn: "Darts this turn",
  },
};

const I18nContext = createContext();
const useT = () => useContext(I18nContext);

const STARTING_SCORES = [301, 501, 701];
const PLAYER_COLORS = ["#FF6B35", "#00E5FF", "#B9FF66", "#FF3CAC", "#FFD700", "#A78BFA"];
const BOARD_NUMS = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ─── Dartboard Canvas ─────────────────────────────────────────────────────────
function DartBoard({ playerColor, onScore, pendingDarts, onUndo }) {
  const canvasRef = useRef(null);
  const SIZE = 300;
  const CX = SIZE/2, CY = SIZE/2;
  const R = SIZE/2 - 10;
  const SLICE = (2*Math.PI)/20;
  const OFFSET = -Math.PI/2 - SLICE/2;

  const rBullInner = R*0.057, rBullOuter = R*0.144;
  const rTripleIn  = R*0.486, rTripleOut  = R*0.554;
  const rDoubleIn  = R*0.773, rDoubleOut  = R*0.841;
  const rNumRing   = R*0.935;

  function drawBoard(ctx) {
    ctx.clearRect(0,0,SIZE,SIZE);
    ctx.beginPath(); ctx.arc(CX,CY,R,0,2*Math.PI); ctx.fillStyle='#111'; ctx.fill();

    for (let i=0;i<20;i++) {
      const a1=OFFSET+i*SLICE, a2=a1+SLICE;
      const color = i%2===0 ? '#1c1c1c' : '#f0dfc0';
      // single inner
      drawSector(ctx,CX,CY,rBullOuter,rTripleIn,a1,a2,color);
      // single outer
      drawSector(ctx,CX,CY,rTripleOut,rDoubleIn,a1,a2,color);
      // triple
      drawSector(ctx,CX,CY,rTripleIn,rTripleOut,a1,a2,i%2===0?'#c0392b':'#1a7a3c');
      // double
      drawSector(ctx,CX,CY,rDoubleIn,rDoubleOut,a1,a2,i%2===0?'#c0392b':'#1a7a3c');
    }
    // wire rings
    [rTripleIn,rTripleOut,rDoubleIn,rDoubleOut,rBullOuter].forEach(r=>{
      ctx.beginPath(); ctx.arc(CX,CY,r,0,2*Math.PI);
      ctx.strokeStyle='#888'; ctx.lineWidth=0.8; ctx.stroke();
    });
    // spokes
    for(let i=0;i<20;i++){
      const a=OFFSET+i*SLICE;
      ctx.beginPath();
      ctx.moveTo(CX+rBullOuter*Math.cos(a),CY+rBullOuter*Math.sin(a));
      ctx.lineTo(CX+rDoubleOut*Math.cos(a),CY+rDoubleOut*Math.sin(a));
      ctx.strokeStyle='#888'; ctx.lineWidth=0.5; ctx.stroke();
    }
    // outer bull
    ctx.beginPath(); ctx.arc(CX,CY,rBullOuter,0,2*Math.PI);
    ctx.fillStyle='#1a7a3c'; ctx.fill();
    ctx.strokeStyle='#888'; ctx.lineWidth=0.8; ctx.stroke();
    // inner bull
    ctx.beginPath(); ctx.arc(CX,CY,rBullInner,0,2*Math.PI);
    ctx.fillStyle='#c0392b'; ctx.fill();
    // numbers
    ctx.fillStyle='#f0dfc0'; ctx.font='bold 11px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let i=0;i<20;i++){
      const a=OFFSET+i*SLICE+SLICE/2;
      ctx.fillText(BOARD_NUMS[i], CX+rNumRing*Math.cos(a), CY+rNumRing*Math.sin(a));
    }
    // draw pending darts as dots
    pendingDarts.forEach((d,idx)=>{
      ctx.beginPath(); ctx.arc(d.x,d.y,5,0,2*Math.PI);
      ctx.fillStyle=playerColor; ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(idx+1, d.x, d.y);
    });
  }

  function drawSector(ctx,cx,cy,r1,r2,a1,a2,color){
    ctx.beginPath();
    ctx.arc(cx,cy,r2,a1,a2);
    ctx.arc(cx,cy,r1,a2,a1,true);
    ctx.closePath(); ctx.fillStyle=color; ctx.fill();
  }

  function hitTest(mx,my){
    const dx=mx-CX, dy=my-CY, dist=Math.sqrt(dx*dx+dy*dy);
    let angle=Math.atan2(dy,dx)-OFFSET;
    while(angle<0) angle+=2*Math.PI;
    while(angle>=2*Math.PI) angle-=2*Math.PI;
    const idx=Math.floor(angle/SLICE)%20;
    const num=BOARD_NUMS[idx];
    if(dist<rBullInner) return {pts:50,label:'Double Bull'};
    if(dist<rBullOuter) return {pts:25,label:'Bull'};
    if(dist>rDoubleOut) return null;
    if(dist<rTripleIn)  return {pts:num,label:`${num}`};
    if(dist<rTripleOut) return {pts:num*3,label:`T${num}`};
    if(dist<rDoubleIn)  return {pts:num,label:`${num}`};
    return {pts:num*2,label:`D${num}`};
  }

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    drawBoard(ctx);
  });

  function handleClick(e){
    if(pendingDarts.length>=3) return;
    const canvas=canvasRef.current;
    const rect=canvas.getBoundingClientRect();
    const scale=SIZE/rect.width;
    const mx=(e.clientX-rect.left)*scale;
    const my=(e.clientY-rect.top)*scale;
    const hit=hitTest(mx,my);
    if(!hit) return;
    onScore({pts:hit.pts, label:hit.label, x:mx, y:my});
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
      <canvas
        ref={canvasRef}
        width={SIZE} height={SIZE}
        onClick={handleClick}
        style={{width:'100%',maxWidth:`${SIZE}px`,cursor:pendingDarts.length<3?'crosshair':'default',borderRadius:'50%'}}
      />
      {/* Dart indicators */}
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:'32px',height:'32px',borderRadius:'50%',
            background: i<pendingDarts.length ? playerColor : 'rgba(255,255,255,0.05)',
            border:`1px solid ${i<pendingDarts.length ? playerColor : 'rgba(255,255,255,0.2)'}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'11px',fontWeight:'bold',color:i<pendingDarts.length?'#0a0a0f':'#444',
            boxShadow:i<pendingDarts.length?`0 0 10px ${playerColor}60`:'none',
            transition:'all 0.2s'
          }}>
            {i<pendingDarts.length ? pendingDarts[i].label : '·'}
          </div>
        ))}
        {pendingDarts.length>0 && (
          <button onClick={onUndo} style={{
            background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:'8px',color:'#aaa',padding:'6px 12px',cursor:'pointer',
            fontSize:'0.75rem',fontFamily:"'Courier New',monospace",
          }}>↩</button>
        )}
      </div>
      {pendingDarts.length>0 && (
        <div style={{color:'#666',fontSize:'0.7rem'}}>
          סה״כ: <span style={{color:playerColor,fontWeight:'bold'}}>
            {pendingDarts.reduce((s,d)=>s+d.pts,0)}
          </span> נקודות
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ player, onSave, onClose }) {
  const { t } = useT();
  const [val, setVal] = useState('');
  return (
    <div style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,
    }}>
      <div style={{
        background:'#0f0f14',border:`1px solid ${player.color}40`,
        borderRadius:'16px',padding:'28px',width:'320px',
        boxShadow:`0 0 40px ${player.color}20`,
        fontFamily:"'Courier New',monospace",direction:'rtl'
      }}>
        <div style={{color:player.color,fontSize:'0.85rem',letterSpacing:'0.15em',marginBottom:'8px'}}>
          {t.edit_title}
        </div>
        <div style={{color:'#666',fontSize:'0.75rem',marginBottom:'16px'}}>
          {player.name} — {t.remaining}: {player.score + (player.rounds[player.rounds.length-1]||0)}
        </div>
        <div style={{color:'#aaa',fontSize:'0.75rem',marginBottom:'8px'}}>{t.edit_hint}</div>
        <input
          type="number" value={val} onChange={e=>setVal(e.target.value)}
          min="0" max="180" autoFocus
          style={{
            width:'100%',background:'rgba(255,255,255,0.05)',
            border:`1px solid ${player.color}60`,borderRadius:'8px',
            padding:'12px 16px',color:player.color,fontSize:'1.4rem',
            fontFamily:"'Courier New',monospace",outline:'none',
            textAlign:'center',direction:'ltr',boxSizing:'border-box'
          }}
          onKeyDown={e=>e.key==='Enter'&&onSave(parseInt(val))}
        />
        <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
          <button onClick={()=>onSave(parseInt(val))} style={{
            flex:1,padding:'12px',background:player.color,border:'none',
            borderRadius:'8px',color:'#0a0a0f',fontWeight:'bold',
            cursor:'pointer',fontFamily:"'Courier New',monospace",fontSize:'0.9rem'
          }}>{t.save}</button>
          <button onClick={onClose} style={{
            flex:1,padding:'12px',background:'rgba(255,255,255,0.05)',
            border:'1px solid rgba(255,255,255,0.15)',borderRadius:'8px',
            color:'#aaa',cursor:'pointer',fontFamily:"'Courier New',monospace",fontSize:'0.9rem'
          }}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Lang Toggle ──────────────────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <button onClick={()=>setLang(lang==='he'?'en':'he')} style={{
      background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',
      borderRadius:'8px',color:'#aaa',padding:'5px 12px',cursor:'pointer',
      fontSize:'0.75rem',fontFamily:"'Courier New',monospace",letterSpacing:'0.1em',fontWeight:'bold',
    }}>{lang==='he'?'EN':'HE'}</button>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  const { t, lang } = useT();
  const [playerCount, setPlayerCount] = useState(2);
  const [startScore, setStartScore] = useState(501);
  const [playerNames, setPlayerNames] = useState(Array.from({length:4},(_,i)=>translations.he.player_default(i+1)));
  const updateName=(i,v)=>{const n=[...playerNames];n[i]=v;setPlayerNames(n);};

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',fontFamily:"'Courier New',monospace",
      direction:lang==='he'?'rtl':'ltr',padding:'20px'}}>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px)',
        backgroundSize:'40px 40px'}}/>
      <div style={{position:'fixed',top:'16px',right:'16px',zIndex:10}}><LangToggle/></div>
      <div style={{marginBottom:'32px',textAlign:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'8px'}}>🎯</div>
        <h1 style={{fontSize:'clamp(2rem,5vw,3.5rem)',color:'#FF6B35',margin:0,letterSpacing:'0.15em',
          textShadow:'0 0 30px #FF6B35',textTransform:'uppercase'}}>DARTS</h1>
        <div style={{color:'#00E5FF',fontSize:'1rem',letterSpacing:'0.4em',opacity:0.7}}>{t.title}</div>
      </div>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,107,53,0.3)',
        borderRadius:'16px',padding:'clamp(24px,5vw,40px)',width:'100%',maxWidth:'480px'}}>
        <div style={{marginBottom:'28px'}}>
          <label style={{color:'#00E5FF',fontSize:'0.8rem',letterSpacing:'0.2em',display:'block',marginBottom:'12px'}}>{t.num_players}</label>
          <div style={{display:'flex',gap:'10px'}}>
            {[2,3,4].map(n=>(
              <button key={n} onClick={()=>setPlayerCount(n)} style={{
                flex:1,padding:'12px',
                background:playerCount===n?'#FF6B35':'rgba(255,107,53,0.1)',
                border:`1px solid ${playerCount===n?'#FF6B35':'rgba(255,107,53,0.3)'}`,
                borderRadius:'8px',color:playerCount===n?'#0a0a0f':'#FF6B35',
                fontSize:'1.3rem',fontWeight:'bold',cursor:'pointer',fontFamily:"'Courier New',monospace",
              }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:'28px'}}>
          <label style={{color:'#00E5FF',fontSize:'0.8rem',letterSpacing:'0.2em',display:'block',marginBottom:'12px'}}>{t.starting_score}</label>
          <div style={{display:'flex',gap:'10px'}}>
            {STARTING_SCORES.map(s=>(
              <button key={s} onClick={()=>setStartScore(s)} style={{
                flex:1,padding:'12px 8px',
                background:startScore===s?'#00E5FF':'rgba(0,229,255,0.1)',
                border:`1px solid ${startScore===s?'#00E5FF':'rgba(0,229,255,0.3)'}`,
                borderRadius:'8px',color:startScore===s?'#0a0a0f':'#00E5FF',
                fontSize:'1rem',fontWeight:'bold',cursor:'pointer',fontFamily:"'Courier New',monospace",
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:'32px'}}>
          <label style={{color:'#00E5FF',fontSize:'0.8rem',letterSpacing:'0.2em',display:'block',marginBottom:'12px'}}>{t.player_names}</label>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {Array.from({length:playerCount}).map((_,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'12px',height:'12px',borderRadius:'50%',background:PLAYER_COLORS[i],boxShadow:`0 0 8px ${PLAYER_COLORS[i]}`,flexShrink:0}}/>
                <input value={playerNames[i]} onChange={e=>updateName(i,e.target.value)} style={{
                  flex:1,background:'rgba(255,255,255,0.05)',border:`1px solid ${PLAYER_COLORS[i]}40`,
                  borderRadius:'8px',padding:'10px 14px',color:PLAYER_COLORS[i],fontSize:'1rem',
                  fontFamily:"'Courier New',monospace",outline:'none',direction:lang==='he'?'rtl':'ltr'
                }} onFocus={e=>e.target.style.borderColor=PLAYER_COLORS[i]}
                   onBlur={e=>e.target.style.borderColor=PLAYER_COLORS[i]+'40'}/>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=>onStart(playerNames.slice(0,playerCount),startScore)} style={{
          width:'100%',padding:'16px',background:'linear-gradient(135deg,#FF6B35,#FF3CAC)',
          border:'none',borderRadius:'10px',color:'#fff',fontSize:'1.1rem',fontWeight:'bold',
          letterSpacing:'0.2em',cursor:'pointer',fontFamily:"'Courier New',monospace",textTransform:'uppercase',
          boxShadow:'0 0 30px rgba(255,107,53,0.4)',
        }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.98)'}
           onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>
          🎯 {t.start_game}
        </button>
      </div>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
function GameScreen({ players, startScore, onReset }) {
  const { t, lang } = useT();
  const dir = lang==='he'?'rtl':'ltr';

  const initPlayers = () => players.map((name,i)=>({
    name, color:PLAYER_COLORS[i], score:startScore,
    rounds:[], darts:0, highRound:0, busts:0,
  }));
  const initSession = () => players.map((name,i)=>({
    name, color:PLAYER_COLORS[i], wins:0, totalDarts:0, totalScore:0, totalRounds:0, allHighRound:0, totalBusts:0,
  }));

  const [gameState, setGameState] = useState(initPlayers);
  const [sessionStats, setSessionStats] = useState(initSession);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [winner, setWinner] = useState(null);
  const [roundNum, setRoundNum] = useState(1);
  const [gameNum, setGameNum] = useState(1);
  const [notification, setNotification] = useState(null);
  const [visualMode, setVisualMode] = useState(false);
  const [pendingDarts, setPendingDarts] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null); // index of player to edit

  const showNotif = (msg, color='#FFD700') => {
    setNotification({msg,color});
    setTimeout(()=>setNotification(null),2000);
  };

  function commitScore(val, dartsUsed=3) {
    if (isNaN(val)||val<0||val>180) { showNotif(t.invalid_score,'#FF3CAC'); return; }
    const updated=[...gameState];
    const p={...updated[currentPlayer]};
    const newScore=p.score-val;
    if (newScore<0) {
      p.busts+=1;
      showNotif(t.bust(p.name,p.score),'#FF3CAC');
    } else if (newScore===0) {
      p.score=0; p.rounds=[...p.rounds,val]; p.darts+=dartsUsed;
      if(val>p.highRound) p.highRound=val;
      updated[currentPlayer]=p; setGameState(updated);
      setSessionStats(prev=>prev.map((s,idx)=>{
        const gp=idx===currentPlayer?p:updated[idx];
        return {...s,wins:s.wins+(idx===currentPlayer?1:0),totalDarts:s.totalDarts+gp.darts,
          totalScore:s.totalScore+gp.rounds.reduce((a,b)=>a+b,0),totalRounds:s.totalRounds+gp.rounds.length,
          allHighRound:Math.max(s.allHighRound,gp.highRound),totalBusts:s.totalBusts+gp.busts};
      }));
      setWinner(p.name); return;
    } else {
      p.score=newScore; p.rounds=[...p.rounds,val]; p.darts+=dartsUsed;
      if(val>p.highRound) p.highRound=val;
      if(val===180) showNotif('🔥 MAX! 180!','#FFD700');
      else if(val>=100) showNotif(`⚡ ${val}!`,'#B9FF66');
    }
    updated[currentPlayer]=p; setGameState(updated);
    setInputValue(''); setPendingDarts([]);
    const next=(currentPlayer+1)%players.length;
    if(next===0) setRoundNum(r=>r+1);
    setCurrentPlayer(next);
  }

  // Visual mode: dart landed
  function handleDartLand(dart) {
    const newDarts=[...pendingDarts,dart];
    setPendingDarts(newDarts);
    if(newDarts.length===3) {
      const total=newDarts.reduce((s,d)=>s+d.pts,0);
      setTimeout(()=>commitScore(total,3),400);
    }
  }

  function handleUndoDart() {
    setPendingDarts(p=>p.slice(0,-1));
  }

  // Edit last round
  function handleEditSave(newVal) {
    if (isNaN(newVal)||newVal<0||newVal>180) { setEditingPlayer(null); return; }
    const idx=editingPlayer;
    const updated=[...gameState];
    const p={...updated[idx]};
    const oldVal=p.rounds[p.rounds.length-1];
    if(oldVal===undefined) { setEditingPlayer(null); return; }
    // restore old score, apply new
    const restoredScore=p.score+oldVal;
    const newScore=restoredScore-newVal;
    if(newScore<0) { showNotif(t.invalid_score,'#FF3CAC'); setEditingPlayer(null); return; }
    p.score=newScore;
    p.rounds=[...p.rounds.slice(0,-1),newVal];
    p.highRound=Math.max(...p.rounds,0);
    updated[idx]=p; setGameState(updated);
    setEditingPlayer(null);
    showNotif(`✎ תוקן ל-${newVal}`,'#00E5FF');
  }

  const handleNextRound = () => {
    setGameState(initPlayers()); setCurrentPlayer(0); setInputValue('');
    setWinner(null); setRoundNum(1); setGameNum(g=>g+1); setPendingDarts([]);
  };

  const quickScores=[26,41,45,60,81,85,100,140,180];

  // ── Winner ──
  if (winner) {
    const overallWinner=[...sessionStats].sort((a,b)=>b.wins-a.wins)[0];
    return (
      <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',fontFamily:"'Courier New',monospace",direction:dir,padding:'20px'}}>
        <div style={{position:'fixed',top:'16px',right:'16px',zIndex:10}}><LangToggle/></div>
        <div style={{textAlign:'center',animation:'pulse 1s ease infinite'}}>
          <div style={{fontSize:'80px',marginBottom:'16px'}}>🏆</div>
          <div style={{color:'#FFD700',fontSize:'clamp(1rem,4vw,1.3rem)',letterSpacing:'0.3em',marginBottom:'8px'}}>
            {t.checkout_label} {gameNum}
          </div>
          <div style={{fontSize:'clamp(2rem,8vw,4rem)',color:'#FF6B35',textShadow:'0 0 40px #FF6B35',fontWeight:'bold',marginBottom:'16px'}}>{winner}</div>
          <div style={{color:'#00E5FF',fontSize:'1.1rem',marginBottom:'32px',opacity:0.8}}>{t.won}</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,215,0,0.3)',borderRadius:'16px',
          padding:'20px',width:'100%',maxWidth:'600px',marginBottom:'16px',overflowX:'auto'}}>
          <div style={{color:'#FFD700',fontSize:'0.75rem',letterSpacing:'0.2em',marginBottom:'12px'}}>{t.game_summary(gameNum)}</div>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:'320px'}}>
            <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
              {[t.col_player,t.col_darts,t.col_avg,t.col_high,t.col_busts].map(h=>(
                <th key={h} style={{color:'#666',fontSize:'0.65rem',padding:'6px 4px',textAlign:'center'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{gameState.map((p,i)=>{
              const avg=p.rounds.length>0?(p.rounds.reduce((a,b)=>a+b,0)/p.rounds.length).toFixed(1):'0';
              return (<tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <td style={{padding:'8px 4px',textAlign:'center'}}><span style={{color:p.color,fontWeight:'bold'}}>{p.name}</span>{p.name===winner&&<span style={{color:'#FFD700'}}> 👑</span>}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#aaa'}}>{p.darts}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#00E5FF'}}>{avg}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#B9FF66'}}>{p.highRound}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#FF3CAC'}}>{p.busts}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(0,229,255,0.3)',borderRadius:'16px',
          padding:'20px',width:'100%',maxWidth:'600px',marginBottom:'24px',overflowX:'auto'}}>
          <div style={{color:'#00E5FF',fontSize:'0.75rem',letterSpacing:'0.2em',marginBottom:'4px'}}>{t.championship(gameNum)}</div>
          <div style={{color:'#555',fontSize:'0.65rem',marginBottom:'12px'}}>{t.overall_winner(overallWinner.name,overallWinner.wins)}</div>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:'360px'}}>
            <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              {[t.col_player,t.col_wins,t.col_total_avg,t.col_high,t.col_darts,t.col_busts].map(h=>(
                <th key={h} style={{color:'#444',fontSize:'0.63rem',padding:'6px 4px',textAlign:'center'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{[...sessionStats].sort((a,b)=>b.wins-a.wins).map((s,i)=>{
              const avg=s.totalRounds>0?(s.totalScore/s.totalRounds).toFixed(1):'—';
              return (<tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:i===0?`rgba(${hexToRgb(s.color)},0.08)`:'transparent'}}>
                <td style={{padding:'8px 4px',textAlign:'center'}}><span style={{color:s.color,fontWeight:'bold',fontSize:'0.85rem'}}>{i===0&&'👑 '}{s.name}</span></td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#FFD700',fontWeight:'bold'}}>{s.wins}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#00E5FF'}}>{avg}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#B9FF66'}}>{s.allHighRound||'—'}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#aaa'}}>{s.totalDarts}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:s.totalBusts>0?'#FF3CAC':'#555'}}>{s.totalBusts}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
          <button onClick={handleNextRound} style={{padding:'14px 28px',background:'linear-gradient(135deg,#00E5FF,#A78BFA)',
            border:'none',borderRadius:'10px',color:'#0a0a0f',fontSize:'1rem',fontWeight:'bold',
            letterSpacing:'0.12em',cursor:'pointer',fontFamily:"'Courier New',monospace",textTransform:'uppercase',
            boxShadow:'0 0 25px rgba(0,229,255,0.4)'}}>🔄 {t.next_round}</button>
          <button onClick={onReset} style={{padding:'14px 28px',background:'rgba(255,107,53,0.1)',
            border:'1px solid rgba(255,107,53,0.4)',borderRadius:'10px',color:'#FF6B35',fontSize:'1rem',
            fontWeight:'bold',letterSpacing:'0.12em',cursor:'pointer',fontFamily:"'Courier New',monospace",textTransform:'uppercase'}}>🎯 {t.new_game}</button>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
      </div>
    );
  }

  const cp=gameState[currentPlayer];

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',fontFamily:"'Courier New',monospace",direction:dir,padding:'16px',
      backgroundImage:'linear-gradient(rgba(0,229,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.02) 1px,transparent 1px)',
      backgroundSize:'40px 40px'}}>

      {/* Edit Modal */}
      {editingPlayer!==null && (
        <EditModal player={gameState[editingPlayer]} onSave={handleEditSave} onClose={()=>setEditingPlayer(null)}/>
      )}

      {/* Notification */}
      {notification&&(
        <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',
          background:'#0a0a0f',border:`1px solid ${notification.color}`,borderRadius:'10px',
          padding:'12px 28px',color:notification.color,fontWeight:'bold',fontSize:'1.2rem',
          letterSpacing:'0.1em',zIndex:100,boxShadow:`0 0 30px ${notification.color}50`,animation:'fadeIn 0.3s ease'}}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <span style={{color:'#FF6B35',fontSize:'1.3rem',fontWeight:'bold',letterSpacing:'0.1em'}}>🎯 DARTS</span>
        <div style={{color:'#666',fontSize:'0.8rem',textAlign:'center'}}>
          <div>{t.game} {gameNum}</div>
          <div style={{fontSize:'0.7rem',opacity:0.6}}>{t.round} {roundNum}</div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <LangToggle/>
          <button onClick={onReset} style={{background:'rgba(255,60,172,0.1)',border:'1px solid rgba(255,60,172,0.3)',
            borderRadius:'8px',color:'#FF3CAC',padding:'6px 12px',cursor:'pointer',fontSize:'0.8rem',
            fontFamily:"'Courier New',monospace"}}>✕ {t.end}</button>
        </div>
      </div>

      {/* Player scores */}
      <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(gameState.length,4)},1fr)`,gap:'10px',marginBottom:'16px'}}>
        {gameState.map((p,i)=>(
          <div key={i} style={{background:currentPlayer===i?`rgba(${hexToRgb(p.color)},0.12)`:'rgba(255,255,255,0.03)',
            border:`1px solid ${currentPlayer===i?p.color:'rgba(255,255,255,0.08)'}`,borderRadius:'12px',
            padding:'14px 10px',textAlign:'center',position:'relative',
            boxShadow:currentPlayer===i?`0 0 20px ${p.color}30`:'none'}}>
            {currentPlayer===i&&(
              <div style={{position:'absolute',top:'-8px',left:'50%',transform:'translateX(-50%)',
                background:p.color,borderRadius:'4px',padding:'2px 8px',
                fontSize:'0.6rem',color:'#0a0a0f',fontWeight:'bold',letterSpacing:'0.1em'}}>{t.your_turn}</div>
            )}
            <div style={{color:p.color,fontSize:'0.75rem',marginBottom:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
            <div style={{color:currentPlayer===i?p.color:'#fff',fontSize:'clamp(1.6rem,4vw,2.5rem)',fontWeight:'bold',lineHeight:1,
              textShadow:currentPlayer===i?`0 0 20px ${p.color}`:'none',marginBottom:'4px'}}>{p.score}</div>
            <div style={{color:'#555',fontSize:'0.65rem'}}>{p.darts} {t.col_darts.toLowerCase()}</div>
            {/* Edit last round button — any player with at least one round */}
            {p.rounds.length>0 && (
              <button onClick={()=>setEditingPlayer(i)} style={{
                marginTop:'6px',background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.12)',borderRadius:'6px',
                color:'#666',padding:'3px 8px',cursor:'pointer',fontSize:'0.6rem',
                fontFamily:"'Courier New',monospace",
              }}>{t.edit_last}</button>
            )}
          </div>
        ))}
      </div>

      {/* Mode toggle */}
      <div style={{display:'flex',gap:'8px',marginBottom:'16px',justifyContent:'center'}}>
        {[false,true].map(isVisual=>(
          <button key={String(isVisual)} onClick={()=>{setVisualMode(isVisual);setPendingDarts([]);}} style={{
            padding:'8px 20px',
            background:visualMode===isVisual?cp.color:'rgba(255,255,255,0.04)',
            border:`1px solid ${visualMode===isVisual?cp.color:'rgba(255,255,255,0.12)'}`,
            borderRadius:'8px',color:visualMode===isVisual?'#0a0a0f':'#aaa',
            fontSize:'0.8rem',fontWeight:'bold',cursor:'pointer',
            fontFamily:"'Courier New',monospace",letterSpacing:'0.1em',
            boxShadow:visualMode===isVisual?`0 0 12px ${cp.color}40`:'none',
            transition:'all 0.2s'
          }}>
            {isVisual?`🎯 ${t.mode_visual}`:`⌨️ ${t.mode_classic}`}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div style={{background:`rgba(${hexToRgb(cp.color)},0.08)`,border:`1px solid ${cp.color}50`,
        borderRadius:'14px',padding:'16px',marginBottom:'16px'}}>
        <div style={{color:cp.color,fontSize:'0.8rem',letterSpacing:'0.15em',marginBottom:'12px',textAlign:'center'}}>
          🎯 {cp.name} — {t.remaining}: <strong>{cp.score}</strong>
        </div>

        {visualMode ? (
          <DartBoard
            playerColor={cp.color}
            pendingDarts={pendingDarts}
            onScore={handleDartLand}
            onUndo={handleUndoDart}
          />
        ) : (
          <>
            <div style={{display:'flex',gap:'10px',marginBottom:'14px'}}>
              <input type="number" value={inputValue} onChange={e=>setInputValue(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&commitScore(parseInt(inputValue))}
                min="0" max="180" placeholder={t.enter_score} autoFocus
                style={{flex:1,background:'rgba(0,0,0,0.3)',border:`1px solid ${cp.color}60`,borderRadius:'10px',
                  padding:'14px 16px',color:cp.color,fontSize:'1.4rem',fontFamily:"'Courier New',monospace",
                  outline:'none',textAlign:'center',direction:'ltr'}}/>
              <button onClick={()=>commitScore(parseInt(inputValue))} style={{
                background:cp.color,border:'none',borderRadius:'10px',color:'#0a0a0f',fontWeight:'bold',
                fontSize:'1rem',padding:'14px 20px',cursor:'pointer',fontFamily:"'Courier New',monospace",
                boxShadow:`0 0 20px ${cp.color}50`,flexShrink:0}}>{t.confirm}</button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',justifyContent:'center'}}>
              {quickScores.map(s=>(
                <button key={s} onClick={()=>setInputValue(String(s))} style={{
                  background:inputValue===String(s)?cp.color:`rgba(${hexToRgb(cp.color)},0.15)`,
                  border:`1px solid ${cp.color}40`,borderRadius:'6px',
                  color:inputValue===String(s)?'#0a0a0f':cp.color,padding:'5px 10px',
                  fontSize:'0.8rem',cursor:'pointer',fontFamily:"'Courier New',monospace",fontWeight:'bold'}}>{s}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'14px',overflowX:'auto'}}>
        <div style={{color:'#444',fontSize:'0.7rem',letterSpacing:'0.2em',marginBottom:'10px'}}>📊 {t.stats}</div>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:'320px'}}>
          <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            {[t.col_player,t.col_remaining,t.col_avg,t.col_high,t.col_busts,t.col_rounds].map(h=>(
              <th key={h} style={{color:'#555',fontSize:'0.65rem',padding:'6px 4px',textAlign:'center'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{gameState.map((p,i)=>{
            const avg=p.rounds.length>0?(p.rounds.reduce((a,b)=>a+b,0)/p.rounds.length).toFixed(1):'—';
            return (
              <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',
                background:currentPlayer===i?`rgba(${hexToRgb(p.color)},0.06)`:'transparent'}}>
                <td style={{padding:'8px 4px',textAlign:'center'}}><span style={{color:p.color,fontWeight:'bold',fontSize:'0.85rem'}}>{p.name}</span></td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#fff',fontWeight:'bold'}}>{p.score}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#00E5FF'}}>{avg}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#B9FF66'}}>{p.highRound||'—'}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:p.busts>0?'#FF3CAC':'#555'}}>{p.busts}</td>
                <td style={{padding:'8px 4px',textAlign:'center',color:'#aaa'}}>{p.rounds.length}</td>
              </tr>
            );
          })}</tbody>
        </table>
        <div style={{display:'flex',gap:'8px',marginTop:'14px',flexWrap:'wrap'}}>
          {(()=>{
            const allRounds=gameState.flatMap(p=>p.rounds.map(r=>({r,name:p.name,color:p.color})));
            const best=allRounds.reduce((m,x)=>x.r>(m?.r??-1)?x:m,null);
            const leading=[...gameState].sort((a,b)=>a.score-b.score)[0];
            const mostDarts=[...gameState].sort((a,b)=>b.darts-a.darts)[0];
            return [
              best&&{label:t.hl_best,val:`${best.r} (${best.name})`,color:best.color},
              leading&&{label:t.hl_leading,val:leading.name,color:leading.color},
              mostDarts&&{label:t.hl_active,val:mostDarts.name,color:mostDarts.color},
            ].filter(Boolean).map((h,i)=>(
              <div key={i} style={{background:`rgba(${hexToRgb(h.color)},0.1)`,border:`1px solid ${h.color}30`,
                borderRadius:'8px',padding:'6px 12px',display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'2px'}}>
                <span style={{color:'#666',fontSize:'0.6rem'}}>{h.label}</span>
                <span style={{color:h.color,fontSize:'0.8rem',fontWeight:'bold'}}>{h.val}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
        @keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('he');
  const [game, setGame] = useState(null);
  const t = translations[lang];
  return (
    <I18nContext.Provider value={{t,lang,setLang}}>
      {game
        ? <GameScreen players={game.players} startScore={game.score} onReset={()=>setGame(null)}/>
        : <SetupScreen onStart={(players,score)=>setGame({players,score})}/>}
    </I18nContext.Provider>
  );
}
