if (!customElements.get('cajas-selector')) {
  class CajasSelector extends HTMLElement {
    constructor() {
      super();
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.setInitialSelection();
      this.calculateLayout();
      // Recalcular layout en resize
      window.addEventListener('resize', () => this.calculateLayout());
    }

    setupEventListeners() {
      // Escuchar cambios en los radio buttons
      const radioButtons = this.querySelectorAll('input[type="radio"][name="box-selection"]');
      radioButtons.forEach(radio => {
        radio.addEventListener('change', this.handleSelectionChange.bind(this));
      });

      // Escuchar clics en las etiquetas para mejor UX
      const labels = this.querySelectorAll('.cajas-option-label');
      labels.forEach(label => {
        label.addEventListener('click', this.handleLabelClick.bind(this));
      });

      // Escuchar clics específicos en las lupas
      const magnifiers = this.querySelectorAll('.cajas-magnifier-icon');
      magnifiers.forEach(magnifier => {
        magnifier.addEventListener('click', this.handleMagnifierClick.bind(this));
      });
    }

    /**
     * Maneja el cambio de selección
     * @param {Event} event - El evento de cambio
     */
    handleSelectionChange(event) {
      const target = event.target;
      if (!target || !(target instanceof HTMLInputElement)) return;
      
      const selectedValue = target.value;
      const selectedLabel = target.closest('.cajas-option')?.querySelector('.cajas-option-label');
      
      // Remover clase 'selected' de todas las opciones
      this.querySelectorAll('.cajas-option-label').forEach(label => {
        label.classList.remove('selected');
      });
      
      // Agregar clase 'selected' a la opción seleccionada
      if (selectedLabel) {
        selectedLabel.classList.add('selected');
      }
      
      // Disparar evento personalizado
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

    /**
     * Maneja el click en las etiquetas
     * @param {Event} event - El evento de click
     */
    handleLabelClick(event) {
      event.preventDefault();
      
      const target = event.target;
      if (!(target instanceof Element)) return;
      
      // Si el click fue en la lupa, no hacer nada (la lupa tiene su propio handler)
      if (target.closest('.cajas-magnifier-icon')) {
        return;
      }
      
      const label = target.closest('.cajas-option-label');
      if (!label) return;
      
      const radio = label.closest('.cajas-option')?.querySelector('input[type="radio"]');
      if (!radio || !(radio instanceof HTMLInputElement)) return;
      
      // Solo seleccionar la opción, no ampliar imagen
      if (!radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    }

    /**
     * Maneja el click específico en la lupa
     * @param {Event} event - El evento de click
     */
    handleMagnifierClick(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const target = event.target;
      if (!(target instanceof Element)) return;
      
      const magnifier = target.closest('.cajas-magnifier-icon');
      if (!magnifier) return;
      
      const label = magnifier.closest('.cajas-option-label');
      if (!label) return;
      
      const image = label.querySelector('.cajas-option-image img');
      if (image && image instanceof HTMLImageElement) {
        this.enlargeImage(image);
      }
    }

    /**
     * Amplía la imagen en un modal
     * @param {HTMLImageElement} image - La imagen a ampliar
     */
    enlargeImage(image) {
      if (!image || !(image instanceof HTMLImageElement) || !image.src) return;
      
      // Crear modal si no existe
      let modal = document.getElementById('image-modal');
      if (!modal) {
        modal = this.createImageModal();
      }
      
      const modalImage = modal.querySelector('.modal-image');
      if (modalImage && modalImage instanceof HTMLImageElement) {
        // Usar la imagen con width: 800 para mantener calidad optimizada
        modalImage.src = image.src;
        modalImage.alt = image.alt || 'Imagen ampliada';
      }
      
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    /**
     * Crea el modal para mostrar imágenes ampliadas
     * @returns {HTMLElement} El elemento modal creado
     */
    createImageModal() {
      const modal = document.createElement('div');
      modal.id = 'image-modal';
      modal.className = 'image-modal';
      modal.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content">
            <button class="modal-close" aria-label="Cerrar">&times;</button>
            <img class="modal-image" src="" alt="" />
          </div>
        </div>
      `;
      
      // Agregar estilos al modal
      const style = document.createElement('style');
      style.textContent = `
        .image-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.9);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          .modal-content {
            max-width: 95%;
            max-height: 85%;
          }
        }
        .modal-overlay {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          position: relative;
          background: transparent;
          border-radius: 8px;
          overflow: hidden;
          max-width: 90%;
          max-height: 90%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }
        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.8);
          color: black;
          border: none;
          font-size: 30px;
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .modal-close:hover {
          background: rgba(255, 255, 255, 1);
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(modal);
      
      // Agregar event listeners
      const closeBtn = modal.querySelector('.modal-close');
      const overlay = modal.querySelector('.modal-overlay');
      
      closeBtn?.addEventListener('click', () => this.closeImageModal());
      
      // Cerrar modal al hacer click fuera de la imagen (en el overlay)
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === overlay) {
          this.closeImageModal();
        }
      });
      
      // Cerrar con tecla Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
          this.closeImageModal();
        }
      });
      
      return modal;
    }

    /**
     * Cierra el modal de imagen
     */
    closeImageModal() {
      const modal = document.getElementById('image-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
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
        const selectedLabel = checkedRadio.closest('.cajas-option')?.querySelector('.cajas-option-label');
        if (selectedLabel) {
          selectedLabel.classList.add('selected');
        }
        // Disparar el evento change para que se añada la propiedad al formulario
        checkedRadio.dispatchEvent(new Event('change'));
      }
    }

    /**
     * Obtiene el valor seleccionado
     * @returns {string|null} El valor seleccionado
     */
    getSelectedValue() {
      const selectedRadio = this.querySelector('input[type="radio"]:checked');
      return (selectedRadio instanceof HTMLInputElement) ? selectedRadio.value : null;
    }

    /**
     * Establece la selección
     * @param {string} value - El valor a seleccionar
     */
    setSelection(value) {
      const radio = this.querySelector(`input[type="radio"][value="${value}"]`);
      if (radio && radio instanceof HTMLInputElement) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    }

    /**
     * Calcula dinámicamente el layout basado en el ancho disponible
     */
    calculateLayout() {
      const container = this.querySelector('.cajas-options');
      if (!container || !(container instanceof HTMLElement)) return;
      
      const containerWidth = container.offsetWidth;
      const options = this.querySelectorAll('.cajas-option');
      
      // Si el ancho es superior a 228px, pueden caber más imágenes (3 en 3)
      if (containerWidth > 228) {
        // Layout de 3 columnas
        options.forEach(option => {
          if (option instanceof HTMLElement) {
            option.style.flex = '1 1 calc(33.333% - 10px)';
            option.style.minWidth = 'calc(33.333% - 10px)';
            option.style.maxWidth = 'calc(33.333% - 10px)';
          }
        });
      } else {
        // Layout de 2 columnas (por defecto)
        options.forEach(option => {
          if (option instanceof HTMLElement) {
            option.style.flex = '1 1 calc(50% - 7.5px)';
            option.style.minWidth = 'calc(50% - 7.5px)';
            option.style.maxWidth = 'calc(50% - 7.5px)';
          }
        });
      }
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
    
    /**
     * Función para actualizar la propiedad del producto
     * @param {string} selectedValue - El valor seleccionado
     */
    function updateProductProperty(selectedValue) {
      if (!productForm || typeof selectedValue !== 'string') return;
      
      let hiddenInput = productForm.querySelector(`input[name="properties[${selectedBoxText}]"]`);
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        if (hiddenInput instanceof HTMLInputElement) {
          hiddenInput.type = 'hidden';
          hiddenInput.name = `properties[${selectedBoxText}]`;
        }
        productForm?.appendChild(hiddenInput);
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
        if (typeof selectedValue === 'string') {
          updateProductProperty(selectedValue);
        }
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