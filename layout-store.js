import {validateLayout} from './layout-model.js';
export function layoutStore(client){
 async function unwrap(query){const {data,error}=await query;if(error)throw Error(error.message?.includes('CONFLICT')?'Layout berubah di sesi lain. Muat ulang sebelum menyimpan.':error.message||'Permintaan gagal.');return data;}
 return {
  async allowed(){return await unwrap(client.rpc('god_time_is_layout_admin'));},
  async load(){
   const [draft,published]=await Promise.all([
    unwrap(client.from('god_time_layout_drafts').select('document,revision').eq('id','home').maybeSingle()),
    unwrap(client.from('god_time_layout_published').select('document,revision').eq('id','home').maybeSingle())
   ]);return {draft,published};
  },
  async save(document,revision){return unwrap(client.rpc('god_time_save_layout',{p_document:validateLayout(document),p_expected:revision}));},
  async publish(draftRevision,publishedRevision){return unwrap(client.rpc('god_time_publish_layout',{p_expected:draftRevision,p_published_expected:publishedRevision}));},
  async history(){return unwrap(client.from('god_time_layout_revisions').select('revision,created_at,document').order('revision',{ascending:false}).limit(20));},
  async upload(file){
   if(!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type)||file.size>5*1024*1024)throw Error('Gunakan PNG, JPG, WebP, atau AVIF maksimal 5 MB.');
   const {data:{user}}=await client.auth.getUser();if(!user)throw Error('Masuk kembali sebelum mengunggah.');
   const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/avif':'avif'}[file.type];
   const name=user.id+'/'+crypto.randomUUID()+'.'+ext;
   await unwrap(client.storage.from('god-time-design-media').upload(name,file,{contentType:file.type,upsert:false}));
   return client.storage.from('god-time-design-media').getPublicUrl(name).data.publicUrl;
  }
 };
}
