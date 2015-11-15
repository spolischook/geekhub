<?php

$config = parse_ini_file(realpath(__DIR__."/../../config.ini"));

$code  = isset($_GET['code'])     ? $_GET['code']     : false;
$token = isset($_COOKIE["token"]) ? $_COOKIE["token"] : false;

if (false !== $token) { // token already exists
    header("Location: /");
    die();
} elseif (false !== $code) { // redirected from GitHub.com with code to get token
    $gitHubToken = getGitHubToken($code, $config['github_client_id'], $config['github_client_secret']);
    $gitHubUser  = json_decode(getGitHubUser($gitHubToken, $config['app_name']));

    $gitHubUser->token = getToken(255);

    if (false === in_array($gitHubUser->login, $config['users'])) {
        header('HTTP/1.0 403 Forbidden');
        echo 'You are not allowed to access to our community :[';
        die();
    }

    $m = new MongoClient();
    $m->selectCollection($config['db'], 'users')->update(["login" => $gitHubUser->login], $gitHubUser, ["upsert" => true]);

    setcookie("token", $gitHubUser->token, time() + 60*60*24*30, '/');

    header("Location: /");
    die();
} else { // Send user to GitHub for token
    header("Location: https://github.com/login/oauth/authorize?client_id=".$config['github_client_id']);
    die();
}

function getGitHubUser($token, $user_agent)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.github.com/user?access_token=".$token);
// Set so curl_exec returns the result instead of outputting it.
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['User-Agent: '.$user_agent]);
// Get the response and close the channel.
    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

function getGitHubToken($code, $client_id, $client_secret)
{
    $url = 'https://github.com/login/oauth/access_token';
    $data = [
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'code' => $code,
    ];

    $options = array(
        'http' => array(
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
        ),
    );
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);

    parse_str($result);

    return $access_token;
}


function crypto_rand_secure($min, $max)
{
    $range = $max - $min;
    if ($range < 1) return $min; // not so random...
    $log = ceil(log($range, 2));
    $bytes = (int) ($log / 8) + 1; // length in bytes
    $bits = (int) $log + 1; // length in bits
    $filter = (int) (1 << $bits) - 1; // set all lower bits to 1
    do {
        $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
        $rnd = $rnd & $filter; // discard irrelevant bits
    } while ($rnd >= $range);
    return $min + $rnd;
}

function getToken($length)
{
    $token = "";
    $codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $codeAlphabet.= "abcdefghijklmnopqrstuvwxyz";
    $codeAlphabet.= "0123456789";
    $max = strlen($codeAlphabet) - 1;
    for ($i=0; $i < $length; $i++) {
        $token .= $codeAlphabet[crypto_rand_secure(0, $max)];
    }
    return $token;
}
