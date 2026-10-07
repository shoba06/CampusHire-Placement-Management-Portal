document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CAMPUSHIRE - STUDENT CAREER PROFILE
       STEP 05 - BACKEND CONNECTED
       ===================================================== */


    // =====================================================
    // ELEMENTS
    // =====================================================

    const roleCheckboxes =
        document.querySelectorAll(
            'input[name="roles"]'
        );


    const industryCheckboxes =
        document.querySelectorAll(
            'input[name="industries"]'
        );


    const workModeRadios =
        document.querySelectorAll(
            'input[name="workMode"]'
        );


    const preferredLocation =
        document.getElementById(
            "preferredLocation"
        );


    const salaryExpectation =
        document.getElementById(
            "salaryExpectation"
        );


    const availability =
        document.getElementById(
            "availability"
        );


    const careerGoal =
        document.getElementById(
            "careerGoal"
        );


    const characterCount =
        document.getElementById(
            "characterCount"
        );


    const formMessage =
        document.getElementById(
            "formMessage"
        );


    const backButton =
        document.getElementById(
            "backButton"
        );


    const completeButton =
        document.getElementById(
            "completeButton"
        );


    const completionPercentage =
        document.getElementById(
            "completionPercentage"
        );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    // =====================================================
    // SAFETY CHECK
    // =====================================================

    if (
        !preferredLocation ||
        !salaryExpectation ||
        !availability ||
        !careerGoal ||
        !formMessage ||
        !completeButton
    ) {

        console.error(
            "CampusHire: Career page elements are missing."
        );

        return;

    }


    // =====================================================
    // MESSAGE FUNCTIONS
    // =====================================================

    function clearMessage() {

        formMessage.textContent = "";

        formMessage.className =
            "form-message";

    }


    function showMessage(
        message,
        type
    ) {

        formMessage.textContent =
            message;

        formMessage.className =
            "form-message " + type;

    }


    // =====================================================
    // GET CHECKED VALUES
    // =====================================================

    function getSelectedValues(
        checkboxes
    ) {

        const values = [];


        checkboxes.forEach(
            function (checkbox) {

                if (checkbox.checked) {

                    values.push(
                        checkbox.value
                    );

                }

            }
        );


        return values;

    }


    // =====================================================
    // GET USER ID
    // =====================================================

    function getUserId() {

        const savedBasicProfile =
            localStorage.getItem(
                "campusHireBasicProfile"
            );


        if (!savedBasicProfile) {

            return 0;

        }


        try {

            const basicProfile =
                JSON.parse(
                    savedBasicProfile
                );


            return Number(
                basicProfile.userId || 0
            );

        }

        catch (error) {

            console.error(
                "CampusHire: Unable to read student user ID.",
                error
            );

            return 0;

        }

    }


    // =====================================================
    // CHARACTER COUNT
    // =====================================================

    function updateCharacterCount() {

        const length =
            careerGoal.value.length;


        characterCount.textContent =
            length + " / 500";


        if (length >= 450) {

            characterCount.style.color =
                "#dc2626";

        }

        else {

            characterCount.style.color =
                "#6b7280";

        }

    }


    // =====================================================
    // BUILD CAREER PROFILE OBJECT
    // =====================================================

    function collectCareerData() {

        const selectedRoles =
            getSelectedValues(
                roleCheckboxes
            );


        const selectedIndustries =
            getSelectedValues(
                industryCheckboxes
            );


        const selectedWorkMode =
            document.querySelector(
                'input[name="workMode"]:checked'
            );


        return {

            roles:
                selectedRoles,

            industries:
                selectedIndustries,

            workMode:
                selectedWorkMode
                    ? selectedWorkMode.value
                    : "",

            preferredLocation:
                preferredLocation.value,

            salaryExpectation:
                salaryExpectation.value,

            availability:
                availability.value,

            careerGoal:
                careerGoal.value.trim()

        };

    }


    // =====================================================
    // SAVE TO LOCAL STORAGE
    // =====================================================

    function saveCareerData() {

        const careerProfile =
            collectCareerData();


        localStorage.setItem(
            "campusHireCareerProfile",
            JSON.stringify(
                careerProfile
            )
        );

    }


    // =====================================================
    // LOAD SAVED CAREER PROFILE
    // =====================================================

    function loadSavedData() {

        let savedData =
            localStorage.getItem(
                "campusHireCareerProfile"
            );


        // -------------------------------------------------
        // OLD SESSION STORAGE MIGRATION
        // -------------------------------------------------

        if (!savedData) {

            const oldSessionData =
                sessionStorage.getItem(
                    "campusHireCareerProfile"
                );


            if (oldSessionData) {

                localStorage.setItem(
                    "campusHireCareerProfile",
                    oldSessionData
                );


                savedData =
                    oldSessionData;

            }

        }


        if (!savedData) {

            updateCharacterCount();

            updateProgress();

            return;

        }


        try {

            const careerProfile =
                JSON.parse(
                    savedData
                );


            // ---------------------------------------------
            // RESTORE ROLES
            // ---------------------------------------------

            if (
                Array.isArray(
                    careerProfile.roles
                )
            ) {

                roleCheckboxes.forEach(
                    function (checkbox) {

                        checkbox.checked =
                            careerProfile.roles.includes(
                                checkbox.value
                            );

                    }
                );

            }


            // ---------------------------------------------
            // RESTORE INDUSTRIES
            // ---------------------------------------------

            if (
                Array.isArray(
                    careerProfile.industries
                )
            ) {

                industryCheckboxes.forEach(
                    function (checkbox) {

                        checkbox.checked =
                            careerProfile.industries.includes(
                                checkbox.value
                            );

                    }
                );

            }


            // ---------------------------------------------
            // RESTORE WORK MODE
            // ---------------------------------------------

            if (
                careerProfile.workMode
            ) {

                const savedWorkMode =
                    Array.from(
                        workModeRadios
                    ).find(
                        function (radio) {

                            return (
                                radio.value ===
                                careerProfile.workMode
                            );

                        }
                    );


                if (savedWorkMode) {

                    savedWorkMode.checked =
                        true;

                }

            }


            // ---------------------------------------------
            // RESTORE LOCATION
            // ---------------------------------------------

            preferredLocation.value =
                careerProfile.preferredLocation ||
                "";


            // ---------------------------------------------
            // RESTORE PACKAGE
            // ---------------------------------------------

            salaryExpectation.value =
                careerProfile.salaryExpectation ||
                "";


            // ---------------------------------------------
            // RESTORE AVAILABILITY
            // ---------------------------------------------

            availability.value =
                careerProfile.availability ||
                "";


            // ---------------------------------------------
            // RESTORE CAREER GOAL
            // ---------------------------------------------

            careerGoal.value =
                careerProfile.careerGoal ||
                "";


            updateCharacterCount();

            updateProgress();


            console.log(
                "CampusHire: Career profile loaded successfully."
            );

        }

        catch (error) {

            console.error(
                "CampusHire: Unable to load career profile.",
                error
            );

            updateCharacterCount();

            updateProgress();

        }

    }


    // =====================================================
    // VALIDATION
    // =====================================================

    function validateCareerProfile() {

        const selectedRoles =
            getSelectedValues(
                roleCheckboxes
            );


        const selectedIndustries =
            getSelectedValues(
                industryCheckboxes
            );


        const selectedWorkMode =
            document.querySelector(
                'input[name="workMode"]:checked'
            );


        // -------------------------------------------------
        // TARGET ROLE
        // -------------------------------------------------

        if (
            selectedRoles.length === 0
        ) {

            showMessage(
                "Please select at least one target role.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // INDUSTRY
        // -------------------------------------------------

        if (
            selectedIndustries.length === 0
        ) {

            showMessage(
                "Please select at least one preferred industry.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // WORK MODE
        // -------------------------------------------------

        if (
            !selectedWorkMode
        ) {

            showMessage(
                "Please select your preferred work arrangement.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // LOCATION
        // -------------------------------------------------

        if (
            preferredLocation.value === ""
        ) {

            showMessage(
                "Please select your preferred location.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // PACKAGE
        // -------------------------------------------------

        if (
            salaryExpectation.value === ""
        ) {

            showMessage(
                "Please select your expected package.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // AVAILABILITY
        // -------------------------------------------------

        if (
            availability.value === ""
        ) {

            showMessage(
                "Please select your availability.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // CAREER GOAL
        // -------------------------------------------------

        const trimmedGoal =
            careerGoal.value.trim();


        if (
            trimmedGoal === ""
        ) {

            showMessage(
                "Please enter your career goal.",
                "error"
            );

            return false;

        }


        if (
            trimmedGoal.length < 20
        ) {

            showMessage(
                "Career goal must contain at least 20 characters.",
                "error"
            );

            return false;

        }


        // -------------------------------------------------
        // USER ID
        // -------------------------------------------------

        const userId =
            getUserId();


        if (
            userId <= 0
        ) {

            showMessage(
                "Student session not found. Please register again.",
                "error"
            );

            return false;

        }


        return true;

    }


    // =====================================================
    // SAVE CAREER DATA TO MYSQL
    // =====================================================

    async function saveCareerToDatabase() {

        const userId =
            getUserId();


        const careerProfile =
            collectCareerData();


        const requestData = {

            userId:
                userId,

            roles:
                careerProfile.roles,

            industries:
                careerProfile.industries,

            workMode:
                careerProfile.workMode,

            preferredLocation:
                careerProfile.preferredLocation,

            salaryExpectation:
                careerProfile.salaryExpectation,

            availability:
                careerProfile.availability,

            careerGoal:
                careerProfile.careerGoal

        };


        const response =
            await fetch(
                "../php/student/career.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestData
                        )
                }
            );


        const result =
            await response.json();


        return result;

    }


    // =====================================================
    // UPDATE PROGRESS
    // =====================================================

    function updateProgress() {

        let completedItems = 0;


        // -------------------------------------------------
        // ROLES
        // -------------------------------------------------

        const roles =
            getSelectedValues(
                roleCheckboxes
            );


        if (
            roles.length > 0
        ) {

            completedItems++;

        }


        // -------------------------------------------------
        // INDUSTRIES
        // -------------------------------------------------

        const industries =
            getSelectedValues(
                industryCheckboxes
            );


        if (
            industries.length > 0
        ) {

            completedItems++;

        }


        // -------------------------------------------------
        // WORK MODE
        // -------------------------------------------------

        const workMode =
            document.querySelector(
                'input[name="workMode"]:checked'
            );


        if (workMode) {

            completedItems++;

        }


        // -------------------------------------------------
        // LOCATION
        // -------------------------------------------------

        if (
            preferredLocation.value !== ""
        ) {

            completedItems++;

        }


        // -------------------------------------------------
        // PACKAGE
        // -------------------------------------------------

        if (
            salaryExpectation.value !== ""
        ) {

            completedItems++;

        }


        // -------------------------------------------------
        // AVAILABILITY
        // -------------------------------------------------

        if (
            availability.value !== ""
        ) {

            completedItems++;

        }


        // -------------------------------------------------
        // CAREER GOAL
        // -------------------------------------------------

        if (
            careerGoal.value.trim().length >= 20
        ) {

            completedItems++;

        }


        const totalItems = 7;


        const percentage =
            Math.round(
                (
                    completedItems /
                    totalItems
                ) * 100
            );


        if (
            completionPercentage
        ) {

            completionPercentage.textContent =
                percentage + "%";

        }


        if (
            progressFill
        ) {

            progressFill.style.width =
                percentage + "%";

        }

    }


    // =====================================================
    // COMPLETE PROFILE
    // =====================================================

    completeButton.addEventListener(
        "click",
        async function () {

            clearMessage();


            // ---------------------------------------------
            // VALIDATE
            // ---------------------------------------------

            if (
                !validateCareerProfile()
            ) {

                return;

            }


            // ---------------------------------------------
            // COLLECT DATA
            // ---------------------------------------------

            const careerProfile =
                collectCareerData();


            // ---------------------------------------------
            // SAVE LOCAL COPY
            // ---------------------------------------------

            localStorage.setItem(
                "campusHireCareerProfile",
                JSON.stringify(
                    careerProfile
                )
            );


            // ---------------------------------------------
            // DISABLE BUTTON
            // ---------------------------------------------

            completeButton.disabled =
                true;


            completeButton.innerHTML =
                "Saving Profile...";


            try {

                // -----------------------------------------
                // SEND TO PHP + MYSQL
                // -----------------------------------------

                const result =
                    await saveCareerToDatabase();


                // -----------------------------------------
                // FAILURE
                // -----------------------------------------

                if (
                    !result ||
                    !result.success
                ) {

                    throw new Error(
                        result?.message ||
                        "Unable to save career preferences."
                    );

                }


                // -----------------------------------------
                // SUCCESS MESSAGE
                // -----------------------------------------

                showMessage(
                    "Your CampusHire profile is complete! Your career preferences have been saved successfully.",
                    "success"
                );


                // -----------------------------------------
                // UPDATE PROGRESS
                // -----------------------------------------

                if (
                    completionPercentage
                ) {

                    completionPercentage.textContent =
                        "100%";

                }


                if (
                    progressFill
                ) {

                    progressFill.style.width =
                        "100%";

                }


                // -----------------------------------------
                // UPDATE BUTTON
                // -----------------------------------------

                completeButton.innerHTML =
                    "Profile Completed ✓";


                // -----------------------------------------
                // GO TO DASHBOARD
                // -----------------------------------------

                setTimeout(
                    function () {

                        window.location.href =
                            "student-dashboard.html";

                    },
                    1500
                );

            }

            catch (error) {

                console.error(
                    "CampusHire: Career profile save failed.",
                    error
                );


                showMessage(
                    error.message ||
                    "Something went wrong while saving your profile. Please try again.",
                    "error"
                );


                // -----------------------------------------
                // RESTORE BUTTON
                // -----------------------------------------

                completeButton.disabled =
                    false;


                completeButton.innerHTML =
                    'Complete Profile <span>✓</span>';

            }

        }
    );


    // =====================================================
    // BACK BUTTON
    // =====================================================

    if (
        backButton
    ) {

        backButton.addEventListener(
            "click",
            function () {

                saveCareerData();

                window.location.href =
                    "student-projects.html";

            }
        );

    }


    // =====================================================
    // AUTO-SAVE ROLES
    // =====================================================

    roleCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    saveCareerData();

                    updateProgress();

                    clearMessage();

                }
            );

        }
    );


    // =====================================================
    // AUTO-SAVE INDUSTRIES
    // =====================================================

    industryCheckboxes.forEach(
        function (checkbox) {

            checkbox.addEventListener(
                "change",
                function () {

                    saveCareerData();

                    updateProgress();

                    clearMessage();

                }
            );

        }
    );


    // =====================================================
    // AUTO-SAVE WORK MODE
    // =====================================================

    workModeRadios.forEach(
        function (radio) {

            radio.addEventListener(
                "change",
                function () {

                    saveCareerData();

                    updateProgress();

                    clearMessage();

                }
            );

        }
    );


    // =====================================================
    // AUTO-SAVE LOCATION
    // =====================================================

    preferredLocation.addEventListener(
        "change",
        function () {

            saveCareerData();

            updateProgress();

            clearMessage();

        }
    );


    // =====================================================
    // AUTO-SAVE EXPECTED PACKAGE
    // =====================================================

    salaryExpectation.addEventListener(
        "change",
        function () {

            saveCareerData();

            updateProgress();

            clearMessage();

        }
    );


    // =====================================================
    // AUTO-SAVE AVAILABILITY
    // =====================================================

    availability.addEventListener(
        "change",
        function () {

            saveCareerData();

            updateProgress();

            clearMessage();

        }
    );


    // =====================================================
    // CAREER GOAL INPUT
    // =====================================================

    careerGoal.addEventListener(
        "input",
        function () {

            updateCharacterCount();

            updateProgress();

            saveCareerData();

            clearMessage();

        }
    );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadSavedData();

    updateCharacterCount();

    updateProgress();


    console.log(
        "CampusHire: Student Career JS loaded successfully."
    );

});