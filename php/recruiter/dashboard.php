<?php

header("Content-Type: application/json");

session_start();

require_once "../config/database.php";


/*
|--------------------------------------------------------------------------
| Check recruiter session
|--------------------------------------------------------------------------
*/

if (
    !isset($_SESSION["campusHireRecruiterLoggedIn"]) ||
    $_SESSION["campusHireRecruiterLoggedIn"] !== true
) {

    echo json_encode([
        "success" => false,
        "message" => "Recruiter login required."
    ]);

    exit;
}


$recruiterUserId =
    $_SESSION["campusHireUserId"] ?? null;

$companyId =
    $_SESSION["campusHireCompanyId"] ?? null;


if (!$recruiterUserId || !$companyId) {

    echo json_encode([
        "success" => false,
        "message" => "Recruiter session information is missing."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Initialize response values
|--------------------------------------------------------------------------
*/

$activeOpportunities = 0;
$totalApplications = 0;
$underReview = 0;
$selectedCandidates = 0;

$opportunities = [];


/*
|--------------------------------------------------------------------------
| Get active opportunities
|--------------------------------------------------------------------------
*/

$opportunitySql = "
    SELECT
        opportunity_id,
        title,
        role_name,
        opportunity_type,
        industry,
        location,
        work_mode,
        package_amount,
        minimum_cgpa,
        maximum_backlogs,
        graduation_year,
        description,
        status,
        created_at
    FROM opportunities
    WHERE
        recruiter_user_id = ?
        AND company_id = ?
        AND status = 'Active'
    ORDER BY created_at DESC
";


$opportunityStmt =
    $conn->prepare($opportunitySql);


if (!$opportunityStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare opportunity query."
    ]);

    exit;
}


$opportunityStmt->bind_param(
    "ii",
    $recruiterUserId,
    $companyId
);


$opportunityStmt->execute();


$opportunityResult =
    $opportunityStmt->get_result();


$activeOpportunities =
    $opportunityResult->num_rows;


while (
    $row =
    $opportunityResult->fetch_assoc()
) {

    $opportunities[] = [

        "opportunityId" =>
            (int)$row["opportunity_id"],

        "title" =>
            $row["title"],

        "roleName" =>
            $row["role_name"],

        "opportunityType" =>
            $row["opportunity_type"],

        "industry" =>
            $row["industry"],

        "location" =>
            $row["location"],

        "workMode" =>
            $row["work_mode"],

        "packageAmount" =>
            $row["package_amount"],

        "minimumCgpa" =>
            $row["minimum_cgpa"],

        "maximumBacklogs" =>
            $row["maximum_backlogs"],

        "graduationYear" =>
            $row["graduation_year"],

        "description" =>
            $row["description"],

        "status" =>
            $row["status"],

        "createdAt" =>
            $row["created_at"]

    ];

}


$opportunityStmt->close();


/*
|--------------------------------------------------------------------------
| Get application statistics
|--------------------------------------------------------------------------
|
| Applications are counted only for this recruiter's opportunities.
|
*/

$applicationsSql = "
    SELECT
        COUNT(*) AS total_applications,

        SUM(
            CASE
                WHEN a.status IN
                (
                    'Under Review',
                    'Shortlisted',
                    'Interview'
                )
                THEN 1
                ELSE 0
            END
        ) AS under_review,

        SUM(
            CASE
                WHEN a.status = 'Selected'
                THEN 1
                ELSE 0
            END
        ) AS selected_count

    FROM applications a

    INNER JOIN opportunities o
        ON o.opportunity_id = a.opportunity_id

    WHERE
        o.recruiter_user_id = ?
        AND o.company_id = ?
";


$applicationsStmt =
    $conn->prepare($applicationsSql);


if (!$applicationsStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare application query."
    ]);

    exit;
}


$applicationsStmt->bind_param(
    "ii",
    $recruiterUserId,
    $companyId
);


$applicationsStmt->execute();


$applicationsResult =
    $applicationsStmt->get_result();


$applicationStats =
    $applicationsResult->fetch_assoc();


$totalApplications =
    (int)(
        $applicationStats["total_applications"]
        ?? 0
    );


$underReview =
    (int)(
        $applicationStats["under_review"]
        ?? 0
    );


$selectedCandidates =
    (int)(
        $applicationStats["selected_count"]
        ?? 0
    );


$applicationsStmt->close();


/*
|--------------------------------------------------------------------------
| Recruiter / Company information
|--------------------------------------------------------------------------
*/

$recruiterName =
    "Recruiter";

$companyName =
    "Company";


$recruiterSql = "
    SELECT
        r.recruiter_name,
        c.company_name
    FROM recruiters r
    INNER JOIN companies c
        ON c.company_id = r.company_id
    WHERE
        r.recruiter_user_id = ?
        AND r.company_id = ?
    LIMIT 1
";


$recruiterStmt =
    $conn->prepare($recruiterSql);


if ($recruiterStmt) {

    $recruiterStmt->bind_param(
        "ii",
        $recruiterUserId,
        $companyId
    );


    $recruiterStmt->execute();


    $recruiterResult =
        $recruiterStmt->get_result();


    if (
        $recruiterRow =
        $recruiterResult->fetch_assoc()
    ) {

        $recruiterName =
            $recruiterRow["recruiter_name"];

        $companyName =
            $recruiterRow["company_name"];

    }


    $recruiterStmt->close();

}


/*
|--------------------------------------------------------------------------
| Return dashboard data
|--------------------------------------------------------------------------
*/

echo json_encode([

    "success" =>
        true,

    "recruiter" => [

        "userId" =>
            (int)$recruiterUserId,

        "companyId" =>
            (int)$companyId,

        "recruiterName" =>
            $recruiterName,

        "companyName" =>
            $companyName

    ],

    "stats" => [

        "activeOpportunities" =>
            $activeOpportunities,

        "applications" =>
            $totalApplications,

        "underReview" =>
            $underReview,

        "selected" =>
            $selectedCandidates

    ],

    "opportunities" =>
        $opportunities

]);


$conn->close();

?>