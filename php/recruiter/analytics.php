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


$recruiterUserId =
    $_SESSION["campusHireUserId"] ?? null;

$recruiterRole =
    $_SESSION["campusHireRole"] ?? "";

$recruiterLoggedIn =
    $_SESSION["campusHireRecruiterLoggedIn"] ?? false;


if (
    !$recruiterLoggedIn ||
    $recruiterRole !== "recruiter" ||
    !$recruiterUserId
) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Recruiter authentication required."
    ]);

    exit;
}


/* =========================================================
   RECRUITER / COMPANY INFORMATION
   ========================================================= */

$recruiterQuery = "
    SELECT
        u.user_id,
        r.company_id,
        r.recruiter_name,
        c.company_name
    FROM users u
    INNER JOIN recruiters r
        ON r.recruiter_user_id = u.user_id
    INNER JOIN companies c
        ON c.company_id = r.company_id
    WHERE u.user_id = ?
      AND u.role = 'recruiter'
    LIMIT 1
";


$recruiterStmt =
    $conn->prepare($recruiterQuery);


if (!$recruiterStmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare recruiter query."
    ]);

    exit;
}


$recruiterStmt->bind_param(
    "i",
    $recruiterUserId
);

$recruiterStmt->execute();


$recruiterResult =
    $recruiterStmt->get_result();


$recruiter =
    $recruiterResult->fetch_assoc();


$recruiterStmt->close();


if (!$recruiter) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Recruiter profile not found."
    ]);

    exit;
}


/* =========================================================
   ACTIVE OPPORTUNITIES
   ========================================================= */

$opportunitiesQuery = "
    SELECT
        o.opportunity_id,
        o.title,
        o.role_name,
        o.status,
        o.created_at,
        c.company_name
    FROM opportunities o
    INNER JOIN companies c
        ON c.company_id = o.company_id
    WHERE o.recruiter_user_id = ?
      AND o.status = 'Active'
    ORDER BY o.created_at DESC
";


$opportunitiesStmt =
    $conn->prepare($opportunitiesQuery);


if (!$opportunitiesStmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to prepare opportunities query."
    ]);

    exit;
}


$opportunitiesStmt->bind_param(
    "i",
    $recruiterUserId
);

$opportunitiesStmt->execute();


$opportunitiesResult =
    $opportunitiesStmt->get_result();


$opportunities = [];


while (
    $row =
    $opportunitiesResult->fetch_assoc()
) {

    $opportunities[] = [

        "opportunityId" =>
            (int)$row["opportunity_id"],

        "title" =>
            $row["title"],

        "roleName" =>
            $row["role_name"],

        "companyName" =>
            $row["company_name"],

        "status" =>
            $row["status"],

        "createdAt" =>
            $row["created_at"]

    ];

}


$opportunitiesStmt->close();


/* =========================================================
   APPLICATIONS
   ========================================================= */

$applicationsQuery = "
    SELECT
        a.application_id,
        a.opportunity_id,
        a.student_user_id,
        a.match_percentage,
        a.status,
        a.applied_at,
        a.updated_at,

        o.title,
        o.role_name,

        c.company_name,

        s.full_name,
        s.student_id

    FROM applications a

    INNER JOIN opportunities o
        ON o.opportunity_id = a.opportunity_id

    INNER JOIN companies c
        ON c.company_id = o.company_id

    INNER JOIN students s
        ON s.student_user_id = a.student_user_id

    WHERE o.recruiter_user_id = ?

    ORDER BY
        COALESCE(
            a.updated_at,
            a.applied_at
        ) DESC
";


$applicationsStmt =
    $conn->prepare($applicationsQuery);


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
    $recruiterUserId
);

$applicationsStmt->execute();


$applicationsResult =
    $applicationsStmt->get_result();


$applications = [];


while (
    $row =
    $applicationsResult->fetch_assoc()
) {

    $applications[] = [

        "applicationId" =>
            (int)$row["application_id"],

        "opportunityId" =>
            (int)$row["opportunity_id"],

        "studentUserId" =>
            (int)$row["student_user_id"],

        "studentName" =>
            $row["full_name"],

        "studentId" =>
            $row["student_id"],

        "title" =>
            $row["title"],

        "roleName" =>
            $row["role_name"],

        "companyName" =>
            $row["company_name"],

        "matchPercentage" =>
            (float)$row["match_percentage"],

        "status" =>
            $row["status"],

        "appliedAt" =>
            $row["applied_at"],

        "updatedAt" =>
            $row["updated_at"]

    ];

}


$applicationsStmt->close();


/* =========================================================
   SUMMARY COUNTS
   ========================================================= */

$totalApplications =
    count($applications);


$applied = 0;

$shortlisted = 0;

$interview = 0;

$selected = 0;

$rejected = 0;


$totalMatch = 0;

$matchCount = 0;


foreach (
    $applications as $application
) {

    $status =
        strtolower(
            trim(
                $application["status"]
            )
        );


    if ($status === "applied") {

        $applied++;

    }

    elseif ($status === "shortlisted") {

        $shortlisted++;

    }

    elseif ($status === "interview") {

        $interview++;

    }

    elseif ($status === "selected") {

        $selected++;

    }

    elseif ($status === "rejected") {

        $rejected++;

    }


    $match =
        (float)
        $application["matchPercentage"];


    if ($match > 0) {

        $totalMatch += $match;

        $matchCount++;

    }

}


/*
   Under Review:
   Shortlisted + Interview
*/

$underReview =
    $shortlisted + $interview;


$selectionRate =
    $totalApplications > 0
        ? round(
            (
                $selected /
                $totalApplications
            ) * 100
        )
        : 0;


$averageMatch =
    $matchCount > 0
        ? round(
            $totalMatch /
            $matchCount
        )
        : 0;


$interviewRate =
    $totalApplications > 0
        ? round(
            (
                $interview /
                $totalApplications
            ) * 100
        )
        : 0;


$shortlistRate =
    $totalApplications > 0
        ? round(
            (
                $shortlisted /
                $totalApplications
            ) * 100
        )
        : 0;


/* =========================================================
   OPPORTUNITY PERFORMANCE
   ========================================================= */

$opportunityStats = [];


/* Initialize all active opportunities */

foreach (
    $opportunities as $opportunity
) {

    $id =
        $opportunity["opportunityId"];


    $opportunityStats[$id] = [

        "opportunityId" =>
            $id,

        "title" =>
            $opportunity["title"],

        "roleName" =>
            $opportunity["roleName"],

        "companyName" =>
            $opportunity["companyName"],

        "applications" =>
            0,

        "matches" =>
            [],

        "shortlisted" =>
            0,

        "interview" =>
            0,

        "selected" =>
            0

    ];

}


/* Add applications */

foreach (
    $applications as $application
) {

    $id =
        $application["opportunityId"];


    /*
       Keep an opportunity visible even if
       it is not currently active.
    */

    if (!isset($opportunityStats[$id])) {

        $opportunityStats[$id] = [

            "opportunityId" =>
                $id,

            "title" =>
                $application["title"],

            "roleName" =>
                $application["roleName"],

            "companyName" =>
                $application["companyName"],

            "applications" =>
                0,

            "matches" =>
                [],

            "shortlisted" =>
                0,

            "interview" =>
                0,

            "selected" =>
                0

        ];

    }


    $opportunityStats[$id]["applications"]++;


    $match =
        (float)
        $application["matchPercentage"];


    if ($match > 0) {

        $opportunityStats[$id]["matches"][] =
            $match;

    }


    $status =
        strtolower(
            trim(
                $application["status"]
            )
        );


    if ($status === "shortlisted") {

        $opportunityStats[$id]["shortlisted"]++;

    }

    elseif ($status === "interview") {

        $opportunityStats[$id]["interview"]++;

    }

    elseif ($status === "selected") {

        $opportunityStats[$id]["selected"]++;

    }

}


/* Convert opportunity stats */

$opportunityPerformance = [];


foreach (
    $opportunityStats as $record
) {

    $matches =
        $record["matches"];


    $avgMatch =
        count($matches) > 0
            ? round(
                array_sum($matches) /
                count($matches)
            )
            : 0;


    $opportunityPerformance[] = [

        "opportunityId" =>
            $record["opportunityId"],

        "title" =>
            $record["title"],

        "roleName" =>
            $record["roleName"],

        "companyName" =>
            $record["companyName"],

        "applications" =>
            $record["applications"],

        "averageMatch" =>
            $avgMatch,

        "shortlisted" =>
            $record["shortlisted"],

        "interview" =>
            $record["interview"],

        "selected" =>
            $record["selected"]

    ];

}


/*
   Highest application count first.
*/

usort(
    $opportunityPerformance,
    function (
        $a,
        $b
    ) {

        return
            $b["applications"] -
            $a["applications"];

    }
);


/* =========================================================
   BEST MATCH
   ========================================================= */

$bestMatch = null;


foreach (
    $applications as $application
) {

    if (
        $bestMatch === null ||
        (float)$application["matchPercentage"] >
        (float)$bestMatch["matchPercentage"]
    ) {

        $bestMatch =
            $application;

    }

}


/* =========================================================
   TOP PERFORMING ROLE
   ========================================================= */

$roleStats = [];


foreach (
    $applications as $application
) {

    $role =
        $application["roleName"];


    if (!$role) {

        $role =
            $application["title"] ??
            "Unknown Role";

    }


    if (
        !isset(
            $roleStats[$role]
        )
    ) {

        $roleStats[$role] = [

            "applications" =>
                0,

            "selected" =>
                0

        ];

    }


    $roleStats[$role]["applications"]++;


    if (
        strtolower(
            trim(
                $application["status"]
            )
        ) ===
        "selected"
    ) {

        $roleStats[$role]["selected"]++;

    }

}


$topRole = null;


foreach (
    $roleStats as
    $roleName => $stats
) {

    if (
        $topRole === null ||
        $stats["applications"] >
        $topRole["applications"]
    ) {

        $topRole = [

            "roleName" =>
                $roleName,

            "applications" =>
                $stats["applications"],

            "selected" =>
                $stats["selected"]

        ];

    }

}


/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

$recentActivity = [];


$activityApplications =
    array_slice(
        $applications,
        0,
        8
    );


foreach (
    $activityApplications as
    $application
) {

    $recentActivity[] = [

        "applicationId" =>
            $application["applicationId"],

        "studentName" =>
            $application["studentName"],

        "title" =>
            $application["title"],

        "roleName" =>
            $application["roleName"],

        "status" =>
            $application["status"],

        "matchPercentage" =>
            (float)$application["matchPercentage"],

        "activityDate" =>
            $application["updatedAt"] ??
            $application["appliedAt"]

    ];

}


/* =========================================================
   FINAL RESPONSE
   ========================================================= */

echo json_encode(

    [

        "success" =>
            true,

        "recruiter" => [

            "userId" =>
                (int)$recruiter["user_id"],

            "companyId" =>
                (int)$recruiter["company_id"],

            "recruiterName" =>
                $recruiter["recruiter_name"],

            "companyName" =>
                $recruiter["company_name"]

        ],

        "summary" => [

            "activeOpportunities" =>
                count($opportunities),

            "totalApplications" =>
                $totalApplications,

            "underReview" =>
                $underReview,

            "selected" =>
                $selected,

            "applied" =>
                $applied,

            "shortlisted" =>
                $shortlisted,

            "interview" =>
                $interview,

            "rejected" =>
                $rejected,

            "selectionRate" =>
                $selectionRate,

            "averageMatch" =>
                $averageMatch,

            "interviewRate" =>
                $interviewRate,

            "shortlistRate" =>
                $shortlistRate

        ],

        "pipeline" => [

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

        "insights" => [

            "topRole" =>
                $topRole,

            "bestMatch" =>
                $bestMatch
                    ? [
                        "studentName" =>
                            $bestMatch["studentName"],

                        "matchPercentage" =>
                            (float)
                            $bestMatch["matchPercentage"],

                        "title" =>
                            $bestMatch["title"],

                        "roleName" =>
                            $bestMatch["roleName"]
                    ]
                    : null

        ],

        "opportunities" =>
            $opportunityPerformance,

        "recentActivity" =>
            $recentActivity

    ],

    JSON_UNESCAPED_UNICODE

);

?>