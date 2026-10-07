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
| Recruiter authentication
|--------------------------------------------------------------------------
*/

if (
    !isset($_SESSION["campusHireRecruiterLoggedIn"]) ||
    $_SESSION["campusHireRecruiterLoggedIn"] !== true ||
    !isset($_SESSION["campusHireUserId"]) ||
    !isset($_SESSION["campusHireCompanyId"])
) {

    echo json_encode([
        "success" => false,
        "message" => "Recruiter login required."
    ]);

    exit;
}


$recruiterUserId =
    (int)$_SESSION["campusHireUserId"];

$companyId =
    (int)$_SESSION["campusHireCompanyId"];


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


if (!is_array($data)) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON request."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Read values
|--------------------------------------------------------------------------
*/

$applicationId =
    isset($data["applicationId"])
        ? (int)$data["applicationId"]
        : 0;


$newStatus =
    isset($data["status"])
        ? trim((string)$data["status"])
        : "";


/*
|--------------------------------------------------------------------------
| Validate application ID
|--------------------------------------------------------------------------
*/

if ($applicationId <= 0) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid application ID."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Allowed statuses
|--------------------------------------------------------------------------
*/

$allowedStatuses = [
    "Applied",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected"
];


if (
    !in_array(
        $newStatus,
        $allowedStatuses,
        true
    )
) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid application status."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Verify that the application belongs to
| this recruiter's opportunity
|--------------------------------------------------------------------------
*/

$checkSql = "
    SELECT
        a.application_id,
        a.status AS current_status,
        o.title AS opportunity_title
    FROM applications a

    INNER JOIN opportunities o
        ON o.opportunity_id = a.opportunity_id

    WHERE
        a.application_id = ?
        AND o.recruiter_user_id = ?
        AND o.company_id = ?

    LIMIT 1
";


$checkStmt =
    $conn->prepare(
        $checkSql
    );


if (!$checkStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare application verification."
    ]);

    exit;
}


$checkStmt->bind_param(
    "iii",
    $applicationId,
    $recruiterUserId,
    $companyId
);


$checkStmt->execute();


$checkResult =
    $checkStmt->get_result();


$application =
    $checkResult->fetch_assoc();


$checkStmt->close();


if (!$application) {

    echo json_encode([
        "success" => false,
        "message" =>
            "Application not found for this recruiter."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Check whether the status is already the same
|--------------------------------------------------------------------------
*/

if (
    $application["current_status"] ===
    $newStatus
) {

    echo json_encode([

        "success" =>
            true,

        "message" =>
            "Application is already in this status.",

        "applicationId" =>
            $applicationId,

        "previousStatus" =>
            $application["current_status"],

        "status" =>
            $newStatus

    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Update application status
|--------------------------------------------------------------------------
*/

$updateSql = "
    UPDATE applications

    SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE
        application_id = ?
";


$updateStmt =
    $conn->prepare(
        $updateSql
    );


if (!$updateStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare status update."
    ]);

    exit;
}


$updateStmt->bind_param(
    "si",
    $newStatus,
    $applicationId
);


if (!$updateStmt->execute()) {

    echo json_encode([
        "success" => false,
        "message" =>
            "Unable to update application status.",
        "error" =>
            $updateStmt->error
    ]);

    $updateStmt->close();

    exit;
}


$updateStmt->close();


/*
|--------------------------------------------------------------------------
| Success
|--------------------------------------------------------------------------
*/

echo json_encode([

    "success" =>
        true,

    "message" =>
        "Application status updated successfully.",

    "applicationId" =>
        $applicationId,

    "previousStatus" =>
        $application["current_status"],

    "status" =>
        $newStatus,

    "opportunityTitle" =>
        $application["opportunity_title"]

]);


$conn->close();

?>