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
    !isset($_SESSION["campusHireUserId"])
) {

    echo json_encode([
        "success" => false,
        "message" => "Recruiter login required."
    ]);

    exit;
}


$recruiterUserId =
    (int)$_SESSION["campusHireUserId"];


/*
|--------------------------------------------------------------------------
| Load recruiter's opportunities
|--------------------------------------------------------------------------
*/

$opportunities = [];


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
    WHERE recruiter_user_id = ?
    ORDER BY opportunity_id DESC
";


$opportunityStmt =
    $conn->prepare(
        $opportunitySql
    );


if (!$opportunityStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to load opportunities."
    ]);

    exit;
}


$opportunityStmt->bind_param(
    "i",
    $recruiterUserId
);


$opportunityStmt->execute();


$opportunityResult =
    $opportunityStmt->get_result();


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
            (int)$row["maximum_backlogs"],

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
| Load applications / candidates
|--------------------------------------------------------------------------
|
| GROUP_CONCAT is used to collect the student's skills
| into one field.
|--------------------------------------------------------------------------
*/

$applications = [];


$applicationSql = "
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
        o.role_name AS opportunity_role,
        o.opportunity_type,
        o.industry AS opportunity_industry,
        o.location AS opportunity_location,
        o.work_mode AS opportunity_work_mode,
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
        se.backlogs,

        GROUP_CONCAT(
            DISTINCT sk.skill_name
            ORDER BY sk.skill_name
            SEPARATOR '||'
        ) AS skills

    FROM applications a

    INNER JOIN opportunities o
        ON o.opportunity_id = a.opportunity_id

    INNER JOIN students s
        ON s.student_user_id = a.student_user_id

    LEFT JOIN student_education se
        ON se.student_user_id = a.student_user_id

    LEFT JOIN student_skills ss
        ON ss.student_user_id = a.student_user_id

    LEFT JOIN skills sk
        ON sk.skill_id = ss.skill_id

    WHERE
        o.recruiter_user_id = ?

    GROUP BY
        a.application_id,
        a.opportunity_id,
        a.student_user_id,
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
        s.student_id,
        s.full_name,
        s.phone,
        s.location,
        s.college_email,
        se.degree,
        se.department,
        se.college,
        se.current_year,
        se.graduation_year,
        se.cgpa,
        se.backlogs

    ORDER BY
        a.match_percentage DESC,
        a.applied_at DESC
";


$applicationStmt =
    $conn->prepare(
        $applicationSql
    );


if (!$applicationStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to load candidates."
    ]);

    exit;
}


$applicationStmt->bind_param(
    "i",
    $recruiterUserId
);


$applicationStmt->execute();


$applicationResult =
    $applicationStmt->get_result();


while (
    $row =
    $applicationResult->fetch_assoc()
) {

    $skills = [];


    if (
        !empty(
            $row["skills"]
        )
    ) {

        $skills =
            explode(
                "||",
                $row["skills"]
            );

    }


    $applications[] = [

        "applicationId" =>
            (int)$row["application_id"],

        "opportunityId" =>
            (int)$row["opportunity_id"],

        "studentUserId" =>
            (int)$row["student_user_id"],

        "matchPercentage" =>
            (float)$row["match_percentage"],

        "status" =>
            $row["status"],

        "coverLetter" =>
            $row["cover_letter"],

        "appliedAt" =>
            $row["applied_at"],

        "updatedAt" =>
            $row["updated_at"],


        "opportunity" => [

            "title" =>
                $row["opportunity_title"],

            "roleName" =>
                $row["opportunity_role"],

            "opportunityType" =>
                $row["opportunity_type"],

            "industry" =>
                $row["opportunity_industry"],

            "location" =>
                $row["opportunity_location"],

            "workMode" =>
                $row["opportunity_work_mode"],

            "packageAmount" =>
                $row["package_amount"]

        ],


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

        ],


        "skills" =>
            $skills

    ];

}


$applicationStmt->close();


/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
*/

$total =
    count(
        $applications
    );


$applied = 0;
$shortlisted = 0;
$interview = 0;
$selected = 0;
$rejected = 0;


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
| Response
|--------------------------------------------------------------------------
*/

echo json_encode([

    "success" =>
        true,

    "recruiterUserId" =>
        $recruiterUserId,

    "opportunities" =>
        $opportunities,

    "summary" => [

        "total" =>
            $total,

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