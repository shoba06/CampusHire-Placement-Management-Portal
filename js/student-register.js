// =====================================================
// CAMPUSHIRE - STUDENT REGISTRATION
// STEP 01 - BASIC INFORMATION
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    // =================================================
    // GET ELEMENTS
    // =================================================

    const basicInfoForm =
        document.getElementById("basicInfoForm");

    const fullNameInput =
        document.getElementById("fullName");

    const collegeEmailInput =
        document.getElementById("collegeEmail");

    const phoneInput =
        document.getElementById("phone");

    const studentIdInput =
        document.getElementById("studentId");

    const locationInput =
        document.getElementById("location");

    const createPasswordInput =
        document.getElementById("createPassword");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const termsInput =
        document.getElementById("terms");

    const togglePasswordButton =
        document.getElementById("togglePassword");

    const continueButton =
        document.getElementById("continueButton");


    // =================================================
    // SAFETY CHECK
    // =================================================

    if (!basicInfoForm) {

        console.error(
            "CampusHire: basicInfoForm was not found."
        );

        return;
    }


    // =================================================
    // API CONFIGURATION
    // =================================================

    /*
     * This page is inside:
     *
     * /CampusHire/pages/student-register.html
     *
     * Therefore:
     *
     * ../php/auth/register.php
     *
     * resolves to:
     *
     * /CampusHire/php/auth/register.php
     */

    const REGISTER_API_URL =
        "../php/auth/register.php";


    // =================================================
    // LOAD PREVIOUSLY SAVED PROFILE
    // =================================================

    loadSavedProfile();


    // =================================================
    // SHOW / HIDE PASSWORD
    // =================================================

    if (togglePasswordButton) {

        togglePasswordButton.addEventListener(
            "click",
            function () {

                if (
                    createPasswordInput.type === "password"
                ) {

                    createPasswordInput.type = "text";

                    togglePasswordButton.textContent =
                        "Hide";

                } else {

                    createPasswordInput.type = "password";

                    togglePasswordButton.textContent =
                        "Show";
                }

            }
        );
    }


    // =================================================
    // FORM SUBMISSION
    // =================================================

    basicInfoForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessages();


            // =========================================
            // GET VALUES
            // =========================================

            const fullName =
                fullNameInput.value.trim();

            const email =
                collegeEmailInput.value.trim();

            const phone =
                phoneInput.value.trim();

            const studentId =
                studentIdInput.value.trim();

            const location =
                locationInput.value.trim();

            const password =
                createPasswordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            // =========================================
            // FULL NAME
            // =========================================

            if (fullName === "") {

                showError(
                    fullNameInput,
                    "Please enter your full name."
                );

                fullNameInput.focus();

                return;
            }


            if (fullName.length < 3) {

                showError(
                    fullNameInput,
                    "Name must contain at least 3 characters."
                );

                fullNameInput.focus();

                return;
            }


            if (fullName.length > 150) {

                showError(
                    fullNameInput,
                    "Name must not exceed 150 characters."
                );

                fullNameInput.focus();

                return;
            }


            // =========================================
            // EMAIL
            // =========================================

            if (email === "") {

                showError(
                    collegeEmailInput,
                    "Please enter your college email."
                );

                collegeEmailInput.focus();

                return;
            }


            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailPattern.test(email)) {

                showError(
                    collegeEmailInput,
                    "Please enter a valid email address."
                );

                collegeEmailInput.focus();

                return;
            }


            // =========================================
            // PHONE
            // =========================================

            if (phone === "") {

                showError(
                    phoneInput,
                    "Please enter your mobile number."
                );

                phoneInput.focus();

                return;
            }


            const phonePattern =
                /^[6-9][0-9]{9}$/;


            if (!phonePattern.test(phone)) {

                showError(
                    phoneInput,
                    "Enter a valid 10-digit mobile number."
                );

                phoneInput.focus();

                return;
            }


            // =========================================
            // STUDENT ID
            // =========================================

            if (studentId === "") {

                showError(
                    studentIdInput,
                    "Please enter your student ID."
                );

                studentIdInput.focus();

                return;
            }


            if (studentId.length < 2) {

                showError(
                    studentIdInput,
                    "Student ID is too short."
                );

                studentIdInput.focus();

                return;
            }


            if (studentId.length > 50) {

                showError(
                    studentIdInput,
                    "Student ID is too long."
                );

                studentIdInput.focus();

                return;
            }


            // =========================================
            // PASSWORD
            // =========================================

            if (password === "") {

                showError(
                    createPasswordInput,
                    "Please create a password."
                );

                createPasswordInput.focus();

                return;
            }


            /*
             * The PHP backend requires at least 8 characters.
             * Frontend validation therefore matches backend validation.
             */

            if (password.length < 8) {

                showError(
                    createPasswordInput,
                    "Password must contain at least 8 characters."
                );

                createPasswordInput.focus();

                return;
            }


            // =========================================
            // CONFIRM PASSWORD
            // =========================================

            if (confirmPassword === "") {

                showError(
                    confirmPasswordInput,
                    "Please confirm your password."
                );

                confirmPasswordInput.focus();

                return;
            }


            if (password !== confirmPassword) {

                showError(
                    confirmPasswordInput,
                    "Passwords do not match."
                );

                confirmPasswordInput.focus();

                return;
            }


            // =========================================
            // TERMS
            // =========================================

            if (!termsInput.checked) {

                showTermsError();

                return;
            }


            // =========================================
            // DISABLE BUTTON
            // =========================================

            setLoadingState(true);


            // =========================================
            // SEND DATA TO PHP BACKEND
            // =========================================

            const registrationData = {

                fullName: fullName,

                collegeEmail: email,

                phone: phone,

                studentId: studentId,

                location: location,

                password: password
            };


            try {

                const response =
                    await fetch(
                        REGISTER_API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "same-origin",

                            body:
                                JSON.stringify(
                                    registrationData
                                )
                        }
                    );


                /*
                 * Read the server response as text first.
                 * Then convert it to JSON safely.
                 */

                const rawResponse =
                    await response.text();

                let result;

                try {

                    result =
                        JSON.parse(rawResponse);

                } catch (jsonError) {

                    console.error(
                        "CampusHire: Invalid server response.",
                        rawResponse
                    );

                    showServerError(
                        "The server returned an invalid response. Please try again."
                    );

                    setLoadingState(false);

                    return;
                }


                // =====================================
                // PHP SUCCESS
                // =====================================

                if (
                    response.ok &&
                    result.success === true
                ) {

                    /*
                     * IMPORTANT:
                     *
                     * Password is NOT stored in localStorage.
                     *
                     * We only store the profile information needed
                     * by the remaining profile steps.
                     *
                     * The userId returned by MySQL/PHP is stored so
                     * future backend steps can associate education,
                     * skills, projects and career information with
                     * this exact student account.
                     */

                    const basicProfile = {

                        userId:
                            result.data &&
                            result.data.userId
                                ? result.data.userId
                                : null,

                        fullName:
                            fullName,

                        collegeEmail:
                            email,

                        phone:
                            phone,

                        studentId:
                            studentId,

                        location:
                            location
                    };


                    localStorage.setItem(
                        "campusHireBasicProfile",
                        JSON.stringify(basicProfile)
                    );


                    /*
                     * Optional frontend registration reference.
                     * This does NOT contain the password.
                     */

                    const registrationSession = {

                        userId:
                            basicProfile.userId,

                        studentId:
                            studentId,

                        role:
                            "student"
                    };


                    localStorage.setItem(
                        "campusHireRegistrationSession",
                        JSON.stringify(
                            registrationSession
                        )
                    );


                    // =================================
                    // SUCCESS MESSAGE
                    // =================================

                    showSuccessMessage();


                    // =================================
                    // GO TO STEP 02
                    // =================================

                    setTimeout(
                        function () {

                            window.location.href =
                                "student-education.html";

                        },
                        1000
                    );


                    return;
                }


                // =====================================
                // PHP VALIDATION / DUPLICATE ERROR
                // =====================================

                const serverMessage =
                    result.message ||
                    "Registration could not be completed.";

                /*
                 * Give useful field-level messages for the
                 * most common backend validation failures.
                 */

                const lowerMessage =
                    serverMessage.toLowerCase();


                if (
                    lowerMessage.includes("email")
                ) {

                    showError(
                        collegeEmailInput,
                        serverMessage
                    );

                    collegeEmailInput.focus();

                } else if (
                    lowerMessage.includes("student id")
                ) {

                    showError(
                        studentIdInput,
                        serverMessage
                    );

                    studentIdInput.focus();

                } else {

                    showServerError(
                        serverMessage
                    );
                }


            } catch (error) {

                console.error(
                    "CampusHire: Registration request failed.",
                    error
                );


                showServerError(
                    "Unable to connect to the CampusHire server. Make sure Apache and MySQL are running."
                );

            }


            // =========================================
            // ENABLE BUTTON AGAIN
            // =========================================

            setLoadingState(false);

        }
    );


    // =================================================
    // LOAD SAVED PROFILE FUNCTION
    // =================================================

    function loadSavedProfile() {

        let savedProfile =
            localStorage.getItem(
                "campusHireBasicProfile"
            );


        /*
         * One-time migration:
         * If old Step 01 data exists in sessionStorage,
         * copy it to localStorage.
         *
         * This keeps old Stage 1 data usable.
         */

        if (!savedProfile) {

            const oldSessionData =
                sessionStorage.getItem(
                    "campusHireBasicProfile"
                );


            if (oldSessionData) {

                localStorage.setItem(
                    "campusHireBasicProfile",
                    oldSessionData
                );

                savedProfile =
                    oldSessionData;
            }
        }


        if (!savedProfile) {

            return;
        }


        try {

            const profile =
                JSON.parse(savedProfile);


            if (profile.fullName) {

                fullNameInput.value =
                    profile.fullName;
            }


            if (profile.collegeEmail) {

                collegeEmailInput.value =
                    profile.collegeEmail;
            }


            if (profile.phone) {

                phoneInput.value =
                    profile.phone;
            }


            if (profile.studentId) {

                studentIdInput.value =
                    profile.studentId;
            }


            if (profile.location) {

                locationInput.value =
                    profile.location;
            }


            console.log(
                "CampusHire: Previous basic profile loaded."
            );

        } catch (error) {

            console.error(
                "CampusHire: Could not load saved profile.",
                error
            );

        }

    }


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


        if (
            input.parentElement
        ) {

            input.parentElement.appendChild(
                error
            );
        }

    }


    // =================================================
    // SERVER / GENERAL ERROR
    // =================================================

    function showServerError(
        message
    ) {

        const existing =
            document.querySelector(
                ".registration-server-error"
            );


        if (existing) {
            existing.remove();
        }


        const error =
            document.createElement(
                "div"
            );


        error.className =
            "registration-server-error";


        error.textContent =
            message;


        /*
         * Inline styling is used here so we don't have
         * to modify the existing Stage 1 CSS just for
         * this backend message.
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


        if (basicInfoForm) {

            basicInfoForm.insertBefore(
                error,
                basicInfoForm.firstChild
            );
        }

    }


    // =================================================
    // TERMS ERROR
    // =================================================

    function showTermsError() {

        const existing =
            document.querySelector(
                ".terms-error"
            );


        if (existing) {
            existing.remove();
        }


        const error =
            document.createElement(
                "small"
            );


        error.className =
            "terms-error";


        error.textContent =
            "Please accept the Terms of Use and Privacy Policy to continue.";


        const termsContainer =
            document.querySelector(
                ".terms"
            );


        if (termsContainer) {

            termsContainer.appendChild(
                error
            );
        }

    }


    // =================================================
    // CLEAR MESSAGES
    // =================================================

    function clearMessages() {

        const errors =
            document.querySelectorAll(
                ".field-error, .terms-error, .registration-server-error"
            );


        errors.forEach(
            function (error) {

                error.remove();

            }
        );


        const inputs =
            document.querySelectorAll(
                ".register-form input"
            );


        inputs.forEach(
            function (input) {

                input.classList.remove(
                    "input-error-border"
                );

            }
        );

    }


    // =================================================
    // SUCCESS MESSAGE
    // =================================================

    function showSuccessMessage() {

        const existing =
            document.querySelector(
                ".registration-success"
            );


        if (existing) {

            existing.remove();
        }


        const success =
            document.createElement(
                "div"
            );


        success.className =
            "registration-success";


        success.innerHTML = `

            <div class="success-icon">
                ✓
            </div>

            <div>

                <strong>
                    Basic information saved successfully!
                </strong>

                <span>
                    Your account has been created. Moving to Education...
                </span>

            </div>

        `;


        basicInfoForm.insertBefore(
            success,
            basicInfoForm.firstChild
        );

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
                Creating Account...
                <span>
                    ...
                </span>
            `;

        } else {

            continueButton.disabled =
                false;

            continueButton.innerHTML = `
                Continue to Education
                <span>
                    →
                </span>
            `;

        }

    }


    // =================================================
    // REMOVE ERROR WHEN TYPING
    // =================================================

    const allInputs =
        document.querySelectorAll(
            ".register-form input"
        );


    allInputs.forEach(
        function (input) {

            input.addEventListener(
                "input",
                function () {

                    input.classList.remove(
                        "input-error-border"
                    );


                    const error =
                        input.parentElement
                            ? input.parentElement.querySelector(
                                ".field-error"
                            )
                            : null;


                    if (error) {

                        error.remove();
                    }


                    /*
                     * Remove general server message
                     * when the student starts editing again.
                     */

                    const serverError =
                        document.querySelector(
                            ".registration-server-error"
                        );


                    if (serverError) {

                        serverError.remove();
                    }

                }
            );

        }
    );


    // =================================================
    // TERMS ERROR REMOVAL
    // =================================================

    if (termsInput) {

        termsInput.addEventListener(
            "change",
            function () {

                const error =
                    document.querySelector(
                        ".terms-error"
                    );


                if (error) {

                    error.remove();
                }

            }
        );

    }


    // =================================================
    // CONFIRM JS LOADED
    // =================================================

    console.log(
        "CampusHire Student Registration JS loaded successfully."
    );

});