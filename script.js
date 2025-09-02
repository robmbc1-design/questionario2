// Credenciais do recrutador para teste local.
const recruiterUsername = 'rh@conectarh.com';
const recruiterPassword = 'conectarh123';
let isRecruiterProfile = false; // Variável para controlar o perfil de acesso

// Função para alternar a visibilidade das telas
window.showScreen = function(screenId) {
    const screens = ['roleSelectionScreen', 'candidateWelcomeScreen', 'recruiterLoginScreen', 'recruiterDashboard', 'questionnaire', 'resultsView'];
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    const targetElement = document.getElementById(screenId);
    if (targetElement) {
        targetElement.classList.remove('hidden');
    }
}

// Funções de navegação
window.showRoleSelection = function() {
    isRecruiterProfile = false;
    showScreen('roleSelectionScreen');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginMessage').classList.add('hidden');
}

window.showCandidateWelcome = function() {
    isRecruiterProfile = false;
    showScreen('candidateWelcomeScreen');
}

window.showRecruiterLogin = function() {
    isRecruiterProfile = true;
    showScreen('recruiterLoginScreen');
}

window.showRecruiterDashboard = function() {
    isRecruiterProfile = true;
    showScreen('recruiterDashboard');
}

window.startQuestionnaire = function(isRecruiter = false) {
    showScreen('questionnaire');
    shuffleQuestions();
    document.getElementById('employeeForm').reset();
    document.getElementById('statusMessage').classList.add('hidden');
    document.getElementById('employeeForm').classList.remove('hidden');

    const backForCandidate = document.getElementById('backFromQuestionnaireForCandidate');
    const backForRecruiter = document.getElementById('backFromQuestionnaire');
    if (isRecruiter) {
        backForRecruiter.classList.remove('hidden');
        backForCandidate.classList.add('hidden');
    } else {
        backForRecruiter.classList.add('hidden');
        backForCandidate.classList.remove('hidden');
    }
}

// Funções de Login e Resultados
window.loginRecruiter = function() {
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const loginMessage = document.getElementById('loginMessage');

    if (usernameInput === recruiterUsername && passwordInput === recruiterPassword) {
        loginMessage.classList.add('hidden');
        showScreen('recruiterDashboard');
    } else {
        loginMessage.innerText = 'Credenciais incorretas. Tente novamente.';
        loginMessage.classList.remove('hidden');
    }
}

window.viewAllResults = async function() {
    showScreen('resultsView');
    const resultsList = document.getElementById('resultsList');
    
    try {
        const response = await fetch('/.netlify/functions/getAllResults');
        if (!response.ok) {
            throw new Error('Erro ao buscar os dados.');
        }

        const results = await response.json();
        
        if (results.length === 0) {
            resultsList.innerHTML = `<p class="text-center text-gray-500">Nenhum resultado encontrado.</p>`;
            return;
        }

        resultsList.innerHTML = '';
        results.forEach((data) => {
            const date = new Date(data.timestamp).toLocaleString('pt-BR');
            const resultCard = document.createElement('div');
            resultCard.className = 'bg-gray-50 p-6 rounded-lg shadow-sm';
            resultCard.innerHTML = `
                <h3 class="font-bold text-lg text-gray-800 mb-2">Resultado da Avaliação (${date})</h3>
                <p class="text-gray-700"><strong>Nome:</strong> ${data.name}</p>
                <p class="text-gray-700"><strong>E-mail:</strong> ${data.email}</p>
                <p class="text-gray-700"><strong>Perfil:</strong> ${data.profile}</p>
                <p class="text-gray-700"><strong>Pontuação Total:</strong> ${data.totalScore}</p>
                <p class="text-gray-700"><strong>Descrição:</strong> ${data.description}</p>
            `;
            resultsList.appendChild(resultCard);
        });

    } catch (e) {
        console.error("Erro ao carregar resultados:", e);
        resultsList.innerHTML = `<p class="text-center text-red-500">Erro ao carregar os resultados.</p>`;
    }
}

// Funções globais
window.showModal = function(message) {
    document.getElementById('modalMessage').innerText = message;
    document.getElementById('infoModal').style.display = 'block';
}

window.shuffleQuestions = function() {
    const form = document.getElementById('employeeForm');
    const questionCards = Array.from(form.querySelectorAll('.question-card:not(:nth-child(1)):not(:nth-child(2))'));

    for (let i = questionCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        form.appendChild(questionCards[j]);
    }

    const shuffledCards = Array.from(form.querySelectorAll('.question-card:not(:nth-child(1)):not(:nth-child(2))'));
    shuffledCards.forEach((card, index) => {
        const questionParagraph = card.querySelector('p');
        const originalText = questionParagraph.innerText.replace(/^\d+\.\s*/, '');
        questionParagraph.innerText = `${index + 1}. ${originalText}`;
    });
}

window.submitResults = async function() {
    const nameInput = document.getElementById('name').value.trim();
    const emailInput = document.getElementById('email').value.trim();

    if (nameInput === "" || emailInput === "") {
        showModal("Por favor, preencha seu nome e e-mail antes de continuar.");
        return;
    }

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    submitButton.classList.add('bg-gray-400', 'cursor-not-allowed');

    const form = document.getElementById('employeeForm');
    const statusMessage = document.getElementById('statusMessage');

    // CÁLCULOS DO SCORE (sem alterações)
    let totalScore = 0;
    let inovadorScore = 0;
    let executorScore = 0;
    let especialistaScore = 0;
    const questionNames = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
    const questionCategories = {
        'q1': { inovador: true, especialista: true },
        'q2': { inovador: true },
        'q3': { inovador: true },
        'q4': { executor: true },
        'q5': { executor: true },
        'q6': { inovador: true },
        'q7': { executor: true },
        'q8': { inovador: true },
        'q9': { inovador: true, especialista: true },
        'q10': { inovador: true }
    };

    for (const q of questionNames) {
        const slider = form.querySelector(`input[name="${q}"]`);
        const value = parseInt(slider.value, 10);
        totalScore += value;
        const category = questionCategories[q];
        if (category.inovador) {
            inovadorScore += value;
        }
        if (category.executor) {
            executorScore += value;
        }
        if (category.especialista) {
            especialistaScore += (6 - value);
        }
    }

    const maxScore = Math.max(inovadorScore, executorScore, especialistaScore);
    let profile = "";
    let description = "";

    if (maxScore === inovadorScore) {
        profile = "O Inovador";
        description = "Você é um profissional proativo e adaptável. Você busca soluções, toma iniciativa e prefere trabalhar com autonomia para gerar os melhores resultados. É um agente de mudança em qualquer equipe.";
    } else if (maxScore === executorScore) {
        profile = "O Executor Estratégico";
        description = "Você é focado, colaborativo e se destaca na execução de tarefas. Você trabalha bem em equipe, segue processos de forma eficiente e se dedica a garantir que os objetivos sejam atingidos. Você é a espinha dorsal de qualquer operação.";
    } else {
        profile = "O Especialista Fiel";
        description = "Você é um profissional metódico e confiável. Você se sente mais confortável em ambientes estruturados, seguindo diretrizes claras. Sua dedicação e precisão são o alicerce para manter a rotina e a estabilidade da empresa.";
    }

    try {
        const response = await fetch('/.netlify/functions/saveResult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameInput,
                email: emailInput,
                profile: profile,
                description: description,
                totalScore: totalScore,
                inovadorScore: inovadorScore,
                executorScore: executorScore,
                especialistaScore: especialistaScore
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar os dados.');
        }
        statusMessage.classList.remove('hidden');
        statusMessage.classList.add('bg-green-100', 'text-green-800');

        let successContent = "";
        if (isRecruiterProfile) {
            successContent = `
                <p class="font-bold text-lg">Questionário respondido com sucesso!</p>
                <p class="mt-2 text-md">O resultado foi armazenado no banco de dados.</p>
                <button onclick="resetQuestionnaire()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-4">
                    Refazer Questionário
                </button>
            `;
        } else {
            successContent = `
                <p class="font-bold text-lg">Questionário finalizado com sucesso!</p>
                <p class="mt-2 text-md">Agradecemos sua participação. Clique abaixo para voltar ao início.</p>
                <button onclick="resetQuestionnaire()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-4">
                    Voltar ao Início
                </button>
            `;
        }
        statusMessage.innerHTML = successContent;
        document.getElementById('employeeForm').classList.add('hidden');
    } catch (e) {
        console.error("Erro ao salvar o resultado: ", e);
        showModal("Houve um erro ao finalizar o questionário. Por favor, tente novamente.");
        submitButton.disabled = false;
        submitButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        submitButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
}

window.resetQuestionnaire = function() {
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeForm').classList.remove('hidden');
    document.getElementById('statusMessage').classList.add('hidden');
    document.getElementById('submitButton').disabled = false;
    document.getElementById('submitButton').classList.remove('bg-gray-400', 'cursor-not-allowed');
    document.getElementById('submitButton').classList.add('bg-blue-600', 'hover:bg-blue-700');
    
    // Redireciona para a tela inicial baseada no perfil
    if (isRecruiterProfile) {
        showRecruiterDashboard();
    } else {
        showCandidateWelcome();
    }
}