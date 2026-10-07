<?php

/*
|--------------------------------------------------------------------------
| CampusHire - Student Skills API
|--------------------------------------------------------------------------
| Stores the student's selected skills in MySQL.
|
| Database tables used:
|   - students
|   - skills
|   - student_skills
|
| The frontend currently collects one overall proficiency.
| That proficiency is stored in the "proficiency" column for
| every selected student skill.
|
| This endpoint supports:
|   - First-time skill submission
|   - Updating existing skills
|   - Removing skills that the student deselects
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
| Only POST Requests Are Allowed
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
| Read Skills
|--------------------------------------------------------------------------
*/

$skills =
    isset($data["skills"]) &&
    is_array($data["skills"])
        ? $data["skills"]
        : [];


/*
|--------------------------------------------------------------------------
| Read Overall Proficiency
|--------------------------------------------------------------------------
*/

$proficiency =
    trim(
        $data["proficiency"] ?? ""
    );


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
| Verify Student Exists
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
        "Student account was not found. Please complete registration first.",
        [],
        404
    );
}


$studentCheck->close();


/*
|--------------------------------------------------------------------------
| Validate Proficiency
|--------------------------------------------------------------------------
*/

$allowedProficiency = [
    "Beginner",
    "Intermediate",
    "Advanced"
];


if (
    !in_array(
        $proficiency,
        $allowedProficiency,
        true
    )
) {

    sendResponse(
        false,
        "Please select a valid skill proficiency level.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Validate Skills
|--------------------------------------------------------------------------
*/

if (count($skills) === 0) {

    sendResponse(
        false,
        "Please select at least one skill.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Prepare Unique Skills
|--------------------------------------------------------------------------
|
| The frontend already removes duplicates, but the backend also
| protects against duplicate values.
|
| Each item may be:
|
|   "Java"
|
| or:
|
|   {
|       "name": "Java",
|       "category": "Programming"
|   }
|--------------------------------------------------------------------------
*/

$uniqueSkills = [];


foreach ($skills as $skill) {

    $skillName = "";
    $category = "Other";


    /*
    |--------------------------------------------------------------------------
    | Object Format
    |--------------------------------------------------------------------------
    */

    if (is_array($skill)) {

        $skillName =
            trim(
                $skill["name"] ?? ""
            );

        $category =
            trim(
                $skill["category"] ?? "Other"
            );

    }


    /*
    |--------------------------------------------------------------------------
    | String Format
    |--------------------------------------------------------------------------
    */

    elseif (is_string($skill)) {

        $skillName =
            trim($skill);
    }


    /*
    |--------------------------------------------------------------------------
    | Skip Empty Values
    |--------------------------------------------------------------------------
    */

    if ($skillName === "") {
        continue;
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Skill Name
    |--------------------------------------------------------------------------
    */

    if (
        strlen($skillName) < 1 ||
        strlen($skillName) > 100
    ) {

        sendResponse(
            false,
            "A selected skill contains an invalid name.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Category
    |--------------------------------------------------------------------------
    */

    if ($category === "") {
        $category = "Other";
    }


    if (strlen($category) > 100) {

        sendResponse(
            false,
            "A selected skill contains an invalid category.",
            [],
            422
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Create Case-Insensitive Unique Key
    |--------------------------------------------------------------------------
    */

    $skillKey =
        strtolower(
            $skillName
        );


    $uniqueSkills[$skillKey] = [
        "name" => $skillName,
        "category" => $category
    ];
}


$uniqueSkills =
    array_values(
        $uniqueSkills
    );


/*
|--------------------------------------------------------------------------
| Check Again After Cleaning
|--------------------------------------------------------------------------
*/

if (count($uniqueSkills) === 0) {

    sendResponse(
        false,
        "Please select at least one valid skill.",
        [],
        422
    );
}


/*
|--------------------------------------------------------------------------
| Begin Transaction
|--------------------------------------------------------------------------
|
| We want the entire skill update to succeed together.
|
| If something fails:
|   DELETE old skills
|   INSERT new skills
|
| will all be rolled back.
|--------------------------------------------------------------------------
*/

$conn->begin_transaction();


try {

    /*
    |--------------------------------------------------------------------------
    | Remove Existing Student Skills
    |--------------------------------------------------------------------------
    |
    | This ensures that if a student unchecks Java later,
    | Java is removed from their current skill profile.
    |--------------------------------------------------------------------------
    */

    $deleteSkills =
        $conn->prepare(
            "DELETE FROM student_skills
             WHERE student_user_id = ?"
        );


    if (!$deleteSkills) {

        throw new Exception(
            "Unable to prepare existing skill cleanup."
        );
    }


    $deleteSkills->bind_param(
        "i",
        $userId
    );


    if (!$deleteSkills->execute()) {

        $deleteSkills->close();

        throw new Exception(
            "Unable to clear existing student skills."
        );
    }


    $deleteSkills->close();


    /*
    |--------------------------------------------------------------------------
    | Prepare Skill Insert
    |--------------------------------------------------------------------------
    |
    | If the skill already exists in the master skills table,
    | LAST_INSERT_ID(skill_id) gives us its existing ID.
    |
    | If it doesn't exist, a new skill is created.
    |--------------------------------------------------------------------------
    */

    $skillInsert =
        $conn->prepare(
            "INSERT INTO skills
            (
                skill_name,
                category
            )
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                skill_id = LAST_INSERT_ID(skill_id)"
        );


    if (!$skillInsert) {

        throw new Exception(
            "Unable to prepare skill database operation."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Prepare Student Skill Insert
    |--------------------------------------------------------------------------
    */

    $studentSkillInsert =
        $conn->prepare(
            "INSERT INTO student_skills
            (
                student_user_id,
                skill_id,
                proficiency
            )
            VALUES (?, ?, ?)"
        );


    if (!$studentSkillInsert) {

        $skillInsert->close();

        throw new Exception(
            "Unable to prepare student skill database operation."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Store Each Skill
    |--------------------------------------------------------------------------
    */

    $savedSkills = [];


    foreach ($uniqueSkills as $skill) {

        $skillName =
            $skill["name"];

        $category =
            $skill["category"];


        /*
        |--------------------------------------------------------------------------
        | Insert Skill Into Master Table
        |--------------------------------------------------------------------------
        */

        $skillInsert->bind_param(
            "ss",
            $skillName,
            $category
        );


        if (!$skillInsert->execute()) {

            throw new Exception(
                "Unable to save skill: " .
                $skillName
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Get Existing/New Skill ID
        |--------------------------------------------------------------------------
        */

        $skillId =
            $conn->insert_id;


        if ($skillId <= 0) {

            throw new Exception(
                "Unable to determine skill ID for: " .
                $skillName
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Insert Student-Skill Relationship
        |--------------------------------------------------------------------------
        */

        $studentSkillInsert->bind_param(
            "iis",
            $userId,
            $skillId,
            $proficiency
        );


        if (!$studentSkillInsert->execute()) {

            throw new Exception(
                "Unable to save student skill: " .
                $skillName
            );
        }


        $savedSkills[] = [
            "skillId" => $skillId,
            "skillName" => $skillName,
            "category" => $category,
            "proficiency" => $proficiency
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Close Prepared Statements
    |--------------------------------------------------------------------------
    */

    $skillInsert->close();

    $studentSkillInsert->close();


    /*
    |--------------------------------------------------------------------------
    | Commit Transaction
    |--------------------------------------------------------------------------
    */

    $conn->commit();


    /*
    |--------------------------------------------------------------------------
    | Successful Response
    |--------------------------------------------------------------------------
    */

    sendResponse(
        true,
        "Skills profile saved successfully.",
        [
            "userId" => $userId,
            "proficiency" => $proficiency,
            "skillCount" => count($savedSkills),
            "skills" => $savedSkills
        ],
        200
    );


} catch (Exception $e) {

    /*
    |--------------------------------------------------------------------------
    | Rollback On Failure
    |--------------------------------------------------------------------------
    */

    $conn->rollback();


    sendResponse(
        false,
        "Skills profile could not be saved. No skill changes were applied.",
        [],
        500
    );
}

?>