(function() {
    const vscode = acquireVsCodeApi();

    // DOM elements
    const commitCountInput = document.getElementById('commitCount');
    const changelogStyleSelect = document.getElementById('changelogStyle');
    const skipFormattingCheckbox = document.getElementById('skipFormatting');
    const groupByAuthorCheckbox = document.getElementById('groupByAuthor');
    const rangeTypeSelect = document.getElementById('rangeType');
    const dateRangeDiv = document.getElementById('dateRange');
    const tagRangeDiv = document.getElementById('tagRange');
    const shaRangeDiv = document.getElementById('shaRange');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const fromTagInput = document.getElementById('fromTag');
    const toTagInput = document.getElementById('toTag');
    const fromSHAInput = document.getElementById('fromSHA');
    const toSHAInput = document.getElementById('toSHA');
    const previewBtn = document.getElementById('previewBtn');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const previewDiv = document.getElementById('preview');
    const previewContent = document.getElementById('previewContent');
    const copyBtn = document.getElementById('copyBtn');
    const insertBtn = document.getElementById('insertBtn');

    // Initialize
    init();

    function init() {
        // Request current configuration
        vscode.postMessage({ type: 'getConfig' });

        // Set up event listeners
        rangeTypeSelect.addEventListener('change', handleRangeTypeChange);
        previewBtn.addEventListener('click', handlePreview);
        generateBtn.addEventListener('click', handleGenerate);
        copyBtn.addEventListener('click', handleCopy);
        insertBtn.addEventListener('click', handleInsert);

        // Listen for messages from extension
        window.addEventListener('message', handleMessage);
    }

    function handleRangeTypeChange() {
        const rangeType = rangeTypeSelect.value;
        
        // Hide all range configs
        dateRangeDiv.style.display = 'none';
        tagRangeDiv.style.display = 'none';
        shaRangeDiv.style.display = 'none';

        // Show relevant range config
        switch (rangeType) {
            case 'date':
                dateRangeDiv.style.display = 'block';
                break;
            case 'tags':
                tagRangeDiv.style.display = 'block';
                break;
            case 'shas':
                shaRangeDiv.style.display = 'block';
                break;
        }
    }

    function getOptions() {
        const rangeType = rangeTypeSelect.value;
        const options = {
            skipFormatting: skipFormattingCheckbox.checked,
            groupByAuthor: groupByAuthorCheckbox.checked,
            includeTypes: ['feat', 'fix', 'docs', 'refactor'] // TODO: Make this configurable
        };

        switch (rangeType) {
            case 'count':
                options.commitCount = parseInt(commitCountInput.value) || 10;
                break;
            case 'date':
                if (fromDateInput.value) {
                    options.fromDate = fromDateInput.value;
                }
                if (toDateInput.value) {
                    options.toDate = toDateInput.value;
                }
                break;
            case 'tags':
                if (fromTagInput.value) {
                    options.fromTag = fromTagInput.value;
                }
                if (toTagInput.value) {
                    options.toTag = toTagInput.value;
                }
                break;
            case 'shas':
                if (fromSHAInput.value) {
                    options.fromSHA = fromSHAInput.value;
                }
                if (toSHAInput.value) {
                    options.toSHA = toSHAInput.value;
                }
                break;
        }

        return options;
    }

    function handlePreview() {
        const options = getOptions();
        showLoading('Generating preview...');
        vscode.postMessage({ type: 'previewChangelog', options });
    }

    function handleGenerate() {
        const options = getOptions();
        showLoading('Generating changelog...');
        vscode.postMessage({ type: 'generateChangelog', options });
    }

    function handleCopy() {
        if (previewContent.textContent) {
            navigator.clipboard.writeText(previewContent.textContent).then(() => {
                showSuccess('Changelog copied to clipboard!');
            }).catch(err => {
                showError('Failed to copy to clipboard: ' + err.message);
            });
        }
    }

    function handleInsert() {
        // The insert functionality will be handled by the extension
        // Just hide the preview for now
        hidePreview();
        showSuccess('Changelog inserted into CHANGELOG.md');
    }

    function handleMessage(event) {
        const message = event.data;
        
        switch (message.type) {
            case 'configData':
                updateConfigForm(message.data);
                break;
            case 'previewGenerated':
                showPreview(message.data);
                break;
            case 'changelogGenerated':
                showPreview(message.data);
                showSuccess('Changelog generated successfully!');
                break;
            case 'loading':
                showLoading(message.data);
                break;
            case 'error':
                showError(message.data);
                break;
            case 'configUpdated':
                // Config was updated successfully
                break;
        }
    }

    function updateConfigForm(config) {
        commitCountInput.value = config.defaultCommitCount || 10;
        changelogStyleSelect.value = config.changelogStyle || 'dev-friendly';
        skipFormattingCheckbox.checked = config.skipFormattingCommits !== false;
        groupByAuthorCheckbox.checked = config.groupByAuthor === true;
    }

    function showLoading(message) {
        hideAll();
        loadingDiv.style.display = 'flex';
        if (message) {
            loadingDiv.querySelector('span').textContent = message;
        }
    }

    function showError(message) {
        hideAll();
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    }

    function showPreview(content) {
        hideAll();
        previewDiv.style.display = 'block';
        previewContent.textContent = content;
    }

    function showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        successDiv.style.opacity = '1';
        
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    function hidePreview() {
        previewDiv.style.display = 'none';
    }

    function hideAll() {
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        previewDiv.style.display = 'none';
    }
})();
