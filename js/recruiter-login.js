document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | CampusHire Recruiter Login
    | Permanent backend session version
    |--------------------------------------------------------------------------
    */

    const LOGIN_API =
        "../php/recruiter/login.php";


    /*
    |--------------------------------------------------------------------------
    | Elements
    |--------------------------------------------------------------------------
    */

    const form =
        document.getElementById(
            "recruiterLoginForm"
        );


    const identifierInput =
        document.querySelector(
            "#recruiterId, " +
            "#recruiterIdentifier, " +
            "#identifier, " +
            "#companyId, " +
            "input[name='identifier'], " +
            "input[name='recruiterId'], " +
            "input[name='companyId']"
        );


    const passwordInput =
        document.querySelector(
            "#password, " +
            "input[name='password'], " +
            "input[type='password']"
        );


    const submitButton =
        document.querySelector(
            "#recruiterLoginForm button[type='submit'], " +
            "#recruiterLoginForm .primary-btn, " +
            "#recruiterLoginForm .login-button, " +
            "button[type='submit']"
        );


    let loginInProgress = false;


    /*
    |--------------------------------------------------------------------------
    | Message
    |--------------------------------------------------------------------------
    */

    function showMessage(
        message,
        type
    ) {

        let messageBox =
            document.getElementById(
                "loginMessage"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );


            messageBox.id =
                "loginMessage";


            if (form) {

                form.insertBefore(
                    messageBox,
                    form.firstChild
                );

            } else {

                document.body.prepend(
                    messageBox
                );

            }

        }


        messageBox.textContent =
            message;


        messageBox.style.display =
            "block";


        messageBox.style.padding =
            "12px 16px";


        messageBox.style.marginBottom =
            "16px";


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


    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    async function loginRecruiter(
        event
    ) {

        /*
        Prevent normal GET form navigation.
        */

        if (event) {

            event.preventDefault();

            event.stopPropagation();

        }


        /*
        Prevent duplicate login requests.
        */

        if (loginInProgress) {

            return;

        }


        loginInProgress =
            true;


        if (!identifierInput) {

            loginInProgress =
                false;


            showMessage(
                "Recruiter / Company ID field not found.",
                "error"
            );


            return;

        }


        if (!passwordInput) {

            loginInProgress =
                false;


            showMessage(
                "Password field not found.",
                "error"
            );


            return;

        }


        let identifier =
            identifierInput.value.trim();


        const password =
            passwordInput.value;


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (!identifier) {

            loginInProgress =
                false;


            showMessage(
                "Please enter your recruiter or company ID.",
                "error"
            );


            identifierInput.focus();


            return;

        }


        if (!password) {

            loginInProgress =
                false;


            showMessage(
                "Please enter your password.",
                "error"
            );


            passwordInput.focus();


            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Demo recruiter ID support
        |--------------------------------------------------------------------------
        |
        | The UI displays recruiter001, while the database account
        | uses recruiter001@campushire.com.
        |
        */

        if (
            identifier.toLowerCase() ===
            "recruiter001"
        ) {

            identifier =
                "recruiter001@campushire.com";

        }


        /*
        |--------------------------------------------------------------------------
        | Button loading state
        |--------------------------------------------------------------------------
        */

        let originalButtonText =
            "Sign In to Recruiter Portal →";


        if (submitButton) {

            originalButtonText =
                submitButton.innerHTML;


            submitButton.disabled =
                true;


            submitButton.innerHTML =
                "Signing in...";

        }


        try {

            /*
            ------------------------------------------------------
            | Send JSON request to PHP
            ------------------------------------------------------
            */

            const response =
                await fetch(
                    LOGIN_API,
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
                            JSON.stringify({

                                identifier:
                                    identifier,

                                password:
                                    password

                            })

                    }
                );


            /*
            ------------------------------------------------------
            | Convert response
            ------------------------------------------------------
            */

            const data =
                await response.json();


            console.log(
                "CampusHire Recruiter Login:",
                data
            );


            /*
            ------------------------------------------------------
            | Login failed
            ------------------------------------------------------
            */

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Invalid recruiter credentials."
                );

            }


            /*
            ------------------------------------------------------
            | Store non-sensitive recruiter information
            ------------------------------------------------------
            */

            const recruiterData = {

                userId:
                    data.userId ??
                    null,

                recruiterUserId:
                    data.recruiterUserId ??
                    data.userId ??
                    null,

                companyId:
                    data.companyId ??
                    null,

                recruiterName:
                    data.recruiterName ??
                    "Recruiter",

                companyName:
                    data.companyName ??
                    "Nova Analytics",

                email:
                    data.email ??
                    identifier

            };


            localStorage.setItem(
                "campusHireRecruiter",
                JSON.stringify(
                    recruiterData
                )
            );


            /*
            ------------------------------------------------------
            | Success
            ------------------------------------------------------
            */

            showMessage(
                "Login successful. Opening recruiter portal...",
                "success"
            );


            /*
            ------------------------------------------------------
            | Redirect only AFTER PHP login succeeds
            ------------------------------------------------------
            */

            window.setTimeout(
                function () {

                    window.location.href =
                        "recruiter-dashboard.html";

                },
                400
            );


        } catch (error) {

            console.error(
                "CampusHire recruiter login error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to sign in.",
                "error"
            );


            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    originalButtonText;

            }


            loginInProgress =
                false;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Form submit event
    |--------------------------------------------------------------------------
    */

    if (form) {

        form.addEventListener(
            "submit",
            loginRecruiter
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Button click event
    |--------------------------------------------------------------------------
    |
    | This is the important part.
    | It handles the button even if the button is not actually
    | triggering the form submit event.
    |
    */

    if (submitButton) {

        submitButton.addEventListener(
            "click",
            loginRecruiter
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Initial console message
    |--------------------------------------------------------------------------
    */

    console.log(
        "CampusHire recruiter login module loaded."
    );

});