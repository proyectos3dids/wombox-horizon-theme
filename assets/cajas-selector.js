if (!customElements.get('cajas-selector')) {
  class CajasSelector extends HTMLElement {
    constructor() {
      super();
      this.clickStates = new Map(); // Track click states for each option
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.setInitialSelection();
      this.createImageModal();
    }

    setupEventListeners() {
      // Escuchar cambios en los radio buttons
      const radioButtons = this.querySelectorAll('input[type="radio"][name="caja-selection"]');
      radioButtons.forEach(radio => {
        radio.addEventListener('change', this.handleSelectionChange.bind(this));
      });

      // Escuchar clics en las etiquetas para mejor UX
      const labels = this.querySelectorAll('.cajas-option-label');
      labels.forEach(label => {
        label.addEventListener('click', this.handleLabelClick.bind(this));
      });
    }

    handleSelectionChange(event) {
      const target = event.target;
      if (!target || !(target instanceof HTMLInputElement)) return;
      
      const selectedValue = target.value;
      const selectedLabel = target.closest('.cajas-option')?.querySelector('.cajas-option-label');
      const selectedRadio = target;
      
      // Remover clase 'selected' de todas las opciones y resetear estados de click
      this.querySelectorAll('.cajas-option-label').forEach(label => {
        label.classList.remove('selected');
        // Resetear opacity: mostrar título, ocultar hint
        const title = label.querySelector('.cajas-option-title');
        const hint = label.querySelector('.cajas-expand-hint');
        if (title && hint && title instanceof HTMLElement && hint instanceof HTMLElement) {
          title.style.opacity = '1';
          hint.style.opacity = '0';
        }
      });
      
      // Resetear todos los estados de click excepto el seleccionado
        this.clickStates.clear();
        
        // Agregar clase 'selected' a la opción seleccionada
        if (selectedLabel) {
          selectedLabel.classList.add('selected');
          // Mantener el estado del radio seleccionado como 'unclicked' para que funcione el primer click
          this.clickStates.set(selectedRadio.id, 'unclicked');
        }
      
      // Disparar evento personalizado para notificar la selección
      this.dispatchEvent(new CustomEvent('cajaSelected', {
        detail: {
          value: selectedValue,
          element: event.target
        },
        bubbles: true
      }));
      
      // Log para debugging
      console.log('Caja seleccionada:', selectedValue);
    }

    handleLabelClick(event) {
      event.preventDefault();
      const label = event.currentTarget;
      const radio = label.closest('.cajas-option')?.querySelector('input[type="radio"]');
      if (!radio || !(radio instanceof HTMLInputElement)) return;
      
      const optionId = radio.id;
      const expandHint = label.querySelector('.cajas-expand-hint');
      const image = label.querySelector('.cajas-option-image img');
      
      // Get current click state for this option
      const currentState = this.clickStates.get(optionId) || 'unclicked';
      
      if (currentState === 'unclicked') {
        // First click: select the option and show hint
        if (radio instanceof HTMLInputElement && !radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
        
        // Intercambiar opacity entre título y hint
        const title = label.querySelector('.cajas-option-title');
        if (title instanceof HTMLElement && expandHint instanceof HTMLElement) {
          title.style.opacity = '0';
          expandHint.style.opacity = '1';
        }
        
        this.clickStates.set(optionId, 'first-clicked');
      } else if (currentState === 'first-clicked') {
        // Second click: enlarge image if available
        if (image) {
          this.enlargeImage(image);
        }
        
        this.clickStates.set(optionId, 'second-clicked');
      } else {
        // Subsequent clicks: just enlarge image
        if (image) {
          this.enlargeImage(image);
        }
      }
    }

    setInitialSelection() {
      // Seleccionar la primera opción por defecto si no hay ninguna seleccionada
      const checkedRadio = this.querySelector('input[type="radio"]:checked');
      if (!checkedRadio) {
        const firstRadio = this.querySelector('input[type="radio"]');
        if (firstRadio && firstRadio instanceof HTMLInputElement) {
          firstRadio.checked = true;
          firstRadio.dispatchEvent(new Event('change'));
        }
      } else {
        // Si ya hay una seleccionada, aplicar el estilo y disparar el evento
        const selectedLabel = checkedRadio.closest('.cajas-option').querySelector('.cajas-option-label');
        if (selectedLabel) {
          selectedLabel.classList.add('selected');
        }
        // Disparar el evento change para que se añada la propiedad al formulario
        checkedRadio.dispatchEvent(new Event('change'));
      }
    }

    // Método público para obtener la selección actual
    getSelectedValue() {
      const selectedRadio = this.querySelector('input[type="radio"]:checked');
      return (selectedRadio instanceof HTMLInputElement) ? selectedRadio.value : null;
    }

    // Método público para establecer una selección programáticamente
    setSelection(value) {
      const radio = this.querySelector(`input[type="radio"][value="${value}"]`);
      if (radio && radio instanceof HTMLInputElement) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    }

    createImageModal() {
      // Create modal HTML structure
      const modalHTML = `
        <div id="cajas-image-modal" class="cajas-modal" style="display: none;">
          <div class="cajas-modal-backdrop"></div>
          <div class="cajas-modal-content">
            <button class="cajas-modal-close">&times;</button>
            <img class="cajas-modal-image" src="" alt="">
          </div>
        </div>
      `;
      
      // Add modal to body if it doesn't exist
      if (!document.getElementById('cajas-image-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners for modal
        const modal = document.getElementById('cajas-image-modal');
        const closeBtn = modal?.querySelector('.cajas-modal-close');
        const backdrop = modal?.querySelector('.cajas-modal-backdrop');
        
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.closeImageModal());
        }
        if (backdrop) {
          backdrop.addEventListener('click', () => this.closeImageModal());
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal && modal instanceof HTMLElement && modal.style.display === 'block') {
            this.closeImageModal();
          }
        });
      }
    }

    enlargeImage(imgElement) {
      if (!(imgElement instanceof HTMLImageElement)) return;
      
      const modal = document.getElementById('cajas-image-modal');
      if (!modal || !(modal instanceof HTMLElement)) return;
      
      const modalImage = modal.querySelector('.cajas-modal-image');
      if (!modalImage || !(modalImage instanceof HTMLImageElement)) return;
      
      // Get larger version of the image
      const originalSrc = imgElement.src;
      const largerSrc = originalSrc.replace(/width=\d+/, 'width=400');
      
      modalImage.src = largerSrc;
      modalImage.alt = imgElement.alt;
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    closeImageModal() {
      const modal = document.getElementById('cajas-image-modal');
      if (modal && modal instanceof HTMLElement) {
        modal.style.display = 'none';
      }
      document.body.style.overflow = '';
    }
  }

  customElements.define('cajas-selector', CajasSelector);
}

// Funcionalidad adicional para integración con el formulario del producto
document.addEventListener('DOMContentLoaded', function() {
  const cajasSelector = document.querySelector('cajas-selector');
  const productForm = document.querySelector('product-form-component form[data-type="add-to-cart-form"]');
  
  if (cajasSelector && productForm) {
    // Obtener el texto personalizable desde el bloque
    const cajasBlock = cajasSelector.closest('.product-form__cajas');
    const selectedBoxText = (cajasBlock && cajasBlock instanceof HTMLElement && cajasBlock.dataset && cajasBlock.dataset.selectedBoxText) ? cajasBlock.dataset.selectedBoxText : 'Selected Box';
    
    // Función para actualizar la propiedad del producto
    function updateProductProperty(selectedValue) {
      if (!productForm) return;
      
      let hiddenInput = productForm.querySelector(`input[name="properties[${selectedBoxText}]"]`);
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        if (hiddenInput instanceof HTMLInputElement) {
          hiddenInput.type = 'hidden';
          hiddenInput.name = `properties[${selectedBoxText}]`;
        }
        productForm.appendChild(hiddenInput);
      }
      if (hiddenInput instanceof HTMLInputElement) {
        hiddenInput.value = selectedValue;
      }
      console.log('Propiedad del producto actualizada:', selectedValue);
    }
    
    // Escuchar selecciones de caja
    cajasSelector.addEventListener('cajaSelected', function(event) {
      if ('detail' in event && event.detail && typeof event.detail === 'object' && 'value' in event.detail) {
        const selectedValue = event.detail.value;
        updateProductProperty(selectedValue);
      }
    });
    
    // Establecer la propiedad inicial si ya hay una caja seleccionada
    setTimeout(() => {
      if ('getSelectedValue' in cajasSelector && typeof cajasSelector.getSelectedValue === 'function') {
        const initialValue = cajasSelector.getSelectedValue();
        if (initialValue) {
          updateProductProperty(initialValue);
        }
      }
    }, 100);
  }
});