const apiUrl = 'http://127.0.0.1:3000';

const buildDigits = () => `${Date.now()}${Cypress._.random(1000, 9999)}`.replace(/\D/g, '');

const createUserPayload = (label = 'rubrica') => {
  const digits = buildDigits();
  const suffix = digits.slice(-6);
  const cpf = digits.slice(-11).padStart(11, '0');

  return {
    name: `${label}-${suffix}`,
    email: `${label}-${suffix}@example.com`,
    password: 'Senha123!',
    cpf,
  };
};

Cypress.Commands.add('buildUserPayload', (label) => {
  return cy.wrap(createUserPayload(label), { log: false });
});

Cypress.Commands.add('registerUserByApi', (payload) => {
  return cy.request('POST', `${apiUrl}/users`, payload).its('body');
});

Cypress.Commands.add('createTaskByApi', (session, payload) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/users/${session.user.id}/tasks`,
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      body: payload,
    })
    .its('body');
});

Cypress.Commands.add('completeTaskByApi', (session, taskId) => {
  return cy
    .request({
      method: 'PATCH',
      url: `${apiUrl}/users/${session.user.id}/tasks/${taskId}/complete`,
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
    .its('body');
});

Cypress.Commands.add('addFriendByApi', (session, friendCode) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/users/${session.user.id}/friends`,
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      body: { friendCode },
    })
    .its('body');
});

Cypress.Commands.add('openWelcomePage', () => {
  return cy.visit('/', {
    onBeforeLoad(window) {
      window.localStorage.clear();
    },
  });
});

Cypress.Commands.add('openLoginPage', () => {
  return cy.visit('/login', {
    onBeforeLoad(window) {
      window.localStorage.clear();
    },
  });
});

Cypress.Commands.add('visitWithSession', (path, session) => {
  cy.visit(path, {
    onBeforeLoad(window) {
      window.localStorage.clear();
      // Garante que a sessão tem token válido
      if (!session.token || !session.user) {
        console.error('Sessão inválida:', session);
        throw new Error('Sessão deve ter token e user');
      }

      // Simula AsyncStorage para React Native
      window.localStorage.setItem('neuroxp.session', JSON.stringify(session));

      // Simula o AsyncStorage que a aplicação usa
      if (!window.AsyncStorage) {
        window.AsyncStorage = {
          getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
          setItem: (key, value) => {
            window.localStorage.setItem(key, value);
            return Promise.resolve();
          },
          removeItem: (key) => {
            window.localStorage.removeItem(key);
            return Promise.resolve();
          }
        };
      }
    },
  });

  // Aguarda que a aplicação carregue a sessão em memória
  cy.get('body').should('exist'); // Garante que o DOM está carregado
  cy.wait(1500); // Aguarda mais tempo para React Native carregar
});

Cypress.Commands.add('fillInput', (selector, value) => {
  cy.get(selector).should('exist').then(($input) => {
    const input = $input[0];
    const view = input.ownerDocument.defaultView;
    const prototype = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    input.removeAttribute('disabled');
    descriptor.set.call(input, value);
    input.dispatchEvent(new view.Event('input', { bubbles: true }));
    input.dispatchEvent(new view.Event('change', { bubbles: true }));
  });
});

Cypress.Commands.add('tapElement', (selector) => {
  cy.window({ log: false }).then((window) => {
    const element = window.document.querySelector(selector);

    if (!element) {
      throw new Error(`Element not found for selector: ${selector}`);
    }

    if (typeof element.click === 'function') {
      element.click();
      return;
    }

    const view = element.ownerDocument.defaultView;

    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((eventName) => {
      element.dispatchEvent(
        new view.MouseEvent(eventName, {
          bubbles: true,
          cancelable: true,
          view,
        })
      );
    });
  });
});

Cypress.Commands.add('loginThroughUi', ({ email, password }) => {
  cy.openLoginPage();
  cy.fillInput('[data-testid="login-email-input"]', email);
  cy.fillInput('[data-testid="login-password-input"]', password);
  cy.tapElement('[data-testid="login-submit-button"]');
});