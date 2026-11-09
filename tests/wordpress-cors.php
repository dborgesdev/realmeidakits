<?php
/** Isolated CORS header tests: no server mutations, no WordPress credentials. */
namespace ReAlmeida\Kits;
define('ABSPATH', __DIR__);
$headers=[];$origin='';$count=0;
function header_remove($name){global $headers;unset($headers[strtolower($name)]);}
function header($line,$replace=true){global $headers;[$name,$value]=explode(':',$line,2);$headers[strtolower($name)]=trim($value);}
function apply_filters($name,$value){return $value;}
function get_http_origin(){global $origin;return $origin;}
require __DIR__.'/../wordpress/plugins/re-almeida-kits/includes/Rest.php';
function verify($ok,$message){global $count;if(!$ok)throw new \Exception($message);$count++;}
foreach(['http://localhost:5173','http://127.0.0.1:5174','http://[::1]:5175','https://localhost:5199'] as $value)verify(Rest::localOrigin($value),'Expected local: '.$value);
foreach(['null','http://localhost:5172','http://localhost:5200','http://localhost.evil:5173','http://127.0.0.1.evil:5173','http://localhost:5173/','http://user@localhost:5173','http://192.168.0.2:5173','https://evil.invalid','http://localhost:5173\nBad: x'] as $value)verify(!Rest::localOrigin($value),'Unexpected local: '.$value);
foreach([
 ['GET','/re-almeida/v1/corridas','http://localhost:5173',true],
 ['HEAD','/re-almeida/v1/corridas/runlloween','http://127.0.0.1:5173',true],
 ['OPTIONS','/re-almeida/v1/corridas','http://[::1]:5175',true],
 ['GET','/re-almeida/v1/corridas','https://realmeidakits.com.br',true],
 ['GET','/re-almeida/v1/corridas','https://evil.invalid',false],
 ['POST','/re-almeida/v1/corridas','http://localhost:5173',false],
 ['DELETE','/re-almeida/v1/corridas/runlloween','http://localhost:5173',false],
 ['GET','/re-almeida/v1/users','http://localhost:5173',false],
 ['GET','/wp/v2/users','http://localhost:5173',false],
 ['GET','/re-almeida/v1/corridas/private/extra','http://localhost:5173',false],
] as [$method,$route,$origin,$expected]){
 $headers=[];
 $request=new class($method,$route){function __construct(private $method,private $route){}function get_method(){return $this->method;}function get_route(){return $this->route;}};
 Rest::cors(false,null,$request,null);
 verify(($headers['access-control-allow-origin']??null)===($expected?$origin:null),"Origin/method/route: $method $route $origin");
 verify(!isset($headers['access-control-allow-credentials']),'Credentials must never be allowed');
}
echo "PASS: $count CORS checks.".PHP_EOL;
