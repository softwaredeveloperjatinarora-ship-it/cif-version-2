$(document).ready(function() {
   // var apiUrl = 'https://localhost:7125/api/LpuCIF/GetAllInstruments';
   // var Apitoken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIzMTMwOSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoialhYWEBYWFhYLmNvbSIsIk5BTUUiOiJKYXRpbmRlciBLdW1hciIsImlzQWN0aXZlIjoiVHJ1ZSIsIlVuaXF1ZWlkIjoiZmMyYWIyOGItM2JhYi00ZjZjLTlhNzEtMjU5Njk2MGVjNmQwIiwiSXNQYXJlbnQiOiJGYWxzZSIsIlVzZXJUeXBlIjoiTi9BIiwiU3BlY2lhbEJsb2NrIjoiTi9BIiwibmJmIjoxNzI0MjExNTUyLCJleHAiOjE3MjQyOTc5NTEsImlhdCI6MTcyNDIxMTU1MiwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzEyNS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyJ9.GuIYfRQNFSUrqtCSglTfPLIItCbGQsQaDR-zagns_c4';

    var apiUrl = 'https://projectsapi.lpu.in/api/LpuCIF/';
    var Apitoken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dpbk5hbWUiOiIyNTg5OSIsIkRlcGFydG1lbnROYW1lIjoiTi9BIiwiUm9sbElkIjoiNTAiLCJlbWFpbElkIjoiamF0aW4uMjU4OTlAbHB1LmNvLmluIiwiTkFNRSI6IkphdGluIFNhcnBhbCIsImlzQWN0aXZlIjoiVHJ1ZSIsIlVuaXF1ZWlkIjoiYmRmYWU4MWQtMDUxNy00M2ZjLWFjMzctZjM0ZDExODRmZjY3IiwiSXNQYXJlbnQiOiJGYWxzZSIsIlVzZXJUeXBlIjoiTi9BIiwiU3BlY2lhbEJsb2NrIjoiTi9BIiwibmJmIjoxNzIxODgxODU1LCJleHAiOjE3NTM0MTc4NTUsImlhdCI6MTcyMTg4MTg1NSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzEyNS8iLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTI1LyJ9.K8Pswv0q8MtTJ_QHOyX2TSksR6x888AdYVCqd5f1tTI';

    $.ajax({
        url: apiUrl + 'GetAllInstruments',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${Apitoken}`
        },
        success: function(response) {
            var instruments = response.item1;
            var htmlContent = '';

            instruments.forEach(function(instrument) {
                htmlContent += `
                    <div class="g-col-lg-3 g-col-6 d-grid">
                        <a href="#" class="instrument-link" data-category-id="${instrument.categoryId}">${instrument.instrumentName}</a>
                    </div>
                `;
            });

            $('#instrumentGrid').html(htmlContent);

            $('.instrument-link').on('click', function(e) {
                e.preventDefault();
                var categoryId = $(this).data('category-id');
                fetchSpecifications(categoryId);
            });
        },
        error: function(error) {
            console.error('Error fetching instruments', error);
        }
    });

    function fetchSpecifications(categoryId) {

        $.ajax({
            url: apiUrl + 'GetAllSpecifications',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${Apitoken}`
            },
            success: function(response) {
                var specifications = response.item1;
                var specsHtml = '';

                var filteredSpecs = specifications.filter(function(spec) {
                    return spec.categoryId === categoryId;
                });

                filteredSpecs.forEach(function(spec) {
                    specsHtml += `
                        <li><strong class="d-block">${spec.keyName}:</strong> ${spec.keyValue}</li>
                    `;
                });

                $('#specificationsList').html(specsHtml);
            },
            error: function(error) {
                console.error('Error fetching specifications', error);
            }
        });
    }

    function fetchSpecifications(categoryId) {
        // var specificationsApiUrl = 'https://localhost:7125/api/LpuCIF/';

        $.ajax({
            url: apiUrl + 'GetAllSpecifications',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${Apitoken}`
            },
            success: function(response) {
                var specifications = response.item1;
                var specsHtml = '';

                var filteredSpecs = specifications.filter(function(spec) {
                    return spec.categoryId === categoryId;
                });

                filteredSpecs.forEach(function(spec) {
                    specsHtml += `
                        <li><strong class="d-block">${spec.keyName}:</strong> ${spec.keyValue}</li>
                    `;
                });

                $('#specificationsList').html(specsHtml);
            },
            error: function(error) {
                console.error('Error fetching specifications', error);
            }
        });
    }

    function validateField(fieldId, errorId, errorMessage) {
        const fieldValue = $(fieldId).val().trim();
        if (fieldValue === '') {
            $(errorId).text(errorMessage);
            $(fieldId).addClass('is-invalid');
            return false;
        } else {
            $(errorId).text('');
            $(fieldId).removeClass('is-invalid');
            return true;
        }
    }

    $('#UserEmail').on('input', function () {
        validateField('#UserEmail', '#UserEmailError', 'Email is required');
    });

    $('#CandidateName').on('input', function () {
        validateField('#CandidateName', '#CandidateNameError', 'Candidate Name is required');
    });

    $('#SupervisorName').on('input', function () {
        validateField('#SupervisorName', '#SupervisorNameError', 'Supervisor Name is required');
    });

    $('#MobileNumber').on('input', function () {
        validateField('#MobileNumber', '#MobileNumberError', 'Mobile Number is required');
    });

    $('#InstituteName').on('input', function () {
        validateField('#InstituteName', '#InstituteNameError', 'Organization Name is required');
    });

    $('#DepartmentName').on('input', function () {
        validateField('#DepartmentName', '#DepartmentNameError', 'Department Name is required');
    });

    $('input[name="IdProofType"]').on('change', function () {
        if ($('input[name="IdProofType"]:checked').length > 0) {
            $('#IdProofTypeError').text('');
        } else {
            $('#IdProofTypeError').text('ID Proof Type is required');
        }
    });

    $('#IdProofNumber').on('input', function () {
        validateField('#IdProofNumber', '#IdProofNumberError', 'ID Proof Number is required');
    });

    $('#UserRole').on('change', function () {
        if ($('#UserRole').val() === 'Select') {
            $('#UserRoleError').text('User Role is required');
            $('#UserRole').addClass('is-invalid');
        } else {
            $('#UserRoleError').text('');
            $('#UserRole').removeClass('is-invalid');
        }
    });

    $('#txtAddress').on('input', function () {
        validateField('#txtAddress', '#txtAddressError', 'Corresponding Address is required');
    });

    $('#PasswordText').on('input', function () {
        validateField('#PasswordText', '#PasswordTextError', 'Password is required');
        if ($('#PasswordText').val() !== $('#reg-confirm-password').val()) {
            $('#PasswordMatchError').text('Passwords do not match');
        } else {
            $('#PasswordMatchError').text('');
        }
    });

    $('#reg-confirm-password').on('input', function () {
        validateField('#reg-confirm-password', '#ConfirmPasswordError', 'Confirm Password is required');
        if ($('#PasswordText').val() !== $('#reg-confirm-password').val()) {
            $('#PasswordMatchError').text('Passwords do not match');
        } else {
            $('#PasswordMatchError').text('');
        }
    });

    $('#registerButton').click(function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Validation logic for the registration form
        const isFormValid = validateField('#UserEmail', '#UserEmailError', 'Email is required') &&
            validateField('#CandidateName', '#CandidateNameError', 'Candidate Name is required') &&
            validateField('#SupervisorName', '#SupervisorNameError', 'Supervisor Name is required') &&
            validateField('#MobileNumber', '#MobileNumberError', 'Mobile Number is required') &&
            validateField('#InstituteName', '#InstituteNameError', 'Organization Name is required') &&
            validateField('#DepartmentName', '#DepartmentNameError', 'Department Name is required') &&
            validateField('#IdProofNumber', '#IdProofNumberError', 'ID Proof Number is required') &&
            validateField('#txtAddress', '#txtAddressError', 'Corresponding Address is required') &&
            validateField('#PasswordText', '#PasswordTextError', 'Password is required') &&
            validateField('#reg-confirm-password', '#ConfirmPasswordError', 'Confirm Password is required') &&
            ($('#PasswordText').val() === $('#reg-confirm-password').val());

        if (!isFormValid) {
            alert('Please fill out all required fields correctly.');
            return;
        }
        // Gather form data for registration
        const formData = new FormData();
        formData.append('UserEmail', $('#UserEmail').val());
        formData.append('CandidateName', $('#CandidateName').val());
        formData.append('SupervisorName', $('#SupervisorName').val());
        formData.append('MobileNumber', $('#MobileNumber').val());
        formData.append('SchoolName', $('#InstituteName').val());
        formData.append('DepartmentName', $('#DepartmentName').val());
        formData.append('IdProofType', $('input[name="IdProofType"]:checked').val());
        formData.append('IdProofNumber', $('#IdProofNumber').val());
        formData.append('UserType', $('#UserRole').val());
        formData.append('Address', $('#txtAddress').val());
        formData.append('PasswordText', $('#PasswordText').val());

        // AJAX call for registration
        $.ajax({
            url: apiUrl + 'CreateCIFUserAccount',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${Apitoken}`,
            },
            data: formData,
            processData: false, // Prevent jQuery from processing the data
            contentType: false, // Let the browser set the Content-Type header
            success: function(response) {
                alert('User created successfully!');
                $('#userForm')[0].reset(); // Reset the form
            },
            error: function(xhr, status, error) {
                console.error('Error creating user:', error);
                alert('Failed to create user.');
            }
        });
    });

    // Handle form submission for the login form
    $('#loginButton').click(function(event) {
        event.preventDefault(); // Prevent the default form submission

        var email = $('#loginid').val();
        var password = $('#password').val();
        var Userrole = $('#UserRoleS').val();

        if (email === "" || password === "" || Userrole === "select") {
            alert("Please enter all fields: email, password, and role.");
            return;
        }

        var LoginapiUrl = apiUrl + 'GetUserDataIdWise?Email=' + encodeURIComponent(email) +
            '&PasswordText=' + encodeURIComponent(password) + '&UserRole=' + encodeURIComponent(Userrole);

        // AJAX call for login
        $.ajax({
            url: LoginapiUrl,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${Apitoken}`
            },
            success: function(response) {
                if (response.item1 && response.item1.length > 0) {
                    var userData = response.item1[0];
                    sessionStorage.setItem('userId', userData.userId);
                    sessionStorage.setItem('candidateName', userData.candidateName.trim());
                    sessionStorage.setItem('departmentName', userData.departmentName.trim());
                    sessionStorage.setItem('supervisorName', userData.supervisorName.trim());
                    sessionStorage.setItem('emailId', userData.emailId.trim());
                    sessionStorage.setItem('mobileNumber', userData.mobileNumber.trim());
                    sessionStorage.setItem('userRole', userData.userRole.trim());

                    document.cookie = `userId=${userData.userId}; path=/`;
                    document.cookie = `candidateName=${encodeURIComponent(userData.candidateName.trim())}; path=/`;
                    document.cookie = `emailId=${encodeURIComponent(userData.emailId.trim())}; path=/`;
                    alert("Login Successful.");
                    window.location.href = 'about-the-instruments.html';
                } else {
                    alert("Login failed: Invalid credentials or no data found.");
                }
            },
            error: function(xhr, status, error) {
                console.error("Error: " + error);
                alert("An error occurred. Please try again.");
            }
        });
    });

    function validateField(fieldId, errorId, errorMessage) {
        const fieldValue = $(fieldId).val().trim();
        if (fieldValue === '') {
            $(errorId).text(errorMessage);
            $(fieldId).addClass('is-invalid');
            return false;
        } else {
            $(errorId).text('');
            $(fieldId).removeClass('is-invalid');
            return true;
        }
    }

    // register user button or create new user details

    // $('.lpu-btn').click(function (event) {
    //     event.preventDefault(); // Prevent form from submitting normally
    //     // Validation
    //     // Perform final validation before submission
    //     const isFormValid = validateField('#UserEmail', '#UserEmailError', 'Email is required') &&
    //         validateField('#CandidateName', '#CandidateNameError', 'Candidate Name is required') &&
    //         validateField('#SupervisorName', '#SupervisorNameError', 'Supervisor Name is required') &&
    //         validateField('#MobileNumber', '#MobileNumberError', 'Mobile Number is required') &&
    //         validateField('#InstituteName', '#InstituteNameError', 'Organization Name is required') &&
    //         validateField('#DepartmentName', '#DepartmentNameError', 'Department Name is required') &&
    //         validateField('#IdProofNumber', '#IdProofNumberError', 'ID Proof Number is required') &&
    //         validateField('#txtAddress', '#txtAddressError', 'Corresponding Address is required') &&
    //         validateField('#PasswordText', '#PasswordTextError', 'Password is required') &&
    //         validateField('#reg-confirm-password', '#ConfirmPasswordError', 'Confirm Password is required') &&
    //         ($('#PasswordText').val() === $('#reg-confirm-password').val());

    //     if (!isFormValid) {
    //         alert('Please fill out all required fields correctly.');
    //         return;
    //     }
    //     // Gather form data
    //     const formData = new FormData();
    //     formData.append('UserEmail', $('#UserEmail').val());
    //     formData.append('CandidateName', $('#CandidateName').val());
    //     formData.append('SupervisorName', $('#SupervisorName').val());
    //     formData.append('MobileNumber', $('#MobileNumber').val());
    //     formData.append('SchoolName', $('#InstituteName').val());
    //     formData.append('DepartmentName', $('#DepartmentName').val());
    //     formData.append('IdProofType', $('input[name="IdProofType"]:checked').val());
    //     formData.append('IdProofNumber', $('#IdProofNumber').val());
    //     formData.append('UserType', $('#UserRole').val());
    //     formData.append('Address', $('#txtAddress').val());
    //     formData.append('PasswordText', $('#PasswordText').val());

    //     $.ajax({
    //         url: apiUrl + 'CreateCIFUserAccount',
    //         type: 'POST',
    //         headers: {
    //             'Authorization': `Bearer ${Apitoken}`,
    //         },
    //         data: formData,
    //         processData: false, // Prevent jQuery from processing the data
    //         contentType: false, // Let the browser set the Content-Type header
    //         success: function (response) {
    //             alert('User created successfully!');
    //             $('form')[0].reset();
    //             window.location.reload();
    //         },
    //         error: function (xhr, status, error) {
    //             console.error('Error creating user:', error);
    //             alert('Failed to create user.');
    //             $('userForm')[0].reset();
    //             $('#userForm')[0].reset(); // Reset the form
    //         }
    //     });
    // });

    // logic register user ends here

    // login button  function starts
    // $('#loginButton').click(function(e) {
    //     e.preventDefault();
    //     var email = $('#loginid').val();
    //     var password = $('#password').val();
    //     var Userrole = $('#UserRoleS').val();
    //     if (email === "" || password === "" || Userrole === "select") {
    //         alert("Please enter All Fields email and password as well as Role.");
    //         return;
    //     }

    //     var LoginapiUrl = apiUrl + 'GetUserDataIdWise?Email=' + encodeURIComponent(email) +
    //                  '&PasswordText=' + encodeURIComponent(password) + '&UserRole=' + encodeURIComponent(Userrole);

    //     $.ajax({
    //         url: LoginapiUrl,
    //         type: 'GET',
    //         headers: {
    //             'Authorization': `Bearer ${Apitoken}`
    //         },
    //         success: function(response) {
    //             if (response.item1 && response.item1.length > 0) {
    //                 var userData = response.item1[0];

    //                 sessionStorage.setItem('userId', userData.userId);
    //                 sessionStorage.setItem('candidateName', userData.candidateName.trim());
    //                 sessionStorage.setItem('departmentName', userData.departmentName.trim());
    //                 sessionStorage.setItem('supervisorName', userData.supervisorName.trim());
    //                 sessionStorage.setItem('emailId', userData.emailId.trim());
    //                 sessionStorage.setItem('mobileNumber', userData.mobileNumber.trim());
    //                 sessionStorage.setItem('userRole', userData.userRole.trim());

    //                 document.cookie = `userId=${userData.userId}; path=/`;
    //                 document.cookie = `candidateName=${encodeURIComponent(userData.candidateName.trim())}; path=/`;
    //                 document.cookie = `emailId=${encodeURIComponent(userData.emailId.trim())}; path=/`;
    //                 alert("Login Successfull.");
    //                 window.location.href = 'about-the-instruments.html';
    //             } else {
    //                 alert("Login failed: Invalid credentials or no data found.");
    //                 window.location.reload();
    //             }
    //         },
    //         error: function(xhr, status, error) {
    //             console.error("Error: " + error);
    //             alert("An error occurred. Please try again.");
    //         }
    //     });
    // });

    // loing button ends

    $("#cancelBtn").click(function () {
        window.location.href = 'your-cancel-url-here.html';  // Replace with your cancel page URL
    });

    // New Login and Toggle Password Code
    $(".login-div").removeClass("d-none");

    $(".toggle-password").on('click', function() {
        $(this).toggleClass("input-eye-slash");
        if ($('#password').attr("type") == "password") {
            $('#password').attr("type", "text");
        } else {
            $('#password').attr("type", "password");
        }
    });

    $(".r-toggle-password").on('click', function() {
        $(this).toggleClass("input-eye-slash");
        if ($('#reg-password').attr("type") == "password") {
            $('#reg-password').attr("type", "text");
        } else {
            $('#reg-password').attr("type", "password");
        }
    });

    $(".cr-toggle-password").on('click', function() {
        $(this).toggleClass("input-eye-slash");
        if ($('#reg-confirm-password').attr("type") == "password") {
            $('#reg-confirm-password').attr("type", "text");
        } else {
            $('#reg-confirm-password').attr("type", "password");
        }
    });

    $(".reg-link").click(function() {
        $(".login-div").addClass("d-none");
        $(".reg-div").removeClass("d-none");
    });

    $(".login-link").click(function() {
        $(".login-div").removeClass("d-none");
        $(".reg-div").addClass("d-none");
    });
});
