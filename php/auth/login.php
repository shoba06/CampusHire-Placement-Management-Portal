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
   READ JSON INPUT
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


/* =====================================================
   READ LOGIN DETAILS
   ===================================================== */

/*
   We support both:
   - college email
   - student ID

   This makes the backend flexible for the login page.
*/

$identifier = trim(
    $input["identifier"] ??
    $input["email"] ??
    $input["studentId"] ??
    ""
);

$password = $input["password"] ?? "";


/* =====================================================
   VALIDATION
   ===================================================== */

if ($identifier === "") {

    echo json_encode([
        "success" => false,
        "message" => "Please enter your email or student ID."
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
   FIND STUDENT
   ===================================================== */

$sql = "
    SELECT
        u.user_id,
        u.email,
        u.password_hash,
        u.role,
        u.is_active,

        s.student_id,
        s.full_name,
        s.phone,
        s.location,
        s.college_email

    FROM users u

    INNER JOIN students s
        ON s.student_user_id = u.user_id

    WHERE
        u.role = 'student'
        AND
        (
            u.email = ?
            OR
            s.student_id = ?
            OR
            s.college_email = ?
        )

    LIMIT 1
";


$stmt = $conn->prepare($sql);


if (!$stmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare login request."
    ]);

    $conn->close();

    exit;
}


$stmt->bind_param(
    "sss",
    $identifier,
    $identifier,
    $identifier
);


$stmt->execute();


$result = $stmt->get_result();


/* =====================================================
   STUDENT NOT FOUND
   ===================================================== */

if ($result->num_rows === 0) {

    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "Invalid email, student ID, or password."
    ]);

    exit;
}


$student = $result->fetch_assoc();


$stmt->close();


/* =====================================================
   CHECK ACCOUNT STATUS
   ===================================================== */

if ((int)$student["is_active"] !== 1) {

    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "Your CampusHire account is currently inactive."
    ]);

    exit;
}


/* =====================================================
   VERIFY PASSWORD
   ===================================================== */

if (
    !password_verify(
        $password,
        $student["password_hash"]
    )
) {

    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "Invalid email, student ID, or password."
    ]);

    exit;
}


/* =====================================================
   REGENERATE SESSION ID
   ===================================================== */

session_regenerate_id(true);


/* =====================================================
   CREATE LOGIN SESSION
   ===================================================== */

$_SESSION["campusHireUserId"] =
    (int)$student["user_id"];

$_SESSION["campusHireRole"] =
    $student["role"];

$_SESSION["campusHireStudentId"] =
    $student["student_id"];

$_SESSION["campusHireEmail"] =
    $student["email"];

$_SESSION["campusHireLoggedIn"] =
    true;


/* =====================================================
   RESPONSE
   ===================================================== */

$conn->close();


echo json_encode([
    "success" => true,

    "message" =>
        "Student login successful.",

    "user" => [

        "userId" =>
            (int)$student["user_id"],

        "studentId" =>
            $student["student_id"],

        "fullName" =>
            $student["full_name"],

        "email" =>
            $student["email"],

        "collegeEmail" =>
            $student["college_email"],

        "phone" =>
            $student["phone"],

        "location" =>
            $student["location"],

        "role" =>
            $student["role"]

    ]

]);

?>