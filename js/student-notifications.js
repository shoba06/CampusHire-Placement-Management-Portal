// =========================================================
// CAMPUSHIRE - STUDENT NOTIFICATIONS
// MYSQL CONNECTED VERSION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =================================================
        // ELEMENTS
        // =================================================

        const notificationsList =
            document.getElementById(
                "notificationsList"
            );


        const emptyState =
            document.getElementById(
                "emptyState"
            );


        const sidebarUnreadCount =
            document.getElementById(
                "sidebarUnreadCount"
            );


        const markAllReadButton =
            document.getElementById(
                "markAllReadButton"
            );


        const dashboardButton =
            document.getElementById(
                "dashboardButton"
            );


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        const filterButtons =
            document.querySelectorAll(
                ".filter-button"
            );


        // =================================================
        // STATE
        // =================================================

        let notifications = [];

        let currentFilter = "all";


        // =================================================
        // LOCAL PROFILE
        // Used only for sidebar display.
        // Notification data itself comes from MySQL.
        // =================================================

        function readLocalStorage(
            key,
            fallback
        ) {

            try {

                const raw =
                    localStorage.getItem(
                        key
                    );


                if (!raw) {

                    return fallback;

                }


                return JSON.parse(
                    raw
                );

            }

            catch (error) {

                console.error(
                    "Local profile read error:",
                    error
                );


                return fallback;

            }

        }


        const basicProfile =
            readLocalStorage(
                "campusHireBasicProfile",
                {}
            );


        const studentName =
            basicProfile.fullName ||
            basicProfile.studentName ||
            basicProfile.name ||
            "Student";


        const sidebarStudentName =
            document.getElementById(
                "sidebarStudentName"
            );


        const sidebarAvatar =
            document.getElementById(
                "sidebarAvatar"
            );


        if (sidebarStudentName) {

            sidebarStudentName.textContent =
                studentName;

        }


        if (sidebarAvatar) {

            sidebarAvatar.textContent =
                studentName
                    .charAt(0)
                    .toUpperCase();

        }


        // =================================================
        // HELPERS
        // =================================================

        function setText(
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    value;

            }

        }


        function escapeHtml(
            value
        ) {

            return String(
                value ?? ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        // =================================================
        // TIME FORMAT
        // =================================================

        function formatTimeAgo(
            value
        ) {

            if (!value) {

                return "Date unavailable";

            }


            const timestamp =
                new Date(
                    value
                ).getTime();


            if (
                Number.isNaN(
                    timestamp
                )
            ) {

                return "Date unavailable";

            }


            const difference =
                Date.now() -
                timestamp;


            const seconds =
                Math.floor(
                    difference / 1000
                );


            if (
                seconds < 60
            ) {

                return "Just now";

            }


            const minutes =
                Math.floor(
                    seconds / 60
                );


            if (
                minutes < 60
            ) {

                return (
                    minutes +
                    (
                        minutes === 1
                            ? " minute ago"
                            : " minutes ago"
                    )
                );

            }


            const hours =
                Math.floor(
                    minutes / 60
                );


            if (
                hours < 24
            ) {

                return (
                    hours +
                    (
                        hours === 1
                            ? " hour ago"
                            : " hours ago"
                    )
                );

            }


            const days =
                Math.floor(
                    hours / 24
                );


            if (
                days < 30
            ) {

                return (
                    days +
                    (
                        days === 1
                            ? " day ago"
                            : " days ago"
                    )
                );

            }


            return new Date(
                timestamp
            ).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        }


        // =================================================
        // ICON
        // =================================================

        function getIcon(
            iconType
        ) {

            switch (
                String(
                    iconType || ""
                ).toLowerCase()
            ) {

                case "shortlisted":

                    return "🎯";


                case "interview":

                    return "🕒";


                case "selected":

                    return "✅";


                case "rejected":

                    return "❌";


                case "opportunity":

                    return "💼";


                default:

                    return "📋";

            }

        }


        // =================================================
        // FETCH NOTIFICATIONS FROM MYSQL
        // =================================================

        async function loadNotifications() {

            try {

                showLoading();


                const response =
                    await fetch(
                        "../php/student/notifications.php",
                        {
                            method: "GET",
                            credentials: "include",
                            cache: "no-store"
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to load notifications."
                    );

                }


                notifications =
                    Array.isArray(
                        data.notifications
                    )
                        ? data.notifications
                        : [];


                updateSummary(
                    data.summary
                );


                renderNotifications();


                console.log(
                    "CampusHire notifications loaded from MySQL.",
                    data
                );

            }

            catch (error) {

                console.error(
                    "Notification loading error:",
                    error
                );


                showError(
                    error.message
                );

            }

        }


        // =================================================
        // SUMMARY
        // =================================================

        function updateSummary(
            summary
        ) {

            if (!summary) {

                return;

            }


            setText(
                "totalNotifications",
                summary.total
            );


            setText(
                "unreadNotifications",
                summary.unread
            );


            setText(
                "applicationNotifications",
                summary.applications
            );


            setText(
                "opportunityNotifications",
                summary.opportunities
            );


            if (sidebarUnreadCount) {

                sidebarUnreadCount.textContent =
                    summary.unread;


                sidebarUnreadCount.style.display =
                    summary.unread > 0
                        ? "flex"
                        : "none";

            }


            setText(
                "notificationCountLabel",
                summary.total +
                (
                    summary.total === 1
                        ? " notification"
                        : " notifications"
                )
            );

        }


        // =================================================
        // FILTER
        // =================================================

        function getFilteredNotifications() {

            return notifications.filter(
                function (
                    notification
                ) {

                    if (
                        currentFilter ===
                        "all"
                    ) {

                        return true;

                    }


                    if (
                        currentFilter ===
                        "unread"
                    ) {

                        return (
                            notification.read !==
                            true
                        );

                    }


                    if (
                        currentFilter ===
                        "application"
                    ) {

                        return (
                            notification.type ===
                            "application"
                        );

                    }


                    if (
                        currentFilter ===
                        "opportunity"
                    ) {

                        return (
                            notification.type ===
                            "opportunity"
                        );

                    }


                    return true;

                }
            );

        }


        // =================================================
        // RENDER
        // =================================================

        function renderNotifications() {

            if (!notificationsList) {

                return;

            }


            const filtered =
                getFilteredNotifications();


            notificationsList.innerHTML =
                "";


            if (
                filtered.length ===
                0
            ) {

                if (emptyState) {

                    emptyState.style.display =
                        "block";

                }


                return;

            }


            if (emptyState) {

                emptyState.style.display =
                    "none";

            }


            filtered.forEach(
                function (
                    notification
                ) {

                    const item =
                        document.createElement(
                            "article"
                        );


                    item.className =
                        "notification-item" +
                        (
                            notification.read !== true
                                ? " unread"
                                : ""
                        );


                    const iconType =
                        notification.iconType ||
                        notification.type ||
                        "application";


                    const icon =
                        getIcon(
                            iconType
                        );


                    const tag =
                        notification.status ||
                        (
                            notification.type ===
                            "opportunity"
                                ? "New"
                                : "Update"
                        );


                    item.innerHTML = `

                        <div
                            class="notification-icon ${escapeHtml(
                                iconType
                            )}"
                        >

                            ${icon}

                        </div>


                        ${
                            notification.read !== true
                                ? `
                                    <span
                                        class="unread-dot"
                                        title="Unread"
                                    ></span>
                                `
                                : ""
                        }


                        <div class="notification-content">

                            <div class="notification-top">

                                <strong
                                    class="notification-title"
                                >

                                    ${escapeHtml(
                                        notification.title
                                    )}

                                </strong>


                                <span
                                    class="notification-time"
                                >

                                    ${escapeHtml(
                                        formatTimeAgo(
                                            notification.createdAt
                                        )
                                    )}

                                </span>

                            </div>


                            <p
                                class="notification-message"
                            >

                                ${escapeHtml(
                                    notification.message
                                )}

                            </p>


                            <div
                                class="notification-meta"
                            >

                                <span
                                    class="notification-tag"
                                >

                                    ${escapeHtml(
                                        tag
                                    )}

                                </span>


                                ${
                                    notification.company
                                        ? `
                                            <span
                                                class="notification-tag"
                                            >

                                                ${escapeHtml(
                                                    notification.company
                                                )}

                                            </span>
                                        `
                                        : ""
                                }


                                ${
                                    notification.role
                                        ? `
                                            <span
                                                class="notification-tag"
                                            >

                                                ${escapeHtml(
                                                    notification.role
                                                )}

                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>


                        <div
                            class="notification-actions"
                        >

                            ${
                                notification.read !== true

                                    ? `

                                        <button
                                            type="button"
                                            class="notification-action"
                                            data-action="read"
                                            data-id="${escapeHtml(
                                                notification.id
                                            )}"
                                            title="Mark as read"
                                        >

                                            ✓

                                        </button>

                                    `

                                    : `

                                        <button
                                            type="button"
                                            class="notification-action"
                                            data-action="unread"
                                            data-id="${escapeHtml(
                                                notification.id
                                            )}"
                                            title="Mark as unread"
                                        >

                                            ●

                                        </button>

                                    `
                            }

                        </div>

                    `;


                    notificationsList.appendChild(
                        item
                    );

                }
            );

        }


        // =================================================
        // SET ONE READ / UNREAD IN MYSQL
        // =================================================

        async function updateReadState(
            notificationId,
            read
        ) {

            try {

                const response =
                    await fetch(
                        "../php/student/notifications.php",
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify(
                                {
                                    action:
                                        "set_read",

                                    notificationId:
                                        Number(
                                            notificationId
                                        ),

                                    read:
                                        Boolean(
                                            read
                                        )
                                }
                            )
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to update notification."
                    );

                }


                await loadNotifications();

            }

            catch (error) {

                console.error(
                    "Read state update error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to update notification."
                );

            }

        }


        // =================================================
        // MARK ALL READ IN MYSQL
        // =================================================

        async function markAllAsRead() {

            try {

                if (markAllReadButton) {

                    markAllReadButton.disabled =
                        true;

                    markAllReadButton.textContent =
                        "✓ Updating...";

                }


                const response =
                    await fetch(
                        "../php/student/notifications.php",
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify(
                                {
                                    action:
                                        "mark_all_read"
                                }
                            )
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to mark notifications as read."
                    );

                }


                await loadNotifications();

            }

            catch (error) {

                console.error(
                    "Mark-all-read error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to mark notifications as read."
                );

            }

            finally {

                if (markAllReadButton) {

                    markAllReadButton.disabled =
                        false;

                    markAllReadButton.textContent =
                        "✓ Mark All Read";

                }

            }

        }


        // =================================================
        // FILTER EVENTS
        // =================================================

        filterButtons.forEach(
            function (
                button
            ) {

                button.addEventListener(
                    "click",
                    function () {

                        filterButtons.forEach(
                            function (
                                filterButton
                            ) {

                                filterButton.classList.remove(
                                    "active"
                                );

                            }
                        );


                        button.classList.add(
                            "active"
                        );


                        currentFilter =
                            button.dataset.filter ||
                            "all";


                        renderNotifications();

                    }
                );

            }
        );


        // =================================================
        // NOTIFICATION ACTIONS
        // =================================================

        if (
            notificationsList
        ) {

            notificationsList.addEventListener(
                "click",
                function (
                    event
                ) {

                    const button =
                        event.target.closest(
                            "[data-action]"
                        );


                    if (!button) {

                        return;

                    }


                    const id =
                        button.dataset.id;


                    const action =
                        button.dataset.action;


                    if (!id) {

                        return;

                    }


                    if (
                        action ===
                        "read"
                    ) {

                        updateReadState(
                            id,
                            true
                        );

                    }


                    else if (
                        action ===
                        "unread"
                    ) {

                        updateReadState(
                            id,
                            false
                        );

                    }

                }
            );

        }


        // =================================================
        // MARK ALL READ BUTTON
        // =================================================

        if (
            markAllReadButton
        ) {

            markAllReadButton.addEventListener(
                "click",
                markAllAsRead
            );

        }


        // =================================================
        // DASHBOARD BUTTON
        // =================================================

        if (
            dashboardButton
        ) {

            dashboardButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "student-dashboard.html";

                }
            );

        }


        // =================================================
        // LOGOUT
        // =================================================

        if (
            logoutButton
        ) {

            logoutButton.addEventListener(
                "click",
                async function () {

                    try {

                        await fetch(
                            "../php/auth/logout.php",
                            {
                                method: "GET",
                                credentials: "include",
                                cache: "no-store"
                            }
                        );

                    }

                    catch (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                    }


                    localStorage.removeItem(
                        "campusHireStudentSession"
                    );


                    window.location.href =
                        "student-login.html";

                }
            );

        }


        // =================================================
        // LOADING STATE
        // =================================================

        function showLoading() {

            if (!notificationsList) {

                return;

            }


            notificationsList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">

                        ⏳

                    </div>


                    <h3>

                        Loading notifications...

                    </h3>


                    <p>

                        Fetching your latest CampusHire updates.

                    </p>

                </div>

            `;


            if (emptyState) {

                emptyState.style.display =
                    "none";

            }

        }


        // =================================================
        // ERROR STATE
        // =================================================

        function showError(
            message
        ) {

            setText(
                "totalNotifications",
                "—"
            );


            setText(
                "unreadNotifications",
                "—"
            );


            setText(
                "applicationNotifications",
                "—"
            );


            setText(
                "opportunityNotifications",
                "—"
            );


            setText(
                "notificationCountLabel",
                "Unable to load"
            );


            if (
                notificationsList
            ) {

                notificationsList.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">

                            ⚠️

                        </div>


                        <h3>

                            Unable to load notifications

                        </h3>


                        <p>

                            ${escapeHtml(
                                message ||
                                "Please try again."
                            )}

                        </p>


                        <button
                            type="button"
                            id="retryNotifications"
                            class="primary-button"
                        >

                            Try Again

                        </button>

                    </div>

                `;


                const retryButton =
                    document.getElementById(
                        "retryNotifications"
                    );


                if (retryButton) {

                    retryButton.addEventListener(
                        "click",
                        function () {

                            loadNotifications();

                        }
                    );

                }

            }

        }


        // =================================================
        // FIRST LOAD
        // =================================================

        loadNotifications();


        console.log(
            "CampusHire Student Notifications JS loaded successfully."
        );

    }

);