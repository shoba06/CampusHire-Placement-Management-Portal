<?php

header("Content-Type: application/json");

session_start();

require_once "../config/database.php";


/*
|--------------------------------------------------------------------------
| Only GET is allowed
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Student login check
|--------------------------------------------------------------------------
*/

if (
    !isset($_SESSION["campusHireLoggedIn"]) ||
    $_SESSION["campusHireLoggedIn"] !== true ||
    !isset($_SESSION["campusHireRole"]) ||
    $_SESSION["campusHireRole"] !== "student"
) {

    echo json_encode([
        "success" => false,
        "message" => "Student login required."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Get active opportunities
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT
        o.opportunity_id,
        o.title,
        o.role_name,
        o.opportunity_type,
        o.industry,
        o.location,
        o.work_mode,
        o.package_amount,
        o.minimum_cgpa,
        o.maximum_backlogs,
        o.graduation_year,
        o.description,
        o.status,
        o.created_at,
        c.company_name
    FROM opportunities o
    INNER JOIN companies c
        ON c.company_id = o.company_id
    WHERE o.status = 'Active'
    ORDER BY o.created_at DESC
";


$stmt =
    $conn->prepare($sql);


if (!$stmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare opportunity query."
    ]);

    exit;
}


$stmt->execute();


$result =
    $stmt->get_result();


$opportunities = [];


/*
|--------------------------------------------------------------------------
| Prepare required skill query
|--------------------------------------------------------------------------
*/

$skillSql = "
    SELECT
        s.skill_name,
        os.minimum_proficiency
    FROM opportunity_skills os
    INNER JOIN skills s
        ON s.skill_id = os.skill_id
    WHERE os.opportunity_id = ?
    ORDER BY s.skill_name
";


$skillStmt =
    $conn->prepare($skillSql);


if (!$skillStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare skill query."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Build opportunity response
|--------------------------------------------------------------------------
*/

while (
    $row =
    $result->fetch_assoc()
) {

    $opportunityId =
        (int)$row["opportunity_id"];


    $requiredSkills = [];


    /*
    --------------------------------------------------------------
    | Get required skills
    --------------------------------------------------------------
    */

    $skillStmt->bind_param(
        "i",
        $opportunityId
    );


    $skillStmt->execute();


    $skillResult =
        $skillStmt->get_result();


    while (
        $skillRow =
        $skillResult->fetch_assoc()
    ) {

        $requiredSkills[] =
            $skillRow["skill_name"];

    }


    /*
    --------------------------------------------------------------
    | Add opportunity
    --------------------------------------------------------------
    */

    $opportunities[] = [

        "id" =>
            $opportunityId,

        "title" =>
            $row["title"],

        "role" =>
            $row["role_name"],

        "company" =>
            $row["company_name"],

        "location" =>
            $row["location"],

        "workMode" =>
            $row["work_mode"],

        "industry" =>
            $row["industry"],

        "package" =>
            $row["package_amount"],

        "type" =>
            $row["opportunity_type"],

        "requiredSkills" =>
            $requiredSkills,

        "eligibility" => [

            "minCgpa" =>
                $row["minimum_cgpa"],

            "maxBacklogs" =>
                $row["maximum_backlogs"],

            "graduationYear" =>
                (string)$row["graduation_year"]

        ],

        "description" =>
            $row["description"],

        "status" =>
            $row["status"],

        "createdAt" =>
            $row["created_at"]

    ];

}


$stmt->close();

$skillStmt->close();


/*
|--------------------------------------------------------------------------
| Return JSON
|--------------------------------------------------------------------------
*/

echo json_encode([

    "success" =>
        true,

    "count" =>
        count($opportunities),

    "opportunities" =>
        $opportunities

]);


$conn->close();

?>