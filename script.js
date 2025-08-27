// Enhanced Payment Form JavaScript with error fixes and improvements

class PaymentFormValidator {
    constructor() {
        this.fields = {
            name: { 
                input: 'name', 
                error: 'name-error', 
                validator: this.validateName.bind(this) 
            },
            'card-number': { 
                input: 'card-number', 
                error: 'card-number-error', 
                validator: this.validateCardNumber.bind(this),
                formatter: this.formatCardNumber.bind(this)
            },
            expiry: { 
                input: 'expiry', 
                error: 'expiry-error', 
                validator: this.validateExpiry.bind(this),
                formatter: this.formatExpiry.bind(this)
            },
            cvv: { 
                input: 'cvv', 
                error: 'cvv-error', 
                validator: this.validateCvv.bind(this) 
            },
            amount: { 
                input: 'amount', 
                error: 'amount-error', 
                validator: this.validateAmount.bind(this) 
            }
        };
        
        this.init();
    }

    // Validation functions
    validateName(name) {
        if (!name) return 'Please enter cardholder name.';
        if (name.length < 2) return 'Name must be at least 2 characters.';
        if (name.length > 50) return 'Name must be less than 50 characters.';
        // Updated regex to be more permissive but still secure
        if (!/^[a-zA-Z\s\-'\.]{2,}$/.test(name)) {
            return 'Invalid name (letters, spaces, hyphens, apostrophes, and periods only).';
        }
        return '';
    }

    luhnCheck(cardNumber) {
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber[i], 10);
            
            if (isNaN(digit)) return false;
            
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return sum % 10 === 0;
    }

    validateCardNumber(cardNumber) {
        // Remove any spaces or dashes
        const cleanNumber = cardNumber.replace(/[\s-]/g, '');
        
        if (!cleanNumber) return 'Please enter card number.';
        if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits.';
        
        // Support different card lengths
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            return 'Card number must be between 13-19 digits.';
        }
        
        if (!this.luhnCheck(cleanNumber)) {
            return 'Invalid card number (fails Luhn check).';
        }
        
        return '';
    }

    getCardType(cardNumber) {
        const cleanNumber = cardNumber.replace(/[\s-]/g, '');
        
        // Visa
        if (/^4/.test(cleanNumber)) return 'Visa';
        
        // Mastercard
        if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'Mastercard';
        
        // American Express
        if (/^3[47]/.test(cleanNumber)) return 'American Express';
        
        // Discover
        if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
        
        // JCB
        if (/^35/.test(cleanNumber)) return 'JCB';
        
        // Diners Club
        if (/^3[0689]/.test(cleanNumber)) return 'Diners Club';
        
        return 'Unknown';
    }

    validateExpiry(expiry) {
        if (!expiry) return 'Please enter expiry date.';
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Invalid format. Use MM/YY.';
        
        const [month, year] = expiry.split('/').map(Number);
        
        if (month < 1 || month > 12) return 'Invalid month (01-12).';
        
        // Handle 2-digit year properly
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        const fullYear = currentCentury + year;
        
        // If the year seems too far in the past, assume next century
        const adjustedYear = fullYear < currentYear - 10 ? fullYear + 100 : fullYear;
        
        const expiryDate = new Date(adjustedYear, month - 1, 1);
        const currentDate = new Date();
        currentDate.setDate(1); // Set to first day of current month
        
        if (expiryDate < currentDate) {
            return 'Card has expired.';
        }
        
        // Check if expiry is too far in future (more than 20 years)
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 20);
        
        if (expiryDate > maxFutureDate) {
            return 'Expiry date seems too far in the future.';
        }
        
        return '';
    }

    validateCvv(cvv) {
        if (!cvv) return 'Please enter CVV.';
        if (!/^\d{3,4}$/.test(cvv)) return 'CVV must be 3-4 digits.';
        return '';
    }

    validateAmount(amount) {
        if (!amount && amount !== 0) return 'Please enter amount.';
        
        const numAmount = parseFloat(amount);
        
        if (isNaN(numAmount)) return 'Amount must be a valid number.';
        if (numAmount <= 0) return 'Amount must be greater than 0.';
        if (numAmount > 999999.99) return 'Amount is too large.';
        
        // Check for reasonable decimal places
        if (amount.toString().includes('.')) {
            const decimalPlaces = amount.toString().split('.')[1].length;
            if (decimalPlaces > 2) return 'Amount can have maximum 2 decimal places.';
        }
        
        return '';
    }

    // Utility functions
    getCleanValue(id) {
        const element = document.getElementById(id);
        if (!element) return '';
        
        let value = element.value;
        
        if (id === 'card-number') {
            value = value.replace(/[\s-]/g, '');
        }
        
        if (id === 'amount') {
            const numValue = parseFloat(value);
            return isNaN(numValue) ? value : numValue;
        }
        
        return value.trim();
    }

    formatCardNumber(input) {
        let value = input.value.replace(/[\s-]/g, '');
        
        // Limit to reasonable length
        if (value.length > 19) {
            value = value.slice(0, 19);
        }
        
        // Format with spaces every 4 digits
        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        input.value = formatted;
        
        // Update card type display
        this.updateCardTypeDisplay(value);
    }

    formatExpiry(input) {
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.length > 4) {
            value = value.slice(0, 4);
        }
        
        if (value.length >= 3) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        
        input.value = value;
    }

    updateCardTypeDisplay(cardNumber) {
        const cardTypeElement = document.getElementById('card-type');
        if (cardTypeElement && cardNumber.length >= 4) {
            const cardType = this.getCardType(cardNumber);
            cardTypeElement.textContent = cardType !== 'Unknown' ? `Detected: ${cardType}` : '';
        }
    }

    showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
    }

    validateField(fieldKey) {
        const field = this.fields[fieldKey];
        if (!field) return true;
        
        const value = this.getCleanValue(field.input);
        const error = field.validator(value);
        
        this.showError(field.error, error);
        
        // Add visual feedback to input
        const inputElement = document.getElementById(field.input);
        if (inputElement) {
            inputElement.classList.toggle('error', !!error);
        }
        
        return !error;
    }

    // Event handlers
    handleInput(fieldKey) {
        const field = this.fields[fieldKey];
        const inputElement = document.getElementById(field.input);
        
        if (!inputElement) return;
        
        // Apply formatter if available
        if (field.formatter) {
            field.formatter(inputElement);
        }
        
        // Clear previous error on input
        this.showError(field.error, '');
        inputElement.classList.remove('error');
    }

    handleBlur(fieldKey) {
        this.validateField(fieldKey);
    }

    handleSubmit(event) {
        event.preventDefault();
        
        // Clear previous messages
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = '';
            messageElement.className = '';
        }
        
        // Validate all fields
        let hasError = false;
        Object.keys(this.fields).forEach(fieldKey => {
            if (!this.validateField(fieldKey)) {
                hasError = true;
            }
        });
        
        if (hasError) {
            this.showMessage('Please correct the errors above.', 'error-message');
            return;
        }
        
        // Simulate payment processing
        this.processPayment();
    }

    processPayment() {
        const button = document.querySelector('button[type="submit"]');
        const messageElement = document.getElementById('message');
        
        if (button) {
            button.disabled = true;
            button.classList.add('loading');
            button.textContent = 'Processing...';
        }
        
        // Simulate API call delay
        setTimeout(() => {
            const name = document.getElementById('name').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            
            if (button) {
                button.disabled = false;
                button.classList.remove('loading');
                button.textContent = 'Submit Payment';
            }
            
            // Simulate success (in real app, handle actual API response)
            if (Math.random() > 0.1) { // 90% success rate for demo
                this.showMessage(
                    `Payment of $${amount.toFixed(2)} successful! Thank you, ${name}.`,
                    'success-message'
                );
                this.clearForm();
            } else {
                this.showMessage(
                    'Payment failed. Please try again or contact support.',
                    'error-message'
                );
            }
        }, 2000);
    }

    showMessage(text, className) {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = className;
        }
    }

    clearForm() {
        const form = document.getElementById('payment-form');
        if (form) {
            form.reset();
            
            // Clear all error messages
            Object.values(this.fields).forEach(field => {
                this.showError(field.error, '');
                const inputElement = document.getElementById(field.input);
                if (inputElement) {
                    inputElement.classList.remove('error');
                }
            });
            
            // Clear card type display
            const cardTypeElement = document.getElementById('card-type');
            if (cardTypeElement) {
                cardTypeElement.textContent = '';
            }
        }
    }

    // Initialize event listeners
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Set up field event listeners
        Object.keys(this.fields).forEach(fieldKey => {
            const field = this.fields[fieldKey];
            const inputElement = document.getElementById(field.input);
            
            if (inputElement) {
                inputElement.addEventListener('input', () => this.handleInput(fieldKey));
                inputElement.addEventListener('blur', () => this.handleBlur(fieldKey));
                
                // Prevent paste of invalid characters for certain fields
                if (fieldKey === 'card-number' || fieldKey === 'cvv') {
                    inputElement.addEventListener('paste', (e) => {
                        setTimeout(() => this.handleInput(fieldKey), 0);
                    });
                }
            }
        });
        
        // Set up form submission
        const form = document.getElementById('payment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Additional input restrictions
        this.setupInputRestrictions();
    }

    setupInputRestrictions() {
        // Only allow numeric input for card number and CVV
        const numericFields = ['card-number', 'cvv'];
        numericFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('keypress', (e) => {
                    if (!/[\d\s-]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault();
                    }
                });
            }
        });
        
        // Only allow numeric input for expiry
        const expiryElement = document.getElementById('expiry');
        if (expiryElement) {
            expiryElement.addEventListener('keypress', (e) => {
                if (!/[\d\/]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                }
            });
        }
    }
}

// Initialize the payment form validator when the script loads
const paymentValidator = new PaymentFormValidator();