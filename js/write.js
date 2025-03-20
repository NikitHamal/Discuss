document.addEventListener('DOMContentLoaded', function() {
    // Format buttons functionality
    const formatButtons = document.querySelectorAll('.format-btn');
    const contentTextarea = document.getElementById('post-content');
    const previewContent = document.querySelector('.preview-content');
    const previewTitle = document.querySelector('.preview-title');
    const titleInput = document.getElementById('post-title');
    const wordCountDisplay = document.querySelector('.editor-word-count');
    
    // Update word count
    function updateWordCount() {
        const text = contentTextarea.value.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        wordCountDisplay.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
    }
    
    contentTextarea.addEventListener('input', updateWordCount);
    
    // Handle title preview
    titleInput.addEventListener('input', function() {
        previewTitle.textContent = this.value || 'Your post title will appear here';
    });
    
    // Format buttons functionality
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            const formatType = this.getAttribute('data-format');
            let startTag = '';
            let endTag = '';
            
            switch(formatType) {
                case 'bold':
                    startTag = '**';
                    endTag = '**';
                    break;
                case 'italic':
                    startTag = '*';
                    endTag = '*';
                    break;
                case 'underline':
                    startTag = '__';
                    endTag = '__';
                    break;
                case 'heading':
                    startTag = '## ';
                    endTag = '';
                    break;
                case 'quote':
                    startTag = '> ';
                    endTag = '';
                    break;
                case 'code':
                    startTag = '```\n';
                    endTag = '\n```';
                    break;
                case 'ordered-list':
                    startTag = '1. ';
                    endTag = '';
                    break;
                case 'unordered-list':
                    startTag = '- ';
                    endTag = '';
                    break;
                case 'link':
                    startTag = '[';
                    endTag = '](url)';
                    break;
                case 'image':
                    startTag = '![alt text](';
                    endTag = ')';
                    break;
            }
            
            // Visual feedback
            this.classList.add('format-btn-active');
            setTimeout(() => {
                this.classList.remove('format-btn-active');
            }, 300);
            
            // Insert formatting tags
            const selectionStart = contentTextarea.selectionStart;
            const selectionEnd = contentTextarea.selectionEnd;
            const selectedText = contentTextarea.value.substring(selectionStart, selectionEnd);
            const replacement = startTag + selectedText + endTag;
            
            contentTextarea.value = contentTextarea.value.substring(0, selectionStart) 
                                  + replacement 
                                  + contentTextarea.value.substring(selectionEnd);
                                  
            // Reset focus and selection
            contentTextarea.focus();
            contentTextarea.setSelectionRange(
                selectionStart + startTag.length, 
                selectionStart + startTag.length + selectedText.length
            );
            
            // Update word count
            updateWordCount();
            
            // Update preview on format change
            updatePreview();
        });
    });
    
    // Preview functionality
    function updatePreview() {
        // Simple conversion of markdown-like syntax to HTML
        let content = contentTextarea.value;
        
        // Bold
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Underline
        content = content.replace(/__(.*?)__/g, '<u>$1</u>');
        
        // Headings
        content = content.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        
        // Quote
        content = content.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
        
        // Lists
        content = content.replace(/^- (.*?)$/gm, '<li>$1</li>');
        content = content.replace(/^1\. (.*?)$/gm, '<li>$1</li>');
        
        // Add paragraph breaks
        content = content.replace(/\n\n/g, '</p><p>');
        
        // Wrap in paragraph
        content = '<p>' + content + '</p>';
        
        previewContent.innerHTML = content;
    }
    
    contentTextarea.addEventListener('input', updatePreview);
    document.querySelector('.preview-btn').addEventListener('click', updatePreview);
    
    // Tags functionality
    const tagsInput = document.getElementById('post-tags');
    const tagsDisplay = document.querySelector('.tags-display');
    const currentTags = new Set();
    
    function updateTagsDisplay() {
        tagsDisplay.innerHTML = '';
        currentTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-bubble';
            tagElement.innerHTML = `${tag} <i class="fas fa-times tag-remove" data-tag="${tag}"></i>`;
            tagsDisplay.appendChild(tagElement);
        });
        
        // Enable/disable tag input based on number of tags
        if (currentTags.size >= 5) {
            tagsInput.disabled = true;
            tagsInput.placeholder = "Maximum tags reached";
        } else {
            tagsInput.disabled = false;
            tagsInput.placeholder = "Add tags separated by commas";
        }
    }
    
    tagsInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            
            const tagText = this.value.trim().replace(/,/g, '');
            if (tagText && currentTags.size < 5) {
                currentTags.add(tagText);
                this.value = '';
                updateTagsDisplay();
            }
        }
    });
    
    // Remove tags when clicking x
    tagsDisplay.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-remove')) {
            const tagToRemove = e.target.getAttribute('data-tag');
            currentTags.delete(tagToRemove);
            updateTagsDisplay();
            
            // Re-enable the input if we're below max tags
            if (currentTags.size < 5) {
                tagsInput.disabled = false;
                tagsInput.placeholder = "Add tags separated by commas";
            }
        }
    });
    
    // Simulate draft saving with visual feedback
    function saveDraft() {
        const draftStatus = document.querySelector('.draft-status');
        draftStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        setTimeout(() => {
            draftStatus.innerHTML = '<i class="fas fa-check-circle"></i> Draft saved';
            setTimeout(() => {
                draftStatus.innerHTML = '<i class="fas fa-save"></i> Draft saved';
            }, 2000);
        }, 1000);
    }
    
    // Save draft periodically and on changes
    let draftTimer;
    function startDraftTimer() {
        clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraft, 2000);
    }
    
    contentTextarea.addEventListener('input', startDraftTimer);
    titleInput.addEventListener('input', startDraftTimer);
    
    // Initial save
    setTimeout(saveDraft, 3000);
    
    // Cancel button action
    document.querySelector('.cancel-btn').addEventListener('click', function() {
        if(confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.location.href = 'index.html';
        }
    });
}); 