// =========================================================
// CAMPUSHIRE - MY APPLICATIONS
// MYSQL CONNECTED VERSION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =================================================
        // ELEMENTS
        // =================================================

        const totalApplications =
            document.getElementById(
                "totalApplications"
            );

        const reviewApplications =
            document.getElementById(
                "reviewApplications"
            );

        const selectedApplications =
            document.getElementById(
                "selectedApplications"
            );

        const interviewApplications =
            document.getElementById(
                "interviewApplications"
            );

        const applicationCount =
            document.getElementById(
                "applicationCount"
            );

        const statusFilter =
            document.getElementById(
                "statusFilter"
            );

        const sortFilter =
            document.getElementById(
                "sortFilter"
            );

        const applicationsList =
            document.getElementById(
                "applicationsList"
            );

        const emptyState =
            document.getElementById(
                "emptyState"
            );

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        // =================================================
        // DATA
        // =================================================

        let applications = [];

        let filteredApplications = [];


        // =================================================
        // TEXT HELPER
        // =================================================

        function setText(
            element,
            value
        ) {

            if (element) {

                element.textContent =
                    value;

            }

        }


        // =================================================
        // HTML ESCAPE
        // =================================================

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
        // DATE FORMAT
        // =================================================

        function formatDate(
            value
        ) {

            if (!value) {

                return "Date unavailable";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "Date unavailable";

            }


            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        }


        // =================================================
        // DATE + TIME
        // =================================================

        function formatDateTime(
            value
        ) {

            if (!value) {

                return "Date unavailable";

            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "Date unavailable";

            }


            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ) +
            " • " +
            date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        }


        // =================================================
        // STATUS NORMALIZER
        // =================================================

        function normalizeStatus(
            status
        ) {

            const value =
                String(
                    status ||
                    "Applied"
                )
                    .trim()
                    .toLowerCase();


            if (
                value ===
                "shortlisted"
            ) {

                return "Shortlisted";

            }


            if (
                value ===
                "interview"
            ) {

                return "Interview";

            }


            if (
                value ===
                "selected"
            ) {

                return "Selected";

            }


            if (
                value ===
                "rejected"
            ) {

                return "Rejected";

            }


            return "Applied";

        }


        // =================================================
        // STATUS PRIORITY
        // =================================================

        function statusPriority(
            status
        ) {

            const priorities = {

                Applied: 1,

                Shortlisted: 2,

                Interview: 3,

                Selected: 4,

                Rejected: 5

            };


            return (
                priorities[
                    normalizeStatus(status)
                ] || 1
            );

        }


        // =================================================
        // LOAD APPLICATIONS FROM MYSQL
        // =================================================

        async function loadApplications() {

            try {

                showLoading();


                const response =
                    await fetch(
                        "../php/student/applications.php",
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
                        "Unable to load applications."
                    );

                }


                applications =
                    Array.isArray(
                        data.applications
                    )
                        ? data.applications
                        : [];


                updateSummary(
                    data.summary
                );


                applyFilters();


                console.log(
                    "CampusHire My Applications loaded from MySQL.",
                    data
                );

            }

            catch (error) {

                console.error(
                    "Applications error:",
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
                totalApplications,
                summary.totalApplications
            );


            setText(
                reviewApplications,
                summary.underReview
            );


            setText(
                selectedApplications,
                summary.selected
            );


            setText(
                interviewApplications,
                summary.interviews
            );

        }


        // =================================================
        // FILTER + SORT
        // =================================================

        function applyFilters() {

            let result =
                [...applications];


            // ---------------------------------------------
            // STATUS FILTER
            // ---------------------------------------------

            const selectedStatus =
                statusFilter
                    ? statusFilter.value
                    : "";


            if (selectedStatus) {

                result =
                    result.filter(
                        function (
                            application
                        ) {

                            return (
                                normalizeStatus(
                                    application.status
                                ) ===
                                selectedStatus
                            );

                        }
                    );

            }


            // ---------------------------------------------
            // SORT
            // ---------------------------------------------

            const sortValue =
                sortFilter
                    ? sortFilter.value
                    : "newest";


            if (
                sortValue ===
                "newest"
            ) {

                result.sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            getDateValue(b) -
                            getDateValue(a)
                        );

                    }
                );

            }


            else if (
                sortValue ===
                "oldest"
            ) {

                result.sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            getDateValue(a) -
                            getDateValue(b)
                        );

                    }
                );

            }


            else if (
                sortValue ===
                "status"
            ) {

                result.sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            statusPriority(
                                a.status
                            ) -
                            statusPriority(
                                b.status
                            )
                        );

                    }
                );

            }


            filteredApplications =
                result;


            renderApplications();

        }


        // =================================================
        // DATE VALUE
        // =================================================

        function getDateValue(
            application
        ) {

            const value =
                application.updatedAt ||
                application.appliedAt ||
                0;


            const time =
                new Date(
                    value
                ).getTime();


            return Number.isFinite(time)
                ? time
                : 0;

        }


        // =================================================
        // RENDER APPLICATIONS
        // =================================================

        function renderApplications() {

            if (!applicationsList) {

                return;

            }


            applicationsList.innerHTML =
                "";


            setText(
                applicationCount,
                filteredApplications.length +
                (
                    filteredApplications.length === 1
                        ? " application"
                        : " applications"
                )
            );


            if (
                filteredApplications.length ===
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


            filteredApplications.forEach(
                function (
                    application
                ) {

                    applicationsList.appendChild(
                        createApplicationCard(
                            application
                        )
                    );

                }
            );

        }


        // =================================================
        // CREATE APPLICATION CARD
        // =================================================

        function createApplicationCard(
            application
        ) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "application-card";


            const status =
                normalizeStatus(
                    application.status
                );


            const initial =
                (
                    application.company ||
                    "C"
                )
                    .charAt(0)
                    .toUpperCase();


            const match =
                Number(
                    application.matchPercentage ||
                    0
                );


            const timeline =
                Array.isArray(
                    application.timeline
                )
                    ? application.timeline
                    : [];


            const companyName =
                application.company ||
                "Company";


            const title =
                application.title ||
                "Opportunity";


            const role =
                application.role ||
                "";


            const location =
                application.location ||
                "Not specified";


            const workMode =
                application.workMode ||
                "Not specified";


            const packageAmount =
                application.package ||
                "Not specified";


            const type =
                application.type ||
                "Internship";


            card.innerHTML = `

                <div class="application-top">

                    <div class="company-logo">

                        ${escapeHtml(initial)}

                    </div>


                    <div class="application-heading">

                        <h3>

                            ${escapeHtml(title)}

                        </h3>

                        <p>

                            ${escapeHtml(companyName)}

                        </p>

                    </div>


                    <div class="match-badge">

                        ${match}% Match

                    </div>

                </div>



                <div class="application-meta">

                    <span>

                        📍
                        ${escapeHtml(location)}

                    </span>


                    <span>

                        💼
                        ${escapeHtml(workMode)}

                    </span>


                    <span>

                        💰
                        ${escapeHtml(packageAmount)}

                    </span>


                    <span>

                        🏢
                        ${escapeHtml(type)}

                    </span>

                </div>



                <div class="application-status-row">

                    <span class="status-label">

                        Current Status

                    </span>


                    <span class="status-badge status-${status.toLowerCase()}">

                        ${escapeHtml(status)}

                    </span>

                </div>



                <div class="application-role">

                    <strong>

                        ${escapeHtml(role)}

                    </strong>

                </div>



                <div class="application-applied">

                    Applied:
                    ${escapeHtml(
                        formatDateTime(
                            application.appliedAt
                        )
                    )}

                </div>



                ${
                    application.description
                        ? `
                            <div class="application-description">

                                ${escapeHtml(
                                    application.description
                                )}

                            </div>
                        `
                        : ""
                }



                <div class="timeline-section">

                    <div class="timeline-title">

                        APPLICATION JOURNEY

                    </div>


                    <div class="timeline">

                        ${createTimeline(
                            timeline,
                            status
                        )}

                    </div>

                </div>

            `;


            return card;

        }


        // =================================================
        // TIMELINE
        // =================================================

        function createTimeline(
            timeline,
            currentStatus
        ) {

            const items =
                Array.isArray(timeline)
                    ? timeline
                    : [];


            if (
                items.length ===
                0
            ) {

                return `

                    <div class="timeline-item completed">

                        <div class="timeline-dot">

                            ✓

                        </div>

                        <div>

                            <strong>
                                Applied
                            </strong>

                            <p>
                                Application submitted successfully.
                            </p>

                        </div>

                    </div>

                `;

            }


            return items.map(
                function (
                    item,
                    index
                ) {

                    const itemStatus =
                        normalizeStatus(
                            item.status
                        );


                    const isCompleted =
                        item.completed === true;


                    let icon =
                        isCompleted
                            ? "✓"
                            : index + 1;


                    if (
                        itemStatus ===
                        "Shortlisted"
                    ) {

                        icon = "✓";

                    }


                    if (
                        itemStatus ===
                        "Interview"
                    ) {

                        icon = "✓";

                    }


                    if (
                        itemStatus ===
                        "Selected"
                    ) {

                        icon = "✓";

                    }


                    if (
                        itemStatus ===
                        "Rejected"
                    ) {

                        icon = "×";

                    }


                    let description =
                        "Application status updated.";


                    if (
                        itemStatus ===
                        "Applied"
                    ) {

                        description =
                            "Your application was submitted to the company.";

                    }


                    if (
                        itemStatus ===
                        "Shortlisted"
                    ) {

                        description =
                            "The recruiter shortlisted your application.";

                    }


                    if (
                        itemStatus ===
                        "Interview"
                    ) {

                        description =
                            "You have moved to the interview stage.";

                    }


                    if (
                        itemStatus ===
                        "Selected"
                    ) {

                        description =
                            "Congratulations! You were selected.";

                    }


                    if (
                        itemStatus ===
                        "Rejected"
                    ) {

                        description =
                            "The application was not selected for the next stage.";

                    }


                    return `

                        <div class="timeline-item ${isCompleted ? "completed" : ""}">

                            <div class="timeline-dot">

                                ${icon}

                            </div>


                            <div>

                                <strong>

                                    ${escapeHtml(
                                        itemStatus
                                    )}

                                </strong>


                                <p>

                                    ${escapeHtml(
                                        description
                                    )}

                                    ${
                                        item.date
                                            ? `
                                                <br>
                                                <small>
                                                    ${escapeHtml(
                                                        formatDateTime(
                                                            item.date
                                                        )
                                                    )}
                                                </small>
                                            `
                                            : ""
                                    }

                                </p>

                            </div>

                        </div>

                    `;

                }
            ).join("");

        }


        // =================================================
        // LOADING
        // =================================================

        function showLoading() {

            if (!applicationsList) {

                return;

            }


            applicationsList.innerHTML = `

                <div class="loading-state">

                    <div class="loading-icon">

                        ⏳

                    </div>

                    <h3>

                        Loading applications...

                    </h3>

                    <p>

                        Fetching your latest recruitment status.

                    </p>

                </div>

            `;


            if (emptyState) {

                emptyState.style.display =
                    "none";

            }

        }


        // =================================================
        // ERROR
        // =================================================

        function showError(
            message
        ) {

            setText(
                totalApplications,
                "—"
            );


            setText(
                reviewApplications,
                "—"
            );


            setText(
                selectedApplications,
                "—"
            );


            setText(
                interviewApplications,
                "—"
            );


            setText(
                applicationCount,
                "Unable to load"
            );


            if (applicationsList) {

                applicationsList.innerHTML = `

                    <div class="loading-state">

                        <div class="loading-icon">

                            ⚠️

                        </div>


                        <h3>

                            Unable to load applications

                        </h3>


                        <p>

                            ${escapeHtml(
                                message ||
                                "Please try again."
                            )}

                        </p>


                        <button
                            type="button"
                            id="retryApplications"
                        >

                            Try Again

                        </button>

                    </div>

                `;


                const retryButton =
                    document.getElementById(
                        "retryApplications"
                    );


                if (retryButton) {

                    retryButton.addEventListener(
                        "click",
                        function () {

                            loadApplications();

                        }
                    );

                }

            }

        }


        // =================================================
        // FILTER EVENTS
        // =================================================

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                function () {

                    applyFilters();

                }
            );

        }


        if (sortFilter) {

            sortFilter.addEventListener(
                "change",
                function () {

                    applyFilters();

                }
            );

        }


        // =================================================
        // LOGOUT
        // =================================================

        if (logoutButton) {

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


                    localStorage.removeItem(
                        "campusHireBasicProfile"
                    );


                    window.location.href =
                        "student-login.html";

                }
            );

        }


        // =================================================
        // FIRST LOAD
        // =================================================

        loadApplications();

    }
);