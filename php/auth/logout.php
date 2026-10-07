<?php

session_start();

header("Content-Type: application/json");


/* =====================================================
   ONLY POST
===================================================== */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit;
}


/* =====================================================
   DESTROY SESSION
===================================================== */

$_SESSION = [];


if (
    ini_get("session.use_cookies")
) {

    $params =
        session_get_cookie_params();


    setcookie(
        session_name(),
        "",
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );

}


session_destroy();


/* =====================================================
   RESPONSE
===================================================== */

echo json_encode([
    "success" => true,
    "message" => "Student logged out successfully."
]);

?>