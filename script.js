// ==UserScript==
// @name         Unificador de Links DLC do SteamDB para o SteamTools
// @namespace    https://github.com/mzzvxm
// @version      1.2
// @description  Adiciona botões para unificar, copiar e arrastar todos os links de DLC (especificamente do SteamDB) na aba DLC para o SteamTools.
// @author       mzzvxm
// @match        https://steamdb.info/app/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // 1. Adiciona os estilos para os novos elementos
    // Usamos cores que combinam com o tema escuro do SteamDB
    GM_addStyle(`
        .dlc-unifier-container {
            background-color: #2a2c30; /* Cor de fundo escura do SteamDB */
            border: 1px solid #4a4d55;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Inter', sans-serif;
        }
        .dlc-unifier-btn {
            background-color: #5a90d4; /* Azul principal do SteamDB */
            color: #ffffff;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            margin-right: 10px;
            transition: background-color 0.2s;
            text-decoration: none; /* Para o novo botão 'a' */
            display: inline-block; /* Para o novo botão 'a' */
        }
        .dlc-unifier-btn:hover {
            background-color: #6ba0dd;
        }
        .dlc-unifier-btn[draggable="true"] {
             cursor: grab; /* Indica que o botão é arrastável */
        }
        .dlc-unifier-btn[draggable="true"]:active {
             cursor: grabbing;
        }
        #dlc-unifier-textarea {
            width: 100%;
            height: 200px;
            margin-top: 15px;
            background-color: #1e1f23; /* Fundo da textarea */
            color: #c8c8c8;
            border: 1px solid #4a4d55;
            border-radius: 4px;
            padding: 10px;
            box-sizing: border-box; /* Garante que o padding não aumente a largura */
            font-family: monospace;
            font-size: 13px;
        }
        #dlc-unifier-status {
            color: #6aba7f; /* Verde sucesso */
            font-size: 14px;
            margin-left: 10px;
            font-weight: bold;
        }
    `);

    // 2. Espera a página carregar completamente
    window.addEventListener('load', () => {
        // 3. Encontra o ponto de inserção (o título H2 dentro da aba DLC)
        // O script só continuará se encontrar esse elemento.
        const dlcHeading = document.querySelector('#dlc h2');

        if (dlcHeading) {
            // 4. Criar os elementos da interface
            const container = document.createElement('div');
            container.className = 'dlc-unifier-container';

            const unifyBtn = document.createElement('button');
            unifyBtn.textContent = 'Unificar Links DLC';
            unifyBtn.className = 'dlc-unifier-btn';
            unifyBtn.title = 'Clique para gerar uma lista de todos os links de DLC desta página';

            // NOVO BOTÃO DE ARRASTAR (como uma tag <a> estilizada)
            const dragBtn = document.createElement('a');
            dragBtn.textContent = 'Arrastar Links';
            dragBtn.className = 'dlc-unifier-btn';
            dragBtn.href = '#'; // Necessário para ser tratada como link e ser arrastável
            dragBtn.style.display = 'none'; // Escondido por padrão
            dragBtn.title = 'Clique e arraste este botão para um editor de texto ou gerenciador de downloads';

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copiar Links';
            copyBtn.className = 'dlc-unifier-btn';
            copyBtn.style.display = 'none'; // Escondido por padrão

            const statusSpan = document.createElement('span');
            statusSpan.id = 'dlc-unifier-status';
            statusSpan.style.display = 'none'; // Escondido por padrão

            const textarea = document.createElement('textarea');
            textarea.id = 'dlc-unifier-textarea';
            textarea.readOnly = true; // Apenas para visualização, cópia e arrasto
            textarea.placeholder = 'Os links unificados do SteamDB aparecerão aqui...';
            textarea.style.display = 'none'; // Escondido por padrão

            // 5. Adicionar os elementos ao container
            container.appendChild(unifyBtn);
            container.appendChild(dragBtn); // Adicionado o novo botão
            container.appendChild(copyBtn);
            container.appendChild(statusSpan);
            container.appendChild(textarea);

            // 6. Inserir o container na página, logo após o H2
            dlcHeading.insertAdjacentElement('afterend', container);

            // 7. Adicionar lógica ao botão "Unificar"
            unifyBtn.addEventListener('click', () => {
                // Seleciona todos os links na primeira coluna da tabela de DLC
                // Isso pega especificamente os links como /app/1211480/
                const dlcLinks = document.querySelectorAll('#dlc table.table tbody tr.app td:first-child a');

                if (dlcLinks.length === 0) {
                    textarea.value = 'Nenhum link de DLC encontrado nesta página.';
                    textarea.style.display = 'block';
                    dragBtn.style.display = 'none'; // Garante que fique escondido
                    copyBtn.style.display = 'none'; // Garante que fique escondido
                    return;
                }

                const linksArray = [];
                dlcLinks.forEach(link => {
                    // Pega o href (ex: /app/1211480/)
                    const href = link.getAttribute('href');
                    // Monta a URL completa, como solicitado
                    const fullUrl = `https://steamdb.info${href}`;
                    linksArray.push(fullUrl);
                });

                // Junta todos os links com uma quebra de linha
                const unifiedLinks = linksArray.join('\n');

                // Preenche a textarea e a exibe
                textarea.value = unifiedLinks;
                textarea.style.display = 'block';
                dragBtn.style.display = 'inline-block'; // Exibe o botão de arrastar
                copyBtn.style.display = 'inline-block'; // Exibe o botão de copiar
                statusSpan.style.display = 'none'; // Garante que a mensagem de status anterior suma
            });

            // 8. Adicionar lógica ao botão "Arrastar"
            dragBtn.addEventListener('click', (e) => {
                // Previne a navegação para "#" ao clicar
                e.preventDefault();
            });

            dragBtn.addEventListener('dragstart', (e) => {
                // Pega os links diretamente da textarea (que já foi preenchida)
                const links = textarea.value;
                if (links) {
                    // Define o dado como uma lista de URIs (para apps como JDownloader)
                    e.dataTransfer.setData('text/uri-list', links);
                    // Define o dado como texto plano (para editores de texto)
                    e.dataTransfer.setData('text/plain', links);
                } else {
                    // Cancela o arrasto se não houver links (segurança)
                    e.preventDefault();
                }
            });

            // 9. Adicionar lógica ao botão "Copiar" (numeração atualizada)
            copyBtn.addEventListener('click', () => {
                if (textarea.value) {
                    // Usa a função do GM para copiar para a área de transferência
                    GM_setClipboard(textarea.value);

                    // Mostra um feedback visual
                    statusSpan.textContent = 'Copiado!';
                    statusSpan.style.display = 'inline-block';

                    // Esconde o feedback após 2 segundos
                    setTimeout(() => {
                        statusSpan.style.display = 'none';
                    }, 2000);
                }
            });
        }
    });

})();

