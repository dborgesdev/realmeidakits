<?php
/** DEMONSTRAÇÃO: fixture transition for a disposable loopback browser test. */
require $argv[1] . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') exit(2);
$row=ReAlmeida\Kits\KitOrderRepository::get((int)$argv[2]);
if(!$row)exit(3);
$draft=ReAlmeida\Kits\RequestDrafts::load((int)$row->owner_id);
if(empty($draft['key']))exit(4);
global $wpdb;
if($wpdb->update(ReAlmeida\Kits\Accounts::table('requests'),['draft_key'=>$draft['key']],['id'=>$row->id])!==1)exit(5);
