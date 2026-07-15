<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

if (!isset($_GET['query']) || empty($_GET['query'])) {
    echo json_encode(['success' => false, 'message' => 'Falta el parámetro de búsqueda']);
    exit;
}

$query = strtolower(trim($_GET['query']));
$type = isset($_GET['type']) && $_GET['type'] === 'series' ? 'series' : 'movie';
$tmdb_id = isset($_GET['tmdb_id']) ? $_GET['tmdb_id'] : '';

$server = rtrim($_SESSION['iptv_server'], '/');
$username = $_SESSION['iptv_username'];
$password = $_SESSION['iptv_password'];

$cacheDir = __DIR__ . '/../cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}

$cacheFile = $cacheDir . ($type === 'series' ? '/series_list.json' : '/vod_list.json');
$cacheLife = 6 * 3600; // 6 hours

$action = $type === 'series' ? 'get_series' : 'get_vod_streams';

// Load from cache or fetch from IPTV
$data = null;
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheLife)) {
    $json = file_get_contents($cacheFile);
    $data = json_decode($json, true);
} else {
    $url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password) . "&action=" . $action;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Need more time for huge lists
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response !== false && $httpCode === 200) {
        $data = json_decode($response, true);
        if (is_array($data)) {
            file_put_contents($cacheFile, $response);
        }
    }
}

if (!is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'No se pudo obtener el catálogo del servidor IPTV']);
    exit;
}

// String normalization helper to remove accents and special characters
function normalizeString($str) {
    $str = mb_strtolower($str, 'UTF-8');
    // Accent translations
    $accents = [
        'á'=>'a', 'é'=>'e', 'í'=>'i', 'ó'=>'o', 'ú'=>'u', 'ü'=>'u', 'ñ'=>'n',
        'à'=>'a', 'è'=>'e', 'ì'=>'i', 'ò'=>'o', 'ù'=>'u',
        'ä'=>'a', 'ë'=>'e', 'ï'=>'i', 'ö'=>'o',
        'â'=>'a', 'ê'=>'e', 'î'=>'i', 'ô'=>'o', 'û'=>'u'
    ];
    $str = strtr($str, $accents);
    // Remove non-alphanumeric chars
    $str = preg_replace('/[^a-z0-9\s]/', '', $str);
    // Clean spaces
    $str = preg_replace('/\s+/', ' ', $str);
    return trim($str);
}

// Search algorithm
$matches = [];
$normQuery = normalizeString($query);
$queryWords = array_filter(explode(' ', $normQuery));

if (empty($queryWords)) {
    echo json_encode([
        'success' => true,
        'query' => $query,
        'total_found' => 0,
        'results' => []
    ]);
    exit;
}

foreach ($data as $item) {
    if (!isset($item['name'])) continue;
    
    $itemName = $item['name'];
    $normItem = normalizeString($itemName);
    
    $score = 0;
    
    // 1. TMDB ID Match (perfect match)
    if ($tmdb_id !== '' && isset($item['tmdb_id']) && (string)$item['tmdb_id'] === (string)$tmdb_id) {
        $score = 100;
    }
    // 2. Exact name match
    else if ($normItem === $normQuery) {
        $score = 95;
    }
    // 3. Starts with query
    else if (strpos($normItem, $normQuery) === 0) {
        $score = 90;
    }
    // 4. Contains query
    else if (strpos($normItem, $normQuery) !== false) {
        $score = 80;
    }
    // 5. Word-by-word match (handles out of order words, resolution tags, year noise, etc)
    else {
        $itemWords = array_filter(explode(' ', $normItem));
        $matchedWords = 0;
        foreach ($queryWords as $qw) {
            if (in_array($qw, $itemWords)) {
                $matchedWords++;
            }
        }
        
        $totalQueryWords = count($queryWords);
        if ($matchedWords > 0) {
            $matchRatio = $matchedWords / $totalQueryWords;
            // Require 60% match ratio, or 100% if query is only 1-2 words
            if ($matchRatio >= 0.6 || ($totalQueryWords <= 2 && $matchedWords == $totalQueryWords)) {
                $score = 50 + intval($matchRatio * 25);
            }
        }
    }
    
    if ($score > 0) {
        $matches[] = [
            'score' => $score,
            'id' => $type === 'series' ? $item['series_id'] : $item['stream_id'],
            'name' => $item['name'],
            'type' => $type,
            'container_extension' => isset($item['container_extension']) ? $item['container_extension'] : 'mp4'
        ];
    }
}

// Sort matches by score descending
usort($matches, function($a, $b) {
    return $b['score'] - $a['score'];
});

// Limit to top 15 results
$matches = array_slice($matches, 0, 15);

// Remove internal scoring key
$results = array_map(function($m) {
    unset($m['score']);
    return $m;
}, $matches);

echo json_encode([
    'success' => true,
    'query' => $query,
    'total_found' => count($results),
    'results' => $results
]);
