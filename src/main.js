import './index.css'
// Data storage
let contacts = [];
let groups = [];
let archivedContacts = [];
let currentView = 'messages';
let selectedContacts = [];
let currentChatId = null;
let messages = {};

// DOM elements
const contactForm = document.getElementById('contact-form');
const groupCreation = document.getElementById('group-creation');
const diffusionArea = document.getElementById('diffusion-area');
const contactsList = document.getElementById('contacts-list');
const searchInput = document.getElementById('search-input');
const messagesArea = document.getElementById('messages-area');
const messageInput = document.getElementById('message-input');
const nouveauGroupeBtn = document.getElementById('nouveau-groupe-btn');

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('bg-orange-500', 'text-white');
      b.classList.add('hover:bg-orange-400');
    });
    btn.classList.add('bg-orange-500', 'text-white');
    btn.classList.remove('hover:bg-orange-400');
    
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
      displayContacts(true); // true = show checkboxes
      break;
    case 'groups':
      nouveauGroupeBtn.classList.remove('hidden');
      displayGroups();
      break;
    case 'diffusion':
      diffusionArea.classList.remove('hidden');
      diffusionArea.classList.add('flex');
      displayContactsForDiffusion();
      break;
    case 'archives':
      displayArchivedContacts(true); // true = show checkboxes
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
  diffusionArea.classList.add('hidden');
  diffusionArea.classList.remove('flex');
  nouveauGroupeBtn.classList.add('hidden');
  contactsList.innerHTML = '';
  messagesArea.innerHTML = '';
  currentChatId = null;
}

// Contact creation
document.getElementById('btn-creer').addEventListener('click', createContact);

function createContact() {
  const nomInput = document.getElementById('input-nom');
  const numInput = document.getElementById('input-num');
  const nom = nomInput.value.trim();
  const num = numInput.value.trim();

  // Reset error messages
  hideErrors();

  // Validation
  if (!validateName(nom)) {
    showError('error-nom');
    return;
  }

  if (!validateNumber(num)) {
    showError('error-num');
    return;
  }

  // Check for duplicate number
  if (contacts.some(contact => contact.number === num)) {
    alert('Ce numéro existe déjà !');
    return;
  }

  // Handle duplicate names
  let finalName = nom;
  let counter = 2;
  while (contacts.some(contact => contact.name === finalName)) {
    finalName = `${nom}(${counter})`;
    counter++;
  }

  // Create contact
  const newContact = {
    id: Date.now(),
    name: finalName,
    number: num,
    archived: false
  };

  contacts.push(newContact);
  messages[newContact.id] = [];

  // Clear form
  nomInput.value = '';
  numInput.value = '';
  contactForm.classList.add('hidden');
  contactForm.classList.remove('flex');

  // Show contacts
  showView('messages');
}

function validateName(name) {
  return /^[a-zA-ZÀ-ÿ\s]+$/.test(name) && name.length > 0;
}

function validateNumber(number) {
  return /^\d+$/.test(number) && number.length > 0;
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
function displayContacts(showCheckboxes = false) {
  const filteredContacts = contacts.filter(contact => !contact.archived);
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
    contactItem.className = 'border border-b-orange-400 border border-r-orange-300 rounded-lg m-1 flex justify-between items-center p-2 cursor-pointer hover:bg-orange-100 transition-colors duration-200';
    contactItem.dataset.contactId = contact.id;
    
    contactItem.innerHTML = `
      <div class="flex items-center gap-2 flex-grow">
        
        <div class="flex flex-col flex-grow">
          <div class="font-semibold">${contact.name}</div>
          <div class="text-gray-600 text-sm">${contact.number}</div>
        </div>
        ${showCheckboxes ? `<input type="checkbox" class="contact-checkbox w-5 h-5 cursor-pointer" data-contact-id="${contact.id}">` : ''}
      </div>
    `;
    
    if (!showCheckboxes) {
      contactItem.addEventListener('click', () => openChat(contact));
    } else {
      contactItem.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          const checkbox = contactItem.querySelector('.contact-checkbox');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            updateSelectedContacts();
          }
        }
      });
    }
    
    contactsList.appendChild(contactItem);
  });

  if (showCheckboxes) {
    setupCheckboxListeners();
  }
}

function openChat(contact) {
  currentChatId = contact.id;
  displayMessages(contact.id);
  
  // Highlight selected contact
  document.querySelectorAll('.contact-item').forEach(item => {
    item.classList.remove('bg-orange-200');
  });
  const selectedItem = document.querySelector(`[data-contact-id="${contact.id}"]`);
  if (selectedItem) {
    selectedItem.classList.add('bg-orange-200');
  }
}

// Search functionality
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  let contactsToSearch = [];
  
  if (currentView === 'messages') {
    contactsToSearch = contacts.filter(contact => !contact.archived);
  } else if (currentView === 'archives') {
    contactsToSearch = archivedContacts;
  }
  
  const filteredContacts = contactsToSearch.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm)
  );
  
  renderContactsList(filteredContacts, currentView === 'messages' || currentView === 'archives');
});

// Messages
function displayMessages(contactId) {
  messagesArea.innerHTML = '';
  
  if (messages[contactId]) {
    messages[contactId].forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `max-w-xs p-2 rounded-xl m-1 ${
        message.type === 'sent' 
          ? 'self-end bg-green-200 rounded-br-sm' 
          : 'self-start bg-white rounded-bl-sm'
      }`;
      messageDiv.textContent = message.text;
      messagesArea.appendChild(messageDiv);
    });
  }
  
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Send message
// document.getElementById('send-btn').addEventListener('click', sendMessage);
// messageInput.addEventListener('keypress', (e) => {
//   if (e.key === 'Enter') {
//     sendMessage();
//   }
// });

// function sendMessage() {
//   const messageText = messageInput.value.trim();
//   if (!messageText || !currentChatId) return;

//   if (!messages[currentChatId]) {
//     messages[currentChatId] = [];
//   }

//   messages[currentChatId].push({
//     text: messageText,
//     type: 'sent',
//     timestamp: Date.now()
//   });

//   messageInput.value = '';
//   displayMessages(currentChatId);
// }

// Archive functionality
document.getElementById('btn-archive').addEventListener('click', archiveSelectedContacts);

function archiveSelectedContacts() {
  const selectedContactIds = getSelectedContactIds();
  
  if (selectedContactIds.length === 0) {
    alert('Veuillez sélectionner au moins un contact à archiver');
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
  messagesArea.innerHTML = '';
  displayContacts(true);
  alert(`${selectedContactIds.length} contact(s) archivé(s)`);
}

// Delete functionality
document.getElementById('btn-trash').addEventListener('click', deleteContacts);

function deleteContacts() {
  const selectedContactIds = getSelectedContactIds();
  
  if (selectedContactIds.length === 0) {
    alert('Veuillez sélectionner au moins un contact à supprimer');
    return;
  }

  if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedContactIds.length} contact(s) ?`)) {
    selectedContactIds.forEach(contactId => {
      contacts = contacts.filter(c => c.id !== contactId);
      archivedContacts = archivedContacts.filter(c => c.id !== contactId);
      delete messages[contactId];
    });
    
    currentChatId = null;
    messagesArea.innerHTML = '';
    
    if (currentView === 'messages') {
      displayContacts(true);
    } else if (currentView === 'archives') {
      displayArchivedContacts(true);
    }
    
    alert(`${selectedContactIds.length} contact(s) supprimé(s)`);
  }
}

// Group functionality
nouveauGroupeBtn.addEventListener('click', () => {
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
    alert('Veuillez entrer un nom de groupe');
    return;
  }
  
  if (selectedContacts.length < 2) {
    alert('Veuillez sélectionner au moins 2 contacts');
    return;
  }
  
  const newGroup = {
    id: Date.now(),
    name: groupName,
    members: selectedContacts,
    createdAt: Date.now()
  };
  
  groups.push(newGroup);
  messages[newGroup.id] = [];
  
  document.getElementById('group-name').value = '';
  showView('groups');
}

function displayGroups() {
  contactsList.innerHTML = '';
  
  groups.forEach(group => {
    const groupItem = document.createElement('div');
    groupItem.className = 'bg-orange-200 border border-orange-400 rounded-lg m-1 p-3 cursor-pointer hover:bg-orange-300 transition-colors';
    groupItem.dataset.groupId = group.id;
    
    const memberNames = group.members.map(member => member.name).join(', ');
    
    groupItem.innerHTML = `
      <div class="font-semibold mb-1">${group.name}</div>
      <div class="text-xs text-gray-600">${memberNames}</div>
    `;
    
    groupItem.addEventListener('click', () => openGroupChat(group));
    contactsList.appendChild(groupItem);
  });
}

function openGroupChat(group) {
  currentChatId = group.id;
  displayMessages(group.id);
}

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
    alert('Veuillez entrer un message');
    return;
  }
  
  if (selectedContacts.length === 0) {
    alert('Veuillez sélectionner au moins un contact');
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
  alert(`Message envoyé à ${selectedContacts.length} contact(s)`);
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

// Initialize
document.getElementById('btn-messages').classList.add('bg-orange-500', 'text-white');
showView('messages');
