import {useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import {SessionProvider,useSession} from './src/hooks/useSession'
import {saveVisitorNickname} from './src/services/visitorProfile'
import {INITIAL_TABLES} from './src/services/tableStore'
import {api} from './src/services/api'
import {QuestionSheet} from './src/components/gacha/QuestionSheet'
import {QuestionResultCard} from './src/components/gacha/QuestionResultCard'
import type {Question} from './src/types'
import './src/styles.css'
import './src/components/gacha/machine-ui.css'
const params=new URLSearchParams(location.search)
if(params.has('matrix')) {
 document.body.style.cssText='background:#2f183a;padding:20px;display:flex;gap:16px;align-items:start'
 for(const [w,h] of [[390,780],[320,780],[390,380]]) {const f=document.createElement('iframe');f.src='/decor-preview.html';f.width=String(w);f.height=String(h);f.style.cssText='border:0;flex-shrink:0';document.body.append(f)}
}else{
 saveVisitorNickname('스티커검증')
 let last:Question|null=null;const original=api.submitQuestion.bind(api);api.submitQuestion=async(...args)=>{last=await original(...args);return last}
 function Preview(){const{ready,selectTable}=useSession();const[open,setOpen]=useState(false);const[result,setResult]=useState(false)
 useEffect(()=>{if(ready)void selectTable(INITIAL_TABLES[0].id).then(()=>setOpen(true))},[ready,selectTable])
 useEffect(()=>{const panel=document.createElement('output');panel.style.cssText='position:fixed;top:2px;left:2px;right:2px;background:white;color:#222;font:10px monospace;z-index:99;pointer-events:none;overflow-wrap:anywhere';const id=setInterval(()=>{const host=document.querySelector('dialog[open]')??document.body;if(panel.parentNode!==host)host.append(panel);const paper=document.querySelector('.letter-paper');panel.textContent=JSON.stringify({size:[innerWidth,innerHeight],placed:document.querySelectorAll('.placed-sticker').length,stored:last?.decoration,open,font: getComputedStyle(document.querySelector('textarea')??document.body).fontFamily,fontLoaded:document.fonts.check('16px OngleipParkDahyun'),overflow:document.documentElement.scrollWidth>innerWidth,paper:paper?.getBoundingClientRect().toJSON()})},500);return()=>{clearInterval(id);panel.remove()}},[open,result])
 return <><button style={{padding:20}} onClick={()=>{setResult(false);setOpen(true)}}>등록창 열기</button><button style={{padding:20}} onClick={()=>setResult(true)}>저장된 편지 보기</button><QuestionSheet open={open} onClose={()=>setOpen(false)} onSuccess={()=>{setOpen(false);setResult(true)}}/>{result&&last&&<div style={{position:'fixed',inset:0,display:'flex',background:'#29133a',alignItems:'center'}}><QuestionResultCard result={{id:'preview',table_id:last.table_id,question:last,drawn_at:new Date().toISOString()}} onReset={()=>setResult(false)} warning="" recovered={false} isMock/></div>}</>
 }
 createRoot(document.getElementById('root')!).render(<BrowserRouter><SessionProvider><Preview/></SessionProvider></BrowserRouter>)
}
