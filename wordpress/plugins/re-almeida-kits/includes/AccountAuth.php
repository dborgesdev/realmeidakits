<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class AccountAuth {
    private static ?\WeakMap $authenticated = null;
    public static function boot(): void {
        add_action('rest_api_init',[self::class,'routes']);
        add_filter('rest_pre_serve_request',[self::class,'cors'],30,4);
        add_filter('rest_post_dispatch',static function($response,$server,$request){if(preg_match('#^/re-almeida/v1/(?:account|auth)(?:/|$)#',$request->get_route())){$response->header('Cache-Control','no-store, private');$response->header('Pragma','no-cache');}return $response;},10,3);
        if (NativeSession::legacy()) foreach(['rak_authorize'=>'authorize','rak_end_session'=>'endSession'] as $action=>$handler){add_action('admin_post_'.$action,[self::class,$handler]);add_action('admin_post_nopriv_'.$action,[self::class,$handler]);}
        add_action('after_password_reset',static fn($user)=>self::revokeUser($user->ID));
        add_action('wp_set_password',static fn($password,$id)=>self::revokeUser((int)$id),10,2);
        add_action('profile_update',static function($id,$old){if(get_userdata($id)->user_pass!==$old->user_pass)self::revokeUser((int)$id);},10,2);
        add_action('wp_logout',static fn($id)=>self::revokeUser((int)$id));
        add_action('deleted_user',static function($id){global $wpdb;self::revokeUser((int)$id);$wpdb->delete(Accounts::table('identities'),['user_id'=>$id]);$wpdb->delete(Accounts::table('participants'),['owner_id'=>$id]);});
        add_filter('authenticate',[self::class,'loginLimit'],5,3);
        add_action('wp_login_failed',static function($login){self::throttle('login-'.strtolower((string)$login),10,900);});
    }
    public static function allowedOrigin(string $origin): bool {
        return Rest::localOrigin($origin)||in_array($origin,apply_filters('rak_account_origins',['https://realmeidakits.com.br','https://www.realmeidakits.com.br','https://realmeidakits.smartlocal.workers.dev']),true);
    }
    public static function callback(string $url): bool {
        $parts=wp_parse_url($url);if(!$parts||isset($parts['user'])||isset($parts['pass'])||isset($parts['query'])||isset($parts['fragment'])||($parts['path']??'')!=='/conta/retorno')return false;
        $origin=($parts['scheme']??'').'://'.($parts['host']??'').(isset($parts['port'])?':'.$parts['port']:'');
        return self::allowedOrigin($origin);
    }
    public static function throttle(string $scope,int $limit,int $window): bool {
        // Atomic option counter. Untrusted forwarding headers are deliberately ignored.
        $ip=(string)($_SERVER['REMOTE_ADDR']??'local');$key='rak_rate_'.hash_hmac('sha256',$scope.'|'.$ip.'|'.intdiv(time(),$window),wp_salt('nonce'));
        global $wpdb;
        if(add_option($key,1,'',false))return true;
        $wpdb->query($wpdb->prepare("UPDATE $wpdb->options SET option_value=CAST(option_value AS UNSIGNED)+1 WHERE option_name=%s",$key));wp_cache_delete($key,'options');
        // Old counters are removed with the other short-lived account records.
        if(mt_rand(1,100)===1)$wpdb->query($wpdb->prepare("DELETE FROM $wpdb->options WHERE option_name LIKE %s AND option_id < %d",$wpdb->esc_like("rak_rate_")."%",max(0,(int)$wpdb->get_var("SELECT MAX(option_id) FROM $wpdb->options")-10000)));
        return (int)get_option($key)<=$limit;
    }
    public static function loginLimit($user,$login,$password) {
        if($login&&$password&&!self::throttle('login-attempt-'.strtolower((string)$login),20,900))return Identity::error('Muitas tentativas. Aguarde alguns minutos.',429);
        return $user;
    }
    public static function record(string $kind,int $user,array $data,int $ttl): string {
        global $wpdb;$raw=bin2hex(random_bytes(32));
        $wpdb->query($wpdb->prepare('DELETE FROM '.Accounts::table('sessions').' WHERE expires<%d',time()));
        if(!$wpdb->insert(Accounts::table('sessions'),['hash'=>hash('sha256',$raw),'user_id'=>$user,'kind'=>$kind,'expires'=>time()+$ttl,'data'=>wp_json_encode($data)]))throw new \RuntimeException('Não foi possível iniciar sessão.');
        return $raw;
    }
    public static function row(string $raw,string $kind) {
        if(!preg_match('/^[a-f0-9]{64}$/D',$raw))return null;
        global $wpdb;return $wpdb->get_row($wpdb->prepare('SELECT * FROM '.Accounts::table('sessions').' WHERE hash=%s AND kind=%s AND expires>%d',hash('sha256',$raw),$kind,time()));
    }
    public static function consume($row): bool {global $wpdb;return $wpdb->delete(Accounts::table('sessions'),['hash'=>$row->hash])===1;}
    public static function revokeUser(int $id): void {global $wpdb;if($id>0)$wpdb->delete(Accounts::table('sessions'),['user_id'=>$id]);}
    public static function customer(int $id): bool {$user=get_userdata($id);return $user&&in_array('customer',$user->roles,true)&&!user_can($user,'manage_options');}
    public static function user(\WP_REST_Request $request) {
        if ($id = NativeSession::user($request)) return $id;
        if (!NativeSession::legacy() || $request->get_header("X-WP-Nonce")) return Identity::error("Entre na sua conta para continuar.", 401);
        if(isset(self::$authenticated[$request]))return self::$authenticated[$request];
        $header=(string)$request->get_header('authorization');
        if(!preg_match('/^Bearer ([a-f0-9]{64})$/D',$header,$match))return Identity::error('Entre na sua conta para continuar.',401);
        $row=self::row($match[1],'access');
        if(!$row||!self::customer((int)$row->user_id))return Identity::error('Sua sessão expirou. Entre novamente.',401);
        $data=json_decode($row->data,true);$origin=$request->get_header('origin');
        if(!$origin||!str_starts_with($data['client']??'',$origin.'/'))return Identity::error('Sessão não pertence a esta origem.',403);
        self::$authenticated??=new \WeakMap();self::$authenticated[$request]=(int)$row->user_id;
        return (int)$row->user_id;
    }
    public static function permission(\WP_REST_Request $request) {
        if (NativeSession::user($request) && str_starts_with($request->get_route(), "/re-almeida/v1/account")) return true;
        if (!NativeSession::legacy() || $request->get_header("X-WP-Nonce")) return Identity::error("Entre na sua conta para continuar.", 401);
        if (!$request->get_header("authorization")) return Identity::error("Entre na sua conta para continuar.", 401);
        $origin=$request->get_header('origin');if(!$origin||!self::allowedOrigin($origin))return Identity::error('Origem não autorizada.',403);
        $id=self::user($request);return is_wp_error($id)?$id:true;
    }
    private static function body(\WP_REST_Request $request) {
        if(strlen($request->get_body())>16384)return Identity::error('Dados excedem o limite permitido.',413);
        $body=$request->get_json_params();return is_array($body)?$body:Identity::error('Envie um objeto JSON válido.');
    }
    public static function routes(): void {
        register_rest_route('re-almeida/v1', '/account/session', [
            'methods' => 'DELETE', 'permission_callback' => [self::class, 'permission'],
            'callback' => [NativeSession::class, 'logout'],
        ]);
        if (NativeSession::legacy()) register_rest_route('re-almeida/v1','/auth/token',['methods'=>'POST','permission_callback'=>static function($r){return self::allowedOrigin((string)$r->get_header('origin'))?true:Identity::error('Origem não autorizada.',403);},'callback'=>[self::class,'exchange']]);
        if (NativeSession::legacy()) register_rest_route('re-almeida/v1','/auth/logout',['methods'=>'POST','permission_callback'=>[self::class,'permission'],'callback'=>[self::class,'logout']]);
        register_rest_route('re-almeida/v1','/account',[
            ['methods'=>'GET','permission_callback'=>[self::class,'permission'],'callback'=>static fn($r)=>['data'=>Accounts::profile(self::user($r))]],
            ['methods'=>'PUT','permission_callback'=>[self::class,'permission'],'callback'=>static function($r){$body=self::body($r);if(is_wp_error($body))return $body;$data=Accounts::update(self::user($r),$body);return is_wp_error($data)?$data:['data'=>$data];}],
        ]);
        register_rest_route('re-almeida/v1','/account/participants',[
            ['methods'=>'GET','permission_callback'=>[self::class,'permission'],'callback'=>static fn($r)=>['data'=>Accounts::participants(self::user($r))]],
            ['methods'=>'POST','permission_callback'=>[self::class,'permission'],'callback'=>static function($r){$body=self::body($r);if(is_wp_error($body))return $body;$data=Accounts::saveParticipant(self::user($r),$body);return is_wp_error($data)?$data:new \WP_REST_Response(['data'=>$data],201);}],
        ]);
        register_rest_route('re-almeida/v1','/account/participants/(?P<id>[1-9][0-9]*)',[
            ['methods'=>'PUT','permission_callback'=>[self::class,'permission'],'callback'=>static function($r){$body=self::body($r);if(is_wp_error($body))return $body;$data=Accounts::saveParticipant(self::user($r),$body,(int)$r['id']);return is_wp_error($data)?$data:['data'=>$data];}],
            ['methods'=>'DELETE','permission_callback'=>[self::class,'permission'],'callback'=>static function($r){$data=Accounts::removeParticipant(self::user($r),(int)$r['id']);return is_wp_error($data)?$data:['data'=>$data];}],
        ]);
    }
    public static function exchange(\WP_REST_Request $request) {
        if(!self::throttle('token',60,60))return Identity::error('Aguarde antes de tentar novamente.',429);
        $input=self::body($request);if(is_wp_error($input))return $input;
        $code=$input['code']??'';$verifier=$input['verifier']??'';$client=$input['redirectUri']??'';
        if(!is_string($code)||!is_string($verifier)||!is_string($client)||!preg_match('/^[A-Za-z0-9_-]{43,128}$/D',$verifier)||!self::callback($client)||!str_starts_with($client,$request->get_header('origin').'/'))return Identity::error('Retorno de autenticação inválido.',400);
        $row=self::row($code,'code');$data=$row?json_decode($row->data,true):[];
        $challenge=rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'=');
        if(!$row||($data['client']??'')!==$client||!hash_equals($data['challenge']??'',$challenge)||!self::customer((int)$row->user_id)||!self::consume($row))return Identity::error('Código inválido ou expirado. Entre novamente.',401);
        $token=self::record('access',(int)$row->user_id,['client'=>$client],900);
        return ['accessToken'=>$token,'expiresIn'=>900,'data'=>Accounts::profile((int)$row->user_id)];
    }
    public static function logout(\WP_REST_Request $request) {
        $row=self::row(substr($request->get_header('authorization'),7),'access');if(!$row)return Identity::error('Sua sessão expirou.',401);$data=json_decode($row->data,true);
        if(!self::consume($row))return Identity::error('Sua sessão expirou.',401);
        $ticket=self::record('logout',(int)$row->user_id,['client'=>$data['client']],60);
        return ['logoutUrl'=>add_query_arg(['action'=>'rak_end_session','ticket'=>$ticket],admin_url('admin-post.php'))];
    }
    public static function endSession(): void {
        $ticket=is_string($_GET['ticket']??null)?$_GET['ticket']:'';$row=self::row($ticket,'logout');
        if(!$row||!self::consume($row))wp_die('Saída inválida ou expirada.','Re Almeida Kits',['response'=>403]);
        $data=json_decode($row->data,true);if(!self::callback($data['client']??''))wp_die('Retorno inválido.','Re Almeida Kits',['response'=>400]);
        if(get_current_user_id()===(int)$row->user_id)wp_logout();
        self::headers();wp_redirect(str_replace('/conta/retorno','/conta',$data['client']),303);exit;
    }
    public static function cors($served,$response,$request,$server) {
        if(!preg_match('#^/re-almeida/v1/(?:account|auth)(?:/|$)#',$request->get_route()))return $served;
        foreach(['Origin','Credentials','Methods','Headers'] as $key)header_remove('Access-Control-Allow-'.$key);
        header('Vary: Origin',false);header('Cache-Control: no-store, private');
        $origin=get_http_origin();if(NativeSession::legacy()&&$origin&&self::allowedOrigin($origin)){header('Access-Control-Allow-Origin: '.$origin);header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');header('Access-Control-Allow-Headers: Authorization, Content-Type');header('Access-Control-Max-Age: 600');}
        return $served;
    }
    public static function headers(string $formOrigin=""): void {nocache_headers();header('Cache-Control: no-store, private');header('Referrer-Policy: same-origin');header('X-Frame-Options: DENY');header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; form-action 'self'".($formOrigin?' '.$formOrigin:'')."; base-uri 'none'; frame-ancestors 'none'");}
    public static function authorize(): void { AccountPage::render(); }
}
