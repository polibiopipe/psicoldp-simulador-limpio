import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
const temp=await mkdtemp(resolve('.audit-guide-exposure-'));let ui;const observed=[];let disconnected=0;const oldObserver=globalThis.IntersectionObserver;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.IntersectionObserver=class{constructor(callback){this.callback=callback;observed.push(this);}observe(){}disconnect(){disconnected++;}};
try{
 const outfile=join(temp,'test.mjs');await build({stdin:{resolveDir:process.cwd(),contents:"export {PedagogicalGuide} from './src/components/PedagogicalGuide.jsx'; export {LearningExposureContext} from './src/components/LearningExposureContext.jsx';",loader:'jsx'},outfile,bundle:true,format:'esm',platform:'node',packages:'external'});
 const {PedagogicalGuide,LearningExposureContext}=await import(pathToFileURL(outfile));const exposures=[];const onExposure=(...event)=>exposures.push(event);const guide=()=>React.createElement(PedagogicalGuide,{guideId:'entrevista_clinica',autoOpen:true});const mock=()=>({querySelector:()=>({})});
 await act(async()=>{ui=TestRenderer.create(guide(),{createNodeMock:mock});});assert.equal(observed.length,0,'ordinary simulator does not attach study observation');
 await act(async()=>ui.update(React.createElement(LearningExposureContext.Provider,{value:onExposure},guide())));assert.equal(observed.length,1);
 observed[0].callback([{isIntersecting:false,intersectionRatio:0}]);observed[0].callback([{isIntersecting:true,intersectionRatio:.02}]);assert.equal(exposures.length,0);
 observed[0].callback([{isIntersecting:true,intersectionRatio:.7}]);assert.equal(exposures[0][0],'guide_shown');assert.match(exposures[0][1],/@pedagogical-guides-/);
 const close=ui.root.findAllByType('button').find(n=>n.props['aria-label']==='Cerrar guía');await act(async()=>close.props.onClick());assert.ok(disconnected>0);
 console.log('PASS guide exposure: study-only opt-in, viewport threshold, versioned resource and observer cleanup; no reading inference');
}finally{if(ui)await act(async()=>ui.unmount());globalThis.IntersectionObserver=oldObserver;await rm(temp,{recursive:true,force:true});}
