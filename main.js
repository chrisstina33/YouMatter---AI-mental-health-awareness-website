document.addEventListener("DOMContentLoaded", () => {

const settingsBtn = document.getElementById("settings_button");
const settingsPanel = document.getElementById("settings_panel");

const bgColorInput = document.getElementById("bgColor");
const aiNameInput = document.getElementById("aiName");
const memberFromInput = document.getElementById("memberFrom");

const saveBtn = document.getElementById("save_button");

const createAccountButton = document.getElementById("createAccountButton");
const chatButton = document.getElementById("chatButton");

const userEmail = localStorage.getItem("userEmail");


/* Hide account settings if not logged */

if(!userEmail){

aiNameInput.parentElement.classList.add("hidden");
memberFromInput.parentElement.classList.add("hidden");

}


/* Load saved settings */

const savedColor = localStorage.getItem("bgColor") || "#B2EBF2";
document.body.style.backgroundColor = savedColor;
bgColorInput.value = savedColor;

const savedAIName = localStorage.getItem("aiName") || "";
aiNameInput.value = savedAIName;


/* Settings panel toggle */

settingsBtn.addEventListener("click", e => {

e.stopPropagation();

settingsPanel.style.display =
settingsPanel.style.display === "block" ? "none" : "block";

});


document.addEventListener("click", e => {

if(!settingsPanel.contains(e.target) && e.target !== settingsBtn)
settingsPanel.style.display = "none";

});


saveBtn.addEventListener("click", () => {
settingsPanel.style.display = "none";
});


/* Buttons */

createAccountButton.addEventListener("click", () => {

if(userEmail)
alert("Logged in as: " + userEmail);

else
window.location.href = "sign_up.html";

});


chatButton.addEventListener("click", () => {

window.location.href = "chatbot.html";

});


/* Settings inputs */

bgColorInput.addEventListener("input", e => {

document.body.style.backgroundColor = e.target.value;

localStorage.setItem("bgColor", e.target.value);

});


aiNameInput.addEventListener("input", e => {

localStorage.setItem("aiName", e.target.value);

});

});