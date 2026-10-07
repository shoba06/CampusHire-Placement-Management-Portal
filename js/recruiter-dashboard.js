document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | CampusHire - Recruiter Dashboard
    | Fully MySQL connected
    |--------------------------------------------------------------------------
    */

    const DASHBOARD_API =
        "../php/recruiter/dashboard.php";

    const APPLICATIONS_API =
        "../php/recruiter/applications.php";


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


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;

        }

    }


    function setWidth(id, percentage) {

        const element =
            document.getElementById(id);

        if (element) {

            element.style.width =
                percentage + "%";

        }

    }


    /* =========================================================
       DOM ELEMENTS
       ========================================================= */

    const opportunityList =
        document.getElementById(
            "opportunityList"
        );


    const opportunityEmpty =
        document.getElementById(
            "opportunityEmpty"
        );


    /* =========================================================
       LOAD DASHBOARD
       ========================================================= */

    async function loadDashboard() {

        try {

            const response =
                await fetch(
                    DASHBOARD_API,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            console.log(
                "CampusHire Dashboard Data:",
                data
            );


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load recruiter dashboard."
                );

            }


            /*
            -----------------------------------------------------
            | RECRUITER INFORMATION
            -----------------------------------------------------
            */

            const recruiter =
                data.recruiter || {};


            const recruiterName =
                recruiter.recruiterName ||
                "Recruiter";


            const companyName =
                recruiter.companyName ||
                "Company";


            setText(
                "recruiterName",
                recruiterName
            );


            setText(
                "topCompanyName",
                companyName
            );


            setText(
                "bannerCompanyName",
                companyName
            );


            setText(
                "sidebarCompanyName",
                companyName
            );


            const companyAvatar =
                document.getElementById(
                    "companyAvatar"
                );


            if (companyAvatar) {

                companyAvatar.textContent =
                    companyName
                        .charAt(0)
                        .toUpperCase();

            }


            /*
            -----------------------------------------------------
            | TOP STATISTICS
            -----------------------------------------------------
            */

            const stats =
                data.stats || {};


            setText(
                "opportunityCount",
                Number(
                    stats.activeOpportunities ||
                    0
                )
            );


            setText(
                "applicationCount",
                Number(
                    stats.applications ||
                    0
                )
            );


            setText(
                "reviewCount",
                Number(
                    stats.underReview ||
                    0
                )
            );


            setText(
                "selectedCount",
                Number(
                    stats.selected ||
                    0
                )
            );


            /*
            -----------------------------------------------------
            | OPPORTUNITIES
            -----------------------------------------------------
            */

            renderOpportunities(
                data.opportunities || []
            );


            /*
            -----------------------------------------------------
            | LIVE CANDIDATE PIPELINE
            |
            | Important:
            | We get statuses directly from applications.php.
            | This prevents stale/localStorage values.
            -----------------------------------------------------
            */

            await loadCandidatePipeline();


            /*
            -----------------------------------------------------
            | NAVIGATION
            -----------------------------------------------------
            */

            setupNavigation();


        } catch (error) {

            console.error(
                "Recruiter dashboard error:",
                error
            );


            /*
            -----------------------------------------------------
            | Session problem
            -----------------------------------------------------
            */

            if (
                String(
                    error.message
                ).toLowerCase().includes(
                    "login"
                )
            ) {

                window.location.href =
                    "recruiter-login.html";

                return;

            }


            alert(
                error.message ||
                "Unable to load recruiter dashboard."
            );

        }

    }


    /* =========================================================
       OPPORTUNITY LIST
       ========================================================= */

    function renderOpportunities(
        opportunities
    ) {

        if (!opportunityList) {

            return;

        }


        opportunityList.innerHTML =
            "";


        if (
            !Array.isArray(
                opportunities
            ) ||
            opportunities.length === 0
        ) {

            if (opportunityEmpty) {

                opportunityEmpty.style.display =
                    "block";

            }


            return;

        }


        if (opportunityEmpty) {

            opportunityEmpty.style.display =
                "none";

        }


        opportunities.forEach(
            function (opportunity) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "dashboard-opportunity";


                item.style.cssText = `
                    padding:14px 4px;
                    border-bottom:1px solid #e2e8f0;
                `;


                const initial =
                    (
                        opportunity.title ||
                        "O"
                    )
                        .charAt(0)
                        .toUpperCase();


                item.innerHTML = `

                    <div
                        style="
                            display:flex;
                            gap:12px;
                            align-items:flex-start;
                        "
                    >

                        <div
                            style="
                                width:38px;
                                height:38px;
                                border-radius:10px;
                                background:#f1f5f9;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-weight:700;
                                color:#2563eb;
                                flex-shrink:0;
                            "
                        >
                            ${escapeHTML(initial)}
                        </div>


                        <div
                            style="
                                flex:1;
                            "
                        >

                            <div
                                style="
                                    font-weight:700;
                                    color:#0f172a;
                                "
                            >
                                ${escapeHTML(
                                    opportunity.title
                                )}
                            </div>


                            <div
                                style="
                                    margin-top:3px;
                                    color:#475569;
                                    font-size:14px;
                                "
                            >
                                ${escapeHTML(
                                    opportunity.roleName
                                )}

                                &nbsp; • &nbsp;

                                📍
                                ${escapeHTML(
                                    opportunity.location
                                )}

                                &nbsp; • &nbsp;

                                💼
                                ${escapeHTML(
                                    opportunity.workMode
                                )}

                            </div>


                            <div
                                style="
                                    margin-top:4px;
                                    color:#64748b;
                                    font-size:13px;
                                "
                            >
                                💰
                                ${
                                    opportunity.packageAmount !==
                                    null &&
                                    opportunity.packageAmount !==
                                    undefined
                                        ? escapeHTML(
                                            Number(
                                                opportunity.packageAmount
                                            ).toFixed(2)
                                        ) + " LPA"
                                        : "Package unavailable"
                                }

                                &nbsp; • &nbsp;

                                <span
                                    style="
                                        color:#16a34a;
                                        font-weight:600;
                                    "
                                >
                                    ${escapeHTML(
                                        opportunity.status ||
                                        "Active"
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>

                `;


                opportunityList.appendChild(
                    item
                );

            }
        );

    }


    /* =========================================================
       LIVE CANDIDATE PIPELINE
       ========================================================= */

    async function loadCandidatePipeline() {

        try {

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
                "CampusHire Candidate Pipeline:",
                data
            );


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load candidate pipeline."
                );

            }


            const applications =
                Array.isArray(
                    data.applications
                )
                    ? data.applications
                    : [];


            /*
            -----------------------------------------------------
            | Calculate directly from MySQL application statuses
            -----------------------------------------------------
            */

            let applied =
                0;

            let shortlisted =
                0;

            let interview =
                0;

            let selected =
                0;


            applications.forEach(
                function (application) {

                    switch (
                        application.status
                    ) {

                        case "Applied":

                            applied++;

                            break;


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


            /*
            -----------------------------------------------------
            | Update numbers
            -----------------------------------------------------
            */

            setText(
                "appliedPipeline",
                applied
            );


            setText(
                "shortlistedPipeline",
                shortlisted
            );


            setText(
                "interviewPipeline",
                interview
            );


            setText(
                "selectedPipeline",
                selected
            );


            /*
            -----------------------------------------------------
            | Progress bars
            |
            | Each stage is shown as a percentage of all
            | applications.
            -----------------------------------------------------
            */

            const total =
                applications.length;


            if (total === 0) {

                setWidth(
                    "appliedBar",
                    0
                );

                setWidth(
                    "shortlistedBar",
                    0
                );

                setWidth(
                    "interviewBar",
                    0
                );

                setWidth(
                    "selectedBar",
                    0
                );

            } else {

                setWidth(
                    "appliedBar",
                    (
                        applied /
                        total
                    ) * 100
                );


                setWidth(
                    "shortlistedBar",
                    (
                        shortlisted /
                        total
                    ) * 100
                );


                setWidth(
                    "interviewBar",
                    (
                        interview /
                        total
                    ) * 100
                );


                setWidth(
                    "selectedBar",
                    (
                        selected /
                        total
                    ) * 100
                );

            }

        } catch (error) {

            console.error(
                "Candidate pipeline error:",
                error
            );


            setText(
                "appliedPipeline",
                0
            );


            setText(
                "shortlistedPipeline",
                0
            );


            setText(
                "interviewPipeline",
                0
            );


            setText(
                "selectedPipeline",
                0
            );

        }

    }


    /* =========================================================
       NAVIGATION
       ========================================================= */

    function setupNavigation() {

        const createOpportunityButton =
            document.getElementById(
                "createOpportunityButton"
            );


        if (
            createOpportunityButton
        ) {

            createOpportunityButton.onclick =
                function () {

                    window.location.href =
                        "create-opportunity.html";

                };

        }


        const createOpportunityAction =
            document.getElementById(
                "createOpportunityAction"
            );


        if (
            createOpportunityAction
        ) {

            createOpportunityAction.onclick =
                function () {

                    window.location.href =
                        "create-opportunity.html";

                };

        }


        const candidateAction =
            document.getElementById(
                "candidateAction"
            );


        if (candidateAction) {

            candidateAction.onclick =
                function () {

                    window.location.href =
                        "recruiter-candidates.html";

                };

        }


        const applicationAction =
            document.getElementById(
                "applicationAction"
            );


        if (applicationAction) {

            applicationAction.onclick =
                function () {

                    window.location.href =
                        "recruiter-applications.html";

                };

        }


        const analyticsAction =
            document.getElementById(
                "analyticsAction"
            );


        if (analyticsAction) {

            analyticsAction.onclick =
                function () {

                    window.location.href =
                        "recruiter-analytics.html";

                };

        }


        const matchingButton =
            document.getElementById(
                "matchingButton"
            );


        if (matchingButton) {

            matchingButton.onclick =
                function () {

                    window.location.href =
                        "recruiter-candidates.html";

                };

        }


        const viewAllOpportunities =
            document.getElementById(
                "viewAllOpportunities"
            );


        if (
            viewAllOpportunities
        ) {

            viewAllOpportunities.onclick =
                function () {

                    window.location.href =
                        "create-opportunity.html";

                };

        }


        const opportunityNav =
            document.getElementById(
                "opportunityNav"
            );


        if (opportunityNav) {

            opportunityNav.onclick =
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "create-opportunity.html";

                };

        }


        const candidateNav =
            document.getElementById(
                "candidateNav"
            );


        if (candidateNav) {

            candidateNav.onclick =
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "recruiter-candidates.html";

                };

        }


        const applicationNav =
            document.getElementById(
                "applicationNav"
            );


        if (applicationNav) {

            applicationNav.onclick =
                function (event) {

                    event.preventDefault();

                    window.location.href =
                        "recruiter-applications.html";

                };

        }


        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.onclick =
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

                };

        }

    }


    /* =========================================================
       START
       ========================================================= */

    loadDashboard();

});