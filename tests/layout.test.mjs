import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLayout,validateLayout,createNode,moveNode,layoutCSS,locate,safeUrl} from '../layout-model.js';
test('layout: application widgets remain unique and cycles are rejected',()=>{
 const doc=defaultLayout(),container=createNode('container');container.children.push(createNode('text'));doc.nodes.push(container);
 assert.equal(moveNode(doc,container.id,container.children[0].id,'inside'),false);
 assert.equal(moveNode(doc,'native-calendar',container.id,'inside'),true);
 assert.equal(locate(doc.nodes,'native-calendar').parent.id,container.id);
 assert.equal(validateLayout(doc).nodes.length,6);
 doc.nodes.push(createNode('calendar'));assert.throws(()=>validateLayout(doc),/hanya boleh/);
});
test('layout: safe rendering rejects executable URLs, CSS injection, duplicate IDs and excessive trees',()=>{
 const doc=defaultLayout(),button=createNode('button');doc.nodes.push(button);
 button.props.href='javascript:alert(1)';assert.throws(()=>validateLayout(doc),/Tautan/);
 button.props.href='#kalender';doc.nodes[0].styles.desktop.backgroundColor='red;}body{display:none';
 assert.throws(()=>validateLayout(doc),/Nilai/);
 assert.equal(safeUrl('data:image/svg+xml;base64,abc',true),'');
 assert.equal(safeUrl('//evil.test/a.png',true),'');
 assert.equal(safeUrl('https://example.org/a.png',true),'https://example.org/a.png');
 doc.nodes[0].styles.desktop={};doc.nodes[1].id=doc.nodes[0].id;assert.throws(()=>validateLayout(doc),/Struktur/);
});
test('layout: responsive styles and native box styles survive validation',()=>{
 const doc=defaultLayout(),n=doc.nodes[0];
 n.styles.desktop.padding='20px';n.styles.mobile.padding='10px';
 n.parts={card:{desktop:{backgroundColor:'#123456'},tablet:{},mobile:{borderRadius:'8px'}}};
 const css=layoutCSS(doc);
 assert.match(css,/@media\(max-width:740px\)/);assert.match(css,/#monthly-message\{background-color:#123456!important;background-image:none!important/);
 assert.equal(validateLayout(doc).nodes[0].parts.card.mobile.borderRadius,'8px');
});
