document.addEventListener('DOMContentLoaded', function() {
    const billAmountInput = document.getElementById('billAmount');
    const customTipInput = document.getElementById('customTip');
    const splitCountInput = document.getElementById('splitCount');
    const tipButtons = document.querySelectorAll('.tip-btn');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsContainer = document.getElementById('results');
    const tipAmountEl = document.getElementById('tipAmount');
    const totalAmountEl = document.getElementById('totalAmount');
    const perPersonEl = document.getElementById('perPerson');
    const voiceInputBtn = document.getElementById('voiceInput');
    const voiceOutputBtn = document.getElementById('voiceOutput');
    
    let selectedTipPercentage = 18;
    let recognition = null;
    let synthesis = window.speechSynthesis;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            voiceInputBtn.classList.add('listening');
            voiceInputBtn.querySelector('span').textContent = 'Listening...';
        };
        
        recognition.onend = function() {
            voiceInputBtn.classList.remove('listening');
            voiceInputBtn.querySelector('span').textContent = 'Voice Input';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const number = extractNumberFromSpeech(transcript);
            if (number !== null) {
                billAmountInput.value = number.toFixed(2);
                calculateTip();
                speakResult();
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            voiceInputBtn.classList.remove('listening');
            voiceInputBtn.querySelector('span').textContent = 'Voice Input';
        };
    }
    
    function extractNumberFromSpeech(transcript) {
        const text = transcript.toLowerCase();
        
        if (text.includes('fifty') && text.includes('dollar')) return 50;
        if (text.includes('hundred') && text.includes('dollar')) return 100;
        
        const words = text.split(/\s+/);
        for (let word of words) {
            const num = parseFloat(word.replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0) {
                return num;
            }
        }
        
        const numberWords = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
            'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100
        };
        
        for (let word of words) {
            if (numberWords[word]) {
                return numberWords[word];
            }
        }
        
        return null;
    }
    
    tipButtons.forEach(button => {
        button.addEventListener('click', function() {
            tipButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedTipPercentage = parseInt(this.dataset.tip);
            customTipInput.value = selectedTipPercentage;
            calculateTip();
        });
    });
    
    customTipInput.addEventListener('input', function() {
        const value = parseFloat(this.value);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            selectedTipPercentage = value;
            tipButtons.forEach(btn => btn.classList.remove('active'));
            if ([15, 18, 20, 25].includes(value)) {
                document.querySelector(`[data-tip="${value}"]`).classList.add('active');
            }
        }
    });
    
    [billAmountInput, customTipInput, splitCountInput].forEach(input => {
        input.addEventListener('input', calculateTip);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateTip();
            }
        });
    });
    
    calculateBtn.addEventListener('click', calculateTip);
    
    function calculateTip() {
        const billAmount = parseFloat(billAmountInput.value) || 0;
        const tipPercentage = parseFloat(customTipInput.value) || 0;
        const splitCount = parseInt(splitCountInput.value) || 1;
        
        if (billAmount <= 0) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const tipAmount = billAmount * (tipPercentage / 100);
        const totalAmount = billAmount + tipAmount;
        const perPerson = totalAmount / splitCount;
        
        tipAmountEl.textContent = formatCurrency(tipAmount);
        totalAmountEl.textContent = formatCurrency(totalAmount);
        perPersonEl.textContent = formatCurrency(perPerson);
        
        resultsContainer.style.display = 'grid';
        
        updateSpeakableContent(tipAmount, totalAmount, perPerson, splitCount);
    }
    
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }
    
    function updateSpeakableContent(tip, total, perPerson, people) {
        const speakableDiv = document.getElementById('speakable-content');
        speakableDiv.innerHTML = `
            <h2>Tip Calculator Results</h2>
            <p>For a bill of ${formatCurrency(parseFloat(billAmountInput.value) || 0)} with a ${customTipInput.value || 0} percent tip, the tip amount is ${formatCurrency(tip)}, the total bill is ${formatCurrency(total)}, and each person pays ${formatCurrency(perPerson)} among ${people} people.</p>
        `;
    }
    
    if (voiceInputBtn && recognition) {
        voiceInputBtn.addEventListener('click', function() {
            if (voiceInputBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else if (voiceInputBtn) {
        voiceInputBtn.style.display = 'none';
    }
    
    if (voiceOutputBtn) {
        voiceOutputBtn.addEventListener('click', function() {
            if (synthesis.speaking) {
                synthesis.cancel();
                return;
            }
            
            const speakableContent = document.getElementById('speakable-content');
            const text = speakableContent.textContent || speakableContent.innerText;
            
            if (text.trim()) {
                speak(text);
            }
        });
    }
    
    function speak(text) {
        if (!synthesis) return;
        
        synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        
        const voices = synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Samantha') || 
            voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        synthesis.speak(utterance);
    }
    
    if (synthesis) {
        synthesis.getVoices();
        synthesis.onvoiceschanged = function() {
            synthesis.getVoices();
        };
    }
    
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(faq => faq.classList.remove('active'));
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
        
        question.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                this.click();
            }
        });
    });
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.step-card, .result-card, .tool-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    setTimeout(() => {
        document.querySelectorAll('.step-card, .result-card, .tool-card, .faq-item').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
    
    calculateTip();
});
