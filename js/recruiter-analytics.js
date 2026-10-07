// =========================================================
// CAMPUSHIRE - RECRUITER ANALYTICS
// MYSQL CONNECTED VERSION
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =================================================
        // ELEMENT HELPERS
        // =================================================

        function getElement(id) {

            return document.getElementById(id);

        }


        function setText(
            id,
            value
        ) {

            const element =
                getElement(id);

            if (element) {

                element.textContent =
                    value;

            }

        }


        function escapeHtml(value) {

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
        // UI ELEMENTS
        // =================================================

        const refreshButton =
            getElement(
                "refreshButton"
            );


        const logoutButton =
            getElement(
                "logoutButton"
            );


        const dashboardButton =
            getElement(
                "dashboardButton"
            );


        const dashboardNav =
            getElement(
                "dashboardNav"
            );


        const sidebarCompanyName =
            getElement(
                "sidebarCompanyName"
            );


        const sidebarCompanyAvatar =
            getElement(
                "sidebarCompanyAvatar"
            );


        const opportunityTableBody =
            getElement(
                "opportunityTableBody"
            );


        const emptyOpportunityTable =
            getElement(
                "emptyOpportunityTable"
            );


        const opportunityRecordCount =
            getElement(
                "opportunityRecordCount"
            );


        const activityList =
            getElement(
                "activityList"
            );


        const emptyActivity =
            getElement(
                "emptyActivity"
            );


        // =================================================
        // DATE FORMATTER
        // =================================================

        function formatDate(value) {

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
        // STATUS NORMALIZER
        // =================================================

        function normalizeStatus(status) {

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
        // PROGRESS BAR
        // =================================================

        function setProgress(
            id,
            value,
            total
        ) {

            const element =
                getElement(id);

            if (!element) {

                return;

            }


            const percentage =
                total > 0
                    ? (
                        value /
                        total
                    ) * 100
                    : 0;


            element.style.width =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                ) + "%";

        }


        // =================================================
        // LOAD ANALYTICS FROM MYSQL
        // =================================================

        async function loadAnalytics() {

            try {

                setLoadingState(
                    true
                );


                const response =
                    await fetch(
                        "../php/recruiter/analytics.php",
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
                        "Unable to load analytics."
                    );

                }


                renderCompany(
                    data.recruiter
                );


                updateSummary(
                    data.summary
                );


                updatePipeline(
                    data.pipeline
                );


                updateInsights(
                    data.insights,
                    data.summary
                );


                updateOpportunityTable(
                    data.opportunities || []
                );


                updateActivity(
                    data.recentActivity || []
                );


                console.log(
                    "CampusHire Analytics loaded from MySQL.",
                    data
                );

            }

            catch (error) {

                console.error(
                    "Analytics load error:",
                    error
                );


                showAnalyticsError(
                    error.message
                );

            }

            finally {

                setLoadingState(
                    false
                );

            }

        }


        // =================================================
        // LOADING STATE
        // =================================================

        function setLoadingState(
            loading
        ) {

            if (!refreshButton) {

                return;

            }


            if (loading) {

                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    "↻ Loading...";

            } else {

                refreshButton.disabled =
                    false;

                refreshButton.textContent =
                    "↻ Refresh";

            }

        }


        // =================================================
        // COMPANY
        // =================================================

        function renderCompany(
            recruiter
        ) {

            if (!recruiter) {

                return;

            }


            const companyName =
                recruiter.companyName ||
                "CampusHire";


            if (sidebarCompanyName) {

                sidebarCompanyName.textContent =
                    companyName;

            }


            if (sidebarCompanyAvatar) {

                sidebarCompanyAvatar.textContent =
                    companyName
                        .charAt(0)
                        .toUpperCase();

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
                "activeOpportunities",
                summary.activeOpportunities
            );


            setText(
                "totalApplications",
                summary.totalApplications
            );


            setText(
                "underReview",
                summary.underReview
            );


            setText(
                "selectedApplications",
                summary.selected
            );


            setText(
                "selectionRate",
                summary.selectionRate + "%"
            );


            setText(
                "averageMatch",
                summary.averageMatch + "%"
            );


            setText(
                "interviewRate",
                summary.interviewRate + "%"
            );


            setText(
                "shortlistRate",
                summary.shortlistRate + "%"
            );

        }


        // =================================================
        // PIPELINE
        // =================================================

        function updatePipeline(
            pipeline
        ) {

            if (!pipeline) {

                return;

            }


            setText(
                "pipelineApplied",
                pipeline.applied
            );


            setText(
                "pipelineShortlisted",
                pipeline.shortlisted
            );


            setText(
                "pipelineInterview",
                pipeline.interview
            );


            setText(
                "pipelineSelected",
                pipeline.selected
            );


            setText(
                "pipelineRejected",
                pipeline.rejected
            );


            const totalApplications =
                pipeline.applied +
                pipeline.shortlisted +
                pipeline.interview +
                pipeline.selected +
                pipeline.rejected;


            const maxValue =
                Math.max(
                    totalApplications,
                    1
                );


            setProgress(
                "barApplied",
                pipeline.applied,
                maxValue
            );


            setProgress(
                "barShortlisted",
                pipeline.shortlisted,
                maxValue
            );


            setProgress(
                "barInterview",
                pipeline.interview,
                maxValue
            );


            setProgress(
                "barSelected",
                pipeline.selected,
                maxValue
            );


            setProgress(
                "barRejected",
                pipeline.rejected,
                maxValue
            );

        }


        // =================================================
        // INSIGHTS
        // =================================================

        function updateInsights(
            insights,
            summary
        ) {

            if (!insights) {

                return;

            }


            // ---------------------------------------------
            // TOP ROLE
            // ---------------------------------------------

            if (insights.topRole) {

                setText(
                    "topRole",
                    insights.topRole.roleName
                );


                const applications =
                    insights.topRole.applications;


                const selected =
                    insights.topRole.selected;


                setText(
                    "topRoleDescription",
                    applications +
                    (
                        applications === 1
                            ? " application"
                            : " applications"
                    ) +
                    " • " +
                    selected +
                    (
                        selected === 1
                            ? " selected"
                            : " selected"
                    )
                );

            } else {

                setText(
                    "topRole",
                    "—"
                );


                setText(
                    "topRoleDescription",
                    "Recruitment data will appear here."
                );

            }


            // ---------------------------------------------
            // BEST MATCH
            // ---------------------------------------------

            if (insights.bestMatch) {

                setText(
                    "bestMatch",
                    insights.bestMatch.studentName
                );


                setText(
                    "bestMatchDescription",
                    insights.bestMatch.matchPercentage +
                    "% match for " +
                    (
                        insights.bestMatch.roleName ||
                        insights.bestMatch.title ||
                        "the opportunity"
                    )
                );

            } else {

                setText(
                    "bestMatch",
                    "—"
                );


                setText(
                    "bestMatchDescription",
                    "No candidate data available."
                );

            }


            // ---------------------------------------------
            // HIRING STATUS
            // ---------------------------------------------

            const selected =
                Number(
                    summary?.selected || 0
                );


            const interview =
                Number(
                    summary?.interview || 0
                );


            const shortlisted =
                Number(
                    summary?.shortlisted || 0
                );


            const totalApplications =
                Number(
                    summary?.totalApplications || 0
                );


            if (selected > 0) {

                setText(
                    "hiringStatus",
                    "Hiring is progressing"
                );


                setText(
                    "hiringStatusDescription",
                    selected +
                    (
                        selected === 1
                            ? " candidate"
                            : " candidates"
                    ) +
                    " selected so far."
                );

            }

            else if (interview > 0) {

                setText(
                    "hiringStatus",
                    "Interview stage active"
                );


                setText(
                    "hiringStatusDescription",
                    interview +
                    (
                        interview === 1
                            ? " candidate"
                            : " candidates"
                    ) +
                    " currently in interview."
                );

            }

            else if (shortlisted > 0) {

                setText(
                    "hiringStatus",
                    "Shortlisting in progress"
                );


                setText(
                    "hiringStatusDescription",
                    shortlisted +
                    (
                        shortlisted === 1
                            ? " candidate"
                            : " candidates"
                    ) +
                    " currently shortlisted."
                );

            }

            else if (
                totalApplications > 0
            ) {

                setText(
                    "hiringStatus",
                    "Application review stage"
                );


                setText(
                    "hiringStatusDescription",
                    "Review applications and shortlist strong matches."
                );

            }

            else {

                setText(
                    "hiringStatus",
                    "Building pipeline"
                );


                setText(
                    "hiringStatusDescription",
                    "Start reviewing applications to improve recruitment progress."
                );

            }

        }


        // =================================================
        // OPPORTUNITY TABLE
        // =================================================

        function updateOpportunityTable(
            opportunities
        ) {

            if (!opportunityTableBody) {

                return;

            }


            opportunityTableBody.innerHTML =
                "";


            const records =
                Array.isArray(opportunities)
                    ? opportunities
                    : [];


            setText(
                "opportunityRecordCount",
                records.length +
                (
                    records.length === 1
                        ? " role"
                        : " roles"
                )
            );


            if (
                records.length === 0
            ) {

                if (emptyOpportunityTable) {

                    emptyOpportunityTable.style.display =
                        "block";

                }

                return;

            }


            if (emptyOpportunityTable) {

                emptyOpportunityTable.style.display =
                    "none";

            }


            records.forEach(
                function (record) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>

                            <div class="opportunity-name">

                                ${escapeHtml(
                                    record.title ||
                                    "Opportunity"
                                )}

                            </div>

                            <div class="opportunity-company">

                                ${escapeHtml(
                                    record.companyName ||
                                    "Company"
                                )}

                            </div>

                        </td>


                        <td>

                            ${Number(
                                record.applications || 0
                            )}

                        </td>


                        <td>

                            <span class="badge green">

                                ${Number(
                                    record.averageMatch || 0
                                )}%

                            </span>

                        </td>


                        <td>

                            <span class="badge purple">

                                ${Number(
                                    record.shortlisted || 0
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="badge orange">

                                ${Number(
                                    record.interview || 0
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="badge green">

                                ${Number(
                                    record.selected || 0
                                )}

                            </span>

                        </td>

                    `;


                    opportunityTableBody.appendChild(
                        row
                    );

                }
            );

        }


        // =================================================
        // RECENT ACTIVITY
        // =================================================

        function updateActivity(
            activities
        ) {

            if (!activityList) {

                return;

            }


            activityList.innerHTML =
                "";


            const records =
                Array.isArray(activities)
                    ? activities
                    : [];


            if (
                records.length === 0
            ) {

                if (emptyActivity) {

                    emptyActivity.style.display =
                        "block";

                }

                return;

            }


            if (emptyActivity) {

                emptyActivity.style.display =
                    "none";

            }


            records.forEach(
                function (activity) {

                    const status =
                        normalizeStatus(
                            activity.status
                        );


                    let icon =
                        "📋";


                    if (
                        status ===
                        "Shortlisted"
                    ) {

                        icon =
                            "🎯";

                    }


                    if (
                        status ===
                        "Interview"
                    ) {

                        icon =
                            "🕒";

                    }


                    if (
                        status ===
                        "Selected"
                    ) {

                        icon =
                            "✅";

                    }


                    if (
                        status ===
                        "Rejected"
                    ) {

                        icon =
                            "❌";

                    }


                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "activity-item";


                    item.innerHTML = `

                        <div class="activity-icon">

                            ${icon}

                        </div>


                        <div class="activity-text">

                            <strong>

                                ${escapeHtml(
                                    activity.studentName ||
                                    "Candidate"
                                )}

                                — ${escapeHtml(
                                    status
                                )}

                            </strong>


                            <span>

                                ${escapeHtml(
                                    activity.title ||
                                    activity.roleName ||
                                    "Opportunity"
                                )}

                            </span>

                        </div>


                        <div class="activity-date">

                            ${escapeHtml(
                                formatDate(
                                    activity.activityDate
                                )
                            )}

                        </div>

                    `;


                    activityList.appendChild(
                        item
                    );

                }
            );

        }


        // =================================================
        // ERROR DISPLAY
        // =================================================

        function showAnalyticsError(
            message
        ) {

            console.error(
                "Analytics Error:",
                message
            );


            setText(
                "activeOpportunities",
                "—"
            );


            setText(
                "totalApplications",
                "—"
            );


            setText(
                "underReview",
                "—"
            );


            setText(
                "selectedApplications",
                "—"
            );


            setText(
                "selectionRate",
                "—"
            );


            setText(
                "averageMatch",
                "—"
            );


            setText(
                "interviewRate",
                "—"
            );


            setText(
                "shortlistRate",
                "—"
            );


            setText(
                "topRole",
                "Unable to load"
            );


            setText(
                "topRoleDescription",
                message
            );


            setText(
                "bestMatch",
                "Unable to load"
            );


            setText(
                "bestMatchDescription",
                "Please refresh the page."
            );

        }


        // =================================================
        // REFRESH
        // =================================================

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                function () {

                    loadAnalytics();

                }
            );

        }


        // =================================================
        // DASHBOARD
        // =================================================

        if (dashboardButton) {

            dashboardButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "recruiter-dashboard.html";

                }
            );

        }


        if (dashboardNav) {

            dashboardNav.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "recruiter-dashboard.html";

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
                        "campusHireRecruiterSession"
                    );


                    sessionStorage.removeItem(
                        "campusHireRecruiterSession"
                    );


                    window.location.href =
                        "recruiter-login.html";

                }
            );

        }


        // =================================================
        // FIRST LOAD
        // =================================================

        loadAnalytics();

    }
);