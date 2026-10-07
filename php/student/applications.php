<?php

header("Content-Type: application/json");

session_start();

require_once "../config/database.php";


/* =========================================================
   ACCESS CONTROL
   ========================================================= */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);

    exit;
}


$userId =
    $_SESSION["campusHireUserId"] ?? null;

$role =
    $_SESSION["campusHireRole"] ?? "";

$loggedIn =
    $_SESSION["campusHireLoggedIn"] ?? false;


if (
    !$loggedIn ||
    $role !== "student" ||
    !$userId
) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Student authentication required."
    ]);

    exit;
}


/* =========================================================
   STUDENT INFORMATION
   ========================================================= */

$studentQuery = "
    SELECT
        s.student_user_id,
        s.student_id,
        s.full_name,
        s.college_email
    FROM students s
    WHERE s.student_user_id = ?
    LIMIT 1
";


$studentStmt =
    $conn->prepare($studentQuery);


if (!$studentStmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare student query."
    ]);

    exit;
}


$studentStmt->bind_param(
    "i",
    $userId
);

$studentStmt->execute();


$studentResult =
    $studentStmt->get_result();


$student =
    $studentResult->fetch_assoc();


$studentStmt->close();


if (!$student) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Student profile not found."
    ]);

    exit;
}


/* =========================================================
   APPLICATIONS
   ========================================================= */

$applicationsQuery = "
    SELECT
        a.application_id,
        a.opportunity_id,
        a.match_percentage,
        a.status,
        a.cover_letter,
        a.applied_at,
        a.updated_at,

        o.title,
        o.role_name,
        o.opportunity_type,
        o.industry,
        o.location,
        o.work_mode,
        o.package_amount,
        o.description,
        o.status AS opportunity_status,

        c.company_name

    FROM applications a

    INNER JOIN opportunities o
        ON o.opportunity_id = a.opportunity_id

    INNER JOIN companies c
        ON c.company_id = o.company_id

    WHERE a.student_user_id = ?

    ORDER BY
        COALESCE(
            a.updated_at,
            a.applied_at
        ) DESC
";


$applicationsStmt =
    $conn->prepare(
        $applicationsQuery
    );


if (!$applicationsStmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare applications query."
    ]);

    exit;
}


$applicationsStmt->bind_param(
    "i",
    $userId
);

$applicationsStmt->execute();


$applicationsResult =
    $applicationsStmt->get_result();


$applications = [];


while (
    $row =
    $applicationsResult->fetch_assoc()
) {

    $status =
        $row["status"] ?: "Applied";


    /*
       Build a simple recruitment timeline
       from the database timestamps.

       Applied:
       applied_at

       Current status:
       updated_at, when the status changed
    */

    $timeline = [

        [
            "status" => "Applied",
            "date" => $row["applied_at"],
            "completed" => true
        ]

    ];


    if (
        $status !== "Applied" &&
        !empty($row["updated_at"])
    ) {

        $timeline[] = [

            "status" => $status,
            "date" => $row["updated_at"],
            "completed" => true

        ];

    }


    $applications[] = [

        "applicationId" =>
            (int)$row["application_id"],

        "opportunityId" =>
            (int)$row["opportunity_id"],

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

        "description" =>
            $row["description"],

        "matchPercentage" =>
            (float)$row["match_percentage"],

        "status" =>
            $status,

        "coverLetter" =>
            $row["cover_letter"],

        "appliedAt" =>
            $row["applied_at"],

        "updatedAt" =>
            $row["updated_at"],

        "opportunityStatus" =>
            $row["opportunity_status"],

        "timeline" =>
            $timeline

    ];

}


$applicationsStmt->close();


/* =========================================================
   SUMMARY
   ========================================================= */

$totalApplications =
    count($applications);


$underReview = 0;

$selected = 0;

$interviews = 0;


foreach (
    $applications as $application
) {

    $status =
        strtolower(
            trim(
                $application["status"]
            )
        );


    if (
        $status === "shortlisted" ||
        $status === "interview"
    ) {

        $underReview++;

    }


    if (
        $status === "interview"
    ) {

        $interviews++;

    }


    if (
        $status === "selected"
    ) {

        $selected++;

    }

}


/* =========================================================
   RESPONSE
   ========================================================= */

echo json_encode(

    [

        "success" => true,

        "student" => [

            "userId" =>
                (int)$student["student_user_id"],

            "studentId" =>
                $student["student_id"],

            "fullName" =>
                $student["full_name"],

            "collegeEmail" =>
                $student["college_email"]

        ],

        "summary" => [

            "totalApplications" =>
                $totalApplications,

            "underReview" =>
                $underReview,

            "selected" =>
                $selected,

            "interviews" =>
                $interviews

        ],

        "applications" =>
            $applications

    ],

    JSON_UNESCAPED_UNICODE

);

?>