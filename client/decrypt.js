document.addEventListener('DOMContentLoaded', () => {
    
    const steps = [
        document.getElementById('slide-1'),
        document.getElementById('slide-2'),
        document.getElementById('slide-3'),
        document.getElementById('slide-4')
    ];
    
    const timelineSteps = document.querySelectorAll('.w-step');
    const timelineLines = document.querySelectorAll('.w-line');
    
    let currentStep = 1;
    let fileData = null;
    let attemptsLeft = 5;
    let currentImageHash = null;

    updateSlides(1);

    function goToStep(targetStep) {
        if (targetStep === currentStep) return;
        currentStep = targetStep;
        
        updateSlides(currentStep);
        updateTimeline(currentStep);
        
        if (currentStep === 3) startDecryption();
    }

    function updateSlides(target) {
        steps.forEach((slide, index) => {
            const slideNum = index + 1;
            slide.classList.remove('active-slide', 'exit-left');
            
            if (slideNum === target) {
                slide.classList.add('active-slide');
            } else if (slideNum < target) {
                slide.classList.add('exit-left');
            }
        });
    }

    function updateTimeline(target) {
        const visualTarget = target > 4 ? 4 : target;
        
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

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', (e) => {
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
        if (!e.target.closest('#remove-file')) fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-active'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-active');
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
        currentImageHash = null;
    });

    async function generateFileHash(file) {
        const buffer = await file.slice(0, 50000).arrayBuffer(); // Hash first 50KB for speed
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function handleFile(file) {
        uploadError.classList.add('d-none');
        
        if (file.type !== 'image/png') {
            uploadError.classList.remove('d-none');
            return;
        }

        fileData = { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) + ' MB', file: file };
        document.getElementById('file-name').innerText = fileData.name;
        document.getElementById('file-size').innerText = fileData.size;
        
        currentImageHash = await generateFileHash(file);
        
        dropzoneEmpty.classList.add('d-none');
        dropzonePreview.classList.remove('d-none');
        btnNext1.disabled = false;
        
        chkPng.classList.add('checked');
        chkPng.innerHTML = '<i class="ph-fill ph-check-circle"></i> PNG Valid';
        showToast('Gambar berhasil dimuat', 'success');
    }

    // ==========================================
    // STEP 2: SECRET KEY
    // ==========================================
    const secretKey = document.getElementById('secret-key');
    const toggleKey = document.getElementById('toggle-key');
    const btnPasteKey = document.getElementById('btn-paste-key');
    const btnNext2 = document.getElementById('btn-next-2');

    toggleKey.addEventListener('click', () => {
        if (secretKey.type === 'password') {
            secretKey.type = 'text';
            toggleKey.innerHTML = '<i class="ph ph-eye-slash"></i>';
        } else {
            secretKey.type = 'password';
            toggleKey.innerHTML = '<i class="ph ph-eye"></i>';
        }
    });

    btnPasteKey.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            secretKey.value = text;
            checkKeyInput();
            showToast('Key pasted dari clipboard', 'success');
        } catch (err) {
            showToast('Gagal mengakses clipboard', 'error');
        }
    });

    secretKey.addEventListener('input', checkKeyInput);

    const formatError = document.getElementById('format-error');

    function checkKeyInput() {
        const val = secretKey.value.trim();
        const keyRegex = /^DC-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/;
        
        if (val.length === 0) {
            btnNext2.disabled = true;
            formatError.classList.add('d-none');
        } else if (keyRegex.test(val)) {
            btnNext2.disabled = false;
            formatError.classList.add('d-none');
        } else {
            btnNext2.disabled = true;
            formatError.classList.remove('d-none');
        }
    }

    // ==========================================
    // CRYPTO & STEG DECRYPT ENGINE
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
            ["decrypt"]
        );
    }

    async function decryptPayload(payload, password) {
        if (payload.length < 28) throw new Error("Payload too short");
        const salt = payload.slice(0, 16);
        const iv = payload.slice(16, 28);
        const ciphertext = payload.slice(28);
        
        const key = await deriveKey(password, salt);
        
        try {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            const dec = new TextDecoder();
            return dec.decode(decryptedBuffer);
        } catch (e) {
            throw new Error("Invalid Key");
        }
    }

    function extractDataFromImage(imageElement) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);
            
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;
            
            let totalBytesToRead = 4;
            let extractedData = null;
            let tempLengthData = new Uint8Array(4);
            
            let dataIndex = 0;
            let bitIndex = 0;
            let currentByte = 0;
            let parsedLength = false;
            
            for (let i = 0; i < pixels.length; i += 4) {
                if (dataIndex >= totalBytesToRead) break;
                for (let c = 0; c < 3; c++) {
                    if (dataIndex >= totalBytesToRead) break;
                    
                    const bit = pixels[i + c] & 1;
                    currentByte = (currentByte << 1) | bit;
                    bitIndex++;
                    
                    if (bitIndex === 8) {
                        if (!parsedLength) {
                            tempLengthData[dataIndex] = currentByte;
                        } else {
                            extractedData[dataIndex] = currentByte;
                        }
                        
                        dataIndex++;
                        bitIndex = 0;
                        currentByte = 0;
                        
                        if (dataIndex === 4 && !parsedLength) {
                            parsedLength = true;
                            let payloadLength = (tempLengthData[0] << 24) | (tempLengthData[1] << 16) | (tempLengthData[2] << 8) | tempLengthData[3];
                            payloadLength = payloadLength >>> 0; 
                            
                            const maxBits = (canvas.width * canvas.height * 3);
                            if (payloadLength <= 0 || payloadLength > maxBits / 8) {
                                return reject(new Error("No Payload"));
                            }
                            
                            totalBytesToRead = 4 + payloadLength;
                            extractedData = new Uint8Array(totalBytesToRead);
                            extractedData.set(tempLengthData, 0);
                        }
                    }
                }
            }
            
            if (dataIndex < totalBytesToRead) return reject(new Error("No Payload"));
            
            resolve(extractedData.slice(4));
        });
    }

    // ==========================================
    // STEP 3: VERIFICATION
    // ==========================================
    const stateSuccess = document.getElementById('state-success');
    const stateErrorKey = document.getElementById('state-error-key');
    const stateErrorPayload = document.getElementById('state-error-payload');
    const stateErrorConsumed = document.getElementById('state-error-consumed');

    function hideAllStates() {
        stateSuccess.classList.add('d-none');
        stateErrorKey.classList.add('d-none');
        stateErrorPayload.classList.add('d-none');
        stateErrorConsumed.classList.add('d-none');
    }

    async function startDecryption() {
        hideAllStates();
        const pBar = document.getElementById('process-bar');
        const pSteps = document.querySelectorAll('.proc-step');
        const pTitle = document.getElementById('process-title');
        
        // Reset state from previous runs
        pSteps.forEach(step => step.classList.remove('active', 'completed'));
        pBar.style.width = '0%';
        
        const setStep = (idx, title, checkId) => {
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
            if (checkId) {
                const checkEl = document.getElementById(checkId);
                if(checkEl) {
                    checkEl.classList.add('checked');
                    checkEl.innerHTML = `<i class="ph-fill ph-check-circle"></i> ${checkEl.innerText}`;
                }
            }
        };

        try {
            setStep(0, "Memindai PNG...");
            await new Promise(r => setTimeout(r, 600));

            // Policy check
            setStep(1, "Memeriksa Kebijakan Sekali Pakai...");
            if (localStorage.getItem(`dc_consumed_${currentImageHash}`)) {
                throw new Error("Consumed");
            }
            await new Promise(r => setTimeout(r, 600));

            setStep(2, "Mengekstrak Payload...");
            const img = new Image();
            img.src = URL.createObjectURL(fileData.file);
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            const payload = await extractDataFromImage(img);
            setStep(2, "Mengekstrak Payload...", "chk-payload");
            await new Promise(r => setTimeout(r, 600));

            setStep(3, "Memvalidasi Metadata AES...", "chk-aes");
            await new Promise(r => setTimeout(r, 500));

            setStep(4, "Mendekripsi AES-GCM...");
            const password = secretKey.value;
            const message = await decryptPayload(payload, password);
            await new Promise(r => setTimeout(r, 600));

            setStep(5, "Verifikasi Integritas...", "chk-integrity");
            
            // Mark as consumed
            if(window.logActivity) window.logActivity({type: 'Decryption', status: 'Consumed', file: document.getElementById('file-input').files[0] ? document.getElementById('file-input').files[0].name : '-', size: '-', enc: 'AES-GCM', statusDet: 'Payload Ditemukan', title: 'Secret Message Revealed'});
            localStorage.setItem(`dc_consumed_${currentImageHash}`, 'true');
            document.getElementById('chk-policy').classList.add('checked');
            document.getElementById('chk-policy').innerHTML = `<i class="ph-fill ph-check-circle"></i> Kebijakan Sekali Pakai`;

            await new Promise(r => setTimeout(r, 600));

            // Success
            document.getElementById('revealed-text').innerText = message;
            stateSuccess.classList.remove('d-none');
            goToStep(4);
            showToast('Pesan berhasil dibuka', 'success');

        } catch (error) {
            console.error(error);
            goToStep(4);
            if (error.message === "Consumed") {
                stateErrorConsumed.classList.remove('d-none');
                showToast('Payload sudah pernah dibuka sebelumnya', 'error');
            } else if (error.message === "Invalid Key") {
                attemptsLeft--;
                document.getElementById('attempts-count').innerText = `${attemptsLeft} dari 5`;
                if(window.logActivity) window.logActivity({type: 'Decryption', status: 'Failed', file: document.getElementById('file-input').files[0] ? document.getElementById('file-input').files[0].name : '-', size: '-', enc: 'AES-GCM', statusDet: 'Invalid Secret Key', title: 'Decryption Failed'});
                stateErrorKey.classList.remove('d-none');
                showToast('Secret key salah', 'error');
                if (attemptsLeft <= 0) {
                    // Lock out completely
                    document.getElementById('btn-retry-key').disabled = true;
                    showToast('Batas percobaan habis', 'error');
                }
            } else {
                if(window.logActivity) window.logActivity({type: 'Decryption', status: 'Failed', file: document.getElementById('file-input').files[0] ? document.getElementById('file-input').files[0].name : '-', size: '-', enc: 'AES-GCM', statusDet: 'Payload Not Found', title: 'Decryption Failed'});
                stateErrorPayload.classList.remove('d-none');
                showToast('Payload tidak ditemukan di gambar ini', 'error');
            }
        }
    }

    // Buttons in Step 4

    document.getElementById('btn-restart-success').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload();
    });

    document.getElementById('btn-retry-key').addEventListener('click', () => {
        goToStep(2);
    });

    document.getElementById('btn-retry-upload').addEventListener('click', () => {
        goToStep(1);
    });

    document.getElementById('btn-retry-consumed').addEventListener('click', () => {
        goToStep(1);
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
