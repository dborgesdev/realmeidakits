<?php
/** DEMONSTRAÇÃO: subprocess for concurrent pickup checks in disposable loopback WordPress. */
require $argv[1] . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') exit(2);
wp_set_current_user((int) $argv[3]);
$voucher = ReAlmeida\Kits\VoucherRepository::get((int) $argv[2], 0);
file_put_contents($argv[4] . '.' . $argv[5] . '.ready', 'ready');
$deadline = microtime(true) + 25;
while (!is_file($argv[4] . '.start') && microtime(true) < $deadline) usleep(20000);
$result = ReAlmeida\Kits\Vouchers::confirm($voucher);
echo json_encode(['success' => !is_wp_error($result), 'status' => is_wp_error($result) ? $result->get_error_data()['status'] : 200]);
