document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =====================================================
           CAMPUSHIRE - STUDENT DASHBOARD
           MYSQL BACKEND CONNECTED
           ===================================================== */


        // =====================================================
        // ELEMENTS
        // =====================================================

        const studentName =
            document.getElementById(
                "studentName"
            );

        const topStudentName =
            document.getElementById(
                "topStudentName"
            );

        const studentAvatar =
            document.getElementById(
                "studentAvatar"
            );

        const roleCount =
            document.getElementById(
                "roleCount"
            );

        const skillCount =
            document.getElementById(
                "skillCount"
            );

        const projectCount =
            document.getElementById(
                "projectCount"
            );

        const certificationCount =
            document.getElementById(
                "certificationCount"
            );

        const roleTags =
            document.getElementById(
                "roleTags"
            );

        const industryText =
            document.getElementById(
                "industryText"
            );

        const workModeText =
            document.getElementById(
                "workModeText"
            );

        const locationText =
            document.getElementById(
                "locationText"
            );

        const salaryText =
            document.getElementById(
                "salaryText"
            );

        const skillTags =
            document.getElementById(
                "skillTags"
            );

        const proficiencyText =
            document.getElementById(
                "proficiencyText"
            );

        const careerGoalText =
            document.getElementById(
                "careerGoalText"
            );

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        // =====================================================
        // HELPER
        // =====================================================

        function setText(
            element,
            value,
            fallback
        ) {

            if (!element) {
                return;
            }

            element.textContent =
                value ||
                fallback;

        }


        function escapeHTML(
            value
        ) {

            return String(
                value ?? ""
            )
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


        // =====================================================
        // SAVE BACKEND DATA FOR EXISTING FRONTEND MODULES
        // =====================================================

        function synchronizeLocalStorage(
            data
        ) {

            const student =
                data.student || {};

            const career =
                data.career || {};

            const education =
                data.education || {};

            const skills =
                Array.isArray(
                    data.skills
                )
                    ? data.skills
                    : [];


            /*
               Keep the existing localStorage structure
               so Opportunities and other frontend modules
               continue to work while their own backend
               integration is completed.
            */

            localStorage.setItem(
                "campusHireBasicProfile",
                JSON.stringify({

                    userId:
                        student.userId,

                    fullName:
                        student.fullName,

                    collegeEmail:
                        student.collegeEmail ||
                        student.email,

                    phone:
                        student.phone,

                    studentId:
                        student.studentId,

                    location:
                        student.location

                })
            );


            localStorage.setItem(
                "campusHireEducationProfile",
                JSON.stringify({

                    degree:
                        education?.degree || "",

                    department:
                        education?.department || "",

                    college:
                        education?.college || "",

                    currentYear:
                        education?.current_year || "",

                    graduationYear:
                        education?.graduation_year || "",

                    cgpa:
                        education?.cgpa ?? "",

                    backlogs:
                        education?.backlogs ?? ""

                })
            );


            localStorage.setItem(
                "campusHireSkillsProfile",
                JSON.stringify({

                    selectedSkills:
                        skills.map(
                            function (item) {
                                return item.name;
                            }
                        ),

                    skills:
                        skills,

                    proficiency:
                        data.overallProficiency ||
                        ""

                })
            );


            localStorage.setItem(
                "campusHireCareerProfile",
                JSON.stringify({

                    roles:
                        career.roles || [],

                    industries:
                        career.industries || [],

                    workMode:
                        career.workMode || "",

                    preferredLocation:
                        career.preferredLocation || "",

                    salaryExpectation:
                        career.expectedPackage || "",

                    availability:
                        career.availability || "",

                    careerGoal:
                        career.careerGoal || ""

                })
            );


            localStorage.setItem(
                "campusHireLoggedInUser",
                JSON.stringify(
                    student
                )
            );


            localStorage.setItem(
                "campusHireUserId",
                String(
                    student.userId
                )
            );

        }


        // =====================================================
        // DISPLAY STUDENT
        // =====================================================

        function displayStudent(
            student
        ) {

            const fullName =
                student.fullName ||
                "Student";


            setText(
                studentName,
                fullName,
                "Student"
            );


            setText(
                topStudentName,
                fullName,
                "Student"
            );


            if (
                studentAvatar
            ) {

                const firstLetter =
                    fullName
                        .trim()
                        .charAt(0)
                        .toUpperCase() ||
                    "S";


                studentAvatar.textContent =
                    firstLetter;

            }

        }


        // =====================================================
        // DISPLAY CAREER PROFILE
        // =====================================================

        function displayCareer(
            career
        ) {

            const roles =
                Array.isArray(
                    career.roles
                )
                    ? career.roles
                    : [];


            const industries =
                Array.isArray(
                    career.industries
                )
                    ? career.industries
                    : [];


            // ---------------------------------------------
            // ROLE TAGS
            // ---------------------------------------------

            if (
                roleTags
            ) {

                if (
                    roles.length === 0
                ) {

                    roleTags.innerHTML =
                        '<span class="empty-tag">No roles selected</span>';

                }

                else {

                    roleTags.innerHTML =
                        roles
                            .map(
                                function (role) {

                                    return `
                                        <span class="profile-tag">
                                            ${escapeHTML(role)}
                                        </span>
                                    `;

                                }
                            )
                            .join("");

                }

            }


            // ---------------------------------------------
            // COUNTER
            // ---------------------------------------------

            setText(
                roleCount,
                String(
                    roles.length
                ),
                "0"
            );


            // ---------------------------------------------
            // INDUSTRIES
            // ---------------------------------------------

            if (
                industryText
            ) {

                industryText.textContent =
                    industries.length > 0
                        ? industries.join(", ")
                        : "Not specified";

            }


            // ---------------------------------------------
            // WORK MODE
            // ---------------------------------------------

            setText(
                workModeText,
                career.workMode,
                "Not specified"
            );


            // ---------------------------------------------
            // LOCATION
            // ---------------------------------------------

            setText(
                locationText,
                career.preferredLocation,
                "Not specified"
            );


            // ---------------------------------------------
            // PACKAGE
            // ---------------------------------------------

            setText(
                salaryText,
                career.expectedPackage,
                "Not specified"
            );


            // ---------------------------------------------
            // CAREER GOAL
            // ---------------------------------------------

            setText(
                careerGoalText,
                career.careerGoal,
                "Your career goal will appear here."
            );

        }


        // =====================================================
        // DISPLAY SKILLS
        // =====================================================

        function displaySkills(
            skills,
            proficiency
        ) {

            const skillList =
                Array.isArray(skills)
                    ? skills
                    : [];


            setText(
                skillCount,
                String(
                    skillList.length
                ),
                "0"
            );


            if (
                skillTags
            ) {

                if (
                    skillList.length === 0
                ) {

                    skillTags.innerHTML =
                        '<span class="empty-tag">No skills selected</span>';

                }

                else {

                    skillTags.innerHTML =
                        skillList
                            .map(
                                function (skill) {

                                    return `
                                        <span class="skill-tag">
                                            ${escapeHTML(skill.name)}
                                        </span>
                                    `;

                                }
                            )
                            .join("");

                }

            }


            setText(
                proficiencyText,
                proficiency,
                "Not specified"
            );

        }


        // =====================================================
        // DISPLAY COUNTS
        // =====================================================

        function displayCounts(
            data
        ) {

            setText(
                projectCount,
                String(
                    data.projectCount || 0
                ),
                "0"
            );


            setText(
                certificationCount,
                String(
                    data.certificationCount || 0
                ),
                "0"
            );

        }


        // =====================================================
        // LOAD DASHBOARD FROM MYSQL
        // =====================================================

        async function loadDashboard() {

            try {

                const response =
                    await fetch(
                        "../php/student/dashboard.php",
                        {
                            method: "GET",
                            credentials: "include"
                        }
                    );


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


                // -----------------------------------------
                // SESSION NOT FOUND
                // -----------------------------------------

                if (
                    !result.success
                ) {

                    if (
                        result.redirect
                    ) {

                        window.location.href =
                            result.redirect;

                        return;

                    }


                    throw new Error(
                        result.message ||
                        "Unable to load dashboard."
                    );

                }


                // -----------------------------------------
                // SYNC LOCAL STORAGE
                // -----------------------------------------

                synchronizeLocalStorage(
                    result
                );


                // -----------------------------------------
                // DISPLAY DATA
                // -----------------------------------------

                displayStudent(
                    result.student
                );


                displayCareer(
                    result.career
                );


                displaySkills(
                    result.skills,
                    result.overallProficiency
                );


                displayCounts(
                    result
                );


                console.log(
                    "CampusHire: Dashboard loaded from MySQL.",
                    result
                );

            }

            catch (error) {

                console.error(
                    "CampusHire: Dashboard load failed.",
                    error
                );

                /*
                   Don't clear the screen.
                   Show the previously stored identity
                   only as a fallback.
                */

                try {

                    const savedUser =
                        JSON.parse(
                            localStorage.getItem(
                                "campusHireLoggedInUser"
                            ) || "{}"
                        );


                    if (
                        savedUser.fullName
                    ) {

                        displayStudent(
                            savedUser
                        );

                    }

                }

                catch (
                    fallbackError
                ) {

                    console.error(
                        fallbackError
                    );

                }

            }

        }


        // =====================================================
        // LOGOUT
        // =====================================================

        if (
            logoutButton
        ) {

            logoutButton.addEventListener(
                "click",
                async function () {

                    logoutButton.disabled =
                        true;


                    try {

                        await fetch(
                            "../php/auth/logout.php",
                            {
                                method: "POST",
                                credentials: "include"
                            }
                        );

                    }

                    catch (error) {

                        console.error(
                            "Logout request failed.",
                            error
                        );

                    }


                    localStorage.removeItem(
                        "campusHireLoggedInUser"
                    );

                    localStorage.removeItem(
                        "campusHireUserId"
                    );

                    localStorage.removeItem(
                        "campusHireBasicProfile"
                    );

                    localStorage.removeItem(
                        "campusHireEducationProfile"
                    );

                    localStorage.removeItem(
                        "campusHireSkillsProfile"
                    );

                    localStorage.removeItem(
                        "campusHireCareerProfile"
                    );


                    window.location.href =
                        "student-login.html";

                }
            );

        }


        // =====================================================
        // OPPORTUNITIES NAVIGATION
        // =====================================================

        const navigationLinks =
            document.querySelectorAll(
                ".navigation .nav-item"
            );


        navigationLinks.forEach(
            function (link) {

                const text =
                    link.textContent
                        .trim()
                        .toLowerCase();


                if (
                    text.includes(
                        "opportunities"
                    )
                ) {

                    link.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();

                            window.location.href =
                                "opportunities.html";

                        }
                    );

                }

            }
        );


        // =====================================================
        // PROFILE NAVIGATION
        // =====================================================

        const profileNav =
            document.getElementById(
                "profileNav"
            );


        if (
            profileNav
        ) {

            profileNav.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    /*
                       For now return to Step 01.
                       Later we will create the permanent
                       My Profile edit page backed by MySQL.
                    */

                    window.location.href =
                        "student-register.html";

                }
            );

        }


        // =====================================================
        // FIRST LOAD
        // =====================================================

        loadDashboard();

    }
);