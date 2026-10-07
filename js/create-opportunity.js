document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | CampusHire - Create Opportunity
    | Backend-connected version
    |--------------------------------------------------------------------------
    */

    const API_URL =
        "../php/recruiter/create_opportunity.php";


    /* =========================================================
       HELPER FUNCTIONS
       ========================================================= */

    function findElement(selectors) {

        for (const selector of selectors) {

            const element =
                document.querySelector(selector);

            if (element) {
                return element;
            }

        }

        return null;

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function showMessage(message, type) {

        let messageBox =
            document.getElementById("formMessage");


        if (!messageBox) {

            messageBox =
                document.createElement("div");

            messageBox.id =
                "formMessage";

            const publishButton =
                findElement([
                    "#publishOpportunity",
                    "#publishButton",
                    ".publish-button",
                    ".complete-button",
                    "button[type='submit']"
                ]);

            if (publishButton) {

                publishButton
                    .parentElement
                    .insertBefore(
                        messageBox,
                        publishButton
                    );

            } else {

                document.body
                    .appendChild(messageBox);

            }

        }


        messageBox.textContent =
            message;


        messageBox.className =
            "form-message " + type;


        messageBox.style.display =
            "block";


        messageBox.style.padding =
            "12px 16px";


        messageBox.style.margin =
            "16px 0";


        messageBox.style.borderRadius =
            "10px";


        messageBox.style.fontWeight =
            "600";


        if (type === "success") {

            messageBox.style.background =
                "#dcfce7";

            messageBox.style.color =
                "#166534";

        } else {

            messageBox.style.background =
                "#fee2e2";

            messageBox.style.color =
                "#991b1b";

        }

    }


    /* =========================================================
       FIND FORM ELEMENTS
       ========================================================= */


    const opportunityTitle =
        findElement([
            "#opportunityTitle",
            "#title",
            "[name='opportunityTitle']",
            "[name='title']"
        ]);


    const jobRole =
        findElement([
            "#jobRole",
            "#role",
            "#roleName",
            "[name='jobRole']",
            "[name='role']",
            "[name='roleName']"
        ]);


    const opportunityType =
        findElement([
            "#opportunityType",
            "#type",
            "[name='opportunityType']",
            "[name='type']"
        ]);


    const industry =
        findElement([
            "#industry",
            "[name='industry']"
        ]);


    const location =
        findElement([
            "#location",
            "[name='location']"
        ]);


    const workMode =
        findElement([
            "#workMode",
            "[name='workMode']"
        ]);


    const packageInput =
        findElement([
            "#expectedPackage",
            "#package",
            "#packageAmount",
            "[name='expectedPackage']",
            "[name='package']",
            "[name='packageAmount']"
        ]);


    const minimumCgpa =
        findElement([
            "#minimumCgpa",
            "#minCgpa",
            "[name='minimumCgpa']",
            "[name='minCgpa']"
        ]);


    const maximumBacklogs =
        findElement([
            "#maximumBacklogs",
            "#maxBacklogs",
            "[name='maximumBacklogs']",
            "[name='maxBacklogs']"
        ]);


    const graduationYear =
        findElement([
            "#graduationYear",
            "[name='graduationYear']"
        ]);


    const description =
        findElement([
            "#description",
            "#opportunityDescription",
            "[name='description']"
        ]);


    const skillInput =
        findElement([
            "#skillInput",
            "#requiredSkill",
            "#skill",
            "input[placeholder*='Python']",
            "input[placeholder*='skill']"
        ]);


    const addSkillButton =
        findElement([
            "#addSkillButton",
            "#addSkill",
            ".add-skill-button",
            "button"
        ]);


    const publishButton =
        findElement([
            "#publishOpportunity",
            "#publishButton",
            ".publish-button",
            "button[type='submit']"
        ]);


    /* =========================================================
       SKILLS
       ========================================================= */


    let selectedSkills = [];


    function normalizeSkill(skill) {

        return String(skill)
            .trim()
            .replace(/\s+/g, " ");

    }


    function addSkill(skill) {

        skill =
            normalizeSkill(skill);


        if (!skill) {

            return;

        }


        const alreadyExists =
            selectedSkills.some(
                function (existingSkill) {

                    return (
                        existingSkill
                            .toLowerCase() ===
                        skill.toLowerCase()
                    );

                }
            );


        if (alreadyExists) {

            return;

        }


        selectedSkills.push(
            skill
        );


        renderSkills();


        updatePreview();

    }


    function removeSkill(skill) {

        selectedSkills =
            selectedSkills.filter(
                function (item) {

                    return (
                        item.toLowerCase() !==
                        skill.toLowerCase()
                    );

                }
            );


        renderSkills();


        updatePreview();

    }


    function renderSkills() {

        /*
        ---------------------------------------------------------
        Find existing skill display area
        ---------------------------------------------------------
        */

        let skillContainer =
            document.getElementById(
                "selectedSkills"
            );


        if (!skillContainer) {

            skillContainer =
                document.getElementById(
                    "skillsList"
                );

        }


        if (!skillContainer) {

            /*
            Try finding an area after the skill input.
            */

            if (skillInput) {

                const parent =
                    skillInput.parentElement
                    ?.parentElement;

                if (parent) {

                    skillContainer =
                        document.createElement(
                            "div"
                        );

                    skillContainer.id =
                        "selectedSkills";

                    skillContainer.style.marginTop =
                        "16px";

                    parent.appendChild(
                        skillContainer
                    );

                }

            }

        }


        if (!skillContainer) {

            return;

        }


        skillContainer.innerHTML = "";


        if (selectedSkills.length === 0) {

            const emptyText =
                document.createElement(
                    "span"
                );


            emptyText.textContent =
                "No skills added yet.";


            emptyText.style.color =
                "#94a3b8";


            skillContainer.appendChild(
                emptyText
            );


            return;

        }


        selectedSkills.forEach(
            function (skill) {

                const chip =
                    document.createElement(
                        "span"
                    );


                chip.style.display =
                    "inline-flex";


                chip.style.alignItems =
                    "center";


                chip.style.gap =
                    "8px";


                chip.style.padding =
                    "8px 12px";


                chip.style.margin =
                    "4px";


                chip.style.borderRadius =
                    "20px";


                chip.style.background =
                    "#eef2ff";


                chip.style.color =
                    "#3730a3";


                chip.style.fontSize =
                    "14px";


                chip.style.fontWeight =
                    "600";


                chip.textContent =
                    skill;


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.textContent =
                    "×";


                removeButton.style.border =
                    "none";


                removeButton.style.background =
                    "transparent";


                removeButton.style.cursor =
                    "pointer";


                removeButton.style.fontSize =
                    "18px";


                removeButton.style.fontWeight =
                    "700";


                removeButton.style.color =
                    "#6366f1";


                removeButton.addEventListener(
                    "click",
                    function () {

                        removeSkill(
                            skill
                        );

                    }
                );


                chip.appendChild(
                    removeButton
                );


                skillContainer.appendChild(
                    chip
                );

            }
        );

    }


    /* =========================================================
       SKILL INPUT
       ========================================================= */


    if (skillInput) {

        skillInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();


                    addSkill(
                        skillInput.value
                    );


                    skillInput.value =
                        "";

                }

            }
        );

    }


    if (addSkillButton) {

        /*
        Only attach to the button when
        it actually looks like the Add Skill button.
        */

        const buttonText =
            addSkillButton.textContent
                .trim()
                .toLowerCase();


        if (
            buttonText.includes(
                "add skill"
            )
        ) {

            addSkillButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    if (!skillInput) {
                        return;
                    }


                    addSkill(
                        skillInput.value
                    );


                    skillInput.value =
                        "";


                    skillInput.focus();

                }
            );

        }

    }


    /* =========================================================
       QUICK SKILL CHIPS
       ========================================================= */


    document
        .querySelectorAll("button")
        .forEach(
            function (button) {

                const text =
                    button.textContent
                        .trim();


                const quickSkills = [

                    "Java",
                    "Python",
                    "JavaScript",
                    "SQL",
                    "Machine Learning",
                    "Data Science",
                    "Pandas",
                    "NumPy",
                    "React",
                    "HTML",
                    "CSS",
                    "Git"

                ];


                if (
                    quickSkills.includes(text)
                ) {

                    button.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();


                            addSkill(
                                text
                            );

                        }
                    );

                }

            }
        );


    /* =========================================================
       LIVE PREVIEW
       ========================================================= */


    function getValue(element) {

        if (!element) {

            return "";

        }


        return element.value?.trim() || "";

    }


    function findPreviewElement(selectors) {

        for (
            const selector of selectors
        ) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                return element;

            }

        }


        return null;

    }


    function updatePreview() {

        const previewTitle =
            findPreviewElement([
                "#previewTitle",
                ".preview-title",
                ".candidate-title"
            ]);


        const previewCompany =
            findPreviewElement([
                "#previewCompany",
                ".preview-company"
            ]);


        const previewLocation =
            findPreviewElement([
                "#previewLocation",
                ".preview-location"
            ]);


        const previewWorkMode =
            findPreviewElement([
                "#previewWorkMode",
                ".preview-work-mode"
            ]);


        const previewPackage =
            findPreviewElement([
                "#previewPackage",
                ".preview-package"
            ]);


        const previewSkills =
            findPreviewElement([
                "#previewSkills",
                ".preview-skills"
            ]);


        if (previewTitle) {

            previewTitle.textContent =
                getValue(
                    opportunityTitle
                ) ||
                "Opportunity Title";

        }


        if (previewCompany) {

            /*
            The backend company is determined
            from the recruiter session.
            The current UI displays Nova Analytics.
            */

            previewCompany.textContent =
                "Nova Analytics";

        }


        if (previewLocation) {

            previewLocation.textContent =
                getValue(
                    location
                ) ||
                "Location";

        }


        if (previewWorkMode) {

            previewWorkMode.textContent =
                getValue(
                    workMode
                ) ||
                "Work Mode";

        }


        if (previewPackage) {

            previewPackage.textContent =
                getValue(
                    packageInput
                ) ||
                "Package";

        }


        if (previewSkills) {

            previewSkills.innerHTML =
                "";


            if (
                selectedSkills.length ===
                0
            ) {

                previewSkills.textContent =
                    "Skills will appear here";

            } else {

                selectedSkills.forEach(
                    function (skill) {

                        const span =
                            document.createElement(
                                "span"
                            );


                        span.textContent =
                            skill;


                        span.style.display =
                            "inline-block";


                        span.style.padding =
                            "5px 10px";


                        span.style.margin =
                            "3px";


                        span.style.borderRadius =
                            "15px";


                        span.style.background =
                            "#eef2ff";


                        span.style.color =
                            "#3730a3";


                        previewSkills.appendChild(
                            span
                        );

                    }
                );

            }

        }

    }


    /*
    Update preview when fields change.
    */

    [

        opportunityTitle,
        jobRole,
        opportunityType,
        industry,
        location,
        workMode,
        packageInput,
        minimumCgpa,
        maximumBacklogs,
        graduationYear,
        description

    ]
        .filter(Boolean)
        .forEach(
            function (element) {

                element.addEventListener(
                    "input",
                    updatePreview
                );


                element.addEventListener(
                    "change",
                    updatePreview
                );

            }
        );


    updatePreview();


    /* =========================================================
       VALIDATION
       ========================================================= */


    function validateForm() {

        const requiredFields = [

            {
                element:
                    opportunityTitle,
                name:
                    "Opportunity Title"
            },

            {
                element:
                    jobRole,
                name:
                    "Job Role"
            },

            {
                element:
                    opportunityType,
                name:
                    "Opportunity Type"
            },

            {
                element:
                    industry,
                name:
                    "Industry"
            },

            {
                element:
                    location,
                name:
                    "Location"
            },

            {
                element:
                    workMode,
                name:
                    "Work Mode"
            },

            {
                element:
                    packageInput,
                name:
                    "Expected Package"
            },

            {
                element:
                    minimumCgpa,
                name:
                    "Minimum CGPA"
            },

            {
                element:
                    maximumBacklogs,
                name:
                    "Maximum Backlogs"
            },

            {
                element:
                    graduationYear,
                name:
                    "Graduation Year"
            },

            {
                element:
                    description,
                name:
                    "Description"
            }

        ];


        for (
            const field of requiredFields
        ) {

            if (
                !field.element ||
                !getValue(
                    field.element
                )
            ) {

                showMessage(
                    field.name +
                    " is required.",
                    "error"
                );


                if (field.element) {

                    field.element.focus();

                }


                return false;

            }

        }


        const cgpa =
            Number(
                getValue(
                    minimumCgpa
                )
            );


        if (
            Number.isNaN(cgpa) ||
            cgpa < 0 ||
            cgpa > 10
        ) {

            showMessage(
                "Minimum CGPA must be between 0 and 10.",
                "error"
            );


            minimumCgpa.focus();


            return false;

        }


        const backlogs =
            Number(
                getValue(
                    maximumBacklogs
                )
            );


        if (
            Number.isNaN(backlogs) ||
            backlogs < 0
        ) {

            showMessage(
                "Maximum backlogs must be 0 or greater.",
                "error"
            );


            maximumBacklogs.focus();


            return false;

        }


        if (
            selectedSkills.length ===
            0
        ) {

            showMessage(
                "Add at least one required skill.",
                "error"
            );


            if (skillInput) {

                skillInput.focus();

            }


            return false;

        }


        return true;

    }


    /* =========================================================
       PACKAGE CONVERSION
       ========================================================= */


    function getPackageAmount() {

        const raw =
            getValue(
                packageInput
            );


        /*
        Example:
        "8-12 LPA"
        "8–12 LPA"
        "10 LPA"

        Current database column is DECIMAL,
        so we store the first numeric value.
        */

        const match =
            raw.match(
                /\d+(\.\d+)?/
            );


        if (!match) {

            return null;

        }


        return Number(
            match[0]
        );

    }


    /* =========================================================
       PUBLISH OPPORTUNITY
       ========================================================= */


    async function publishOpportunity(
        event
    ) {

        if (event) {

            event.preventDefault();

        }


        if (
            !validateForm()
        ) {

            return;

        }


        const packageAmount =
            getPackageAmount();


        if (
            packageAmount ===
            null
        ) {

            showMessage(
                "Enter a valid package such as 8-12 LPA.",
                "error"
            );


            packageInput.focus();


            return;

        }


        const payload = {

            title:
                getValue(
                    opportunityTitle
                ),

            roleName:
                getValue(
                    jobRole
                ),

            opportunityType:
                getValue(
                    opportunityType
                ),

            industry:
                getValue(
                    industry
                ),

            location:
                getValue(
                    location
                ),

            workMode:
                getValue(
                    workMode
                ),

            packageAmount:
                packageAmount,

            minimumCgpa:
                Number(
                    getValue(
                        minimumCgpa
                    )
                ),

            maximumBacklogs:
                Number(
                    getValue(
                        maximumBacklogs
                    )
                ),

            graduationYear:
                Number(
                    getValue(
                        graduationYear
                    )
                ),

            description:
                getValue(
                    description
                ),

            skills:
                selectedSkills.map(
                    function (skill) {

                        return {

                            name:
                                skill,

                            proficiency:
                                "Intermediate"

                        };

                    }
                )

        };


        /*
        Disable button while saving.
        */

        if (publishButton) {

            publishButton.disabled =
                true;

            publishButton.dataset.originalText =
                publishButton.innerHTML;

            publishButton.innerHTML =
                "Publishing...";

        }


        showMessage(
            "Publishing opportunity...",
            "success"
        );


        try {

            const response =
                await fetch(
                    API_URL,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            const data =
                await response.json();


            if (
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to create opportunity."
                );

            }


            /*
            -----------------------------------------------------
            Save a compatibility copy in localStorage.
            This lets the older frontend continue working while
            we migrate the remaining recruiter/student modules.
            -----------------------------------------------------
            */

            const oldOpportunities =
                JSON.parse(
                    localStorage.getItem(
                        "campusHireRecruiterOpportunities"
                    ) ||
                    "[]"
                );


            const compatibilityOpportunity = {

                id:
                    String(
                        data.opportunityId
                    ),

                title:
                    payload.title,

                role:
                    payload.roleName,

                company:
                    "Nova Analytics",

                location:
                    payload.location,

                workMode:
                    payload.workMode,

                industry:
                    payload.industry,

                package:
                    getValue(
                        packageInput
                    ),

                type:
                    payload.opportunityType,

                requiredSkills:
                    selectedSkills,

                eligibility: {

                    minCgpa:
                        payload.minimumCgpa,

                    maxBacklogs:
                        payload.maximumBacklogs,

                    graduationYear:
                        String(
                            payload.graduationYear
                        )

                },

                description:
                    payload.description,

                status:
                    "Active",

                createdAt:
                    new Date().toISOString(),

                recruiterId:
                    "recruiter001"

            };


            oldOpportunities.push(
                compatibilityOpportunity
            );


            localStorage.setItem(
                "campusHireRecruiterOpportunities",
                JSON.stringify(
                    oldOpportunities
                )
            );


            showMessage(
                "Opportunity published successfully!",
                "success"
            );


            /*
            Redirect back to recruiter dashboard
            after a short delay.
            */

            setTimeout(
                function () {

                    window.location.href =
                        "recruiter-dashboard.html";

                },
                1200
            );


        } catch (error) {

            console.error(
                "Create opportunity error:",
                error
            );


            showMessage(
                error.message ||
                "Something went wrong while creating the opportunity.",
                "error"
            );


            if (publishButton) {

                publishButton.disabled =
                    false;

                publishButton.innerHTML =
                    publishButton.dataset.originalText ||
                    "Publish Opportunity";

            }

        }

    }


    /* =========================================================
       ATTACH PUBLISH EVENT
       ========================================================= */


    if (publishButton) {

        publishButton.addEventListener(
            "click",
            publishOpportunity
        );

    }


    /*
    Also handle form submit if the page uses a form.
    */

    const form =
        document.querySelector(
            "form"
        );


    if (form) {

        form.addEventListener(
            "submit",
            publishOpportunity
        );

    }


    /* =========================================================
       BACK BUTTON
       ========================================================= */


    const backButton =
        findElement([
            "#backButton",
            "#cancelButton",
            ".back-button"
        ]);


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "recruiter-dashboard.html";

            }
        );

    }


    /* =========================================================
       INITIAL RENDER
       ========================================================= */


    renderSkills();


    updatePreview();


    console.log(
        "CampusHire Create Opportunity module loaded."
    );

});