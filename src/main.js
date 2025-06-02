import './index.css'
 // User management
      const users = [
        { id: 1, username: 'admin', password: 'admin123', name: 'Administrateur' },
        { id: 2, username: 'Aly', password: 'password', name: 'Aly' },
        { id: 3, username: 'sidy', password: '775943708', name: 'sidy' }
      ];
      
      let currentUser = null;
      let contacts = [];
      let groups = [];
      let archivedContacts = [];
      let currentView = 'messages';
      let selectedContacts = [];
      let currentChatId = null;
      let currentChatType = null; // 'contact' ou 'group'
      let messages = {};
      let drafts = {}; // Stockage des brouillons
      let lastMessageInput = ''; // Pour détecter les changements
      
      // DOM elements
      const loginScreen = document.getElementById('login-screen');
      const mainApp = document.getElementById('main-app');
      const loginForm = document.getElementById('login-form');
      const loginError = document.getElementById('login-error');
      const logoutBtn = document.getElementById('logout-btn');
      const currentUserName = document.getElementById('current-user-name');
      
      const contactForm = document.getElementById('contact-form');
      const groupCreation = document.getElementById('group-creation');
      const groupManagement = document.getElementById('group-management');
      const diffusionArea = document.getElementById('diffusion-area');
      const contactsList = document.getElementById('contacts-list');
      const searchInput = document.getElementById('search-input');
      const messagesArea = document.getElementById('messages-area');
      const messageInput = document.getElementById('message-input');
      const nouveauGroupeBtn = document.getElementById('nouveau-groupe-btn');
      const chatTitle = document.getElementById('chat-title');
      const btnManageGroup = document.getElementById('btn-manage-group');
      
      // Login functionality
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          currentUser = user;
          currentUserName.textContent = `(${user.name})`;
          loginScreen.classList.add('hidden');
          mainApp.classList.remove('hidden');
          // Sauvegarde dans le localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          initializeApp();
        } else {
          loginError.classList.remove('hidden');
        }
      });
      
      // Logout functionality
      logoutBtn.addEventListener('click', () => {
        currentUser = null;
        contacts = [];
        groups = [];
        archivedContacts = [];
        messages = {};
        drafts = {};
        currentChatId = null;
        currentChatType = null;

        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginError.classList.add('hidden');

        mainApp.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        // Supprime du localStorage
        localStorage.removeItem('currentUser');
      });
      
      function initializeApp() {
        // Initialize with some sample data
        contacts = [
          { id: 1, name: 'Aly', number: '777777777', archived: false },
          { id: 2, name: 'moussa', number: '762126377', archived: false },
          { id: 3, name: 'sidy', number: '775943708', archived: false }
        ];
        
        groups = [
          { 
            id: 1001, 
            name: 'Famille', 
            members: [
              { ...contacts[0], role: 'admin' },
              { ...contacts[1], role: 'member' }
            ],
            admins: [contacts[0].id],
            createdBy: currentUser.id,
            createdAt: Date.now()
          }
        ];
        
        // Initialize messages
        contacts.forEach(contact => {
          messages[contact.id] = [
            { text: 'Salut! Comment ça va?', type: 'received', timestamp: Date.now() - 3600000 },
            { text: 'Ça va bien, merci!', type: 'sent', timestamp: Date.now() - 3000000 } 
          ];
        });
        
        groups.forEach(group => {
          messages[group.id] = [
            { text: 'Message de groupe', type: 'received', timestamp: Date.now() - 1800000, sender: 'Alice' }
          ];
        });
        
        showView('messages');
      }
      
      // Navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Save draft if switching away from a chat
          saveDraftIfNeeded();
          
          document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          
          const btnId = btn.id;
          if (btnId === 'btn-messages') {
            showView('messages');
          } else if (btnId === 'btn-groupes') {
            showView('groups');
          } else if (btnId === 'btn-diffusion') {
            showView('diffusion');
          } else if (btnId === 'btn-archives') {
            showView('archives');
          } else if (btnId === 'btn-nouveau') {
            showView('nouveau');
          }
        });
      });
      
      function showView(view) {
        currentView = view;
        hideAllViews();

        switch(view) {
          case 'messages':
            displayContacts(true); // <-- Affiche les cases à cocher pour permettre la suppression
            break;
          case 'groups':
            nouveauGroupeBtn.classList.remove('hidden');
            displayGroups();
            break;
          case 'diffusion':
            // Affiche la liste des contacts avec cases à cocher
            displayContacts(true);
            // Vide la zone de chat
            messagesArea.innerHTML = '';
            chatTitle.textContent = 'Diffusion';
            break;
          case 'archives':
            displayArchivedContacts(true);
            break;
          case 'nouveau':
            contactForm.classList.remove('hidden');
            contactForm.classList.add('flex');
            break;
        }
      }
      
      function hideAllViews() {
        contactForm.classList.add('hidden');
        contactForm.classList.remove('flex');
        groupCreation.classList.add('hidden');
        groupManagement.classList.add('hidden');
        diffusionArea.classList.add('hidden');
        diffusionArea.classList.remove('flex');
        nouveauGroupeBtn.classList.add('hidden');
        btnManageGroup.classList.add('hidden');
        contactsList.innerHTML = '';
        messagesArea.innerHTML = '';
        chatTitle.textContent = '';
        currentChatId = null;
        currentChatType = null;
      }
      
      // Contact creation
      document.getElementById('btn-creer').addEventListener('click', createContact);
      
      function createContact() {
        const nomInput = document.getElementById('input-nom');
        const numInput = document.getElementById('input-num');
        const nom = nomInput.value.trim();
        const num = numInput.value.trim();
        
        hideErrors();
        
        if (!validateName(nom)) {
          showError('error-nom');
          return;
        }
        
        if (!validateNumber(num)) {
          showError('error-num');
          return;
        }
        
        if (contacts.some(contact => contact.number === num)) {
          showMiniPopup('Ce numéro existe déjà !');
          return;
        }
        
        let finalName = nom;
        let counter = 1;
        while (contacts.some(contact => contact.name === finalName)) {
          finalName = `${nom}(${counter})`;
          counter++;
        }
        
        const newContact = {
          id: Date.now(),
          name: finalName,
          number: num,
          archived: false
        };
        
        contacts.push(newContact);
        messages[newContact.id] = [];

        nomInput.value = '';
        numInput.value = '';
        contactForm.classList.add('hidden');
        contactForm.classList.remove('flex');
        
        // Correction ici : afficher la liste sans checkbox
        displayContacts(false);
        // Optionnel : ouvrir directement le chat du nouveau contact
        // openChat(newContact, 'contact');
      }
      
      function validateNumber(number) {
        return /^\d+$/.test(number) && number.length > 0;
      }
      
      function validateName(name) {
        return /^[A-Za-zÀ-ÿ\s\-']+$/.test(name) && name.length > 0;
      }
      
      function showError(errorId) {
        const errorElement = document.getElementById(errorId);
        errorElement.classList.remove('hidden');
      }
      
      function hideErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
          error.classList.add('hidden');
        });
      }
      
      // Display contacts
      // Affiche uniquement les contacts avec au moins un message
function displayContacts(showCheckboxes = false) {
  const filteredContacts = contacts.filter(
    contact => !contact.archived && messages[contact.id] && messages[contact.id].length > 0
  );
  renderContactsList(filteredContacts, showCheckboxes);
}

      function displayArchivedContacts(showCheckboxes = false) {
        renderContactsList(archivedContacts, showCheckboxes);
      }
      
      function renderContactsList(contactsToShow, showCheckboxes) {
        contactsList.innerHTML = '';

        contactsToShow.sort((a, b) => a.name.localeCompare(b.name));

        contactsToShow.forEach(contact => {
          const contactItem = document.createElement('div');
          contactItem.className = 'contact-item';
          contactItem.dataset.contactId = contact.id;

          const hasDraft = drafts[contact.id] && drafts[contact.id].trim() !== '';

          let actions = '';
          // Affiche le bouton "Désarchiver" uniquement dans la vue archives
          if (currentView === 'archives') {
            actions = `<button class="btn-small btn-admin btn-desarchiver" data-contact-id="${contact.id}">Désarchiver</button>`;
          }

          contactItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <div style="display: flex; flex-direction: column; flex: 1;">
                <div style="font-weight: 600;">${contact.name}</div>
                <div style="color: rgb(75 85 99); font-size: 14px;">${contact.number}</div>
                ${hasDraft ? '<span class="draft-indicator">Brouillon</span>' : ''}
              </div>
              ${showCheckboxes ? `<input type="checkbox" class="contact-checkbox w-5 h-5" style="cursor: pointer;" data-contact-id="${contact.id}">` : ''}
              ${actions}
            </div>
          `;

          contactItem.addEventListener('click', (e) => {
            if (showCheckboxes && e.target.type === 'checkbox') {
              updateSelectedContacts();
              return;
            }
            // Ne pas ouvrir le chat si on clique sur le bouton désarchiver
            if (e.target.classList.contains('btn-desarchiver')) return;
            openChat(contact, 'contact');
          });

          contactsList.appendChild(contactItem);
        });

        if (showCheckboxes) {
          setupCheckboxListeners();
        }

        // Ajoute l'écouteur pour le bouton "Désarchiver"
        if (currentView === 'archives') {
          document.querySelectorAll('.btn-desarchiver').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              const contactId = parseInt(this.dataset.contactId);
              desarchiverContact(contactId);
            });
          });
        }
      }
      
      function openChat(contact, type) {
        // Save current draft before switching
        saveDraftIfNeeded();
        
        currentChatId = contact.id;
        currentChatType = type;
        chatTitle.textContent = contact.name || contact.title;
        
        if (type === 'group') {
          btnManageGroup.classList.remove('hidden');
        } else {
          btnManageGroup.classList.add('hidden');
        }
        
        displayMessages(contact.id);
        
        // Load draft if exists
        if (drafts[contact.id]) {
          messageInput.value = drafts[contact.id];
          lastMessageInput = drafts[contact.id];
        } else {
          messageInput.value = '';
          lastMessageInput = '';
        }
        
        // Highlight selected contact
        document.querySelectorAll('.contact-item, .group-item').forEach(item => {
          item.classList.remove('selected');
        });
        const selectedItem = document.querySelector(`[data-contact-id="${contact.id}"], [data-group-id="${contact.id}"]`);
        if (selectedItem) {
          selectedItem.classList.add('selected');
        }
      }
      
      // Search functionality - mise à jour en temps réel
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        if (searchTerm === '*') {
          if (currentView === 'messages') {
            // Affiche tous les contacts non archivés, triés
            const allContacts = contacts.filter(contact => !contact.archived)
              .sort((a, b) => a.name.localeCompare(b.name));
            renderContactsList(allContacts, true);
          } else if (currentView === 'archives') {
            const allArchived = archivedContacts.slice().sort((a, b) => a.name.localeCompare(b.name));
            renderContactsList(allArchived, true);
          } else if (currentView === 'groups') {
            displayGroups();
          }
          return;
        }

        let contactsToSearch = [];

        if (currentView === 'messages') {
          contactsToSearch = contacts.filter(
            contact => !contact.archived && messages[contact.id] && messages[contact.id].length > 0
          );
        } else if (currentView === 'archives') {
          contactsToSearch = archivedContacts;
        } else if (currentView === 'groups') {
          const filteredGroups = groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm)
          );
          renderGroupsList(filteredGroups);
          return;
        }

        const filteredContacts = contactsToSearch.filter(contact =>
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.number.includes(searchTerm)
        );

        renderContactsList(filteredContacts, currentView === 'messages' || currentView === 'archives');
      });
      
      // Messages
      function displayMessages(chatId) {
        messagesArea.innerHTML = '';
        
        if (messages[chatId]) {
          messages[chatId].forEach(message => {
            const messageDiv = document.createElement('div');
            let messageClass = 'message ';
            messageClass += message.type === 'sent' ? 'sent' : 'received';
            
            messageDiv.className = messageClass;
            
            let messageContent = message.text;
            if (message.sender && currentChatType === 'group') {
              messageContent = `${message.sender}: ${message.text}`;
            }
            
            messageDiv.textContent = messageContent;
            messagesArea.appendChild(messageDiv);
          });
        }
        
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
      
      // Draft management
      function saveDraftIfNeeded() {
        if (currentChatId && messageInput.value.trim() !== '' && messageInput.value !== lastMessageInput) {
          drafts[currentChatId] = messageInput.value.trim();
        } else if (currentChatId && messageInput.value.trim() === '') {
          delete drafts[currentChatId];
        }
      }
      
      // Track input changes for draft detection
      messageInput.addEventListener('input', () => {
        // Auto-save draft every 2 seconds of inactivity
        clearTimeout(messageInput.draftTimeout);
        messageInput.draftTimeout = setTimeout(() => {
          if (currentChatId && messageInput.value.trim() !== lastMessageInput) {
            if (messageInput.value.trim() === '') {
              delete drafts[currentChatId];
            } else {
              drafts[currentChatId] = messageInput.value.trim();
            }
            // Refresh the contact list to show/hide draft indicator
            if (currentView === 'messages') {
              displayContacts(true);
            }
          }
        }, 2000);
      });
      
      // Send message
      document.getElementById('send-btn').addEventListener('click', sendMessage);
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
      
      function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        // Si on est en mode diffusion
        if (currentView === 'diffusion') {
          const selectedContactIds = getSelectedContactIds();
          if (selectedContactIds.length === 0) {
            showMiniPopup('Veuillez sélectionner au moins un contact pour la diffusion.');
            return;
          }
          selectedContactIds.forEach(contactId => {
            if (!messages[contactId]) messages[contactId] = [];
            messages[contactId].push({
              text: messageText,
              type: 'sent',
              timestamp: Date.now()
            });
          });
          messageInput.value = '';
          lastMessageInput = '';
          showMiniPopup(`Message diffusé à ${selectedContactIds.length} contact(s)`);
          return;
        }

        // Sinon, comportement normal
        if (!currentChatId) return;

        if (!messages[currentChatId]) {
          messages[currentChatId] = [];
        }

        const newMessage = {
          text: messageText,
          type: 'sent',
          timestamp: Date.now()
        };

        if (currentChatType === 'group') {
          newMessage.sender = currentUser.name;
        }

        messages[currentChatId].push(newMessage);

        // Clear draft
        delete drafts[currentChatId];

        messageInput.value = '';
        lastMessageInput = '';
        displayMessages(currentChatId);

        // Refresh contact list to remove draft indicator
        if (currentView === 'messages') {
          displayContacts(true);
        }
      }
      
      // Archive functionality
      document.getElementById('btn-archive').addEventListener('click', archiveSelectedContacts);
      
      function archiveSelectedContacts() {
        const selectedContactIds = getSelectedContactIds();
        
        if (selectedContactIds.length === 0) {
          showMiniPopup('Veuillez sélectionner au moins un contact à archiver');
          return;
        }
        
        selectedContactIds.forEach(contactId => {
          const contact = contacts.find(c => c.id === contactId);
          if (contact) {
            contact.archived = true;
            archivedContacts.push(contact);
            contacts = contacts.filter(c => c.id !== contactId);
          }
        });
        
        currentChatId = null;
        currentChatType = null;
        messagesArea.innerHTML = '';
        chatTitle.textContent = '';
        displayContacts(true);
        showMiniPopup(`${selectedContactIds.length} contact(s) archivé(s)`);
      }
      
      // Delete functionality
      document.getElementById('btn-trash').addEventListener('click', deleteContacts);
      
      function deleteContacts() {
        const selectedContactIds = getSelectedContactIds();
        
        if (selectedContactIds.length === 0) {
          showMiniPopup('Veuillez sélectionner au moins un contact à supprimer');
          return;
        }
        showConfirmPopup(
          `Êtes-vous sûr de vouloir supprimer ${selectedContactIds.length} contact(s) ?`,
          () => {
            selectedContactIds.forEach(contactId => {
              contacts = contacts.filter(c => c.id !== contactId);
              archivedContacts = archivedContacts.filter(c => c.id !== contactId);
              delete messages[contactId];
              delete drafts[contactId];
            });

            currentChatId = null;
            currentChatType = null;
            messagesArea.innerHTML = '';
            chatTitle.textContent = '';

            if (currentView === 'messages') {
              displayContacts(true);
            } else if (currentView === 'archives') {
              displayArchivedContacts(true);
            }

            showMiniPopup(`${selectedContactIds.length} contact(s) supprimé(s)`);
          }
        );
      }
      
      // Group functionality
      nouveauGroupeBtn.addEventListener('click', () => {
        saveDraftIfNeeded();
        hideAllViews();
        groupCreation.classList.remove('hidden');
        displayContactsForGroupCreation();
      });
      
      function displayContactsForGroupCreation() {
        const groupContactsDiv = document.getElementById('group-contacts');
        groupContactsDiv.innerHTML = '';
        
        contacts.forEach(contact => {
          const contactItem = document.createElement('div');
          contactItem.className = 'border border-orange-300 rounded-lg m-1 flex items-center p-2 hover:bg-orange-100 transition-colors cursor-pointer';
          contactItem.innerHTML = `
            <input type="checkbox" class="contact-checkbox w-5 h-5 mr-3 cursor-pointer" data-contact-id="${contact.id}">
            <div class="flex flex-col flex-grow">
              <div class="font-semibold">${contact.name}</div>
              <div class="text-gray-600 text-sm">${contact.number}</div>
            </div>
          `;
          
          contactItem.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
              const checkbox = contactItem.querySelector('.contact-checkbox');
              checkbox.checked = !checkbox.checked;
            }
          });
          
          groupContactsDiv.appendChild(contactItem);
        });
      }
      
      document.getElementById('create-group-btn').addEventListener('click', createGroup);
      
      function createGroup() {
        const groupName = document.getElementById('group-name').value.trim();
        const selectedContacts = getSelectedContactsFromCheckboxes();
        
        if (!groupName) {
          showMiniPopup('Veuillez entrer un nom de groupe');
          return;
        }
        
        if (selectedContacts.length < 2) {
          showMiniPopup('Veuillez sélectionner au moins 2 contacts');
          return;
        }
        
        const newGroup = {
          id: Date.now(),
          name: groupName,
          members: selectedContacts.map(contact => ({ ...contact, role: 'member' })),
          admins: [currentUser.id],
          createdBy: currentUser.id,
          createdAt: Date.now()
        };
        
        // Ajouter le créateur comme admin s'il n'est pas dans les contacts
        const creatorInGroup = newGroup.members.find(m => m.id === currentUser.id);
        if (!creatorInGroup) {
          newGroup.members.unshift({
            id: currentUser.id,
            name: currentUser.name,
            number: 'admin',
            role: 'admin'
          });
        } else {
          creatorInGroup.role = 'admin';
        }
        
        groups.push(newGroup);
        messages[newGroup.id] = [];
        
        document.getElementById('group-name').value = '';
        showView('groups');
      }
      
      function displayGroups() {
        contactsList.innerHTML = '';
        renderGroupsList(groups);
      }
      
      function renderGroupsList(groupsToShow) {
        contactsList.innerHTML = '';
        
        groupsToShow.forEach(group => {
          const groupItem = document.createElement('div');
          groupItem.className = 'group-item';
          groupItem.dataset.groupId = group.id;
          
          const memberNames = group.members.map(member => member.name).join(', ');
          const hasDraft = drafts[group.id] && drafts[group.id].trim() !== '';
          
          groupItem.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${group.name}</div>
            <div style="font-size: 12px; color: rgb(75 85 99);">${memberNames}</div>
            ${hasDraft ? '<span class="draft-indicator">Brouillon</span>' : ''}
          `;
          
          groupItem.addEventListener('click', () => openChat(group, 'group'));
          contactsList.appendChild(groupItem);
        });
      }
      
      // Group management
      btnManageGroup.addEventListener('click', () => {
        if (currentChatType === 'group') {
          const group = groups.find(g => g.id === currentChatId);
          if (group) {
            showGroupManagement(group);
          }
        }
      });
      
      function showGroupManagement(group) {
        hideAllViews();
        groupManagement.classList.remove('hidden');
        
        const membersList = document.getElementById('group-members-list');
        membersList.innerHTML = `<h4 style="margin-bottom: 1rem;">Membres de "${group.name}"</h4>`;
        
        const isCurrentUserAdmin = group.admins.includes(currentUser.id) || group.createdBy === currentUser.id;
        
        group.members.forEach(member => {
          const memberItem = document.createElement('div');
          memberItem.className = 'member-item';
          
          const isAdmin = member.role === 'admin';
          const isCreator = group.createdBy === member.id;
          
          memberItem.innerHTML = `
            <div>
              <span style="font-weight: 600;">${member.name}</span>
              ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
              ${isCreator ? '<span class="admin-badge" style="background: rgb(249 115 22);">Créateur</span>' : ''}
            </div>
            ${isCurrentUserAdmin && !isCreator && member.id !== currentUser.id ? `
              <div class="member-controls">
                <button class="btn-small ${isAdmin ? 'btn-remove' : 'btn-admin'}" onclick="toggleMemberRole(${group.id}, ${member.id})">
                  ${isAdmin ? 'Retirer Admin' : 'Nommer Admin'}
                </button>
                <button class="btn-small btn-remove" onclick="removeMember(${group.id}, ${member.id})">
                  Retirer
                </button>
              </div>
            ` : ''}
          `;
          
          membersList.appendChild(memberItem);
        });
        
        // Add back button
        const backBtn = document.createElement('button');
        backBtn.textContent = 'Retour au groupe';
        backBtn.className = 'btn-primary';
        backBtn.style.marginTop = '1rem';
        backBtn.onclick = () => showView('groups');
        membersList.appendChild(backBtn);
        
        // Delete group button for creator/admin
        if (isCurrentUserAdmin && group.createdBy === currentUser.id) {
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Supprimer le groupe';
          deleteBtn.className = 'btn-remove btn-small';
          deleteBtn.style.marginTop = '1rem';
          deleteBtn.onclick = function() {
            if (confirm('Voulez-vous vraiment supprimer ce groupe ?')) {
              groups = groups.filter(g => g.id !== group.id);
              delete messages[group.id];
              delete drafts[group.id];
              showView('groups');
              showMiniPopup('Groupe supprimé.');
            }
          };
          membersList.appendChild(deleteBtn);
        }
      }
      
      window.toggleMemberRole = function(groupId, memberId) {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        // Empêcher de retirer le rôle admin au créateur
        if (group.createdBy === memberId) {
          showMiniPopup("Impossible de modifier le rôle du créateur du groupe.");
          return;
        }

        const member = group.members.find(m => m.id === memberId);
        if (!member) return;

        if (member.role === 'admin') {
          member.role = 'member';
          group.admins = group.admins.filter(id => id !== memberId);
        } else {
          member.role = 'admin';
          if (!group.admins.includes(memberId)) {
            group.admins.push(memberId);
          }
        }

        showGroupManagement(group);
      };

      window.removeMember = function(groupId, memberId) {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        // Empêcher de retirer le créateur du groupe
        if (group.createdBy === memberId) {
          showMiniPopup("Impossible de retirer le créateur du groupe.");
          return;
        }

        showConfirmPopup(
          'Êtes-vous sûr de vouloir retirer ce membre du groupe ?',
          () => {
            group.members = group.members.filter(m => m.id !== memberId);
            group.admins = group.admins.filter(id => id !== memberId);

            showGroupManagement(group);
          }
        );
      };
      
      // Diffusion functionality
      function displayContactsForDiffusion() {
        const diffusionContactsDiv = document.getElementById('diffusion-contacts');
        diffusionContactsDiv.innerHTML = '';
        
        contacts.forEach(contact => {
          const contactItem = document.createElement('div');
          contactItem.className = 'border border-orange-300 rounded-lg m-1 flex items-center p-2 hover:bg-orange-100 transition-colors cursor-pointer';
          contactItem.innerHTML = `
            <input type="checkbox" class="contact-checkbox w-5 h-5 mr-3 cursor-pointer" data-contact-id="${contact.id}">
            <div class="flex flex-col flex-grow">
              <div class="font-semibold">${contact.name}</div>
              <div class="text-gray-600 text-sm">${contact.number}</div>
            </div>
          `;
          
          contactItem.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
              const checkbox = contactItem.querySelector('.contact-checkbox');
              checkbox.checked = !checkbox.checked;
            }
          });
          
          diffusionContactsDiv.appendChild(contactItem);
        });
      }
      
      document.getElementById('send-diffusion-btn').addEventListener('click', sendDiffusionMessage);
      
      function sendDiffusionMessage() {
        const messageText = document.getElementById('diffusion-message').value.trim();
        const selectedContacts = getSelectedContactsFromCheckboxes();
        
        if (!messageText) {
          showMiniPopup('Veuillez entrer un message');
          return;
        }
        
        if (selectedContacts.length === 0) {
          showMiniPopup('Veuillez sélectionner au moins un contact pour la diffusion.');
          return;
        }
        
        selectedContacts.forEach(contact => {
          if (!messages[contact.id]) {
            messages[contact.id] = [];
          }
          
          messages[contact.id].push({
            text: messageText,
            type: 'sent',
            timestamp: Date.now()
          });
        });
        
        document.getElementById('diffusion-message').value = '';
        uncheckAllBoxes();
        showMiniPopup(`Message envoyé à ${selectedContacts.length} contact(s)`);
      }
      
      // Checkbox utilities
      function setupCheckboxListeners() {
        document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', updateSelectedContacts);
        });
      }
      
      function updateSelectedContacts() {
        selectedContacts = getSelectedContactIds();
      }
      
      function getSelectedContactIds() {
        const selected = [];
        document.querySelectorAll('.contact-checkbox:checked').forEach(checkbox => {
          const contactId = parseInt(checkbox.dataset.contactId);
          selected.push(contactId);
        });
        return selected;
      }
      
      function getSelectedContactsFromCheckboxes() {
        const selected = [];
        document.querySelectorAll('.contact-checkbox:checked').forEach(checkbox => {
          const contactId = parseInt(checkbox.dataset.contactId);
          const contact = contacts.find(c => c.id === contactId);
          if (contact) {
            selected.push(contact);
          }
        });
        return selected;
      }
      
      function uncheckAllBoxes() {
        document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
          checkbox.checked = false;
        });
      }
      
      // Window beforeunload to save drafts
      window.addEventListener('beforeunload', () => {
        saveDraftIfNeeded();
      });
      
      // Page visibility change to save drafts
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          saveDraftIfNeeded();
        }
      });
      
      document.getElementById('broadcast-btn').addEventListener('click', function() {
  const messageText = messageInput.value.trim();
  if (!messageText) {
    showMiniPopup('Veuillez entrer un message à diffuser.');
    return;
  }
  if (contacts.length === 0) {
    showMiniPopup('Aucun contact pour la diffusion.');
    return;
  }
  contacts.forEach(contact => {
    if (!messages[contact.id]) messages[contact.id] = [];
    messages[contact.id].push({
      text: messageText,
      type: 'sent',
      timestamp: Date.now()
    });
  });
  messageInput.value = '';
  lastMessageInput = '';
  showMiniPopup(`Message diffusé à ${contacts.length} contact(s)`);
});
      
      // Affiche un mini pop-up en bas à droite
function showMiniPopup(message, duration = 2500) {
  const popup = document.getElementById('mini-popup');
  const popupMsg = document.getElementById('mini-popup-message');
  popupMsg.textContent = message;
  popup.style.display = 'flex';
  clearTimeout(popup._timeout);
  popup._timeout = setTimeout(() => {
    popup.style.display = 'none';
  }, duration);
}

function showConfirmPopup(message, onConfirm, onCancel) {
  // Crée le conteneur si pas déjà présent
  let confirmPopup = document.getElementById('mini-confirm-popup');
  if (!confirmPopup) {
    confirmPopup = document.createElement('div');
    confirmPopup.id = 'mini-confirm-popup';
    confirmPopup.style.position = 'fixed';
    confirmPopup.style.right = '32px';
    confirmPopup.style.bottom = '100px';
    confirmPopup.style.minWidth = '240px';
    confirmPopup.style.background = 'rgb(251 146 60)';
    confirmPopup.style.color = 'white';
    confirmPopup.style.padding = '20px 24px';
    confirmPopup.style.borderRadius = '8px';
    confirmPopup.style.boxShadow = '0 4px 24px rgba(249,115,22,0.18)';
    confirmPopup.style.fontWeight = '600';
    confirmPopup.style.fontSize = '1rem';
    confirmPopup.style.zIndex = '9999';
    confirmPopup.style.display = 'flex';
    confirmPopup.style.flexDirection = 'column';
    confirmPopup.style.alignItems = 'center';
    confirmPopup.style.gap = '16px';
    document.body.appendChild(confirmPopup);
  }
  confirmPopup.innerHTML = `
    <div style="margin-bottom: 12px; text-align: center;">${message}</div>
    <div style="display: flex; gap: 12px;">
      <button id="confirm-yes" style="background: white; color: rgb(251 146 60); border: none; border-radius: 4px; padding: 6px 18px; font-weight: 600; cursor: pointer;">Oui</button>
      <button id="confirm-no" style="background: rgb(220 38 38); color: white; border: none; border-radius: 4px; padding: 6px 18px; font-weight: 600; cursor: pointer;">Non</button>
    </div>
  `;
  confirmPopup.style.display = 'flex';

  document.getElementById('confirm-yes').onclick = () => {
    confirmPopup.style.display = 'none';
    if (onConfirm) onConfirm();
  };
  document.getElementById('confirm-no').onclick = () => {
    confirmPopup.style.display = 'none';
    if (onCancel) onCancel();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    currentUserName.textContent = `(${currentUser.name})`;
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    initializeApp();
  }
});

function desarchiverContact(contactId) {
  const contact = archivedContacts.find(c => c.id === contactId);
  if (!contact) return;
  contact.archived = false;
  contacts.push(contact);
  archivedContacts = archivedContacts.filter(c => c.id !== contactId);
  showMiniPopup('Contact désarchivé');
  displayArchivedContacts(true);
}