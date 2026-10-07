// =====================================================
// CAMPUSHIRE - STUDENT EDUCATION
// STEP 02 - EDUCATION DETAILS
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    // =================================================
    // GET FORM ELEMENTS
    // =================================================

    const educationForm =
        document.getElementById("educationForm");

    const degreeInput =
        document.getElementById("degree");

    const departmentInput =
        document.getElementById("department");

    const collegeInput =
        document.getElementById("college");

    const currentYearInput =
        document.getElementById("currentYear");

    const graduationYearInput =
        document.getElementById("graduationYear");

    const cgpaInput =
        document.getElementById("cgpa");

    const backlogsInput =
        document.getElementById("backlogs");

    const continueButton =
        document.getElementById(
            "educationContinueButton"
        );


    // =================================================
    // SAFETY CHECK
    // =================================================

    if (!educationForm) {

        console.error(
            "CampusHire: educationForm was not found."
        );

        return;
    }


    // =================================================
    // API CONFIGURATION
    // =================================================

    /*
     * Current page:
     *
     * /CampusHire/pages/student-education.html
     *
     * Backend:
     *
     * /CampusHire/php/student/education.php
     */

    const EDUCATION_API_URL =
        "../php/student/education.php";


    // =================================================
    // LOAD PREVIOUSLY SAVED DATA
    // =================================================

    loadSavedEducation();


    // =================================================
    // FORM SUBMISSION
    // =================================================

    educationForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessages();


            // =========================================
            // GET VALUES
            // =========================================

            const degree =
                degreeInput.value.trim();

            const department =
                departmentInput.value.trim();

            const college =
                collegeInput.value.trim();

            const currentYear =
                currentYearInput.value.trim();

            const graduationYear =
                graduationYearInput.value.trim();

            const cgpa =
                cgpaInput.value.trim();

            const backlogs =
                backlogsInput.value.trim();


            // =========================================
            // DEGREE VALIDATION
            // =========================================

            if (degree === "") {

                showError(
                    degreeInput,
                    "Please select your degree."
                );

                degreeInput.focus();

                return;
            }


            // =========================================
            // DEPARTMENT VALIDATION
            // =========================================

            if (department === "") {

                showError(
                    departmentInput,
                    "Please select your department."
                );

                departmentInput.focus();

                return;
            }


            // =========================================
            // COLLEGE VALIDATION
            // =========================================

            if (college === "") {

                showError(
                    collegeInput,
                    "Please enter your college name."
                );

                collegeInput.focus();

                return;
            }


            if (college.length < 3) {

                showError(
                    collegeInput,
                    "Please enter a valid college name."
                );

                collegeInput.focus();

                return;
            }


            if (college.length > 200) {

                showError(
                    collegeInput,
                    "College name must not exceed 200 characters."
                );

                collegeInput.focus();

                return;
            }


            // =========================================
            // CURRENT YEAR VALIDATION
            // =========================================

            if (currentYear === "") {

                showError(
                    currentYearInput,
                    "Please select your current year."
                );

                currentYearInput.focus();

                return;
            }


            if (
                !["1", "2", "3", "4"]
                    .includes(currentYear)
            ) {

                showError(
                    currentYearInput,
                    "Please select a valid current year."
                );

                currentYearInput.focus();

                return;
            }


            // =========================================
            // GRADUATION YEAR VALIDATION
            // =========================================

            if (graduationYear === "") {

                showError(
                    graduationYearInput,
                    "Please select your expected graduation year."
                );

                graduationYearInput.focus();

                return;
            }


            const graduationYearValue =
                Number(graduationYear);


            const currentYearNumber =
                new Date().getFullYear();


            if (
                Number.isNaN(graduationYearValue) ||
                graduationYearValue < 2020 ||
                graduationYearValue > currentYearNumber + 10
            ) {

                showError(
                    graduationYearInput,
                    "Please select a valid graduation year."
                );

                graduationYearInput.focus();

                return;
            }


            // =========================================
            // CGPA VALIDATION
            // =========================================

            if (cgpa === "") {

                showError(
                    cgpaInput,
                    "Please enter your current CGPA."
                );

                cgpaInput.focus();

                return;
            }


            const cgpaValue =
                Number(cgpa);


            if (
                Number.isNaN(cgpaValue) ||
                cgpaValue < 0 ||
                cgpaValue > 10
            ) {

                showError(
                    cgpaInput,
                    "CGPA must be between 0 and 10."
                );

                cgpaInput.focus();

                return;
            }


            // =========================================
            // BACKLOG VALIDATION
            // =========================================

            if (backlogs === "") {

                showError(
                    backlogsInput,
                    "Please select your current backlog status."
                );

                backlogsInput.focus();

                return;
            }


            const validBacklogValues = [
                "0",
                "1-2",
                "3-5",
                "5+"
            ];


            if (
                !validBacklogValues.includes(
                    backlogs
                )
            ) {

                showError(
                    backlogsInput,
                    "Please select a valid backlog status."
                );

                backlogsInput.focus();

                return;
            }


            // =========================================
            // GET STUDENT USER ID
            // =========================================

            const savedBasicProfile =
                localStorage.getItem(
                    "campusHireBasicProfile"
                );


            if (!savedBasicProfile) {

                showServerError(
                    "Student registration information was not found. Please complete Step 01 first."
                );

                return;
            }


            let basicProfile;


            try {

                basicProfile =
                    JSON.parse(
                        savedBasicProfile
                    );

            } catch (error) {

                console.error(
                    "CampusHire: Invalid basic profile data.",
                    error
                );

                showServerError(
                    "Your registration information is invalid. Please complete Step 01 again."
                );

                return;
            }


            const userId =
                Number(
                    basicProfile.userId
                );


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                showServerError(
                    "Student account information is missing. Please complete Step 01 registration again."
                );

                return;
            }


            // =========================================
            // DISABLE BUTTON
            // =========================================

            setLoadingState(true);


            // =========================================
            // PREPARE BACKEND DATA
            // =========================================

            const educationData = {

                userId:
                    userId,

                degree:
                    degree,

                department:
                    department,

                college:
                    college,

                currentYear:
                    currentYear,

                graduationYear:
                    graduationYearValue,

                cgpa:
                    cgpaValue,

                backlogs:
                    backlogs
            };


            // =========================================
            // SEND DATA TO PHP
            // =========================================

            try {

                const response =
                    await fetch(
                        EDUCATION_API_URL,
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
                                    educationData
                                )
                        }
                    );


                // =====================================
                // READ SERVER RESPONSE
                // =====================================

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
                            "CampusHire: Invalid education server response.",
                            rawResponse
                        );

                        showServerError(
                            "The server returned an invalid response. Please try again."
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
                     * Keep the frontend profile in localStorage
                     * because the remaining Stage 2 profile pages
                     * will gradually migrate to the database.
                     *
                     * The backend remains the permanent source
                     * for Step 02 education information.
                     */

                    const educationProfile = {

                        degree:
                            degree,

                        department:
                            department,

                        college:
                            college,

                        currentYear:
                            currentYear,

                        graduationYear:
                            graduationYearValue,

                        cgpa:
                            cgpaValue,

                        /*
                         * Keep the original UI value.
                         *
                         * PHP converts this into the numeric
                         * database value:
                         *
                         * 0   → 0
                         * 1-2 → 2
                         * 3-5 → 5
                         * 5+  → 6
                         */

                        backlogs:
                            backlogs

                    };


                    localStorage.setItem(
                        "campusHireEducationProfile",
                        JSON.stringify(
                            educationProfile
                        )
                    );


                    // =================================
                    // SHOW SUCCESS
                    // =================================

                    showSuccessMessage();


                    // =================================
                    // MOVE TO STEP 03
                    // =================================

                    setTimeout(
                        function () {

                            window.location.href =
                                "student-skills.html";

                        },
                        1000
                    );


                    return;
                }


                // =====================================
                // BACKEND ERROR
                // =====================================

                showServerError(
                    result.message ||
                    "Education information could not be saved."
                );


            } catch (error) {

                console.error(
                    "CampusHire: Education request failed.",
                    error
                );


                showServerError(
                    "Unable to connect to the CampusHire server. Make sure Apache and MySQL are running."
                );

            }


            // =========================================
            // ENABLE BUTTON
            // =========================================

            setLoadingState(false);

        }
    );


    // =================================================
    // SHOW ERROR
    // =================================================

    function showError(
        input,
        message
    ) {

        if (!input) {
            return;
        }


        input.classList.add(
            "input-error-border"
        );


        const error =
            document.createElement(
                "small"
            );


        error.className =
            "field-error";


        error.textContent =
            message;


        if (input.parentElement) {

            input.parentElement.appendChild(
                error
            );
        }

    }


    // =================================================
    // SHOW SERVER ERROR
    // =================================================

    function showServerError(
        message
    ) {

        const existing =
            document.querySelector(
                ".education-server-error"
            );


        if (existing) {

            existing.remove();
        }


        const error =
            document.createElement(
                "div"
            );


        error.className =
            "education-server-error";


        error.textContent =
            message;


        /*
         * Inline styling keeps the current Stage 1 CSS
         * untouched.
         */

        error.style.marginBottom =
            "18px";

        error.style.padding =
            "12px 16px";

        error.style.borderRadius =
            "10px";

        error.style.backgroundColor =
            "#fff1f2";

        error.style.border =
            "1px solid #fecdd3";

        error.style.color =
            "#be123c";

        error.style.fontSize =
            "14px";

        error.style.lineHeight =
            "1.5";


        educationForm.insertBefore(
            error,
            educationForm.firstChild
        );

    }


    // =================================================
    // CLEAR ERROR MESSAGES
    // =================================================

    function clearMessages() {

        const errors =
            document.querySelectorAll(
                ".field-error, .education-server-error"
            );


        errors.forEach(
            function (error) {

                error.remove();

            }
        );


        const inputs =
            document.querySelectorAll(
                ".education-form input, .education-form select"
            );


        inputs.forEach(
            function (input) {

                input.classList.remove(
                    "input-error-border"
                );

            }
        );


        const success =
            document.querySelector(
                ".education-success"
            );


        if (success) {

            success.remove();

        }

    }


    // =================================================
    // SUCCESS MESSAGE
    // =================================================

    function showSuccessMessage() {

        const existing =
            document.querySelector(
                ".education-success"
            );


        if (existing) {

            existing.remove();

        }


        const success =
            document.createElement(
                "div"
            );


        success.className =
            "education-success";


        success.innerHTML = `

            <div class="success-icon">
                ✓
            </div>

            <div>

                <strong>
                    Education details completed!
                </strong>

                <span>
                    Your academic information has been saved successfully.
                </span>

            </div>

        `;


        educationForm.insertBefore(
            success,
            educationForm.firstChild
        );


        if (continueButton) {

            continueButton.innerHTML = `
                Education Complete
                <span>✓</span>
            `;

            continueButton.classList.add(
                "completed"
            );

            continueButton.disabled =
                true;
        }

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

            continueButton.innerHTML = `
                Saving Education...
                <span>...</span>
            `;

        } else {

            continueButton.disabled =
                false;

            continueButton.innerHTML = `
                Continue to Skills
                <span>→</span>
            `;

        }

    }


    // =================================================
    // REMOVE ERROR WHILE TYPING
    // =================================================

    const formFields =
        document.querySelectorAll(
            ".education-form input, .education-form select"
        );


    formFields.forEach(
        function (field) {

            field.addEventListener(
                "input",
                function () {

                    removeFieldError(field);

                }
            );


            field.addEventListener(
                "change",
                function () {

                    removeFieldError(field);

                }
            );

        }
    );


    // =================================================
    // REMOVE INDIVIDUAL ERROR
    // =================================================

    function removeFieldError(
        field
    ) {

        field.classList.remove(
            "input-error-border"
        );


        const error =
            field.parentElement
                ? field.parentElement.querySelector(
                    ".field-error"
                )
                : null;


        if (error) {

            error.remove();
        }


        const serverError =
            document.querySelector(
                ".education-server-error"
            );


        if (serverError) {

            serverError.remove();
        }

    }


    // =================================================
    // LOAD SAVED EDUCATION
    // =================================================

    function loadSavedEducation() {

        let savedEducation =
            localStorage.getItem(
                "campusHireEducationProfile"
            );


        /*
         * Keep compatibility with the old Stage 1
         * sessionStorage data.
         */

        if (!savedEducation) {

            const oldSessionData =
                sessionStorage.getItem(
                    "campusHireEducationProfile"
                );


            if (oldSessionData) {

                localStorage.setItem(
                    "campusHireEducationProfile",
                    oldSessionData
                );


                savedEducation =
                    oldSessionData;
            }

        }


        if (!savedEducation) {

            return;
        }


        try {

            const education =
                JSON.parse(
                    savedEducation
                );


            degreeInput.value =
                education.degree || "";


            departmentInput.value =
                education.department || "";


            collegeInput.value =
                education.college || "";


            currentYearInput.value =
                education.currentYear || "";


            graduationYearInput.value =
                education.graduationYear || "";


            cgpaInput.value =
                education.cgpa ?? "";


            /*
             * The frontend stores the original select value.
             *
             * This is important because the database stores a
             * numeric maximum value, while the UI uses:
             *
             * 0
             * 1-2
             * 3-5
             * 5+
             */

            if (
                [
                    "0",
                    "1-2",
                    "3-5",
                    "5+"
                ].includes(
                    String(education.backlogs)
                )
            ) {

                backlogsInput.value =
                    String(
                        education.backlogs
                    );

            } else {

                /*
                 * Backward compatibility for old numeric
                 * localStorage values.
                 */

                const numericBacklogs =
                    Number(
                        education.backlogs
                    );


                if (
                    numericBacklogs === 0
                ) {

                    backlogsInput.value =
                        "0";

                } else if (
                    numericBacklogs <= 2
                ) {

                    backlogsInput.value =
                        "1-2";

                } else if (
                    numericBacklogs <= 5
                ) {

                    backlogsInput.value =
                        "3-5";

                } else {

                    backlogsInput.value =
                        "5+";
                }

            }


            console.log(
                "CampusHire: Previous education profile loaded."
            );


        } catch (error) {

            console.error(
                "CampusHire: Unable to load saved education data.",
                error
            );

        }

    }


    // =================================================
    // CONFIRM JAVASCRIPT LOADED
    // =================================================

    console.log(
        "CampusHire Student Education JS loaded successfully."
    );

});