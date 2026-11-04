// Check the registration form before sending it to Node.js.
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        let name = document.getElementById("name").value;
        let password = document.getElementById("password").value;

        if (name.trim() === "" || password.length < 4) {
            event.preventDefault();
            alert("Enter your name and a password with at least 4 characters.");
        }
    });
}

// Check that the login fields are not empty.
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        let email = document.getElementById("loginEmail").value;
        let password = document.getElementById("loginPassword").value;

        if (email.trim() === "" || password === "") {
            event.preventDefault();
            alert("Please enter your email and password.");
        }
    });
}

// Print the portfolio. In the print window, choose Save as PDF.
function printPortfolio() {
    window.print();
}
