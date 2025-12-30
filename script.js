document.addEventListener('DOMContentLoaded', () => {
    
    // -------------------------------------------------------------------------
    // Mobile Menu Toggle
    // -------------------------------------------------------------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            });
        });
    }

    // -------------------------------------------------------------------------
    // Scroll Reveal Animation (IntersectionObserver)
    // -------------------------------------------------------------------------
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // -------------------------------------------------------------------------
    // FAQ Accordion
    // -------------------------------------------------------------------------
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = question.classList.contains('active');
            
            // Close all others
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.style.maxHeight = null;
            });

            // Toggle current
            if (!isOpen) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // -------------------------------------------------------------------------
    // Modals (Privacy & Terms)
    // -------------------------------------------------------------------------
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Open triggers
    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-target');
            openModal(modalId);
        });
    });

    // Close triggers
    document.querySelectorAll('[data-modal-close]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal-close');
            closeModal(modalId);
        });
    });

    // Close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // =========================================================================
    // REAL API INTEGRATION - BACKEND WIRING AGENT
    // =========================================================================

    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const previewImage = document.getElementById('preview-image');
    const uploadContent = document.querySelector('.upload-content');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultContainer = document.getElementById('result-container'); // Container for result logic
    const resultFinal = document.getElementById('result-final'); // The img tag for result
    const loadingState = document.getElementById('loading-state');
    const placeholderState = document.querySelector('.placeholder-state'); // Initial placeholder in result area
    const downloadBtn = document.getElementById('download-btn');

    // State
    let currentUploadedUrl = null;
    const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2';
    
    // -------------------------------------------------------------------------
    // API Helper Functions
    // -------------------------------------------------------------------------

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Upload file to CDN storage (called immediately when file is selected)
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        // Filename is just nanoid.extension (no media/ prefix unless required)
        const fileName = uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL from API
        const signedUrlResponse = await fetch(
            'https://api.chromastudio.ai/get-emd-upload-url?fileName=' + encodeURIComponent(fileName),
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        // Domain: contents.maxstudio.ai
        const downloadUrl = 'https://contents.maxstudio.ai/' + fileName;
        return downloadUrl;
    }

    // Submit generation job
    async function submitImageGenJob(imageUrl) {
        const isVideo = 'image-effects' === 'video-effects'; // Config check
        const endpoint = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        // Configuration based on prompt
        const body = {
            model: 'image-effects',
            toolType: 'image-effects',
            effectId: 'phototo3d',
            imageUrl: imageUrl,
            userId: USER_ID,
            removeWatermark: true,
            isPrivate: true
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        return data;
    }

    // Poll job status
    async function pollJobStatus(jobId) {
        const isVideo = 'image-effects' === 'video-effects';
        const baseUrl = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        const POLL_INTERVAL = 2000; // 2 seconds
        const MAX_POLLS = 60; // Max 2 minutes
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: { 'Accept': 'application/json, text/plain, */*' }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            // Update UI text occasionally if needed
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out');
    }

    // -------------------------------------------------------------------------
    // UI Helper Functions
    // -------------------------------------------------------------------------

    function showLoading() {
        if (loadingState) loadingState.classList.remove('hidden');
        if (placeholderState) placeholderState.classList.add('hidden');
        if (resultFinal) resultFinal.classList.add('hidden');
        
        // Hide existing video if present
        const vid = document.getElementById('result-video');
        if (vid) vid.style.display = 'none';

        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        }
    }

    function hideLoading() {
        if (loadingState) loadingState.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Again';
        }
    }

    function updateStatus(text) {
        // Find specific status text element if it exists inside loading state, 
        // otherwise just update button text
        const statusEl = document.querySelector('#loading-state p');
        if (statusEl) statusEl.textContent = text;
        
        if (generateBtn && (text.includes('PROCESSING') || text.includes('UPLOADING') || text.includes('SUBMITTING'))) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;
        }
    }

    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
        }
        if (uploadContent) uploadContent.classList.add('hidden');
        if (generateBtn) generateBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = false;
    }

    function showResultMedia(url) {
        const isVideo = url.toLowerCase().match(/\.(mp4|webm)(\?.*)?$/i);
        const container = resultContainer || document.querySelector('.result-area');
        
        if (!container) return;

        if (isVideo) {
            if (resultFinal) resultFinal.style.display = 'none';
            
            let video = document.getElementById('result-video');
            if (!video) {
                video = document.createElement('video');
                video.id = 'result-video';
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.className = resultFinal ? resultFinal.className : 'w-full h-auto rounded-lg';
                container.appendChild(video);
            }
            video.src = url;
            video.style.display = 'block';
        } else {
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';
            
            if (resultFinal) {
                resultFinal.src = url + '?t=' + new Date().getTime();
                resultFinal.classList.remove('hidden');
                resultFinal.style.display = 'block';
            }
        }
    }

    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.classList.remove('disabled');
        }
    }

    function showError(msg) {
        alert(msg);
        hideLoading();
        if (generateBtn) generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
    }

    // -------------------------------------------------------------------------
    // Event Handlers
    // -------------------------------------------------------------------------

    // 1. Handle File Selection (Auto Upload)
    async function handleFileSelect(file) {
        if (!file) return;

        try {
            // Show local preview immediately if possible (UX)
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImage) {
                    previewImage.src = e.target.result;
                    previewImage.classList.remove('hidden');
                }
                if (uploadContent) uploadContent.classList.add('hidden');
            };
            reader.readAsDataURL(file);

            // Start API Upload
            updateStatus('UPLOADING...');
            
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            updateStatus('READY');
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
            }
            if (resetBtn) resetBtn.disabled = false;

        } catch (error) {
            showError('Upload failed: ' + error.message);
        }
    }

    // 2. Handle Generation
    async function handleGenerate() {
        if (!currentUploadedUrl) {
            alert('Please select a file first.');
            return;
        }

        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');

            // Submit
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            updateStatus('JOB QUEUED...');

            // Poll
            const result = await pollJobStatus(jobData.jobId);
            
            // Extract Result URL
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.video || resultItem?.image;

            if (!resultUrl) {
                throw new Error('No result URL found in API response');
            }

            // Display Result
            showResultMedia(resultUrl);
            showDownloadButton(resultUrl);
            
            // Complete
            hideLoading();
            if (generateBtn) {
                generateBtn.innerHTML = '<i class="fa-solid fa-check"></i> Done';
                setTimeout(() => {
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Again';
                }, 2000);
            }

        } catch (error) {
            showError('Generation failed: ' + error.message);
        }
    }

    // -------------------------------------------------------------------------
    // Event Wiring
    // -------------------------------------------------------------------------

    // File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(file);
        });
    }

    // Drag & Drop / Upload Zone
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--primary)';
            uploadZone.style.background = 'rgba(255, 0, 68, 0.1)';
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        });

        uploadZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            
            // Reset Preview
            if (previewImage) {
                previewImage.src = "";
                previewImage.classList.add('hidden');
            }
            if (uploadContent) uploadContent.classList.remove('hidden');
            if (fileInput) fileInput.value = "";

            // Reset Result
            if (resultFinal) {
                resultFinal.src = "";
                resultFinal.classList.add('hidden');
            }
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';

            if (placeholderState) placeholderState.classList.remove('hidden');
            if (loadingState) loadingState.classList.add('hidden');
            
            // Reset Buttons
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
            }
            if (resetBtn) resetBtn.disabled = true;
            if (downloadBtn) {
                downloadBtn.classList.add('disabled');
                downloadBtn.dataset.url = '';
            }
        });
    }

    // Download Button (Robust Implementation)
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.innerHTML;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.style.pointerEvents = 'none'; // simple disable
            
            try {
                // STRATEGY 1: Proxy Download
                const proxyUrl = 'https://api.chromastudio.ai/download-proxy?url=' + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                
                if (!response.ok) throw new Error('Proxy failed');
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Guess extension
                const type = response.headers.get('content-type') || '';
                let ext = 'png';
                if (type.includes('mp4')) ext = 'mp4';
                else if (type.includes('jpeg')) ext = 'jpg';
                else if (type.includes('webp')) ext = 'webp';

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'chroma_result_' + generateNanoId(6) + '.' + ext;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

            } catch (err) {
                // STRATEGY 2: Direct Fetch
                try {
                    const directResp = await fetch(url);
                    if (directResp.ok) {
                        const blob = await directResp.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = 'result.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                        return;
                    }
                } catch (fetchErr) {
                    // Fail silently for direct fetch attempt
                }

                // STRATEGY 3: Final Fallback (New Tab)
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.download = 'result';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } finally {
                downloadBtn.innerHTML = originalText;
                downloadBtn.style.pointerEvents = '';
            }
        });
    }

});