document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Open clicked item if it wasn't already open
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Subtly animate the password strength meter to make the UI feel alive
    const strengthBars = document.querySelectorAll('.strength-meter .bar');
    if (strengthBars.length > 0) {
        setInterval(() => {
            if (Math.random() > 0.8) {
                // Briefly flash the 4th bar
                if(strengthBars[3]) {
                    strengthBars[3].classList.remove('active');
                    setTimeout(() => strengthBars[3].classList.add('active'), 300);
                }
            }
        }, 4000);
    }

    // Scroll Reveal Animation (Animasi saat scroll ke bawah)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger animasi berdasarkan urutan masuk ke viewport
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, index * 150);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.section-header, .step-card, .sec-item, .cred-card, .faq-item, .showcase-main');
    revealElements.forEach(el => {
        // Jangan timpa elemen yang sudah memiliki animasi khusus hero
        if (!el.classList.contains('hero-left') && !el.closest('.hero-left')) {
            el.classList.add('reveal-on-scroll');
            scrollObserver.observe(el);
        }
    });

    // Navbar Click Animation (Kecuali Masuk/Daftar)
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const header = targetSection.querySelector('.section-header, .dash-section-header');
                if (header) {
                    // Reset animasi jika diklik berkali-kali
                    header.classList.remove('header-highlight');
                    void header.offsetWidth; // Trigger reflow
                    header.classList.add('header-highlight');
                }
            }
        });
    });

    // Dynamic Greeting (Dashboard)
    const welcomeHeader = document.querySelector('.welcome-text h1');
    if (welcomeHeader) {
        const hour = new Date().getHours();
        let greetingText = 'Selamat datang kembali';
        
        if (hour >= 4 && hour < 11) {
            greetingText = 'Selamat pagi';
        } else if (hour >= 11 && hour < 15) {
            greetingText = 'Selamat siang';
        } else if (hour >= 15 && hour < 18) {
            greetingText = 'Selamat sore';
        } else {
            greetingText = 'Selamat malam';
        }
        
        welcomeHeader.innerText = greetingText;
    }
});
