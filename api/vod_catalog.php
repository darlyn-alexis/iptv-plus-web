<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$action = isset($_GET['action']) ? trim($_GET['action']) : 'get_streams';
$type = isset($_GET['type']) && $_GET['type'] === 'series' ? 'series' : 'movie';
$categoryId = isset($_GET['category_id']) ? trim($_GET['category_id']) : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 0;

$server = rtrim($_SESSION['iptv_server'], '/');
$username = $_SESSION['iptv_username'];
$password = $_SESSION['iptv_password'];

$cacheDir = __DIR__ . '/../cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}

$cacheLife = 6 * 3600; // 6 hours

// Action: Search
if ($action === 'search') {
    $query = isset($_GET['query']) ? trim($_GET['query']) : '';
    if ($query === '') {
        echo json_encode([
            'success' => true,
            'movies' => [],
            'series' => []
        ]);
        exit;
    }
    
    $moviesFile = $cacheDir . '/vod_list.json';
    $seriesFile = $cacheDir . '/series_list.json';
    
    $foundMovies = [];
    $foundSeries = [];
    
    // Search movies
    if (file_exists($moviesFile)) {
        $json = file_get_contents($moviesFile);
        $movies = json_decode($json, true);
        if (is_array($movies)) {
            $filtered = array_filter($movies, function($item) use ($query) {
                return isset($item['name']) && stripos($item['name'], $query) !== false;
            });
            $filtered = array_slice($filtered, 0, 30);
            $foundMovies = array_map(function($item) {
                return [
                    'id' => $item['stream_id'],
                    'name' => $item['name'],
                    'type' => 'movie',
                    'rating' => isset($item['rating']) ? $item['rating'] : '0.0',
                    'stream_icon' => isset($item['stream_icon']) ? $item['stream_icon'] : '',
                    'container_extension' => isset($item['container_extension']) ? $item['container_extension'] : 'mp4',
                    'tmdb_id' => isset($item['tmdb_id']) ? $item['tmdb_id'] : (isset($item['tmdb']) ? $item['tmdb'] : null)
                ];
            }, $filtered);
        }
    }
    
    // Search series
    if (file_exists($seriesFile)) {
        $json = file_get_contents($seriesFile);
        $series = json_decode($json, true);
        if (is_array($series)) {
            $filtered = array_filter($series, function($item) use ($query) {
                return isset($item['name']) && stripos($item['name'], $query) !== false;
            });
            $filtered = array_slice($filtered, 0, 30);
            $foundSeries = array_map(function($item) {
                return [
                    'id' => $item['series_id'],
                    'name' => $item['name'],
                    'type' => 'series',
                    'rating' => isset($item['rating']) ? $item['rating'] : '0.0',
                    'stream_icon' => isset($item['cover']) ? $item['cover'] : (isset($item['stream_icon']) ? $item['stream_icon'] : ''),
                    'container_extension' => isset($item['container_extension']) ? $item['container_extension'] : 'mp4',
                    'tmdb_id' => isset($item['tmdb_id']) ? $item['tmdb_id'] : (isset($item['tmdb']) ? $item['tmdb'] : null)
                ];
            }, $filtered);
        }
    }
    
    echo json_encode([
        'success' => true,
        'movies' => array_values($foundMovies),
        'series' => array_values($foundSeries)
    ]);
    exit;
}

if ($action === 'get_categories') {
    $cacheFile = $cacheDir . ($type === 'series' ? '/series_categories.json' : '/vod_categories.json');
    $apiAction = $type === 'series' ? 'get_series_categories' : 'get_vod_categories';
    
    $data = null;
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheLife)) {
        $json = file_get_contents($cacheFile);
        $data = json_decode($json, true);
    } else {
        $url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password) . "&action=" . $apiAction;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
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
        echo json_encode(['success' => false, 'message' => 'No se pudieron obtener las categorías del servidor IPTV']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'categories' => $data
    ]);
    exit;
}

// Otherwise: get_streams
$cacheFile = $cacheDir . ($type === 'series' ? '/series_list.json' : '/vod_list.json');
$apiAction = $type === 'series' ? 'get_series' : 'get_vod_streams';

$data = null;
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheLife)) {
    $json = file_get_contents($cacheFile);
    $data = json_decode($json, true);
} else {
    $url = $server . "/player_api.php?username=" . urlencode($username) . "&password=" . urlencode($password) . "&action=" . $apiAction;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 40); // Large catalog might take time
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

// Filter by category_id if provided
if ($categoryId !== '') {
    $data = array_values(array_filter($data, function($item) use ($categoryId) {
        return isset($item['category_id']) && (string)$item['category_id'] === $categoryId;
    }));
}

// Sort by added desc (recientes) or stream_id desc
usort($data, function($a, $b) {
    $addedA = isset($a['added']) ? intval($a['added']) : 0;
    $addedB = isset($b['added']) ? intval($b['added']) : 0;
    if ($addedA === $addedB) {
        $idA = isset($a['stream_id']) ? intval($a['stream_id']) : (isset($a['series_id']) ? intval($a['series_id']) : 0);
        $idB = isset($b['stream_id']) ? intval($b['stream_id']) : (isset($b['series_id']) ? intval($b['series_id']) : 0);
        return $idB - $idA;
    }
    return $addedB - $addedA;
});

if ($limit > 0) {
    $data = array_slice($data, 0, $limit);
}

$mapped = array_map(function($item) use ($type) {
    return [
        'id' => $type === 'series' ? $item['series_id'] : $item['stream_id'],
        'name' => $item['name'],
        'type' => $type,
        'rating' => isset($item['rating']) ? $item['rating'] : '0.0',
        'stream_icon' => $type === 'series' ? (isset($item['cover']) ? $item['cover'] : '') : (isset($item['stream_icon']) ? $item['stream_icon'] : ''),
        'container_extension' => isset($item['container_extension']) ? $item['container_extension'] : 'mp4',
        'tmdb_id' => isset($item['tmdb_id']) ? $item['tmdb_id'] : (isset($item['tmdb']) ? $item['tmdb'] : null)
    ];
}, $data);

echo json_encode([
    'success' => true,
    'streams' => $mapped
]);
