// =====================================================
// CAMPUSHIRE - STUDENT SKILLS
// STEP 03 - SKILLS PROFILE
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    // =================================================
    // GET ELEMENTS
    // =================================================

    const skillsForm =
        document.getElementById("skillsForm");

    const skillCheckboxes =
        document.querySelectorAll(
            ".skill-card input[type='checkbox']"
        );

    const selectedSkillsContainer =
        document.getElementById("selectedSkills");

    const skillCount =
        document.getElementById("skillCount");

    const formMessage =
        document.getElementById("formMessage");

    const continueButton =
        document.getElementById(
            "skillsContinueButton"
        );

    const backButton =
        document.getElementById("backButton");


    // =================================================
    // SAFETY CHECK
    // =================================================

    if (!skillsForm) {

        console.error(
            "CampusHire: skillsForm was not found."
        );

        return;
    }


    // =================================================
    // API CONFIGURATION
    // =================================================

    /*
     * Current page:
     *
     * /CampusHire/pages/student-skills.html
     *
     * Backend:
     *
     * /CampusHire/php/student/skills.php
     */

    const SKILLS_API_URL =
        "../php/student/skills.php";


    // =================================================
    // LOAD PREVIOUSLY SAVED DATA
    // =================================================

    loadSavedSkills();


    // =================================================
    // UPDATE SELECTED SKILLS
    // =================================================

    function updateSelectedSkills() {

        const selectedSkills = [];

        skillCheckboxes.forEach(
            function (checkbox) {

                if (checkbox.checked) {

                    selectedSkills.push({
                        name: checkbox.value,
                        category:
                            checkbox.dataset.category ||
                            "Other"
                    });
                }

            }
        );


        // ---------------------------------------------
        // CLEAR PREVIOUS CHIPS
        // ---------------------------------------------

        selectedSkillsContainer.innerHTML = "";


        // ---------------------------------------------
        // NO SKILLS SELECTED
        // ---------------------------------------------

        if (selectedSkills.length === 0) {

            selectedSkillsContainer.innerHTML =
                '<div class="empty-skills">' +
                'Select skills above to build your profile.' +
                '</div>';

        }


        // ---------------------------------------------
        // DISPLAY SELECTED SKILLS
        // ---------------------------------------------

        else {

            selectedSkills.forEach(
                function (skill) {

                    const chip =
                        document.createElement("div");

                    chip.className =
                        "skill-chip";

                    chip.innerHTML =
                        "<span>" +
                        escapeHtml(skill.name) +
                        "</span>" +

                        "<button " +
                        'type="button" ' +
                        'data-skill="' +
                        escapeHtml(skill.name) +
                        '">' +
                        "×" +
                        "</button>";

                    selectedSkillsContainer
                        .appendChild(chip);

                }
            );

        }


        // ---------------------------------------------
        // UPDATE COUNT
        // ---------------------------------------------

        skillCount.textContent =
            selectedSkills.length +
            (
                selectedSkills.length === 1
                    ? " Skill"
                    : " Skills"
            );


        // ---------------------------------------------
        // REMOVE SKILL BUTTONS
        // ---------------------------------------------

        const removeButtons =
            document.querySelectorAll(
                ".skill-chip button"
            );


        removeButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const skillName =
                            button.dataset.skill;


                        skillCheckboxes.forEach(
                            function (checkbox) {

                                if (
                                    checkbox.value ===
                                    skillName
                                ) {

                                    checkbox.checked =
                                        false;
                                }

                            }
                        );


                        updateSelectedSkills();

                    }
                );

            }
        );

    }


    // =================================================
    // CHECKBOX EVENTS
    // =================================================

    skillCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    clearMessage();

                    updateSelectedSkills();

                }
            );

        }
    );


    // =================================================
    // LOAD SAVED SKILLS
    // =================================================

    function loadSavedSkills() {

        const savedSkills =
            localStorage.getItem(
                "campusHireSkillsProfile"
            );


        if (!savedSkills) {

            updateSelectedSkills();

            return;
        }


        try {

            const skillsData =
                JSON.parse(savedSkills);


            // -----------------------------------------
            // RESTORE SKILLS
            // -----------------------------------------

            if (
                Array.isArray(
                    skillsData.skills
                )
            ) {

                skillCheckboxes.forEach(
                    function (checkbox) {

                        if (
                            skillsData.skills.includes(
                                checkbox.value
                            )
                        ) {

                            checkbox.checked =
                                true;
                        }

                    }
                );

            }


            // -----------------------------------------
            // RESTORE PROFICIENCY
            // -----------------------------------------

            if (
                skillsData.proficiency
            ) {

                const proficiencyRadio =
                    document.querySelector(
                        'input[name="proficiency"][value="' +
                        skillsData.proficiency +
                        '"]'
                    );


                if (proficiencyRadio) {

                    proficiencyRadio.checked =
                        true;
                }

            }


            updateSelectedSkills();


            console.log(
                "CampusHire: Previous skills profile loaded."
            );


        } catch (error) {

            console.error(
                "CampusHire: Unable to load saved skills.",
                error
            );

            updateSelectedSkills();
        }

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
    // FORM SUBMISSION
    // =================================================

    skillsForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessage();


            // =========================================
            // COLLECT SELECTED SKILLS
            // =========================================

            const selectedSkillObjects = [];

            const selectedSkillNames = [];


            skillCheckboxes.forEach(
                function (checkbox) {

                    if (checkbox.checked) {

                        selectedSkillObjects.push({
                            name: checkbox.value,
                            category:
                                checkbox.dataset.category ||
                                "Other"
                        });


                        selectedSkillNames.push(
                            checkbox.value
                        );
                    }

                }
            );


            // =========================================
            // REMOVE DUPLICATE SKILLS
            // =========================================

            const uniqueSkillNames =
                [
                    ...new Set(
                        selectedSkillNames
                    )
                ];


            const uniqueSkillObjects = [];


            uniqueSkillNames.forEach(
                function (skillName) {

                    const existingSkill =
                        selectedSkillObjects.find(
                            function (skill) {

                                return (
                                    skill.name ===
                                    skillName
                                );
                            }
                        );


                    if (existingSkill) {

                        uniqueSkillObjects.push(
                            existingSkill
                        );
                    }

                }
            );


            // =========================================
            // GET PROFICIENCY
            // =========================================

            const proficiency =
                document.querySelector(
                    'input[name="proficiency"]:checked'
                );


            // =========================================
            // VALIDATE SKILLS
            // =========================================

            if (
                uniqueSkillObjects.length === 0
            ) {

                showMessage(
                    "Please select at least one skill.",
                    "error"
                );

                return;
            }


            // =========================================
            // VALIDATE PROFICIENCY
            // =========================================

            if (!proficiency) {

                showMessage(
                    "Please select your overall skill proficiency.",
                    "error"
                );

                return;
            }


            // =========================================
            // GET USER ID
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
            // BACKEND DATA
            // =========================================

            const skillsData = {

                userId:
                    userId,

                skills:
                    uniqueSkillObjects,

                proficiency:
                    proficiency.value
            };


            // =========================================
            // SEND TO PHP
            // =========================================

            try {

                const response =
                    await fetch(
                        SKILLS_API_URL,
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
                                    skillsData
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
                        "CampusHire: Invalid skills server response.",
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
                     * Keep localStorage for the current
                     * multi-step frontend flow.
                     *
                     * MySQL is now the permanent backend
                     * storage for the Skills module.
                     */

                    const skillsProfile = {

                        skills:
                            uniqueSkillNames,

                        proficiency:
                            proficiency.value
                    };


                    localStorage.setItem(
                        "campusHireSkillsProfile",
                        JSON.stringify(
                            skillsProfile
                        )
                    );


                    // ---------------------------------
                    // SUCCESS MESSAGE
                    // ---------------------------------

                    showMessage(
                        "Skills profile completed! Your technical skills have been saved successfully.",
                        "success"
                    );


                    // ---------------------------------
                    // SUCCESS BUTTON
                    // ---------------------------------

                    continueButton.innerHTML =
                        "Skills Complete ✓";


                    continueButton.classList.add(
                        "completed-button"
                    );


                    continueButton.disabled =
                        true;


                    // ---------------------------------
                    // GO TO STEP 04
                    // ---------------------------------

                    setTimeout(
                        function () {

                            window.location.href =
                                "student-projects.html";

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
                    "Skills profile could not be saved.",
                    "error"
                );


            } catch (error) {

                console.error(
                    "CampusHire: Skills request failed.",
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
    // BACK BUTTON
    // =================================================

    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "student-education.html";

            }
        );

    }


    // =================================================
    // SHOW MESSAGE
    // =================================================

    function showMessage(
        message,
        type
    ) {

        formMessage.textContent =
            message;

        formMessage.className =
            "form-message";

        formMessage.classList.add(
            type
        );

    }


    // =================================================
    // CLEAR MESSAGE
    // =================================================

    function clearMessage() {

        formMessage.textContent =
            "";

        formMessage.className =
            "form-message";

    }


    // =================================================
    // BUTTON LOADING STATE
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
                "Saving Skills..." +
                " <span>...</span>";

        } else {

            continueButton.disabled =
                false;

            continueButton.innerHTML =
                "Continue to Projects" +
                " <span>→</span>";

        }

    }


    // =================================================
    // ESCAPE HTML
    // =================================================

    /*
     * Keeps skill names safe when they are displayed
     * inside dynamically created skill chips.
     */

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
    // INITIAL DISPLAY
    // =================================================

    updateSelectedSkills();


    // =================================================
    // CONFIRM JAVASCRIPT LOADED
    // =================================================

    console.log(
        "CampusHire Student Skills JS loaded successfully."
    );

});