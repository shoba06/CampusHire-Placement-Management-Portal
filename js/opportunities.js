document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | CampusHire - Student Opportunities
    | MySQL / PHP connected matching engine
    |--------------------------------------------------------------------------
    */

    const OPPORTUNITIES_API =
        "../php/opportunities/list.php";

    const APPLICATION_API =
        "../php/applications/create.php";


    /* =========================================================
       HELPERS
       ========================================================= */

    function readStorage(key, fallback) {

        try {

            const localValue =
                localStorage.getItem(key);

            const sessionValue =
                sessionStorage.getItem(key);

            const value =
                localValue || sessionValue;

            if (!value) {
                return fallback;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "Storage read error:",
                key,
                error
            );

            return fallback;

        }

    }


    function writeStorage(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "Storage write error:",
                key,
                error
            );

            return false;

        }

    }


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


    function normalizeList(value) {

        if (Array.isArray(value)) {

            return value
                .map(function (item) {

                    if (typeof item === "string") {
                        return item.trim();
                    }

                    if (
                        item &&
                        typeof item === "object"
                    ) {

                        return (
                            item.name ||
                            item.title ||
                            item.role ||
                            item.skill ||
                            item.value ||
                            ""
                        ).trim();

                    }

                    return "";

                })
                .filter(Boolean);

        }


        if (typeof value === "string") {

            return value
                .split(",")
                .map(function (item) {
                    return item.trim();
                })
                .filter(Boolean);

        }


        return [];

    }


    /* =========================================================
       STUDENT PROFILE
       ========================================================= */

    function getStudentProfile() {

        const basic =
            readStorage(
                "campusHireBasicProfile",
                {}
            );

        const education =
            readStorage(
                "campusHireEducationProfile",
                {}
            );

        const skills =
            readStorage(
                "campusHireSkillsProfile",
                {}
            );

        const career =
            readStorage(
                "campusHireCareerProfile",
                {}
            );

        const projects =
            readStorage(
                "campusHireProjectsProfile",
                {}
            );


        let studentSkills =
            normalizeList(
                skills.selectedSkills
            );


        if (studentSkills.length === 0) {

            studentSkills =
                normalizeList(
                    skills.skills
                );

        }


        if (
            studentSkills.length === 0 &&
            Array.isArray(skills)
        ) {

            studentSkills =
                normalizeList(skills);

        }


        studentSkills = [
            ...new Set(studentSkills)
        ];


        let targetRoles =
            normalizeList(
                career.targetRoles
            );


        if (targetRoles.length === 0) {

            targetRoles =
                normalizeList(
                    career.targetRole
                );

        }


        if (targetRoles.length === 0) {

            targetRoles =
                normalizeList(
                    career.roles
                );

        }


        if (targetRoles.length === 0) {

            targetRoles =
                normalizeList(
                    career.selectedRoles
                );

        }


        let industries =
            normalizeList(
                career.preferredIndustries
            );


        if (industries.length === 0) {

            industries =
                normalizeList(
                    career.industries
                );

        }


        return {

            basic,

            education,

            skills: studentSkills,

            targetRoles,

            industries,

            workMode:
                career.workMode ||
                career.workPreference ||
                career.preferredWorkMode ||
                "",

            preferredLocation:
                career.preferredLocation ||
                career.location ||
                basic.location ||
                "",

            projects:
                Array.isArray(
                    projects.projects
                )
                    ? projects.projects
                    : [],

            certifications:
                Array.isArray(
                    projects.certifications
                )
                    ? projects.certifications
                    : []

        };

    }


    const student =
        getStudentProfile();


    const studentCgpa =
        Number(
            student.education.cgpa || 0
        );


    const studentBacklogs =
        Number(
            student.education.backlogs || 0
        );


    const studentGraduationYear =
        String(
            student.education.graduationYear || ""
        );


    /* =========================================================
       DOM ELEMENTS
       ========================================================= */

    const grid =
        document.getElementById(
            "opportunitiesGrid"
        );


    const opportunityCount =
        document.getElementById(
            "opportunityCount"
        );


    const roleFilter =
        document.getElementById(
            "roleFilter"
        );


    const locationFilter =
        document.getElementById(
            "locationFilter"
        );


    const workModeFilter =
        document.getElementById(
            "workModeFilter"
        );


    const matchFilter =
        document.getElementById(
            "matchFilter"
        );


    /* =========================================================
       APPLICATION STORAGE HELPERS
       ========================================================= */

    function getApplications() {

        return readStorage(
            "campusHireApplications",
            []
        );

    }


    function logicalOpportunityKey(opportunity) {

        return [

            normalize(
                opportunity.company
            ),

            normalize(
                opportunity.title
            ),

            normalize(
                opportunity.role
            ),

            normalize(
                opportunity.location
            )

        ].join("|");

    }


    function hasApplied(opportunity) {

        const applications =
            getApplications();


        const targetKey =
            logicalOpportunityKey(
                opportunity
            );


        const studentIdentity =
            student.basic.studentId ||
            student.basic.collegeEmail ||
            student.basic.fullName ||
            "CURRENT-STUDENT";


        return applications.some(
            function (application) {

                const applicationKey =
                    logicalOpportunityKey({
                        company:
                            application.company,

                        title:
                            application.title,

                        role:
                            application.role,

                        location:
                            application.location
                    });


                const applicationStudent =
                    application.studentId ||
                    application.studentEmail ||
                    application.collegeEmail ||
                    application.email ||
                    "CURRENT-STUDENT";


                return (

                    applicationKey ===
                    targetKey &&

                    normalize(
                        applicationStudent
                    ) ===
                    normalize(
                        studentIdentity
                    )

                );

            }
        );

    }


    /* =========================================================
       MATCHING ENGINE
       ========================================================= */

    function calculateMatch(opportunity) {

        let roleScore = 0;

        let skillScore = 0;

        let educationScore = 0;

        let preferenceScore = 0;


        const matchedSkills = [];

        const missingSkills = [];


        /* =====================================================
           ROLE - 20
           ===================================================== */

        const opportunityRole =
            normalize(
                opportunity.role
            );


        const opportunityTitle =
            normalize(
                opportunity.title
            );


        let roleMatched = false;


        student.targetRoles.forEach(
            function (targetRole) {

                const role =
                    normalize(
                        targetRole
                    );


                if (

                    role === opportunityRole ||

                    role === opportunityTitle ||

                    opportunityRole.includes(
                        role
                    ) ||

                    role.includes(
                        opportunityRole
                    ) ||

                    opportunityTitle.includes(
                        role
                    ) ||

                    role.includes(
                        opportunityTitle
                    )

                ) {

                    roleMatched = true;

                }

            }
        );


        if (
            student.targetRoles.length === 0
        ) {

            roleScore = 10;

        } else if (roleMatched) {

            roleScore = 20;

        }


        /* =====================================================
           SKILLS - 40
           ===================================================== */

        const requiredSkills =
            Array.isArray(
                opportunity.requiredSkills
            )
                ? opportunity.requiredSkills
                : [];


        requiredSkills.forEach(
            function (requiredSkill) {

                const required =
                    normalize(
                        requiredSkill
                    );


                const found =
                    student.skills.some(
                        function (studentSkill) {

                            const skill =
                                normalize(
                                    studentSkill
                                );


                            return (

                                skill === required ||

                                skill.includes(
                                    required
                                ) ||

                                required.includes(
                                    skill
                                )

                            );

                        }
                    );


                if (found) {

                    matchedSkills.push(
                        requiredSkill
                    );

                } else {

                    missingSkills.push(
                        requiredSkill
                    );

                }

            }
        );


        if (
            requiredSkills.length === 0
        ) {

            skillScore = 40;

        } else {

            skillScore =
                (
                    matchedSkills.length /
                    requiredSkills.length
                ) * 40;

        }


        /* =====================================================
           EDUCATION - 20
           ===================================================== */

        const minimumCgpa =
            Number(
                opportunity
                    .eligibility
                    ?.minCgpa || 0
            );


        const maximumBacklogs =
            Number(
                opportunity
                    .eligibility
                    ?.maxBacklogs ?? 999
            );


        const requiredGraduationYear =
            String(
                opportunity
                    .eligibility
                    ?.graduationYear || ""
            );


        if (
            studentCgpa >= minimumCgpa
        ) {

            educationScore += 10;

        } else if (
            studentCgpa >=
            minimumCgpa - 0.5
        ) {

            educationScore += 5;

        }


        if (
            studentBacklogs <=
            maximumBacklogs
        ) {

            educationScore += 5;

        }


        if (

            requiredGraduationYear === "" ||

            studentGraduationYear === "" ||

            requiredGraduationYear ===
            studentGraduationYear

        ) {

            educationScore += 5;

        }


        /* =====================================================
           INDUSTRY - 8
           ===================================================== */

        if (
            student.industries.length === 0
        ) {

            preferenceScore += 4;

        } else {

            const industryMatch =
                student.industries.some(
                    function (industry) {

                        return (
                            normalize(
                                industry
                            ) ===
                            normalize(
                                opportunity.industry
                            )
                        );

                    }
                );


            if (industryMatch) {

                preferenceScore += 8;

            }

        }


        /* =====================================================
           WORK MODE - 6
           ===================================================== */

        if (!student.workMode) {

            preferenceScore += 3;

        } else if (

            normalize(
                student.workMode
            ) ===
            normalize(
                opportunity.workMode
            )

        ) {

            preferenceScore += 6;

        }


        /* =====================================================
           LOCATION - 6
           ===================================================== */

        if (!student.preferredLocation) {

            preferenceScore += 3;

        } else {

            const preferredLocation =
                normalize(
                    student.preferredLocation
                );


            const opportunityLocation =
                normalize(
                    opportunity.location
                );


            if (

                opportunityLocation.includes(
                    preferredLocation
                ) ||

                preferredLocation.includes(
                    opportunityLocation
                )

            ) {

                preferenceScore += 6;

            }

        }


        const score =
            Math.min(
                100,
                Math.round(
                    roleScore +
                    skillScore +
                    educationScore +
                    preferenceScore
                )
            );


        return {

            score,

            matchedSkills,

            missingSkills

        };

    }


    /* =========================================================
       CARD
       ========================================================= */

    function createCard(result) {

        const item =
            result.opportunity;


        const alreadyApplied =
            hasApplied(item);


        const initial =
            (
                item.company ||
                "C"
            )
                .charAt(0)
                .toUpperCase();


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "opportunity-card";


        const packageText =
            item.package !== null &&
            item.package !== undefined
                ? Number(
                    item.package
                ).toFixed(2) + " LPA"
                : "Not specified";


        card.innerHTML = `

            <div class="opportunity-top">

                <div class="company-logo">
                    ${escapeHTML(initial)}
                </div>

                <div class="opportunity-heading">

                    <h3>
                        ${escapeHTML(
                            item.title
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            item.company
                        )}
                    </p>

                </div>

                <div class="match-badge">
                    ${result.score}% Match
                </div>

            </div>


            <div class="opportunity-meta">

                <span>
                    📍
                    ${escapeHTML(
                        item.location
                    )}
                </span>

                <span>
                    💼
                    ${escapeHTML(
                        item.workMode
                    )}
                </span>

                <span>
                    💰
                    ${escapeHTML(
                        packageText
                    )}
                </span>

                <span>
                    🏢
                    ${escapeHTML(
                        item.industry
                    )}
                </span>

            </div>


            <div class="opportunity-skills">

                ${
                    result.matchedSkills.length > 0

                        ? result.matchedSkills
                            .map(
                                function (skill) {

                                    return `
                                        <span class="matched-skill">
                                            ${escapeHTML(skill)}
                                        </span>
                                    `;

                                }
                            )
                            .join("")

                        : `
                            <span class="matched-skill">
                                Skills shown in details
                            </span>
                          `
                }

            </div>


            <div class="opportunity-actions">

                <button
                    type="button"
                    class="view-details"
                    data-id="${escapeHTML(
                        item.id
                    )}"
                >
                    View Details
                </button>


                <button
                    type="button"
                    class="apply-opportunity"
                    data-id="${escapeHTML(
                        item.id
                    )}"
                    ${
                        alreadyApplied
                            ? "disabled"
                            : ""
                    }
                >
                    ${
                        alreadyApplied
                            ? "Already Applied"
                            : "Apply Now"
                    }
                </button>

            </div>

        `;


        return card;

    }


    /* =========================================================
       DETAILS MODAL
       ========================================================= */

    function showDetails(result) {

        const item =
            result.opportunity;


        const matchedSkillsHTML =
            result.matchedSkills.length > 0

                ? result.matchedSkills
                    .map(
                        function (skill) {

                            return `
                                <span class="modal-skill matched">
                                    ${escapeHTML(skill)}
                                </span>
                            `;

                        }
                    )
                    .join("")

                : `
                    <span class="modal-skill matched">
                        No matching skills yet
                    </span>
                  `;


        const missingSkillsHTML =
            result.missingSkills.length > 0

                ? result.missingSkills
                    .map(
                        function (skill) {

                            return `
                                <span class="modal-skill missing">
                                    ${escapeHTML(skill)}
                                </span>
                            `;

                        }
                    )
                    .join("")

                : `
                    <span class="modal-skill matched">
                        All required skills matched
                    </span>
                  `;


        const packageText =
            item.package !== null &&
            item.package !== undefined
                ? Number(
                    item.package
                ).toFixed(2) + " LPA"
                : "Not specified";


        const backdrop =
            document.createElement(
                "div"
            );


        backdrop.className =
            "modal-backdrop";


        backdrop.innerHTML = `

            <div class="details-modal">

                <button
                    type="button"
                    class="modal-close"
                >
                    ×
                </button>


                <div class="modal-header">

                    <h2>
                        ${escapeHTML(
                            item.title
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            item.company
                        )}
                    </p>

                </div>


                <div class="modal-match">

                    ${result.score}% Match

                </div>


                <div class="modal-info">

                    <div>
                        <strong>Role</strong>
                        <span>
                            ${escapeHTML(
                                item.role
                            )}
                        </span>
                    </div>


                    <div>
                        <strong>Location</strong>
                        <span>
                            ${escapeHTML(
                                item.location
                            )}
                        </span>
                    </div>


                    <div>
                        <strong>Work Mode</strong>
                        <span>
                            ${escapeHTML(
                                item.workMode
                            )}
                        </span>
                    </div>


                    <div>
                        <strong>Package</strong>
                        <span>
                            ${escapeHTML(
                                packageText
                            )}
                        </span>
                    </div>

                </div>


                <div class="modal-section">

                    <h4>
                        Description
                    </h4>

                    <p>
                        ${escapeHTML(
                            item.description
                        )}
                    </p>

                </div>


                <div class="modal-section">

                    <h4>
                        Matching Skills
                    </h4>

                    <div>
                        ${matchedSkillsHTML}
                    </div>

                </div>


                <div class="modal-section">

                    <h4>
                        Skills to Develop
                    </h4>

                    <div>
                        ${missingSkillsHTML}
                    </div>

                </div>


                <div class="modal-section">

                    <h4>
                        Eligibility
                    </h4>

                    <p>

                        Minimum CGPA:
                        ${escapeHTML(
                            item
                                .eligibility
                                ?.minCgpa ?? 0
                        )}

                        <br>

                        Maximum Backlogs:
                        ${escapeHTML(
                            item
                                .eligibility
                                ?.maxBacklogs ??
                            "Any"
                        )}

                        <br>

                        Graduation Year:
                        ${escapeHTML(
                            item
                                .eligibility
                                ?.graduationYear ||
                            "Any"
                        )}

                    </p>

                </div>


                <button
                    type="button"
                    class="modal-apply"
                    ${
                        hasApplied(item)
                            ? "disabled"
                            : ""
                    }
                >
                    ${
                        hasApplied(item)
                            ? "Already Applied"
                            : "Apply for this Opportunity"
                    }
                </button>

            </div>

        `;


        document.body.appendChild(
            backdrop
        );


        const closeButton =
            backdrop.querySelector(
                ".modal-close"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function () {

                    backdrop.remove();

                }
            );

        }


        backdrop.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    backdrop
                ) {

                    backdrop.remove();

                }

            }
        );


        const applyButton =
            backdrop.querySelector(
                ".modal-apply"
            );


        if (applyButton) {

            applyButton.addEventListener(
                "click",
                function () {

                    if (
                        applyButton.disabled
                    ) {

                        window.location.href =
                            "applications.html";

                        return;

                    }


                    applyToOpportunity(
                        item
                    );

                }
            );

        }

    }


    /* =========================================================
       APPLY TO OPPORTUNITY
       ========================================================= */

    async function applyToOpportunity(
        opportunity
    ) {

        const match =
            calculateMatch(
                opportunity
            );


        try {

            /*
            -----------------------------------------------------
            | Send application to MySQL through PHP
            -----------------------------------------------------
            */

            const response =
                await fetch(
                    APPLICATION_API,
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

                                opportunityId:
                                    Number(
                                        opportunity.id
                                    ),

                                matchPercentage:
                                    match.score,

                                coverLetter:
                                    ""

                            })
                    }
                );


            const data =
                await response.json();


            console.log(
                "CampusHire Application API:",
                data
            );


            if (!data.success) {

                /*
                -------------------------------------------------
                | Already applied
                -------------------------------------------------
                */

                if (
                    data.applicationId
                ) {

                    alert(
                        data.message ||
                        "You have already applied for this opportunity."
                    );

                    window.location.href =
                        "applications.html";

                    return;

                }


                throw new Error(
                    data.message ||
                    "Unable to submit application."
                );

            }


            /*
            -----------------------------------------------------
            | Save a temporary frontend mirror.
            |
            | This keeps the existing My Applications page
            | working until that page is migrated to MySQL.
            -----------------------------------------------------
            */

            const applications =
                getApplications();


            const applicationMirror = {

                applicationId:
                    data.applicationId,

                opportunityId:
                    opportunity.id,

                studentId:
                    student.basic.studentId ||
                    "",

                studentName:
                    student.basic.fullName ||
                    "Student",

                studentEmail:
                    student.basic.collegeEmail ||
                    "",

                title:
                    opportunity.title,

                role:
                    opportunity.role,

                company:
                    opportunity.company,

                location:
                    opportunity.location,

                workMode:
                    opportunity.workMode,

                industry:
                    opportunity.industry,

                package:
                    opportunity.package,

                requiredSkills:
                    opportunity.requiredSkills,

                matchedSkills:
                    match.matchedSkills,

                missingSkills:
                    match.missingSkills,

                matchPercentage:
                    match.score,

                cgpa:
                    student.education.cgpa ||
                    "",

                backlogs:
                    student.education.backlogs ||
                    0,

                graduationYear:
                    student.education.graduationYear ||
                    "",

                projectCount:
                    student.projects.length,

                certificationCount:
                    student.certifications.length,

                status:
                    "Applied",

                appliedAt:
                    new Date().toISOString()

            };


            /*
            -----------------------------------------------------
            | Remove any old local duplicate first.
            -----------------------------------------------------
            */

            const cleanedApplications =
                applications.filter(
                    function (application) {

                        return !(
                            Number(
                                application.opportunityId
                            ) ===
                            Number(
                                opportunity.id
                            ) &&

                            normalize(
                                application.studentId ||
                                application.studentEmail ||
                                application.collegeEmail
                            ) ===
                            normalize(
                                student.basic.studentId ||
                                student.basic.collegeEmail
                            )
                        );

                    }
                );


            cleanedApplications.push(
                applicationMirror
            );


            writeStorage(
                "campusHireApplications",
                cleanedApplications
            );


            alert(
                "Application submitted successfully!"
            );


            window.location.href =
                "applications.html";


        } catch (error) {

            console.error(
                "Application submission error:",
                error
            );


            alert(
                error.message ||
                "Unable to submit application. Please try again."
            );

        }

    }


    /* =========================================================
       RENDER
       ========================================================= */

    let results = [];


    function render(
        filteredResults
    ) {

        if (!grid) {
            return;
        }


        grid.innerHTML = "";


        if (opportunityCount) {

            opportunityCount.textContent =
                filteredResults.length;

        }


        if (
            filteredResults.length === 0
        ) {

            grid.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No opportunities found
                    </h3>

                    <p>
                        Try changing your filters.
                    </p>

                </div>

            `;

            return;

        }


        filteredResults.forEach(
            function (result) {

                grid.appendChild(
                    createCard(result)
                );

            }
        );

    }


    /* =========================================================
       FILTERS
       ========================================================= */

    function populateSelect(
        select,
        values,
        label
    ) {

        if (!select) {
            return;
        }


        const uniqueValues =
            [
                ...new Set(
                    values.filter(Boolean)
                )
            ].sort();


        select.innerHTML =
            `<option value="">
                ${escapeHTML(label)}
             </option>`;


        uniqueValues.forEach(
            function (value) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    value;


                option.textContent =
                    value;


                select.appendChild(
                    option
                );

            }
        );

    }


    function applyFilters() {

        let filtered =
            [...results];


        if (
            roleFilter &&
            roleFilter.value
        ) {

            filtered =
                filtered.filter(
                    function (result) {

                        return (
                            normalize(
                                result.opportunity.role
                            ) ===
                            normalize(
                                roleFilter.value
                            )
                        );

                    }
                );

        }


        if (
            locationFilter &&
            locationFilter.value
        ) {

            filtered =
                filtered.filter(
                    function (result) {

                        return (
                            normalize(
                                result.opportunity.location
                            ) ===
                            normalize(
                                locationFilter.value
                            )
                        );

                    }
                );

        }


        if (
            workModeFilter &&
            workModeFilter.value
        ) {

            filtered =
                filtered.filter(
                    function (result) {

                        return (
                            normalize(
                                result.opportunity.workMode
                            ) ===
                            normalize(
                                workModeFilter.value
                            )
                        );

                    }
                );

        }


        if (
            matchFilter &&
            matchFilter.value
        ) {

            const minimum =
                Number(
                    matchFilter.value
                );


            filtered =
                filtered.filter(
                    function (result) {

                        return (
                            result.score >=
                            minimum
                        );

                    }
                );

        }


        filtered.sort(
            function (a, b) {

                return (
                    b.score -
                    a.score
                );

            }
        );


        render(
            filtered
        );

    }


    function setupFilters(
        opportunities
    ) {

        populateSelect(
            roleFilter,
            opportunities.map(
                function (item) {
                    return item.role;
                }
            ),
            "All Roles"
        );


        populateSelect(
            locationFilter,
            opportunities.map(
                function (item) {
                    return item.location;
                }
            ),
            "All Locations"
        );


        populateSelect(
            workModeFilter,
            opportunities.map(
                function (item) {
                    return item.workMode;
                }
            ),
            "All Work Modes"
        );


        [
            roleFilter,
            locationFilter,
            workModeFilter,
            matchFilter
        ]
            .filter(Boolean)
            .forEach(
                function (element) {

                    element.addEventListener(
                        "change",
                        applyFilters
                    );

                }
            );

    }


    /* =========================================================
       CARD EVENTS
       ========================================================= */

    if (grid) {

        grid.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (!button) {
                    return;
                }


                const opportunityId =
                    button.dataset.id;


                if (!opportunityId) {
                    return;
                }


                const result =
                    results.find(
                        function (item) {

                            return (
                                String(
                                    item.opportunity.id
                                ) ===
                                String(
                                    opportunityId
                                )
                            );

                        }
                    );


                if (!result) {
                    return;
                }


                if (
                    button.classList.contains(
                        "view-details"
                    )
                ) {

                    showDetails(
                        result
                    );

                }


                if (
                    button.classList.contains(
                        "apply-opportunity"
                    )
                ) {

                    if (
                        !button.disabled
                    ) {

                        applyToOpportunity(
                            result.opportunity
                        );

                    }

                }

            }
        );

    }


    /* =========================================================
       LOAD OPPORTUNITIES FROM MYSQL
       ========================================================= */

    async function loadOpportunities() {

        if (grid) {

            grid.innerHTML = `

                <div class="empty-state">

                    <h3>
                        Loading opportunities...
                    </h3>

                    <p>
                        Fetching live opportunities from CampusHire.
                    </p>

                </div>

            `;

        }


        try {

            const response =
                await fetch(
                    OPPORTUNITIES_API,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            console.log(
                "CampusHire Opportunities API:",
                data
            );


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load opportunities."
                );

            }


            const opportunities =
                Array.isArray(
                    data.opportunities
                )
                    ? data.opportunities
                    : [];


            results =
                opportunities.map(
                    function (opportunity) {

                        const match =
                            calculateMatch(
                                opportunity
                            );


                        return {

                            opportunity,

                            score:
                                match.score,

                            matchedSkills:
                                match.matchedSkills,

                            missingSkills:
                                match.missingSkills

                        };

                    }
                );


            results.sort(
                function (a, b) {

                    return (
                        b.score -
                        a.score
                    );

                }
            );


            setupFilters(
                opportunities
            );


            render(
                results
            );


            console.log(
                "Live MySQL opportunities:",
                opportunities.length
            );


        } catch (error) {

            console.error(
                "Opportunity loading error:",
                error
            );


            if (grid) {

                grid.innerHTML = `

                    <div class="empty-state">

                        <h3>
                            Unable to load opportunities
                        </h3>

                        <p>
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
       INITIAL LOAD
       ========================================================= */

    loadOpportunities();

});