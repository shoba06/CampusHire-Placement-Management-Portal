// =====================================================
// CAMPUSHIRE - STUDENT PROJECTS & CERTIFICATIONS
// STEP 04 - EXPERIENCE EVIDENCE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    // =================================================
    // ELEMENTS - PROJECT
    // =================================================

    const projectTitle =
        document.getElementById("projectTitle");

    const projectType =
        document.getElementById("projectType");

    const projectStatus =
        document.getElementById("projectStatus");

    const projectDescription =
        document.getElementById("projectDescription");

    const projectTechnologies =
        document.getElementById("projectTechnologies");

    const projectRole =
        document.getElementById("projectRole");

    const projectGithub =
        document.getElementById("projectGithub");

    const projectDemo =
        document.getElementById("projectDemo");

    const projectList =
        document.getElementById("projectList");

    const projectEmptyState =
        document.getElementById("projectEmptyState");

    const addProjectButton =
        document.getElementById("addProjectButton");


    // =================================================
    // ELEMENTS - CERTIFICATION
    // =================================================

    const certificationName =
        document.getElementById("certificationName");

    const certificationOrganization =
        document.getElementById(
            "certificationOrganization"
        );

    const certificationYear =
        document.getElementById(
            "certificationYear"
        );

    const credentialId =
        document.getElementById(
            "credentialId"
        );

    const credentialUrl =
        document.getElementById(
            "credentialUrl"
        );

    const certificationList =
        document.getElementById(
            "certificationList"
        );

    const certificationEmptyState =
        document.getElementById(
            "certificationEmptyState"
        );

    const addCertificationButton =
        document.getElementById(
            "addCertificationButton"
        );


    // =================================================
    // COMMON ELEMENTS
    // =================================================

    const formMessage =
        document.getElementById(
            "formMessage"
        );

    const backButton =
        document.getElementById(
            "backButton"
        );

    const continueButton =
        document.getElementById(
            "continueButton"
        );


    // =================================================
    // SAFETY CHECK
    // =================================================

    if (
        !projectTitle ||
        !projectType ||
        !projectStatus ||
        !projectDescription ||
        !projectTechnologies ||
        !projectRole ||
        !projectGithub ||
        !projectDemo ||
        !projectList ||
        !projectEmptyState ||
        !addProjectButton ||
        !certificationName ||
        !certificationOrganization ||
        !certificationYear ||
        !credentialId ||
        !credentialUrl ||
        !certificationList ||
        !certificationEmptyState ||
        !addCertificationButton ||
        !formMessage ||
        !backButton ||
        !continueButton
    ) {

        console.error(
            "CampusHire: One or more Step 04 elements were not found."
        );

        return;
    }


    // =================================================
    // API CONFIGURATION
    // =================================================

    /*
     * Current page:
     *
     * /CampusHire/pages/student-projects.html
     *
     * Backend:
     *
     * /CampusHire/php/student/projects.php
     */

    const PROJECTS_API_URL =
        "../php/student/projects.php";


    // =================================================
    // DATA
    // =================================================

    let projects = [];

    let certifications = [];


    // =================================================
    // MESSAGE FUNCTIONS
    // =================================================

    function showMessage(
        message,
        type
    ) {

        formMessage.textContent =
            message;

        formMessage.className =
            "form-message " + type;
    }


    function clearMessage() {

        formMessage.textContent =
            "";

        formMessage.className =
            "form-message";
    }


    // =================================================
    // GET STUDENT USER ID
    // =================================================

    function getStudentUserId() {

        const savedBasicProfile =
            localStorage.getItem(
                "campusHireBasicProfile"
            );


        if (!savedBasicProfile) {

            return null;
        }


        try {

            const basicProfile =
                JSON.parse(
                    savedBasicProfile
                );


            const userId =
                Number(
                    basicProfile.userId
                );


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return null;
            }


            return userId;


        } catch (error) {

            console.error(
                "CampusHire: Invalid basic profile.",
                error
            );

            return null;
        }
    }


    // =================================================
    // CLEAR PROJECT FORM
    // =================================================

    function clearProjectForm() {

        projectTitle.value =
            "";

        projectType.value =
            "";

        projectStatus.value =
            "";

        projectDescription.value =
            "";

        projectTechnologies.value =
            "";

        projectRole.value =
            "";

        projectGithub.value =
            "";

        projectDemo.value =
            "";
    }


    // =================================================
    // CLEAR CERTIFICATION FORM
    // =================================================

    function clearCertificationForm() {

        certificationName.value =
            "";

        certificationOrganization.value =
            "";

        certificationYear.value =
            "";

        credentialId.value =
            "";

        credentialUrl.value =
            "";
    }


    // =================================================
    // SAVE LOCAL FRONTEND DATA
    // =================================================

    function saveData() {

        const projectsData = {

            projects:
                projects,

            certifications:
                certifications
        };


        localStorage.setItem(
            "campusHireProjectsProfile",
            JSON.stringify(
                projectsData
            )
        );
    }


    // =================================================
    // LOAD SAVED DATA
    // =================================================

    function loadSavedData() {

        let savedData =
            localStorage.getItem(
                "campusHireProjectsProfile"
            );


        /*
         * Keep compatibility with older Stage 1 data.
         */

        if (!savedData) {

            const oldSessionData =
                sessionStorage.getItem(
                    "campusHireProjectsProfile"
                );


            if (oldSessionData) {

                localStorage.setItem(
                    "campusHireProjectsProfile",
                    oldSessionData
                );

                savedData =
                    oldSessionData;
            }
        }


        if (!savedData) {

            renderProjects();

            renderCertifications();

            return;
        }


        try {

            const data =
                JSON.parse(
                    savedData
                );


            if (
                Array.isArray(
                    data.projects
                )
            ) {

                projects =
                    data.projects;
            }


            if (
                Array.isArray(
                    data.certifications
                )
            ) {

                certifications =
                    data.certifications;
            }


            renderProjects();

            renderCertifications();


        } catch (error) {

            console.error(
                "CampusHire: Unable to load Step 04 data.",
                error
            );


            projects = [];

            certifications = [];

            renderProjects();

            renderCertifications();
        }
    }


    // =================================================
    // RENDER PROJECTS
    // =================================================

    function renderProjects() {

        projectList.innerHTML =
            "";


        if (
            projects.length === 0
        ) {

            projectList.appendChild(
                projectEmptyState
            );

            return;
        }


        projects.forEach(
            function (project, index) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "added-item project-item";


                card.innerHTML = `

                    <div class="item-header">

                        <div>

                            <span class="item-number">
                                PROJECT ${index + 1}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    project.title
                                )}
                            </h3>

                        </div>

                        <button
                            type="button"
                            class="delete-button"
                            data-project-index="${index}"
                            aria-label="Delete project"
                        >
                            ×
                        </button>

                    </div>


                    <div class="item-meta">

                        <span>
                            📌 ${escapeHtml(
                                project.type
                            )}
                        </span>

                        <span>
                            ${escapeHtml(
                                project.status
                            )}
                        </span>

                    </div>


                    <p class="item-description">
                        ${escapeHtml(
                            project.description
                        )}
                    </p>


                    <div class="technology-list">

                        ${
                            renderTechnologies(
                                project.technologies
                            )
                        }

                    </div>


                    <div class="item-details">

                        <div>

                            <strong>
                                Your Role
                            </strong>

                            <span>
                                ${escapeHtml(
                                    project.role
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="item-links">

                        ${
                            project.github
                                ? `
                                    <a
                                        href="${escapeAttribute(
                                            project.github
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        GitHub ↗
                                    </a>
                                  `
                                : ""
                        }

                        ${
                            project.demo
                                ? `
                                    <a
                                        href="${escapeAttribute(
                                            project.demo
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Live Demo ↗
                                    </a>
                                  `
                                : ""
                        }

                    </div>

                `;


                projectList.appendChild(
                    card
                );
            }
        );


        // =================================================
        // DELETE PROJECT
        // =================================================

        const deleteButtons =
            document.querySelectorAll(
                ".project-item .delete-button"
            );


        deleteButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset
                                    .projectIndex
                            );


                        if (
                            Number.isInteger(index) &&
                            index >= 0 &&
                            index < projects.length
                        ) {

                            projects.splice(
                                index,
                                1
                            );

                            saveData();

                            renderProjects();
                        }

                    }
                );
            }
        );
    }


    // =================================================
    // ADD PROJECT
    // =================================================

    addProjectButton.addEventListener(
        "click",
        function () {

            clearMessage();


            const title =
                projectTitle.value.trim();

            const type =
                projectType.value;

            const status =
                projectStatus.value;

            const description =
                projectDescription.value.trim();

            const technologies =
                projectTechnologies.value.trim();

            const role =
                projectRole.value.trim();

            const github =
                projectGithub.value.trim();

            const demo =
                projectDemo.value.trim();


            // =========================================
            // VALIDATION
            // =========================================

            if (!title) {

                showMessage(
                    "Please enter your project title.",
                    "error"
                );

                projectTitle.focus();

                return;
            }


            if (title.length > 200) {

                showMessage(
                    "Project title must not exceed 200 characters.",
                    "error"
                );

                projectTitle.focus();

                return;
            }


            if (!type) {

                showMessage(
                    "Please select your project type.",
                    "error"
                );

                projectType.focus();

                return;
            }


            if (!status) {

                showMessage(
                    "Please select your project status.",
                    "error"
                );

                projectStatus.focus();

                return;
            }


            if (!description) {

                showMessage(
                    "Please describe your project.",
                    "error"
                );

                projectDescription.focus();

                return;
            }


            if (
                description.length < 10
            ) {

                showMessage(
                    "Please provide a little more detail about the project.",
                    "error"
                );

                projectDescription.focus();

                return;
            }


            if (!technologies) {

                showMessage(
                    "Please enter the technologies used.",
                    "error"
                );

                projectTechnologies.focus();

                return;
            }


            if (
                technologies.length < 2
            ) {

                showMessage(
                    "Please enter the technologies used.",
                    "error"
                );

                projectTechnologies.focus();

                return;
            }


            if (!role) {

                showMessage(
                    "Please enter your role in the project.",
                    "error"
                );

                projectRole.focus();

                return;
            }


            if (
                role.length > 150
            ) {

                showMessage(
                    "Your project role is too long.",
                    "error"
                );

                projectRole.focus();

                return;
            }


            // =========================================
            // URL VALIDATION
            // =========================================

            if (
                github &&
                !isValidUrl(github)
            ) {

                showMessage(
                    "Please enter a valid GitHub/repository URL.",
                    "error"
                );

                projectGithub.focus();

                return;
            }


            if (
                demo &&
                !isValidUrl(demo)
            ) {

                showMessage(
                    "Please enter a valid live demo URL.",
                    "error"
                );

                projectDemo.focus();

                return;
            }


            // =========================================
            // CREATE PROJECT
            // =========================================

            const project = {

                title:
                    title,

                type:
                    type,

                status:
                    status,

                description:
                    description,

                technologies:
                    technologies,

                role:
                    role,

                github:
                    github,

                demo:
                    demo
            };


            projects.push(
                project
            );


            saveData();

            renderProjects();

            clearProjectForm();


            showMessage(
                "Project added successfully.",
                "success"
            );
        }
    );


    // =================================================
    // RENDER CERTIFICATIONS
    // =================================================

    function renderCertifications() {

        certificationList.innerHTML =
            "";


        if (
            certifications.length === 0
        ) {

            certificationList.appendChild(
                certificationEmptyState
            );

            return;
        }


        certifications.forEach(
            function (
                certification,
                index
            ) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "added-item certification-item";


                card.innerHTML = `

                    <div class="item-header">

                        <div>

                            <span class="item-number">
                                CERTIFICATION ${index + 1}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    certification.name
                                )}
                            </h3>

                        </div>


                        <button
                            type="button"
                            class="delete-button"
                            data-certification-index="${index}"
                            aria-label="Delete certification"
                        >
                            ×
                        </button>

                    </div>


                    <div class="certification-details">

                        <div>

                            <strong>
                                Issued By
                            </strong>

                            <span>
                                ${escapeHtml(
                                    certification.organization
                                )}
                            </span>

                        </div>


                        <div>

                            <strong>
                                Issue Year
                            </strong>

                            <span>
                                ${escapeHtml(
                                    certification.year
                                )}
                            </span>

                        </div>


                        ${
                            certification.credentialId
                                ? `
                                    <div>

                                        <strong>
                                            Credential ID
                                        </strong>

                                        <span>
                                            ${escapeHtml(
                                                certification.credentialId
                                            )}
                                        </span>

                                    </div>
                                  `
                                : ""
                        }

                    </div>


                    ${
                        certification.credentialUrl
                            ? `
                                <div class="item-links">

                                    <a
                                        href="${escapeAttribute(
                                            certification.credentialUrl
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Verify Credential ↗
                                    </a>

                                </div>
                              `
                            : ""
                    }

                `;


                certificationList.appendChild(
                    card
                );
            }
        );


        // =================================================
        // DELETE CERTIFICATION
        // =================================================

        const deleteButtons =
            document.querySelectorAll(
                ".certification-item .delete-button"
            );


        deleteButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset
                                    .certificationIndex
                            );


                        if (
                            Number.isInteger(index) &&
                            index >= 0 &&
                            index < certifications.length
                        ) {

                            certifications.splice(
                                index,
                                1
                            );

                            saveData();

                            renderCertifications();
                        }

                    }
                );
            }
        );
    }


    // =================================================
    // ADD CERTIFICATION
    // =================================================

    addCertificationButton.addEventListener(
        "click",
        function () {

            clearMessage();


            const name =
                certificationName.value.trim();

            const organization =
                certificationOrganization.value.trim();

            const year =
                certificationYear.value;

            const credential =
                credentialId.value.trim();

            const credentialLink =
                credentialUrl.value.trim();


            // =========================================
            // VALIDATION
            // =========================================

            if (!name) {

                showMessage(
                    "Please enter the certification name.",
                    "error"
                );

                certificationName.focus();

                return;
            }


            if (!organization) {

                showMessage(
                    "Please enter the issuing organization.",
                    "error"
                );

                certificationOrganization.focus();

                return;
            }


            if (!year) {

                showMessage(
                    "Please select the certification issue year.",
                    "error"
                );

                certificationYear.focus();

                return;
            }


            if (
                credentialLink &&
                !isValidUrl(
                    credentialLink
                )
            ) {

                showMessage(
                    "Please enter a valid credential/verification URL.",
                    "error"
                );

                credentialUrl.focus();

                return;
            }


            // =========================================
            // CREATE CERTIFICATION
            // =========================================

            const certification = {

                name:
                    name,

                organization:
                    organization,

                year:
                    year,

                credentialId:
                    credential,

                credentialUrl:
                    credentialLink
            };


            certifications.push(
                certification
            );


            saveData();

            renderCertifications();

            clearCertificationForm();


            showMessage(
                "Certification added successfully.",
                "success"
            );
        }
    );


    // =================================================
    // BACK BUTTON
    // =================================================

    backButton.addEventListener(
        "click",
        function () {

            window.location.href =
                "student-skills.html";

        }
    );


    // =================================================
    // CONTINUE TO STEP 05
    // =================================================

    continueButton.addEventListener(
        "click",
        async function () {

            clearMessage();


            // =========================================
            // REQUIRE AT LEAST ONE PROJECT
            // =========================================

            if (
                projects.length === 0
            ) {

                showMessage(
                    "Please add at least one project before continuing.",
                    "error"
                );

                return;
            }


            // =========================================
            // GET STUDENT USER ID
            // =========================================

            const userId =
                getStudentUserId();


            if (!userId) {

                showMessage(
                    "Student account information was not found. Please complete Step 01 registration again.",
                    "error"
                );

                return;
            }


            // =========================================
            // LOADING STATE
            // =========================================

            setLoadingState(true);


            // =========================================
            // PREPARE DATA
            // =========================================

            const payload = {

                userId:
                    userId,

                projects:
                    projects,

                certifications:
                    certifications
            };


            // =========================================
            // SEND TO PHP
            // =========================================

            try {

                const response =
                    await fetch(
                        PROJECTS_API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                // -------------------------------------
                // READ RESPONSE
                // -------------------------------------

                const rawResponse =
                    await response.text();


                let result;


                try {

                    result =
                        JSON.parse(
                            rawResponse
                        );

                } catch (jsonError) {

                    console.error(
                        "CampusHire: Invalid Step 04 server response.",
                        rawResponse
                    );


                    showMessage(
                        "The server returned an invalid response. Please try again.",
                        "error"
                    );


                    setLoadingState(false);

                    return;
                }


                // =====================================
                // SUCCESS
                // =====================================

                if (
                    response.ok &&
                    result.success === true
                ) {

                    /*
                     * Save the current frontend state too.
                     * MySQL is now the permanent backend.
                     */

                    saveData();


                    showMessage(
                        "Projects and certifications saved successfully!",
                        "success"
                    );


                    continueButton.innerHTML =
                        "Profile Details Saved ✓";


                    continueButton.classList.add(
                        "completed-button"
                    );


                    continueButton.disabled =
                        true;


                    // =================================
                    // MOVE TO STEP 05
                    // =================================

                    setTimeout(
                        function () {

                            window.location.href =
                                "student-career.html";

                        },
                        1000
                    );


                    return;
                }


                // =====================================
                // BACKEND ERROR
                // =====================================

                showMessage(
                    result.message ||
                    "Projects and certifications could not be saved.",
                    "error"
                );


            } catch (error) {

                console.error(
                    "CampusHire: Step 04 request failed.",
                    error
                );


                showMessage(
                    "Unable to connect to the CampusHire server. Make sure Apache and MySQL are running.",
                    "error"
                );
            }


            setLoadingState(false);

        }
    );


    // =================================================
    // LOADING STATE
    // =================================================

    function setLoadingState(
        isLoading
    ) {

        if (!continueButton) {
            return;
        }


        if (isLoading) {

            continueButton.disabled =
                true;

            continueButton.innerHTML =
                "Saving Profile..." +
                " <span>...</span>";

        } else {

            continueButton.disabled =
                false;

            continueButton.innerHTML =
                "Continue to Career Preferences" +
                " <span>→</span>";

        }
    }


    // =================================================
    // URL VALIDATION
    // =================================================

    function isValidUrl(
        value
    ) {

        try {

            const url =
                new URL(value);


            return (
                url.protocol === "http:" ||
                url.protocol === "https:"
            );

        } catch (error) {

            return false;
        }
    }


    // =================================================
    // HTML ESCAPING
    // =================================================

    function escapeHtml(
        value
    ) {

        return String(value)
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
    // ATTRIBUTE ESCAPING
    // =================================================

    function escapeAttribute(
        value
    ) {

        return escapeHtml(value);
    }


    // =================================================
    // TECHNOLOGY TAGS
    // =================================================

    function renderTechnologies(
        technologies
    ) {

        if (!technologies) {

            return "";
        }


        return String(
            technologies
        )
            .split(",")
            .map(
                function (technology) {

                    const cleanTechnology =
                        technology.trim();


                    if (
                        cleanTechnology === ""
                    ) {

                        return "";
                    }


                    return `
                        <span>
                            ${escapeHtml(
                                cleanTechnology
                            )}
                        </span>
                    `;
                }
            )
            .join("");
    }


    // =================================================
    // INITIAL LOAD
    // =================================================

    loadSavedData();


    // =================================================
    // CONFIRM JAVASCRIPT LOADED
    // =================================================

    console.log(
        "CampusHire Student Projects JS loaded successfully."
    );

});