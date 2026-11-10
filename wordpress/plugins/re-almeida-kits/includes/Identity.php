<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Identity {
    public static function digits($value): string { return preg_replace('/\D/', '', is_scalar($value) ? (string)$value : ''); }
    public static function cpf($value): bool {
        $cpf = self::digits($value);
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) return false;
        for ($length=9; $length<11; $length++) {
            $sum=0; for($i=0;$i<$length;$i++) $sum+=(int)$cpf[$i]*($length+1-$i);
            $digit=($sum*10)%11; if($digit===10)$digit=0;
            if($digit!==(int)$cpf[$length])return false;
        }
        return true;
    }
    public static function person(array $input, bool $emailRequired=false, bool $cpfRequired=true) {
        $data = [];
        foreach (['name','cpf','birthDate','phone','email'] as $key) {
            if(isset($input[$key])&&!is_string($input[$key]))return self::error('Informe dados pessoais válidos.');
            $data[$key]=trim($input[$key]??'');
        }
        $data['name']=sanitize_text_field($data['name']);
        $data['cpf']=self::digits($data['cpf']);$data['phone']=self::digits($data['phone']);
        $data['email']=strtolower($data['email']);
        $date=\DateTimeImmutable::createFromFormat('!Y-m-d',$data['birthDate']);
        if(mb_strlen($data['name'])<3||mb_strlen($data['name'])>80)return self::error('Informe nome completo entre 3 e 80 caracteres.');
        if (($cpfRequired || $data['cpf'] !== '') && !self::cpf($data['cpf'])) return self::error('Informe um CPF válido.');
        if(!preg_match('/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/',$data['phone']))return self::error('Informe telefone com DDD válido.');
        if(($emailRequired||$data['email']!=='')&&(!is_email($data['email'])||strlen($data['email'])>120))return self::error('Informe e-mail válido.');
        if(!$date||$date->format('Y-m-d')!==$data['birthDate']||$data['birthDate']<'1900-01-01'||$data['birthDate']>current_time('Y-m-d'))return self::error('Informe data de nascimento válida.');
        return $data;
    }
    public static function error(string $message,int $status=400): \WP_Error { return new \WP_Error('rak_identity',$message,['status'=>$status]); }
}
