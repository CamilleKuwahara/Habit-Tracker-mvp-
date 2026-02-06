import { clamp, fromISODate, addDays, toISODate, getCompletionForDate } from "./state.js";

export function drawChart({ canvas, ctx, state, selectedDate }){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(600, Math.floor(rect.width));
  const h = Math.max(260, Math.floor(rect.height));

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const N = clamp(state.chartWindowDays, 7, 120);
  const end = fromISODate(selectedDate);
  const start = addDays(end, -(N-1));

  const points = [];
  for(let i=0;i<N;i++){
    const d = addDays(start, i);
    const iso = toISODate(d);
    const {rate} = getCompletionForDate(state, iso);
    points.push({ iso, rate });
  }

  ctx.clearRect(0,0,w,h);

  const padL = 48, padR = 18, padT = 18, padB = 34;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.font = "12px ui-sans-serif, system-ui";

  const yTicks = [0,25,50,75,100];
  for(const t of yTicks){
    const y = padT + (1 - t/100) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(170,182,216,0.85)";
    ctx.fillText(`${t}%`, 10, y + 4);
  }

  const labelCount = 5;
  for(let i=0;i<labelCount;i++){
    const idx = Math.round(i * (points.length-1) / (labelCount-1));
    const x = padL + (idx / (points.length-1 || 1)) * plotW;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();

    const short = points[idx].iso.slice(5);
    ctx.fillStyle = "rgba(170,182,216,0.85)";
    ctx.fillText(short, x - 18, padT + plotH + 22);
  }

  ctx.strokeStyle = "rgba(122,162,255,0.95)";
  ctx.lineWidth = 2;

  const toX = (i) => padL + (i / (points.length-1 || 1)) * plotW;
  const toY = (rate) => padT + (1 - clamp(rate,0,100)/100) * plotH;

  ctx.beginPath();
  points.forEach((p,i)=>{
    const x = toX(i);
    const y = toY(p.rate);
    if(i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();

  for(let i=0;i<points.length;i++){
    const x = toX(i);
    const y = toY(points[i].rate);
    ctx.fillStyle = "rgba(53,211,157,0.95)";
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(233,238,252,0.92)";
  ctx.font = "13px ui-sans-serif, system-ui";
  ctx.fillText("Completion Rate (%)", padL, padT - 4);
}
