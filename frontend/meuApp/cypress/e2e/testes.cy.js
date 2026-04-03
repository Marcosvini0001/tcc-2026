describe('Qualidade dos testes e foco em testabilidade', () => {
  it('valida regras centrais de autenticacao, pontuacao, amizades e ranking com dados reais', () => {
    cy.buildUserPayload('rubrica-principal').then((mainUser) => {
      cy.buildUserPayload('rubrica-amigo').then((friendUser) => {
        cy.registerUserByApi(mainUser).then((mainSession) => {
          cy.registerUserByApi(friendUser).then((friendSession) => {
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

              cy.get(`[data-testid="ranking-card-${mainSession.user.id}"]`).within(() => {
                cy.contains(mainUser.name).should('exist');
                cy.contains('150 pts').should('exist');
                cy.contains('120 pts em tarefas').should('exist');
                cy.contains('1 amigos').should('exist');
              });

              cy.get(`[data-testid="ranking-card-${friendSession.user.id}"]`).within(() => {
                cy.contains(friendUser.name).should('exist');
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