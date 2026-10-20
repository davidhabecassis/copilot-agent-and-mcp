describe('Book Favorites App', () => {
  const username = `e2euser${Math.floor(Math.random() * 1000)}`;
  const password = `e2epass${Math.floor(Math.random() * 1000)}`;
  const user = { username, password };

  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('should allow a new user to register and login', () => {
    cy.contains('Create Account').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#register').click();
    cy.contains('Registration successful! You can now log in.').should('exist');
    cy.wait(2000);
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains(`Hi, ${user.username}`).should('exist');
    cy.contains('Favorites').should('exist');
  });

  it('should show books and allow adding to favorites', () => {
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.contains('Books').click();
    cy.contains('h2', 'Books').should('exist');
    cy.get('button').contains('Add to Favorites').first().click();
    cy.get('a#favorites-link').click();
    cy.get('h2').contains('My Favorite Books').should('exist');
  });

  it('should allow clearing all favorites with confirmation', () => {
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();

    cy.contains('Books').click();
    cy.contains('button', 'Add to Favorites').first().click();
    cy.get('a#favorites-link').click();

    cy.contains('button', 'Clear All').click();
    cy.contains('Are you sure you want to clear all favorite books?').should('exist');
    cy.contains('button', 'Yes, clear all').click();

    cy.contains('No favorite books yet.').should('exist');
  });

  it('should logout and protect routes', () => {
    cy.contains('Login').click();
    cy.get('input[name="username"]').type(user.username);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button#login').click();
    cy.get('button#logout').click();
    cy.contains('Login').should('exist');
    cy.visit('http://localhost:5173/books');
    cy.url().should('eq', 'http://localhost:5173/');
  });
});
