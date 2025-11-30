// Configuration
const API_BASE_URL = 'http://localhost:5003/api';

// State management
let selectedJobId = null;
let jobsData = [];
let fieldsData = [];
let provincesData = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const cvFileInput = document.getElementById('cvFile');
const filePreview = document.getElementById('filePreview');
const removeFileBtn = document.getElementById('removeFile');
const jobsList = document.getElementById('jobsList');
const jobsLoading = document.getElementById('jobsLoading');
const jobSearch = document.getElementById('jobSearch');
const fieldFilter = document.getElementById('fieldFilter');
const provinceFilter = document.getElementById('provinceFilter');
const selectedJobIdInput = document.getElementById('selectedJobId');
const submitBtn = document.getElementById('submitBtn');
const cvScoringForm = document.getElementById('cvScoringForm');
const resultsContainer = document.getElementById('resultsContainer');
const resultsContent = document.getElementById('resultsContent');

// Global error handling
window.addEventListener('error', function(e) {
    console.error('🚨 JavaScript Error:', e.error);
    console.error('📍 Error at:', e.filename, 'line', e.lineno);
});

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Jobify CV Scorer - Initializing...');
    console.log('📡 API Base URL:', API_BASE_URL);
    
    // Quick API health check
    fetch(`${API_BASE_URL}/health`)
        .then(response => response.json())
        .then(data => {
            console.log('✅ Server Health Check:', data);
            showInfo('✅ Kết nối server thành công! Hệ thống sẵn sàng.');
        })
        .catch(error => {
            console.error('❌ Server Health Check Failed:', error);
            showError('⚠️ Không thể kết nối server. Vui lòng kiểm tra server đang chạy tại localhost:5003');
        });
    
    initializeApp();
});

async function initializeApp() {
    console.log('🔧 Starting app initialization...');
    
    // Debug: Check if all critical elements exist
    console.log('🔍 DOM Elements Check:');
    console.log('  - uploadArea:', !!uploadArea, uploadArea);
    console.log('  - cvFileInput:', !!cvFileInput, cvFileInput);
    console.log('  - submitBtn:', !!submitBtn, submitBtn);
    console.log('  - jobsList:', !!jobsList, jobsList);
    console.log('  - resultsContainer:', !!resultsContainer, resultsContainer);
    
    // Check if any critical element is missing
    if (!submitBtn) {
        console.error('❌ CRITICAL: submitBtn element not found! ID should be "submitBtn"');
        showError('❌ Lỗi khởi tạo: Không tìm thấy nút chấm điểm');
        return;
    }
    
    if (!uploadArea || !cvFileInput) {
        console.error('❌ CRITICAL: Upload elements not found!');
        showError('❌ Lỗi khởi tạo: Không tìm thấy khu vực upload');
        return;
    }
    
    setupFileUpload();
    await loadReferenceData();
    await loadJobs();
    setupEventListeners();
    
    // Force enable submit button for testing (normally disabled until file + job selected)
    if (submitBtn) {
        console.log('🧪 DEBUG: Force enabling submit button for testing...');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
    
    // Add global click debugging
    document.addEventListener('click', function(e) {
        console.log(`🖱️ CLICK: ${e.target.tagName}.${e.target.className}#${e.target.id}`);
        
        // Special handling for submit button
        if (e.target.id === 'submitBtn') {
            console.log('🎯 SUBMIT BUTTON CLICKED DIRECTLY!');
        }
    }, { capture: true });
    
    console.log('✅ App initialization completed!');
}

// File Upload Functions
function setupFileUpload() {
    // Click to upload
    uploadArea.addEventListener('click', () => {
        cvFileInput.click();
    });

    // File input change
    cvFileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Remove file
    removeFileBtn.addEventListener('click', removeFile);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                         'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
        showError('Vui lòng chọn file PDF, DOCX, JPG hoặc PNG');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File không được vượt quá 10MB');
        return;
    }

    // Show file preview
    showFilePreview(file);
    updateSubmitButtonState();
}

function showFilePreview(file) {
    const fileName = file.name;
    const fileSize = formatFileSize(file.size);
    
    filePreview.querySelector('.file-name').textContent = fileName;
    filePreview.querySelector('.file-size').textContent = fileSize;
    
    filePreview.style.display = 'block';
    uploadArea.querySelector('.upload-content').style.display = 'none';
}

function removeFile() {
    cvFileInput.value = '';
    filePreview.style.display = 'none';
    uploadArea.querySelector('.upload-content').style.display = 'flex';
    updateSubmitButtonState();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// API Functions
async function loadReferenceData() {
    try {
        // Load fields and provinces for filters
        const [fieldsResponse, provincesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/fields`),
            fetch(`${API_BASE_URL}/provinces`)
        ]);

        if (fieldsResponse.ok) {
            const fieldsResult = await fieldsResponse.json();
            fieldsData = fieldsResult.data || [];
            populateFieldFilter();
        }

        if (provincesResponse.ok) {
            const provincesResult = await provincesResponse.json();
            provincesData = provincesResult.data || [];
            populateProvinceFilter();
        }
    } catch (error) {
        console.error('Error loading reference data:', error);
    }
}

function populateFieldFilter() {
    fieldFilter.innerHTML = '<option value="">Tất cả lĩnh vực</option>';
    fieldsData.forEach(field => {
        const option = document.createElement('option');
        option.value = field.id;
        option.textContent = field.name;
        fieldFilter.appendChild(option);
    });
}

function populateProvinceFilter() {
    provinceFilter.innerHTML = '<option value="">Tất cả tỉnh thành</option>';
    provincesData.forEach(province => {
        const option = document.createElement('option');
        option.value = province.id;
        option.textContent = province.nameWithType || province.name;
        provinceFilter.appendChild(option);
    });
}

async function loadJobs(page = 1, filters = {}) {
    try {
        showJobsLoading(true);
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: '20',
            ...filters
        });

        const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`);
        
        if (!response.ok) {
            throw new Error('Failed to load jobs');
        }

        const result = await response.json();
        // API trả về structure: { data: { data: [...], total, page, limit } }
        jobsData = result.data?.data || [];
        
        console.log('✅ Loaded jobs:', jobsData.length, 'jobs');
        console.log('📋 Jobs data:', jobsData);
        
        displayJobs(jobsData);
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Không thể tải danh sách công việc. Vui lòng thử lại.');
    } finally {
        showJobsLoading(false);
    }
}

function showJobsLoading(show) {
    jobsLoading.style.display = show ? 'flex' : 'none';
}

function displayJobs(jobs) {
    if (jobs.length === 0) {
        jobsList.innerHTML = '<div class="no-jobs"><p>Không tìm thấy công việc nào</p></div>';
        return;
    }

    const jobsHTML = jobs.map(job => createJobHTML(job)).join('');
    jobsList.innerHTML = jobsHTML;

    // Add click events to job items
    document.querySelectorAll('.job-item').forEach(item => {
        item.addEventListener('click', () => selectJob(item.dataset.jobId));
    });
}

function createJobHTML(job) {
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    const companyName = job.company?.nameCompany || 'Công ty không xác định';
    const provinceName = job.province?.nameWithType || job.province?.name || 'Toàn quốc';
    const fieldName = job.field?.name || 'Không xác định';
    
    return `
        <div class="job-item" data-job-id="${job.id}">
            <div class="job-title">${job.nameJob}</div>
            <div class="job-company">
                <i class="fas fa-building"></i> ${companyName}
                ${job.company?.scale ? `<span class="company-scale">(${job.company.scale} nhân viên)</span>` : ''}
            </div>
            <div class="job-info">
                <span><i class="fas fa-map-marker-alt"></i> ${provinceName}</span>
                <span><i class="fas fa-briefcase"></i> ${job.typeWork || 'Không xác định'}</span>
                <span><i class="fas fa-graduation-cap"></i> ${job.education || 'Không yêu cầu'}</span>
                <span><i class="fas fa-clock"></i> ${job.experience || 'Không yêu cầu'}</span>
                <span><i class="fas fa-tag"></i> ${fieldName}</span>
                ${salary ? `<span class="job-salary"><i class="fas fa-money-bill-wave"></i> ${salary}</span>` : ''}
            </div>
        </div>
    `;
}

function formatSalary(min, max) {
    if (!min && !max) return null;
    
    // Salary trong API đã ở dạng triệu VNĐ (18 = 18 triệu)
    const formatAmount = (amount) => {
        return amount + ' triệu';
    };

    if (min && max) {
        return `${formatAmount(min)} - ${formatAmount(max)} VNĐ`;
    } else if (min) {
        return `Từ ${formatAmount(min)} VNĐ`;
    } else if (max) {
        return `Lên đến ${formatAmount(max)} VNĐ`;
    }
}

function selectJob(jobId) {
    // Remove previous selection
    document.querySelectorAll('.job-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add selection to clicked item
    const selectedItem = document.querySelector(`[data-job-id="${jobId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedJobId = jobId;
        selectedJobIdInput.value = jobId;
        updateSubmitButtonState();
    }
}

// Event Listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Search functionality
    if (jobSearch) {
        jobSearch.addEventListener('input', debounce(handleSearch, 300));
        console.log('✅ Search event listener attached');
    }
    
    // Filter functionality
    if (fieldFilter) {
        fieldFilter.addEventListener('change', handleFilterChange);
        console.log('✅ Field filter event listener attached');
    }
    
    if (provinceFilter) {
        provinceFilter.addEventListener('change', handleFilterChange);
        console.log('✅ Province filter event listener attached');
    }
    
    // Button click for CV scoring - with extra debugging
    if (submitBtn) {
        console.log('🔍 About to attach click listener to submitBtn:', submitBtn);
        
        // Primary event listener
        submitBtn.addEventListener('click', handleCVScoring);
        console.log('✅ CV scoring button event listener attached');
        
        // Test the button is clickable
        console.log('🔍 Button properties:', {
            disabled: submitBtn.disabled,
            style: submitBtn.style.display,
            className: submitBtn.className,
            tagName: submitBtn.tagName
        });
        
        // Add a backup listener to test
        submitBtn.addEventListener('click', function(e) {
            console.log('🟡 BACKUP: Button was clicked!', e);
        }, { capture: true });
        
    } else {
        console.error('❌ CRITICAL: submitBtn is null - cannot attach event listener!');
    }
    
    // CRITICAL: Prevent form submission to avoid page reload
    if (cvScoringForm) {
        console.log('🛡️ Adding form submission prevention...');
        cvScoringForm.addEventListener('submit', function(e) {
            console.log('⚠️ FORM SUBMIT EVENT DETECTED - PREVENTING!');
            e.preventDefault();
            e.stopPropagation();
            showError('🛑 Form submission prevented - use button click instead!');
            return false;
        });
        console.log('✅ Form submission prevention added');
    } else {
        console.error('❌ cvScoringForm not found!');
    }
}

function handleSearch() {
    const searchTerm = jobSearch.value.trim();
    const filteredJobs = jobsData.filter(job => {
        const jobTitle = job.nameJob.toLowerCase();
        const companyName = job.company?.nameCompany?.toLowerCase() || '';
        const fieldName = job.field?.name?.toLowerCase() || '';
        const provinceName = job.province?.name?.toLowerCase() || '';
        
        return jobTitle.includes(searchTerm.toLowerCase()) ||
               companyName.includes(searchTerm.toLowerCase()) ||
               fieldName.includes(searchTerm.toLowerCase()) ||
               provinceName.includes(searchTerm.toLowerCase());
    });
    
    console.log(`🔍 Search "${searchTerm}": ${filteredJobs.length} jobs found`);
    displayJobs(filteredJobs);
}

function handleFilterChange() {
    const filters = {};
    
    if (fieldFilter.value) {
        filters.idField = fieldFilter.value;
    }
    
    if (provinceFilter.value) {
        filters.idProvince = provinceFilter.value;
    }
    
    loadJobs(1, filters);
}

async function handleCVScoring(e) {
    console.log('🎯 CV Scoring button clicked!');
    console.log('🔍 Event object:', e);
    console.log('🔍 Button disabled?', submitBtn.disabled);
    console.log('🔍 Selected job ID:', selectedJobId);
    console.log('🔍 Has file?', cvFileInput.files.length > 0);
    
    // Prevent any default behavior just in case
    if (e && e.preventDefault) {
        console.log('⏹️ Preventing default behavior...');
        e.preventDefault();
    }
    if (e && e.stopPropagation) {
        console.log('⏹️ Stopping event propagation...');
        e.stopPropagation();
    }
    
    // Show immediate feedback
    showInfo('🔄 Button clicked successfully! Starting CV scoring...');
    
    console.log('🚀 Starting CV scoring process...');
    
    if (!validateForm()) {
        console.log('❌ Form validation failed');
        return;
    }
    
    console.log('✅ Form validation passed');
    
    const hasFile = cvFileInput.files.length > 0;
    
    // Clear previous results
    resultsContainer.style.display = 'none';
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang chấm điểm CV...';
        
        if (hasFile) {
            // Call real CV scoring API with file
            console.log('📁 Using real file upload mode');
            console.log('📄 File info:', {
                name: cvFileInput.files[0].name,
                size: cvFileInput.files[0].size,
                type: cvFileInput.files[0].type
            });
            
            const formData = new FormData();
            formData.append('cvFile', cvFileInput.files[0]); // Field name must be 'cvFile'
            formData.append('jobId', selectedJobId);
            
            console.log('🎯 Selected job ID:', selectedJobId);
            await callCVScoringAPI(formData);
        } else {
            // Call demo API without file
            console.log('🎮 Using demo mode (no file)');
            console.log('🎯 Selected job ID:', selectedJobId);
            await callDemoCVScoringAPI(selectedJobId);
        }
        
        console.log('✅ CV scoring process completed successfully!');
        
    } catch (error) {
        console.error('❌ Error in CV scoring process:', error);
        showError('Có lỗi xảy ra khi chấm điểm CV. Vui lòng thử lại.');
    } finally {
        submitBtn.disabled = false;
        updateSubmitButtonState();
    }
}

// Call actual CV scoring API
async function callCVScoringAPI(formData) {
    let progressInterval;
    let startTime = Date.now();
    
    try {
        console.log('📤 Calling CV Scoring API with:', {
            hasFile: formData.has('cvFile'),
            jobId: formData.get('jobId'),
            fileName: formData.get('cvFile')?.name,
            fileSize: formData.get('cvFile')?.size
        });

        // Create progress tracking
        showProgressDialog();
        updateProgress('Đang tải CV lên server...', 10);

        // Start progress animation
        let progress = 10;
        progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 5;
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed < 10) {
                    updateProgress('Đang xử lý file CV...', Math.min(progress, 30));
                } else if (elapsed < 20) {
                    updateProgress('Đang phân tích CV với Gemini AI...', Math.min(progress, 70));
                } else {
                    updateProgress('Đang tạo báo cáo chi tiết...', Math.min(progress, 85));
                }
            }
        }, 1000);

        // Set timeout for long requests (2 minutes)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: API quá lâu phản hồi (>2 phút)')), 120000);
        });

        // Make API call with timeout
        const apiPromise = fetch(`${API_BASE_URL}/cv-score`, {
            method: 'POST',
            body: formData
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        console.log('📥 CV Scoring API Response:', response.status, response.statusText);

        updateProgress('Đang nhận kết quả từ AI...', 95);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ CV Scoring API Error:', errorData);
            
            const errorMessage = errorData.error || errorData.message || 'Không thể chấm điểm CV';
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ CV Scoring API Success:', result);
        console.log('📊 Score received:', result.data?.score);
        console.log('💡 Suggestions count:', result.data?.suggestions?.length || 0);
        
        // Complete progress
        updateProgress('✅ Hoàn thành phân tích!', 100);
        
        setTimeout(() => {
            hideProgressDialog();
            showSuccess('🎉 Chấm điểm CV thành công! AI đã phân tích CV của bạn.');
            displayResultsWithAnimation(result.data);
        }, 500);
        
    } catch (error) {
        console.error('❌ Error calling CV scoring API:', error);
        
        hideProgressDialog();
        
        if (error.message.includes('Timeout')) {
            showError(`⏱️ ${error.message}. Vui lòng thử lại hoặc sử dụng chế độ demo.`);
        } else if (error.message.includes('Field name') || error.message.includes('cvFile')) {
            showError(`❌ Lỗi kỹ thuật: ${error.message}. Vui lòng báo cáo lỗi này.`);
        } else {
            showError(`❌ Lỗi chấm điểm CV: ${error.message}`);
            
            // Auto fallback after delay
            setTimeout(async () => {
                console.log('🔄 Auto-fallback to demo API...');
                showInfo('🔄 Đang thử chế độ demo...');
                await callDemoCVScoringAPI(formData.get('jobId'));
            }, 3000);
        }
    } finally {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    }
}

// Call demo CV scoring API (without file upload)
async function callDemoCVScoringAPI(jobId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cv-score/demo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobId: parseInt(jobId) })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Không thể demo chấm điểm CV');
        }

        const result = await response.json();
        displayResultsWithAnimation(result.data);
        
    } catch (error) {
        console.error('Error calling demo CV scoring API:', error);
        showError('Không thể chấm điểm CV. Vui lòng thử lại sau.');
    }
}

// Legacy function - now redirects to enhanced version
function displayResults(data) {
    console.log('📍 Redirecting to enhanced results display...');
    displayResultsWithAnimation(data);
}

// Utility functions
function updateSubmitButtonState() {
    const hasJob = selectedJobId !== null;
    
    // Enable button if job is selected (file is optional for demo mode)
    submitBtn.disabled = !hasJob;
    
    // Update button text based on whether file is uploaded
    const hasFile = cvFileInput.files.length > 0;
    if (hasFile && hasJob) {
        submitBtn.innerHTML = '<i class="fas fa-magic"></i> Chấm Điểm CV với AI';
        submitBtn.title = 'Chấm điểm CV đã tải lên';
    } else if (hasJob) {
        submitBtn.innerHTML = '<i class="fas fa-play-circle"></i> Demo Chấm Điểm CV';
        submitBtn.title = 'Demo chấm điểm CV (không cần file)';
    } else {
        submitBtn.innerHTML = '<i class="fas fa-magic"></i> Chấm Điểm CV với AI';
        submitBtn.title = 'Vui lòng chọn công việc trước';
    }
}

function validateForm() {
    if (!selectedJobId) {
        showError('Vui lòng chọn công việc');
        return false;
    }
    
    // File validation chỉ khi có file upload
    if (cvFileInput.files.length > 0) {
        const file = cvFileInput.files[0];
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                             'image/jpeg', 'image/jpg', 'image/png'];
        
        if (!allowedTypes.includes(file.type)) {
            showError('Vui lòng chọn file PDF, DOCX, JPG hoặc PNG');
            return false;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File không được vượt quá 10MB');
            return false;
        }
    }
    
    return true;
}

function showError(message) {
    showAlert(message, 'error');
}

function showSuccess(message) {
    showAlert(message, 'success');
}

function showInfo(message) {
    showAlert(message, 'info');
}

function showAlert(message, type = 'error') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const icons = {
        error: 'fas fa-exclamation-triangle',
        success: 'fas fa-check-circle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        error: '#dc3545',
        success: '#28a745',
        info: '#17a2b8'
    };
    
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid ${colors[type]};
        border-left: 4px solid ${colors[type]};
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="${icons[type]}" style="color: ${colors[type]};"></i>
            <span style="color: #333; font-size: 14px;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: #666; cursor: pointer; margin-left: 10px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add CSS animation if not exists
    if (!document.querySelector('#alertAnimations')) {
        const style = document.createElement('style');
        style.id = 'alertAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(alert);
    
    // Auto hide after different times based on type
    const autoHideTime = type === 'success' ? 4000 : 6000;
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, autoHideTime);
}

// Progress Dialog Functions
function showProgressDialog() {
    // Remove existing dialog
    hideProgressDialog();
    
    const dialog = document.createElement('div');
    dialog.id = 'progressDialog';
    dialog.innerHTML = `
        <div class="progress-overlay">
            <div class="progress-dialog">
                <div class="progress-header">
                    <i class="fas fa-robot"></i>
                    <h3>AI đang phân tích CV của bạn</h3>
                </div>
                <div class="progress-content">
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-percentage" id="progressPercentage">0%</div>
                    </div>
                    <div class="progress-message" id="progressMessage">Đang khởi tạo...</div>
                    <div class="progress-time">
                        <i class="fas fa-clock"></i>
                        <span id="elapsedTime">0s</span> | Ước tính: 15-30 giây
                    </div>
                </div>
                <div class="progress-tips">
                    💡 <strong>Tip:</strong> AI đang phân tích CV của bạn so với yêu cầu công việc để đưa ra đánh giá chính xác nhất!
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Start elapsed timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timerElement = document.getElementById('elapsedTime');
        if (timerElement) {
            timerElement.textContent = `${elapsed}s`;
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
    
    // Store timer for cleanup
    dialog.timerInterval = timerInterval;
}

function updateProgress(message, percentage) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressMessage = document.getElementById('progressMessage');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
    if (progressMessage) progressMessage.textContent = message;
}

function hideProgressDialog() {
    const dialog = document.getElementById('progressDialog');
    if (dialog) {
        // Clear timer
        if (dialog.timerInterval) {
            clearInterval(dialog.timerInterval);
        }
        dialog.remove();
    }
}

// Enhanced Results Display with Animation
function displayResultsWithAnimation(data) {
    console.log('🎨 Displaying results with animation:', data);
    
    // Clear and show results container
    resultsContainer.style.display = 'none';
    resultsContent.innerHTML = '';
    
    // Build results HTML with enhanced styling
    const score = data.score || 0;
    const suggestions = data.suggestions || [];
    const analysis = data.analysis || {};
    const jobMatch = data.jobMatch || {};
    
    let resultsHTML = `
        <div class="results-animation">
            <div class="score-section animate-fade-up">
                <div class="score-display">
                    <div class="score-circle animate-scale" data-score="${score}">
                        <div class="score-number">0</div>
                        <div class="score-label">Điểm CV</div>
                    </div>
                </div>
                
                <div class="score-description">
                    ${getScoreDescription(score)}
                </div>
            </div>
    `;

    // Job match info
    if (jobMatch.jobTitle) {
        resultsHTML += `
            <div class="job-match-section animate-fade-up">
                <h4><i class="fas fa-briefcase"></i> Công việc được chấm điểm:</h4>
                <div class="job-match-card">
                    <div class="job-title">${jobMatch.jobTitle}</div>
                    <div class="job-company">${jobMatch.companyName || 'Công ty không xác định'}</div>
                </div>
            </div>
        `;
    }

    // Analysis sections with enhanced styling
    if (analysis.strengths && analysis.strengths.length > 0) {
        resultsHTML += `
            <div class="analysis-section strengths-section animate-fade-up">
                <h4><i class="fas fa-check-circle"></i> Điểm mạnh của CV</h4>
                <div class="analysis-items">
                    ${analysis.strengths.map((strength, index) => `
                        <div class="analysis-item positive animate-slide-in" style="animation-delay: ${index * 0.1}s">
                            <div class="item-icon"><i class="fas fa-plus-circle"></i></div>
                            <div class="item-text">${strength}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        resultsHTML += `
            <div class="analysis-section weaknesses-section animate-fade-up">
                <h4><i class="fas fa-exclamation-triangle"></i> Điểm cần cải thiện</h4>
                <div class="analysis-items">
                    ${analysis.weaknesses.map((weakness, index) => `
                        <div class="analysis-item negative animate-slide-in" style="animation-delay: ${index * 0.1}s">
                            <div class="item-icon"><i class="fas fa-minus-circle"></i></div>
                            <div class="item-text">${weakness}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Skills section
    if (analysis.matchingSkills && analysis.matchingSkills.length > 0) {
        resultsHTML += `
            <div class="skills-section animate-fade-up">
                <h4><i class="fas fa-star"></i> Kỹ năng phù hợp</h4>
                <div class="skills-tags">
                    ${analysis.matchingSkills.map((skill, index) => `
                        <span class="skill-tag matching animate-pop-in" style="animation-delay: ${index * 0.05}s">${skill}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (analysis.missingSkills && analysis.missingSkills.length > 0) {
        resultsHTML += `
            <div class="skills-section animate-fade-up">
                <h4><i class="fas fa-plus"></i> Kỹ năng cần bổ sung</h4>
                <div class="skills-tags">
                    ${analysis.missingSkills.map((skill, index) => `
                        <span class="skill-tag missing animate-pop-in" style="animation-delay: ${index * 0.05}s">${skill}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Suggestions section
    if (suggestions.length > 0) {
        resultsHTML += `
            <div class="suggestions-section animate-fade-up">
                <h4><i class="fas fa-lightbulb"></i> Gợi ý cải thiện từ AI</h4>
                <div class="suggestions-items">
                    ${suggestions.map((suggestion, index) => `
                        <div class="suggestion-item animate-slide-in" style="animation-delay: ${index * 0.1}s">
                            <div class="suggestion-icon"><i class="fas fa-arrow-right"></i></div>
                            <div class="suggestion-text">${suggestion}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    resultsHTML += `</div>`;
    
    // Insert HTML and show container
    resultsContent.innerHTML = resultsHTML;
    resultsContainer.style.display = 'block';
    
    // Animate score counting
    setTimeout(() => {
        animateScoreCounter(score);
    }, 500);
    
    // Scroll to results
    setTimeout(() => {
        resultsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 1000);
}

function getScoreDescription(score) {
    if (score >= 85) return `<span class="score-excellent">🌟 Xuất sắc! CV của bạn rất phù hợp với công việc này.</span>`;
    if (score >= 70) return `<span class="score-good">👍 Tốt! CV có nhiều điểm mạnh, cần cải thiện một số điểm nhỏ.</span>`;
    if (score >= 50) return `<span class="score-fair">⚖️ Khá ổn! CV cần được cải thiện để phù hợp hơn với yêu cầu.</span>`;
    if (score >= 30) return `<span class="score-poor">📈 Cần cải thiện! Hãy xem gợi ý bên dưới để nâng cao CV.</span>`;
    return `<span class="score-low">🔧 Cần tu chỉnh nhiều! CV chưa phù hợp, hãy tham khảo gợi ý chi tiết.</span>`;
}

function animateScoreCounter(targetScore) {
    const scoreElement = document.querySelector('.score-number');
    if (!scoreElement) return;
    
    let currentScore = 0;
    const increment = targetScore / 50; // 50 steps
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= targetScore) {
            currentScore = targetScore;
            clearInterval(timer);
        }
        scoreElement.textContent = Math.round(currentScore);
    }, 30);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
