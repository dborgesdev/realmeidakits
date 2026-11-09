<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class AccountPage {
    public static function render(): void {
        if(!is_ssl()&&!in_array(wp_parse_url(home_url(),PHP_URL_HOST),['localhost','127.0.0.1','[::1]'],true))wp_die('HTTPS necessário para acessar sua conta.','Re Almeida Kits',['response'=>400]);
        AccountAuth::headers();
        $client=is_string($_GET['client']??null)?$_GET['client']:'';
        $state=is_string($_GET['state']??null)?$_GET['state']:'';
        $challenge=is_string($_GET['challenge']??null)?$_GET['challenge']:'';
        if(!AccountAuth::callback($client)||!preg_match('/^[A-Za-z0-9_-]{43,128}$/D',$state)||!preg_match('/^[A-Za-z0-9_-]{43}$/D',$challenge))wp_die('Solicitação de autenticação inválida.','Re Almeida Kits',['response'=>400]);
        AccountAuth::headers(substr($client,0,-strlen('/conta/retorno')));
        if(!AccountAuth::throttle('authorize',60,60))wp_die('Muitas tentativas. Aguarde.','Re Almeida Kits',['response'=>429]);
        $register=($_GET['intent']??'')==='register';$error='';$values=[];
        $url=add_query_arg(['action'=>'rak_authorize','client'=>$client,'state'=>$state,'challenge'=>$challenge],admin_url('admin-post.php'));
        if(($_GET['intent']??'')==='recover'){wp_redirect(wp_lostpassword_url(add_query_arg('notice','recovery',$url)),303);exit;}
        if(($_SERVER['REQUEST_METHOD']??'GET')==='POST') {
            $origin=get_http_origin();$parts=wp_parse_url(home_url());$own=$parts['scheme'].'://'.$parts['host'].(isset($parts['port'])?':'.$parts['port']:'');
            if($origin!==$own||!is_string($_POST['_wpnonce']??null)||!wp_verify_nonce($_POST['_wpnonce'],'rak_account_form'))wp_die('Solicitação expirada. Reabra a página.','Re Almeida Kits',['response'=>403]);
            if(strlen((string)file_get_contents('php://input'))>16384)wp_die('Formulário excede o limite.','Re Almeida Kits',['response'=>413]);
            $values=wp_unslash($_POST);$operation=$values['operation']??'';
            if($operation==='register') {
                $register=true;
                if(!AccountAuth::throttle('register',8,3600))$result=Identity::error('Muitas tentativas. Tente mais tarde.',429);
                else $result=Accounts::create($values);
                if(is_wp_error($result))$error=$result->get_error_message();
                else {
                    $user=wp_signon(['user_login'=>get_userdata($result)->user_login,'user_password'=>$values['password'],'remember'=>false],is_ssl());
                    if(is_wp_error($user))$error='Conta criada. Entre com seu e-mail e senha.';else wp_set_current_user($user->ID);
                }
            } elseif($operation==='login') {
                if(!is_string($values['login']??null)||!is_string($values['password']??null)||strlen($values['password'])>128)$error='Confira seu e-mail e senha.';
                elseif(!AccountAuth::throttle('login-ip',60,900))$error='Muitas tentativas. Tente mais tarde.';
                else {$user=wp_signon(['user_login'=>$values['login'],'user_password'=>$values['password'],'remember'=>!empty($values['remember'])],is_ssl());if(is_wp_error($user))$error='Não foi possível entrar. Confira e-mail e senha ou recupere o acesso.';else wp_set_current_user($user->ID);}
            } elseif($operation==='complete'&&is_user_logged_in()&&AccountAuth::customer(get_current_user_id())) {
                $result=Accounts::update(get_current_user_id(),$values);if(is_wp_error($result))$error=$result->get_error_message();
            } else $error='Operação inválida.';
            unset($values['password']);
        }
        $user=get_current_user_id();$complete=false;
        if($user) {
            if(!AccountAuth::customer($user))$error='Use uma conta de cliente para acessar a área de corredores.';
            else {
                $profile=Accounts::profile($user);$valid=Identity::person($profile,true);
                // Claim even existing profiles before issuing a session: legacy conflicts fail closed.
                $saved=is_wp_error($valid)?$valid:Accounts::update($user,$profile);
                if(is_wp_error($saved)){$complete=true;$values=$values?:$profile;if(!$error&&!is_wp_error($valid))$error=$saved->get_error_message();}
                elseif(!$error) {
                    $code=AccountAuth::record('code',$user,['client'=>$client,'challenge'=>$challenge],120);
                    wp_redirect(add_query_arg(['code'=>$code,'state'=>$state],$client),303);exit;
                }
            }
        }
        $title=$complete?'Complete seu cadastro':($register?'Crie sua conta':'Entre na sua conta');
        status_header(200);header('Content-Type: text/html; charset=UTF-8');
        echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'.esc_html($title).' · Re Almeida Kits</title><style>body{margin:0;background:#f7f5f0;color:#17212a;font:16px/1.5 system-ui}main{max-width:480px;margin:40px auto;padding:28px;background:white;border-radius:16px}label{display:block;margin:16px 0}input{display:block;box-sizing:border-box;width:100%;padding:12px;border:1px solid #64748b;border-radius:6px;font:inherit}input[type=checkbox]{display:inline;width:auto}button,a{min-height:44px}button{background:#d90826;color:white;border:0;padding:12px 24px;border-radius:6px;font:inherit;cursor:pointer}a{color:#a9001b;display:inline-block;margin:10px 14px 10px 0}input:focus,a:focus,button:focus{outline:3px solid #1448a5;outline-offset:3px}.error{color:#a9001b;border-left:4px solid;padding:12px}@media(max-width:540px){main{margin:0;padding:24px 16px;border-radius:0}}</style></head><body><main><p>Re Almeida Kits · Serviço de retirada</p><h1>'.esc_html($title).'</h1>';
        if(($_GET['notice']??'')==='recovery')echo '<p role="status">Se houver uma conta com este e-mail, as instruções de recuperação serão enviadas. Confira também a caixa de spam.</p>';
        if($error)echo '<p role="alert" class="error">'.esc_html($error).'</p>';
        if(!$user||$complete){
            echo '<form data-rak-account method="post" action="'.esc_url($register?add_query_arg('intent','register',$url):$url).'">';wp_nonce_field('rak_account_form');
            echo '<input type="hidden" name="operation" value="'.($complete?'complete':($register?'register':'login')).'">';
            if($register||$complete){
                foreach(['name'=>'Nome completo','cpf'=>'CPF','birthDate'=>'Data de nascimento','phone'=>'Telefone com DDD','email'=>'E-mail'] as $key=>$label){
                    $type=match($key){'birthDate'=>'date','email'=>'email','phone'=>'tel',default=>'text'};
                    $value=is_string($values[$key]??null)?$values[$key]:'';$readonly=$complete&&($key==='email'||($key==='cpf'&&Identity::cpf($profile['cpf']??'')));
                    echo '<label>'.esc_html($label).'<input required name="'.esc_attr($key).'" type="'.$type.'" maxlength="'.($key==='name'?80:120).'" value="'.esc_attr($value).'"'.($readonly?' readonly':'').($key==='birthDate'?' min="1900-01-01" max="'.esc_attr(current_time('Y-m-d')).'"':'').'></label>';
                }
            }else echo '<label>E-mail<input required name="login" type="email" maxlength="120" autocomplete="username"></label>';
            if(!$complete)echo '<label>Senha<input required name="password" type="password" '.($register?'minlength="12"':'').' maxlength="128" autocomplete="'.($register?'new-password':'current-password').'"></label>';
            if(!$register&&!$complete)echo '<label><input type="checkbox" name="remember" value="1"> Manter acesso neste dispositivo</label>';
            echo '<button type="submit">'.($complete?'Salvar e continuar':($register?'Criar conta':'Entrar')).'</button></form>';
        }
        echo '<nav aria-label="Acesso à conta"><a href="'.esc_url($register?$url:add_query_arg('intent','register',$url)).'">'.($register?'Já tenho conta':'Criar conta').'</a><a href="'.esc_url(wp_lostpassword_url(add_query_arg('notice','recovery',$url))).'">Recuperar senha</a><a href="'.esc_url(str_replace('/conta/retorno','/conta',$client)).'">Voltar ao site</a>';
        if($user)echo '<a href="'.esc_url(wp_logout_url($url)).'">Sair desta conta WordPress</a>';
        echo '</nav></main><script src="'.esc_url(plugins_url('assets/account.js',FILE)).'" defer></script></body></html>';exit;
    }
}
