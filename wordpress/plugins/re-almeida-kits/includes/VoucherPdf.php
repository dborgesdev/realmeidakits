<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class VoucherPdf {
    public static function download(): void {
        if (!is_user_logged_in()) { auth_redirect(); exit; }
        $id = absint($_GET['request'] ?? 0);
        $index = filter_var($_GET['line'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        check_admin_referer('rak_voucher_pdf_' . $id . '_' . $index);
        $result = $index === false ? Identity::error('Voucher não encontrado.', 404) : self::content($id, $index);
        if (is_wp_error($result)) wp_die(esc_html($result->get_error_message()), '', ['response' => $result->get_error_data()['status']]);
        nocache_headers();
        header('Cache-Control: private, no-store, max-age=0');
        header('Referrer-Policy: no-referrer');
        header('X-Content-Type-Options: nosniff');
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="voucher-' . $id . '-' . $index . '.pdf"');
        echo $result;
        exit;
    }

    public static function content(int $id, int $index) {
        $row = KitOrderRepository::get($id);
        if (!is_user_logged_in() || !$row || (int) $row->owner_id !== get_current_user_id()) return Identity::error('Voucher não encontrado.', 404);
        return Accounts::locked('request_ops_' . $id, static function () use ($row, $index) {
            Vouchers::syncLocked($row);
            $voucher = VoucherRepository::get((int) $row->id, $index);
            if (!$voucher || $voucher->state !== 'released') return Identity::error('Voucher indisponível para retirada.', 409);
            $snapshot = json_decode($row->snapshot, true);
            return self::generate($voucher, $snapshot['lines'][$index]);
        });
    }

    public static function generate(object $voucher, array $line): string {
        require_once dirname(__DIR__) . '/vendor/qr/qrcode.php';
        $url = admin_url('admin.php?page=rak-pickup') . '#voucher=' . $voucher->token;
        $qr = Vendor\QRCode::getMinimumQRCode($url, Vendor\QR_ERROR_CORRECT_LEVEL_M);
        $count = $qr->getModuleCount();
        $size = 210 / ($count + 8);
        $logo = file_get_contents(dirname(__DIR__) . '/assets/logo.jpg');
        [$width, $height] = getimagesizefromstring($logo);
        $logoHeight = min(85, 180 * $height / $width);
        $logoWidth = $logoHeight * $width / $height;
        $commands = "q $logoWidth 0 0 $logoHeight 42 718 cm /Logo Do Q\n0.7 0.06 0.08 rg 42 696 511 3 re f\n0 g\n";
        $pageHeader = $commands;
        $streams = [];
        $pickup = $line['pickup'] ?? null;
        $location = is_array($pickup) ? implode(' · ', array_filter([$pickup['label'] ?? '', $pickup['address'] ?? ''])) : (string) $pickup;
        $texts = ['VOUCHER DE RETIRADA', 'Participante: ' . $line['participant'], 'Corrida: ' . $line['race']];
        if (!empty($line['raceDate'])) $texts[] = 'Data da corrida: ' . $line['raceDate'];
        $texts[] = 'Modalidade: ' . ($line['modality'] === 'appai' ? 'APPAI' : 'Kit Oficial');
        if ($location) $texts[] = 'Local de retirada: ' . $location;
        $texts[] = 'Solicitação: ' . $voucher->request_id . ' / Voucher: ' . $voucher->id;
        $texts[] = 'Apresente este voucher para conferência pela equipe autorizada.';
        $texts[] = 'O QR Code não confirma a retirada automaticamente.';
        $y = 668;
        foreach ($texts as $i => $text) {
            $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT', $text);
            foreach (explode("\n", wordwrap($encoded, 44, "\n", true)) as $part) {
                if ($y < 350) { $streams[] = $commands; $commands = $pageHeader; $y = 668; }
                $escaped = str_replace(['\\', '(', ')', "\r"], ['\\\\', '\\(', '\\)', ''], $part);
                $commands .= 'BT /F1 ' . ($i === 0 ? 20 : 12) . " Tf 42 $y Td ($escaped) Tj ET\n";
                $y -= $i === 0 ? 36 : 22;
            }
        }
        for ($r = 0; $r < $count; $r++) for ($c = 0; $c < $count; $c++) {
            if ($qr->isDark($r, $c)) $commands .= sprintf("%.4F %.4F %.4F %.4F re f\n", 192 + ($c + 4) * $size, 90 + ($count + 3 - $r) * $size, $size + 0.01, $size + 0.01);
        }
        $streams[] = $commands;
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            "<< /Type /XObject /Subtype /Image /Width $width /Height $height /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " . strlen($logo) . ">>\nstream\n" . $logo . "\nendstream",
        ];
        $kids = [];
        foreach ($streams as $stream) {
            $contentId = count($objects) + 1;
            $kids[] = ($contentId + 1) . ' 0 R';
            $objects[] = '<< /Length ' . strlen($stream) . ">>\nstream\n" . $stream . 'endstream';
            $objects[] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> /XObject << /Logo 4 0 R >> >> /Contents $contentId 0 R >>";
        }
        $objects[1] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . count($kids) . ' >>';
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $i => $object) { $offsets[] = strlen($pdf); $pdf .= ($i + 1) . " 0 obj\n$object\nendobj\n"; }
        $xref = strlen($pdf);
        $objectCount = count($objects) + 1;
        $pdf .= "xref\n0 $objectCount\n0000000000 65535 f \n";
        foreach (array_slice($offsets, 1) as $offset) $pdf .= sprintf("%010d 00000 n \n", $offset);
        return $pdf . "trailer\n<< /Size $objectCount /Root 1 0 R >>\nstartxref\n$xref\n%%EOF\n";
    }
}
