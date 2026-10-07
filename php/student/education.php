<?php

/*
|--------------------------------------------------------------------------
| CampusHire - Student Education API
|--------------------------------------------------------------------------
| Stores the student's Step 02 education information in MySQL.
|
| Uses:
|   - php/config/database.php
|   - students table
|   - student_education table
|
| This endpoint supports both:
|   - First-time education submission
|   - Updating existing education information
|--------------------------------------------------------------------------
*/

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";


/*
|--------------------------------------------------------------------------
| JSON Response Helper
|--------------------------------------------------------------------------
*/

function sendResponse(
    $success,
    $message,
    $data = [],
    $statusCode = 200
) {
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
| POST Requests Only
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
| Read JSON Request
|--------------------------------------------------------------------------
*/

$rawInput = file_get_contents("php://input");

$data = json_decode(
    $rawInput,
    true
);


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
| Read Input Data
|--------------------------------------------------------------------------
*/

$userId =
    isset($data["userId"])
        ? (int) $data["userId"]
        : 0;

$degree =
    trim($data["degree"] ?? "");

$department =
    trim($data["department"] ?? "");

$college =
    trim($data["college"] ?? "");

$currentYear =
    trim($data["currentYear"] ?? "");

$graduationYear =
    isset($data["graduationYear"])
        ? (int) $data["graduationYear"]
        : 0;

$cgpa =
    isset($data["cgpa"])
        ? (float) $data["cgpa"]
        : -1;

$backlogValue =
    trim($data["backlogs"] ?? "");


/*
|--------------------------------------------------------------------------
| Validate User ID
|--------------------------------------------------------------------------
*/

if ($userId <= 0) {

    sendResponse(
        false,
        "Student account information is missing. Please complete registration first.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Verify Student Account
|--------------------------------------------------------------------------
*/

$studentCheck = $conn->prepare(
    "SELECT student_user_id
     FROM students
     WHERE student_user_id = ?
     LIMIT 1"
);


if (!$studentCheck) {

    sendResponse(
        false,
        "Unable to verify student account.",
        [],
        500
    );
}


$studentCheck->bind_param(
    "i",
    $userId
);

$studentCheck->execute();

$studentResult =
    $studentCheck->get_result();


if ($studentResult->num_rows === 0) {

    $studentCheck->close();

    sendResponse(
        false,
        "Student account was not found. Please register again.",
        [],
        404
    );
}


$studentCheck->close();


/*
|--------------------------------------------------------------------------
| Validate Degree
|--------------------------------------------------------------------------
*/

if ($degree === "") {

    sendResponse(
        false,
        "Please select your degree.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate Department
|--------------------------------------------------------------------------
*/

if ($department === "") {

    sendResponse(
        false,
        "Please select your department.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate College
|--------------------------------------------------------------------------
*/

if ($college === "") {

    sendResponse(
        false,
        "Please enter your college name.",
        [],
        422
    );
}


if (
    strlen($college) < 3 ||
    strlen($college) > 200
) {

    sendResponse(
        false,
        "Please enter a valid college name.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate Current Year
|--------------------------------------------------------------------------
*/

if (
    $currentYear === "" ||
    !in_array(
        $currentYear,
        ["1", "2", "3", "4"],
        true
    )
) {

    sendResponse(
        false,
        "Please select a valid current year.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate Graduation Year
|--------------------------------------------------------------------------
*/

$currentCalendarYear =
    (int) date("Y");


if (
    $graduationYear < 2020 ||
    $graduationYear > ($currentCalendarYear + 10)
) {

    sendResponse(
        false,
        "Please select a valid graduation year.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate CGPA
|--------------------------------------------------------------------------
*/

if (
    $cgpa < 0 ||
    $cgpa > 10
) {

    sendResponse(
        false,
        "CGPA must be between 0 and 10.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Convert Frontend Backlog Range Into Numeric Value
|--------------------------------------------------------------------------
|
| Database stores backlogs numerically because eligibility matching
| needs a numeric value.
|
| 0    = No backlogs
| 2    = 1-2 backlogs
| 5    = 3-5 backlogs
| 6    = More than 5 backlogs
|
| The value 6 represents "more than 5".
|--------------------------------------------------------------------------
*/

switch ($backlogValue) {

    case "0":
        $backlogs = 0;
        break;

    case "1-2":
        $backlogs = 2;
        break;

    case "3-5":
        $backlogs = 5;
        break;

    case "5+":
        $backlogs = 6;
        break;

    default:

        sendResponse(
            false,
            "Please select a valid backlog status.",
            [],
            422
        );
}


/*
|--------------------------------------------------------------------------
| Save Education Information
|--------------------------------------------------------------------------
|
| The student_education table has a UNIQUE constraint on
| student_user_id.
|
| Therefore:
|
| First submission  → INSERT
| Later submission  → UPDATE
|
| This makes the endpoint permanently reusable.
|--------------------------------------------------------------------------
*/

$educationQuery = $conn->prepare(
    "INSERT INTO student_education
    (
        student_user_id,
        degree,
        department,
        college,
        current_year,
        graduation_year,
        cgpa,
        backlogs
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        degree = VALUES(degree),
        department = VALUES(department),
        college = VALUES(college),
        current_year = VALUES(current_year),
        graduation_year = VALUES(graduation_year),
        cgpa = VALUES(cgpa),
        backlogs = VALUES(backlogs)"
);


if (!$educationQuery) {

    sendResponse(
        false,
        "Unable to prepare education database operation.",
        [],
        500
    );
}


/*
|--------------------------------------------------------------------------
| Bind Parameters
|--------------------------------------------------------------------------
*/

$educationQuery->bind_param(
    "issssidi",
    $userId,
    $degree,
    $department,
    $college,
    $currentYear,
    $graduationYear,
    $cgpa,
    $backlogs
);


/*
|--------------------------------------------------------------------------
| Execute
|--------------------------------------------------------------------------
*/

if (!$educationQuery->execute()) {

    $educationQuery->close();

    sendResponse(
        false,
        "Unable to save education information.",
        [],
        500
    );
}


$educationQuery->close();


/*
|--------------------------------------------------------------------------
| Successful Response
|--------------------------------------------------------------------------
*/

sendResponse(
    true,
    "Education information saved successfully.",
    [
        "userId" => $userId,
        "degree" => $degree,
        "department" => $department,
        "college" => $college,
        "currentYear" => $currentYear,
        "graduationYear" => $graduationYear,
        "cgpa" => $cgpa,
        "backlogs" => $backlogs
    ],
    200
);

?>