<?php
/** Local-only functional refinement tests. Never target a hosted WordPress. */
require ($argv[1] ?? '') . '/wp-load.php';
if (home_url() !== 'http://127.0.0.1:8087') throw new Exception('Use the existing disposable local installation.');
use ReAlmeida\Kits\{Schema,Repository,Library,PublicModels,Duplicate,Migrations,Rest};
wp_set_current_user(get_user_by('login','rak-local')->ID);
$count=0; $created=[];
function verify($ok,$label) { global $count; if(!$ok) throw new Exception('FAIL: '.$label); echo 'OK '.$label.PHP_EOL; $count++; }
function validConfig() {
    $d=[];
    foreach(Schema::sections() as $section) foreach($section['fields'] as $key=>$f) $d[$key]=match($f['type']) {'checkbox'=>false,'money'=>null,'image'=>0,'rows','lines'=>[],'select'=>array_key_first($f['options']),default=>''};
    $d['officialEnabled']=true; $d['appaiEnabled']=true; $d['numberEnabled']=true;
    $d['distances']=[['id'=>'demo-distance','label'=>'5 km — DEMONSTRAÇÃO','modality'=>'both']]; $d['status']='open';
    return $d;
}
function createItem($type,$title) { global $created; $id=wp_insert_post(['post_type'=>$type,'post_status'=>'draft','post_title'=>$title]); if(!$id || is_wp_error($id))throw new Exception('Create failed');$created[]=$id;return $id; }
function makePdf():string {
    $objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>'];
    $text='BT /F1 16 Tf 50 760 Td (DEMONSTRACAO - MODELO EM BRANCO - SEM VALIDADE) Tj ET';
    $objects[]='<< /Length '.strlen($text)." >>\nstream\n".$text."\nendstream";$objects[]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    $pdf="%PDF-1.4\n";$offsets=[0];foreach($objects as $i=>$object){$offsets[]=strlen($pdf);$pdf.=($i+1)." 0 obj\n".$object."\nendobj\n";}
    $xref=strlen($pdf);$pdf.="xref\n0 6\n0000000000 65535 f \n";foreach(array_slice($offsets,1) as $offset)$pdf.=sprintf('%010d 00000 n ',$offset)."\n";
    return $pdf."trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
}
try {
    verify(count(Schema::sections())===8,'oito abas sem trocar chaves persistidas');
    $upload=wp_upload_bits('demonstracao-modelo-'.wp_generate_uuid4().'.pdf',null,makePdf());
    verify(!$upload['error'],'PDF modelo armazenado pela API WordPress');
    $attachment=wp_insert_attachment(['post_title'=>'DEMONSTRAÇÃO — formulário público em branco','post_mime_type'=>'application/pdf','post_status'=>'inherit'],$upload['file']);
    verify(!is_wp_error(PublicModels::validate($attachment)),'tipo, extensão, conteúdo e diretório PDF validados');
    verify(is_wp_error(PublicModels::approve($attachment,false)),'exige confirmação de modelo público em branco');
    $doc=createItem('rak_document','DEMONSTRAÇÃO — autorização reutilizável');
    $input=['label'=>'DEMONSTRAÇÃO — autorização reutilizável','guidance'=>'Preencha o modelo e assine. Use apenas exemplos neste teste.','purpose'=>'Autorização de retirada por terceiros','requiresUpload'=>true,'templateId'=>$attachment,'confirmPublicTemplate'=>true,'active'=>true];
    $saved=Library::store($doc,$input);verify(!is_wp_error($saved)&&$saved['version']===1,'documento criado com PDF público e versão 1');
    verify(Library::get($doc)===$saved,'documento reaberto mantém todos os campos');
    verify(Library::store($doc,$input)['version']===1,'salvar documento sem mudança mantém versão');
    $url=PublicModels::describe($attachment);verify($url && str_contains($url['url'],'action=rak_public_model') && $url['mime']==='application/pdf','download somente pelo endpoint público de modelo aprovado');
    verify(wp_delete_attachment($attachment,true)===false && is_file($upload['file']),'exclusão de modelo histórico protegida');
    $invalid=wp_upload_bits('demonstracao-invalido-'.wp_generate_uuid4().'.pdf',null,'not a PDF');
    if(!$invalid['error']) { $bad=wp_insert_attachment(['post_title'=>'DEMONSTRAÇÃO — inválido','post_mime_type'=>'application/pdf','post_status'=>'inherit'],$invalid['file']);$created[]=$bad;verify(is_wp_error(PublicModels::validate($bad)),'conteúdo falso com extensão PDF rejeitado'); } else verify(true,'WordPress rejeitou PDF inválido');
    $condition=createItem('rak_condition','DEMONSTRAÇÃO — condição reutilizável');
    $term=Library::store($condition,['label'=>'DEMONSTRAÇÃO — condição reutilizável','text'=>'DEMONSTRAÇÃO — condição versão inicial, sem validade jurídica.','active'=>true]);
    verify($term['version']===1,'condição reutilizável criada');
    $r1=createItem('corrida','DEMONSTRAÇÃO — reutilização A');$r2=createItem('corrida','DEMONSTRAÇÃO — reutilização B');
    $config=validConfig();$config['documents']=[Library::associate($doc,['modality'=>'appai'])];$config['conditions']=[Library::associate($condition)];
    Repository::save($r1,Schema::validate($config));Repository::save($r2,Schema::validate($config));
    verify(Repository::get($r1)['documents'][0]['libraryId']===Repository::get($r2)['documents'][0]['libraryId'],'mesmo documento associado a duas corridas');
    $removed=Repository::get($r1);$removed['documents']=[];Repository::save($r1,$removed);
    verify(count(Repository::get($r2)['documents'])===1 && Library::get($doc)['active'],'remover associação A preserva corrida B e biblioteca');
    $input['guidance']='DEMONSTRAÇÃO — novas instruções';$input['active']=false;$updated=Library::store($doc,$input);
    verify($updated['version']===2 && !$updated['active'],'documento editado e desativado com nova versão');
    verify(!in_array($doc,array_column(Library::available('rak_document'),'libraryId'),true),'documento inativo ausente em novas seleções');
    verify(Repository::get($r2)['documents'][0]['guidance']===$saved['guidance'],'instrução histórica da corrida B preservada');
    verify(PublicModels::describe($attachment)!==null,'download histórico continua após desativação');
    $newTerm=Library::store($condition,['label'=>$term['label'],'text'=>'DEMONSTRAÇÃO — texto revisado.','active'=>true]);
    verify($newTerm['version']===2,'edição da condição gera nova versão');
    verify(get_post_meta($condition,'_rak_library_history',true)[1]['text']===$term['text'],'histórico da biblioteca mantém texto anterior');
    verify(Repository::get($r2)['conditions'][0]['text']===$term['text'],'corrida antiga não recebe alteração retroativa');
    $new=Repository::get($r1);$new['conditions']=[Library::associate($condition)];Repository::save($r1,$new);
    verify(Repository::get($r1)['conditions'][0]['text']===$newTerm['text'],'reassociação explícita aplica nova versão');
    $d=Repository::get($r2);$d['raceDate']='2099-12-01';$d['raceTime']='08:00';$d['opensAt']='2099-10-01T00:00:00-03:00';$d['closesAt']='2099-11-01T00:00:00-03:00';$d['location']='DEMONSTRAÇÃO — local';$d['officialPix']=1234;$d['whatsappUrl']='';$d['kits']=[['id'=>'demo-kit','label'=>'DEMONSTRAÇÃO — kit','pix'=>1234,'card'=>2345]];Repository::save($r2,$d);
    $copy=Duplicate::create($r2);$created[]=$copy;$copied=Repository::get($copy);
    verify(get_post_status($copy)==='draft'&&$copied['status']==='unavailable','duplicação cria somente rascunho indisponível');
    verify(!$copied['raceDate']&&!$copied['raceTime']&&!$copied['opensAt']&&!$copied['closesAt']&&!$copied['location']&&!get_post_thumbnail_id($copy),'duplicação limpa dados específicos e imagem');
    verify($copied['officialPix']===null&&$copied['kits'][0]['pix']===null,'duplicação limpa preços inclusive por opção');
    verify($copied['documents']===$d['documents']&&$copied['distances']===$d['distances'],'duplicação preserva exigências e configurações recorrentes');
    wp_update_post(['ID'=>$copy,'post_status'=>'publish']);verify(get_post_status($copy)==='draft','publicação da cópia bloqueada antes de revisão');
    $_POST=['rak_nonce'=>wp_create_nonce('rak_save_'.$copy),'rak_copy_reviewed'=>'1','rak_payload'=>wp_slash(wp_json_encode($copied))];
    wp_update_post(['ID'=>$copy,'post_title'=>'DEMONSTRAÇÃO — cópia revisada','post_status'=>'publish']);$_POST=[];
    verify(get_post_status($copy)==='publish'&&!get_post_meta($copy,'_rak_duplicate_review',true),'editar e confirmar revisão permite publicar cópia');
    wp_update_post(['ID'=>$r2,'post_status'=>'publish']);
    wp_set_current_user(0);
    $response=rest_do_request(new WP_REST_Request('GET','/re-almeida/v1/corridas/'.get_post($r2)->post_name));$body=$response->get_data()['data'];
    verify($response->get_status()===200,'endpoint individual preservado');
    $appai=current(array_filter($body['modalities'],fn($m)=>$m['id']==='appai'));
    verify($appai['documents'][0]['template']['url']===$url['url']&&$appai['documents'][0]['guidance']===$saved['guidance'],'API expõe modelo público e instruções da versão da corrida');
    verify(!str_contains(wp_json_encode($body),'libraryId')&&!str_contains(wp_json_encode($body),'_rak_'),'API não expõe referências administrativas ou histórico');
    verify($body['conditions'][0]['text']===$term['text']&&isset($body['conditions'][0]['version']),'API preserva condições e versões anteriores');
    verify(is_wp_error(PublicModels::approve($attachment,true))&&is_wp_error(Duplicate::create($r2)),'visitante não aprova modelo nem duplica corrida');
    verify(rest_do_request(new WP_REST_Request('GET','/wp/v2/rak_document'))->get_status()===404,'biblioteca administrativa não é REST pública');
    wp_set_current_user(get_user_by('login','rak-local')->ID);
    // Retryable migration of a legacy requirement. Existing IDs/config values must survive.
    $legacy=createItem('corrida','DEMONSTRAÇÃO — migração legada');$old=validConfig();$old['documents']=[['id'=>'legacy-demo-id','label'=>'DEMONSTRAÇÃO — exigência legada','guidance'=>'DEMONSTRAÇÃO — instrução antiga','modality'=>'oficial','scope'=>'personal','required'=>true]];$old['conditions']=[['id'=>'legacy-condition-demo','text'=>'DEMONSTRAÇÃO — condição legada','version'=>7,'active'=>true]];
    update_post_meta($legacy,Repository::KEY,wp_slash($old));$before=Repository::get($legacy);
    update_option('rak_schema_version',1);delete_option('rak_migration_2_offset');do { Migrations::upgrade(); } while((int)get_option('rak_schema_version')<2);
    $after=Repository::get($legacy);verify($after['documents'][0]['id']==='legacy-demo-id'&&$after['conditions'][0]['version']===7&&$after['distances']===$before['distances'],'migração preserva IDs, versões e configurações antigas');
    verify($after['documents'][0]['libraryId']>0&&$after['conditions'][0]['libraryId']>0,'migração associa exigência e condição antigas à biblioteca');
    $beforeCount=count(Library::available('rak_document'));Migrations::upgrade();verify(count(Library::available('rak_document'))===$beforeCount&&Repository::get($legacy)===$after,'migração idempotente não duplica nem altera corrida');
    echo "PASS: $count verificações de refinamento no WordPress real.".PHP_EOL;
    file_put_contents(__DIR__.'/../.local-tools/refinement-result.json',wp_json_encode(['count'=>$count,'publicModel'=>$url,'attachment'=>$attachment]));
} finally { $_POST=[]; foreach($created as $id) if(is_int($id)) wp_delete_post($id,true); }
