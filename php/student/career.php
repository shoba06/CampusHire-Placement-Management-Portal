<?php

header("Content-Type: application/json");

require_once "../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data."
    ]);
    exit;
}

/* ----------------------------------------------------
   READ INPUT
---------------------------------------------------- */

$userId = isset($input["userId"]) ? (int)$input["userId"] : 0;

$roles = isset($input["roles"]) && is_array($input["roles"])
    ? $input["roles"]
    : [];

$industries = isset($input["industries"]) && is_array($input["industries"])
    ? $input["industries"]
    : [];

$workMode = trim($input["workMode"] ?? "");
$preferredLocation = trim($input["preferredLocation"] ?? "");
$salaryExpectation = trim($input["salaryExpectation"] ?? "");
$availability = trim($input["availability"] ?? "");
$careerGoal = trim($input["careerGoal"] ?? "");


/* ----------------------------------------------------
   VALIDATION
---------------------------------------------------- */

if ($userId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid user ID."
    ]);
    exit;
}

if (count($roles) === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Please select at least one target role."
    ]);
    exit;
}

if (count($industries) === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Please select at least one industry."
    ]);
    exit;
}

if ($workMode === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please select a work mode."
    ]);
    exit;
}

if ($preferredLocation === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please select a preferred location."
    ]);
    exit;
}

if ($salaryExpectation === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please select your expected package."
    ]);
    exit;
}

if ($availability === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please select your availability."
    ]);
    exit;
}

if ($careerGoal === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please enter your career goal."
    ]);
    exit;
}

if (strlen($careerGoal) < 20) {
    echo json_encode([
        "success" => false,
        "message" => "Career goal must contain at least 20 characters."
    ]);
    exit;
}


/* ----------------------------------------------------
   CHECK STUDENT
---------------------------------------------------- */

$studentCheck = $conn->prepare(
    "SELECT student_user_id
     FROM students
     WHERE student_user_id = ?"
);

$studentCheck->bind_param("i", $userId);
$studentCheck->execute();

$studentResult = $studentCheck->get_result();

if ($studentResult->num_rows === 0) {

    echo json_encode([
        "success" => false,
        "message" => "Student profile not found."
    ]);

    $studentCheck->close();
    $conn->close();
    exit;
}

$studentCheck->close();


/* ----------------------------------------------------
   START TRANSACTION
---------------------------------------------------- */

$conn->begin_transaction();

try {

    /* ------------------------------------------------
       1. REMOVE EXISTING TARGET ROLES
    ------------------------------------------------ */

    $deleteRoles = $conn->prepare(
        "DELETE FROM student_target_roles
         WHERE student_user_id = ?"
    );

    $deleteRoles->bind_param("i", $userId);
    $deleteRoles->execute();
    $deleteRoles->close();


    /* ------------------------------------------------
       2. INSERT TARGET ROLES
    ------------------------------------------------ */

    $insertRole = $conn->prepare(
        "INSERT INTO student_target_roles
        (student_user_id, target_role)
        VALUES (?, ?)"
    );

    foreach ($roles as $role) {

        $role = trim($role);

        if ($role === "") {
            continue;
        }

        $insertRole->bind_param("is", $userId, $role);
        $insertRole->execute();
    }

    $insertRole->close();


    /* ------------------------------------------------
       3. REMOVE EXISTING INDUSTRIES
    ------------------------------------------------ */

    $deleteIndustries = $conn->prepare(
        "DELETE FROM student_industries
         WHERE student_user_id = ?"
    );

    $deleteIndustries->bind_param("i", $userId);
    $deleteIndustries->execute();
    $deleteIndustries->close();


    /* ------------------------------------------------
       4. INSERT INDUSTRIES
    ------------------------------------------------ */

    $insertIndustry = $conn->prepare(
        "INSERT INTO student_industries
        (student_user_id, industry)
        VALUES (?, ?)"
    );

    foreach ($industries as $industry) {

        $industry = trim($industry);

        if ($industry === "") {
            continue;
        }

        $insertIndustry->bind_param("is", $userId, $industry);
        $insertIndustry->execute();
    }

    $insertIndustry->close();


    /* ------------------------------------------------
       5. INSERT / UPDATE CAREER PREFERENCES
    ------------------------------------------------ */

    $careerQuery = "
        INSERT INTO career_preferences
        (
            student_user_id,
            work_mode,
            preferred_location,
            expected_package,
            availability,
            career_goal
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            work_mode = VALUES(work_mode),
            preferred_location = VALUES(preferred_location),
            expected_package = VALUES(expected_package),
            availability = VALUES(availability),
            career_goal = VALUES(career_goal)
    ";

    $careerStmt = $conn->prepare($careerQuery);

    $careerStmt->bind_param(
        "isssss",
        $userId,
        $workMode,
        $preferredLocation,
        $salaryExpectation,
        $availability,
        $careerGoal
    );

    $careerStmt->execute();
    $careerStmt->close();


    /* ------------------------------------------------
       COMMIT
    ------------------------------------------------ */

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Career preferences saved successfully.",
        "userId" => $userId,
        "rolesCount" => count($roles),
        "industriesCount" => count($industries)
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => "Failed to save career preferences.",
        "error" => $e->getMessage()
    ]);
}

$conn->close();

?>