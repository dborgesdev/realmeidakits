<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Accounts {
    public static function table(string $name): string { global $wpdb;return $wpdb->prefix.'rak_'.$name; }
    public static function install(): void {
        if((int)get_option('rak_accounts_schema')===1)return;
        global $wpdb;require_once ABSPATH.'wp-admin/includes/upgrade.php';$collate=$wpdb->get_charset_collate();
        dbDelta('CREATE TABLE '.self::table('identities')." (cpf varchar(11) NOT NULL, user_id bigint(20) unsigned DEFAULT NULL, PRIMARY KEY  (cpf), UNIQUE KEY user_id (user_id)) $collate;");
        dbDelta('CREATE TABLE '.self::table('participants')." (id bigint(20) unsigned NOT NULL AUTO_INCREMENT, owner_id bigint(20) unsigned NOT NULL, cpf varchar(11) NOT NULL, data longtext NOT NULL, version bigint(20) unsigned NOT NULL DEFAULT 1, PRIMARY KEY  (id), UNIQUE KEY owner_cpf (owner_id,cpf), KEY owner_id (owner_id)) $collate;");
        dbDelta('CREATE TABLE '.self::table('sessions')." (hash varchar(64) NOT NULL, user_id bigint(20) unsigned NOT NULL, kind varchar(12) NOT NULL, expires bigint(20) unsigned NOT NULL, data longtext NOT NULL, PRIMARY KEY  (hash), KEY user_id (user_id), KEY expires (expires)) $collate;");
        foreach(['identities','participants','sessions'] as $name)if($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s',self::table($name)))!==self::table($name))return;
        update_option('rak_accounts_schema',1,false);
    }
    public static function locked(string $key,callable $callback) {
        $key='rak_lock_'.hash('sha256',$key);$value=wp_json_encode(['id'=>wp_generate_uuid4(),'at'=>time()]);
        if(!add_option($key,$value,'',false)) {
            $old=get_option($key);$decoded=json_decode((string)$old,true);
            if(($decoded['at']??time())<time()-120) {
                global $wpdb;$wpdb->query($wpdb->prepare("DELETE FROM $wpdb->options WHERE option_name=%s AND option_value=%s",$key,$old));wp_cache_delete($key,'options');
            }
            return Identity::error('Outra alteração está em andamento. Tente novamente.',409);
        }
        try{return $callback();}finally{global $wpdb;$wpdb->query($wpdb->prepare("DELETE FROM $wpdb->options WHERE option_name=%s AND option_value=%s",$key,$value));wp_cache_delete($key,'options');}
    }
    public static function claim(string $cpf,int $userId=0) {
        global $wpdb;
        // Existing account metadata is checked on every claim, including formatted legacy CPF.
        $keys=apply_filters('rak_cpf_meta_keys',['_rak_cpf','billing_cpf','_billing_cpf','cpf']);
        $keys=array_values(array_filter((array)$keys,'is_string'));
        $placeholders=implode(',',array_fill(0,count($keys),'%s'));
        if($keys) {
            $offset=0;
            do {
                $rows=$wpdb->get_results($wpdb->prepare("SELECT user_id,meta_value FROM $wpdb->usermeta WHERE meta_key IN ($placeholders) ORDER BY umeta_id LIMIT 1000 OFFSET %d",...array_merge($keys,[$offset])));
                foreach($rows as $row)if(Identity::digits($row->meta_value)===$cpf&&(int)$row->user_id!==$userId)return Identity::error('CPF já vinculado a uma conta. Entre na conta existente ou solicite atendimento.',409);
                $offset+=1000;
            }while(count($rows)===1000);
        }
        $table=self::table('identities');$owner=$wpdb->get_var($wpdb->prepare("SELECT user_id FROM $table WHERE cpf=%s",$cpf));
        if($owner!==null)return (int)$owner===$userId&&$userId>0?true:Identity::error('CPF já vinculado a uma conta.',409);
        if(!$wpdb->insert($table,['cpf'=>$cpf,'user_id'=>$userId?:null],['%s','%d']))return Identity::error('CPF já reservado. Tente novamente ou entre na conta existente.',409);
        return true;
    }
    public static function create(array $input) {
        if(!get_role('customer'))return Identity::error('Contas de clientes indisponíveis. Verifique o WooCommerce.',503);
        $data=Identity::person($input,true);if(is_wp_error($data))return $data;
        $password=$input['password']??null;if(!is_string($password)||strlen($password)<12||strlen($password)>128)return Identity::error('Use uma senha de 12 a 128 caracteres.');
        return self::locked('identity',static function()use($data,$password){
            global $wpdb;
            if(email_exists($data['email']))return Identity::error('Não foi possível cadastrar. Se já possui conta, entre ou recupere a senha.',409);
            $claim=self::claim($data['cpf']);if(is_wp_error($claim))return $claim;
            $username='rak_'.wp_generate_uuid4();
            $id=function_exists('wc_create_new_customer') ? wc_create_new_customer($data['email'],$username,$password,['display_name'=>$data['name'],'role'=>'customer']) : wp_insert_user(['user_login'=>$username,'user_email'=>$data['email'],'user_pass'=>$password,'display_name'=>$data['name'],'role'=>'customer']);
            if(is_wp_error($id)){$wpdb->delete(self::table('identities'),['cpf'=>$data['cpf'],'user_id'=>null]);return Identity::error('Não foi possível criar a conta. Tente novamente.',409);}
            $wpdb->update(self::table('identities'),['user_id'=>$id],['cpf'=>$data['cpf']]);
            self::writeProfile($id,$data);
            do_action('rak_customer_created',$id);
            return $id;
        });
    }
    private static function writeProfile(int $id,array $data): void {
        update_user_meta($id,'_rak_profile',$data);update_user_meta($id,'_rak_cpf',$data['cpf']);
        foreach(['billing_first_name'=>$data['name'],'billing_email'=>$data['email'],'billing_phone'=>$data['phone'],'billing_cpf'=>$data['cpf']] as $key=>$value)update_user_meta($id,$key,$value);
        update_user_meta($id,'first_name',$data['name']);
    }
    public static function profile(int $id): array {
        $user=get_userdata($id);$stored=get_user_meta($id,'_rak_profile',true);
        if(!is_array($stored))$stored=[];
        return ['id'=>$id,'name'=>$stored['name']??$user->display_name,'cpf'=>get_user_meta($id,'_rak_cpf',true)?:get_user_meta($id,'billing_cpf',true),'birthDate'=>$stored['birthDate']??'','phone'=>$stored['phone']??get_user_meta($id,'billing_phone',true),'email'=>$user->user_email];
    }
    public static function update(int $id,array $input) {
        $data=Identity::person($input,true);if(is_wp_error($data))return $data;
        return self::locked('identity',static function()use($id,$data){
            $current=self::profile($id);$cpf=Identity::digits($current['cpf']);
            if($cpf!==''&&$cpf!==$data['cpf'])return Identity::error('CPF do titular não pode ser alterado. Solicite atendimento.',409);
            if(strtolower($current['email'])!==$data['email'])return Identity::error('Para alterar o e-mail de acesso, solicite atendimento.',409);
            $claim=self::claim($data['cpf'],$id);if(is_wp_error($claim))return $claim;
            $result=wp_update_user(['ID'=>$id,'display_name'=>$data['name']]);if(is_wp_error($result))return $result;
            self::writeProfile($id,$data);return self::profile($id);
        });
    }
    public static function participants(int $owner): array {
        global $wpdb;$rows=$wpdb->get_results($wpdb->prepare('SELECT id,data,version FROM '.self::table('participants').' WHERE owner_id=%d ORDER BY id',$owner));
        return array_map(static fn($row)=>['id'=>(int)$row->id,'version'=>(int)$row->version,'person'=>json_decode($row->data,true)],$rows);
    }
    public static function saveParticipant(int $owner,array $input,int $id=0) {
        $data=Identity::person($input);if(is_wp_error($data))return $data;
        return self::locked('participants_'.$owner,static function()use($owner,$data,$id,$input){
            global $wpdb;$table=self::table('participants');
            if($id){$row=$wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d AND owner_id=%d",$id,$owner));if(!$row)return Identity::error('Participante não encontrado.',404);
                if(!isset($input['version'])||(int)$input['version']!==(int)$row->version)return Identity::error('Cadastro alterado em outra sessão. Recarregue antes de salvar.',409);
                $version=(int)$row->version+1;
            }else{if((int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE owner_id=%d",$owner))>=20)return Identity::error('Limite de 20 participantes por titular.',409);$version=1;}
            $duplicate=$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE owner_id=%d AND cpf=%s AND id<>%d",$owner,$data['cpf'],$id));
            if($duplicate)return Identity::error('Já existe participante com este CPF neste titular.',409);
            $record=['owner_id'=>$owner,'cpf'=>$data['cpf'],'data'=>wp_json_encode($data),'version'=>$version];
            $result=$id?$wpdb->update($table,$record,['id'=>$id,'owner_id'=>$owner]):$wpdb->insert($table,$record);
            if($result===false)return Identity::error('Já existe participante com este CPF neste titular.',409);
            return ['id'=>$id?:$wpdb->insert_id,'version'=>$version,'person'=>$data];
        });
    }
    public static function removeParticipant(int $owner,int $id) {
        return self::locked('participants_'.$owner,static function()use($owner,$id){global $wpdb;$deleted=$wpdb->delete(self::table('participants'),['id'=>$id,'owner_id'=>$owner],['%d','%d']);return $deleted?['deleted'=>true]:Identity::error('Participante não encontrado.',404);});
    }
}
