window.App = window.App || {};
App.views = App.views || {};

App.views.auth = {
  initLogin: function() {
    const form = document.getElementById('login-form');

    if (form) {
      // Remove old listeners to avoid duplicates
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const err = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-submit-btn');
        
        err.style.display = 'none';
        const oldText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner"></span>';
        submitBtn.disabled = true;

        try {
          const user = await App.auth.login(email, pass);
          if (user) {
            window.location.href = 'app.html#' + user.role + '/dashboard';
          }
        } catch (error) {
          err.textContent = error.message;
          err.style.display = 'block';
        } finally {
          submitBtn.innerHTML = oldText;
          submitBtn.disabled = false;
        }
      });
    }
  },

  initRegister: function(params) {
    const form = document.getElementById('register-form');
    // Implement logic if needed
  }
};
