(() => {
  "use strict";

  const form = document.getElementById("loginForm");
  const button = document.getElementById("loginBtn");
  const errorBox = document.getElementById("loginError");

  if (!form) return;

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.hidden = true;

    const password = form.querySelector('input[name="password"]')?.value || "";
    if (!password) {
      showError("Digite a senha para entrar.");
      return;
    }

    button.disabled = true;
    button.textContent = "Entrando…";

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível entrar. Tente novamente.");
      }

      window.location.href = "/admin";
    } catch (error) {
      showError(error.message || "Não foi possível entrar. Tente novamente.");
      button.disabled = false;
      button.textContent = "Entrar";
      form.querySelector('input[name="password"]')?.select();
    }
  });
})();
