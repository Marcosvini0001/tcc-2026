describe('Qualidade dos testes e foco em testabilidade', () => {
  it('executa cadastro e login pela interface com validacoes visuais e redirecionamentos', () => {
    cy.buildUserPayload('fluxo-ui').then((user) => {
      cy.openLoginPage();
      cy.location('pathname').should('eq', '/login');
      cy.contains('NeuroXP').should('exist');
      cy.contains('Esqueceu a senha?').should('exist');
      cy.wait(300);

      cy.tapElement('[data-testid="login-submit-button"]');
      cy.contains('E-mail obrigatorio').should('exist');
      cy.contains('Senha obrigatoria').should('exist');

      cy.tapElement('[data-testid="login-register-button"]');
      cy.location('pathname').should('eq', '/register');
      cy.contains('Criar conta').should('exist');
      cy.wait(300);

      cy.tapElement('[data-testid="register-submit-button"]');
      cy.contains('Nome obrigatorio').should('exist');
      cy.contains('E-mail obrigatorio').should('exist');
      cy.contains('Senha obrigatoria').should('exist');
      cy.contains('CPF obrigatorio').should('exist');

      cy.fillInput('[data-testid="register-name-input"]', user.name);
      cy.fillInput('[data-testid="register-email-input"]', user.email);
      cy.fillInput('[data-testid="register-password-input"]', 'Senha123');
      cy.fillInput('[data-testid="register-cpf-input"]', user.cpf);
      cy.tapElement('[data-testid="register-submit-button"]');

      cy.contains('Nivel da senha: media').should('exist');
      cy.contains('A senha deve incluir letras maiusculas, minusculas, numeros e simbolos').should('exist');

      cy.fillInput('[data-testid="register-password-input"]', user.password);
      cy.tapElement('[data-testid="register-submit-button"]');

      cy.location('pathname', { timeout: 15000 }).should('eq', '/dashboard');
      cy.contains('Cadastrar atividade', { timeout: 15000 }).should('exist');
      cy.contains('Sem tarefas cadastradas ainda.', { timeout: 15000 }).should('exist');

      cy.tapElement('[data-testid="dashboard-nav-profile"]');
      cy.location('pathname', { timeout: 15000 }).should('eq', '/profile');
      cy.contains(user.name, { timeout: 15000 }).should('exist');
      cy.contains('Seu Friend Code').should('exist');

      cy.tapElement('[data-testid="profile-logout-button"]');
      cy.location('pathname', { timeout: 15000 }).should('eq', '/login');
      cy.wait(300);

      cy.fillInput('[data-testid="login-email-input"]', user.email);
      cy.fillInput('[data-testid="login-password-input"]', 'Senha123?');
      cy.tapElement('[data-testid="login-submit-button"]');
      cy.contains('E-mail ou senha invalidos').should('exist');
      cy.location('pathname').should('eq', '/login');

      cy.fillInput('[data-testid="login-password-input"]', user.password);
      cy.tapElement('[data-testid="login-submit-button"]');

      cy.location('pathname', { timeout: 15000 }).should('eq', '/dashboard');
      cy.contains('Cadastrar atividade', { timeout: 15000 }).should('exist');
      cy.contains('Atividades programadas').should('exist');
    });
  });

  it('valida regras centrais de autenticacao, pontuacao, amizades e ranking com dados reais', () => {
    cy.buildUserPayload('rubrica-principal').then((mainUser) => {
      cy.buildUserPayload('rubrica-amigo').then((friendUser) => {
        cy.buildUserPayload('rubrica-fora-ranking').then((outsiderUser) => {
          cy.registerUserByApi(mainUser).then((mainSession) => {
            cy.registerUserByApi(friendUser).then((friendSession) => {
              cy.registerUserByApi(outsiderUser).then((outsiderSession) => {
                cy.createTaskByApi(mainSession, {
                  activity: 'Estudar Typescript',
                  scheduledFor: '2026-04-03T12:00:00-03:00',
                }).then((task) => {
                  cy.completeTaskByApi(mainSession, task.id);
                  cy.addFriendByApi(mainSession, friendSession.user.friendCode);

                  cy.intercept('GET', `**/users/${mainSession.user.id}`).as('profileRequest');
                  cy.intercept('GET', `**/users/${mainSession.user.id}/tasks`).as('tasksRequest');
                  cy.intercept('GET', '**/users/ranking').as('rankingRequest');

                  cy.visitWithSession('/dashboard', mainSession);
                  cy.wait('@tasksRequest');
                  cy.wait('@profileRequest');

                  cy.contains('Atividades feitas').should('exist');
                  cy.get(`[data-testid="dashboard-task-card-${task.id}"]`).within(() => {
                    cy.contains('Estudar Typescript').should('exist');
                    cy.contains('Concluida').should('exist');
                    cy.contains('+120 pts').should('exist');
                    cy.contains('03/04/2026').should('exist');
                  });

                  cy.visitWithSession('/profile', mainSession);
                  cy.contains(mainSession.user.friendCode).should('exist');
                  cy.contains(friendUser.name).should('exist');

                  cy.visitWithSession('/ranking', mainSession);
                  cy.wait('@rankingRequest');
                  cy.get('@rankingRequest').its('response.body').should((ranking) => {
                    expect(ranking).to.have.length(1);
                    expect(ranking[0].id).to.eq(friendSession.user.id);
                    expect(ranking[0].name).to.eq(friendUser.name);
                  });

                  cy.get(`[data-testid="ranking-card-${friendSession.user.id}"]`).within(() => {
                    cy.contains(friendUser.name).should('exist');
                    cy.contains('30 pts').should('exist');
                    cy.contains('0 pts em tarefas').should('exist');
                    cy.contains('1 amigos').should('exist');
                  });

                  cy.get(`[data-testid="ranking-card-${friendSession.user.id}"]`).should('exist');
                  cy.get(`[data-testid="ranking-card-${mainSession.user.id}"]`).should('not.exist');
                  cy.get(`[data-testid="ranking-card-${outsiderSession.user.id}"]`).should('not.exist');
                  cy.contains(mainUser.name).should('not.exist');
                  cy.contains(outsiderUser.name).should('not.exist');
                });
              });
            });
          });
        });
      });
    });
  });

  it('cobre falhas de autenticacao, duplicidade de cadastro e bloqueio de amizade repetida', () => {
    cy.buildUserPayload('rubrica-validacao').then((mainUser) => {
      cy.buildUserPayload('rubrica-validacao-amigo').then((friendUser) => {
        cy.registerUserByApi(mainUser).then((mainSession) => {
          cy.request({
            method: 'POST',
            url: 'http://127.0.0.1:3000/users',
            body: {
              ...mainUser,
              email: `duplicado-${Date.now()}@example.com`,
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(409);
            expect(response.body.message).to.eq('cpf ja cadastrado');
          });

          cy.request({
            method: 'POST',
            url: 'http://127.0.0.1:3000/users/login',
            body: {
              email: mainUser.email,
              password: 'Senha123?',
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(401);
            expect(response.body.message).to.eq('Credenciais invalidas');
          });

          cy.registerUserByApi(friendUser).then((friendSession) => {
            cy.addFriendByApi(mainSession, friendSession.user.friendCode);

            cy.request({
              method: 'POST',
              url: `http://127.0.0.1:3000/users/${mainSession.user.id}/friends`,
              headers: {
                Authorization: `Bearer ${mainSession.token}`,
              },
              body: { friendCode: friendSession.user.friendCode },
              failOnStatusCode: false,
            }).then((response) => {
              expect(response.status).to.eq(409);
              expect(response.body.message).to.eq('Users are already friends');
            });
          });
        });
      });
    });
  });
});