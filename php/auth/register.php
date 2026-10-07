<?php

/*
|--------------------------------------------------------------------------
| CampusHire - Student Registration API
|--------------------------------------------------------------------------
| Creates:
|   1. User account in the "users" table
|   2. Student profile in the "students" table
|
| This is the permanent registration endpoint for CampusHire.
|--------------------------------------------------------------------------
*/

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";


/*
|--------------------------------------------------------------------------
| Helper: Send JSON Response
|--------------------------------------------------------------------------
*/

function sendResponse($success, $message, $data = [], $statusCode = 200)
{
    http_response_code($statusCode);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Allow POST Requests Only
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    sendResponse(
        false,
        "Invalid request method. Please use POST.",
        [],
        405
    );
}


/*
|--------------------------------------------------------------------------
| Read Request Data
|--------------------------------------------------------------------------
|
| The frontend will send JSON data.
|
*/

$rawInput = file_get_contents("php://input");

$data = json_decode($rawInput, true);


/*
|--------------------------------------------------------------------------
| Validate JSON
|--------------------------------------------------------------------------
*/

if (!is_array($data)) {

    sendResponse(
        false,
        "Invalid JSON data received.",
        [],
        400
    );
}


/*
|--------------------------------------------------------------------------
| Read Input Fields
|--------------------------------------------------------------------------
*/

$fullName = trim($data["fullName"] ?? "");
$collegeEmail = trim($data["collegeEmail"] ?? "");
$phone = trim($data["phone"] ?? "");
$studentId = trim($data["studentId"] ?? "");
$location = trim($data["location"] ?? "");
$password = $data["password"] ?? "";


/*
|--------------------------------------------------------------------------
| Required Field Validation
|--------------------------------------------------------------------------
*/

if (
    $fullName === "" ||
    $collegeEmail === "" ||
    $phone === "" ||
    $studentId === "" ||
    $password === ""
) {

    sendResponse(
        false,
        "Please provide all required registration fields.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Name Validation
|--------------------------------------------------------------------------
*/

if (strlen($fullName) < 2 || strlen($fullName) > 150) {

    sendResponse(
        false,
        "Full name must contain between 2 and 150 characters.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Email Validation
|--------------------------------------------------------------------------
*/

if (!filter_var($collegeEmail, FILTER_VALIDATE_EMAIL)) {

    sendResponse(
        false,
        "Please enter a valid college email address.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Phone Validation
|--------------------------------------------------------------------------
*/

if (!preg_match('/^[0-9+\-\s]{10,20}$/', $phone)) {

    sendResponse(
        false,
        "Please enter a valid phone number.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Student ID Validation
|--------------------------------------------------------------------------
*/

if (strlen($studentId) < 2 || strlen($studentId) > 50) {

    sendResponse(
        false,
        "Student ID must contain between 2 and 50 characters.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Password Validation
|--------------------------------------------------------------------------
*/

if (strlen($password) < 8) {

    sendResponse(
        false,
        "Password must contain at least 8 characters.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Check Existing Email
|--------------------------------------------------------------------------
*/

$emailCheck = $conn->prepare(
    "SELECT user_id
     FROM users
     WHERE email = ?
     LIMIT 1"
);

if (!$emailCheck) {

    sendResponse(
        false,
        "Unable to prepare email validation.",
        [],
        500
    );
}

$emailCheck->bind_param("s", $collegeEmail);
$emailCheck->execute();
$emailResult = $emailCheck->get_result();

if ($emailResult->num_rows > 0) {

    $emailCheck->close();

    sendResponse(
        false,
        "An account with this email already exists.",
        [],
        409
    );
}

$emailCheck->close();


/*
|--------------------------------------------------------------------------
| Check Existing Student ID
|--------------------------------------------------------------------------
*/

$studentCheck = $conn->prepare(
    "SELECT student_user_id
     FROM students
     WHERE student_id = ?
     LIMIT 1"
);

if (!$studentCheck) {

    sendResponse(
        false,
        "Unable to prepare student ID validation.",
        [],
        500
    );
}

$studentCheck->bind_param("s", $studentId);
$studentCheck->execute();
$studentResult = $studentCheck->get_result();

if ($studentResult->num_rows > 0) {

    $studentCheck->close();

    sendResponse(
        false,
        "This student ID is already registered.",
        [],
        409
    );
}

$studentCheck->close();


/*
|--------------------------------------------------------------------------
| Start Database Transaction
|--------------------------------------------------------------------------
|
| Registration creates records in two tables.
| Either both records are created or neither is created.
|
*/

$conn->begin_transaction();

try {

    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    if ($passwordHash === false) {
        throw new Exception("Password hashing failed.");
    }


    /*
    |--------------------------------------------------------------------------
    | Create User Account
    |--------------------------------------------------------------------------
    */

    $userInsert = $conn->prepare(
        "INSERT INTO users
        (
            email,
            password_hash,
            role,
            is_active
        )
        VALUES (?, ?, 'student', 1)"
    );

    if (!$userInsert) {
        throw new Exception(
            "Unable to prepare user registration."
        );
    }

    $userInsert->bind_param(
        "ss",
        $collegeEmail,
        $passwordHash
    );

    if (!$userInsert->execute()) {

        $userInsert->close();

        throw new Exception(
            "Unable to create user account."
        );
    }

    $studentUserId = $conn->insert_id;

    $userInsert->close();


    /*
    |--------------------------------------------------------------------------
    | Create Student Profile
    |--------------------------------------------------------------------------
    */

    $studentInsert = $conn->prepare(
        "INSERT INTO students
        (
            student_user_id,
            student_id,
            full_name,
            phone,
            location,
            college_email
        )
        VALUES (?, ?, ?, ?, ?, ?)"
    );

    if (!$studentInsert) {
        throw new Exception(
            "Unable to prepare student profile registration."
        );
    }

    $studentInsert->bind_param(
        "isssss",
        $studentUserId,
        $studentId,
        $fullName,
        $phone,
        $location,
        $collegeEmail
    );

    if (!$studentInsert->execute()) {

        $studentInsert->close();

        throw new Exception(
            "Unable to create student profile."
        );
    }

    $studentInsert->close();


    /*
    |--------------------------------------------------------------------------
    | Commit Transaction
    |--------------------------------------------------------------------------
    */

    $conn->commit();


    /*
    |--------------------------------------------------------------------------
    | Successful Registration Response
    |--------------------------------------------------------------------------
    */

    sendResponse(
        true,
        "Student registration completed successfully.",
        [
            "userId" => $studentUserId,
            "studentId" => $studentId,
            "email" => $collegeEmail,
            "role" => "student"
        ],
        201
    );

} catch (Exception $e) {

    /*
    |--------------------------------------------------------------------------
    | Rollback If Anything Fails
    |--------------------------------------------------------------------------
    */

    $conn->rollback();

    sendResponse(
        false,
        "Registration failed. No data was saved.",
        [],
        500
    );
}