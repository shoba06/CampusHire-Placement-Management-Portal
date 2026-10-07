<?php

session_start();

header("Content-Type: application/json");

require_once "../config/database.php";


/* =====================================================
   ONLY GET REQUESTS
===================================================== */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are allowed."
    ]);

    exit;
}


/* =====================================================
   CHECK LOGIN SESSION
===================================================== */

if (
    empty($_SESSION["campusHireLoggedIn"]) ||
    empty($_SESSION["campusHireUserId"]) ||
    $_SESSION["campusHireRole"] !== "student"
) {

    echo json_encode([
        "success" => false,
        "message" => "Student login session not found.",
        "redirect" => "student-login.html"
    ]);

    exit;
}


$userId =
    (int)$_SESSION["campusHireUserId"];


/* =====================================================
   1. BASIC STUDENT INFORMATION
===================================================== */

$basicQuery = "
    SELECT
        u.user_id,
        u.email,
        u.role,
        s.student_id,
        s.full_name,
        s.phone,
        s.location,
        s.college_email

    FROM users u

    INNER JOIN students s
        ON s.student_user_id = u.user_id

    WHERE u.user_id = ?

    LIMIT 1
";


$basicStmt =
    $conn->prepare($basicQuery);


if (!$basicStmt) {

    echo json_encode([
        "success" => false,
        "message" => "Unable to load student information."
    ]);

    $conn->close();

    exit;
}


$basicStmt->bind_param(
    "i",
    $userId
);


$basicStmt->execute();


$basicResult =
    $basicStmt->get_result();


if ($basicResult->num_rows === 0) {

    $basicStmt->close();
    $conn->close();

    echo json_encode([
        "success" => false,
        "message" => "Student profile not found."
    ]);

    exit;
}


$basic =
    $basicResult->fetch_assoc();


$basicStmt->close();


/* =====================================================
   2. EDUCATION
===================================================== */

$education = null;


$educationQuery = "
    SELECT
        degree,
        department,
        college,
        current_year,
        graduation_year,
        cgpa,
        backlogs

    FROM student_education

    WHERE student_user_id = ?

    LIMIT 1
";


$educationStmt =
    $conn->prepare(
        $educationQuery
    );


if ($educationStmt) {

    $educationStmt->bind_param(
        "i",
        $userId
    );

    $educationStmt->execute();

    $educationResult =
        $educationStmt->get_result();

    if (
        $educationResult->num_rows > 0
    ) {

        $education =
            $educationResult->fetch_assoc();

    }

    $educationStmt->close();

}


/* =====================================================
   3. CAREER PREFERENCES
===================================================== */

$career = [
    "workMode" => "",
    "preferredLocation" => "",
    "expectedPackage" => "",
    "availability" => "",
    "careerGoal" => ""
];


$careerQuery = "
    SELECT
        work_mode,
        preferred_location,
        expected_package,
        availability,
        career_goal

    FROM career_preferences

    WHERE student_user_id = ?

    LIMIT 1
";


$careerStmt =
    $conn->prepare(
        $careerQuery
    );


if ($careerStmt) {

    $careerStmt->bind_param(
        "i",
        $userId
    );

    $careerStmt->execute();

    $careerResult =
        $careerStmt->get_result();

    if (
        $careerResult->num_rows > 0
    ) {

        $careerRow =
            $careerResult->fetch_assoc();


        $career = [

            "workMode" =>
                $careerRow["work_mode"] ?? "",

            "preferredLocation" =>
                $careerRow["preferred_location"] ?? "",

            "expectedPackage" =>
                $careerRow["expected_package"] ?? "",

            "availability" =>
                $careerRow["availability"] ?? "",

            "careerGoal" =>
                $careerRow["career_goal"] ?? ""

        ];

    }

    $careerStmt->close();

}


/* =====================================================
   4. TARGET ROLES
===================================================== */

$roles = [];


$rolesQuery = "
    SELECT target_role

    FROM student_target_roles

    WHERE student_user_id = ?

    ORDER BY target_role
";


$rolesStmt =
    $conn->prepare(
        $rolesQuery
    );


if ($rolesStmt) {

    $rolesStmt->bind_param(
        "i",
        $userId
    );

    $rolesStmt->execute();

    $rolesResult =
        $rolesStmt->get_result();


    while (
        $row =
        $rolesResult->fetch_assoc()
    ) {

        $roles[] =
            $row["target_role"];

    }


    $rolesStmt->close();

}


/* =====================================================
   5. INDUSTRIES
===================================================== */

$industries = [];


$industriesQuery = "
    SELECT industry

    FROM student_industries

    WHERE student_user_id = ?

    ORDER BY industry
";


$industriesStmt =
    $conn->prepare(
        $industriesQuery
    );


if ($industriesStmt) {

    $industriesStmt->bind_param(
        "i",
        $userId
    );

    $industriesStmt->execute();

    $industriesResult =
        $industriesStmt->get_result();


    while (
        $row =
        $industriesResult->fetch_assoc()
    ) {

        $industries[] =
            $row["industry"];

    }


    $industriesStmt->close();

}


/* =====================================================
   6. SKILLS
===================================================== */

$skills = [];


$skillsQuery = "
    SELECT
        sk.skill_name,
        ss.proficiency,
        sk.category

    FROM student_skills ss

    INNER JOIN skills sk
        ON sk.skill_id = ss.skill_id

    WHERE ss.student_user_id = ?

    ORDER BY sk.skill_name
";


$skillsStmt =
    $conn->prepare(
        $skillsQuery
    );


$proficiencyValues = [];


if ($skillsStmt) {

    $skillsStmt->bind_param(
        "i",
        $userId
    );

    $skillsStmt->execute();

    $skillsResult =
        $skillsStmt->get_result();


    while (
        $row =
        $skillsResult->fetch_assoc()
    ) {

        $skills[] = [

            "name" =>
                $row["skill_name"],

            "category" =>
                $row["category"],

            "proficiency" =>
                $row["proficiency"]

        ];


        if (
            !empty(
                $row["proficiency"]
            )
        ) {

            $proficiencyValues[] =
                $row["proficiency"];

        }

    }


    $skillsStmt->close();

}


/* =====================================================
   7. PROJECT COUNT
===================================================== */

$projectCount = 0;


$projectQuery = "
    SELECT COUNT(*) AS total

    FROM student_projects

    WHERE student_user_id = ?
";


$projectStmt =
    $conn->prepare(
        $projectQuery
    );


if ($projectStmt) {

    $projectStmt->bind_param(
        "i",
        $userId
    );

    $projectStmt->execute();

    $projectResult =
        $projectStmt->get_result();

    $projectRow =
        $projectResult->fetch_assoc();

    $projectCount =
        (int)(
            $projectRow["total"] ?? 0
        );

    $projectStmt->close();

}


/* =====================================================
   8. CERTIFICATION COUNT
===================================================== */

$certificationCount = 0;


$certificationQuery = "
    SELECT COUNT(*) AS total

    FROM certifications

    WHERE student_user_id = ?
";


$certificationStmt =
    $conn->prepare(
        $certificationQuery
    );


if ($certificationStmt) {

    $certificationStmt->bind_param(
        "i",
        $userId
    );

    $certificationStmt->execute();

    $certificationResult =
        $certificationStmt->get_result();

    $certificationRow =
        $certificationResult->fetch_assoc();

    $certificationCount =
        (int)(
            $certificationRow["total"] ?? 0
        );

    $certificationStmt->close();

}


/* =====================================================
   9. OVERALL PROFICIENCY
===================================================== */

/*
   Step 03 currently stores one common proficiency
   for the student's selected skills.

   We take the first available value because all selected
   skills were saved with the same overall proficiency.
*/

$overallProficiency = "";


if (
    count($proficiencyValues) > 0
) {

    $overallProficiency =
        $proficiencyValues[0];

}


/* =====================================================
   10. PROFILE COMPLETION
===================================================== */

$profileCompletion = 0;


/*
   Five major profile stages:

   1. Basic information
   2. Education
   3. Skills
   4. Projects / certifications
   5. Career preferences
*/

$profileParts = 0;


/* Basic */
if (
    !empty($basic["full_name"]) &&
    !empty($basic["college_email"]) &&
    !empty($basic["student_id"])
) {

    $profileParts++;

}


/* Education */
if (
    $education !== null
) {

    $profileParts++;

}


/* Skills */
if (
    count($skills) > 0
) {

    $profileParts++;

}


/* Projects / certifications */
if (
    $projectCount > 0 ||
    $certificationCount > 0
) {

    $profileParts++;

}


/* Career */
if (
    count($roles) > 0 &&
    count($industries) > 0 &&
    !empty($career["workMode"]) &&
    !empty($career["preferredLocation"]) &&
    !empty($career["expectedPackage"]) &&
    !empty($career["availability"]) &&
    !empty($career["careerGoal"])
) {

    $profileParts++;

}


$profileCompletion =
    (int)round(
        (
            $profileParts /
            5
        ) * 100
    );


/* =====================================================
   11. CLOSE DATABASE
===================================================== */

$conn->close();


/* =====================================================
   12. RETURN RESPONSE
===================================================== */

echo json_encode([

    "success" => true,

    "student" => [

        "userId" =>
            (int)$basic["user_id"],

        "studentId" =>
            $basic["student_id"],

        "fullName" =>
            $basic["full_name"],

        "email" =>
            $basic["email"],

        "collegeEmail" =>
            $basic["college_email"],

        "phone" =>
            $basic["phone"],

        "location" =>
            $basic["location"],

        "role" =>
            $basic["role"]

    ],

    "education" =>
        $education,

    "career" => [

        "roles" =>
            $roles,

        "industries" =>
            $industries,

        "workMode" =>
            $career["workMode"],

        "preferredLocation" =>
            $career["preferredLocation"],

        "expectedPackage" =>
            $career["expectedPackage"],

        "availability" =>
            $career["availability"],

        "careerGoal" =>
            $career["careerGoal"]

    ],

    "skills" =>
        $skills,

    "overallProficiency" =>
        $overallProficiency,

    "projectCount" =>
        $projectCount,

    "certificationCount" =>
        $certificationCount,

    "profileCompletion" =>
        $profileCompletion

]);

?>