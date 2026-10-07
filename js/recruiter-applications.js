document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | CampusHire - Recruiter Applications
    | MySQL connected version
    |--------------------------------------------------------------------------
    */

    const APPLICATIONS_API =
        "../php/recruiter/applications.php";

    const STATUS_UPDATE_API =
        "../php/recruiter/update_application_status.php";


    let applications = [];
    let filteredApplications = [];


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


    function setTextById(id, value) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;

        }

    }


    function setApplicationPoolCount(count) {

        const elements =
            document.querySelectorAll(
                ".application-count"
            );


        elements.forEach(
            function (element) {

                element.textContent =
                    count + " applications";

            }
        );

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

    const applicationsList =
        document.getElementById(
            "applicationsList"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const sortFilter =
        document.getElementById(
            "sortFilter"
        );


    const searchInput =
        document.querySelector(
            'input[placeholder*="Search"]'
        );


    /* =========================================================
       LOAD APPLICATIONS FROM MYSQL
       ========================================================= */

    async function loadApplications() {

        try {

            if (applicationsList) {

                applicationsList.innerHTML = `

                    <div
                        style="
                            text-align:center;
                            padding:40px;
                            color:#64748b;
                        "
                    >
                        Loading applications...
                    </div>

                `;

            }


            const response =
                await fetch(
                    APPLICATIONS_API,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            console.log(
                "Recruiter Applications API:",
                data
            );


            if (!data.success) {

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


            /*
            ------------------------------------------------------
            | Read summary from PHP
            ------------------------------------------------------
            */

            const summary =
                data.summary || {};


            const total =
                Number(
                    summary.total || 0
                );


            const shortlisted =
                Number(
                    summary.shortlisted || 0
                );


            const interview =
                Number(
                    summary.interview || 0
                );


            const selected =
                Number(
                    summary.selected || 0
                );


            const underReview =
                shortlisted +
                interview;


            /*
            ------------------------------------------------------
            | IMPORTANT:
            | These are the IDs that actually exist
            | in your recruiter-applications.html
            ------------------------------------------------------
            */

            setTextById(
                "totalApplications",
                total
            );


            setTextById(
                "underReview",
                underReview
            );


            setTextById(
                "interviewCount",
                interview
            );


            setTextById(
                "selectedCount",
                selected
            );


            setApplicationPoolCount(
                applications.length
            );


            /*
            ------------------------------------------------------
            | Apply search/filter/sort
            ------------------------------------------------------
            */

            applyFilters();


        } catch (error) {

            console.error(
                "Recruiter application loading error:",
                error
            );


            applications = [];


            filteredApplications = [];


            setTextById(
                "totalApplications",
                0
            );


            setTextById(
                "underReview",
                0
            );


            setTextById(
                "interviewCount",
                0
            );


            setTextById(
                "selectedCount",
                0
            );


            setApplicationPoolCount(
                0
            );


            if (applicationsList) {

                applicationsList.innerHTML = `

                    <div
                        style="
                            text-align:center;
                            padding:40px;
                        "
                    >

                        <h3>
                            Unable to load applications
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
       STATUS FILTER
       ========================================================= */

    function getSelectedStatus() {

        if (!statusFilter) {

            return "";

        }


        const value =
            String(
                statusFilter.value || ""
            ).trim();


        /*
        Empty value means "All Statuses".
        */

        if (!value) {

            return "";

        }


        if (
            normalize(value) ===
            "all statuses"
        ) {

            return "";

        }


        if (
            normalize(value) ===
            "all"
        ) {

            return "";

        }


        return value;

    }


    /* =========================================================
       FILTER APPLICATIONS
       ========================================================= */

    function applyFilters() {

        const search =
            searchInput
                ? normalize(
                    searchInput.value
                )
                : "";


        const selectedStatus =
            getSelectedStatus();


        filteredApplications =
            applications.filter(
                function (application) {

                    const student =
                        application.student ||
                        {};


                    const opportunity =
                        application.opportunity ||
                        {};


                    const searchableText = [

                        student.fullName,

                        student.studentId,

                        student.collegeEmail,

                        opportunity.title,

                        opportunity.roleName,

                        opportunity.industry,

                        opportunity.location,

                        opportunity.workMode

                    ]
                        .map(normalize)
                        .join(" ");


                    const matchesSearch =
                        search === "" ||
                        searchableText.includes(
                            search
                        );


                    const matchesStatus =
                        selectedStatus === "" ||
                        normalize(
                            application.status
                        ) ===
                        normalize(
                            selectedStatus
                        );


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        applySorting();

        renderApplications();

    }


    /* =========================================================
       SORT
       ========================================================= */

    function applySorting() {

        const selectedSort =
            sortFilter
                ? sortFilter.value
                : "newest";


        filteredApplications.sort(
            function (a, b) {

                if (
                    selectedSort ===
                    "oldest"
                ) {

                    return (
                        new Date(
                            a.appliedAt
                        ).getTime() -
                        new Date(
                            b.appliedAt
                        ).getTime()
                    );

                }


                if (
                    selectedSort ===
                    "status"
                ) {

                    const order = {

                        Applied: 1,
                        Shortlisted: 2,
                        Interview: 3,
                        Selected: 4,
                        Rejected: 5

                    };


                    return (
                        (
                            order[a.status] ||
                            99
                        ) -
                        (
                            order[b.status] ||
                            99
                        )
                    );

                }


                /*
                Default:
                newest first
                */

                return (
                    new Date(
                        b.appliedAt
                    ).getTime() -
                    new Date(
                        a.appliedAt
                    ).getTime()
                );

            }
        );

    }


    /* =========================================================
       RENDER APPLICATIONS
       ========================================================= */

    function renderApplications() {

        if (!applicationsList) {

            return;

        }


        applicationsList.innerHTML =
            "";


        /*
        ------------------------------------------------------
        | Application Pool count
        | Must represent filtered results.
        ------------------------------------------------------
        */

        setApplicationPoolCount(
            filteredApplications.length
        );


        /*
        ------------------------------------------------------
        | No matching applications
        ------------------------------------------------------
        */

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
            function (application) {

                applicationsList.appendChild(
                    createApplicationCard(
                        application
                    )
                );

            }
        );

    }


    /* =========================================================
       CREATE APPLICATION CARD
       ========================================================= */

    function createApplicationCard(
        application
    ) {

        const student =
            application.student ||
            {};


        const opportunity =
            application.opportunity ||
            {};


        const education =
            application.education ||
            {};


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
                    function (part) {

                        return part
                            .charAt(0)
                            .toUpperCase();

                    }
                )
                .join("");


        const statusBackground = {

            Applied:
                "#e0f2fe",

            Shortlisted:
                "#ede9fe",

            Interview:
                "#fef3c7",

            Selected:
                "#dcfce7",

            Rejected:
                "#fee2e2"

        };


        const statusColor = {

            Applied:
                "#0369a1",

            Shortlisted:
                "#6d28d9",

            Interview:
                "#92400e",

            Selected:
                "#166534",

            Rejected:
                "#991b1b"

        };


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "application-card";


        card.style.cssText = `
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:18px;
            padding:24px;
            margin-bottom:18px;
            box-shadow:0 6px 20px rgba(15,23,42,0.05);
        `;


        card.innerHTML = `

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
                        align-items:flex-start;
                        gap:15px;
                    "
                >

                    <div
                        style="
                            width:52px;
                            height:52px;
                            border-radius:14px;
                            background:#2563eb;
                            color:white;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-weight:700;
                            font-size:18px;
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
                                margin:0 0 5px;
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
                            padding:7px 12px;
                            border-radius:999px;
                            background:#ecfdf5;
                            color:#047857;
                            font-weight:700;
                            font-size:13px;
                        "
                    >
                        ${match}% Match
                    </span>


                    <span
                        style="
                            padding:7px 12px;
                            border-radius:999px;
                            background:${
                                statusBackground[
                                    status
                                ] ||
                                "#e2e8f0"
                            };
                            color:${
                                statusColor[
                                    status
                                ] ||
                                "#334155"
                            };
                            font-weight:700;
                            font-size:13px;
                        "
                    >
                        ${escapeHTML(
                            status
                        )}
                    </span>

                </div>

            </div>


            <div
                style="
                    margin-top:20px;
                    padding:17px;
                    border-radius:14px;
                    background:#f8fafc;
                "
            >

                <strong
                    style="
                        display:block;
                        color:#0f172a;
                        margin-bottom:5px;
                    "
                >
                    ${escapeHTML(
                        opportunity.title ||
                        "Opportunity"
                    )}
                </strong>


                <div
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

                </div>


                <div
                    style="
                        margin-top:8px;
                        color:#64748b;
                        font-size:13px;
                    "
                >
                    📅 Applied:
                    ${escapeHTML(
                        formatDate(
                            application.appliedAt
                        )
                    )}
                </div>

            </div>


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
                        padding:13px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:4px;
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
                        padding:13px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:4px;
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
                        padding:13px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:4px;
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
                        padding:13px;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#64748b;
                            margin-bottom:4px;
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


            <div
                style="
                    margin-top:20px;
                    padding-top:18px;
                    border-top:1px solid #e2e8f0;
                    display:flex;
                    align-items:flex-end;
                    justify-content:space-between;
                    gap:15px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <label
                        style="
                            display:block;
                            color:#64748b;
                            font-size:13px;
                            margin-bottom:7px;
                        "
                    >
                        Candidate Status
                    </label>


                    <select
                        class="application-status-select"
                        data-id="${
                            application.applicationId
                        }"
                        style="
                            min-width:190px;
                            padding:10px 12px;
                            border:1px solid #cbd5e1;
                            border-radius:10px;
                            background:#ffffff;
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
                    class="update-application-status"
                    data-id="${
                        application.applicationId
                    }"
                    style="
                        border:0;
                        border-radius:10px;
                        padding:11px 18px;
                        background:#2563eb;
                        color:#ffffff;
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
       UPDATE STATUS
       ========================================================= */

    async function updateStatus(
        applicationId,
        newStatus,
        button
    ) {

        if (!applicationId) {

            return;

        }


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
                                    newStatus

                            })
                    }
                );


            const data =
                await response.json();


            console.log(
                "Status Update API:",
                data
            );


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to update status."
                );

            }


            await loadApplications();


            alert(
                data.message ||
                "Status updated successfully."
            );


        } catch (error) {

            console.error(
                "Status update error:",
                error
            );


            alert(
                error.message ||
                "Unable to update status."
            );


        } finally {

            button.disabled =
                false;

            button.textContent =
                originalText;

        }

    }


    /* =========================================================
       UPDATE STATUS BUTTON
       ========================================================= */

    if (applicationsList) {

        applicationsList.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".update-application-status"
                    );


                if (!button) {

                    return;

                }


                const applicationId =
                    button.dataset.id;


                const card =
                    button.closest(
                        ".application-card"
                    );


                const select =
                    card
                        ? card.querySelector(
                            ".application-status-select"
                        )
                        : null;


                if (!select) {

                    return;

                }


                updateStatus(
                    applicationId,
                    select.value,
                    button
                );

            }
        );

    }


    /* =========================================================
       SEARCH
       ========================================================= */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
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
       INITIAL LOAD
       ========================================================= */

    loadApplications();

});