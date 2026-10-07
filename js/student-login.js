document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CAMPUSHIRE - STUDENT LOGIN
       FRONTEND → PHP → MYSQL
       ===================================================== */


    // =====================================================
    // FIND LOGIN FORM
    // =====================================================

    const loginForm =
        document.querySelector("#loginForm") ||
        document.querySelector("form");


    if (!loginForm) {

        console.error(
            "CampusHire: Login form not found."
        );

        return;

    }


    // =====================================================
    // FIND EMAIL / STUDENT ID INPUT
    // =====================================================

    const identifierInput =
        document.querySelector("#identifier") ||
        document.querySelector("#email") ||
        document.querySelector("#collegeEmail") ||
        document.querySelector("#studentEmail") ||
        document.querySelector("#loginEmail") ||
        document.querySelector("#studentId") ||
        document.querySelector(
            'input[name="identifier"]'
        ) ||
        document.querySelector(
            'input[name="email"]'
        ) ||
        document.querySelector(
            'input[name="studentId"]'
        ) ||
        document.querySelector(
            'input[type="email"]'
        ) ||
        document.querySelector(
            'input[type="text"]'
        );


    // =====================================================
    // FIND PASSWORD INPUT
    // =====================================================

    const passwordInput =
        document.querySelector("#password") ||
        document.querySelector("#loginPassword") ||
        document.querySelector("#studentPassword") ||
        document.querySelector(
            'input[name="password"]'
        ) ||
        document.querySelector(
            'input[type="password"]'
        );


    // =====================================================
    // FIND MESSAGE AREA
    // =====================================================

    let messageElement =
        document.querySelector("#formMessage") ||
        document.querySelector("#loginMessage") ||
        document.querySelector("#message");


    /*
       If the existing HTML does not have a message area,
       create one automatically.
    */

    if (!messageElement) {

        messageElement =
            document.createElement("div");

        messageElement.id =
            "loginMessage";

        messageElement.style.marginTop =
            "15px";

        messageElement.style.padding =
            "12px";

        messageElement.style.borderRadius =
            "8px";

        messageElement.style.display =
            "none";


        loginForm.appendChild(
            messageElement
        );

    }


    // =====================================================
    // FIND LOGIN BUTTON
    // =====================================================

    const loginButton =
        document.querySelector("#loginButton") ||
        document.querySelector("#continueButton") ||
        loginForm.querySelector(
            'button[type="submit"]'
        );


    // =====================================================
    // MESSAGE FUNCTION
    // =====================================================

    function showMessage(
        message,
        type
    ) {

        messageElement.textContent =
            message;

        messageElement.style.display =
            "block";


        if (type === "success") {

            messageElement.style.color =
                "#166534";

            messageElement.style.backgroundColor =
                "#dcfce7";

            messageElement.style.border =
                "1px solid #86efac";

        }

        else {

            messageElement.style.color =
                "#991b1b";

            messageElement.style.backgroundColor =
                "#fee2e2";

            messageElement.style.border =
                "1px solid #fca5a5";

        }

    }


    // =====================================================
    // CLEAR MESSAGE
    // =====================================================

    function clearMessage() {

        messageElement.textContent =
            "";

        messageElement.style.display =
            "none";

    }


    // =====================================================
    // VALIDATE INPUTS
    // =====================================================

    function validateLogin() {

        clearMessage();


        if (!identifierInput) {

            showMessage(
                "Login email / student ID field was not found.",
                "error"
            );

            return false;

        }


        if (!passwordInput) {

            showMessage(
                "Password field was not found.",
                "error"
            );

            return false;

        }


        const identifier =
            identifierInput.value.trim();


        const password =
            passwordInput.value;


        if (
            identifier === ""
        ) {

            showMessage(
                "Please enter your college email or student ID.",
                "error"
            );

            identifierInput.focus();

            return false;

        }


        if (
            password === ""
        ) {

            showMessage(
                "Please enter your password.",
                "error"
            );

            passwordInput.focus();

            return false;

        }


        return true;

    }


    // =====================================================
    // SAVE LOGGED-IN USER
    // =====================================================

    function saveLoggedInUser(
        user
    ) {

        /*
           Store student identity only.

           NEVER store the password.
        */

        const basicProfile = {

            userId:
                user.userId,

            fullName:
                user.fullName,

            collegeEmail:
                user.collegeEmail ||
                user.email,

            phone:
                user.phone,

            studentId:
                user.studentId,

            location:
                user.location

        };


        localStorage.setItem(
            "campusHireBasicProfile",
            JSON.stringify(
                basicProfile
            )
        );


        localStorage.setItem(
            "campusHireLoggedInUser",
            JSON.stringify(
                user
            )
        );


        localStorage.setItem(
            "campusHireUserId",
            String(
                user.userId
            )
        );

    }


    // =====================================================
    // LOGIN REQUEST
    // =====================================================

    async function loginStudent() {

        const identifier =
            identifierInput.value.trim();


        const password =
            passwordInput.value;


        /*
           Disable button while request
           is being processed.
        */

        if (loginButton) {

            loginButton.disabled =
                true;

            loginButton.dataset.originalText =
                loginButton.textContent;

            loginButton.textContent =
                "Signing in...";

        }


        try {

            const response =
                await fetch(
                    "../php/auth/login.php",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body:
                            JSON.stringify({
                                identifier:
                                    identifier,

                                password:
                                    password
                            })
                    }
                );


            /*
               Check whether PHP returned
               valid JSON.
            */

            let result;


            try {

                result =
                    await response.json();

            }

            catch (jsonError) {

                throw new Error(
                    "Invalid response received from the server."
                );

            }


            // =============================================
            // LOGIN FAILED
            // =============================================

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Login failed. Please check your credentials."
                );

            }


            // =============================================
            // LOGIN SUCCESS
            // =============================================

            saveLoggedInUser(
                result.user
            );


            showMessage(
                "Login successful! Welcome to CampusHire.",
                "success"
            );


            console.log(
                "CampusHire: Student login successful.",
                result.user
            );


            // =============================================
            // REDIRECT
            // =============================================

            setTimeout(
                function () {

                    window.location.href =
                        "student-dashboard.html";

                },
                800
            );

        }

        catch (error) {

            console.error(
                "CampusHire: Login error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to login. Please try again.",
                "error"
            );


            if (loginButton) {

                loginButton.disabled =
                    false;

                loginButton.textContent =
                    loginButton.dataset.originalText ||
                    "Login";

            }

        }

    }


    // =====================================================
    // FORM SUBMIT
    // =====================================================

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            if (
                !validateLogin()
            ) {

                return;

            }


            loginStudent();

        }
    );


    // =====================================================
    // REMOVE ERROR WHILE TYPING
    // =====================================================

    if (identifierInput) {

        identifierInput.addEventListener(
            "input",
            clearMessage
        );

    }


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            clearMessage
        );

    }


    // =====================================================
    // CONFIRM JAVASCRIPT LOADED
    // =====================================================

    console.log(
        "CampusHire Student Login JS loaded successfully."
    );

});