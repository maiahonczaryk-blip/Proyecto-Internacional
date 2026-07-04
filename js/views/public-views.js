window.App = window.App || {};
App.views = App.views || {};

App.views.public = {
  initIntake: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('intake-welcome-msg');
    
    // Find the realtor to show a personalized message
    if (refCode && App.demoData && App.demoData.users) {
      const realtor = App.demoData.users.find(u => u.referralCode === refCode);
      if (realtor) {
        welcomeMsg.innerHTML = `<span class="lang-en">You've been invited by <strong>${realtor.firstName} ${realtor.lastName}</strong> to the VIP Client Program. Please detail your needs below.</span>
                                <span class="lang-es">Has sido invitado por <strong>${realtor.firstName} ${realtor.lastName}</strong> al Programa de Clientes VIP. Detalla tus necesidades a continuación.</span>`;
      }
    }

    const form = document.getElementById('intake-form');
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect checked services
        const services = Array.from(newForm.querySelectorAll('.intake-service:checked')).map(cb => cb.value);

        const clientData = {
          id: 'client_' + Date.now(),
          firstName: newForm.querySelector('#intake-firstName').value,
          lastName: newForm.querySelector('#intake-lastName').value,
          email: newForm.querySelector('#intake-email').value,
          phone: newForm.querySelector('#intake-phone').value,
          currentLocation: newForm.querySelector('#intake-currentLocation').value,
          targetLocation: newForm.querySelector('#intake-targetLocation').value,
          services: services,
          status: 'contactado', // Default kanban status
          createdAt: new Date().toISOString(),
          notes: `Services requested: ${services.join(', ')}`,
          budget: 'TBD', // Placeholder
        };

        // Find the realtor and assign
        if (refCode) {
          const realtor = App.demoData.users.find(u => u.referralCode === refCode);
          if (realtor) {
            clientData.realtorId = realtor.id;
            clientData.realtorName = `${realtor.firstName} ${realtor.lastName}`;
            clientData.brokerId = realtor.brokerId || null;
          }
        }

        // Save to demoData
        if (!App.demoData.clients) App.demoData.clients = [];
        App.demoData.clients.push(clientData);

        // Success message
        alert("Your profile has been submitted successfully! We will contact you shortly.");
        
        // Clear form & redirect
        newForm.reset();
        App.router.navigateTo('home');
      });
    }
  }
};
