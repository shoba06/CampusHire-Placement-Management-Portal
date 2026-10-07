<?php

header("Content-Type: application/json");

session_start();

require_once "../config/database.php";


/*
|--------------------------------------------------------------------------
| Only POST is allowed
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Student authentication
|--------------------------------------------------------------------------
*/

if (
    !isset($_SESSION["campusHireLoggedIn"]) ||
    $_SESSION["campusHireLoggedIn"] !== true ||
    !isset($_SESSION["campusHireRole"]) ||
    $_SESSION["campusHireRole"] !== "student" ||
    !isset($_SESSION["campusHireUserId"])
) {

    echo json_encode([
        "success" => false,
        "message" => "Student login required."
    ]);

    exit;
}


$studentUserId =
    (int)$_SESSION["campusHireUserId"];


/*
|--------------------------------------------------------------------------
| Read JSON request
|--------------------------------------------------------------------------
*/

$rawInput =
    file_get_contents("php://input");


$data =
    json_decode(
        $rawInput,
        true
    );


if (
    !is_array($data)
) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON request."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Get request values
|--------------------------------------------------------------------------
*/

$opportunityId =
    isset($data["opportunityId"])
        ? (int)$data["opportunityId"]
        : 0;


$matchPercentage =
    isset($data["matchPercentage"])
        ? (float)$data["matchPercentage"]
        : 0;


$coverLetter =
    isset($data["coverLetter"])
        ? trim((string)$data["coverLetter"])
        : "";


/*
|--------------------------------------------------------------------------
| Validate opportunity ID
|--------------------------------------------------------------------------
*/

if (
    $opportunityId <= 0
) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid opportunity."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Validate match percentage
|--------------------------------------------------------------------------
*/

if (
    $matchPercentage < 0 ||
    $matchPercentage > 100
) {

    echo json_encode([
        "success" => false,
        "message" => "Match percentage must be between 0 and 100."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Check opportunity
|--------------------------------------------------------------------------
*/

$opportunitySql = "
    SELECT
        opportunity_id,
        title,
        status
    FROM opportunities
    WHERE
        opportunity_id = ?
    LIMIT 1
";


$opportunityStmt =
    $conn->prepare(
        $opportunitySql
    );


if (
    !$opportunityStmt
) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare opportunity query."
    ]);

    exit;
}


$opportunityStmt->bind_param(
    "i",
    $opportunityId
);


$opportunityStmt->execute();


$opportunityResult =
    $opportunityStmt->get_result();


$opportunity =
    $opportunityResult->fetch_assoc();


$opportunityStmt->close();


if (
    !$opportunity
) {

    echo json_encode([
        "success" => false,
        "message" => "Opportunity not found."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Only active opportunities can receive applications
|--------------------------------------------------------------------------
*/

if (
    $opportunity["status"] !== "Active"
) {

    echo json_encode([
        "success" => false,
        "message" => "This opportunity is no longer active."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Check whether student already applied
|--------------------------------------------------------------------------
*/

$duplicateSql = "
    SELECT
        application_id,
        status
    FROM applications
    WHERE
        opportunity_id = ?
        AND student_user_id = ?
    LIMIT 1
";


$duplicateStmt =
    $conn->prepare(
        $duplicateSql
    );


if (
    !$duplicateStmt
) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to check existing application."
    ]);

    exit;
}


$duplicateStmt->bind_param(
    "ii",
    $opportunityId,
    $studentUserId
);


$duplicateStmt->execute();


$duplicateResult =
    $duplicateStmt->get_result();


$existingApplication =
    $duplicateResult->fetch_assoc();


$duplicateStmt->close();


if (
    $existingApplication
) {

    echo json_encode([
        "success" => false,
        "message" =>
            "You have already applied for this opportunity.",
        "applicationId" =>
            (int)$existingApplication["application_id"],
        "status" =>
            $existingApplication["status"]
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Insert application
|--------------------------------------------------------------------------
*/

$insertSql = "
    INSERT INTO applications
    (
        opportunity_id,
        student_user_id,
        match_percentage,
        status,
        cover_letter
    )
    VALUES
    (
        ?,
        ?,
        ?,
        'Applied',
        ?
    )
";


$insertStmt =
    $conn->prepare(
        $insertSql
    );


if (
    !$insertStmt
) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare application insert."
    ]);

    exit;
}


$insertStmt->bind_param(
    "iids",
    $opportunityId,
    $studentUserId,
    $matchPercentage,
    $coverLetter
);


if (
    !$insertStmt->execute()
) {

    /*
    --------------------------------------------------------------
    | Handle duplicate unique-key error safely
    --------------------------------------------------------------
    */

    if (
        $conn->errno === 1062 ||
        $insertStmt->errno === 1062
    ) {

        $insertStmt->close();

        echo json_encode([
            "success" => false,
            "message" =>
                "You have already applied for this opportunity."
        ]);

        exit;
    }


    $error =
        $insertStmt->error;


    $insertStmt->close();


    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to submit application.",
        "error" =>
            $error
    ]);

    exit;
}


$applicationId =
    $insertStmt->insert_id;


$insertStmt->close();


/*
|--------------------------------------------------------------------------
| Success
|--------------------------------------------------------------------------
*/

echo json_encode([

    "success" =>
        true,

    "message" =>
        "Application submitted successfully.",

    "applicationId" =>
        (int)$applicationId,

    "opportunityId" =>
        $opportunityId,

    "matchPercentage" =>
        $matchPercentage,

    "status" =>
        "Applied",

    "opportunityTitle" =>
        $opportunity["title"]

]);


$conn->close();

?>