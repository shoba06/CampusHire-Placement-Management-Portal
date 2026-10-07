<?php

session_start();

header("Content-Type: application/json");

require_once "../config/database.php";


/* =====================================================
   ONLY POST REQUESTS
===================================================== */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit;
}


/* =====================================================
   READ JSON
===================================================== */

$input = json_decode(
    file_get_contents("php://input"),
    true
);


if (!$input) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);

    exit;
}


$identifier = trim(
    $input["identifier"] ??
    $input["email"] ??
    ""
);

$password =
    $input["password"] ?? "";


/* =====================================================
   VALIDATION
===================================================== */

if ($identifier === "") {

    echo json_encode([
        "success" => false,
        "message" => "Please enter your recruiter email."
    ]);

    exit;
}


if ($password === "") {

    echo json_encode([
        "success" => false,
        "message" => "Please enter your password."
    ]);

    exit;
}


/* =====================================================
   FIND RECRUITER
===================================================== */

$sql = "
    SELECT

        u.user_id,
        u.email,
        u.password_hash,
        u.role,
        u.is_active,

        r.recruiter_name,
        r.recruiter_phone,
        r.company_id,

        c.company_name,
        c.industry,
        c.location,
        c.website,
        c.description AS company_description

    FROM users u

    INNER JOIN recruiters r
        ON r.recruiter_user_id = u.user_id

    INNER JOIN companies c
        ON c.company_id = r.company_id

    WHERE
        u.email = ?
        AND u.role = 'recruiter'

    LIMIT 1
";


$stmt =
    $conn->prepare($sql);


if (!$stmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare recruiter login."
    ]);

    $conn->close();

    exit;
}


$stmt->bind_param(
    "s",
    $identifier
);


$stmt->execute();


$result =
    $stmt->get_result();


/* =====================================================
   RECRUITER NOT FOUND
===================================================== */

if (
    $result->num_rows === 0
) {

    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "Invalid recruiter email or password."
    ]);

    exit;
}


$recruiter =
    $result->fetch_assoc();


$stmt->close();


/* =====================================================
   ACCOUNT STATUS
===================================================== */

if (
    (int)$recruiter["is_active"] !== 1
) {

    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "This recruiter account is inactive."
    ]);

    exit;
}


/* =====================================================
   VERIFY PASSWORD
===================================================== */

if (
    !password_verify(
        $password,
        $recruiter["password_hash"]
    )
) {

    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "Invalid recruiter email or password."
    ]);

    exit;
}


/* =====================================================
   REGENERATE SESSION
===================================================== */

session_regenerate_id(true);


/* =====================================================
   CREATE RECRUITER SESSION
===================================================== */

$_SESSION["campusHireUserId"] =
    (int)$recruiter["user_id"];

$_SESSION["campusHireRole"] =
    "recruiter";

$_SESSION["campusHireRecruiterId"] =
    (int)$recruiter["user_id"];

$_SESSION["campusHireCompanyId"] =
    (int)$recruiter["company_id"];

$_SESSION["campusHireRecruiterLoggedIn"] =
    true;


/* =====================================================
   RESPONSE
===================================================== */

$conn->close();


echo json_encode([

    "success" => true,

    "message" =>
        "Recruiter login successful.",

    "recruiter" => [

        "userId" =>
            (int)$recruiter["user_id"],

        "email" =>
            $recruiter["email"],

        "role" =>
            $recruiter["role"],

        "recruiterName" =>
            $recruiter["recruiter_name"],

        "recruiterPhone" =>
            $recruiter["recruiter_phone"],

        "companyId" =>
            (int)$recruiter["company_id"],

        "companyName" =>
            $recruiter["company_name"],

        "industry" =>
            $recruiter["industry"],

        "location" =>
            $recruiter["location"],

        "website" =>
            $recruiter["website"],

        "companyDescription" =>
            $recruiter["company_description"]

    ]

]);

?>