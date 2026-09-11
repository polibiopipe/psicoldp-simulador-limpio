import assert from "node:assert/strict";
import test from "node:test";
import { BrowserAvatarVoice, preferredSpanishVoice, spanishVisemes } from "../src/engine/browserAvatarVoice.js";
function harness() {
  const utterances=[], recognitions=[], states=[], errors=[], transcripts=[], timers=new Map();
  let clock=0, serial=0, cancellations=0;
  const env={
    performance:{now:()=>clock},
    setTimeout:(fn)=>{timers.set(++serial,fn);return serial;}, clearTimeout:(id)=>timers.delete(id),
    speechSynthesis:{speak:(u)=>utterances.push(u),cancel:()=>{cancellations++;}},
    SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
    SpeechRecognition:class{
      constructor(){recognitions.push(this);}
      start(){this.onstart?.();}
      abort(){this.aborted=true;this.onend?.();}
      stop(){this.onend?.();}
    }
  };
  const voice=new BrowserAvatarVoice({env,onState:s=>states.push(s),onError:e=>errors.push(e),onTranscript:t=>transcripts.push(t)});
  return {voice,env,utterances,recognitions,states,errors,transcripts,timers,
    result:(text,final)=>Object.assign([{transcript:text}],{isFinal:final}),
    tick:ms=>{clock+=ms;},cancellations:()=>cancellations};
}
test("reproduces the exact patient answer without another intervention",()=>{
 const h=harness(),answer="Tengo cuarenta años. Vivo solo, en Providencia. Me cuesta tomar decisiones.";
 h.voice.speak(answer);
 for(let i=0;i<h.utterances.length;i++){h.utterances[i].onstart();h.utterances[i].onend();}
 assert.equal(h.utterances.map(u=>u.text).join(""),answer);assert.equal(h.voice.state,"idle");
 assert.equal(h.timers.size,0);assert.deepEqual(h.transcripts,[]);
});
test("interruption cancels speech and ignores stale events",()=>{
 const h=harness();h.voice.speak("Estoy hablando. Todavía queda una oración.");
 const old=h.utterances[0];old.onstart();h.voice.listen();
 assert.equal(h.cancellations(),1);assert.equal(h.voice.state,"listening");
 old.onend();old.onerror();old.onstart();
 assert.equal(h.utterances.length,1);assert.equal(h.voice.state,"listening");assert.equal(h.errors.length,0);
});
test("sends only final speech results once",()=>{
 const h=harness();h.voice.listen();const r=h.recognitions[0];assert.equal(r.lang,"es-CL");
 r.onresult({resultIndex:0,results:[h.result("¿Cómo",false)]});assert.deepEqual(h.transcripts,[]);
 r.onresult({resultIndex:0,results:[h.result("¿Cómo te sientes?",true)]});
 r.onresult({resultIndex:0,results:[h.result("¿Cómo te sientes?",true)]});
 r.onend();r.onend();assert.deepEqual(h.transcripts,["¿Cómo te sientes?"]);assert.equal(h.timers.size,0);
});
test("closing aborts microphone and discards late transcripts",()=>{
 const h=harness();h.voice.listen();const r=h.recognitions[0];
 r.onresult({resultIndex:0,results:[h.result("Quería preguntarte algo",true)]});h.voice.dispose();
 r.onresult({resultIndex:0,results:[h.result("Esto llegó tarde",true)]});r.onend();
 assert.equal(r.aborted,true);assert.deepEqual(h.transcripts,[]);assert.equal(h.timers.size,0);
});
test("permission failure does not submit an incomplete intervention",()=>{
 const h=harness();h.voice.listen();const r=h.recognitions[0];
 r.onresult({resultIndex:0,results:[h.result("Texto interrumpido",true)]});
 r.onerror({error:"not-allowed"});r.onend();
 assert.match(h.errors[0],/Permite el micrófono/);assert.deepEqual(h.transcripts,[]);assert.equal(h.voice.state,"idle");
});
test("a new answer replaces old audio without queueing stale sentences",()=>{
 const h=harness();h.voice.speak("Primera. Descartada.");const old=h.utterances[0];old.onstart();
 h.voice.speak("Nueva respuesta.");old.onend();
 assert.deepEqual(h.utterances.map(u=>u.text.trim()),["Primera.","Nueva respuesta."]);
});
test("speech failure times out and resets lips",()=>{
 const h=harness();h.voice.speak("No comienza la voz.");[...h.timers.values()][0]();
 assert.equal(h.voice.state,"idle");assert.deepEqual(h.voice.lipFrame(),{viseme:"sil",level:0});assert.equal(h.errors.length,1);
});
test("lips animate during speech and word events re-anchor timing",()=>{
 const h=harness();h.voice.speak("Hola Claudio");assert.equal(h.voice.lipFrame().level,0);
 const u=h.utterances[0];u.onstart();u.onboundary({name:"word",charIndex:5});h.tick(20);
 assert.equal(h.voice.lipFrame().viseme,"kk");assert.ok(h.voice.lipFrame().level>0);
 h.voice.stop();assert.equal(h.voice.lipFrame().level,0);
});
test("Spanish voice selection and punctuation stay bounded",()=>{
 const es={name:"Rodrigo",lang:"es-CL",localService:true};
 assert.equal(preferredSpanishVoice([{name:"English",lang:"en-US"},es]),es);
 assert.equal(preferredSpanishVoice([{lang:"en-US"}]),null);
 const frames=spanishVisemes("Mamá, café.");
 assert.ok(frames.every(f=>Number.isFinite(f.time)&&f.duration>0));
 assert.ok(frames.some(f=>f.viseme==="FF"));assert.equal(frames.at(-1).viseme,"sil");
});
