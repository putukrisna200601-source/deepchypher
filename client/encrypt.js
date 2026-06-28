document.addEventListener('DOMContentLoaded', () => {
    
    const steps = [
        document.getElementById('slide-1'),
        document.getElementById('slide-2'),
        document.getElementById('slide-3'),
        document.getElementById('slide-4'),
        document.getElementById('slide-5'),
        document.getElementById('slide-6')
    ];
    
    const timelineSteps = document.querySelectorAll('.w-step');
    const timelineLines = document.querySelectorAll('.w-line');
    
    let currentStep = 1;
    let fileData = null;

    // Initialize first slide
    updateSlides(1);

    function goToStep(targetStep) {
        if (targetStep === currentStep) return;
        currentStep = targetStep;
        
        updateSlides(currentStep);
        updateTimeline(currentStep);
        
        if (currentStep === 4) updateReview();
        if (currentStep === 5) startProcessing();
    }

    function updateSlides(target) {
        steps.forEach((slide, index) => {
            const slideNum = index + 1;
            
            // Remove classes first
            slide.classList.remove('active-slide', 'exit-left');
            
            if (slideNum === target) {
                // The active slide
                slide.classList.add('active-slide');
            } else if (slideNum < target) {
                // Slides before target move to the left
                slide.classList.add('exit-left');
            }
            // Slides after target stay at default (which is translated to the right)
        });
    }

    function updateTimeline(target) {
        // Step 5 and 6 hide or fill timeline
        const visualTarget = target > 5 ? 5 : target;
        
        timelineSteps.forEach((el, index) => {
            if (index + 1 < visualTarget) {
                el.classList.add('completed');
                el.classList.remove('active');
            } else if (index + 1 === visualTarget) {
                el.classList.add('active');
                el.classList.remove('completed');
            } else {
                el.classList.remove('active', 'completed');
            }
        });
        
        timelineLines.forEach((el, index) => {
            if (index + 1 < visualTarget) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // Attach Next/Prev Buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find parent slide index
            const parentSlide = e.target.closest('.wizard-slide');
            const idx = steps.indexOf(parentSlide) + 1;
            goToStep(idx + 1);
        });
    });
    
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = parseInt(e.currentTarget.dataset.target);
            if(target) goToStep(target);
        });
    });

    // ==========================================
    // STEP 1: UPLOAD
    // ==========================================
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const dropzoneEmpty = document.getElementById('dropzone-empty');
    const dropzonePreview = document.getElementById('dropzone-preview');
    const uploadError = document.getElementById('upload-error');
    const btnNext1 = document.getElementById('btn-next-1');
    const chkPng = document.getElementById('chk-png');

    dropzone.addEventListener('click', (e) => {
        if(e.target.closest('#remove-file')) return;
        fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    document.getElementById('remove-file').addEventListener('click', (e) => {
        e.stopPropagation();
        fileData = null;
        fileInput.value = '';
        dropzonePreview.classList.add('d-none');
        dropzoneEmpty.classList.remove('d-none');
        btnNext1.disabled = true;
        chkPng.classList.remove('checked');
        chkPng.innerHTML = '<i class="ph ph-circle"></i> PNG Valid';
    });

    function handleFile(file) {
        uploadError.classList.add('d-none');
        
        if (file.type !== 'image/png') {
            uploadError.classList.remove('d-none');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            uploadError.innerHTML = '<i class="ph-fill ph-warning-circle"></i> Ukuran melebihi batas 10 MB.';
            uploadError.classList.remove('d-none');
            return;
        }

        fileData = { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) + ' MB', file: file };
        document.getElementById('file-name').innerText = fileData.name;
        document.getElementById('file-size').innerText = fileData.size;
        
        dropzoneEmpty.classList.add('d-none');
        dropzonePreview.classList.remove('d-none');
        btnNext1.disabled = false;
        
        chkPng.classList.add('checked');
        chkPng.innerHTML = '<i class="ph-fill ph-check-circle"></i> PNG Valid';
        showToast('Gambar berhasil dimuat', 'success');
    }

    // ==========================================
    // STEP 2: MESSAGE
    // ==========================================
    const secretMsg = document.getElementById('secret-message');
    const charCount = document.getElementById('char-count');
    const capFill = document.getElementById('capacity-fill');
    const capPercent = document.getElementById('capacity-percent');
    const capError = document.getElementById('capacity-error');
    const btnNext2 = document.getElementById('btn-next-2');
    const chkPayload = document.getElementById('chk-payload');

    secretMsg.addEventListener('input', () => {
        const len = secretMsg.value.length;
        charCount.innerText = len;
        
        const pct = Math.min((len / 1000) * 100, 100);
        capFill.style.width = pct + '%';
        capPercent.innerText = Math.round(pct) + '%';
        
        if (len > 1000) {
            capError.classList.remove('d-none');
            capFill.classList.add('danger');
            btnNext2.disabled = true;
            chkPayload.classList.remove('checked');
            chkPayload.innerHTML = '<i class="ph ph-circle"></i> Payload Siap';
        } else if (len === 0) {
            capError.classList.add('d-none');
            capFill.classList.remove('danger');
            btnNext2.disabled = true;
            chkPayload.classList.remove('checked');
            chkPayload.innerHTML = '<i class="ph ph-circle"></i> Payload Siap';
        } else {
            capError.classList.add('d-none');
            capFill.classList.remove('danger');
            btnNext2.disabled = false;
            chkPayload.classList.add('checked');
            chkPayload.innerHTML = '<i class="ph-fill ph-check-circle"></i> Payload Siap';
        }
    });

    // ==========================================
    // STEP 3: KEY
    // ==========================================
    const secretKey = document.getElementById('secret-key');
    const toggleKey = document.getElementById('toggle-key');
    const btnGenerate = document.getElementById('btn-generate');
    const btnCopy = document.getElementById('btn-copy-key');
    const strengthBars = document.querySelectorAll('.s-bar');
    const strengthText = document.getElementById('strength-text');
    const btnNext3 = document.getElementById('btn-next-3');
    const chkKey = document.getElementById('chk-key');

    toggleKey.addEventListener('click', () => {
        if (secretKey.type === 'password') {
            secretKey.type = 'text';
            toggleKey.innerHTML = '<i class="ph ph-eye-slash"></i>';
        } else {
            secretKey.type = 'password';
            toggleKey.innerHTML = '<i class="ph ph-eye"></i>';
        }
    });

    btnGenerate.addEventListener('click', () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = 'DC-';
        for(let i=0; i<3; i++) {
            let block = '';
            for(let j=0; j<4; j++) block += chars.charAt(Math.floor(Math.random() * chars.length));
            key += block;
            if(i < 2) key += '-';
        }
        secretKey.value = key;
        secretKey.type = 'text';
        toggleKey.innerHTML = '<i class="ph ph-eye-slash"></i>';
        checkStrength(); // Fill the strength bars
    });

    btnCopy.addEventListener('click', () => {
        if(!secretKey.value) return;
        navigator.clipboard.writeText(secretKey.value);
        showToast('Secret key disalin ke clipboard', 'success');
    });

    // secretKey.addEventListener('input', checkStrength); - Removed since it's readonly

    function checkStrength() {
        const val = secretKey.value;
        let score = 0;
        
        if (val.length > 0) score++;
        if (val.length >= 8) score++;
        if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        strengthBars.forEach((bar, i) => {
            bar.style.background = (i < score) ? (score <= 2 ? '#fbbf24' : (score === 3 ? '#34d399' : '#059669')) : '#e2e8f0';
        });

        const labels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
        strengthText.innerText = labels[score] || 'Password Strength';
        strengthText.style.color = score >= 3 ? 'var(--accent-primary)' : 'var(--text-light-muted)';

        if (score >= 2) {
            btnNext3.disabled = false;
            chkKey.classList.add('checked');
            chkKey.innerHTML = '<i class="ph-fill ph-check-circle"></i> Kunci Rahasia Siap';
        } else {
            btnNext3.disabled = true;
            chkKey.classList.remove('checked');
            chkKey.innerHTML = '<i class="ph ph-circle"></i> Kunci Rahasia Siap';
        }
    }

    // ==========================================
    // STEP 4: REVIEW
    // ==========================================
    function updateReview() {
        if(fileData) {
            document.getElementById('rev-image').innerText = fileData.name;
        }
        document.getElementById('rev-payload').innerText = secretMsg.value.length + ' Characters';
    }

    document.getElementById('btn-start-encrypt').addEventListener('click', () => goToStep(5));

    // ==========================================
    // CRYPTO & STEG ENGINE
    // ==========================================
    async function deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async function encryptPayload(message, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        
        const enc = new TextEncoder();
        const encodedMessage = enc.encode(message);
        
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encodedMessage
        );
        
        const payload = new Uint8Array(16 + 12 + ciphertext.byteLength);
        payload.set(salt, 0);
        payload.set(iv, 16);
        payload.set(new Uint8Array(ciphertext), 28);
        return payload;
    }

    function embedDataInImage(imageElement, payloadArray) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);
            
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;
            
            const totalBytes = 4 + payloadArray.length;
            const fullData = new Uint8Array(totalBytes);
            
            fullData[0] = (payloadArray.length >> 24) & 0xFF;
            fullData[1] = (payloadArray.length >> 16) & 0xFF;
            fullData[2] = (payloadArray.length >> 8) & 0xFF;
            fullData[3] = payloadArray.length & 0xFF;
            fullData.set(payloadArray, 4);
            
            const totalPixels = canvas.width * canvas.height;
            const maxBytes = Math.floor((totalPixels * 3) / 8);
            
            if (totalBytes > maxBytes) {
                return reject(new Error("Gambar terlalu kecil untuk menyimpan pesan ini."));
            }
            
            let dataIndex = 0;
            let bitIndex = 0;
            let currentByte = fullData[dataIndex];
            
            for (let i = 0; i < pixels.length; i += 4) {
                if (dataIndex >= totalBytes) break;
                for (let c = 0; c < 3; c++) {
                    if (dataIndex >= totalBytes) break;
                    const bit = (currentByte >> (7 - bitIndex)) & 1;
                    pixels[i + c] = (pixels[i + c] & 0xFE) | bit;
                    
                    bitIndex++;
                    if (bitIndex > 7) {
                        bitIndex = 0;
                        dataIndex++;
                        if (dataIndex < totalBytes) {
                            currentByte = fullData[dataIndex];
                        }
                    }
                }
            }
            
            ctx.putImageData(imgData, 0, 0);
            canvas.toBlob((blob) => {
                if(blob) resolve(blob);
                else reject(new Error("Gagal membuat PNG blob."));
            }, 'image/png');
        });
    }

    // ==========================================
    // STEP 5: PROCESS
    // ==========================================
    async function startProcessing() {
        const pBar = document.getElementById('process-bar');
        const pSteps = document.querySelectorAll('.proc-step');
        const pTitle = document.getElementById('process-title');
        
        // Reset state from previous runs
        pSteps.forEach(step => step.classList.remove('active', 'completed'));
        pBar.style.width = '0%';
        
        const setStep = (idx, title) => {
            if(idx > 0 && pSteps[idx-1]) {
                pSteps[idx-1].classList.remove('active');
                pSteps[idx-1].classList.add('completed');
            }
            if (pSteps[idx]) {
                pSteps[idx].classList.add('active');
                pTitle.innerText = title || pSteps[idx].innerText;
            } else {
                pTitle.innerText = title;
            }
            pBar.style.width = ((idx + 1) / 6 * 100) + '%';
        };

        try {
            setStep(0, "Menyiapkan Gambar...");
            const img = new Image();
            img.src = URL.createObjectURL(fileData.file);
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            await new Promise(r => setTimeout(r, 600));

            setStep(1, "Mengenkripsi...");
            setStep(2, "Membuat Ciphertext...");
            const password = secretKey.value;
            const message = secretMsg.value;
            const payload = await encryptPayload(message, password);
            await new Promise(r => setTimeout(r, 600));

            setStep(3, "Menyisipkan Payload...");
            const finalBlob = await embedDataInImage(img, payload);
            await new Promise(r => setTimeout(r, 600));

            setStep(4, "Validasi Integritas...");
            const downloadUrl = URL.createObjectURL(finalBlob);
            const downloadBtn = document.getElementById('btn-download-stego');
            
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `stego_${fileData.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            await new Promise(r => setTimeout(r, 600));

            setStep(5, "Menyelesaikan...");
            await new Promise(r => setTimeout(r, 600));

            goToStep(6);
            if(window.logActivity) { 
                const imgFile = document.getElementById('file-input').files[0]; 
                window.logActivity({
                    type: 'Encryption', 
                    status: 'Success', 
                    size: imgFile ? Math.round(imgFile.size/1024) + ' KB' : '-', 
                    file: imgFile ? imgFile.name : 'image.png', 
                    enc: 'AES-GCM', 
                    statusDet: 'Payload Embedded', 
                    title: 'Encryption Completed'
                }); 
            }
            showToast('Enkripsi & Penyisipan Selesai!', 'success');

        } catch (error) {
            console.error(error);
            showToast('Gagal memproses gambar: ' + error.message, 'error');
            goToStep(4);
        }
    }

    document.getElementById('btn-restart').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload();
    });

    // ==========================================
    // TOAST
    // ==========================================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
        toast.innerHTML = `<i class="ph-fill ${type === 'error' ? 'ph-warning-circle' : 'ph-check-circle'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
