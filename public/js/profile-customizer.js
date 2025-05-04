// profile-customizer.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const toggleEditBtn = document.getElementById('edit-toggle-button');
    const saveBtn = document.getElementById('save-button');
    const profileCards = document.querySelectorAll('.profile-card');
    const handles = document.querySelectorAll('.handle');
    const profileContainer = document.getElementById('profile-content');
    
    // State
    let isEditMode = false;
    let draggableInstances = [];
    let layoutState = {};
    
    // Initialize - Check if there's a saved layout
    initializeLayout();
    
    // Edit Mode Toggle
    toggleEditBtn.addEventListener('click', function() {
      isEditMode = !isEditMode;
      
      if (isEditMode) {
        // Enter edit mode
        toggleEditBtn.textContent = 'Exit Edit Mode';
        toggleEditBtn.classList.remove('bg-dark');
        toggleEditBtn.classList.add('bg-dark_color');
        saveBtn.classList.remove('hidden');
        
        // Show handles
        handles.forEach(handle => {
          handle.classList.remove('hidden');
        });
        
        // Make cards draggable
        enableDraggable();
        
        // Change cursor for all cards
        profileCards.forEach(card => {
          card.style.cursor = 'move';
          card.classList.add('border-2', 'border-dashed', 'border-mid_color');
        });
      } else {
        // Exit edit mode
        toggleEditBtn.textContent = 'Edit Profile';
        toggleEditBtn.classList.remove('bg-dark_color');
        toggleEditBtn.classList.add('bg-dark');
        saveBtn.classList.add('hidden');
        
        // Hide handles
        handles.forEach(handle => {
          handle.classList.add('hidden');
        });
        
        // Disable draggable
        disableDraggable();
        
        // Reset cursor
        profileCards.forEach(card => {
          card.style.cursor = 'default';
          card.classList.remove('border-2', 'border-dashed', 'border-mid_color');
        });
      }
    });
    
    // Save Layout
    saveBtn.addEventListener('click', function() {
      saveLayout();
      
      // Visual feedback
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 1500);
    });
    
    // Enable GSAP Draggable
    function enableDraggable() {
      profileCards.forEach(card => {
        const draggable = Draggable.create(card, {
          type: 'x,y',
          edgeResistance: 0.65,
          bounds: profileContainer,
          inertia: true,
          onDragStart: function() {
            gsap.to(card, { duration: 0.2, scale: 1.05, boxShadow: "0 10px 15px rgba(0,0,0,0.1)" });
          },
          onDragEnd: function() {
            gsap.to(card, { duration: 0.2, scale: 1, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" });
            updateCardPosition(card);
          }
        });
        
        draggableInstances.push(draggable[0]);
      });
    }
    
    // Disable GSAP Draggable
    function disableDraggable() {
      draggableInstances.forEach(instance => {
        instance.kill();
      });
      draggableInstances = [];
    }
    
    // Save card positions and visibility to localStorage
    function saveLayout() {
      profileCards.forEach(card => {
        const cardId = card.getAttribute('data-card-id');
        layoutState[cardId] = {
          x: card._gsTransform ? card._gsTransform.x : 0,
          y: card._gsTransform ? card._gsTransform.y : 0,
          visible: !card.classList.contains('hidden')
        };
      });
      
      localStorage.setItem('profileLayout', JSON.stringify(layoutState));
    }
    
    // Update card position in tracking object
    function updateCardPosition(card) {
      const cardId = card.getAttribute('data-card-id');
      if (!layoutState[cardId]) {
        layoutState[cardId] = {};
      }
      
      layoutState[cardId].x = card._gsTransform.x;
      layoutState[cardId].y = card._gsTransform.y;
    }
    
    // Load layout from localStorage
    function initializeLayout() {
      const savedLayout = localStorage.getItem('profileLayout');
      
      if (savedLayout) {
        layoutState = JSON.parse(savedLayout);
        
        profileCards.forEach(card => {
          const cardId = card.getAttribute('data-card-id');
          if (layoutState[cardId]) {
            gsap.set(card, {
              x: layoutState[cardId].x,
              y: layoutState[cardId].y
            });
            
            if (layoutState[cardId].visible === false) {
              card.classList.add('hidden');
            }
          }
        });
      }
    }
    
    // Double-click to toggle card visibility (only in edit mode)
    profileCards.forEach(card => {
      card.addEventListener('dblclick', function(e) {
        if (isEditMode && e.target.closest('.card-header')) {
          const cardId = card.getAttribute('data-card-id');
          
          // Toggle visibility state in our tracking object
          if (!layoutState[cardId]) {
            layoutState[cardId] = { visible: true };
          }
          
          layoutState[cardId].visible = !layoutState[cardId].visible;
          
          // Animate card disappearance
          if (layoutState[cardId].visible) {
            card.classList.remove('hidden');
            gsap.fromTo(card, 
              { opacity: 0, scale: 0.8 }, 
              { duration: 0.3, opacity: 1, scale: 1 }
            );
          } else {
            gsap.to(card, {
              duration: 0.3, 
              opacity: 0, 
              scale: 0.8,
              onComplete: () => {
                card.classList.add('hidden');
              }
            });
          }
        }
      });
    });
  });