import { useState, useContext, createContext, useRef, useEffect } from "react";

// ─── localStorage ────────────────────────────────────────────────────────────
const LS_KEY = "darts_history";
function loadHistory(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"[]"); }catch{ return []; } }
function saveGame(r){ try{ const h=loadHistory(); h.push(r); if(h.length>50)h.splice(0,h.length-50); localStorage.setItem(LS_KEY,JSON.stringify(h)); }catch{} }

// ─── vibrate ──────────────────────────────────────────────────────────────────
function vibrate(zone){
  if(!navigator.vibrate)return;
  if(zone==="bullseye")navigator.vibrate([60,30,60]);
  else if(zone==="double")navigator.vibrate(60);
  else if(zone==="triple")navigator.vibrate(40);
  else navigator.vibrate(15);
}

// ─── speech ──────────────────────────────────────────────────────────────────
function speak(text, lang){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=lang==="he"?"he-IL":"en-US";
  u.rate=0.9; u.pitch=1.1;
  window.speechSynthesis.speak(u);
}

// ─── confetti ────────────────────────────────────────────────────────────────
function Confetti(){
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d");
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const pieces=Array.from({length:120},()=>({
      x:Math.random()*canvas.width, y:-20,
      w:8+Math.random()*8, h:12+Math.random()*8,
      color:["#FF6B35","#00E5FF","#B9FF66","#FF3CAC","#FFD700","#A78BFA"][Math.floor(Math.random()*6)],
      vx:(Math.random()-0.5)*4, vy:3+Math.random()*4,
      rot:Math.random()*360, vr:(Math.random()-0.5)*8,
    }));
    let alive=true;
    function frame(){
      if(!alive)return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.vy+=0.05;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      });
      requestAnimationFrame(frame);
    }
    frame();
    return()=>{ alive=false; };
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999}}/>;
}

// ─── i18n ────────────────────────────────────────────────────────────────────
const T={
  he:{
    title:"מנהל משחק", num_players:"מספר שחקנים", starting_score:"ניקוד התחלתי",
    player_names:"שמות שחקנים", player_default:(n)=>`שחקן ${n}`, start_game:"התחל משחק",
    your_turn:"תורך", remaining:"נשאר", enter_score:"הזן ניקוד...", confirm:"✓ אישור",
    stats:"סטטיסטיקות", col_player:"שחקן", col_remaining:"נשאר", col_avg:"ממוצע",
    col_high:"שיא", col_busts:"חריגות", col_rounds:"סבבים", col_darts:"דארטים",
    col_wins:"ניצחונות", col_total_avg:"ממוצע כולל",
    hl_best:"🔥 הזריקה הטובה ביותר", hl_leading:"🥇 מוביל",
    invalid_score:"ניקוד לא תקין (0-180)",
    bust:(name,score)=>`💥 BUST! ${name} חזר ל-${score}`,
    checkout_label:"CHECKOUT! — משחק", won:"ניצח את המשחק! 🎯",
    game_summary:(n)=>`📋 סיכום משחק ${n}`,
    championship:(n)=>`🏅 טבלת אליפות — ${n} משחקים`,
    overall_winner:(name,wins)=>`מנצח כולל: ${name} עם ${wins} ניצחונות`,
    next_round:"סיבוב נוסף", new_game:"משחק חדש", end:"סיים", game:"משחק", round:"סבב",
    mode_classic:"קלאסי", mode_visual:"ויזואלי",
    edit_last:"✎ ערוך", edit_title:"עריכת סבב אחרון",
    edit_hint:"הזן ניקוד מתוקן:", save:"שמור", cancel:"ביטול",
    solo:"מצבים נוספים ›", solo_practice:"אימון חופשי", solo_challenge:"אתגר דארטים", solo_clock:"נגד השעון",
    solo_practice_desc:"שפר ממוצע וסטטיסטיקות", solo_challenge_desc:"501 במינימום דארטים",
    solo_clock_desc:"הכי גבוה תוך 3 דקות",
    kids_mode:"מצב ילדים 🎈", kids_desc:"מי מגיע ראשון ל-X נקודות",
    kids_target:"יעד נקודות", kids_timer:"זמן לכל שחקן (שניות)",
    kids_no_timer:"ללא זמן", kids_winner:(name)=>`${name} ניצח! 🎉`,
    kids_turn:(name)=>`תור של ${name}!`,
    kids_score_say:(name,pts)=>`${name} קיבל ${pts} נקודות`,
    kids_great:"מעולה!", kids_bullseye:"בול!", kids_triple:"טריפל!",
    time_left:"זמן נותר", best_score:"שיא אישי", checkout_rate:"אחוז checkout",
    darts_total:"דארטים סה״כ", avg_per_round:"ממוצע לסבב", vs_last:"לעומת המשחק הקודם",
    no_history:"אין משחקים שמורים עדיין",
    progress_chart:"גרף התקדמות",
    new_record:"🏆 שיא חדש!", game_over:"המשחק הסתיים",
    more_modes:"מצבים נוספים",
    back:"חזור",
  },
  en:{
    title:"Game Manager", num_players:"Number of Players", starting_score:"Starting Score",
    player_names:"Player Names", player_default:(n)=>`Player ${n}`, start_game:"Start Game",
    your_turn:"Your Turn", remaining:"Remaining", enter_score:"Enter score...", confirm:"✓ Confirm",
    stats:"Statistics", col_player:"Player", col_remaining:"Left", col_avg:"Avg",
    col_high:"Best", col_busts:"Busts", col_rounds:"Rounds", col_darts:"Darts",
    col_wins:"Wins", col_total_avg:"Overall Avg",
    hl_best:"🔥 Best Throw", hl_leading:"🥇 Leading",
    invalid_score:"Invalid score (0-180)",
    bust:(name,score)=>`💥 BUST! ${name} back to ${score}`,
    checkout_label:"CHECKOUT! — Game", won:"Won the game! 🎯",
    game_summary:(n)=>`📋 Game ${n} Summary`,
    championship:(n)=>`🏅 Championship — ${n} games`,
    overall_winner:(name,wins)=>`Overall winner: ${name} with ${wins} wins`,
    next_round:"Next Round", new_game:"New Game", end:"End", game:"Game", round:"Round",
    mode_classic:"Classic", mode_visual:"Visual",
    edit_last:"✎ Edit", edit_title:"Edit last round",
    edit_hint:"Enter corrected score:", save:"Save", cancel:"Cancel",
    solo:"More modes ›", solo_practice:"Free Practice", solo_challenge:"Dart Challenge", solo_clock:"Beat the Clock",
    solo_practice_desc:"Improve average & stats", solo_challenge_desc:"Finish 501 in minimum darts",
    solo_clock_desc:"Highest score in 3 minutes",
    kids_mode:"Kids Mode 🎈", kids_desc:"First to reach X points wins",
    kids_target:"Target score", kids_timer:"Time per player (seconds)",
    kids_no_timer:"No timer", kids_winner:(name)=>`${name} wins! 🎉`,
    kids_turn:(name)=>`${name}'s turn!`,
    kids_score_say:(name,pts)=>`${name} scored ${pts} points`,
    kids_great:"Great!", kids_bullseye:"Bullseye!", kids_triple:"Triple!",
    time_left:"Time left", best_score:"Personal best", checkout_rate:"Checkout rate",
    darts_total:"Total darts", avg_per_round:"Avg per round", vs_last:"vs last game",
    no_history:"No saved games yet",
    progress_chart:"Progress chart",
    new_record:"🏆 New record!", game_over:"Game over",
    more_modes:"More modes",
    back:"Back",
  },
};

const I18nCtx=createContext();
const useT=()=>useContext(I18nCtx);

const STARTING_SCORES=[301,501,701];
const PLAYER_COLORS=["#FF6B35","#00E5FF","#B9FF66","#FF3CAC","#FFD700","#A78BFA"];
const BOARD_NUMS=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const CLOCK_SECONDS=180;
const KIDS_TARGETS=[100,200,300,400];

function rgb(hex){ return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`; }

// ─── Checkout Table ───────────────────────────────────────────────────────────
// Best 1, 2, or 3-dart checkout for each score 2–170
// Format: dart1 dart2 dart3 (only what's needed)
// S=Single, D=Double, T=Triple, Bull=50, OBull=25
const CHECKOUTS = {
  2:"D1", 3:"S1 D1", 4:"D2", 5:"S1 D2", 6:"D3", 7:"S3 D2", 8:"D4",
  9:"S1 D4", 10:"D5", 11:"S3 D4", 12:"D6", 13:"S5 D4", 14:"D7",
  15:"S7 D4", 16:"D8", 17:"S9 D4", 18:"D9", 19:"S3 D8", 20:"D10",
  21:"S5 D8", 22:"D11", 23:"S7 D8", 24:"D12", 25:"S9 D8", 26:"D13",
  27:"S11 D8", 28:"D14", 29:"S13 D8", 30:"D15", 31:"S15 D8", 32:"D16",
  33:"S17 D8", 34:"D17", 35:"S3 D16", 36:"D18", 37:"S5 D16", 38:"D19",
  39:"S7 D16", 40:"D20", 41:"S9 D16", 42:"D21", 43:"S11 D16", 44:"D22",
  45:"S13 D16", 46:"D23", 47:"S15 D16", 48:"D24", 49:"S17 D16",
  50:"Bull", 51:"S19 D16", 52:"D26", 53:"S13 D20", 54:"S14 D20",
  55:"S15 D20", 56:"S16 D20", 57:"S17 D20", 58:"S18 D20", 59:"S19 D20",
  60:"S20 D20", 61:"S21 D20", 62:"S22 D20", 63:"S23 D20", 64:"S24 D20",
  65:"S25 D20", 66:"S26 D20", 67:"S27 D20", 68:"S28 D20", 69:"S29 D20",
  70:"S30 D20", 71:"S31 D20", 72:"S32 D20", 73:"S33 D20", 74:"S34 D20",
  75:"S35 D20", 76:"S36 D20", 77:"S37 D20", 78:"S38 D20", 79:"S39 D20",
  80:"S40 D20", 81:"T19 D12", 82:"T14 D20", 83:"T17 D16", 84:"T16 D18",
  85:"T15 D20", 86:"T18 D16", 87:"T17 D18", 88:"T16 D20", 89:"T19 D16",
  90:"T18 D18", 91:"T17 D20", 92:"T20 D16", 93:"T19 D18", 94:"T18 D20",
  95:"T19 D19", 96:"T20 D18", 97:"T19 D20", 98:"T20 D19", 99:"T19 D21",
  100:"T20 D20", 101:"T17 D25", 102:"T20 D21", 103:"T19 D23",
  104:"T18 D25", 105:"T19 D24", 106:"T20 D23", 107:"T19 D25",
  108:"T20 D24", 109:"T19 D26", 110:"T20 D25",
  111:"T19 D27", 112:"T20 D26", 113:"T19 D28", 114:"T20 D27",
  115:"T19 D29", 116:"T20 D28", 117:"T19 D30", 118:"T20 D29",
  119:"T19 D31", 120:"T20 D30", 121:"T20 T13 D11",
  122:"T18 D34", 123:"T19 D33", 124:"T20 D32",
  125:"T19 D34",
  126:"T18 D36", 127:"T19 D35",
  128:"T18 D37", 129:"T19 D36", 130:"T20 D35",
  131:"T19 D37", 132:"T20 D36",
  133:"T19 D38",
  134:"T20 D37", 135:"T19 D39",
  136:"T20 D38", 137:"T19 D40",
  138:"T20 D39", 139:"T19 D41",
  140:"T20 D40", 141:"T20 T19 D12",
  142:"T20 T14 D20",
  143:"T20 T19 D13",
  144:"T20 T20 D12", 145:"T20 T19 D14",
  146:"T20 T18 D16", 147:"T20 T17 D18",
  148:"T20 T20 D14", 149:"T20 T19 D16",
  150:"T20 T18 D18",
  151:"T20 T17 D20",
  152:"T20 T20 D16", 153:"T20 T19 D18",
  154:"T20 T18 D20",
  155:"T20 T19 D19",
  156:"T20 T20 D18", 157:"T20 T19 D20",
  158:"T20 T20 D19", 160:"T20 T20 D20",
  161:"T20 T17 D25",
  164:"T20 T18 D25",
  167:"T20 T19 D25",
  170:"T20 T20 Bull",
};


function CheckoutTip({score,color}){
  const [open,setOpen]=useState(false);
  if(score>170||score<2)return null;
  const tip=CHECKOUTS[score];
  if(!tip)return null;
  // show only first suggestion (before "...")
  const main=tip.split("...")[0].trim();
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:"6px",marginTop:"4px"}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",
          fontSize:"1rem",lineHeight:1,opacity:0.8,transition:"opacity 0.2s"}}
        title="Checkout tip"
      >💡</button>
      {open&&(
        <span style={{
          background:`rgba(${rgb(color)},0.15)`,
          border:`1px solid ${color}40`,
          borderRadius:"8px",padding:"3px 10px",
          color,fontSize:"0.75rem",fontWeight:"bold",
          fontFamily:"'Courier New',monospace",letterSpacing:"0.05em",
          animation:"fadeInTip 0.2s ease"
        }}>{main}</span>
      )}
      <style>{`@keyframes fadeInTip{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── History Reset ────────────────────────────────────────────────────────────
function clearHistory(){ try{ localStorage.removeItem(LS_KEY); }catch{} }


function LangToggle(){
  const {lang,setLang}=useT();
  return(
    <button onClick={()=>setLang(lang==="he"?"en":"he")} style={{
      background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",
      borderRadius:"8px",color:"#aaa",padding:"5px 12px",cursor:"pointer",
      fontSize:"0.75rem",fontFamily:"'Courier New',monospace",fontWeight:"bold",letterSpacing:"0.1em",
    }}>{lang==="he"?"EN":"HE"}</button>
  );
}

// ─── EditModal ────────────────────────────────────────────────────────────────
function EditModal({player,onSave,onClose}){
  const {t}=useT();
  const [val,setVal]=useState("");
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#0f0f14",border:`1px solid ${player.color}40`,borderRadius:"16px",padding:"28px",width:"320px",fontFamily:"'Courier New',monospace",direction:"rtl"}}>
        <div style={{color:player.color,fontSize:"0.85rem",letterSpacing:"0.15em",marginBottom:"8px"}}>{t.edit_title}</div>
        <div style={{color:"#666",fontSize:"0.75rem",marginBottom:"16px"}}>{player.name} — {t.remaining}: {player.score+(player.rounds[player.rounds.length-1]||0)}</div>
        <div style={{color:"#aaa",fontSize:"0.75rem",marginBottom:"8px"}}>{t.edit_hint}</div>
        <input type="number" value={val} onChange={e=>setVal(e.target.value)} min="0" max="180" autoFocus
          onKeyDown={e=>e.key==="Enter"&&onSave(parseInt(val))}
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${player.color}60`,borderRadius:"8px",padding:"12px 16px",color:player.color,fontSize:"1.4rem",fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",direction:"ltr",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:"10px",marginTop:"16px"}}>
          <button onClick={()=>onSave(parseInt(val))} style={{flex:1,padding:"12px",background:player.color,border:"none",borderRadius:"8px",color:"#0a0a0f",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{t.save}</button>
          <button onClick={onClose} style={{flex:1,padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"8px",color:"#aaa",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── DartBoard ────────────────────────────────────────────────────────────────
function DartBoard({playerColor,onScore,pendingDarts,onUndo,large}){
  const canvasRef=useRef(null),magCanvasRef=useRef(null);
  const [touch,setTouch]=useState(null);
  const SIZE=large?360:300; const CX=SIZE/2,CY=SIZE/2,R=SIZE/2-10;
  const SLICE=(2*Math.PI)/20,OFFSET=-Math.PI/2-SLICE/2;
  const MAG=120,ZOOM=3,SRC=MAG/ZOOM;
  const rBI=R*.057,rBO=R*.144,rTI=R*.486,rTO=R*.554,rDI=R*.773,rDO=R*.841,rNR=R*.935;

  function seg(ctx,cx,cy,r1,r2,a1,a2,color){ctx.beginPath();ctx.arc(cx,cy,r2,a1,a2);ctx.arc(cx,cy,r1,a2,a1,true);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function drawBoard(ctx,ht){
    ctx.clearRect(0,0,SIZE,SIZE);
    ctx.beginPath();ctx.arc(CX,CY,R,0,2*Math.PI);ctx.fillStyle="#111";ctx.fill();
    for(let i=0;i<20;i++){const a1=OFFSET+i*SLICE,a2=a1+SLICE,c=i%2===0?"#1c1c1c":"#f0dfc0";
      seg(ctx,CX,CY,rBO,rTI,a1,a2,c);seg(ctx,CX,CY,rTO,rDI,a1,a2,c);
      seg(ctx,CX,CY,rTI,rTO,a1,a2,i%2===0?"#c0392b":"#1a7a3c");
      seg(ctx,CX,CY,rDI,rDO,a1,a2,i%2===0?"#c0392b":"#1a7a3c");}
    [rTI,rTO,rDI,rDO,rBO].forEach(r=>{ctx.beginPath();ctx.arc(CX,CY,r,0,2*Math.PI);ctx.strokeStyle="#888";ctx.lineWidth=0.8;ctx.stroke();});
    for(let i=0;i<20;i++){const a=OFFSET+i*SLICE;ctx.beginPath();ctx.moveTo(CX+rBO*Math.cos(a),CY+rBO*Math.sin(a));ctx.lineTo(CX+rDO*Math.cos(a),CY+rDO*Math.sin(a));ctx.strokeStyle="#888";ctx.lineWidth=0.5;ctx.stroke();}
    ctx.beginPath();ctx.arc(CX,CY,rBO,0,2*Math.PI);ctx.fillStyle="#1a7a3c";ctx.fill();ctx.strokeStyle="#888";ctx.lineWidth=0.8;ctx.stroke();
    ctx.beginPath();ctx.arc(CX,CY,rBI,0,2*Math.PI);ctx.fillStyle="#c0392b";ctx.fill();
    const fs=large?"bold 14px":"bold 11px";
    ctx.fillStyle="#f0dfc0";ctx.font=`${fs} sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    for(let i=0;i<20;i++){const a=OFFSET+i*SLICE+SLICE/2;ctx.fillText(BOARD_NUMS[i],CX+rNR*Math.cos(a),CY+rNR*Math.sin(a));}
    pendingDarts.forEach((d,idx)=>{ctx.beginPath();ctx.arc(d.x,d.y,large?7:5,0,2*Math.PI);ctx.fillStyle=playerColor;ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle="#fff";ctx.font=`bold ${large?10:8}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(idx+1,d.x,d.y);});
    if(ht){ctx.beginPath();ctx.arc(ht.mx,ht.my,7,0,2*Math.PI);ctx.strokeStyle=playerColor;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(ht.mx-12,ht.my);ctx.lineTo(ht.mx+12,ht.my);ctx.moveTo(ht.mx,ht.my-12);ctx.lineTo(ht.mx,ht.my+12);ctx.strokeStyle=playerColor;ctx.lineWidth=1;ctx.stroke();}
  }
  function drawMag(src,mx,my){const mc=magCanvasRef.current;if(!mc)return;const mCtx=mc.getContext("2d");mCtx.clearRect(0,0,MAG,MAG);mCtx.save();mCtx.beginPath();mCtx.arc(MAG/2,MAG/2,MAG/2,0,2*Math.PI);mCtx.clip();mCtx.drawImage(src,mx-SRC/2,my-SRC/2,SRC,SRC,0,0,MAG,MAG);mCtx.strokeStyle=playerColor;mCtx.lineWidth=1.5;mCtx.beginPath();mCtx.moveTo(MAG/2-16,MAG/2);mCtx.lineTo(MAG/2+16,MAG/2);mCtx.moveTo(MAG/2,MAG/2-16);mCtx.lineTo(MAG/2,MAG/2+16);mCtx.stroke();mCtx.restore();mCtx.beginPath();mCtx.arc(MAG/2,MAG/2,MAG/2-1,0,2*Math.PI);mCtx.strokeStyle=playerColor;mCtx.lineWidth=2.5;mCtx.stroke();}
  function hitTest(mx,my){const dx=mx-CX,dy=my-CY,dist=Math.sqrt(dx*dx+dy*dy);let a=Math.atan2(dy,dx)-OFFSET;while(a<0)a+=2*Math.PI;while(a>=2*Math.PI)a-=2*Math.PI;const num=BOARD_NUMS[Math.floor(a/SLICE)%20];if(dist<rBI)return{pts:50,label:"Bull",zone:"bullseye"};if(dist<rBO)return{pts:25,label:"25",zone:"bull"};if(dist>rDO)return null;if(dist<rTI)return{pts:num,label:`${num}`,zone:"single"};if(dist<rTO)return{pts:num*3,label:`T${num}`,zone:"triple"};if(dist<rDI)return{pts:num,label:`${num}`,zone:"single"};return{pts:num*2,label:`D${num}`,zone:"double"};}
  function coords(e,isTouch){const c=canvasRef.current,rect=c.getBoundingClientRect(),scale=SIZE/rect.width;const s=isTouch?e.touches[0]:e;return{mx:(s.clientX-rect.left)*scale,my:(s.clientY-rect.top)*scale,sx:s.clientX-rect.left,sy:s.clientY-rect.top,sw:rect.width};}
  useEffect(()=>{const c=canvasRef.current;if(!c)return;drawBoard(c.getContext("2d"),touch);if(touch)drawMag(c,touch.mx,touch.my);});
  function onTS(e){e.preventDefault();if(pendingDarts.length>=3)return;const o=coords(e,true);setTouch({...o,hit:hitTest(o.mx,o.my)});}
  function onTM(e){e.preventDefault();if(pendingDarts.length>=3)return;const o=coords(e,true);setTouch({...o,hit:hitTest(o.mx,o.my)});}
  function onTE(e){e.preventDefault();if(!touch?.hit){setTouch(null);return;}vibrate(touch.hit.zone);onScore({pts:touch.hit.pts,label:touch.hit.label,zone:touch.hit.zone,x:touch.mx,y:touch.my});setTouch(null);}
  function onClick(e){if(pendingDarts.length>=3)return;const{mx,my}=coords(e,false);const hit=hitTest(mx,my);if(!hit)return;onScore({pts:hit.pts,label:hit.label,zone:hit.zone,x:mx,y:my});}
  const MOFF=90;
  const magStyle=touch?{position:"absolute",left:Math.min(Math.max(touch.sx-MAG/2,0),touch.sw-MAG),top:touch.sy-MOFF-MAG<0?touch.sy+30:touch.sy-MOFF-MAG,width:MAG,height:MAG,borderRadius:"50%",pointerEvents:"none",zIndex:50,boxShadow:`0 0 0 2px ${playerColor},0 4px 20px rgba(0,0,0,0.6)`}:null;

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",position:"relative"}}>
      {touch&&magStyle&&<div style={magStyle}><canvas ref={magCanvasRef} width={MAG} height={MAG} style={{display:"block"}}/></div>}
      {touch?.hit&&<div style={{position:"absolute",top:-36,left:"50%",transform:"translateX(-50%)",background:"#0a0a0f",border:`1px solid ${playerColor}`,borderRadius:"8px",padding:"4px 14px",color:playerColor,fontWeight:"bold",fontSize:"1rem",pointerEvents:"none",zIndex:51,whiteSpace:"nowrap",boxShadow:`0 0 12px ${playerColor}40`}}>{touch.hit.label} · {touch.hit.pts}pts</div>}
      <canvas ref={canvasRef} width={SIZE} height={SIZE} onClick={onClick} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        style={{width:"100%",maxWidth:`${SIZE}px`,cursor:pendingDarts.length<3?"crosshair":"default",borderRadius:"50%",touchAction:"none"}}/>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:large?"40px":"32px",height:large?"40px":"32px",borderRadius:"50%",background:i<pendingDarts.length?playerColor:"rgba(255,255,255,0.05)",border:`1px solid ${i<pendingDarts.length?playerColor:"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:large?"13px":"11px",fontWeight:"bold",color:i<pendingDarts.length?"#0a0a0f":"#444",boxShadow:i<pendingDarts.length?`0 0 10px ${playerColor}60`:"none",transition:"all 0.2s"}}>
            {i<pendingDarts.length?pendingDarts[i].label:"·"}
          </div>
        ))}
        {pendingDarts.length>0&&<button onClick={onUndo} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",color:"#aaa",padding:"6px 12px",cursor:"pointer",fontSize:"0.75rem",fontFamily:"'Courier New',monospace"}}>↩</button>}
      </div>
      {pendingDarts.length>0&&<div style={{color:"#666",fontSize:"0.7rem"}}>סה״כ: <span style={{color:playerColor,fontWeight:"bold"}}>{pendingDarts.reduce((s,d)=>s+d.pts,0)}</span></div>}
    </div>
  );
}

// ─── Progress Chart ───────────────────────────────────────────────────────────
function ProgressChart({history,color}){
  if(!history||history.length<2)return null;
  const data=history.slice(-10);
  const max=Math.max(...data,1);
  const W=280,H=80,pad=8;
  const pts=data.map((v,i)=>{const x=pad+i*(W-pad*2)/(data.length-1);const y=H-pad-(v/max)*(H-pad*2);return`${x},${y}`;}).join(" ");
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i)=>{const x=pad+i*(W-pad*2)/(data.length-1);const y=H-pad-(v/max)*(H-pad*2);return(<g key={i}><circle cx={x} cy={y} r="3" fill={color}/><text x={x} y={y-6} textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace">{v}</text></g>);})}
    </svg>
  );
}

// ─── Kids Game ────────────────────────────────────────────────────────────────
function KidsGame({players,target,timerSecs,ballsPerTurn,onBack}){
  const {t,lang}=useT();
  const COLORS=["#FF6B35","#00E5FF","#B9FF66","#FF3CAC","#FFD700","#A78BFA"];
  const bpt=ballsPerTurn||3;
  const [scores,setScores]=useState(players.map(()=>0));
  const [cur,setCur]=useState(0);
  const [ballsThisTurn,setBallsThisTurn]=useState(0);
  const [timeLeft,setTimeLeft]=useState(timerSecs||null);
  const [flash,setFlash]=useState(null);
  const [winner,setWinner]=useState(null);
  const [visual,setVisual]=useState(false); // unused, kept for compat
  const timerRef=useRef(null);

  const color=COLORS[cur%COLORS.length];

  useEffect(()=>{
    if(!timerSecs||winner)return;
    setTimeLeft(timerSecs);
  },[cur]);

  useEffect(()=>{
    if(!timerSecs||winner)return;
    clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current);nextPlayer();return timerSecs;}
        return t-1;
      });
    },1000);
    return()=>clearInterval(timerRef.current);
  },[cur,timerSecs,winner]);

  function showFlash(text,col){setFlash({text,col});setTimeout(()=>setFlash(null),1200);}

  function nextPlayer(){
    const next=(cur+1)%players.length;
    setCur(next); setBallsThisTurn(0);
    speak(t.kids_turn(players[next]),lang);
  }

  function addScore(pts,zone){
    if(winner)return;
    const newScores=[...scores];
    newScores[cur]+=pts;
    setScores(newScores);
    const newBalls=ballsThisTurn+1;
    setBallsThisTurn(newBalls);

    let sayText=t.kids_score_say(players[cur],pts);
    if(zone==="bullseye")sayText=t.kids_bullseye+" "+pts;
    speak(sayText,lang);

    if(zone==="bullseye")showFlash("🎯 "+t.kids_bullseye,color);
    else if(pts>=80)showFlash("🔥 "+pts+"!",color);
    else if(pts>=50)showFlash("⭐ "+t.kids_great,color);

    vibrate(zone||"single");

    if(newScores[cur]>=target){
      clearInterval(timerRef.current);
      setWinner(players[cur]);
      speak(t.kids_winner(players[cur]),lang);
      return;
    }

    if(newBalls>=bpt) setTimeout(()=>nextPlayer(),700);
  }

  const maxScore=Math.max(...scores,1);
  const mins=timerSecs?String(Math.floor((timeLeft||0)/60)).padStart(2,"0"):null;
  const secs=timerSecs?String((timeLeft||0)%60).padStart(2,"0"):null;

  if(winner) return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",direction:lang==="he"?"rtl":"ltr",padding:"20px",textAlign:"center"}}>
      <Confetti/>
      <div style={{fontSize:"100px",marginBottom:"16px",animation:"bounce 0.6s ease infinite alternate"}}>🎉</div>
      <div style={{fontSize:"clamp(2rem,8vw,4rem)",color:color,textShadow:`0 0 40px ${color}`,fontWeight:"bold",marginBottom:"16px"}}>{winner}</div>
      <div style={{color:"#FFD700",fontSize:"1.3rem",marginBottom:"32px",letterSpacing:"0.1em"}}>{t.kids_winner(winner)}</div>
      {/* Score bars */}
      <div style={{width:"100%",maxWidth:"400px",marginBottom:"32px"}}>
        {players.map((p,i)=>(
          <div key={i} style={{marginBottom:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",color:COLORS[i%COLORS.length],fontSize:"0.9rem",fontWeight:"bold",marginBottom:"4px"}}>
              <span>{p}</span><span>{scores[i]} / {target}</span>
            </div>
            <div style={{height:"12px",background:"rgba(255,255,255,0.05)",borderRadius:"6px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(100,(scores[i]/target)*100)}%`,background:COLORS[i%COLORS.length],borderRadius:"6px",transition:"width 0.3s",boxShadow:`0 0 8px ${COLORS[i%COLORS.length]}`}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
        <button onClick={()=>{setScores(players.map(()=>0));setCur(0);setWinner(null);setBallsThisTurn(0);speak(t.kids_turn(players[0]),lang);}}
          style={{padding:"16px 32px",background:`linear-gradient(135deg,${COLORS[0]},${COLORS[3]})`,border:"none",borderRadius:"12px",color:"#fff",fontSize:"1.1rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace",boxShadow:`0 0 30px ${COLORS[0]}50`}}>🔄 {t.next_round}</button>
        <button onClick={onBack} style={{padding:"16px 24px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"12px",color:"#aaa",fontSize:"1rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>← {t.back}</button>
      </div>
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-20px)}}`}</style>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",fontFamily:"'Courier New',monospace",direction:lang==="he"?"rtl":"ltr",padding:"16px",
      backgroundImage:"linear-gradient(rgba(0,229,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.02) 1px,transparent 1px)",backgroundSize:"40px 40px"}}>

      {/* Flash overlay */}
      {flash&&(
        <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,pointerEvents:"none"}}>
          <div style={{fontSize:"clamp(2rem,10vw,4rem)",fontWeight:"bold",color:flash.col,textShadow:`0 0 40px ${flash.col}`,animation:"flashPop 0.4s ease",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em"}}>{flash.text}</div>
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <span style={{color:"#FFD700",fontSize:"1.2rem",fontWeight:"bold",letterSpacing:"0.1em"}}>🎈 {t.kids_mode}</span>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <LangToggle/>
          <button onClick={onBack} style={{background:"rgba(255,60,172,0.1)",border:"1px solid rgba(255,60,172,0.3)",borderRadius:"8px",color:"#FF3CAC",padding:"6px 12px",cursor:"pointer",fontSize:"0.8rem",fontFamily:"'Courier New',monospace"}}>✕ {t.end}</button>
        </div>
      </div>

      {/* Current player big display */}
      <div style={{background:`rgba(${rgb(color)},0.1)`,border:`2px solid ${color}`,borderRadius:"16px",padding:"16px",marginBottom:"16px",textAlign:"center",boxShadow:`0 0 30px ${color}20`}}>
        <div style={{color:"#888",fontSize:"0.75rem",letterSpacing:"0.2em",marginBottom:"4px"}}>{t.your_turn}</div>
        <div style={{color:color,fontSize:"clamp(1.5rem,5vw,2.5rem)",fontWeight:"bold",textShadow:`0 0 20px ${color}`,marginBottom:"8px"}}>{players[cur]}</div>
        <div style={{display:"flex",justifyContent:"center",gap:"24px",alignItems:"center"}}>
          <div>
            <div style={{color:"#555",fontSize:"0.65rem"}}>ניקוד</div>
            <div style={{color:color,fontSize:"2rem",fontWeight:"bold"}}>{scores[cur]}</div>
          </div>
          <div style={{color:"#333",fontSize:"1.5rem"}}>/</div>
          <div>
            <div style={{color:"#555",fontSize:"0.65rem"}}>{t.kids_target}</div>
            <div style={{color:"#FFD700",fontSize:"2rem",fontWeight:"bold"}}>{target}</div>
          </div>
          {timerSecs&&(
            <>
              <div style={{color:"#333",fontSize:"1.5rem"}}>·</div>
              <div>
                <div style={{color:"#555",fontSize:"0.65rem"}}>⏱️</div>
                <div style={{color:timeLeft<10?"#FF3CAC":"#aaa",fontSize:"2rem",fontWeight:"bold"}}>{mins}:{secs}</div>
              </div>
            </>
          )}
        </div>
        {/* Progress bar */}
        <div style={{height:"8px",background:"rgba(255,255,255,0.06)",borderRadius:"4px",marginTop:"12px",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(100,(scores[cur]/target)*100)}%`,background:color,borderRadius:"4px",transition:"width 0.3s",boxShadow:`0 0 8px ${color}`}}/>
        </div>
      </div>

      {/* Score bars for all players */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:"8px",marginBottom:"16px"}}>
        {players.map((p,i)=>(
          <div key={i} style={{background:cur===i?`rgba(${rgb(COLORS[i%COLORS.length])},0.1)`:"rgba(255,255,255,0.03)",border:`1px solid ${cur===i?COLORS[i%COLORS.length]:"rgba(255,255,255,0.08)"}`,borderRadius:"10px",padding:"10px",textAlign:"center"}}>
            <div style={{color:COLORS[i%COLORS.length],fontSize:"0.7rem",marginBottom:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p}</div>
            <div style={{color:cur===i?COLORS[i%COLORS.length]:"#fff",fontSize:"1.4rem",fontWeight:"bold"}}>{scores[i]}</div>
            <div style={{height:"4px",background:"rgba(255,255,255,0.05)",borderRadius:"2px",marginTop:"6px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(100,(scores[i]/target)*100)}%`,background:COLORS[i%COLORS.length],borderRadius:"2px",transition:"width 0.3s"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Ball indicators */}
      <div style={{display:"flex",gap:"8px",justifyContent:"center",marginBottom:"12px"}}>
        {Array.from({length:bpt}).map((_,i)=>(
          <div key={i} style={{
            width:"28px",height:"28px",borderRadius:"50%",
            background:i<ballsThisTurn?color:"rgba(255,255,255,0.08)",
            border:`2px solid ${i<ballsThisTurn?color:"rgba(255,255,255,0.15)"}`,
            boxShadow:i<ballsThisTurn?`0 0 10px ${color}80`:"none",
            transition:"all 0.2s"
          }}/>
        ))}
      </div>

      {/* Colorful score buttons */}
      <div style={{background:`rgba(${rgb(color)},0.06)`,border:`1px solid ${color}40`,borderRadius:"14px",padding:"16px",marginBottom:"12px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}}>
          {[10,20,30,40,50,60,70,80,90,100].map((s,i)=>{
            const btnColors=["#1565C0","#388E3C","#F57F17","#C62828","#6A1B9A","#C62828","#F57F17","#388E3C","#1565C0","#FF5722"];
            const c=btnColors[i];
            return(
              <button key={s} onClick={()=>addScore(s,s===100?"bullseye":"single")}
                style={{padding:"20px 4px",background:c,border:"none",borderRadius:"10px",
                  color:"#fff",fontSize:"1.4rem",fontWeight:"bold",cursor:"pointer",
                  fontFamily:"'Courier New',monospace",
                  boxShadow:s>=80?`0 0 16px ${c}80`:"none",
                  transition:"transform 0.1s, box-shadow 0.1s"}}
                onTouchStart={e=>e.currentTarget.style.transform="scale(0.93)"}
                onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual next player button */}
      <button onClick={nextPlayer} style={{width:"100%",padding:"14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"#aaa",fontSize:"1rem",cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em"}}>
        {lang==="he"?`תור הבא ← (${ballsThisTurn}/${bpt} כדורים)`:`Next player → (${ballsThisTurn}/${bpt} balls)`}
      </button>

      <style>{`
        @keyframes flashPop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </div>
  );
}

// ─── Solo Summary ─────────────────────────────────────────────────────────────
function SoloSummary({result,soloMode,onNewGame,onBack}){
  const {t,lang}=useT();
  const history=loadHistory().filter(g=>g.soloMode===soloMode);
  const avgHistory=history.map(g=>g.avgPerRound).filter(Boolean);
  const color="#FF6B35";
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",fontFamily:"'Courier New',monospace",direction:lang==="he"?"rtl":"ltr",padding:"20px",paddingTop:"40px"}}>
      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>
      {result.newRecord&&<div style={{color:"#FFD700",fontSize:"1.2rem",fontWeight:"bold",letterSpacing:"0.2em",marginBottom:"16px",animation:"pulse 1s ease infinite"}}>{t.new_record}</div>}
      <div style={{fontSize:"64px",marginBottom:"8px"}}>{soloMode==="clock"?"⏱️":soloMode==="challenge"?"🏆":"🎯"}</div>
      <div style={{color:color,fontSize:"clamp(2rem,8vw,3.5rem)",fontWeight:"bold",textShadow:`0 0 30px ${color}`,marginBottom:"24px"}}>
        {soloMode==="challenge"?`${result.dartsTotal} 🎯`:soloMode==="clock"?`${result.finalScore} pts`:t.game_over}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",width:"100%",maxWidth:"400px",marginBottom:"20px"}}>
        {[{label:t.avg_per_round,val:result.avgPerRound?.toFixed(1)||"—",color:"#00E5FF"},{label:t.darts_total,val:result.dartsTotal||"—",color:"#B9FF66"},{label:t.checkout_rate,val:result.checkoutRate?`${result.checkoutRate}%`:"—",color:"#FF3CAC"},{label:t.best_score,val:result.highRound||"—",color:"#FFD700"}].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${s.color}30`,borderRadius:"10px",padding:"12px",textAlign:"center"}}>
            <div style={{color:"#555",fontSize:"0.65rem",letterSpacing:"0.1em",marginBottom:"4px"}}>{s.label}</div>
            <div style={{color:s.color,fontSize:"1.4rem",fontWeight:"bold"}}>{s.val}</div>
          </div>
        ))}
      </div>
      {history.length>=2&&(()=>{const prev=history[history.length-2];const diff=result.avgPerRound&&prev.avgPerRound?(result.avgPerRound-prev.avgPerRound).toFixed(1):null;const up=diff>0;return diff?(<div style={{width:"100%",maxWidth:"400px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",padding:"12px 16px",marginBottom:"16px"}}><div style={{color:"#555",fontSize:"0.7rem",letterSpacing:"0.15em",marginBottom:"8px"}}>{t.vs_last}</div><div style={{color:up?"#B9FF66":"#FF3CAC",fontSize:"1rem",fontWeight:"bold"}}>{up?"↑":"↓"} {Math.abs(diff)} {t.avg_per_round}</div></div>):null;})()}
      {avgHistory.length>=2&&(<div style={{width:"100%",maxWidth:"400px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",padding:"14px 16px",marginBottom:"20px"}}><div style={{color:"#444",fontSize:"0.7rem",letterSpacing:"0.15em",marginBottom:"10px"}}>{t.progress_chart}</div><ProgressChart history={avgHistory} color={color}/></div>)}
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
        <button onClick={onNewGame} style={{padding:"14px 28px",background:"linear-gradient(135deg,#FF6B35,#FF3CAC)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"1rem",fontWeight:"bold",letterSpacing:"0.12em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase",boxShadow:"0 0 25px rgba(255,107,53,0.4)"}}>🔄 {t.next_round}</button>
        <button onClick={onBack} style={{padding:"14px 28px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"10px",color:"#aaa",fontSize:"1rem",fontWeight:"bold",letterSpacing:"0.12em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase"}}>← {t.back}</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
    </div>
  );
}

// ─── Solo Game ────────────────────────────────────────────────────────────────
function SoloGame({soloMode,startScore,onBack}){
  const {t,lang}=useT();const dir=lang==="he"?"rtl":"ltr";const color="#FF6B35";
  const [score,setScore]=useState(startScore);const [rounds,setRounds]=useState([]);const [darts,setDarts]=useState(0);const [busts,setBusts]=useState(0);const [highRound,setHighRound]=useState(0);const [inputValue,setInputValue]=useState("");const [visual,setVisual]=useState(false);const [pending,setPending]=useState([]);const [notif,setNotif]=useState(null);const [timeLeft,setTimeLeft]=useState(CLOCK_SECONDS);const [clockRunning,setClockRunning]=useState(soloMode==="clock");const [clockScore,setClockScore]=useState(0);const [result,setResult]=useState(null);
  const timerRef=useRef(null);
  useEffect(()=>{if(soloMode!=="clock"||!clockRunning)return;timerRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);setClockRunning(false);return 0;}return t-1;});},1000);return()=>clearInterval(timerRef.current);},[clockRunning]);
  useEffect(()=>{if(soloMode==="clock"&&timeLeft===0&&clockRunning===false&&!result){const avg=rounds.length>0?(rounds.reduce((a,b)=>a+b,0)/rounds.length):0;const history=loadHistory().filter(g=>g.soloMode==="clock");const prevBest=history.length>0?Math.max(...history.map(g=>g.finalScore||0)):0;const isNew=clockScore>prevBest;const rec={soloMode:"clock",date:Date.now(),finalScore:clockScore,avgPerRound:avg,dartsTotal:darts,highRound,busts,checkoutRate:null};saveGame(rec);setResult({...rec,newRecord:isNew});}},[timeLeft,clockRunning]);
  function showNotif(msg,c="#FFD700"){setNotif({msg,c});setTimeout(()=>setNotif(null),2000);}
  function commit(val,dartsUsed=3){
    if(isNaN(val)||val<0||val>180){showNotif(t.invalid_score,"#FF3CAC");return;}
    if(soloMode==="clock"){setClockScore(s=>s+val);setRounds(r=>[...r,val]);setDarts(d=>d+dartsUsed);if(val>highRound)setHighRound(val);if(val===180)showNotif("🔥 MAX! 180!","#FFD700");else if(val>=100)showNotif(`⚡ ${val}!`,"#B9FF66");setInputValue("");setPending([]);return;}
    const ns=score-val;
    if(ns<0){setBusts(b=>b+1);showNotif(t.bust("",score),"#FF3CAC");}
    else if(ns===0){const nr=[...rounds,val];const nd=darts+dartsUsed;const avg=nr.reduce((a,b)=>a+b,0)/nr.length;const history=loadHistory().filter(g=>g.soloMode===soloMode);const prevBest=soloMode==="challenge"?Math.min(...history.map(g=>g.dartsTotal||999),999):Math.max(...history.map(g=>g.avgPerRound||0),0);const isNew=soloMode==="challenge"?nd<prevBest:avg>prevBest;const cr=Math.round((1/(rounds.length+1))*100);const rec={soloMode,date:Date.now(),avgPerRound:avg,dartsTotal:nd,highRound:Math.max(highRound,val),busts,checkoutRate:cr,finalScore:startScore};saveGame(rec);setResult({...rec,newRecord:isNew});return;}
    else{setScore(ns);setRounds(r=>[...r,val]);setDarts(d=>d+dartsUsed);if(val>highRound)setHighRound(val);if(val===180)showNotif("🔥 MAX! 180!","#FFD700");else if(val>=100)showNotif(`⚡ ${val}!`,"#B9FF66");}
    setInputValue("");setPending([]);
  }
  function handleDart(dart){const nd=[...pending,dart];setPending(nd);if(nd.length===3){const total=nd.reduce((s,d)=>s+d.pts,0);setTimeout(()=>commit(total,3),400);}}
  const avg=rounds.length>0?(rounds.reduce((a,b)=>a+b,0)/rounds.length).toFixed(1):"—";
  const mins=String(Math.floor(timeLeft/60)).padStart(2,"0"),secs2=String(timeLeft%60).padStart(2,"0");
  const quickScores=[26,41,45,60,81,85,100,140,180];
  if(result)return(<SoloSummary result={result} soloMode={soloMode} onNewGame={()=>{setResult(null);setScore(startScore);setRounds([]);setDarts(0);setBusts(0);setHighRound(0);setInputValue("");setPending([]);setClockScore(0);setTimeLeft(CLOCK_SECONDS);setClockRunning(soloMode==="clock");}} onBack={onBack}/>);
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",fontFamily:"'Courier New',monospace",direction:dir,padding:"16px",backgroundImage:"linear-gradient(rgba(0,229,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.02) 1px,transparent 1px)",backgroundSize:"40px 40px"}}>
      {notif&&<div style={{position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",background:"#0a0a0f",border:`1px solid ${notif.c}`,borderRadius:"10px",padding:"12px 28px",color:notif.c,fontWeight:"bold",fontSize:"1.2rem",letterSpacing:"0.1em",zIndex:100,boxShadow:`0 0 30px ${notif.c}50`,animation:"fadeIn 0.3s ease"}}>{notif.msg}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <span style={{color:color,fontSize:"1.2rem",fontWeight:"bold",letterSpacing:"0.1em"}}>🎯 {t[`solo_${soloMode}`]}</span>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}><LangToggle/><button onClick={onBack} style={{background:"rgba(255,60,172,0.1)",border:"1px solid rgba(255,60,172,0.3)",borderRadius:"8px",color:"#FF3CAC",padding:"6px 12px",cursor:"pointer",fontSize:"0.8rem",fontFamily:"'Courier New',monospace"}}>✕ {t.end}</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:soloMode==="clock"?"1fr 1fr":"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        {soloMode==="clock"?(<><div style={{background:`rgba(${rgb(color)},0.1)`,border:`1px solid ${color}40`,borderRadius:"12px",padding:"14px",textAlign:"center"}}><div style={{color:"#555",fontSize:"0.65rem",marginBottom:"4px"}}>⏱️ {t.time_left}</div><div style={{color:timeLeft<30?"#FF3CAC":color,fontSize:"2rem",fontWeight:"bold",textShadow:timeLeft<30?"0 0 20px #FF3CAC":"none"}}>{mins}:{secs2}</div></div><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"14px",textAlign:"center"}}><div style={{color:"#555",fontSize:"0.65rem",marginBottom:"4px"}}>🎯 Score</div><div style={{color:"#FFD700",fontSize:"2rem",fontWeight:"bold"}}>{clockScore}</div></div></>):(<><div style={{background:`rgba(${rgb(color)},0.1)`,border:`1px solid ${color}40`,borderRadius:"12px",padding:"14px",textAlign:"center"}}><div style={{color:"#555",fontSize:"0.65rem",marginBottom:"4px"}}>{t.remaining}</div><div style={{color,fontSize:"2.2rem",fontWeight:"bold",textShadow:`0 0 20px ${color}`}}>{score}</div></div><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"14px",textAlign:"center"}}><div style={{color:"#555",fontSize:"0.65rem",marginBottom:"4px"}}>{t.avg_per_round}</div><div style={{color:"#00E5FF",fontSize:"1.6rem",fontWeight:"bold"}}>{avg}</div></div><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"14px",textAlign:"center"}}><div style={{color:"#555",fontSize:"0.65rem",marginBottom:"4px"}}>{t.col_darts}</div><div style={{color:"#B9FF66",fontSize:"1.6rem",fontWeight:"bold"}}>{darts}</div></div></>)}
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",justifyContent:"center"}}>
        {[false,true].map(isV=>(<button key={String(isV)} onClick={()=>{setVisual(isV);setPending([]);}} style={{padding:"8px 20px",background:visual===isV?color:"rgba(255,255,255,0.04)",border:`1px solid ${visual===isV?color:"rgba(255,255,255,0.12)"}`,borderRadius:"8px",color:visual===isV?"#0a0a0f":"#aaa",fontSize:"0.8rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.2s"}}>{isV?`🎯 ${t.mode_visual}`:`⌨️ ${t.mode_classic}`}</button>))}
      </div>
      <div style={{background:`rgba(${rgb(color)},0.08)`,border:`1px solid ${color}50`,borderRadius:"14px",padding:"16px",marginBottom:"16px"}}>
        {soloMode!=="clock"&&<div style={{textAlign:"center",marginBottom:"8px"}}><CheckoutTip score={score} color={color}/></div>}
        {visual?(<DartBoard playerColor={color} pendingDarts={pending} onScore={handleDart} onUndo={()=>setPending(p=>p.slice(0,-1))}/>):(<><div style={{display:"flex",gap:"10px",marginBottom:"14px"}}><input type="number" value={inputValue} onChange={e=>setInputValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt(inputValue);setInputValue("");commit(v);}}} min="0" max="180" placeholder={t.enter_score} autoFocus style={{flex:1,background:"rgba(0,0,0,0.3)",border:`1px solid ${color}60`,borderRadius:"10px",padding:"14px 16px",color,fontSize:"1.4rem",fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",direction:"ltr"}}/><button onClick={()=>{const v=parseInt(inputValue);setInputValue("");commit(v);}} style={{background:color,border:"none",borderRadius:"10px",color:"#0a0a0f",fontWeight:"bold",fontSize:"1rem",padding:"14px 20px",cursor:"pointer",fontFamily:"'Courier New',monospace",boxShadow:`0 0 20px ${color}50`,flexShrink:0}}>{t.confirm}</button></div><div style={{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center"}}>{quickScores.map(s=>(<button key={s} onClick={()=>setInputValue(String(s))} style={{background:inputValue===String(s)?color:`rgba(${rgb(color)},0.15)`,border:`1px solid ${color}40`,borderRadius:"6px",color:inputValue===String(s)?"#0a0a0f":color,padding:"5px 10px",fontSize:"0.8rem",cursor:"pointer",fontFamily:"'Courier New',monospace",fontWeight:"bold"}}>{s}</button>))}</div></>)}
      </div>
      {rounds.length>=3&&(<div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",padding:"12px 14px"}}><div style={{color:"#444",fontSize:"0.7rem",letterSpacing:"0.15em",marginBottom:"8px"}}>📈 {t.progress_chart}</div><ProgressChart history={rounds} color={color}/></div>)}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}`}</style>
    </div>
  );
}

// ─── Kids Setup ───────────────────────────────────────────────────────────────
function KidsSetup({onStart,onBack}){
  const {t,lang}=useT();const dir=lang==="he"?"rtl":"ltr";
  const [playerCount,setPlayerCount]=useState(2);
  const [names,setNames]=useState(Array.from({length:4},(_,i)=>T.he.player_default(i+1)));
  const [target,setTarget]=useState(100);
  const [customTarget,setCustomTarget]=useState("");
  const [useTimer,setUseTimer]=useState(false);
  const [timerSecs,setTimerSecs]=useState(30);
  const [ballsPerTurn,setBallsPerTurn]=useState(3);
  const upd=(i,v)=>{const n=[...names];n[i]=v;setNames(n);};
  const finalTarget=customTarget?parseInt(customTarget):target;
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",direction:dir,padding:"20px"}}>
      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>
      <div style={{marginBottom:"24px",textAlign:"center"}}>
        <div style={{fontSize:"56px",marginBottom:"8px"}}>🎈</div>
        <h1 style={{fontSize:"clamp(1.5rem,4vw,2.5rem)",color:"#FFD700",margin:0,letterSpacing:"0.15em",textShadow:"0 0 30px #FFD700",textTransform:"uppercase"}}>{t.kids_mode}</h1>
        <div style={{color:"#aaa",fontSize:"0.85rem",marginTop:"4px"}}>{t.kids_desc}</div>
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:"16px",padding:"clamp(20px,5vw,36px)",width:"100%",maxWidth:"480px"}}>
        {/* Target */}
        <div style={{marginBottom:"24px"}}>
          <label style={{color:"#FFD700",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>🎯 {t.kids_target}</label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"8px"}}>
            {KIDS_TARGETS.map(s=>(<button key={s} onClick={()=>{setTarget(s);setCustomTarget("");}} style={{flex:1,minWidth:"60px",padding:"10px",background:target===s&&!customTarget?"#FFD700":"rgba(255,215,0,0.1)",border:`1px solid ${target===s&&!customTarget?"#FFD700":"rgba(255,215,0,0.3)"}`,borderRadius:"8px",color:target===s&&!customTarget?"#0a0a0f":"#FFD700",fontSize:"1.1rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{s}</button>))}
          </div>
          <input type="number" value={customTarget} onChange={e=>setCustomTarget(e.target.value)} placeholder="מספר אחר..." min="10" max="500"
            style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${customTarget?"#FFD700":"rgba(255,215,0,0.2)"}`,borderRadius:"8px",padding:"10px 14px",color:"#FFD700",fontSize:"1rem",fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",direction:"ltr",boxSizing:"border-box"}}/>
        </div>
        {/* Players */}
        <div style={{marginBottom:"24px"}}>
          <label style={{color:"#FFD700",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>👥 {t.num_players}</label>
          <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
            {[2,3,4].map(n=>(<button key={n} onClick={()=>setPlayerCount(n)} style={{flex:1,padding:"12px",background:playerCount===n?"#FFD700":"rgba(255,215,0,0.1)",border:`1px solid ${playerCount===n?"#FFD700":"rgba(255,215,0,0.3)"}`,borderRadius:"8px",color:playerCount===n?"#0a0a0f":"#FFD700",fontSize:"1.3rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{n}</button>))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {Array.from({length:playerCount}).map((_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"12px",height:"12px",borderRadius:"50%",background:PLAYER_COLORS[i],flexShrink:0}}/>
                <input value={names[i]} onChange={e=>upd(i,e.target.value)} style={{flex:1,background:"rgba(255,255,255,0.05)",border:`1px solid ${PLAYER_COLORS[i]}40`,borderRadius:"8px",padding:"10px 14px",color:PLAYER_COLORS[i],fontSize:"1rem",fontFamily:"'Courier New',monospace",outline:"none",direction:dir}} onFocus={e=>e.target.style.borderColor=PLAYER_COLORS[i]} onBlur={e=>e.target.style.borderColor=PLAYER_COLORS[i]+"40"}/>
              </div>
            ))}
          </div>
        </div>
        {/* Balls per turn */}
        <div style={{marginBottom:"24px"}}>
          <label style={{color:"#FFD700",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>
            🎱 {lang==="he"?"כדורים בכל תור":"Balls per turn"}
          </label>
          <div style={{display:"flex",gap:"8px"}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setBallsPerTurn(n)} style={{
                flex:1,padding:"12px",
                background:ballsPerTurn===n?"#FFD700":"rgba(255,215,0,0.1)",
                border:`1px solid ${ballsPerTurn===n?"#FFD700":"rgba(255,215,0,0.3)"}`,
                borderRadius:"8px",color:ballsPerTurn===n?"#0a0a0f":"#FFD700",
                fontSize:"1.3rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"
              }}>{n}</button>
            ))}
          </div>
        </div>
        {/* Timer */}
        <div style={{marginBottom:"28px"}}>
          <label style={{color:"#FFD700",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>⏱️ {t.kids_timer}</label>
          <div style={{display:"flex",gap:"8px",marginBottom:useTimer?"12px":"0"}}>
            <button onClick={()=>setUseTimer(false)} style={{flex:1,padding:"10px",background:!useTimer?"#FFD700":"rgba(255,215,0,0.1)",border:`1px solid ${!useTimer?"#FFD700":"rgba(255,215,0,0.3)"}`,borderRadius:"8px",color:!useTimer?"#0a0a0f":"#FFD700",fontSize:"0.9rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{t.kids_no_timer}</button>
            {[20,30,45,60].map(s=>(<button key={s} onClick={()=>{setUseTimer(true);setTimerSecs(s);}} style={{flex:1,padding:"10px",background:useTimer&&timerSecs===s?"#FFD700":"rgba(255,215,0,0.1)",border:`1px solid ${useTimer&&timerSecs===s?"#FFD700":"rgba(255,215,0,0.3)"}`,borderRadius:"8px",color:useTimer&&timerSecs===s?"#0a0a0f":"#FFD700",fontSize:"0.9rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{s}″</button>))}
          </div>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={onBack} style={{padding:"16px 20px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"#aaa",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"0.9rem"}}>←</button>
          <button onClick={()=>onStart(names.slice(0,playerCount),finalTarget||100,useTimer?timerSecs:null,ballsPerTurn)}
            style={{flex:1,padding:"16px",background:"linear-gradient(135deg,#FFD700,#FF6B35)",border:"none",borderRadius:"10px",color:"#0a0a0f",fontSize:"1.1rem",fontWeight:"bold",letterSpacing:"0.2em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase",boxShadow:"0 0 30px rgba(255,215,0,0.4)"}}>
            🎈 {t.start_game}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Setup (home screen) ─────────────────────────────────────────────────
function MainSetup({onStart,onSolo,onKids}){
  const {t,lang}=useT();const dir=lang==="he"?"rtl":"ltr";
  const [playerCount,setPlayerCount]=useState(2);
  const [startScore,setStartScore]=useState(501);
  const [names,setNames]=useState(Array.from({length:4},(_,i)=>T.he.player_default(i+1)));
  const [showMore,setShowMore]=useState(false);
  const upd=(i,v)=>{const n=[...names];n[i]=v;setNames(n);};
  const SOLO_MODES=["practice","challenge","clock"];

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",direction:dir,padding:"20px"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>

      <div style={{marginBottom:"24px",textAlign:"center"}}>
        <div style={{fontSize:"56px",marginBottom:"8px"}}>🎯</div>
        <h1 style={{fontSize:"clamp(2rem,5vw,3rem)",color:"#FF6B35",margin:0,letterSpacing:"0.15em",textShadow:"0 0 30px #FF6B35",textTransform:"uppercase"}}>DARTS</h1>
      </div>

      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,107,53,0.3)",borderRadius:"16px",padding:"clamp(20px,5vw,36px)",width:"100%",maxWidth:"480px"}}>

        {/* Player count */}
        <div style={{marginBottom:"22px"}}>
          <label style={{color:"#00E5FF",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>{t.num_players}</label>
          <div style={{display:"flex",gap:"10px"}}>
            {[2,3,4].map(n=>(<button key={n} onClick={()=>setPlayerCount(n)} style={{flex:1,padding:"12px",background:playerCount===n?"#FF6B35":"rgba(255,107,53,0.1)",border:`1px solid ${playerCount===n?"#FF6B35":"rgba(255,107,53,0.3)"}`,borderRadius:"8px",color:playerCount===n?"#0a0a0f":"#FF6B35",fontSize:"1.3rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{n}</button>))}
          </div>
        </div>

        {/* Starting score */}
        <div style={{marginBottom:"22px"}}>
          <label style={{color:"#00E5FF",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>{t.starting_score}</label>
          <div style={{display:"flex",gap:"10px"}}>
            {STARTING_SCORES.map(s=>(<button key={s} onClick={()=>setStartScore(s)} style={{flex:1,padding:"12px 8px",background:startScore===s?"#00E5FF":"rgba(0,229,255,0.1)",border:`1px solid ${startScore===s?"#00E5FF":"rgba(0,229,255,0.3)"}`,borderRadius:"8px",color:startScore===s?"#0a0a0f":"#00E5FF",fontSize:"1rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{s}</button>))}
          </div>
        </div>

        {/* Player names */}
        <div style={{marginBottom:"22px"}}>
          <label style={{color:"#00E5FF",fontSize:"0.8rem",letterSpacing:"0.2em",display:"block",marginBottom:"12px"}}>{t.player_names}</label>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {Array.from({length:playerCount}).map((_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"12px",height:"12px",borderRadius:"50%",background:PLAYER_COLORS[i],boxShadow:`0 0 8px ${PLAYER_COLORS[i]}`,flexShrink:0}}/>
                <input value={names[i]} onChange={e=>upd(i,e.target.value)} style={{flex:1,background:"rgba(255,255,255,0.05)",border:`1px solid ${PLAYER_COLORS[i]}40`,borderRadius:"8px",padding:"10px 14px",color:PLAYER_COLORS[i],fontSize:"1rem",fontFamily:"'Courier New',monospace",outline:"none",direction:dir}} onFocus={e=>e.target.style.borderColor=PLAYER_COLORS[i]} onBlur={e=>e.target.style.borderColor=PLAYER_COLORS[i]+"40"}/>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button onClick={()=>onStart(names.slice(0,playerCount),startScore)} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#FF6B35,#FF3CAC)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"1.1rem",fontWeight:"bold",letterSpacing:"0.2em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase",boxShadow:"0 0 30px rgba(255,107,53,0.4)",marginBottom:"12px"}}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
          🎯 {t.start_game}
        </button>

        {/* More modes toggle */}
        <button onClick={()=>setShowMore(s=>!s)} style={{width:"100%",padding:"10px",background:"transparent",border:"none",color:"#00E5FF",fontSize:"0.85rem",cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:"0.15em",transition:"opacity 0.2s",opacity:0.7}}
          onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.7"}>
          {showMore?"▲":"▼"} {t.more_modes}
        </button>

        {showMore&&(
          <div style={{marginTop:"8px",display:"flex",flexDirection:"column",gap:"8px",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:"12px"}}>
            {/* Kids mode */}
            <button onClick={onKids} style={{padding:"14px 16px",background:"rgba(255,215,0,0.07)",border:"1px solid rgba(255,215,0,0.25)",borderRadius:"12px",color:"#FFD700",cursor:"pointer",fontFamily:"'Courier New',monospace",textAlign:"right",transition:"all 0.2s"}}>
              <div style={{fontSize:"1rem",fontWeight:"bold",marginBottom:"2px"}}>🎈 {t.kids_mode}</div>
              <div style={{fontSize:"0.72rem",color:"rgba(255,215,0,0.5)"}}>{t.kids_desc}</div>
            </button>
            {/* Solo modes */}
            {SOLO_MODES.map((mode,i)=>{const cols=["#00E5FF","#B9FF66","#FF3CAC"];const c=cols[i];return(
              <button key={mode} onClick={()=>onSolo(mode)} style={{padding:"14px 16px",background:`rgba(${rgb(c)},0.07)`,border:`1px solid ${c}30`,borderRadius:"12px",color:c,cursor:"pointer",fontFamily:"'Courier New',monospace",textAlign:"right",transition:"all 0.2s"}}>
                <div style={{fontSize:"1rem",fontWeight:"bold",marginBottom:"2px"}}>{mode==="practice"?"🎯":mode==="challenge"?"🏆":"⏱️"} {t[`solo_${mode}`]}</div>
                <div style={{fontSize:"0.72rem",color:`${c}60`}}>{t[`solo_${mode}_desc`]}</div>
              </button>
            );})}
            {/* History reset */}
            <button onClick={()=>{if(window.confirm(lang==="he"?"למחוק את כל היסטוריית המשחקים?":"Clear all game history?")){clearHistory();setShowMore(false);}}} style={{padding:"10px 16px",background:"rgba(255,60,172,0.06)",border:"1px solid rgba(255,60,172,0.2)",borderRadius:"12px",color:"rgba(255,60,172,0.6)",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"0.75rem",letterSpacing:"0.1em"}}>
              🗑️ {lang==="he"?"מחק היסטוריית משחקים":"Clear game history"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Multi Game ───────────────────────────────────────────────────────────────
function MultiGame({players,startScore,onReset,onNextRound,initialGn,initialSs}){
  const {t,lang}=useT();const dir=lang==="he"?"rtl":"ltr";
  const initP=()=>players.map((p,i)=>({name:p.name||p,color:PLAYER_COLORS[i],score:startScore,rounds:[],darts:0,highRound:0,busts:0}));
  const initS=()=>initialSs||players.map((p,i)=>({name:p.name||p,color:PLAYER_COLORS[i],wins:0,totalDarts:0,totalScore:0,totalRounds:0,allHighRound:0,totalBusts:0}));
  const [gs,setGs]=useState(initP);const [ss,setSs]=useState(initS);const [cur,setCur]=useState(0);const [iv,setIv]=useState("");const [winner,setWinner]=useState(null);const [rn,setRn]=useState(1);const [gn,setGn]=useState(initialGn||1);const [notif,setNotif]=useState(null);const [vis,setVis]=useState(false);const [pend,setPend]=useState([]);const [editing,setEditing]=useState(null);
  const showN=(msg,c="#FFD700")=>{setNotif({msg,c});setTimeout(()=>setNotif(null),2000);};
  function commit(val,du=3){
    if(isNaN(val)||val<0||val>180){showN(t.invalid_score,"#FF3CAC");return;}
    const upd=[...gs];const p={...upd[cur]};const ns=p.score-val;
    if(ns<0){p.busts+=1;showN(t.bust(p.name,p.score),"#FF3CAC");}
    else if(ns===0){p.score=0;p.rounds=[...p.rounds,val];p.darts+=du;if(val>p.highRound)p.highRound=val;upd[cur]=p;setGs(upd);setSs(prev=>prev.map((s,idx)=>{const gp=idx===cur?p:upd[idx];return{...s,wins:s.wins+(idx===cur?1:0),totalDarts:s.totalDarts+gp.darts,totalScore:s.totalScore+gp.rounds.reduce((a,b)=>a+b,0),totalRounds:s.totalRounds+gp.rounds.length,allHighRound:Math.max(s.allHighRound,gp.highRound),totalBusts:s.totalBusts+gp.busts};}));setWinner(p.name);return;}
    else{p.score=ns;p.rounds=[...p.rounds,val];p.darts+=du;if(val>p.highRound)p.highRound=val;if(val===180)showN("🔥 MAX! 180!","#FFD700");else if(val>=100)showN(`⚡ ${val}!`,"#B9FF66");}
    upd[cur]=p;setGs(upd);setIv("");setPend([]);const next=(cur+1)%players.length;if(next===0)setRn(r=>r+1);setCur(next);
  }
  function commitFromInput(){const val=parseInt(iv);setIv("");commit(val);}
  function handleDart(dart){const nd=[...pend,dart];setPend(nd);if(nd.length===3){const tot=nd.reduce((s,d)=>s+d.pts,0);setTimeout(()=>commit(tot,3),400);}}
  function editSave(nv){if(isNaN(nv)||nv<0||nv>180){setEditing(null);return;}const upd=[...gs];const p={...upd[editing]};const old=p.rounds[p.rounds.length-1];if(old===undefined){setEditing(null);return;}const ns=p.score+old-nv;if(ns<0){showN(t.invalid_score,"#FF3CAC");setEditing(null);return;}p.score=ns;p.rounds=[...p.rounds.slice(0,-1),nv];p.highRound=Math.max(...p.rounds,0);upd[editing]=p;setGs(upd);setEditing(null);showN(`✎ תוקן ל-${nv}`,"#00E5FF");}
  const nextRound=()=>onNextRound(gs,gn+1,ss);
  const cp=gs[cur];const qsc=[26,41,45,60,81,85,100,140,180];

  if(winner){const ow=[...ss].sort((a,b)=>b.wins-a.wins)[0];return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",direction:dir,padding:"20px"}}>
      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>
      <div style={{textAlign:"center",animation:"pulse 1s ease infinite"}}><div style={{fontSize:"80px",marginBottom:"16px"}}>🏆</div><div style={{color:"#FFD700",fontSize:"clamp(1rem,4vw,1.3rem)",letterSpacing:"0.3em",marginBottom:"8px"}}>{t.checkout_label} {gn}</div><div style={{fontSize:"clamp(2rem,8vw,4rem)",color:"#FF6B35",textShadow:"0 0 40px #FF6B35",fontWeight:"bold",marginBottom:"16px"}}>{winner}</div><div style={{color:"#00E5FF",fontSize:"1.1rem",marginBottom:"32px",opacity:0.8}}>{t.won}</div></div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"600px",marginBottom:"16px",overflowX:"auto"}}>
        <div style={{color:"#FFD700",fontSize:"0.75rem",letterSpacing:"0.2em",marginBottom:"12px"}}>{t.game_summary(gn)}</div>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"320px"}}><thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.1)"}}>{[t.col_player,t.col_darts,t.col_avg,t.col_high,t.col_busts].map(h=>(<th key={h} style={{color:"#666",fontSize:"0.65rem",padding:"6px 4px",textAlign:"center"}}>{h}</th>))}</tr></thead><tbody>{gs.map((p,i)=>{const avg=p.rounds.length>0?(p.rounds.reduce((a,b)=>a+b,0)/p.rounds.length).toFixed(1):"0";return(<tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}><td style={{padding:"8px 4px",textAlign:"center"}}><span style={{color:p.color,fontWeight:"bold"}}>{p.name}</span>{p.name===winner&&<span style={{color:"#FFD700"}}> 👑</span>}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#aaa"}}>{p.darts}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#00E5FF"}}>{avg}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#B9FF66"}}>{p.highRound}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#FF3CAC"}}>{p.busts}</td></tr>);})}</tbody></table>
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(0,229,255,0.3)",borderRadius:"16px",padding:"20px",width:"100%",maxWidth:"600px",marginBottom:"24px",overflowX:"auto"}}>
        <div style={{color:"#00E5FF",fontSize:"0.75rem",letterSpacing:"0.2em",marginBottom:"4px"}}>{t.championship(gn)}</div>
        <div style={{color:"#555",fontSize:"0.65rem",marginBottom:"12px"}}>{t.overall_winner(ow.name,ow.wins)}</div>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"360px"}}><thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>{[t.col_player,t.col_wins,t.col_total_avg,t.col_high,t.col_darts,t.col_busts].map(h=>(<th key={h} style={{color:"#444",fontSize:"0.63rem",padding:"6px 4px",textAlign:"center"}}>{h}</th>))}</tr></thead><tbody>{[...ss].sort((a,b)=>b.wins-a.wins).map((s,i)=>{const avg=s.totalRounds>0?(s.totalScore/s.totalRounds).toFixed(1):"—";return(<tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:i===0?`rgba(${rgb(s.color)},0.08)`:"transparent"}}><td style={{padding:"8px 4px",textAlign:"center"}}><span style={{color:s.color,fontWeight:"bold",fontSize:"0.85rem"}}>{i===0&&"👑 "}{s.name}</span></td><td style={{padding:"8px 4px",textAlign:"center",color:"#FFD700",fontWeight:"bold"}}>{s.wins}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#00E5FF"}}>{avg}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#B9FF66"}}>{s.allHighRound||"—"}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#aaa"}}>{s.totalDarts}</td><td style={{padding:"8px 4px",textAlign:"center",color:s.totalBusts>0?"#FF3CAC":"#555"}}>{s.totalBusts}</td></tr>);})}</tbody></table>
      </div>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
        <button onClick={nextRound} style={{padding:"14px 28px",background:"linear-gradient(135deg,#00E5FF,#A78BFA)",border:"none",borderRadius:"10px",color:"#0a0a0f",fontSize:"1rem",fontWeight:"bold",letterSpacing:"0.12em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase",boxShadow:"0 0 25px rgba(0,229,255,0.4)"}}>🔄 {t.next_round}</button>
        <button onClick={onReset} style={{padding:"14px 28px",background:"rgba(255,107,53,0.1)",border:"1px solid rgba(255,107,53,0.4)",borderRadius:"10px",color:"#FF6B35",fontSize:"1rem",fontWeight:"bold",letterSpacing:"0.12em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase"}}>🎯 {t.new_game}</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
    </div>
  );}

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",fontFamily:"'Courier New',monospace",direction:dir,padding:"16px",backgroundImage:"linear-gradient(rgba(0,229,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.02) 1px,transparent 1px)",backgroundSize:"40px 40px"}}>
      {editing!==null&&<EditModal player={gs[editing]} onSave={editSave} onClose={()=>setEditing(null)}/>}
      {notif&&<div style={{position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",background:"#0a0a0f",border:`1px solid ${notif.c}`,borderRadius:"10px",padding:"12px 28px",color:notif.c,fontWeight:"bold",fontSize:"1.2rem",letterSpacing:"0.1em",zIndex:100,boxShadow:`0 0 30px ${notif.c}50`,animation:"fadeIn 0.3s ease"}}>{notif.msg}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <span style={{color:"#FF6B35",fontSize:"1.3rem",fontWeight:"bold",letterSpacing:"0.1em"}}>🎯 DARTS</span>
        <div style={{color:"#666",fontSize:"0.8rem",textAlign:"center"}}><div>{t.game} {gn}</div><div style={{fontSize:"0.7rem",opacity:0.6}}>{t.round} {rn}</div></div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}><LangToggle/><button onClick={onReset} style={{background:"rgba(255,60,172,0.1)",border:"1px solid rgba(255,60,172,0.3)",borderRadius:"8px",color:"#FF3CAC",padding:"6px 12px",cursor:"pointer",fontSize:"0.8rem",fontFamily:"'Courier New',monospace"}}>✕ {t.end}</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(gs.length,4)},1fr)`,gap:"10px",marginBottom:"16px"}}>
        {gs.map((p,i)=>(<div key={i} style={{background:cur===i?`rgba(${rgb(p.color)},0.12)`:"rgba(255,255,255,0.03)",border:`1px solid ${cur===i?p.color:"rgba(255,255,255,0.08)"}`,borderRadius:"12px",padding:"14px 10px",textAlign:"center",position:"relative",boxShadow:cur===i?`0 0 20px ${p.color}30`:"none"}}>
          {cur===i&&<div style={{position:"absolute",top:"-8px",left:"50%",transform:"translateX(-50%)",background:p.color,borderRadius:"4px",padding:"2px 8px",fontSize:"0.6rem",color:"#0a0a0f",fontWeight:"bold",letterSpacing:"0.1em"}}>{t.your_turn}</div>}
          <div style={{color:p.color,fontSize:"0.75rem",marginBottom:"6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          <div style={{color:cur===i?p.color:"#fff",fontSize:"clamp(1.6rem,4vw,2.5rem)",fontWeight:"bold",lineHeight:1,textShadow:cur===i?`0 0 20px ${p.color}`:"none",marginBottom:"4px"}}>{p.score}</div>
          <div style={{color:"#555",fontSize:"0.65rem"}}>{p.darts} {t.col_darts.toLowerCase()}</div>
          {p.rounds.length>0&&<button onClick={()=>setEditing(i)} style={{marginTop:"6px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"6px",color:"#666",padding:"3px 8px",cursor:"pointer",fontSize:"0.6rem",fontFamily:"'Courier New',monospace"}}>{t.edit_last}</button>}
        </div>))}
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",justifyContent:"center"}}>
        {[false,true].map(isV=>(<button key={String(isV)} onClick={()=>{setVis(isV);setPend([]);}} style={{padding:"8px 20px",background:vis===isV?cp.color:"rgba(255,255,255,0.04)",border:`1px solid ${vis===isV?cp.color:"rgba(255,255,255,0.12)"}`,borderRadius:"8px",color:vis===isV?"#0a0a0f":"#aaa",fontSize:"0.8rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em",boxShadow:vis===isV?`0 0 12px ${cp.color}40`:"none",transition:"all 0.2s"}}>{isV?`🎯 ${t.mode_visual}`:`⌨️ ${t.mode_classic}`}</button>))}
      </div>
      <div style={{background:`rgba(${rgb(cp.color)},0.08)`,border:`1px solid ${cp.color}50`,borderRadius:"14px",padding:"16px",marginBottom:"16px"}}>
        <div style={{color:cp.color,fontSize:"0.8rem",letterSpacing:"0.15em",marginBottom:"4px",textAlign:"center"}}>🎯 {cp.name} — {t.remaining}: <strong>{cp.score}</strong></div>
        <div style={{textAlign:"center",marginBottom:"8px"}}><CheckoutTip score={cp.score} color={cp.color}/></div>
        {vis?(<DartBoard playerColor={cp.color} pendingDarts={pend} onScore={handleDart} onUndo={()=>setPend(p=>p.slice(0,-1))}/>):(<><div style={{display:"flex",gap:"10px",marginBottom:"14px"}}><input type="number" value={iv} onChange={e=>setIv(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commitFromInput()} min="0" max="180" placeholder={t.enter_score} autoFocus style={{flex:1,background:"rgba(0,0,0,0.3)",border:`1px solid ${cp.color}60`,borderRadius:"10px",padding:"14px 16px",color:cp.color,fontSize:"1.4rem",fontFamily:"'Courier New',monospace",outline:"none",textAlign:"center",direction:"ltr"}}/><button onClick={commitFromInput} style={{background:cp.color,border:"none",borderRadius:"10px",color:"#0a0a0f",fontWeight:"bold",fontSize:"1rem",padding:"14px 20px",cursor:"pointer",fontFamily:"'Courier New',monospace",boxShadow:`0 0 20px ${cp.color}50`,flexShrink:0}}>{t.confirm}</button></div><div style={{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center"}}>{qsc.map(s=>(<button key={s} onClick={()=>setIv(String(s))} style={{background:iv===String(s)?cp.color:`rgba(${rgb(cp.color)},0.15)`,border:`1px solid ${cp.color}40`,borderRadius:"6px",color:iv===String(s)?"#0a0a0f":cp.color,padding:"5px 10px",fontSize:"0.8rem",cursor:"pointer",fontFamily:"'Courier New',monospace",fontWeight:"bold"}}>{s}</button>))}</div></>)}
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",padding:"14px",overflowX:"auto"}}>
        <div style={{color:"#444",fontSize:"0.7rem",letterSpacing:"0.2em",marginBottom:"10px"}}>📊 {t.stats}</div>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"320px"}}><thead><tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{[t.col_player,t.col_remaining,t.col_avg,t.col_high,t.col_busts,t.col_rounds].map(h=>(<th key={h} style={{color:"#555",fontSize:"0.65rem",padding:"6px 4px",textAlign:"center"}}>{h}</th>))}</tr></thead><tbody>{gs.map((p,i)=>{const avg=p.rounds.length>0?(p.rounds.reduce((a,b)=>a+b,0)/p.rounds.length).toFixed(1):"—";return(<tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",background:cur===i?`rgba(${rgb(p.color)},0.06)`:"transparent"}}><td style={{padding:"8px 4px",textAlign:"center"}}><span style={{color:p.color,fontWeight:"bold",fontSize:"0.85rem"}}>{p.name}</span></td><td style={{padding:"8px 4px",textAlign:"center",color:"#fff",fontWeight:"bold"}}>{p.score}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#00E5FF"}}>{avg}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#B9FF66"}}>{p.highRound||"—"}</td><td style={{padding:"8px 4px",textAlign:"center",color:p.busts>0?"#FF3CAC":"#555"}}>{p.busts}</td><td style={{padding:"8px 4px",textAlign:"center",color:"#aaa"}}>{p.rounds.length}</td></tr>);})}</tbody></table>
        <div style={{display:"flex",gap:"8px",marginTop:"14px",flexWrap:"wrap"}}>{(()=>{const all=gs.flatMap(p=>p.rounds.map(r=>({r,name:p.name,color:p.color})));const best=all.reduce((m,x)=>x.r>(m?.r??-1)?x:m,null);const leading=[...gs].sort((a,b)=>a.score-b.score)[0];return[best&&{label:t.hl_best,val:`${best.r} (${best.name})`,color:best.color},leading&&{label:t.hl_leading,val:leading.name,color:leading.color}].filter(Boolean).map((h,i)=>(<div key={i} style={{background:`rgba(${rgb(h.color)},0.1)`,border:`1px solid ${h.color}30`,borderRadius:"8px",padding:"6px 12px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:"2px"}}><span style={{color:"#666",fontSize:"0.6rem"}}>{h.label}</span><span style={{color:h.color,fontSize:"0.8rem",fontWeight:"bold"}}>{h.val}</span></div>));})()}</div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}`}</style>
    </div>
  );
}

// ─── TurnOrder ────────────────────────────────────────────────────────────────
function TurnOrder({players,suggestedOrder,onConfirm,onBack}){
  const {t,lang}=useT();
  const dir=lang==="he"?"rtl":"ltr";
  const [order,setOrder]=useState([]); // indices into players array
  const isNew=!suggestedOrder;

  function toggle(idx){
    if(order.includes(idx)){
      // deselect last only
      if(order[order.length-1]===idx) setOrder(o=>o.slice(0,-1));
      return;
    }
    const newOrder=[...order,idx];
    setOrder(newOrder);
    // auto-complete last player
    if(newOrder.length===players.length-1){
      const last=players.findIndex((_,i)=>!newOrder.includes(i));
      setTimeout(()=>setOrder([...newOrder,last]),300);
    }
  }

  const ready=order.length===players.length;
  const orderedPlayers=ready?order.map(i=>players[i]):null;

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",
      direction:dir,padding:"20px",
      backgroundImage:"linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px)",
      backgroundSize:"40px 40px"}}>

      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>

      {/* Title */}
      <div style={{textAlign:"center",marginBottom:"32px"}}>
        <div style={{fontSize:"40px",marginBottom:"8px"}}>🎯</div>
        <div style={{color:"#FF6B35",fontSize:"1.1rem",fontWeight:"bold",letterSpacing:"0.2em",marginBottom:"4px"}}>
          {lang==="he"?"מי מתחיל?":"Who goes first?"}
        </div>
        <div style={{color:"#555",fontSize:"0.8rem",letterSpacing:"0.1em"}}>
          {lang==="he"?"לחצו לפי סדר המשחק":"Tap in playing order"}
        </div>
      </div>

      {/* Player cards */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,2)},1fr)`,
        gap:"12px",width:"100%",maxWidth:"400px",marginBottom:"32px"}}>
        {players.map((p,i)=>{
          const pos=order.indexOf(i); // -1 if not selected
          const selected=pos>=0;
          const c=PLAYER_COLORS[i];
          return(
            <div key={i} onClick={()=>toggle(i)}
              style={{
                background:selected?`rgba(${rgb(c)},0.15)`:"rgba(255,255,255,0.03)",
                border:`2px solid ${selected?c:"rgba(255,255,255,0.1)"}`,
                borderRadius:"16px",
                padding:"20px 16px",
                textAlign:"center",
                cursor:selected&&pos!==order.length-1?"default":"pointer",
                transition:"all 0.25s",
                boxShadow:selected?`0 0 24px ${c}40`:"none",
                opacity:selected&&pos!==order.length-1?0.5:1,
                position:"relative",
                userSelect:"none",
              }}>
              {/* Position number */}
              {selected?(
                <div style={{
                  fontSize:"2.5rem",fontWeight:"bold",color:c,
                  textShadow:`0 0 20px ${c}`,lineHeight:1,marginBottom:"8px",
                  animation:pos===order.length-1?"popIn 0.2s ease":"none"
                }}>{pos+1}</div>
              ):(
                <div style={{
                  fontSize:"2.5rem",fontWeight:"bold",
                  color:"rgba(255,255,255,0.08)",lineHeight:1,marginBottom:"8px",
                  animation:"pulseSoft 2s ease infinite"
                }}>?</div>
              )}
              <div style={{
                color:selected?c:"#888",
                fontSize:"0.9rem",fontWeight:"bold",
                letterSpacing:"0.05em",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
              }}>{p.name||p}</div>
            </div>
          );
        })}
      </div>

      {/* Progress dots */}
      <div style={{display:"flex",gap:"8px",marginBottom:"28px"}}>
        {players.map((_,i)=>(
          <div key={i} style={{
            width:"8px",height:"8px",borderRadius:"50%",
            background:i<order.length?PLAYER_COLORS[order[i]]:"rgba(255,255,255,0.15)",
            transition:"all 0.2s",
            boxShadow:i<order.length?`0 0 6px ${PLAYER_COLORS[order[i]]}`:"none"
          }}/>
        ))}
      </div>

      {/* Buttons */}
      <div style={{display:"flex",gap:"10px",width:"100%",maxWidth:"400px"}}>
        <button onClick={onBack} style={{
          padding:"14px 20px",background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",
          color:"#aaa",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"0.9rem"
        }}>←</button>
        <button
          onClick={()=>ready&&onConfirm(orderedPlayers)}
          disabled={!ready}
          style={{
            flex:1,padding:"16px",
            background:ready?"linear-gradient(135deg,#FF6B35,#FF3CAC)":"rgba(255,255,255,0.04)",
            border:ready?"none":"1px solid rgba(255,255,255,0.08)",
            borderRadius:"10px",color:ready?"#fff":"#444",
            fontSize:"1.1rem",fontWeight:"bold",letterSpacing:"0.15em",
            cursor:ready?"pointer":"default",
            fontFamily:"'Courier New',monospace",textTransform:"uppercase",
            boxShadow:ready?"0 0 30px rgba(255,107,53,0.4)":"none",
            transition:"all 0.3s",
          }}>
          {ready?`🎯 ${lang==="he"?"התחל":"Start"}`:`${order.length}/${players.length}`}
        </button>
      </div>

      <style>{`
        @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
        @keyframes pulseSoft{0%,100%{opacity:0.3}50%{opacity:0.7}}
      `}</style>
    </div>
  );
}

// ─── TurnOrder (next round) ───────────────────────────────────────────────────
function TurnOrderNextRound({players,currentOrder,gameNum,onConfirm,onBack}){
  const {t,lang}=useT();
  const dir=lang==="he"?"rtl":"ltr";
  // suggested: rotate +1
  const suggested=currentOrder.map((_,i)=>currentOrder[(i+1)%currentOrder.length]);
  const [editing,setEditing]=useState(false);
  const [order,setOrder]=useState([]);

  function toggle(idx){
    if(order.includes(idx)){if(order[order.length-1]===idx)setOrder(o=>o.slice(0,-1));return;}
    const newOrder=[...order,idx];
    setOrder(newOrder);
    if(newOrder.length===players.length-1){
      const last=players.findIndex((_,i)=>!newOrder.includes(i));
      setTimeout(()=>setOrder([...newOrder,last]),300);
    }
  }
  const ready=!editing||order.length===players.length;
  const finalOrder=editing?order.map(i=>players[i]):suggested;

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",
      direction:dir,padding:"20px",
      backgroundImage:"linear-gradient(rgba(0,229,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.02) 1px,transparent 1px)",
      backgroundSize:"40px 40px"}}>

      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>

      <div style={{textAlign:"center",marginBottom:"24px"}}>
        <div style={{color:"#FFD700",fontSize:"0.85rem",letterSpacing:"0.25em",marginBottom:"4px",opacity:0.7}}>
          {lang==="he"?`משחק ${gameNum+1}`:`Game ${gameNum+1}`}
        </div>
        <div style={{color:"#FF6B35",fontSize:"1.1rem",fontWeight:"bold",letterSpacing:"0.15em"}}>
          {editing
            ?(lang==="he"?"בחר סדר חדש":"Choose new order")
            :(lang==="he"?"סדר מוצע":"Suggested order")}
        </div>
      </div>

      {/* Cards */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,2)},1fr)`,
        gap:"12px",width:"100%",maxWidth:"400px",marginBottom:"24px"}}>
        {(editing?players:suggested).map((p,i)=>{
          const playerObj=editing?p:p;
          const name=typeof playerObj==="string"?playerObj:playerObj.name;
          const origIdx=players.findIndex(pl=>(pl.name||pl)===name);
          const c=PLAYER_COLORS[origIdx>=0?origIdx:i];
          const pos=editing?order.indexOf(origIdx):i;
          const selected=editing?order.includes(origIdx):true;
          return(
            <div key={i}
              onClick={editing?()=>toggle(origIdx):undefined}
              style={{
                background:`rgba(${rgb(c)},${editing&&!selected?0.03:0.12})`,
                border:`2px solid ${editing&&!selected?"rgba(255,255,255,0.08)":c}`,
                borderRadius:"16px",padding:"18px 16px",textAlign:"center",
                cursor:editing?"pointer":"default",
                opacity:editing&&selected&&pos!==order.length-1?0.5:1,
                transition:"all 0.25s",
                boxShadow:`0 0 ${editing&&!selected?0:20}px ${c}${editing&&!selected?"00":"30"}`,
              }}>
              <div style={{fontSize:"2rem",fontWeight:"bold",color:c,
                textShadow:`0 0 16px ${c}`,lineHeight:1,marginBottom:"6px"}}>
                {editing?(selected?pos+1:"?"):i+1}
              </div>
              <div style={{color:c,fontSize:"0.9rem",fontWeight:"bold",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!editing?(
        <div style={{display:"flex",gap:"10px",width:"100%",maxWidth:"400px"}}>
          <button onClick={()=>{setEditing(true);setOrder([]);}} style={{
            flex:1,padding:"14px",background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.15)",borderRadius:"10px",
            color:"#aaa",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"0.9rem",
            letterSpacing:"0.1em"
          }}>✎ {lang==="he"?"שנה סדר":"Change order"}</button>
          <button onClick={()=>onConfirm(suggested)} style={{
            flex:1,padding:"14px",background:"linear-gradient(135deg,#00E5FF,#A78BFA)",
            border:"none",borderRadius:"10px",color:"#0a0a0f",
            fontWeight:"bold",fontSize:"1rem",letterSpacing:"0.12em",
            cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase",
            boxShadow:"0 0 25px rgba(0,229,255,0.4)"
          }}>✓ {lang==="he"?"אישור":"Confirm"}</button>
        </div>
      ):(
        <div style={{display:"flex",gap:"10px",width:"100%",maxWidth:"400px"}}>
          <button onClick={()=>{setEditing(false);setOrder([]);}} style={{
            padding:"14px 20px",background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",
            color:"#aaa",cursor:"pointer",fontFamily:"'Courier New',monospace"
          }}>←</button>
          <button
            onClick={()=>ready&&order.length===players.length&&onConfirm(order.map(i=>players[i]))}
            disabled={order.length!==players.length}
            style={{
              flex:1,padding:"14px",
              background:order.length===players.length?"linear-gradient(135deg,#FF6B35,#FF3CAC)":"rgba(255,255,255,0.04)",
              border:"none",borderRadius:"10px",
              color:order.length===players.length?"#fff":"#444",
              fontWeight:"bold",fontSize:"1rem",letterSpacing:"0.12em",
              cursor:order.length===players.length?"pointer":"default",
              fontFamily:"'Courier New',monospace",textTransform:"uppercase",
              boxShadow:order.length===players.length?"0 0 30px rgba(255,107,53,0.4)":"none",
              transition:"all 0.3s"
            }}>
            {order.length===players.length?`🎯 ${lang==="he"?"התחל":"Start"}`:`${order.length}/${players.length}`}
          </button>
        </div>
      )}
      <style>{`@keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── Solo Setup ───────────────────────────────────────────────────────────────
function SoloSetup({soloMode,onBack,onStart}){
  const {t,lang}=useT();const dir=lang==="he"?"rtl":"ltr";
  const [sc,setSc]=useState(501);
  const icon=soloMode==="practice"?"🎯":soloMode==="challenge"?"🏆":"⏱️";
  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Courier New',monospace",direction:dir,padding:"20px"}}>
      <div style={{alignSelf:"flex-end",marginBottom:"8px"}}><LangToggle/></div>
      <div style={{marginBottom:"24px",textAlign:"center"}}>
        <div style={{fontSize:"56px",marginBottom:"8px"}}>{icon}</div>
        <h2 style={{color:"#FF6B35",margin:0,letterSpacing:"0.15em",textShadow:"0 0 20px #FF6B35",textTransform:"uppercase"}}>{t[`solo_${soloMode}`]}</h2>
        <div style={{color:"#aaa",fontSize:"0.8rem",marginTop:"4px"}}>{t[`solo_${soloMode}_desc`]}</div>
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,107,53,0.3)",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"400px"}}>
        <div style={{color:"#00E5FF",fontSize:"0.8rem",letterSpacing:"0.2em",marginBottom:"12px"}}>{t.starting_score}</div>
        <div style={{display:"flex",gap:"10px",marginBottom:"28px"}}>
          {STARTING_SCORES.map(s=>(
            <button key={s} onClick={()=>setSc(s)} style={{flex:1,padding:"12px 8px",background:sc===s?"#00E5FF":"rgba(0,229,255,0.1)",border:`1px solid ${sc===s?"#00E5FF":"rgba(0,229,255,0.3)"}`,borderRadius:"8px",color:sc===s?"#0a0a0f":"#00E5FF",fontSize:"1rem",fontWeight:"bold",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{s}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={onBack} style={{padding:"16px 20px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",color:"#aaa",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"0.9rem"}}>←</button>
          <button onClick={()=>onStart(sc)} style={{flex:1,padding:"16px",background:"linear-gradient(135deg,#FF6B35,#FF3CAC)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"1.1rem",fontWeight:"bold",letterSpacing:"0.2em",cursor:"pointer",fontFamily:"'Courier New',monospace",textTransform:"uppercase",boxShadow:"0 0 30px rgba(255,107,53,0.4)"}}>🎯 {t.start_game}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [lang,setLang]=useState("he");
  const [screen,setScreen]=useState("home");
  const [soloMode,setSoloMode]=useState(null);
  const [game,setGame]=useState(null);
  const t=T[lang];

  function handleNextRound(prevGs,newGn,prevSs){
    // rotate order: who was 2nd becomes 1st, etc.
    const currentOrder=prevGs.map(p=>p); // same order as played
    setGame(g=>({...g,orderedPlayers:currentOrder,gameNum:newGn,prevSs}));
    setScreen("turnOrderNext");
  }

  return(
    <I18nCtx.Provider value={{t,lang,setLang}}>
      {screen==="home"&&<MainSetup
        onStart={(players,score)=>{setGame({players,score,gameNum:1});setScreen("turnOrder");}}
        onSolo={(mode)=>{setSoloMode(mode);setScreen("soloSetup");}}
        onKids={()=>setScreen("kidsSetup")}/>}

      {screen==="turnOrder"&&game&&<TurnOrder
        players={game.players}
        onBack={()=>setScreen("home")}
        onConfirm={(ordered)=>{
          setGame(g=>({...g,orderedPlayers:ordered}));
          setScreen("multi");
        }}/>}

      {screen==="turnOrderNext"&&game&&<TurnOrderNextRound
        players={game.orderedPlayers}
        currentOrder={game.orderedPlayers}
        gameNum={game.gameNum-1}
        onBack={()=>setScreen("multi")}
        onConfirm={(ordered)=>{
          setGame(g=>({...g,orderedPlayers:ordered}));
          setScreen("multiNext");
        }}/>}

      {screen==="soloSetup"&&<SoloSetup soloMode={soloMode} onBack={()=>setScreen("home")} onStart={(score)=>{setGame({score});setScreen("solo");}}/>}
      {screen==="kidsSetup"&&<KidsSetup onBack={()=>setScreen("home")} onStart={(players,target,timer,balls)=>{setGame({players,target,timer,balls});setScreen("kids");}}/>}

      {(screen==="multi"||screen==="multiNext")&&game&&<MultiGame
        players={game.orderedPlayers||game.players}
        startScore={game.score}
        initialGn={game.gameNum||1}
        initialSs={game.prevSs||null}
        onReset={()=>setScreen("home")}
        onNextRound={handleNextRound}/>}

      {screen==="solo"&&game&&<SoloGame soloMode={soloMode} startScore={game.score} onBack={()=>setScreen("home")}/>}
      {screen==="kids"&&game&&<KidsGame players={game.players} target={game.target} timerSecs={game.timer} ballsPerTurn={game.balls} onBack={()=>setScreen("home")}/>}
    </I18nCtx.Provider>
  );
}
