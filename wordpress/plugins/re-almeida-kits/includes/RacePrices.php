<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RacePrices {
    private const LEGACY = ['officialPix', 'officialCard', 'shirtPix', 'shirtCard', 'numberPix', 'numberCard'];

    public static function legacy(array $data): array {
        $prices = [];
        foreach (self::LEGACY as $key) {
            if (is_int($data[$key] ?? null) && $data[$key] >= 0) $prices[$key] = $data[$key];
        }
        foreach (is_array($data['kits'] ?? null) ? $data['kits'] : [] as $index => $kit) {
            foreach (['pix', 'card'] as $key) {
                if (is_int($kit[$key] ?? null) && $kit[$key] >= 0) $prices['kit-' . $index . '-' . $key] = $kit[$key];
            }
        }
        return $prices;
    }

    public static function canonical(array $data): array {
        if (!array_key_exists('priceCents', $data)) {
            $values = array_values(array_unique(self::legacy($data)));
            $data['priceCents'] = count($values) === 1 ? $values[0] : null;
        }
        foreach (['officialCents', 'shirtCents', 'numberCents'] as $key) {
            if (!array_key_exists($key, $data)) $data[$key] = $data['priceCents'];
        }
        foreach (self::LEGACY as $key) unset($data[$key]);
        if (is_array($data['kits'] ?? null)) {
            foreach ($data['kits'] as &$kit) {
                if (is_array($kit)) unset($kit['pix'], $kit['card']);
            }
            unset($kit);
        }
        return $data;
    }

    public static function archive(int $id, array $data): void {
        $legacy = self::legacy($data);
        if ($legacy) add_post_meta($id, '_rak_legacy_prices', $legacy, true);
    }
}
