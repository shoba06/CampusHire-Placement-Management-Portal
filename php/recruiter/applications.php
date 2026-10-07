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
| Get recruiter applications
|--------------------------------------------------------------------------
|
| Only applications belonging to this recruiter's opportunities
| are returned.
|
*/

$sql = "
    SELECT

        a.application_id,
        a.opportunity_id,
        a.student_user_id,
        a.match_percentage,
        a.status,
        a.cover_letter,
        a.applied_at,
        a.updated_at,

        o.title AS opportunity_title,
        o.role_name,
        o.opportunity_type,
        o.industry,
        o.location,
        o.work_mode,
        o.package_amount,

        s.student_id,
        s.full_name,
        s.phone,
        s.location AS student_location,
        s.college_email,

        se.degree,
        se.department,
        se.college,
        se.current_year,
        se.graduation_year,
        se.cgpa,
        se.backlogs

    FROM applications a

    INNER JOIN opportunities o
        ON o.opportunity_id = a.opportunity_id

    INNER JOIN students s
        ON s.student_user_id = a.student_user_id

    LEFT JOIN student_education se
        ON se.student_user_id = a.student_user_id

    WHERE
        o.recruiter_user_id = ?
        AND o.company_id = ?

    ORDER BY
        a.applied_at DESC
";


$stmt =
    $conn->prepare($sql);


if (!$stmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to prepare applications query."
    ]);

    exit;
}


$stmt->bind_param(
    "ii",
    $recruiterUserId,
    $companyId
);


$stmt->execute();


$result =
    $stmt->get_result();


$applications = [];


/*
|--------------------------------------------------------------------------
| Build response
|--------------------------------------------------------------------------
*/

while (
    $row =
    $result->fetch_assoc()
) {

    $applications[] = [

        "applicationId" =>
            (int)$row["application_id"],

        "opportunityId" =>
            (int)$row["opportunity_id"],

        "studentUserId" =>
            (int)$row["student_user_id"],

        "matchPercentage" =>
            $row["match_percentage"] !== null
                ? (float)$row["match_percentage"]
                : 0,

        "status" =>
            $row["status"],

        "coverLetter" =>
            $row["cover_letter"],

        "appliedAt" =>
            $row["applied_at"],

        "updatedAt" =>
            $row["updated_at"],


        /*
        |--------------------------------------------------------------------------
        | Opportunity
        |--------------------------------------------------------------------------
        */

        "opportunity" => [

            "title" =>
                $row["opportunity_title"],

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
                $row["package_amount"]

        ],


        /*
        |--------------------------------------------------------------------------
        | Student
        |--------------------------------------------------------------------------
        */

        "student" => [

            "studentId" =>
                $row["student_id"],

            "fullName" =>
                $row["full_name"],

            "phone" =>
                $row["phone"],

            "location" =>
                $row["student_location"],

            "collegeEmail" =>
                $row["college_email"]

        ],


        /*
        |--------------------------------------------------------------------------
        | Education
        |--------------------------------------------------------------------------
        */

        "education" => [

            "degree" =>
                $row["degree"],

            "department" =>
                $row["department"],

            "college" =>
                $row["college"],

            "currentYear" =>
                $row["current_year"],

            "graduationYear" =>
                $row["graduation_year"],

            "cgpa" =>
                $row["cgpa"],

            "backlogs" =>
                $row["backlogs"]

        ]

    ];

}


$stmt->close();


/*
|--------------------------------------------------------------------------
| Status summary
|--------------------------------------------------------------------------
*/

$totalApplications =
    count($applications);


$applied =
    0;

$shortlisted =
    0;

$interview =
    0;

$selected =
    0;

$rejected =
    0;


foreach (
    $applications as $application
) {

    switch (
        $application["status"]
    ) {

        case "Applied":

            $applied++;

            break;


        case "Shortlisted":

            $shortlisted++;

            break;


        case "Interview":

            $interview++;

            break;


        case "Selected":

            $selected++;

            break;


        case "Rejected":

            $rejected++;

            break;

    }

}


/*
|--------------------------------------------------------------------------
| Return JSON
|--------------------------------------------------------------------------
*/

echo json_encode([

    "success" =>
        true,

    "count" =>
        $totalApplications,

    "summary" => [

        "total" =>
            $totalApplications,

        "applied" =>
            $applied,

        "shortlisted" =>
            $shortlisted,

        "interview" =>
            $interview,

        "selected" =>
            $selected,

        "rejected" =>
            $rejected

    ],

    "applications" =>
        $applications

]);


$conn->close();

?>