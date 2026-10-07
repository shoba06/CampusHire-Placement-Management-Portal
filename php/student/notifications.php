<?php

header("Content-Type: application/json");

session_start();

require_once "../config/database.php";


/* =========================================================
   COMMON RESPONSE
   ========================================================= */

function sendResponse(
    $success,
    $message = "",
    $data = []
) {

    echo json_encode(
        array_merge(
            [
                "success" => $success,
                "message" => $message
            ],
            $data
        ),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/* =========================================================
   STUDENT AUTHENTICATION
   ========================================================= */

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

    sendResponse(
        false,
        "Student authentication required."
    );

}


/* =========================================================
   CHECK APPLICATION NOTIFICATION EXISTS
   ========================================================= */

function notificationExistsForApplication(
    $conn,
    $userId,
    $applicationId,
    $notificationType
) {

    $query = "
        SELECT notification_id
        FROM notifications
        WHERE user_id = ?
          AND application_id = ?
          AND notification_type = ?
        LIMIT 1
    ";


    $stmt =
        $conn->prepare($query);


    if (!$stmt) {

        return false;

    }


    $stmt->bind_param(
        "iis",
        $userId,
        $applicationId,
        $notificationType
    );


    $stmt->execute();


    $result =
        $stmt->get_result();


    $exists =
        $result->num_rows > 0;


    $stmt->close();


    return $exists;

}


/* =========================================================
   CHECK OPPORTUNITY NOTIFICATION EXISTS
   ========================================================= */

function notificationExistsForOpportunity(
    $conn,
    $userId,
    $opportunityId
) {

    $query = "
        SELECT notification_id
        FROM notifications
        WHERE user_id = ?
          AND opportunity_id = ?
          AND notification_type = 'opportunity'
        LIMIT 1
    ";


    $stmt =
        $conn->prepare($query);


    if (!$stmt) {

        return false;

    }


    $stmt->bind_param(
        "ii",
        $userId,
        $opportunityId
    );


    $stmt->execute();


    $result =
        $stmt->get_result();


    $exists =
        $result->num_rows > 0;


    $stmt->close();


    return $exists;

}


/* =========================================================
   CREATE NOTIFICATION
   ========================================================= */

function createNotification(
    $conn,
    $userId,
    $applicationId,
    $opportunityId,
    $notificationType,
    $title,
    $message
) {

    $query = "
        INSERT INTO notifications
        (
            user_id,
            application_id,
            opportunity_id,
            notification_type,
            title,
            message,
            is_read
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            0
        )
    ";


    $stmt =
        $conn->prepare($query);


    if (!$stmt) {

        return false;

    }


    $stmt->bind_param(
        "iiisss",
        $userId,
        $applicationId,
        $opportunityId,
        $notificationType,
        $title,
        $message
    );


    $success =
        $stmt->execute();


    $stmt->close();


    return $success;

}


/* =========================================================
   CREATE APPLICATION NOTIFICATIONS
   ========================================================= */

function syncApplicationNotifications(
    $conn,
    $userId
) {

    $query = "
        SELECT
            a.application_id,
            a.status,
            a.applied_at,
            a.updated_at,

            o.opportunity_id,
            o.title,
            o.role_name,

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


    $stmt =
        $conn->prepare($query);


    if (!$stmt) {

        return;

    }


    $stmt->bind_param(
        "i",
        $userId
    );


    $stmt->execute();


    $result =
        $stmt->get_result();


    while (
        $row =
        $result->fetch_assoc()
    ) {

        $applicationId =
            (int)$row["application_id"];


        $opportunityId =
            (int)$row["opportunity_id"];


        $status =
            strtolower(
                trim(
                    $row["status"] ?: "Applied"
                )
            );


        $company =
            $row["company_name"];


        /*
           FIXED:
           Proper PHP fallback instead of ||
        */

        $role =
            !empty($row["role_name"])
                ? $row["role_name"]
                : $row["title"];


        /* ---------------------------------------------
           APPLICATION SUBMITTED
        --------------------------------------------- */

        if (
            !notificationExistsForApplication(
                $conn,
                $userId,
                $applicationId,
                "application_applied"
            )
        ) {

            createNotification(

                $conn,

                $userId,

                $applicationId,

                $opportunityId,

                "application_applied",

                "Application submitted",

                "Your application for {$role} at {$company} was submitted successfully."

            );

        }


        /* ---------------------------------------------
           CURRENT STATUS NOTIFICATION
        --------------------------------------------- */

        $statusData = null;


        if (
            $status === "shortlisted"
        ) {

            $statusData = [

                "type" =>
                    "application_shortlisted",

                "title" =>
                    "You've been shortlisted",

                "message" =>
                    "Great news! {$company} has shortlisted your application for {$role}."

            ];

        }


        elseif (
            $status === "interview"
        ) {

            $statusData = [

                "type" =>
                    "application_interview",

                "title" =>
                    "Interview stage reached",

                "message" =>
                    "Your application for {$role} at {$company} has moved to the interview stage."

            ];

        }


        elseif (
            $status === "selected"
        ) {

            $statusData = [

                "type" =>
                    "application_selected",

                "title" =>
                    "Congratulations! You've been selected",

                "message" =>
                    "You have been selected by {$company} for {$role}. Congratulations!"

            ];

        }


        elseif (
            $status === "rejected"
        ) {

            $statusData = [

                "type" =>
                    "application_rejected",

                "title" =>
                    "Application status updated",

                "message" =>
                    "Your application for {$role} at {$company} has been marked as rejected."

            ];

        }


        if (
            $statusData !== null
        ) {

            if (
                !notificationExistsForApplication(
                    $conn,
                    $userId,
                    $applicationId,
                    $statusData["type"]
                )
            ) {

                createNotification(

                    $conn,

                    $userId,

                    $applicationId,

                    $opportunityId,

                    $statusData["type"],

                    $statusData["title"],

                    $statusData["message"]

                );

            }

        }

    }


    $stmt->close();

}


/* =========================================================
   CREATE OPPORTUNITY NOTIFICATIONS
   ========================================================= */

function syncOpportunityNotifications(
    $conn,
    $userId
) {

    $query = "
        SELECT
            o.opportunity_id,
            o.title,
            o.role_name,
            o.location,
            o.work_mode,
            o.created_at,

            c.company_name

        FROM opportunities o

        INNER JOIN companies c
            ON c.company_id = o.company_id

        WHERE o.status = 'Active'

          AND o.created_at >=
              DATE_SUB(
                  NOW(),
                  INTERVAL 30 DAY
              )

        ORDER BY
            o.created_at DESC
    ";


    $result =
        $conn->query($query);


    if (!$result) {

        return;

    }


    while (
        $row =
        $result->fetch_assoc()
    ) {

        $opportunityId =
            (int)$row["opportunity_id"];


        if (
            notificationExistsForOpportunity(
                $conn,
                $userId,
                $opportunityId
            )
        ) {

            continue;

        }


        /*
           FIXED:
           Proper PHP fallback instead of ||
        */

        $role =
            !empty($row["role_name"])
                ? $row["role_name"]
                : $row["title"];


        $company =
            $row["company_name"];


        $message =
            "{$row["title"]} is now available at {$company}. Check the opportunity to see how well your profile matches.";


        createNotification(

            $conn,

            $userId,

            null,

            $opportunityId,

            "opportunity",

            "New opportunity available",

            $message

        );

    }

}


/* =========================================================
   SYNC DATABASE NOTIFICATIONS
   ========================================================= */

function syncNotifications(
    $conn,
    $userId
) {

    syncApplicationNotifications(
        $conn,
        $userId
    );


    syncOpportunityNotifications(
        $conn,
        $userId
    );

}


/* =========================================================
   GET NOTIFICATIONS
   ========================================================= */

function getNotifications(
    $conn,
    $userId
) {

    /*
       Automatically create missing notifications
       before returning the latest database data.
    */

    syncNotifications(
        $conn,
        $userId
    );


    $query = "
        SELECT
            n.notification_id,
            n.user_id,
            n.application_id,
            n.opportunity_id,
            n.notification_type,
            n.title,
            n.message,
            n.is_read,
            n.created_at,

            o.title AS opportunity_title,
            o.role_name,

            c.company_name

        FROM notifications n

        LEFT JOIN opportunities o
            ON o.opportunity_id = n.opportunity_id

        LEFT JOIN companies c
            ON c.company_id = o.company_id

        WHERE n.user_id = ?

        ORDER BY
            n.created_at DESC,
            n.notification_id DESC
    ";


    $stmt =
        $conn->prepare($query);


    if (!$stmt) {

        http_response_code(500);

        sendResponse(
            false,
            "Failed to load notifications."
        );

    }


    $stmt->bind_param(
        "i",
        $userId
    );


    $stmt->execute();


    $result =
        $stmt->get_result();


    $notifications = [];


    while (
        $row =
        $result->fetch_assoc()
    ) {

        $type =
            $row["notification_type"];


        /*
           Category
        */

        $category =
            str_starts_with(
                $type,
                "application_"
            )
                ? "application"
                : "opportunity";


        /*
           Icon type
        */

        $iconType =
            "application";


        if (
            $type ===
            "application_shortlisted"
        ) {

            $iconType =
                "shortlisted";

        }

        elseif (
            $type ===
            "application_interview"
        ) {

            $iconType =
                "interview";

        }

        elseif (
            $type ===
            "application_selected"
        ) {

            $iconType =
                "selected";

        }

        elseif (
            $type ===
            "application_rejected"
        ) {

            $iconType =
                "rejected";

        }

        elseif (
            $type ===
            "opportunity"
        ) {

            $iconType =
                "opportunity";

        }


        /*
           Display status
        */

        $status = null;


        if (
            $type ===
            "application_applied"
        ) {

            $status =
                "Applied";

        }

        elseif (
            $type ===
            "application_shortlisted"
        ) {

            $status =
                "Shortlisted";

        }

        elseif (
            $type ===
            "application_interview"
        ) {

            $status =
                "Interview";

        }

        elseif (
            $type ===
            "application_selected"
        ) {

            $status =
                "Selected";

        }

        elseif (
            $type ===
            "application_rejected"
        ) {

            $status =
                "Rejected";

        }

        elseif (
            $type ===
            "opportunity"
        ) {

            $status =
                "New";

        }


        $notifications[] = [

            "id" =>
                (int)$row["notification_id"],

            "notificationId" =>
                (int)$row["notification_id"],

            "applicationId" =>
                $row["application_id"] !== null
                    ? (int)$row["application_id"]
                    : null,

            "opportunityId" =>
                $row["opportunity_id"] !== null
                    ? (int)$row["opportunity_id"]
                    : null,

            "type" =>
                $category,

            "category" =>
                $category,

            "iconType" =>
                $iconType,

            "title" =>
                $row["title"],

            "message" =>
                $row["message"],

            "opportunityTitle" =>
                $row["opportunity_title"] ??
                "Opportunity",

            "company" =>
                $row["company_name"] ??
                "",

            "role" =>
                $row["role_name"] ??
                "",

            "status" =>
                $status,

            "createdAt" =>
                $row["created_at"],

            "read" =>
                ((int)$row["is_read"] === 1)

        ];

    }


    $stmt->close();


    /* =====================================================
       SUMMARY
       ===================================================== */

    $total =
        count($notifications);


    $unread =
        0;


    $applications =
        0;


    $opportunities =
        0;


    foreach (
        $notifications as
        $notification
    ) {

        if (
            !$notification["read"]
        ) {

            $unread++;

        }


        if (
            $notification["category"] ===
            "application"
        ) {

            $applications++;

        }


        if (
            $notification["category"] ===
            "opportunity"
        ) {

            $opportunities++;

        }

    }


    return [

        "notifications" =>
            $notifications,

        "summary" => [

            "total" =>
                $total,

            "unread" =>
                $unread,

            "applications" =>
                $applications,

            "opportunities" =>
                $opportunities

        ]

    ];

}


/* =========================================================
   GET REQUEST
   ========================================================= */

if (
    $_SERVER["REQUEST_METHOD"] ===
    "GET"
) {

    $data =
        getNotifications(
            $conn,
            $userId
        );


    sendResponse(
        true,
        "Notifications loaded successfully.",
        $data
    );

}


/* =========================================================
   POST REQUEST
   ========================================================= */

if (
    $_SERVER["REQUEST_METHOD"] ===
    "POST"
) {

    $raw =
        file_get_contents(
            "php://input"
        );


    $payload =
        json_decode(
            $raw,
            true
        );


    if (
        !is_array(
            $payload
        )
    ) {

        http_response_code(400);

        sendResponse(
            false,
            "Invalid request data."
        );

    }


    $action =
        $payload["action"] ?? "";


    /* ---------------------------------------------
       MARK ONE NOTIFICATION READ / UNREAD
    --------------------------------------------- */

    if (
        $action ===
        "set_read"
    ) {

        $notificationId =
            (int)(
                $payload["notificationId"] ??
                0
            );


        $read =
            !empty(
                $payload["read"]
            )
                ? 1
                : 0;


        if (
            $notificationId <= 0
        ) {

            http_response_code(400);

            sendResponse(
                false,
                "Invalid notification ID."
            );

        }


        $query = "
            UPDATE notifications
            SET is_read = ?
            WHERE notification_id = ?
              AND user_id = ?
        ";


        $stmt =
            $conn->prepare($query);


        if (!$stmt) {

            http_response_code(500);

            sendResponse(
                false,
                "Failed to update notification."
            );

        }


        $stmt->bind_param(
            "iii",
            $read,
            $notificationId,
            $userId
        );


        $stmt->execute();


        $stmt->close();


        sendResponse(
            true,
            "Notification updated successfully."
        );

    }


    /* ---------------------------------------------
       MARK ALL READ
    --------------------------------------------- */

    if (
        $action ===
        "mark_all_read"
    ) {

        $query = "
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = ?
              AND is_read = 0
        ";


        $stmt =
            $conn->prepare($query);


        if (!$stmt) {

            http_response_code(500);

            sendResponse(
                false,
                "Failed to mark notifications as read."
            );

        }


        $stmt->bind_param(
            "i",
            $userId
        );


        $stmt->execute();


        $stmt->close();


        sendResponse(
            true,
            "All notifications marked as read."
        );

    }


    http_response_code(400);

    sendResponse(
        false,
        "Unknown notification action."
    );

}


/* =========================================================
   INVALID METHOD
   ========================================================= */

http_response_code(405);

sendResponse(
    false,
    "Unsupported request method."
);

?>