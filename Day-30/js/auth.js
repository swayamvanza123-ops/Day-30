(() => {
const form=document.getElementById("loginForm");
if(form){if(sessionStorage.getItem("stockify_logged_in")==="yes")location.href="index.html";form.addEventListener("submit",e=>{e.preventDefault();const email=document.getElementById("loginEmail").value.trim().toLowerCase(),pass=document.getElementById("loginPassword").value,msg=document.getElementById("loginMessage");if(email==="admin@gmail.com"&&pass==="admin123"){sessionStorage.setItem("stockify_logged_in","yes");location.href="index.html";}else msg.textContent="Incorrect email or password.";});}
else {if(sessionStorage.getItem("stockify_logged_in")!=="yes")location.href="login.html";}
document.getElementById("logoutBtn")?.addEventListener("click",()=>{sessionStorage.removeItem("stockify_logged_in");location.href="login.html";});
})();