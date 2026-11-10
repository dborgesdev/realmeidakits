<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestExport {
    public static function send(iterable $entries, bool $documents): void {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/class-pclzip.php';
        $temporary = realpath(sys_get_temp_dir());
        $public = !empty($_SERVER['DOCUMENT_ROOT']) ? realpath($_SERVER['DOCUMENT_ROOT']) : false;
        $wordpress = realpath(ABSPATH);
        $normalize = static fn(string $path): string => strtolower(rtrim(str_replace('\\', '/', $path), '/') . '/');
        if (!$temporary || !$public || !$wordpress || str_starts_with($normalize($temporary), $normalize($public)) ||
            str_starts_with($normalize($temporary), $normalize($wordpress))) {
            wp_die('O PHP precisa de um diretório temporário fora da raiz pública para gerar a exportação.', '', ['response' => 503]);
        }
        $directory = $temporary . DIRECTORY_SEPARATOR . 'rak-export-' . bin2hex(random_bytes(16));
        if (!@mkdir($directory, 0700)) wp_die('Não foi possível preparar a exportação.');
        $files = [];
        $archive = $directory . '/export.zip';
        $error = null;
        try {
            $files = $documents ? self::documentFiles($directory, $entries, $files) : self::workbook($directory, $entries, $files);
            if (!$files) throw new \RuntimeException('Nenhum arquivo autorizado encontrado.');
            $zip = new \PclZip($archive);
            $entries = array_map(static fn($file) => is_array($file)
                ? [PCLZIP_ATT_FILE_NAME => $file['filename'], PCLZIP_ATT_FILE_NEW_FULL_NAME => $file['stored_filename']]
                : [PCLZIP_ATT_FILE_NAME => $file], $files);
            if (!$zip->create($entries, PCLZIP_OPT_REMOVE_PATH, $directory, PCLZIP_OPT_NO_COMPRESSION)) {
                throw new \RuntimeException('Não foi possível gerar o pacote.');
            }
            header('Content-Type: ' . ($documents ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
            header('Content-Disposition: attachment; filename="retiradas.' . ($documents ? 'zip' : 'xlsx') . '"');
            header('X-Content-Type-Options: nosniff');
            readfile($archive);
        } catch (\RuntimeException $failure) {
            $error = $failure->getMessage();
        } finally {
            foreach ($files as $file) {
                $path = is_array($file) ? $file['filename'] : $file;
                if (is_file($path)) unlink($path);
            }
            if (is_file($archive)) unlink($archive);
            rmdir($directory);
        }
        if ($error) wp_die(esc_html($error), '', ['response' => 400]);
        exit;
    }

    private static function workbook(string $directory, iterable $entries, array &$files): array {
        $content = [
            '[Content_Types].xml' => '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/sheet.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
            'workbook.xml' => '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Retiradas" sheetId="1" r:id="rId1"/></sheets></workbook>',
        ];
        $relationships = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
        $content['.rels'] = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' . $relationships . 'officeDocument" Target="workbook.xml"/></Relationships>';
        $content['workbook.xml.rels'] = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' . $relationships . 'worksheet" Target="sheet.xml"/></Relationships>';
        foreach ($content as $name => $xml) {
            $file = $directory . '/' . $name;
            $files[] = ['filename' => $file, 'stored_filename' => str_ends_with($name, '.rels') ? '_rels/' . $name : $name];
            if (file_put_contents($file, $xml) === false) throw new \RuntimeException('Falha ao escrever a planilha.');
        }
        $sheet = $directory . '/sheet.xml';
        $files[] = $sheet;
        $handle = fopen($sheet, 'xb');
        if (!$handle) throw new \RuntimeException('Falha ao criar a planilha.');
        try {
            self::write($handle, '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>');
            self::row($handle, ['Corrida', 'Participante', 'Titular', 'Modalidade', 'Inscrição', 'Número de peito', 'Documentos', 'Retirada', 'Pagamento confirmado', 'Tamanho']);
            foreach ($entries as $entry) {
                $line = $entry['line'];
                self::row($handle, [
                    $line['race'], $line['participant'], $entry['holder'], $line['modality'], $entry['registration'], $line['bib'] ?? '',
                    RequestOperations::DOCUMENTS[$line['documentStatus']], RequestOperations::PICKUP[$line['pickupStatus']],
                    $entry['order']->get_date_paid()?->date_i18n('d/m/Y H:i') ?? '', $entry['item']['size'] ?? '',
                ]);
            }
            self::write($handle, '</sheetData></worksheet>');
        } finally {
            fclose($handle);
        }
        return $files;
    }

    private static function write($handle, string $value): void {
        if (fwrite($handle, $value) !== strlen($value)) throw new \RuntimeException('Falha ao escrever a planilha.');
    }

    private static function row($handle, array $values): void {
        $xml = '<row>';
        foreach ($values as $value) {
            $text = htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES | ENT_SUBSTITUTE | ENT_DISALLOWED, 'UTF-8');
            $xml .= '<c t="inlineStr"><is><t xml:space="preserve">' . $text . '</t></is></c>';
        }
        self::write($handle, $xml . '</row>');
    }

    private static function documentFiles(string $directory, iterable $entries, array &$files): array {
        $total = 0;
        foreach ($entries as $entry) {
            foreach ($entry['item']['documents'] ?? [] as $token) {
                $document = PersonalDocuments::openForRequest((int) $entry['row']->owner_id, $token, true);
                if (!$document) continue;
                try {
                    $size = fstat($document['handle'])['size'] ?? 0;
                    if (count($files) >= 40 || $size < 1 || $total + $size > 40 * 1024 * 1024) {
                        throw new \RuntimeException('Selecione até 40 arquivos e 40 MiB por pacote.');
                    }
                    $total += $size;
                    $file = sprintf('%s/solicitacao-%d-participante-%d-documento-%d.%s', $directory, $entry['row']->id, $entry['index'] + 1, count($files) + 1, $document['extension']);
                    $handle = fopen($file, 'xb');
                    if (!$handle) throw new \RuntimeException('Falha ao preparar arquivo autorizado.');
                    $files[] = $file;
                    try {
                        if (stream_copy_to_stream($document['handle'], $handle) !== $size) throw new \RuntimeException('Falha ao copiar arquivo autorizado.');
                    } finally {
                        fclose($handle);
                    }
                } finally {
                    fclose($document['handle']);
                }
            }
        }
        return $files;
    }
}
