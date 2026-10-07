document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | CampusHire - Recruiter Candidate Matching
    | MySQL connected version
    |--------------------------------------------------------------------------
    */

    const CANDIDATES_API =
        "../php/recruiter/candidates.php";

    const STATUS_UPDATE_API =
        "../php/recruiter/update_application_status.php";


    let opportunities = [];
    let applications = [];

    let selectedOpportunityId = "";

    let filteredCandidates = [];


    /* =========================================================
       HELPERS
       ========================================================= */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function normalize(value) {

        return String(value ?? "")
            .trim()
            .toLowerCase();

    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;

        }

    }


    function formatDate(value) {

        if (!value) {

            return "Not available";

        }


        const date =
            new Date(
                String(value)
                    .replace(" ", "T")
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

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


    /* =========================================================
       DOM ELEMENTS
       ========================================================= */

    const sidebarCompany =
        document.getElementById(
            "sidebarCompany"
        );


    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    const dashboardBtn =
        document.getElementById(
            "dashboardBtn"
        );


    const opportunitySelect =
        document.getElementById(
            "opportunitySelect"
        );


    const totalCandidates =
        document.getElementById(
            "totalCandidates"
        );


    const shortlistedCandidates =
        document.getElementById(
            "shortlistedCandidates"
        );


    const interviewCandidates =
        document.getElementById(
            "interviewCandidates"
        );


    const selectedCandidates =
        document.getElementById(
            "selectedCandidates"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const sortFilter =
        document.getElementById(
            "sortFilter"
        );


    const candidateContainer =
        document.getElementById(
            "candidateContainer"
        );


    /* =========================================================
       LOAD DATA
       ========================================================= */

    async function loadCandidatesData() {

        try {

            if (candidateContainer) {

                candidateContainer.innerHTML = `

                    <div
                        style="
                            text-align:center;
                            padding:40px;
                            color:#64748b;
                        "
                    >
                        Loading candidates...
                    </div>

                `;

            }


            const response =
                await fetch(
                    CANDIDATES_API,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            console.log(
                "CampusHire Candidates API:",
                data
            );


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load candidates."
                );

            }


            opportunities =
                Array.isArray(
                    data.opportunities
                )
                    ? data.opportunities
                    : [];


            applications =
                Array.isArray(
                    data.applications
                )
                    ? data.applications
                    : [];


            populateCompany(
                opportunities
            );


            populateOpportunities(
                opportunities
            );


            /*
            -----------------------------------------------------
            | Automatically select first opportunity
            -----------------------------------------------------
            */

            if (
                opportunities.length > 0 &&
                !selectedOpportunityId
            ) {

                selectedOpportunityId =
                    String(
                        opportunities[0]
                            .opportunityId
                    );


                if (opportunitySelect) {

                    opportunitySelect.value =
                        selectedOpportunityId;

                }

            }


            applyFilters();


        } catch (error) {

            console.error(
                "Candidate loading error:",
                error
            );


            if (candidateContainer) {

                candidateContainer.innerHTML = `

                    <div
                        style="
                            text-align:center;
                            padding:50px;
                        "
                    >

                        <h3>
                            Unable to load candidates
                        </h3>

                        <p
                            style="
                                color:#64748b;
                            "
                        >
                            ${escapeHTML(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }

    }


    /* =========================================================
       COMPANY NAME
       ========================================================= */

    function populateCompany() {

        /*
        Company name is not directly returned by the
        candidates API, so keep the existing dashboard
        identity unless the page already has it.
        */

        if (
            sidebarCompany &&
            !sidebarCompany.textContent.trim()
        ) {

            sidebarCompany.textContent =
                "Recruiter";

        }

    }


    /* =========================================================
       OPPORTUNITY SELECT
       ========================================================= */

    function populateOpportunities(
        opportunityData
    ) {

        if (!opportunitySelect) {

            return;

        }


        opportunitySelect.innerHTML =
            "";


        opportunityData.forEach(
            function (opportunity) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(
                        opportunity.opportunityId
                    );


                option.textContent =
                    `${opportunity.title} — ${opportunity.location}`;


                opportunitySelect.appendChild(
                    option
                );

            }
        );


        if (
            selectedOpportunityId
        ) {

            opportunitySelect.value =
                selectedOpportunityId;

        }

    }


    /* =========================================================
       CURRENT OPPORTUNITY APPLICATIONS
       ========================================================= */

    function getCurrentApplications() {

        if (!selectedOpportunityId) {

            return [];

        }


        return applications.filter(
            function (application) {

                return (
                    String(
                        application.opportunityId
                    ) ===
                    String(
                        selectedOpportunityId
                    )
                );

            }
        );

    }


    /* =========================================================
       SUMMARY CARDS
       ========================================================= */

    function updateSummary(
        currentApplications
    ) {

        const total =
            currentApplications.length;


        let shortlisted =
            0;

        let interview =
            0;

        let selected =
            0;


        currentApplications.forEach(
            function (application) {

                switch (
                    application.status
                ) {

                    case "Shortlisted":

                        shortlisted++;

                        break;


                    case "Interview":

                        interview++;

                        break;


                    case "Selected":

                        selected++;

                        break;

                }

            }
        );


        if (totalCandidates) {

            totalCandidates.textContent =
                total;

        }


        if (shortlistedCandidates) {

            shortlistedCandidates.textContent =
                shortlisted;

        }


        if (interviewCandidates) {

            interviewCandidates.textContent =
                interview;

        }


        if (selectedCandidates) {

            selectedCandidates.textContent =
                selected;

        }

    }


    /* =========================================================
       FILTER
       ========================================================= */

    function applyFilters() {

        const currentApplications =
            getCurrentApplications();


        updateSummary(
            currentApplications
        );


        const selectedStatus =
            statusFilter
                ? String(
                    statusFilter.value || ""
                ).trim()
                : "";


        filteredCandidates =
            currentApplications.filter(
                function (application) {

                    if (
                        !selectedStatus ||
                        normalize(
                            selectedStatus
                        ) === "all status"
                    ) {

                        return true;

                    }


                    return (
                        normalize(
                            application.status
                        ) ===
                        normalize(
                            selectedStatus
                        )
                    );

                }
            );


        applySorting();

        renderCandidates();

    }


    /* =========================================================
       SORT
       ========================================================= */

    function applySorting() {

        const sortValue =
            sortFilter
                ? sortFilter.value
                : "match";


        filteredCandidates.sort(
            function (a, b) {

                if (
                    sortValue ===
                    "match"
                ) {

                    return (
                        Number(
                            b.matchPercentage ||
                            0
                        ) -
                        Number(
                            a.matchPercentage ||
                            0
                        )
                    );

                }


                if (
                    sortValue ===
                    "latest"
                ) {

                    return (
                        new Date(
                            b.appliedAt
                        ).getTime() -
                        new Date(
                            a.appliedAt
                        ).getTime()
                    );

                }


                if (
                    sortValue ===
                    "name"
                ) {

                    const nameA =
                        normalize(
                            a.student?.fullName
                        );


                    const nameB =
                        normalize(
                            b.student?.fullName
                        );


                    return nameA.localeCompare(
                        nameB
                    );

                }


                /*
                Default: highest match
                */

                return (
                    Number(
                        b.matchPercentage ||
                        0
                    ) -
                    Number(
                        a.matchPercentage ||
                        0
                    )
                );

            }
        );

    }


    /* =========================================================
       STATUS COLORS
       ========================================================= */

    function getStatusStyle(
        status
    ) {

        const styles = {

            Applied: {
                background: "#e0f2fe",
                color: "#0369a1"
            },

            Shortlisted: {
                background: "#ede9fe",
                color: "#6d28d9"
            },

            Interview: {
                background: "#fef3c7",
                color: "#92400e"
            },

            Selected: {
                background: "#dcfce7",
                color: "#166534"
            },

            Rejected: {
                background: "#fee2e2",
                color: "#991b1b"
            }

        };


        return (
            styles[status] ||
            {
                background: "#e2e8f0",
                color: "#334155"
            }
        );

    }


    /* =========================================================
       RENDER CANDIDATES
       ========================================================= */

    function renderCandidates() {

        if (!candidateContainer) {

            return;

        }


        candidateContainer.innerHTML =
            "";


        if (
            filteredCandidates.length ===
            0
        ) {

            candidateContainer.innerHTML = `

                <div
                    style="
                        text-align:center;
                        padding:70px 20px;
                        color:#64748b;
                    "
                >

                    <div
                        style="
                            width:64px;
                            height:64px;
                            border-radius:18px;
                            margin:0 auto 18px;
                            background:#f1f5f9;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:28px;
                        "
                    >
                        🔍
                    </div>


                    <h3
                        style="
                            margin:0 0 8px;
                            color:#0f172a;
                        "
                    >
                        No candidates found
                    </h3>


                    <p
                        style="
                            margin:0;
                        "
                    >
                        No applications match the selected filter.
                    </p>

                </div>

            `;


            return;

        }


        filteredCandidates.forEach(
            function (application) {

                candidateContainer.appendChild(
                    createCandidateCard(
                        application
                    )
                );

            }
        );

    }


    /* =========================================================
       CREATE CANDIDATE CARD
       ========================================================= */

    function createCandidateCard(
        application
    ) {

        const student =
            application.student ||
            {};


        const education =
            application.education ||
            {};


        const opportunity =
            application.opportunity ||
            {};


        const skills =
            Array.isArray(
                application.skills
            )
                ? application.skills
                : [];


        const status =
            application.status ||
            "Applied";


        const match =
            Number(
                application.matchPercentage ||
                0
            );


        const name =
            student.fullName ||
            "Student";


        const initials =
            name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(
                    function (item) {

                        return item
                            .charAt(0)
                            .toUpperCase();

                    }
                )
                .join("");


        const statusStyle =
            getStatusStyle(
                status
            );


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "candidate-card";


        card.style.cssText = `
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:18px;
            padding:24px;
            margin-bottom:18px;
            box-shadow:0 6px 18px rgba(15,23,42,0.05);
        `;


        card.innerHTML = `

            <!-- TOP -->

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:20px;
                    flex-wrap:wrap;
                "
            >

                <div
                    style="
                        display:flex;
                        gap:15px;
                        align-items:flex-start;
                    "
                >

                    <div
                        style="
                            width:58px;
                            height:58px;
                            border-radius:16px;
                            background:#4338ca;
                            color:white;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-weight:700;
                            font-size:19px;
                            flex-shrink:0;
                        "
                    >
                        ${escapeHTML(
                            initials
                        )}
                    </div>


                    <div>

                        <h3
                            style="
                                margin:0 0 6px;
                                font-size:20px;
                                color:#0f172a;
                            "
                        >
                            ${escapeHTML(
                                name
                            )}
                        </h3>


                        <p
                            style="
                                margin:0 0 4px;
                                color:#475569;
                            "
                        >
                            Student ID:
                            ${escapeHTML(
                                student.studentId ||
                                "N/A"
                            )}
                        </p>


                        <p
                            style="
                                margin:0;
                                color:#64748b;
                                font-size:14px;
                            "
                        >
                            ${escapeHTML(
                                student.collegeEmail ||
                                ""
                            )}
                        </p>

                    </div>

                </div>


                <div
                    style="
                        display:flex;
                        gap:10px;
                        align-items:center;
                        flex-wrap:wrap;
                    "
                >

                    <span
                        style="
                            padding:8px 13px;
                            border-radius:999px;
                            background:#ecfdf5;
                            color:#047857;
                            font-size:14px;
                            font-weight:700;
                        "
                    >
                        ${match}% Match
                    </span>


                    <span
                        style="
                            padding:8px 13px;
                            border-radius:999px;
                            background:${
                                statusStyle.background
                            };
                            color:${
                                statusStyle.color
                            };
                            font-size:14px;
                            font-weight:700;
                        "
                    >
                        ${escapeHTML(
                            status
                        )}
                    </span>

                </div>

            </div>


            <!-- OPPORTUNITY -->

            <div
                style="
                    margin-top:20px;
                    padding:16px;
                    border-radius:14px;
                    background:#f8fafc;
                "
            >

                <strong
                    style="
                        color:#0f172a;
                        display:block;
                        margin-bottom:5px;
                    "
                >
                    ${escapeHTML(
                        opportunity.title ||
                        ""
                    )}
                </strong>


                <span
                    style="
                        color:#475569;
                        font-size:14px;
                    "
                >
                    ${escapeHTML(
                        opportunity.roleName ||
                        ""
                    )}

                    &nbsp; • &nbsp;

                    ${escapeHTML(
                        opportunity.location ||
                        ""
                    )}

                    &nbsp; • &nbsp;

                    ${escapeHTML(
                        opportunity.workMode ||
                        ""
                    )}
                </span>

            </div>


            <!-- PROFILE -->

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(140px,1fr));
                    gap:12px;
                    margin-top:18px;
                "
            >

                <div
                    style="
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:14px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:5px;
                        "
                    >
                        CGPA
                    </small>

                    <strong>
                        ${escapeHTML(
                            education.cgpa ??
                            "N/A"
                        )}
                    </strong>

                </div>


                <div
                    style="
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:14px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:5px;
                        "
                    >
                        Department
                    </small>

                    <strong>
                        ${escapeHTML(
                            education.department ??
                            "N/A"
                        )}
                    </strong>

                </div>


                <div
                    style="
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:14px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:5px;
                        "
                    >
                        Graduation
                    </small>

                    <strong>
                        ${escapeHTML(
                            education.graduationYear ??
                            "N/A"
                        )}
                    </strong>

                </div>


                <div
                    style="
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:14px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:5px;
                        "
                    >
                        Backlogs
                    </small>

                    <strong>
                        ${escapeHTML(
                            education.backlogs ??
                            0
                        )}
                    </strong>

                </div>

            </div>


            <!-- SKILLS -->

            <div
                style="
                    margin-top:18px;
                "
            >

                <div
                    style="
                        color:#64748b;
                        font-size:13px;
                        margin-bottom:8px;
                    "
                >
                    Technical Skills
                </div>


                <div
                    style="
                        display:flex;
                        flex-wrap:wrap;
                        gap:7px;
                    "
                >

                    ${
                        skills.length
                            ? skills
                                .map(
                                    function (skill) {

                                        return `
                                            <span
                                                style="
                                                    padding:6px 10px;
                                                    border-radius:999px;
                                                    background:#eef2ff;
                                                    color:#3730a3;
                                                    font-size:13px;
                                                    font-weight:600;
                                                "
                                            >
                                                ${escapeHTML(
                                                    skill
                                                )}
                                            </span>
                                        `;

                                    }
                                )
                                .join("")
                            : `
                                <span
                                    style="
                                        color:#94a3b8;
                                        font-size:13px;
                                    "
                                >
                                    No skills available
                                </span>
                            `
                    }

                </div>

            </div>


            <!-- BOTTOM -->

            <div
                style="
                    margin-top:20px;
                    padding-top:18px;
                    border-top:1px solid #e2e8f0;
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-end;
                    gap:15px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <div
                        style="
                            font-size:13px;
                            color:#64748b;
                            margin-bottom:7px;
                        "
                    >
                        Applied:
                        ${escapeHTML(
                            formatDate(
                                application.appliedAt
                            )
                        )}
                    </div>


                    <select
                        class="candidate-status-select"
                        data-id="${
                            application.applicationId
                        }"
                        style="
                            min-width:185px;
                            padding:10px 12px;
                            border:1px solid #cbd5e1;
                            border-radius:10px;
                            background:white;
                        "
                    >

                        <option
                            value="Applied"
                            ${
                                status ===
                                "Applied"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Applied
                        </option>


                        <option
                            value="Shortlisted"
                            ${
                                status ===
                                "Shortlisted"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Shortlisted
                        </option>


                        <option
                            value="Interview"
                            ${
                                status ===
                                "Interview"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Interview
                        </option>


                        <option
                            value="Selected"
                            ${
                                status ===
                                "Selected"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Selected
                        </option>


                        <option
                            value="Rejected"
                            ${
                                status ===
                                "Rejected"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Rejected
                        </option>

                    </select>

                </div>


                <button
                    type="button"
                    class="candidate-update-button"
                    data-id="${
                        application.applicationId
                    }"
                    style="
                        border:0;
                        border-radius:10px;
                        padding:11px 18px;
                        background:#4338ca;
                        color:white;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    Update Status
                </button>

            </div>

        `;


        return card;

    }


    /* =========================================================
       UPDATE APPLICATION STATUS
       ========================================================= */

    async function updateCandidateStatus(
        applicationId,
        status,
        button
    ) {

        const originalText =
            button.textContent;


        button.disabled =
            true;

        button.textContent =
            "Updating...";


        try {

            const response =
                await fetch(
                    STATUS_UPDATE_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify({

                                applicationId:
                                    Number(
                                        applicationId
                                    ),

                                status:
                                    status

                            })
                    }
                );


            const data =
                await response.json();


            console.log(
                "Candidate Status Update:",
                data
            );


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to update candidate status."
                );

            }


            /*
            Reload everything from MySQL.
            */

            await loadCandidatesData();


            alert(
                data.message ||
                "Candidate status updated successfully."
            );


        } catch (error) {

            console.error(
                "Candidate status update error:",
                error
            );


            alert(
                error.message ||
                "Unable to update candidate status."
            );


        } finally {

            button.disabled =
                false;

            button.textContent =
                originalText;

        }

    }


    /* =========================================================
       OPPORTUNITY CHANGE
       ========================================================= */

    if (opportunitySelect) {

        opportunitySelect.addEventListener(
            "change",
            function () {

                selectedOpportunityId =
                    String(
                        opportunitySelect.value
                    );


                applyFilters();

            }
        );

    }


    /* =========================================================
       STATUS FILTER
       ========================================================= */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =========================================================
       SORT FILTER
       ========================================================= */

    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =========================================================
       STATUS BUTTON
       ========================================================= */

    if (candidateContainer) {

        candidateContainer.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".candidate-update-button"
                    );


                if (!button) {

                    return;

                }


                const applicationId =
                    button.dataset.id;


                const card =
                    button.closest(
                        ".candidate-card"
                    );


                const select =
                    card
                        ? card.querySelector(
                            ".candidate-status-select"
                        )
                        : null;


                if (!select) {

                    return;

                }


                updateCandidateStatus(
                    applicationId,
                    select.value,
                    button
                );

            }
        );

    }


    /* =========================================================
       DASHBOARD BUTTON
       ========================================================= */

    if (dashboardBtn) {

        dashboardBtn.addEventListener(
            "click",
            function () {

                window.location.href =
                    "recruiter-dashboard.html";

            }
        );

    }


    /* =========================================================
       LOGOUT
       ========================================================= */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async function () {

                try {

                    await fetch(
                        "../php/auth/logout.php",
                        {
                            method: "GET",
                            credentials: "include"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                }


                window.location.href =
                    "recruiter-login.html";

            }
        );

    }


    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    loadCandidatesData();

});