<?php

/*
|--------------------------------------------------------------------------
| CampusHire - Student Projects & Certifications API
|--------------------------------------------------------------------------
| Stores Step 04 information for the logged-in/active student:
|
|   1. Projects       -> student_projects
|   2. Certifications -> certifications
|
| The frontend currently sends the complete Step 04 profile.
|
| This endpoint is designed for:
|   - First-time save
|   - Updating existing profile
|   - Removing deleted projects/certifications
|
| All changes happen inside one database transaction.
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
| POST Only
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
| Read JSON Input
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
| Read User ID
|--------------------------------------------------------------------------
*/

$userId =
    isset($data["userId"])
        ? (int) $data["userId"]
        : 0;


/*
|--------------------------------------------------------------------------
| Read Projects
|--------------------------------------------------------------------------
*/

$projects =
    isset($data["projects"]) &&
    is_array($data["projects"])
        ? $data["projects"]
        : [];


/*
|--------------------------------------------------------------------------
| Read Certifications
|--------------------------------------------------------------------------
*/

$certifications =
    isset($data["certifications"]) &&
    is_array($data["certifications"])
        ? $data["certifications"]
        : [];


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
| Verify Student
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
        "Student account was not found.",
        [],
        404
    );
}


$studentCheck->close();


/*
|--------------------------------------------------------------------------
| At Least One Project Is Required
|--------------------------------------------------------------------------
|
| The existing Step 04 frontend requires at least one project before
| the student can continue to Step 05.
|--------------------------------------------------------------------------
*/

if (count($projects) === 0) {

    sendResponse(
        false,
        "Please add at least one project before continuing.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate and Normalize Projects
|--------------------------------------------------------------------------
*/

$validProjects = [];


foreach ($projects as $index => $project) {

    if (!is_array($project)) {

        sendResponse(
            false,
            "Invalid project data received.",
            [],
            422
        );
    }


    $title =
        trim(
            $project["title"] ?? ""
        );

    $type =
        trim(
            $project["type"] ?? ""
        );

    $status =
        trim(
            $project["status"] ?? ""
        );

    $description =
        trim(
            $project["description"] ?? ""
        );

    $technologies =
        trim(
            $project["technologies"] ?? ""
        );

    $role =
        trim(
            $project["role"] ?? ""
        );

    $github =
        trim(
            $project["github"] ?? ""
        );

    $demo =
        trim(
            $project["demo"] ?? ""
        );


    /*
    |--------------------------------------------------------------------------
    | Required Fields
    |--------------------------------------------------------------------------
    */

    if ($title === "") {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": title is required.",
            [],
            422
        );
    }


    if ($type === "") {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": project type is required.",
            [],
            422
        );
    }


    if ($status === "") {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": project status is required.",
            [],
            422
        );
    }


    if ($description === "") {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": description is required.",
            [],
            422
        );
    }


    if ($technologies === "") {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": technologies are required.",
            [],
            422
        );
    }


    if ($role === "") {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": your role is required.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Length Validation
    |--------------------------------------------------------------------------
    */

    if (strlen($title) > 200) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": title is too long.",
            [],
            422
        );
    }


    if (strlen($type) > 50) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": project type is invalid.",
            [],
            422
        );
    }


    if (strlen($status) > 50) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": project status is invalid.",
            [],
            422
        );
    }


    if (strlen($role) > 150) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": role is too long.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Validate URLs When Provided
    |--------------------------------------------------------------------------
    */

    if (
        $github !== "" &&
        !filter_var(
            $github,
            FILTER_VALIDATE_URL
        )
    ) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": GitHub link is invalid.",
            [],
            422
        );
    }


    if (
        $demo !== "" &&
        !filter_var(
            $demo,
            FILTER_VALIDATE_URL
        )
    ) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": live demo link is invalid.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Allowed Project Values
    |--------------------------------------------------------------------------
    */

    $allowedTypes = [
        "Academic",
        "Personal",
        "Hackathon",
        "Internship",
        "Freelance"
    ];


    $allowedStatuses = [
        "Completed",
        "In Progress"
    ];


    if (
        !in_array(
            $type,
            $allowedTypes,
            true
        )
    ) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": invalid project type.",
            [],
            422
        );
    }


    if (
        !in_array(
            $status,
            $allowedStatuses,
            true
        )
    ) {

        sendResponse(
            false,
            "Project " . ($index + 1) . ": invalid project status.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Store Normalized Project
    |--------------------------------------------------------------------------
    */

    $validProjects[] = [
        "title" => $title,
        "type" => $type,
        "status" => $status,
        "description" => $description,
        "technologies" => $technologies,
        "role" => $role,
        "github" => $github,
        "demo" => $demo
    ];
}


/*
|--------------------------------------------------------------------------
| Validate and Normalize Certifications
|--------------------------------------------------------------------------
|
| Certifications are optional.
|--------------------------------------------------------------------------
*/

$validCertifications = [];


foreach (
    $certifications
    as $index => $certification
) {

    if (!is_array($certification)) {

        sendResponse(
            false,
            "Invalid certification data received.",
            [],
            422
        );
    }


    $name =
        trim(
            $certification["name"] ?? ""
        );

    $organization =
        trim(
            $certification["organization"] ?? ""
        );

    $year =
        isset($certification["year"])
            ? (int) $certification["year"]
            : 0;

    $credentialId =
        trim(
            $certification["credentialId"] ?? ""
        );

    $credentialUrl =
        trim(
            $certification["credentialUrl"] ?? ""
        );


    /*
    |--------------------------------------------------------------------------
    | Required Fields
    |--------------------------------------------------------------------------
    */

    if ($name === "") {

        sendResponse(
            false,
            "Certification " . ($index + 1) . ": name is required.",
            [],
            422
        );
    }


    if ($organization === "") {

        sendResponse(
            false,
            "Certification " . ($index + 1) . ": issuing organization is required.",
            [],
            422
        );
    }


    if (
        $year < 2000 ||
        $year > ((int) date("Y") + 1)
    ) {

        sendResponse(
            false,
            "Certification " . ($index + 1) . ": issue year is invalid.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Optional Credential URL
    |--------------------------------------------------------------------------
    */

    if (
        $credentialUrl !== "" &&
        !filter_var(
            $credentialUrl,
            FILTER_VALIDATE_URL
        )
    ) {

        sendResponse(
            false,
            "Certification " . ($index + 1) . ": credential URL is invalid.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Store Normalized Certification
    |--------------------------------------------------------------------------
    */

    $validCertifications[] = [
        "name" => $name,
        "organization" => $organization,
        "year" => $year,
        "credentialId" => $credentialId,
        "credentialUrl" => $credentialUrl
    ];
}


/*
|--------------------------------------------------------------------------
| Begin Transaction
|--------------------------------------------------------------------------
*/

$conn->begin_transaction();


try {

    /*
    |--------------------------------------------------------------------------
    | Remove Existing Projects
    |--------------------------------------------------------------------------
    |
    | The frontend sends the student's current complete project list.
    | Deleting and recreating these rows makes delete/edit behavior
    | reliable without introducing temporary record IDs.
    |--------------------------------------------------------------------------
    */

    $deleteProjects =
        $conn->prepare(
            "DELETE FROM student_projects
             WHERE student_user_id = ?"
        );


    if (!$deleteProjects) {

        throw new Exception(
            "Unable to prepare project cleanup."
        );
    }


    $deleteProjects->bind_param(
        "i",
        $userId
    );


    if (!$deleteProjects->execute()) {

        $deleteProjects->close();

        throw new Exception(
            "Unable to clear existing projects."
        );
    }


    $deleteProjects->close();


    /*
    |--------------------------------------------------------------------------
    | Insert Projects
    |--------------------------------------------------------------------------
    */

    $projectInsert =
        $conn->prepare(
            "INSERT INTO student_projects
            (
                student_user_id,
                project_title,
                project_type,
                project_status,
                project_description,
                technologies,
                project_role,
                github_url,
                demo_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );


    if (!$projectInsert) {

        throw new Exception(
            "Unable to prepare project insertion."
        );
    }


    foreach ($validProjects as $project) {

        $projectInsert->bind_param(
            "issssssss",
            $userId,
            $project["title"],
            $project["type"],
            $project["status"],
            $project["description"],
            $project["technologies"],
            $project["role"],
            $project["github"],
            $project["demo"]
        );


        if (!$projectInsert->execute()) {

            throw new Exception(
                "Unable to save project: " .
                $project["title"]
            );
        }
    }


    $projectInsert->close();


    /*
    |--------------------------------------------------------------------------
    | Remove Existing Certifications
    |--------------------------------------------------------------------------
    */

    $deleteCertifications =
        $conn->prepare(
            "DELETE FROM certifications
             WHERE student_user_id = ?"
        );


    if (!$deleteCertifications) {

        throw new Exception(
            "Unable to prepare certification cleanup."
        );
    }


    $deleteCertifications->bind_param(
        "i",
        $userId
    );


    if (
        !$deleteCertifications->execute()
    ) {

        $deleteCertifications->close();

        throw new Exception(
            "Unable to clear existing certifications."
        );
    }


    $deleteCertifications->close();


    /*
    |--------------------------------------------------------------------------
    | Insert Certifications
    |--------------------------------------------------------------------------
    */

    if (count($validCertifications) > 0) {

        $certificationInsert =
            $conn->prepare(
                "INSERT INTO certifications
                (
                    student_user_id,
                    certification_name,
                    issuing_organization,
                    issue_date,
                    credential_id,
                    credential_url
                )
                VALUES (?, ?, ?, ?, ?, ?)"
            );


        if (!$certificationInsert) {

            throw new Exception(
                "Unable to prepare certification insertion."
            );
        }


        foreach (
            $validCertifications
            as $certification
        ) {

            /*
            |--------------------------------------------------------------------------
            | The existing UI collects only an issue year.
            |
            | Our database uses DATE, so we store January 1 of
            | the selected year as the normalized database date.
            |--------------------------------------------------------------------------
            */

            $issueDate =
                $certification["year"] .
                "-01-01";


            $certificationInsert->bind_param(
                "isssss",
                $userId,
                $certification["name"],
                $certification["organization"],
                $issueDate,
                $certification["credentialId"],
                $certification["credentialUrl"]
            );


            if (
                !$certificationInsert->execute()
            ) {

                throw new Exception(
                    "Unable to save certification: " .
                    $certification["name"]
                );
            }
        }


        $certificationInsert->close();
    }


    /*
    |--------------------------------------------------------------------------
    | Commit Everything
    |--------------------------------------------------------------------------
    */

    $conn->commit();


    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    sendResponse(
        true,
        "Projects and certifications saved successfully.",
        [
            "userId" =>
                $userId,

            "projectCount" =>
                count($validProjects),

            "certificationCount" =>
                count($validCertifications)
        ],
        200
    );


} catch (Exception $e) {

    /*
    |--------------------------------------------------------------------------
    | Rollback
    |--------------------------------------------------------------------------
    */

    $conn->rollback();


    sendResponse(
        false,
        "Projects and certifications could not be saved. No changes were applied.",
        [],
        500
    );
}

?>