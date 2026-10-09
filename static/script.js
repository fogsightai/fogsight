document.addEventListener('DOMContentLoaded', () => {
    const config = {
        apiBaseUrl: '', 
        defaultLang: 'zh',
    };

    const translations = {
        heroTitle: { zh: "在此赋予概念以生命，转瞬之间", en: "Bring Concepts to Life Here" },
        startCreatingTitle: { zh: "开始创作", en: "Start Creating" },
        githubrepo: { zh: "Github 开源仓库", en: "Fogsight Github Repo" },
        officialWebsite: { zh: "通向 AGI 之路社区", en: "WaytoAGI Open Source Community" },
        groupChat: { zh: "联系我们/加入交流群", en: "Contact Us" },
        placeholders: {
            zh: ["微积分的几何原理", "冒泡排序","热寂", "黑洞是如何形成的"],
            en: ["What is Heat Death?", "How are black holes formed?", "What is Bubble Sort?"]
        },
        newChat: { zh: "新对话", en: "New Chat" },
        newChatTitle: { zh: "新对话", en: "New Chat" },
        chatPlaceholder: {
            zh: "AI 生成结果具有随机性，您可在此输入修改意见",
            en: "Results are random. Enter your modifications here for adjustments."
        },
        sendTitle: { zh: "发送", en: "Send" },
        agentThinking: { zh: "Fogsight Agent 正在进行思考与规划，请稍后。这可能需要数十秒至数分钟...", en: "Fogsight Agent is thinking and planning, please wait..." },
        generatingCode: { zh: "生成代码中...", en: "Generating code..." },
        codeComplete: { zh: "代码已完成", en: "Code generated" },
        openInNewWindow: { zh: "在新窗口中打开", en: "Open in new window" },
        saveAsHTML: { zh: "保存为 HTML", en: "Save as HTML" },
        exportAsVideo: { zh: "导出为视频", en: "Export as Video" },
        featureComingSoon: { zh: "该功能正在开发中，将在不久的将来推出。\n 请关注我们的官方 GitHub 仓库以获取最新动态！", en: "This feature is under development and will be available soon.\n Follow our official GitHub repository for the latest updates!" },
        visitGitHub: { zh: "访问 GitHub", en: "Visit GitHub" },
        errorMessage: { zh: "抱歉，服务出现了一点问题。请稍后重试。", en: "Sorry, something went wrong. Please try again later." },
        errorFetchFailed: {zh: "LLM服务不可用，请稍后再试", en: "LLM service is unavailable. Please try again later."},
        errorTooManyRequests: {zh: "今天已经使用太多，请明天再试", en: "Too many requests today. Please try again tomorrow."},
        errorLLMParseError: {zh: "返回的动画代码解析失败，请调整提示词重新生成。", en: "Failed to parse the returned animation code. Please adjust your prompt and try again."},
    };

    let currentLang = config.defaultLang;
    const body = document.body;
    const initialForm = document.getElementById('initial-form');
    const initialInput = document.getElementById('initial-input');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatLog = document.getElementById('chat-log');
    const newChatButton = document.getElementById('new-chat-button');
    const languageSwitcher = document.getElementById('language-switcher');
    const placeholderContainer = document.getElementById('animated-placeholder');
    const featureModal = document.getElementById('feature-modal');
    const modalGitHubButton = document.getElementById('modal-github-button');
    const modalCloseButton = document.getElementById('modal-close-button');

    const templates = {
        user: document.getElementById('user-message-template'),
        status: document.getElementById('agent-status-template'),
        code: document.getElementById('agent-code-template'),
        player: document.getElementById('animation-player-template'),
        error: document.getElementById('agent-error-template'),
    };

    class LLMParseError extends Error {
        constructor(message, code = 'LLM_UNKNOWN_ERROR') {
            super(message);
            this.name = 'LLMParseError';
            this.code = code;
        }
    }

    let conversationHistory = [];
    let accumulatedCode = '';
    let placeholderInterval;

    function handleFormSubmit(e) {
        e.preventDefault();
        const isInitial = e.currentTarget.id === 'initial-form';
        const submitButton = isInitial
            ? initialForm?.querySelector('button')
            : chatForm?.querySelector('button');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('disabled');
        }
        const input = isInitial ? initialInput : chatInput;
        const topic = input.value.trim();
        if (!topic) return;

        if (isInitial) switchToChatView();

        conversationHistory.push({ role: 'user', content: topic });
        startGeneration(topic);
        input.value = '';
        if (isInitial) placeholderContainer?.classList?.remove('hidden');
    }

    async function startGeneration(topic) {
        console.log('Getting generation from backend.');
        appendUserMessage(topic);
        const agentThinkingMessage = appendAgentStatus(translations.agentThinking[currentLang]);
        const submitButton = document.querySelector('.submit-button');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('disabled');
        }
        accumulatedCode = '';
        let fullResponse = "";
        let codeBlockElement = null;

        try {
            const response = await fetch(`${config.apiBaseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic, history: conversationHistory })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            await FogsightGeneration.consumeStream(response.body.getReader(), token => {
                fullResponse += token;
                if (!codeBlockElement) {
                    agentThinkingMessage?.remove();
                    codeBlockElement = appendCodeBlock();
                }
                updateCodeBlock(codeBlockElement, token);
            });

            const html = FogsightGeneration.extractHtml(fullResponse);
            if (!html || !isHtmlContentValid(html)) {
                throw new LLMParseError('LLM did not return a complete HTML document.');
            }
            accumulatedCode = html;
            codeBlockElement.querySelector('code').textContent = html;
            appendAnimationPlayer(html, topic);
            markCodeAsComplete(codeBlockElement);
            conversationHistory.push({ role: 'assistant', content: html });
            scrollToBottom();
        } catch (error) {
            console.error("Streaming failed:", error);
            if (agentThinkingMessage) agentThinkingMessage.remove();

            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                showWarning(translations.errorFetchFailed[currentLang]);
            } else if (error.message.includes('status: 429')) {
                showWarning(translations.errorTooManyRequests[currentLang]);
            } else if (error instanceof LLMParseError) {
                showWarning(translations.errorLLMParseError[currentLang]);
            } else {
                showWarning(translations.errorFetchFailed[currentLang]); // 默认 fallback
            }

            appendErrorMessage(translations.errorMessage[currentLang]);  // 保留 chat-log 中的提示
        } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('disabled');
        }
    }
    }

    function switchToChatView() {
        body.classList.remove('show-initial-view');
        body.classList.add('show-chat-view');
        languageSwitcher.style.display = 'none';
        document.getElementById('logo-chat').style.display = 'block';
    }

    function appendFromTemplate(template, text) {
        const node = template.content.cloneNode(true);
        const element = node.firstElementChild;
        if (text) element.innerHTML = element.innerHTML.replace('${text}', text);
        element.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            const translation = translations[key]?.[currentLang];
            if (translation) el.textContent = translation;
        });
        chatLog.appendChild(element);
        scrollToBottom();
        return element;
    }

    const appendUserMessage = (text) => appendFromTemplate(templates.user, text);
    const appendAgentStatus = (text) => appendFromTemplate(templates.status, text);
    const appendErrorMessage = (text) => appendFromTemplate(templates.error, text);
    const appendCodeBlock = () => appendFromTemplate(templates.code);

    function updateCodeBlock(codeBlockElement, text) {
        const codeElement = codeBlockElement.querySelector('code');
        if (!text || !codeElement) return;
        const span = document.createElement('span');
        span.textContent = text;
        codeElement.appendChild(span);
        accumulatedCode += text;

        const codeContent = codeElement.closest('.code-content');
        if (codeContent) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    codeContent.scrollTop = codeContent.scrollHeight;
                });
            });
        }
    }

    function markCodeAsComplete(codeBlockElement) {
        codeBlockElement.querySelector('[data-translate-key="generatingCode"]').textContent = translations.codeComplete[currentLang];
        codeBlockElement.querySelector('.code-details').removeAttribute('open');
    }

    function appendAnimationPlayer(htmlContent, topic) {
        console.log('Appending animation player with topic:', topic);
        const node = templates.player.content.cloneNode(true);
        const playerElement = node.firstElementChild;
        playerElement.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            el.textContent = translations[key]?.[currentLang] || el.textContent;
        });
        const iframe = playerElement.querySelector('.animation-iframe');
        iframe.srcdoc = htmlContent;

        playerElement.querySelector('.open-new-window').addEventListener('click', () => {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            window.open(URL.createObjectURL(blob), '_blank');
        });
        playerElement.querySelector('.save-html').addEventListener('click', () => {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'), { href: url, download: `${topic.replace(/\s/g, '_') || 'animation'}.html` });
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
        });
        playerElement.querySelector('.export-video')?.addEventListener('click', () => {
            featureModal.querySelector('p').textContent = translations.featureComingSoon[currentLang];
            modalGitHubButton.textContent = translations.visitGitHub[currentLang];
            featureModal.classList.add('visible');
        });
        chatLog.appendChild(playerElement);
        scrollToBottom();
    }

    function isHtmlContentValid(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // 检查是否存在解析错误
        const parseErrors = doc.querySelectorAll("parsererror");
        if (parseErrors.length > 0) {
            console.warn("HTML 解析失败：", parseErrors[0].textContent);
            return false;
        }

        // DOMParser repairs text and malformed markup; require renderable body markup.
        if (!doc.body || !Array.from(doc.body.children).some(el => !['SCRIPT', 'STYLE', 'LINK', 'META'].includes(el.tagName))) {
            console.warn("HTML 内容为空");
            return false;
        }

        return true;
    }

    const scrollToBottom = () => chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });

    function setNextPlaceholder() {
        const placeholderTexts = translations.placeholders[currentLang];
        const newSpan = document.createElement('span');
        newSpan.textContent = placeholderTexts[placeholderIndex];
        placeholderContainer.innerHTML = '';
        placeholderContainer.appendChild(newSpan);
        placeholderIndex = (placeholderIndex + 1) % placeholderTexts.length;
    }

    function startPlaceholderAnimation() {
        if (placeholderInterval) clearInterval(placeholderInterval);
        const placeholderTexts = translations.placeholders[currentLang];
        if (placeholderTexts && placeholderTexts.length > 0) {
            placeholderIndex = 0;
            setNextPlaceholder();
            placeholderInterval = setInterval(setNextPlaceholder, 4000);
        }
    }

    function setLanguage(lang) {
        if (!['zh', 'en'].includes(lang)) return;
        currentLang = lang;
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            const translation = translations[key]?.[lang];
            if (!translation) return;
            if (el.hasAttribute('placeholder')) el.placeholder = translation;
            else if (el.hasAttribute('title')) el.title = translation;
            else el.textContent = translation;
        });
        languageSwitcher.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        startPlaceholderAnimation();
        localStorage.setItem('preferredLanguage', lang);
    }

    let placeholderIndex = 0;

    function init() {
        initialInput.addEventListener('input', () => {
            placeholderContainer.classList.toggle('hidden', initialInput.value.length > 0);
        });
        initialInput.addEventListener('focus', () => clearInterval(placeholderInterval));
        initialInput.addEventListener('blur', () => {
            if (initialInput.value.length === 0) startPlaceholderAnimation();
        });

        initialForm.addEventListener('submit', handleFormSubmit);
        chatForm.addEventListener('submit', handleFormSubmit);
        newChatButton.addEventListener('click', () => location.reload());
        languageSwitcher.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (target) setLanguage(target.dataset.lang);
        });

        function hideModal() {
            featureModal.classList.remove('visible');
        }

        modalCloseButton.addEventListener('click', hideModal);
        featureModal.addEventListener('click', (e) => {
            if (e.target === featureModal) hideModal();
        });

        modalGitHubButton.addEventListener('click', () => {
            window.open('https://github.com/fogsightai/fogsightai', '_blank');
            hideModal();
        });

        const savedLang = localStorage.getItem('preferredLanguage');
        const browserLang = navigator.language?.toLowerCase() || ''; // e.g. 'zh-cn'

        let initialLang = 'en'; 
        if (['zh', 'en'].includes(savedLang)) {
            initialLang = savedLang;
        } else if (browserLang.startsWith('zh')) {
            initialLang = 'zh';
        } else if (browserLang.startsWith('en')) {
            initialLang = 'en';
        }

        setLanguage(initialLang);
    }

    init();
});

function showWarning(message) {
    const box = document.getElementById('warning-box');
    const overlay = document.getElementById('overlay');
    const text = document.getElementById('warning-message');
    text.textContent = message;
    box.style.display = 'flex';
    overlay.style.display = 'block';

    setTimeout(() => {
        hideWarning();
    }, 10000);
}

function hideWarning() {
    document.getElementById('warning-box').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}
