<?php

header("Content-Type: application/json");

session_start();

require_once "../config/database.php";


/*
|--------------------------------------------------------------------------
| Allow only POST
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
| Check recruiter login
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
| Read JSON request
|--------------------------------------------------------------------------
*/

$input = json_decode(
    file_get_contents("php://input"),
    true
);


if (!is_array($input)) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Read fields
|--------------------------------------------------------------------------
*/

$title =
    trim($input["title"] ?? "");

$roleName =
    trim($input["roleName"] ?? "");

$opportunityType =
    trim($input["opportunityType"] ?? "");

$industry =
    trim($input["industry"] ?? "");

$location =
    trim($input["location"] ?? "");

$workMode =
    trim($input["workMode"] ?? "");

$packageAmount =
    $input["packageAmount"] ?? null;

$minimumCgpa =
    $input["minimumCgpa"] ?? null;

$maximumBacklogs =
    $input["maximumBacklogs"] ?? null;

$graduationYear =
    $input["graduationYear"] ?? null;

$description =
    trim($input["description"] ?? "");

$skills =
    $input["skills"] ?? [];


/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($title === "") {

    echo json_encode([
        "success" => false,
        "message" => "Opportunity title is required."
    ]);

    exit;
}


if ($roleName === "") {

    echo json_encode([
        "success" => false,
        "message" => "Role name is required."
    ]);

    exit;
}


if ($opportunityType === "") {

    echo json_encode([
        "success" => false,
        "message" => "Opportunity type is required."
    ]);

    exit;
}


if ($industry === "") {

    echo json_encode([
        "success" => false,
        "message" => "Industry is required."
    ]);

    exit;
}


if ($location === "") {

    echo json_encode([
        "success" => false,
        "message" => "Location is required."
    ]);

    exit;
}


if ($workMode === "") {

    echo json_encode([
        "success" => false,
        "message" => "Work mode is required."
    ]);

    exit;
}


if (
    $packageAmount === null ||
    $packageAmount === "" ||
    !is_numeric($packageAmount)
) {

    echo json_encode([
        "success" => false,
        "message" => "Valid package amount is required."
    ]);

    exit;
}


if (
    $minimumCgpa === null ||
    $minimumCgpa === "" ||
    !is_numeric($minimumCgpa)
) {

    echo json_encode([
        "success" => false,
        "message" => "Valid minimum CGPA is required."
    ]);

    exit;
}


if (
    $maximumBacklogs === null ||
    $maximumBacklogs === "" ||
    !is_numeric($maximumBacklogs)
) {

    echo json_encode([
        "success" => false,
        "message" => "Valid maximum backlogs value is required."
    ]);

    exit;
}


if (
    $graduationYear === null ||
    $graduationYear === "" ||
    !is_numeric($graduationYear)
) {

    echo json_encode([
        "success" => false,
        "message" => "Valid graduation year is required."
    ]);

    exit;
}


if (!is_array($skills)) {

    $skills = [];

}


/*
|--------------------------------------------------------------------------
| Clean skill list
|--------------------------------------------------------------------------
*/

$cleanSkills = [];

foreach ($skills as $skill) {

    if (is_array($skill)) {

        $skillName =
            trim($skill["name"] ?? "");

        $proficiency =
            trim(
                $skill["proficiency"] ??
                "Intermediate"
            );

    } else {

        $skillName =
            trim((string)$skill);

        $proficiency =
            "Intermediate";

    }


    if ($skillName === "") {

        continue;

    }


    if (
        $proficiency !== "Beginner" &&
        $proficiency !== "Intermediate" &&
        $proficiency !== "Advanced"
    ) {

        $proficiency =
            "Intermediate";

    }


    $cleanSkills[] = [

        "name" =>
            $skillName,

        "proficiency" =>
            $proficiency

    ];

}


/*
|--------------------------------------------------------------------------
| Convert numeric values
|--------------------------------------------------------------------------
*/

$packageAmount =
    (float)$packageAmount;

$minimumCgpa =
    (float)$minimumCgpa;

$maximumBacklogs =
    (int)$maximumBacklogs;

$graduationYear =
    (int)$graduationYear;


/*
|--------------------------------------------------------------------------
| Start transaction
|--------------------------------------------------------------------------
*/

$conn->begin_transaction();


try {


    /*
    |--------------------------------------------------------------------------
    | Verify recruiter + company relationship
    |--------------------------------------------------------------------------
    */

    $verifySql = "
        SELECT
            r.recruiter_user_id,
            r.company_id
        FROM recruiters r
        INNER JOIN users u
            ON u.user_id = r.recruiter_user_id
        WHERE
            r.recruiter_user_id = ?
            AND r.company_id = ?
            AND u.role = 'recruiter'
            AND u.is_active = 1
        LIMIT 1
    ";


    $verifyStmt =
        $conn->prepare($verifySql);


    if (!$verifyStmt) {

        throw new Exception(
            "Failed to prepare recruiter verification query."
        );

    }


    $verifyStmt->bind_param(
        "ii",
        $recruiterUserId,
        $companyId
    );


    $verifyStmt->execute();


    $verifyResult =
        $verifyStmt->get_result();


    if ($verifyResult->num_rows === 0) {

        throw new Exception(
            "Recruiter is not linked to the selected company."
        );

    }


    $verifyStmt->close();


    /*
    |--------------------------------------------------------------------------
    | Insert opportunity
    |--------------------------------------------------------------------------
    */

    $insertSql = "
        INSERT INTO opportunities
        (
            company_id,
            recruiter_user_id,
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
            status
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'Active'
        )
    ";


    $insertStmt =
        $conn->prepare($insertSql);


    if (!$insertStmt) {

        throw new Exception(
            "Failed to prepare opportunity insert query."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Correct parameter types
    |--------------------------------------------------------------------------
    |
    | i  = integer
    | s  = string
    | d  = double
    |
    | company_id       -> i
    | recruiter_user_id-> i
    | title            -> s
    | role_name        -> s
    | opportunity_type -> s
    | industry         -> s
    | location         -> s
    | work_mode        -> s
    | package_amount   -> d
    | minimum_cgpa     -> d
    | maximum_backlogs -> i
    | graduation_year  -> i
    | description      -> s
    |
    */

    $insertStmt->bind_param(
        "iissssssddiis",
        $companyId,
        $recruiterUserId,
        $title,
        $roleName,
        $opportunityType,
        $industry,
        $location,
        $workMode,
        $packageAmount,
        $minimumCgpa,
        $maximumBacklogs,
        $graduationYear,
        $description
    );


    if (!$insertStmt->execute()) {

        throw new Exception(
            "Failed to create opportunity: " .
            $insertStmt->error
        );

    }


    $opportunityId =
        $conn->insert_id;


    $insertStmt->close();


    /*
    |--------------------------------------------------------------------------
    | Prepare skill lookup
    |--------------------------------------------------------------------------
    */

    $skillSelectSql = "
        SELECT
            skill_id
        FROM skills
        WHERE skill_name = ?
        LIMIT 1
    ";


    $skillSelectStmt =
        $conn->prepare($skillSelectSql);


    if (!$skillSelectStmt) {

        throw new Exception(
            "Failed to prepare skill lookup."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Prepare new skill insert
    |--------------------------------------------------------------------------
    */

    $skillMasterSql = "
        INSERT INTO skills
        (
            skill_name,
            category
        )
        VALUES
        (
            ?,
            'Technical'
        )
    ";


    $skillMasterStmt =
        $conn->prepare($skillMasterSql);


    if (!$skillMasterStmt) {

        throw new Exception(
            "Failed to prepare skill creation query."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Prepare opportunity skill insert
    |--------------------------------------------------------------------------
    */

    $skillInsertSql = "
        INSERT INTO opportunity_skills
        (
            opportunity_id,
            skill_id,
            minimum_proficiency
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
    ";


    $skillInsertStmt =
        $conn->prepare($skillInsertSql);


    if (!$skillInsertStmt) {

        throw new Exception(
            "Failed to prepare opportunity skill insert."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Process every skill
    |--------------------------------------------------------------------------
    */

    foreach ($cleanSkills as $skill) {

        $skillName =
            $skill["name"];

        $proficiency =
            $skill["proficiency"];


        /*
        |--------------------------------------------------------------------------
        | Check existing master skill
        |--------------------------------------------------------------------------
        */

        $skillSelectStmt->bind_param(
            "s",
            $skillName
        );


        $skillSelectStmt->execute();


        $skillResult =
            $skillSelectStmt->get_result();


        if ($skillResult->num_rows > 0) {

            $skillRow =
                $skillResult->fetch_assoc();

            $skillId =
                (int)$skillRow["skill_id"];

        } else {

            /*
            |--------------------------------------------------------------------------
            | Create new master skill
            |--------------------------------------------------------------------------
            */

            $skillMasterStmt->bind_param(
                "s",
                $skillName
            );


            if (!$skillMasterStmt->execute()) {

                throw new Exception(
                    "Failed to create skill: " .
                    $skillMasterStmt->error
                );

            }


            $skillId =
                $conn->insert_id;

        }


        /*
        |--------------------------------------------------------------------------
        | Link skill to opportunity
        |--------------------------------------------------------------------------
        */

        $skillInsertStmt->bind_param(
            "iis",
            $opportunityId,
            $skillId,
            $proficiency
        );


        if (!$skillInsertStmt->execute()) {

            throw new Exception(
                "Failed to link skill to opportunity: " .
                $skillInsertStmt->error
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Close statements
    |--------------------------------------------------------------------------
    */

    $skillSelectStmt->close();

    $skillMasterStmt->close();

    $skillInsertStmt->close();


    /*
    |--------------------------------------------------------------------------
    | Commit
    |--------------------------------------------------------------------------
    */

    $conn->commit();


    echo json_encode([

        "success" =>
            true,

        "message" =>
            "Opportunity created successfully.",

        "opportunityId" =>
            $opportunityId

    ]);


} catch (Throwable $e) {


    /*
    |--------------------------------------------------------------------------
    | Rollback on error
    |--------------------------------------------------------------------------
    */

    $conn->rollback();


    echo json_encode([

        "success" =>
            false,

        "message" =>
            $e->getMessage()

    ]);

}


$conn->close();

?>