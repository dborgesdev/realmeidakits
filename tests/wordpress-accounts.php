<?php
/** Local WordPress functional tests. All identities are generated synthetic test records. */
require ($argv[1]??'').'/wp-load.php';
if(home_url()!=='http://127.0.0.1:8087')throw new Exception('Local environment only');
use ReAlmeida\Kits\{Accounts,AccountAuth,Identity,Migrations};
$count=0;$created=[];$mail=[];$_SERVER['REMOTE_ADDR']='127.0.0.1';
function checkC($ok,$label){global $count;if(!$ok)throw new Exception('FAIL '.$label);echo 'OK '.$label.PHP_EOL;$count++;}
function cpfC(int $n):string{$value=str_pad((string)($n+81000000),9,'0',STR_PAD_LEFT);for($l=9;$l<11;$l++){$sum=0;for($i=0;$i<$l;$i++)$sum+=(int)$value[$i]*($l+1-$i);$d=($sum*10)%11;$value.=($d===10?0:$d);}return $value;}
function dataC(int $n):array{return ['name'=>'DEMONSTRAÇÃO — cliente de teste '.$n,'cpf'=>cpfC($n),'phone'=>'21999990001','email'=>'blockc-'.wp_generate_uuid4().'@example.invalid','birthDate'=>'1990-01-01'];}
function callC(string $method,string $route,?string $token=null,?array $body=null,string $origin='http://localhost:5173'){
 $r=new WP_REST_Request($method,'/re-almeida/v1'.$route);$r->set_header('Origin',$origin);if($token)$r->set_header('Authorization','Bearer '.$token);if($body!==null){$r->set_header('Content-Type','application/json');$r->set_body(wp_json_encode($body));}return rest_do_request($r);
}
function tokenC(int $id,string $client='http://localhost:5173/conta/retorno'):string{return AccountAuth::record('access',$id,['client'=>$client],900);}
function codeC(int $id,string $verifier):string{return AccountAuth::record('code',$id,['client'=>'http://localhost:5173/conta/retorno','challenge'=>rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'=')],120);}
$hadRole=(bool)get_role('customer');if(!$hadRole)add_role('customer','Customer',['read'=>true]);
add_filter('pre_wp_mail',static function($return,$args)use(&$mail){$mail[]=$args;return true;},10,2);
try{
 Accounts::install();checkC((int)get_option('rak_accounts_schema')===1,'tabelas próprias instaladas');
 checkC(Identity::cpf(cpfC(1))&&!Identity::cpf('11111111111')&&!Identity::cpf(substr(cpfC(1),0,10).'x'),'CPF verifica dígitos e sequências repetidas');
 $person=dataC(random_int(100,100000));$password=wp_generate_password(20,true);$id=Accounts::create($person+['password'=>$password]);checkC(is_int($id),'cadastro cria usuário WordPress real');$created[]=$id;
 checkC(in_array('customer',get_userdata($id)->roles,true)&&!user_can($id,'manage_options'),'conta tem apenas acesso de cliente');
 checkC(wp_check_password($password,get_userdata($id)->user_pass,$id)&&get_userdata($id)->user_pass!==$password,'senha armazenada por hash nativo');
 checkC(Accounts::profile($id)['cpf']===$person['cpf']&&get_user_meta($id,'billing_phone',true)===$person['phone'],'perfil e dados WooCommerce persistidos');
 $duplicate=$person;$duplicate['email']='other-'.wp_generate_uuid4().'@example.invalid';checkC(is_wp_error(Accounts::create($duplicate+['password'=>$password])),'CPF duplicado não cria segunda conta');
 $bad=$person;$bad['cpf']='00000000000';checkC(is_wp_error(Accounts::create($bad+['password'=>$password])),'cadastro rejeita CPF inválido');
 $legacyData=dataC(random_int(100001,200000));$legacy=wp_insert_user(['user_login'=>'legacy-'.wp_generate_uuid4(),'user_email'=>$legacyData['email'],'user_pass'=>$password,'role'=>'customer']);$created[]=$legacy;
 $cpf=$legacyData['cpf'];update_user_meta($legacy,'billing_cpf',substr($cpf,0,3).'.'.substr($cpf,3,3).'.'.substr($cpf,6,3).'-'.substr($cpf,9));$legacyData['email']='new-'.wp_generate_uuid4().'@example.invalid';
 checkC(is_wp_error(Accounts::create($legacyData+['password'=>$password])),'CPF formatado em conta legada impede duplicidade');
 wp_set_current_user(0);$login=wp_authenticate($person['email'],$password);checkC(!is_wp_error($login)&&$login->ID===$id,'login real por e-mail e senha nativos');checkC(is_wp_error(wp_authenticate($person['email'],'wrong-password')),'senha incorreta rejeitada');
 $token=tokenC($id);checkC(callC('GET','/account')->get_status()===401,'visitante sem token não acessa perfil');
 checkC(callC('GET','/account',$token,null,'https://evil.invalid')->get_status()===403,'origem externa rejeitada');
 checkC(callC('GET','/account',$token)->get_data()['data']['id']===$id,'bearer válido acessa somente titular');
 checkC(callC('GET','/account',$token,null,'null')->get_status()===403,'origem nula rejeitada');
 checkC(callC('GET','/account',$token,null,'https://realmeidakits.com.br')->get_status()===403,'sessão vinculada à origem cliente original');
 checkC(callC('POST','/auth/token',null,[],'')->get_status()===403,'troca de código sem Origin é recusada');
 $adminToken=tokenC(get_user_by('login','rak-local')->ID);checkC(callC('GET','/account',$adminToken)->get_status()===401,'sessão de administrador não vira sessão customer');
 $tokenRow=AccountAuth::row($token,'access');checkC($tokenRow->hash===hash('sha256',$token)&&!str_contains($tokenRow->data,$token),'bearer não é armazenado em texto no servidor');
 checkC(callC('PUT','/account',$token,['name'=>['invalid']])->get_status()===400,'campos com tipos inválidos rejeitados');
 $oversized=$person;$oversized['name']=str_repeat('x',17000);checkC(callC('PUT','/account',$token,$oversized)->get_status()===413,'corpo excessivo não é processado');
 $changed=$person;$changed['name']='DEMONSTRAÇÃO — nome atualizado';$response=callC('PUT','/account',$token,$changed);checkC($response->get_status()===200&&Accounts::profile($id)['name']===$changed['name'],'edição persiste no WordPress');
 $changed['cpf']=cpfC(500000);checkC(callC('PUT','/account',$token,$changed)->get_status()===409,'titular não troca CPF pelo endpoint');
 $changed=$person;$changed['email']='change@example.invalid';checkC(callC('PUT','/account',$token,$changed)->get_status()===409,'e-mail de acesso não muda sem verificação');
 $participant=dataC(random_int(200001,300000));$response=callC('POST','/account/participants',$token,$participant);checkC($response->get_status()===201,'participante salvo sem criar conta');$saved=$response->get_data()['data'];
 checkC(!email_exists($participant['email']),'participante não recebe usuário WordPress');
 checkC(callC('POST','/account/participants',$token,$participant)->get_status()===409,'CPF duplicado no grupo rejeitado');
 $otherToken=tokenC($legacy);checkC(callC('GET','/account/participants',$otherToken)->get_data()['data']===[],'outro titular não lista participantes alheios');
 checkC(callC('PUT','/account/participants/'.$saved['id'],$otherToken,$participant+['version'=>1])->get_status()===404,'outro titular não edita participante por ID');
 checkC(callC('DELETE','/account/participants/'.$saved['id'],$otherToken)->get_status()===404,'outro titular não remove participante por ID');
 $participant['name']='DEMONSTRAÇÃO — participante editado';checkC(callC('PUT','/account/participants/'.$saved['id'],$token,$participant+['version'=>1])->get_status()===200,'participante editado e versionado');
 checkC(callC('PUT','/account/participants/'.$saved['id'],$token,$participant+['version'=>1])->get_status()===409,'edição concorrente antiga rejeitada');
 for($n=1;$n<20;$n++){ $p=dataC(400000+$n);$r=Accounts::saveParticipant($id,$p);if(is_wp_error($r))throw new Exception($r->get_error_message()); }
 checkC(count(Accounts::participants($id))===20&&is_wp_error(Accounts::saveParticipant($id,dataC(500001))),'limite de 20 participantes persistidos');
 $verifier=str_repeat('a',64);$code=codeC($id,$verifier);
 checkC(callC('POST','/auth/token',null,['code'=>$code,'verifier'=>str_repeat('b',64),'redirectUri'=>'http://localhost:5173/conta/retorno'])->get_status()===401,'PKCE incorreto não troca código');
 $exchange=callC('POST','/auth/token',null,['code'=>$code,'verifier'=>$verifier,'redirectUri'=>'http://localhost:5173/conta/retorno']);checkC($exchange->get_status()===200&&isset($exchange->get_data()['accessToken']),'PKCE correto produz sessão de cliente');
 checkC(callC('POST','/auth/token',null,['code'=>$code,'verifier'=>$verifier,'redirectUri'=>'http://localhost:5173/conta/retorno'])->get_status()===401,'código não pode ser reutilizado');
 checkC(!AccountAuth::callback('https://evil.invalid/conta/retorno')&&!AccountAuth::callback('http://localhost:5173/conta/retorno?x=1')&&AccountAuth::callback('http://localhost:5173/conta/retorno'),'redirect URI exato impede redirecionamento aberto');
 global $wpdb;$expired=tokenC($id);$wpdb->update(Accounts::table('sessions'),['expires'=>time()-1],['hash'=>hash('sha256',$expired)]);checkC(callC('GET','/account',$expired)->get_status()===401,'token expirado é recusado');
 $logout=callC('POST','/auth/logout',$token,[]);checkC($logout->get_status()===200&&callC('GET','/account',$token)->get_status()===401,'logout revoga bearer no servidor');
 $after=tokenC($id);checkC(count(callC('GET','/account/participants',$after)->get_data()['data'])===20,'nova sessão recupera os participantes salvos');
 $mail=[];checkC(retrieve_password($person['email'])===true&&count($mail)>0,'recuperação usa wp_mail configurado (interceptado no teste)');
 $key=get_password_reset_key(get_userdata($id));checkC(!is_wp_error(check_password_reset_key($key,get_userdata($id)->user_login)),'chave nativa de redefinição válida');
 $newPassword=wp_generate_password(22,true);reset_password(get_userdata($id),$newPassword);checkC(wp_check_password($newPassword,get_userdata($id)->user_pass,$id)&&callC('GET','/account',$after)->get_status()===401,'redefinição altera senha e revoga sessões');
 checkC(is_wp_error(check_password_reset_key($key,get_userdata($id)->user_login)),'chave de senha é de uso único');
 checkC(callC('DELETE','/account/participants/'.$saved['id'],tokenC($id))->get_status()===200,'titular remove seu participante');
 $blocked=Accounts::locked('participants_'.$id,static fn()=>Accounts::saveParticipant($id,dataC(800000)));checkC(is_wp_error($blocked)&&str_contains($blocked->get_error_message(),'em andamento'),'mutações concorrentes respeitam trava por titular');
 $expiredCode=codeC($id,$verifier);$wpdb->update(Accounts::table('sessions'),['expires'=>time()-1],['hash'=>hash('sha256',$expiredCode)]);checkC(callC('POST','/auth/token',null,['code'=>$expiredCode,'verifier'=>$verifier,'redirectUri'=>'http://localhost:5173/conta/retorno'])->get_status()===401,'código de autorização expirado não é trocado');
 $before=Accounts::participants($id);Migrations::upgrade();checkC($before===Accounts::participants($id),'migração repetida preserva participantes');
 echo 'PASS: '.$count.' verificações Bloco C.'.PHP_EOL;
}finally{require_once ABSPATH.'wp-admin/includes/user.php';foreach($created as $id)wp_delete_user($id);if(!$hadRole)remove_role('customer');}
