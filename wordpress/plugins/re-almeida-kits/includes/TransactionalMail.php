<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class TransactionalMail {
    public static function deliver(string $to, string $subject, string $body): bool {
        $mailer = WC()->mailer();
        $html = '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f5f5;color:#111;font-family:Arial,sans-serif;line-height:1.6"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" style="max-width:600px;background:#fff;border:1px solid #d8d8d8;border-radius:12px"><tr><td style="padding:24px;border-bottom:3px solid #c90803"><img src="' . esc_url(PublicPages::url('/brand/logo-corredor-original.jpg')) . '" width="180" alt="Re Almeida Kits" style="display:block;max-width:100%;height:auto"></td></tr><tr><td style="padding:24px"><h1 style="font-size:22px;line-height:1.3;color:#111">' . esc_html($subject) . '</h1>' . $body . '</td></tr><tr><td style="padding:20px 24px;border-top:1px solid #d8d8d8;color:#525252">Re Almeida Kits · Serviço de retirada de kits de corrida</td></tr></table></td></tr></table></body></html>';
        return (bool) $mailer->send($to, $subject, $html, ['Content-Type: text/html; charset=UTF-8']);
    }
    public static function button(string $url, string $label): string {
        return '<p><a style="display:inline-block;background:#c90803;color:#fff;padding:16px 24px;border-radius:8px;font-weight:bold;text-decoration:none" href="' . esc_url($url) . '">' . esc_html($label) . '</a></p>';
    }
    public static function safeReason(string $reason): string {
        return preg_replace('/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/', '[identificação omitida]', mb_substr(sanitize_text_field($reason), 0, 500));
    }
}
